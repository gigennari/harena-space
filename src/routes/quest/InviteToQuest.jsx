// InviteToQuest.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Quests.css'; // Using the consolidated Quests.css

function InviteToQuest() {
  const { questId } = useParams();
  const navigate = useNavigate();

  const [quest, setQuest] = useState(null);
  const [userPerson, setUserPerson] = useState(null);
  const [role, setRole] = useState('student');   // Default role
  const [group, setGroup] = useState('view');     // Default group
  const [maxUses, setMaxUses] = useState(7);     // State for max uses, pre-populated with 7
  const [expirationDate, setExpirationDate] = useState(''); // New state for expiration date
  const [inviteToken, setInviteToken] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [message, setMessage] = useState(''); // General message for the main page
  const [showShareModal, setShowShareModal] = useState(false); // State for modal visibility
  const [tokenGenerated, setTokenGenerated] = useState(false); // State to track if token is generated
  const [copyMessage, setCopyMessage] = useState(''); // New state for copy message within modal

  useEffect(() => {
    const token = localStorage.getItem('token');
    const personFromStorage = JSON.parse(localStorage.getItem('person'));
    if (!personFromStorage || !token) {
      navigate('/login');
      return;
    }
    setUserPerson(personFromStorage);

    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/quests/${questId}/`, {
      headers: { Authorization: `Token ${token}` },
    })
    .then(response => {
      setQuest(response.data);
      const canInvite = response.data.owner === personFromStorage.user.id || personFromStorage.groups?.includes(`editors_${questId}`);
      if (!canInvite) {
        setMessage('You do not have permission to invite to this quest.');
      }
    })
    .catch(error => {
      console.error("Error fetching quest details:", error);
      setMessage('Error loading quest details.');
    });

    // Set default expiration date to 7 days from now
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 7);
    // Format to YYYY-MM-DD for input type="date"
    setExpirationDate(defaultExpiration.toISOString().split('T')[0]);

  }, [questId, navigate]);

  const handleGenerateInvite = async () => {
    const token = localStorage.getItem('token');
    setMessage('');
    setInviteLink('');
    setInviteToken('');
    setCopyMessage(''); // Clear copy message when generating new token

    // Basic validation for maxUses
    if (maxUses < 1) {
      setMessage('Max uses must be at least 1.');
      return;
    }
    if (!expirationDate) {
        setMessage('Please select an expiration date.');
        return;
    }

    // Construct the expiration datetime string for backend (YYYY-MM-DDTHH:MM:SSZ)
    // We take the selected date and set the time to 23:59:59 (11:59 PM)
    const selectedDate = new Date(expirationDate);
    selectedDate.setHours(23, 59, 59, 999); // Set to 11:59:59 PM
    const expiresAtUTC = selectedDate.toISOString(); // Convert to ISO string (UTC)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/quest-access-token/`,
        {
          quest: questId,
          role,
          group,
          max_uses: maxUses,
          expires_at: expiresAtUTC // Send the formatted expiration date
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      const generatedToken = response.data.token;
      setInviteToken(generatedToken);
      setInviteLink(`${window.location.origin}/invite/${generatedToken}`);
      setMessage('Invite link generated successfully!');
      setTokenGenerated(true); // Mark token as generated
      setShowShareModal(true); // Show the modal after successful generation

    } catch (error) {
      console.error('Error generating invite token:', error.response?.data || error.message);
      setMessage(`Error: ${error.response?.data?.detail || 'Could not generate invite token.'}`);
    }
  };

  const handleCopyLink = () => {
    const linkInput = document.getElementById('invite-link-input');
    if (linkInput) {
      linkInput.select();
      document.execCommand('copy');
      setCopyMessage('Link copied!'); // Set the copy message
      // Optionally, clear the message after a few seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000); // Message disappears after 3 seconds
    }
  };

  const handleCloseModalAndReset = () => {
    setShowShareModal(false);
    setCopyMessage(''); // Clear copy message when closing modal
    // No reset of form fields here to prevent accidental re-generation
  };


  if (!quest) {
    return <p>Loading quest invite page...</p>;
  }

  const hasInvitePermission = quest.owner === userPerson?.user.id || userPerson?.groups?.includes(`editors_${questId}`);
  if (!hasInvitePermission) {
    return (
      <div className="case-container">
        <h2>Access Denied</h2>
        <p>{message || "You do not have permission to invite users to this quest."}</p>
        <button onClick={() => navigate(`/quests/${questId}/cases`)} className="always-blue-button">Back to Quest</button>
      </div>
    );
  }

  return (
    <div className="case-container">
      <h2>Invite to "{quest.name}"</h2>

      {/* This paragraph is now conditionally rendered */}
      {!tokenGenerated && (
        <p>Select the role and group for the invited user in this quest.</p>
      )}

      {/* Input fields and explanation box are only visible BEFORE token is generated */}
      {!tokenGenerated && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="role-select">Role:</label>
            <select id="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="guest">Guest</option>
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="group-select">Group:</label>
            <select id="group-select" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="view">View</option>
              <option value="author">Author</option>
              <option value="editor">Editor</option>
            </select>
          </div>

          {/* Max Uses Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="max-uses-input">Max Uses:</label>
            <input
              id="max-uses-input"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
              style={{ width: '100%', textAlign: 'center' }}
            />
          </div>

          {/* Expiration Date Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="expiration-date-input">Expires At:</label>
            <input
              id="expiration-date-input"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              style={{ width: '100%', textAlign: 'center' }}
            />
          </div>

          {/* Role/Group Explanations Box */}
          <div className="explanation-box" style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '8px',
            textAlign: 'left',
            fontSize: '0.9rem',
            color: '#333',
            lineHeight: '1.5'
          }}>
            <p><strong>Role Definitions:</strong></p>
            <ul>
              <li><strong>Guest:</strong> Any email domain can register as a guest.</li>
              <li><strong>Student:</strong> Must use an institution email domain.</li>
              <li><strong>Professor:</strong> Must use an institution email domain.</li>
            </ul>
            <p><strong>Group Permissions:</strong></p>
            <ul>
              <li><strong>View:</strong> User can play the quest.</li>
              <li><strong>Author:</strong> User can add cases to the quest.</li>
              <li><strong>Editor:</strong> User can add, remove, and reorder cases in the quest, and invite other users.</li>
            </ul>
          </div>

          <button onClick={handleGenerateInvite} disabled={!hasInvitePermission} className="always-blue-button" style={{ marginTop: '2rem' }}>
            Generate Invite Link
          </button>
        </>
      )}

      {message && <p className={message.includes('Error') ? 'incorrect' : 'correct'}>{message}</p>}

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Share Your Invite Link</h3>
            <p>Copy the link below to share with your audience:</p>
            <input
              id="invite-link-input"
              type="text"
              value={inviteLink}
              readOnly
              onClick={(e) => e.target.select()}
              style={{ width: '100%', cursor: 'copy', marginBottom: '1rem' }}
            />
            {copyMessage && <p className="copy-success-message">{copyMessage}</p>}
            <button onClick={handleCopyLink} className="always-blue-button" style={{ marginRight: '0.5rem' }}>
              Copy Link
            </button>
            <button onClick={handleCloseModalAndReset} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation buttons after token is generated */}
      {tokenGenerated && !showShareModal && ( // Only show these if token generated and modal is closed
        <div className="nav-buttons" style={{ marginTop: '2rem' }}>
          {/* Removed "Back to Quest" button */}
          <button onClick={() => navigate(`/quests`)} className="always-blue-button">Go to Quests List</button>
        </div>
      )}

      {/* Original navigation buttons (only shown before token is generated) */}
      {!tokenGenerated && (
        <div className="nav-buttons" style={{ marginTop: '2rem' }}>
          <button onClick={() => navigate(`/quests/${questId}/cases`)} className="always-blue-button">Back to Quest</button>
          <button onClick={() => navigate(`/quests/${questId}/edit`)} className="always-blue-button">Back to Edit Quest</button>
        </div>
      )}
    </div>
  );
}

export default InviteToQuest;
