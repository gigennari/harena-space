import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyCases.css';

// Define the base API URL from environment variables
const API_URL = import.meta.env.VITE_SERVER_URL;

const COMPLEXITY_CHOICES = [
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'postgraduate', label: 'Postgraduate' },
];

function MyCases() {
    const [publishedCases, setPublishedCases] = useState([]); // State for published cases
    const [draftCases, setDraftCases] = useState([]); // State for draft cases
    const [editableQuests, setEditableQuests] = useState([]); // Quests the user can edit
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [editingCaseId, setEditingCaseId] = useState(null); // State to track which case is being edited
    const [editedCaseData, setEditedCaseData] = useState({}); // State to hold edited case data
    const [showQuestSelection, setShowQuestSelection] = useState(null); // State to show quest selection for a specific case
    const [selectedQuestsForDraft, setSelectedQuestsForDraft] = useState({}); // To manage selected quests for draft cases

    const navigate = useNavigate(); // Navigation hook

    // Get the authentication token from localStorage
    const token = localStorage.getItem('token');
    // Get the logged-in user data from localStorage
    const user = JSON.parse(localStorage.getItem('person'));

    // --- DEBUG LOGS ---
    console.log("User from localStorage:", user);
    if (user) {
        console.log("User ID from localStorage:", user.user?.id);
    }
    // --- END DEBUG LOGS ---

    // Effect to load data when the component mounts
    useEffect(() => {
        if (!token) {
            navigate('/login'); // Redirect to login if no token
            return;
        }
        fetchCasesAndQuests(); // Call function to fetch data
    }, [token, navigate]);

    // Asynchronous function to fetch user cases and editable quests
    const fetchCasesAndQuests = async () => {
        setLoading(true); // Start loading
        try {
            // Request to get user cases
            const casesResponse = await axios.get(`${API_URL}/api/cases/mycases/`, {
                headers: {
                    Authorization: `Token ${token}`
                }
            });
            const allCases = casesResponse.data; // All user cases
            console.log("All Cases fetched from API:", allCases); // DEBUG LOG

            // Request to get quests the user can edit
            const questsResponse = await axios.get(`${API_URL}/api/quests/editable/`, {
                headers: {
                    Authorization: `Token ${token}`
                }
            });
            setEditableQuests(questsResponse.data); // Set editable quests
            console.log("Editable Quests fetched from API:", questsResponse.data); // DEBUG LOG

            // Separate cases into published and draft
            const published = allCases.filter(c => c.quests && c.quests.length > 0);
            const draft = allCases.filter(c => !c.quests || c.quests.length === 0);

            setPublishedCases(published); // Set published cases
            setDraftCases(draft); // Set draft cases

        } catch (err) {
            console.error('Error fetching cases or quests:', err);
            setError('Failed to load your cases or quests. Please try again.'); // Set the error message
        } finally {
            setLoading(false); // End loading
        }
    };

    // Function to handle starting edit mode for a case
    const handleEditClick = (caseItem) => {
        setEditingCaseId(caseItem.id);
        // Copy ALL current case data to the edited data state
        // Specific handling for possible_answers: parse if it's a JSON string, otherwise initialize as an array of objects with only 'text'
        let parsedPossibleAnswers = [];
        if (caseItem.possible_answers) {
            try {
                let rawOptions = caseItem.possible_answers;
                // If it's a string, parse it first
                if (typeof rawOptions === 'string') {
                    rawOptions = JSON.parse(rawOptions);
                }
                
                if (Array.isArray(rawOptions)) {
                    // Convert array of strings or array of {text: "..."} to [{text: "..."}] for internal state
                    parsedPossibleAnswers = rawOptions.map(opt => {
                        if (typeof opt === 'string') {
                            return { text: opt };
                        } else if (typeof opt === 'object' && opt !== null && 'text' in opt) {
                            return { text: opt.text };
                        }
                        return { text: '' }; // Fallback for unexpected format
                    });
                } else {
                    console.warn("possible_answers is not an array or stringified array, initializing as empty.");
                    parsedPossibleAnswers = []; // Initialize as empty array if unexpected format
                }
            } catch (e) {
                console.error("Error parsing possible_answers JSON:", e);
                parsedPossibleAnswers = []; // Fallback to empty array on error
            }
        } else {
            parsedPossibleAnswers = []; // Initialize as empty array if no data
        }

        // If after parsing/initialization, the array is empty, add one empty option to start
        if (parsedPossibleAnswers.length === 0) {
            parsedPossibleAnswers.push({ text: '' });
        }
        console.log("DEBUG: possible_answers from caseItem on edit click (raw):", caseItem.possible_answers);
        console.log("DEBUG: parsedPossibleAnswers for editing (internal state):", parsedPossibleAnswers);

        setEditedCaseData({ 
            ...caseItem,
            possible_answers: parsedPossibleAnswers, 
            specialty: caseItem.specialty || '',
            complexity: caseItem.complexity || '',
            complexity_choices: caseItem.complexity_choices || [],
            image: caseItem.image || '',
        }); 
    };

    // Function to handle input changes in edit mode (for simple fields)
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditedCaseData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Functions to manage dynamic Possible Answers (only text)
    const handleOptionTextChange = (index, value) => {
        setEditedCaseData(prevData => {
            const currentOptions = Array.isArray(prevData.possible_answers) ? [...prevData.possible_answers] : [];
            currentOptions[index] = { text: value };
            return { ...prevData, possible_answers: currentOptions };
        });
    };

    const handleAddOption = () => {
         setEditedCaseData(prevData => {
            const currentOptions = Array.isArray(prevData.possible_answers) ? [...prevData.possible_answers] : [];
            return {
                ...prevData,
                possible_answers: [...currentOptions, { text: '' }] // Always add a new empty object
            };
        });
    };

    const handleRemoveOption = (indexToRemove) => {
        setEditedCaseData(prevData => {
            // Ensure prevData.possible_answers is an array before filtering
            const currentOptions = Array.isArray(prevData.possible_answers) ? [...prevData.possible_answers] : [];
            const newOptions = currentOptions.filter((_, index) => index !== indexToRemove);
            console.log("DEBUG: possible_answers after removal (internal state):", newOptions); // NEW DEBUG LOG
            return {
                ...prevData,
                possible_answers: newOptions
            };
        });
    };
    
    const handleCancelEdit = () => {
        setEditingCaseId(null);
        setEditedCaseData({});
    };

    // Function to save edited case data
    const handleSaveEdit = async (caseId) => {
        try {
            const dataToSend = { ...editedCaseData };

            const formData = new FormData();

            formData.append("name", dataToSend.name || "");
            formData.append("description", dataToSend.description || "");
            formData.append("content", dataToSend.content || "");
            formData.append("answer", dataToSend.answer || "");
            formData.append("specialty", dataToSend.specialty || "");
            formData.append("complexity", dataToSend.complexity || "");

            // Adiciona imagem se foi alterada
            if (dataToSend.image instanceof File) {
            formData.append("image", dataToSend.image);
            }

            // Serializa possible_answers
            if (dataToSend.possible_answers && Array.isArray(dataToSend.possible_answers)) {
                const filteredOptions = dataToSend.possible_answers.filter(option => option.text.trim() !== '');
                const stringArray = filteredOptions.map(option => option.text);
                // Anexar a string JSON de possible_answers ao FormData
                formData.append("possible_answers", JSON.stringify(stringArray)); // <--- CORREÇÃO AQUI
            } else {
                formData.append("possible_answers", '[]'); // Anexar array JSON vazio se não houver opções
            }

            console.log("DEBUG: DataToSend.possible_answers *ANTES* do PATCH (stringified):", dataToSend.possible_answers);
            console.log("DEBUG: DataToSend *COMPLETO* *ANTES* do PATCH:", dataToSend);

            await axios.patch(`${API_URL}/api/cases/${caseId}/`, formData, {
            headers: {
                Authorization: `Token ${token}`
            }
            });

            setEditingCaseId(null);
            setEditedCaseData({});
            fetchCasesAndQuests();
        } catch (err) {
            console.error("Error saving the case:", err);
            setError("Failed to save case. Please try again.");
        }
    };

    // Function to handle deleting a case
    const handleDeleteCase = async (caseId) => {
        if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
            try {
                await axios.delete(`${API_URL}/api/cases/${caseId}/`, {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
                fetchCasesAndQuests(); // Re-fetch cases to update the list
            } catch (err) {
                console.error('Error deleting case:', err);
                setError('Failed to delete case. Please try again.');
            }
        }
    };

    // Function to handle quest checkbox selection change for PUBLISHED cases
    const handleQuestCheckboxChange = async (caseId, questId, isChecked) => {
        try {
            if (isChecked) {
                // Add the case to the quest
                await axios.post(`${API_URL}/api/quests/${questId}/cases/add/`, {
                    case_id: caseId
                }, {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
            } else {
                // Remove the case from the quest
                await axios.delete(`${API_URL}/api/quests/${questId}/cases/${caseId}/remove/`, {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
            }
            // Update data after change
            fetchCasesAndQuests();
        } catch (err) {
            console.error('Error updating QuestCase:', err);
            setError('Failed to update the case association with the quest.');
        }
    };

    // Function to show/hide quest selection modal for draft AND PUBLISHED cases
    const handleAddQuestClick = (caseId) => {
        setShowQuestSelection(caseId);
        // Initialize selected quests for this case.
        // For published cases, pre-select already associated quests.
        const currentCase = [...publishedCases, ...draftCases].find(c => c.id === caseId);
        const initialSelected = new Set(currentCase?.quests?.map(q => q.id) || []);
        setSelectedQuestsForDraft(prev => ({ ...prev, [caseId]: initialSelected }));
    };

    // Function to handle checkbox change within the quest selection modal
    const handleDraftQuestSelectionChange = (caseId, questId, isChecked) => {
        setSelectedQuestsForDraft(prev => {
            const newSet = new Set(prev[caseId]);
            if (isChecked) {
                newSet.add(questId);
            } else {
                newSet.delete(questId);
            }
            return { ...prev, [caseId]: newSet };
        });
    };

    // Function to publish a case to selected quests (now serves for drafts and published)
    const handlePublishDraftCase = async (caseId) => {
        const selectedQuestIds = Array.from(selectedQuestsForDraft[caseId] || []);
        
        // Get quests currently associated with the case
        const currentCase = [...publishedCases, ...draftCases].find(c => c.id === caseId);
        const currentlyAssociatedQuestIds = new Set(currentCase?.quests?.map(q => q.id) || []);

        // Identify quests to add
        const questsToAdd = selectedQuestIds.filter(id => !currentlyAssociatedQuestIds.has(id));
        // Identify quests to remove
        const questsToRemove = Array.from(currentlyAssociatedQuestIds).filter(id => !selectedQuestIds.includes(id));

        try {
            // Add new associations
            for (const questId of questsToAdd) {
                await axios.post(`${API_URL}/api/quests/${questId}/cases/add/`, {
                    case_id: caseId
                }, {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
            }

            // Remove existing associations
            for (const questId of questsToRemove) {
                await axios.delete(`${API_URL}/api/quests/${questId}/cases/${caseId}/remove/`, {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
            }

            setShowQuestSelection(null); // Close modal
            setSelectedQuestsForDraft({}); // Clear selections
            fetchCasesAndQuests(); // Re-fetch cases to update sections
        } catch (err) {
            console.error('Error updating quest associations:', err);
            setError('Failed to update case associations with quest(s).');
        }
    };

    // Render the component
    return (
        <div className="my-cases-container">
            <h1 className="my-cases-title">My Cases</h1>

            {loading && <p className="loading-message">Loading cases...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && (
                <>
                    {/* Published Cases Section */}
                    <section className="cases-section published-cases-section">
                        <h2 className="section-title">Published Cases</h2>
                        {publishedCases.length === 0 ? (
                            <p className="no-cases-message">No cases published yet.</p>
                        ) : (
                            <div className="cases-grid">
                                {publishedCases.map(caseItem => (
                                    <div key={caseItem.id} className="case-card">
                                        <div className="case-header">
                                            <h3>{caseItem.name}</h3>
                                            <div className="case-actions">
                                                {editingCaseId === caseItem.id ? (
                                                    <>
                                                        <button onClick={() => handleSaveEdit(caseItem.id)} className="action-button save-button">
                                                            💾 {/* Save icon */}
                                                        </button>
                                                        <button onClick={handleCancelEdit} className="action-button cancel-button">
                                                            ❌ {/* Cancel icon */}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEditClick(caseItem)} className="action-button edit-button">
                                                            ✏️ {/* Edit icon */}
                                                        </button>
                                                        {/* Trash can button to delete the case */}
                                                        <button onClick={() => handleDeleteCase(caseItem.id)} className="action-button delete-button">
                                                            🗑️ {/* Trash icon */}
                                                        </button>
                                                        {/* Plus button to add to quests (now also for published) */}
                                                        {editableQuests.length > 0 && (
                                                            <button onClick={() => handleAddQuestClick(caseItem.id)} className="action-button add-quest-button">
                                                                ➕ {/* Plus icon */}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Conditional rendering for the edit form or case details */}
                                        {editingCaseId === caseItem.id ? (
                                            <div className="edit-form">
                                                <label>Name:</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editedCaseData.name || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Description:</label>
                                                <textarea
                                                    name="description"
                                                    value={editedCaseData.description || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Content:</label>
                                                <textarea
                                                    name="content"
                                                    value={editedCaseData.content || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Answer:</label>
                                                <textarea
                                                    name="answer"
                                                    value={editedCaseData.answer || ''}
                                                    onChange={handleEditChange}
                                                />
                                                
                                                {/* DYNAMIC Possible Answers FIELD - NO 'CORRECT' CHECKBOX */}
                                                <div className="answer-options-section">
                                                    <label>Possible Answers:</label>
                                                    {editedCaseData.possible_answers && editedCaseData.possible_answers.map((option, index) => (
                                                        <div key={index} className="answer-option-item">
                                                            <input
                                                                type="text"
                                                                value={option.text || ''}
                                                                onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                                                placeholder={`Option ${index + 1}`}
                                                            />
                                                            {editedCaseData.possible_answers.length > 1 && (
                                                                <button type="button" onClick={() => handleRemoveOption(index)} className="remove-option-button">
                                                                    ➖
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={handleAddOption} className="add-option-button">
                                                        ➕ Add Option
                                                    </button>
                                                </div>

                                                <label>Specialty:</label>
                                                <input
                                                    type="text"
                                                    name="specialty"
                                                    value={editedCaseData.specialty || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Complexity:</label>
                                                    <select
                                                        name="complexity"
                                                        value={editedCaseData.complexity || ''}
                                                        onChange={handleEditChange}
                                                    >
                                                        <option value="">Select Complexity</option>
                                                        {COMPLEXITY_CHOICES.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                <label>Image:</label>
                                                    <input
                                                    type="file"
                                                    name="image"
                                                    onChange={(e) =>
                                                        setEditedCaseData(prev => ({
                                                        ...prev,
                                                        image: e.target.files[0]
                                                        }))
                                                    }
                                                    />
                                            </div>
                                        ) : (
                                            <>
                                                <p><strong>Description:</strong> {caseItem.description}</p>
                                                <p><strong>Content:</strong> {caseItem.content}</p>
                                                <p><strong>Answer:</strong> {caseItem.answer}</p>
                                                {caseItem.possible_answers && caseItem.possible_answers.length > 0 && (
                                                    <div>
                                                        <strong>Possible Answers:</strong>
                                                        <ul>
                                                            {caseItem.possible_answers.map((option, index) => (
                                                                <li key={index}>
                                                                    {/* Display based on expected format: if object, show text; if string, show string */}
                                                                    {typeof option === 'object' && option !== null && 'text' in option ? option.text : option}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {caseItem.specialty && (
                                                    <p><strong>Specialty:</strong> {caseItem.specialty}</p>
                                                )}
                                                {caseItem.complexity && (
                                                    <p><strong>Complexity:</strong> {COMPLEXITY_CHOICES.find(c => c.value === caseItem.complexity)?.label || caseItem.complexity}</p>
                                                )}
                                                {caseItem.image && (
                                                    <div>
                                                        <strong>Image:</strong> <img src={caseItem.image} alt="Case" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px', marginTop: '5px' }} />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="case-quests">
                                            <h4>Present in Quests:</h4>
                                            {caseItem.quests.length > 0 ? (
                                                <ul>
                                                    {caseItem.quests.map(quest => (
                                                        <li key={quest.id}>
                                                            {quest.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>No associated quests.</p>
                                            )}
                                            {/* Quest selection modal for published cases */}
                                            {showQuestSelection === caseItem.id && editableQuests.length > 0 && (
                                                <div className="quest-selection-modal">
                                                    <h4>Select Quests to Publish:</h4>
                                                    {editableQuests.map(quest => (
                                                        <div key={quest.id} className="quest-checkbox-item">
                                                            <input
                                                                type="checkbox"
                                                                id={`publish-${caseItem.id}-quest-${quest.id}`}
                                                                checked={selectedQuestsForDraft[caseItem.id]?.has(quest.id) || false}
                                                                onChange={(e) => handleDraftQuestSelectionChange(caseItem.id, quest.id, e.target.checked)}
                                                            />
                                                            <label htmlFor={`publish-${caseItem.id}-quest-${quest.id}`}>{quest.name}</label>
                                                        </div>
                                                    ))}
                                                    <div className="modal-actions">
                                                        <button onClick={() => handlePublishDraftCase(caseItem.id)} className="publish-button">
                                                            Update Quests
                                                        </button>
                                                        <button onClick={() => setShowQuestSelection(null)} className="cancel-button">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Message if there are no editable quests for the case owner */}
                                            {editableQuests.length === 0 && (
                                                <p className="no-editable-quests-message">You do not have quests with editing permission to publish this case.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Draft Cases Section */}
                    <section className="cases-section draft-cases-section">
                        <h2 className="section-title">Draft Cases</h2>
                        {draftCases.length === 0 ? (
                            <p className="no-cases-message">No draft cases yet.</p>
                        ) : (
                            <div className="cases-grid">
                                {draftCases.map(caseItem => (
                                    <div key={caseItem.id} className="case-card">
                                        <div className="case-header">
                                            <h3>{caseItem.name}</h3>
                                            <div className="case-actions">
                                                {editingCaseId === caseItem.id ? (
                                                    <>
                                                        <button onClick={() => handleSaveEdit(caseItem.id)} className="action-button save-button">
                                                            💾 {/* Save icon */}
                                                        </button>
                                                        <button onClick={handleCancelEdit} className="action-button cancel-button">
                                                            ❌ {/* Cancel icon */}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEditClick(caseItem)} className="action-button edit-button">
                                                            ✏️ {/* Edit icon */}
                                                        </button>
                                                        {/* Trash can button to delete the case */}
                                                        <button onClick={() => handleDeleteCase(caseItem.id)} className="action-button delete-button">
                                                            🗑️ {/* Trash icon */}
                                                        </button>
                                                        {/* Plus button to add to quests (only if editable quests exist) */}
                                                        {editableQuests.length > 0 && (
                                                            <button onClick={() => handleAddQuestClick(caseItem.id)} className="action-button add-quest-button">
                                                                ➕ {/* Plus icon */}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Conditional rendering for the edit form or case details */}
                                        {editingCaseId === caseItem.id ? (
                                            <div className="edit-form">
                                                <label>Name:</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editedCaseData.name || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Description:</label>
                                                <textarea
                                                    name="description"
                                                    value={editedCaseData.description || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Content:</label>
                                                <textarea
                                                    name="content"
                                                    value={editedCaseData.content || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Answer:</label>
                                                <textarea
                                                    name="answer"
                                                    value={editedCaseData.answer || ''}
                                                    onChange={handleEditChange}
                                                />
                                                
                                                {/* DYNAMIC Possible Answers FIELD - NO 'CORRECT' CHECKBOX */}
                                                <div className="answer-options-section">
                                                    <label>Possible Answers:</label>
                                                    {editedCaseData.possible_answers && editedCaseData.possible_answers.map((option, index) => (
                                                        <div key={index} className="answer-option-item">
                                                            <input
                                                                type="text"
                                                                value={option.text || ''}
                                                                onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                                                placeholder={`Option ${index + 1}`}
                                                            />
                                                            {editedCaseData.possible_answers.length > 1 && (
                                                                <button type="button" onClick={() => handleRemoveOption(index)} className="remove-option-button">
                                                                    ➖
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={handleAddOption} className="add-option-button">
                                                        ➕ Add Option
                                                    </button>
                                                </div>

                                                <label>Specialty:</label>
                                                <input
                                                    type="text"
                                                    name="specialty"
                                                    value={editedCaseData.specialty || ''}
                                                    onChange={handleEditChange}
                                                />
                                                <label>Complexity:</label>
                                                    <select
                                                    name="complexity"
                                                    value={editedCaseData.complexity || ''}
                                                    onChange={handleEditChange}
                                                >
                                                    <option value="" disabled selected>Select Complexity</option> {/* Placeholder option */}
                                                    {COMPLEXITY_CHOICES.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <label>Image:</label>
                                                    <input
                                                    type="file"
                                                    name="image"
                                                    onChange={(e) =>
                                                        setEditedCaseData(prev => ({
                                                        ...prev,
                                                        image: e.target.files[0]
                                                        }))
                                                    }
                                                    />
                                            </div>
                                        ) : (
                                            <>
                                                <p><strong>Description:</strong> {caseItem.description}</p>
                                                <p><strong>Content:</strong> {caseItem.content}</p>
                                                <p><strong>Answer:</strong> {caseItem.answer}</p>
                                                {caseItem.possible_answers && caseItem.possible_answers.length > 0 && (
                                                    <div>
                                                        <strong>Possible Answers:</strong>
                                                        <ul>
                                                            {caseItem.possible_answers.map((option, index) => (
                                                                <li key={index}>
                                                                    {/* Display based on expected format: if object, show text; if string, show string */}
                                                                    {typeof option === 'object' && option !== null && 'text' in option ? option.text : option}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {caseItem.specialty && (
                                                    <p><strong>Specialty:</strong> {caseItem.specialty}</p>
                                                )}
                                                {caseItem.complexity && (
                                                    <p><strong>Complexity:</strong> {COMPLEXITY_CHOICES.find(c => c.value === caseItem.complexity)?.label || caseItem.complexity}</p>
                                                )}
                                                {caseItem.image && (
                                                    <div>
                                                        <strong>Image:</strong> <img src={caseItem.image} alt="Case" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px', marginTop: '5px' }} />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="case-quests">
                                            <h4>Present in Quests:</h4>
                                            {caseItem.quests.length > 0 ? (
                                                <ul>
                                                    {caseItem.quests.map(quest => (
                                                        <li key={quest.id}>
                                                            {quest.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>No associated quests.</p>
                                            )}
                                            {/* Quest selection modal for draft cases */}
                                            {showQuestSelection === caseItem.id && editableQuests.length > 0 && (
                                                <div className="quest-selection-modal">
                                                    <h4>Select Quests to Publish:</h4>
                                                    {editableQuests.map(quest => (
                                                        <div key={quest.id} className="quest-checkbox-item">
                                                            <input
                                                                type="checkbox"
                                                                id={`draft-publish-${caseItem.id}-quest-${quest.id}`}
                                                                checked={selectedQuestsForDraft[caseItem.id]?.has(quest.id) || false}
                                                                onChange={(e) => handleDraftQuestSelectionChange(caseItem.id, quest.id, e.target.checked)}
                                                            />
                                                            <label htmlFor={`draft-publish-${caseItem.id}-quest-${quest.id}`}>{quest.name}</label>
                                                        </div>
                                                    ))}
                                                    <div className="modal-actions">
                                                        <button onClick={() => handlePublishDraftCase(caseItem.id)} className="publish-button">
                                                            Publish Selected
                                                        </button>
                                                        <button onClick={() => setShowQuestSelection(null)} className="cancel-button">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Message if there are no editable quests for the case owner */}
                                            {editableQuests.length === 0 && (
                                                <p className="no-editable-quests-message">You do not have quests with editing permission to publish this case.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default MyCases;
