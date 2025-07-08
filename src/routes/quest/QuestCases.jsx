import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import './QuestCases.css'

function QuestCases() {
  const { questId } = useParams()
  const navigate = useNavigate()

  const [quest, setQuest] = useState(null);
  const [cases, setCases] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputAnswer, setInputAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [userPerson, setUserPerson] = useState(null)
  const [hasSubmitted, setHasSubmitted] = useState(false); // State to track if an answer has been submitted for the current case

  useEffect(() => {
    const token = localStorage.getItem('token');
    const personFromStorage = JSON.parse(localStorage.getItem('person'));
    if (!personFromStorage || !token) {
        navigate('/login');
        return;
    }
    setUserPerson(personFromStorage);

    // Fetch the quest details
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setQuest(response.data);
      })
      .catch((error) => {
        console.error("Error fetching quest details:", error);
      });

    // Fetch cases for the quest
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setCases(response.data);
      })
      .catch((error) => {
        console.error("Error fetching quest cases:", error);
      });

  }, [questId, navigate]);


  const canEditQuest = quest && userPerson && (
    ( quest.owner === userPerson.user.id) || userPerson.groups?.includes(`editors_${quest.id}`)
  );

  const canInvite = quest && userPerson && (
    ( quest.owner === userPerson.user.id) || userPerson.groups?.includes(`editors_${quest.id}`)
  );

  if (!quest) {
    return <p>Loading quest...</p>;
  }
  if (cases.length === 0 && !finished) {
    return <p>No cases found for this quest.</p>;
  }

  const currentCase = cases[currentIndex];

  const handleSubmit = () => {
    const normalizedInput = inputAnswer.trim().toLowerCase()
    const normalizedAnswer = currentCase.answer.trim().toLowerCase()
    const possibleAnswers = currentCase.possible_answers.map(a => a.trim().toLowerCase())

    if (normalizedInput === normalizedAnswer || possibleAnswers.includes(normalizedInput)) {
      setFeedback('✅ Correct!')
      setScore(prev => prev + 1)
    } else {
      setFeedback(`❌ Incorrect. Correct answer: ${currentCase.answer}`)
    }
    setHasSubmitted(true); // Mark that an answer has been submitted for this case
  }

  const handleNext = () => {
    setInputAnswer('')
    setFeedback('')
    setHasSubmitted(false); // Reset for the new case
    if (currentIndex + 1 < cases.length) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // This else block is reached when it's the last case and "Next" would complete the quest.
      // We explicitly call handleFinish here if it's the last case.
      handleFinish(); // This will transition to the finished state
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setInputAnswer('')
      setFeedback('')
      setHasSubmitted(false); // Reset for the new case
    }
  }

  const handleFinish = () => {
    setFinished(true);
    // When finishing the quest, ensure the 'hasSubmitted' state is no longer relevant for a *new* case.
    // While the component will unmount/re-render, explicitly clearing it is good practice.
    setHasSubmitted(false);
  }

  // This block is for when the quest is completely finished, a separate view
  if (finished) {
    return (
      <div className="case-container">
        <h2 className="finish">✅ Quest Completed!</h2>
        <p>Your score: {score} / {cases.length}</p>
        <button className="always-blue-button" onClick={() => navigate('/quests')}>Go back to Quests</button>
      </div>
    )
  }

  return (
    <div className="case-container">
      <div className="quest-header">
          <h2>{quest.name}</h2>
          {canEditQuest && (
              <button
                onClick={() => navigate(`/quests/${questId}/edit`)}
                className="edit-quest-button always-blue-button" // Add always-blue-button class
              >
                ⚙️ Edit Quest
              </button>
          )}
          {canInvite && (
                  <button
                    onClick={() => navigate(`/quests/${questId}/invite`)}
                    className="edit-quest-button always-blue-button"
                  >
                    Invite to Quest
                  </button>
            )}
            {canInvite && ( // Only show if user can manage quest
                  <button
                    onClick={() => navigate(`/quests/${questId}/invitations`)} 
                    className="always-blue-button"
                  >
                    See Quest Invitations
                  </button>
            )}
      </div>

      {/* This block handles the display of individual cases */}
      <h3>Case {currentIndex + 1}</h3>
      <p>{currentCase.content}</p>

      {currentCase.image && (
          <img src={currentCase.image} alt="Case" className="case-image" />
      )}

      <input
          type="text"
          placeholder="Type your answer..."
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          disabled={hasSubmitted} // Disable input after submission
      />

      {/* Apply 'submit-button-active' class when inputAnswer is not empty */}
      <button
          onClick={handleSubmit}
          disabled={hasSubmitted || inputAnswer.trim() === ''}
          className={inputAnswer.trim() !== '' ? 'submit-button-active' : ''} // Add class conditionally
      >
        Submit
      </button>

      {/* Show feedback and navigation buttons only after submission */}
      {feedback !== '' && (
          <div>
              <p className={feedback.includes('Correct') ? 'correct' : 'incorrect'}>
                {feedback}
              </p>
              <div className="nav-buttons">
                  {currentIndex > 0 && (
                      <button onClick={handlePrevious} className="always-blue-button">Previous</button> 
                  )}
                  
                  {currentIndex < cases.length - 1 ? (
                      <button onClick={handleNext} className="always-blue-button">Next</button> 
                  ) : (
                      <button onClick={handleFinish} className="always-blue-button">Finish Quest</button> 
                  )}
              </div>
          </div>
      )}
    </div>
  );
}

export default QuestCases;