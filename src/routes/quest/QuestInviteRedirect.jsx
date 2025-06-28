import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function QuestInviteRedirect() {
  const { questToken } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (questToken) {
      localStorage.setItem('quest_invite_token', questToken)
      navigate('/') // redireciona para login padrão
    }
  }, [questToken, navigate])

  return <p>Redirecting to log in...</p>
}
