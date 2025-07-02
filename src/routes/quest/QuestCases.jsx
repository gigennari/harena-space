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
      .get(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/`, { // This endpoint might not exist as per urls.py
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        // Assuming the response for the quest details includes the quest object
        
        setQuest(response.data); // Adjust this based on what your API actually returns for a single quest
      })
      .catch((error) => {
        console.error("Error fetching quest details:", error);
        // Handle error, e.g., navigate to a 404 page or show an error message
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
  }

  const handleNext = () => {
    setInputAnswer('')
    setFeedback('')
    if (currentIndex + 1 < cases.length) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setFinished(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setInputAnswer('')
      setFeedback('')
    }
  }

  const handleFinish = () => {
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="case-container">
        <h2>✅ Quest Completed!</h2>
        <p>Your score: {score} / {cases.length}</p>
        <button onClick={() => navigate('/quests')}>Go back to Quests</button>
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
                
                className="edit-quest-button"
              >
                  ⚙️ Edit Quest
              </button>
          )}
      </div>

      {finished ? (
        <div className="quest-finished">
          <h2>✅ Quest Completed!</h2>
          <p>Your final score: {score}</p>
          <button onClick={() => navigate('/quests')}>Back to Quests</button>
        </div>
      ) : (
        <>
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
                disabled={feedback !== ''}
            />

            {feedback === '' ? (
                <button onClick={handleSubmit}>Submit</button>
            ) : (
                <div>
                    <p>{feedback}</p>
                    <div className="nav-buttons">
                        {currentIndex > 0 && (
                            <button onClick={handlePrevious}>Previous</button>
                        )}
                        {currentIndex < cases.length - 1 && (
                            <button onClick={handleNext}>Next</button>
                        )}
                        {currentIndex === cases.length - 1 && (
                            <button onClick={handleFinish}>Finish Quest</button>
                        )}
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
}

export default QuestCases;