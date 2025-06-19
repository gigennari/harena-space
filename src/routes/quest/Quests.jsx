import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Quests.css'

function Quests() {
  const [quests, setQuests] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/quests/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      const data = response.data;
      if (Array.isArray(data)) {
        setQuests(data);
      } else if (data.results) {
        setQuests(data.results);
      } else {
        console.error("Unexpected API response:", data);
        setQuests([]);
      }
    })
    .catch(error => {
      console.error('Error fetching quests:', error);
      setQuests([]);
    });
  }, []);

  return (
    <div>
      <h1>My Quests</h1>
      {quests.length === 0 ? (
        <p>No quests available.</p>
      ) : (
        <div className="quest-grid">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className="quest-tile"
              onClick={() => navigate(`/quest/${quest.id}`)}
            >
              <h2>{quest.name}</h2>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Quests
