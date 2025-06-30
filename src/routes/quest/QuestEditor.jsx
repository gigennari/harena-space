import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import './QuestEditor.css'

function QuestEditor() {
  const { questId } = useParams()
  const navigate = useNavigate()
  const [quest, setQuest] = useState(null)
  const [cases, setCases] = useState([])
  const [availableCases, setAvailableCases] = useState([])
  const [error, setError] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    async function fetchData() {
      try {
        const questRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/`, {
          headers: { Authorization: `Token ${token}` }
        })
        setQuest(questRes.data)

        const caseRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/`, {
          headers: { Authorization: `Token ${token}` }
        })
        setCases(caseRes.data)

        const allCasesRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/cases/`, {
          headers: { Authorization: `Token ${token}` }
        })
        setAvailableCases(allCasesRes.data)
      } catch (err) {
        console.error(err)
        setError("Erro ao carregar dados da quest ou casos.")
      }
    }

    fetchData()
  }, [questId])

  const handleAddCase = async (caseId) => {
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/add/`, {
        case_id: caseId
      }, {
        headers: { Authorization: `Token ${token}` }
      })
      setCases(prev => [...prev, availableCases.find(c => c.id === caseId)])
    } catch (err) {
      console.error(err)
      setError("Erro ao adicionar caso.")
    }
  }

  const handleRemoveCase = async (caseId) => {
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/cases/${caseId}/remove/`, {}, {
        headers: { Authorization: `Token ${token}` }
      })
      setCases(prev => prev.filter(c => c.id !== caseId))
    } catch (err) {
      console.error(err)
      setError("Erro ao remover caso.")
    }
  }

  return (
    <div className="case-container">
      <h2>Edição da Quest</h2>
      {quest && <h3>{quest.name}</h3>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h4>Casos atuais da quest:</h4>
      {cases.length === 0 ? <p>Nenhum caso ainda.</p> : cases.map((c, idx) => (
        <div key={c.id} className="case-tile">
          <p><strong>{idx + 1}. {c.name}</strong></p>
          <button onClick={() => handleRemoveCase(c.id)}>Remover</button>
        </div>
      ))}

      <hr />
      <h4>Adicionar novo caso à quest:</h4>
      {availableCases.filter(c => !cases.find(existing => existing.id === c.id)).map(c => (
        <div key={c.id} className="case-tile">
          <p>{c.name}</p>
          <button onClick={() => handleAddCase(c.id)}>Adicionar</button>
        </div>
      ))}

      <br />
      <button onClick={() => navigate('/quests')}>← Voltar para Minhas Quests</button>
    </div>
  )
}

export default QuestEditor