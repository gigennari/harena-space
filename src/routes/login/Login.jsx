import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./Login.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Quests from "../quest/Quests";



const API_URL = `${import.meta.env.VITE_SERVER_URL}/auth/google/`;

function Login() {
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { inviteToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Carrega dados do localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const rawPerson = localStorage.getItem("person");
      const rawInstitution = localStorage.getItem("institution");

      const parsedUser =
        rawPerson && rawPerson !== "undefined" ? JSON.parse(rawPerson) : null;
      const parsedInstitution =
        rawInstitution && rawInstitution !== "undefined"
          ? JSON.parse(rawInstitution)
          : null;

      if (token && parsedUser) {
        setUser(parsedUser);
        setInstitution(parsedInstitution);
      }
    } catch (e) {
      console.error("Error with localStorage:", e);
    }
  }, []);

  const getInviteTokenFromPath = () => {
    const pathParts = location.pathname.split("/");
    if (
      pathParts.includes("invite") &&
      pathParts.includes("professor") &&
      pathParts.length > pathParts.indexOf("professor") + 1
    ) {
      return pathParts[pathParts.indexOf("professor") + 1];
    }
    return null;
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);

    const tokenFromUrl = inviteToken || getInviteTokenFromPath();
    const questToken = localStorage.getItem("quest_invite_token");

    try {
      const requestData = {
        token: credentialResponse.credential,
      };

      if (tokenFromUrl) {
        requestData.invite_token = tokenFromUrl;
      }

      if (questToken) {
        requestData.quest_invite_token = questToken;
      }

      const response = await axios.post(API_URL, requestData);

      localStorage.setItem("token", response.data.token);
      if (response.data.user) {
        localStorage.setItem("person", JSON.stringify(response.data.user));
        setUser(response.data.user);
      }
      if (response.data.user?.institution) {
        localStorage.setItem(
          "institution",
          JSON.stringify(response.data.user.institution)
        );
        setInstitution(response.data.user.institution);
      }

      localStorage.removeItem("quest_invite_token");
    } catch (err) {
      setError("Authentication failed. Please try again.");
      console.error("Google auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setInstitution(null);
    navigate("/");
  };

  if (!user) {
    return (
      <div className="login-container">
        <h1>Jacinto Bemelhor</h1>
        <p>A clinical reasoning game</p>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <GoogleLogin onSuccess={handleGoogleSuccess} useOneTap />
        </GoogleOAuthProvider>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  console.log("User role:", user?.role);
  return (
    <div className="home-layout">
      <header>
        <h1>Jacinto Bemelhor</h1>
        <p>A clinical reasoning game</p>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <p>👤 {user.email}</p>

          {institution?.owner === user?.id && (
            <button onClick={() => navigate("/invite/professor")}>
              Invite Professor
            </button>
          )}
          
          {user?.role === "professor" && (
            <button onClick={() => navigate("/quests/create")}>
              Create Quest
            </button>
          )}

          <button onClick={() => navigate('/cases/create')}>Create a Case</button>
          <button onClick={handleLogout}>Logout</button>
        </aside>

        <div className="content-area">
          <Quests embedded={true} />
        </div>
      </div>
    </div>
  );
}

export default Login;
