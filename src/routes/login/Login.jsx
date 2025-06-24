import React, { useState, useEffect } from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import '../../App.css'
import { useParams, useLocation } from 'react-router-dom'

const API_URL = `${import.meta.env.VITE_SERVER_URL}/auth/google/`

function GoogleAuthComponent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { inviteToken } = useParams(); 
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('person')

    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const getInviteTokenFromPath = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts.includes('invite') && pathParts.includes('professor') && pathParts.length > pathParts.indexOf('professor') + 1) {
      return pathParts[pathParts.indexOf('professor') + 1];
    }
    return null;
  };

  
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError(null)

    const tokenFromUrl = inviteToken || getInviteTokenFromPath(); 

    try {
      const requestData = {
        token: credentialResponse.credential
      };

      if (tokenFromUrl) { //includes the invite token if available
        requestData.invite_token = tokenFromUrl;
      }

      const response = await axios.post(API_URL, requestData); // sends requestData

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('person', JSON.stringify(response.data.user));

      console.log('Login successful:', response.data);


      setUser(response.data.user)
    } catch (err) {
      setError('Authentication failed. Please try again.')
      console.error('Google auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google Sign-in was unsuccessful')
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('person')
    setUser(null)
  }

  return (
    <div className="auth-container">
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!user ? (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            width="300px"
          />
        </GoogleOAuthProvider>
      ) : (
        <div className="user-profile">
          <h2>Welcome, {user.name}</h2>
          <p>Email: {user.email}</p>
          {user.picture && <img src={user.picture} alt={user.name} />}
          <button onClick={handleLogout}>Logout</button>
          <hr />
          <a href="/person">Go to the List of Persons</a> <br />
          <a href="/quests">Go to My Quests</a>
        </div>
      )}
    </div>
  )
}

function Login() {
  return (
    <div className="app">
      <h1>Google Authentication</h1>
      <GoogleAuthComponent />
    </div>
  )
}

export default Login
