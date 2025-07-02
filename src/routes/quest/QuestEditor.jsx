import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './QuestEditor.css'; // Make sure this CSS file exists or remove the import if not needed

function QuestEditor() {
  const { questId } = useParams();
  const navigate = useNavigate();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableCases, setAvailableCases] = useState([]); // Cases not yet in the quest, from 'my cases'
  const [questCases, setQuestCases] = useState([]); // Cases currently associated with THIS quest
  const [error, setError] = useState(null);
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);

  const fetchQuestAndCases = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    const personFromStorage = JSON.parse(localStorage.getItem('person')); // Get user info for redirection

    if (!token || !personFromStorage) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }

    try {
      // 1. Fetch Quest details
      const questRes = await axios.get( // AWAIT this call
        `${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setQuest(questRes.data); // Assuming response.data is the quest object directly

      // 2. Fetch cases specifically for THIS quest
      const questCasesRes = await axios.get( // AWAIT this call
        `${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      const currentQuestCasesData = questCasesRes.data || []; // Get the data here
      setQuestCases(currentQuestCasesData);

      // 3. Fetch all cases owned by the user (or available to add)
      const myCasesRes = await axios.get( // AWAIT this call
        `${import.meta.env.VITE_SERVER_URL}/api/cases/my/`, // Assuming this endpoint exists
        { headers: { Authorization: `Token ${token}` } }
      );

      // Filter out cases that are already in the quest from 'my cases'
      // Use currentQuestCasesData directly from the awaited response
      const casesInQuestIds = new Set(currentQuestCasesData.map(c => c.id));
      const filteredAvailableCases = myCasesRes.data.filter(c => !casesInQuestIds.has(c.id));
      setAvailableCases(filteredAvailableCases);

    } catch (err) {
      console.error('Error fetching data in QuestEditor:', err.response?.data || err.message || err);
      setError(err.response?.data?.error || 'Failed to load quest or cases. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestAndCases();
  }, [questId, navigate]); // Depend on questId and navigate to re-run fetch when they change

  const handleRemoveCase = async (caseId) => {
    const token = localStorage.getItem('token'); // Get token for individual actions
    if (!token) {
        alert('Authentication token not found. Please log in.');
        navigate('/login');
        return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/remove/`,
        { case_id: caseId },
        { headers: { Authorization: `Token ${token}` } }
      );
      alert('Case removed successfully!');
      fetchQuestAndCases(); // Re-fetch all data to ensure consistency
    } catch (err) {
      console.error('Error removing case:', err.response?.data || err);
      alert(err.response?.data?.error || 'Failed to remove case.');
    }
  };

  const handleAddCase = async (caseId) => {
    const token = localStorage.getItem('token'); // Get token for individual actions
    if (!token) {
        alert('Authentication token not found. Please log in.');
        navigate('/login');
        return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/add/`,
        { case_id: caseId },
        { headers: { Authorization: `Token ${token}` } }
      );
      alert('Case added successfully!');
      setShowAddCaseModal(false); // Close the modal after adding
      fetchQuestAndCases(); // Re-fetch all data to ensure consistency
    } catch (err) {
      console.error('Error adding case:', err.response?.data || err);
      alert(err.response?.data?.error || 'Failed to add case.');
    }
  };

  if (loading) return <div className="loading-container">Loading quest editor...</div>;
  if (error) return <div className="error-container">{error}</div>;
  // This check should come after loading and error, and only if quest is still null
  if (!quest && !loading) return <div className="error-container">Quest not found or could not be loaded.</div>;


  return (
    <div className="quest-editor-container">
      <h2>Editing Quest: {quest.name}</h2>
      <p>{quest.description}</p>

      <div className="cases-management">
        <div className="quest-cases-list">
          <h3>Cases in this Quest ({questCases.length})</h3>
          {questCases.length === 0 ? (
            <p>No cases in this quest yet.</p>
          ) : (
            <div className="case-grid">
              {questCases.map(c => (
                <div key={c.id} className="case-card">
                  <h4>{c.name}</h4>
                  <button
                    onClick={() => handleRemoveCase(c.id)}
                    className="remove-case-button"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* "+" button to add new cases */}
          <button
            onClick={() => setShowAddCaseModal(true)}
            className="add-case-button-main"
          >
            + Add Case
          </button>
        </div>
      </div>

      {/* Pop-up to add new cases */}
      {showAddCaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Select Case to Add</h3>
            {availableCases.length === 0 ? (
              <p>No other cases available to add.</p>
            ) : (
              <ul className="available-cases-modal-list">
                {availableCases.map(c => (
                  <li key={c.id} onClick={() => handleAddCase(c.id)}>
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowAddCaseModal(false)} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/quests')} className="back-button">
        ← Back to Quests
      </button>
    </div>
  );
}

export default QuestEditor;