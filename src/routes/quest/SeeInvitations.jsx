// SeeInvitations.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Quests.css';

function SeeInvitations() {
  const { questId } = useParams();
  const navigate = useNavigate();

  const [quest, setQuest] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPerson, setUserPerson] = useState(null); // Keep userPerson state
  const [copyMessage, setCopyMessage] = useState(''); // State for copy feedback

  useEffect(() => {
    const token = localStorage.getItem('token');
    const personFromStorage = JSON.parse(localStorage.getItem('person'));
    if (!personFromStorage || !token) {
      navigate('/login');
      return;
    }
    setUserPerson(personFromStorage); // Set userPerson state here

    const fetchInvitations = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch quest details first to get owner/group info for permission check
        const questResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        setQuest(questResponse.data);

        // 2. Implement the 'canManageQuest' logic here
        // This logic is consistent with QuestCases.jsx
        const canManageQuest = questResponse.data.owner === personFromStorage.id ||
                               personFromStorage.groups?.includes(`editors_${questId}`);

        if (!canManageQuest) {
          setError("You do not have permission to view invitations for this quest.");
          setLoading(false);
          return; // Stop execution if not authorized
        }

        // 3. If authorized, fetch quest access tokens
        const tokensResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/access-tokens/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        setTokens(tokensResponse.data);

      } catch (err) {
        console.error("Error fetching invitations:", err.response?.data || err.message);
        if (err.response && err.response.status === 403) {
          setError("Permission denied. You are not authorized to view these invitations.");
        } else if (err.response && err.response.status === 404) {
          setError("Quest not found or no invitations available.");
        } else {
          setError("Failed to load quest invitations.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [questId, navigate]); // Dependencies for useEffect

  const handleCopyLink = (tokenValue) => {
    const tempInput = document.createElement('input');
    tempInput.value = `${window.location.origin}/invite/${tokenValue}`;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    setCopyMessage('Link copied!');
    setTimeout(() => {
      setCopyMessage('');
    }, 2000);
  };

  if (loading) {
    return <div className="case-container"><p>Loading invitations...</p></div>;
  }

  if (error) {
    return (
      <div className="case-container error-container">
        <p>{error}</p>
        <button onClick={() => navigate(`/quests/${questId}/cases`)} className="always-blue-button">Back to Quest</button>
      </div>
    );
  }

  if (!quest) {
    // This case should ideally be covered by loading/error, but as a fallback
    return <div className="case-container"><p>Quest details not found.</p></div>;
  }

  return (
    <div className="case-container">
      <h2>Invitation Tokens for "{quest.name}"</h2>
      <p>Here you can see all active invitation tokens for this quest.</p>

      {copyMessage && <p className="copy-success-message" style={{ textAlign: 'center' }}>{copyMessage}</p>}

      {tokens.length === 0 ? (
        <p>No invitation tokens found for this quest.</p>
      ) : (
        <div className="tokens-list-container" style={{ overflowX: 'auto' }}>
          <table className="tokens-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={tableHeaderStyle}>UUID</th>
                <th style={tableHeaderStyle}>Role</th>
                <th style={tableHeaderStyle}>Group</th>
                <th style={tableHeaderStyle}>Max Uses</th>
                <th style={tableHeaderStyle}>Used By</th>
                <th style={tableHeaderStyle}>Expires At</th>
                <th style={tableHeaderStyle}>Link</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.token} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={tableCellStyle}>{token.token.substring(0, 8)}...</td> {/* Show truncated UUID */}
                  <td style={tableCellStyle}>{token.role}</td>
                  <td style={tableCellStyle}>{token.group}</td>
                  <td style={tableCellStyle}>{token.max_uses !== null ? token.max_uses : 'Unlimited'}</td>
                  <td style={tableCellStyle}>{token.used_by_count}</td>
                  <td style={tableCellStyle}>{new Date(token.expires_at).toLocaleDateString()}</td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => handleCopyLink(token.token)}
                      className="always-blue-button"
                      style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                    >
                      Copy Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="nav-buttons" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate(`/quests/${questId}/edit`)} className="always-blue-button">Back to Edit Quest</button>
        <button onClick={() => navigate(`/quests/${questId}`)} className="always-blue-button">Back to Quest</button>
      </div>
    </div>
  );
}



export default SeeInvitations;
