import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import './QuestCases.css'

function QuestCases() {
  const { questId } = useParams()
  const navigate = useNavigate()

  const [cases, setCases] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputAnswer, setInputAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      setCases(response.data)
    })
    .catch(error => {
      console.error('Error fetching cases:', error)
    })
  }, [questId])

  if (cases.length === 0) {
    return <p>Loading cases...</p>
  }

  const currentCase = cases[currentIndex]

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
      <h2>Case {currentIndex + 1}</h2>
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
              <button onClick={handleFinish}>Finish</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestCases