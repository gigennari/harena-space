import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './InviteProfessor.css'; // Vamos criar este arquivo CSS

function InviteProfessor() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // NOVO: Adicione um estado para o número de dias de expiração, com um valor padrão de 7
  const [expiresInDays, setExpiresInDays] = useState(7); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/invite/professor/`,
        // NOVO: Envie o número de dias no corpo da requisição
        { email, expires_in_days: parseInt(expiresInDays, 10) },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      alert(`Invitation sent to ${email} successfully!`);
      navigate('/'); // Navega de volta para a página inicial
    } catch (err) {
      console.error('Failed to send invitation:', err.response?.data || err);
      alert('Failed to send invitation. Please check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-container">
      <h2>Invite a Professor</h2>
      <p>Enter the email of the professor you wish to invite to your institution.</p>
      <form onSubmit={handleSubmit} className="invite-form">
        <label htmlFor="email">Professor's Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., professor@example.com"
          required
        />
        {/* NOVO: Campo para selecionar o número de dias de expiração */}
        <label htmlFor="expiresInDays">Expiration in days:</label>
        <input
          type="number"
          id="expiresInDays"
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(e.target.value)}
          min="1" // Garante que o usuário insira um número positivo
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
      <button onClick={() => navigate('/')} className="back-button">
        ← Back
      </button>
    </div>
  );
}

export default InviteProfessor;