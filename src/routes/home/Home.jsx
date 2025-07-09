// Home.jsx
import React, { useState, useEffect } from "react"; // Importe useState e useEffect
import { useNavigate } from "react-router-dom";
import Quests from "../quest/Quests";
import "../login/Login.css";
import { useRouteError } from "react-router-dom";

function Home() { // Nome do componente para corresponder à sua rota
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Estado local para o usuário
  const [institution, setInstitution] = useState(null); // Estado local para a instituição

  // Carrega dados do localStorage ao montar o componente
  useEffect(() => {
    try {
      const rawPerson = localStorage.getItem("person");
      const rawInstitution = localStorage.getItem("institution");
      const token = localStorage.getItem("token");

      
      if (rawInstitution && rawInstitution !== "undefined") {
        setInstitution(JSON.parse(rawInstitution));
      }
    } catch (e) {
      console.error("Error loading user data from localStorage in Home:", e);
      navigate("/auth/login/google"); // Em caso de erro, redireciona para o login
    }
  }, [navigate]); // Adicione navigate como dependência do useEffect

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setInstitution(null);
    navigate("/auth/login/google"); 
  };


  const displayName = user.name || user.email; // Fallback para email se o nome não estiver disponível
  const userPicture = user.picture || 'https://via.placeholder.com/40'; // Imagem de fallback

  return (
    <div className="home-layout">
      <header className="app-header">
        <h1 className="app-title">Jacinto Bemelhor</h1>
        <p className="app-tagline">A clinical reasoning game</p>
        {user && (
          <div className="user-info">
            <img src={userPicture} alt={displayName} className="user-picture" />
            <span className="user-name">{displayName}</span>
          </div>
        )}
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          
          {institution?.owner === user?.user?.id && (
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
          <button onClick={() => navigate('/cases/mycases')}>My Cases</button>
          <button onClick={handleLogout}>Logout</button>
        </aside>

        <div className="content-area">
          <Quests embedded={true} />
        </div>
      </div>
    </div>
  );
}

export default Home;