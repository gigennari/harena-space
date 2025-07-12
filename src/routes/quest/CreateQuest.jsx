import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './QuestCases.css';
import { FaSave, FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

export default function CreateQuest() {
  const [name, setName] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quests/create/`,
        {
          name,
          visible_to_institution: visible
        },
        {
          headers: {
            Authorization: `Token ${token}`
          }
        }
      )

      console.log('Quest criada:', response.data)
      navigate('/quests') // redireciona após criação

    } catch (err) {
      console.error(err)
      setError('Erro ao criar quest')
    }
  }

  return (
    <div className="create-quest">
      <h2>Create a New Quest</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Quest name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          Visible to all in institution
        </label>
        <button type="submit">Submit</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  )
}
