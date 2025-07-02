import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './routes/login/Login.jsx'
import Person from './routes/person/Person.jsx'
import Quests from './routes/quest/Quests.jsx'
import QuestCases from './routes/quest/QuestCases.jsx' 
import QuestInviteRedirect from './routes/quest/QuestInviteRedirect.jsx'
import CreateQuest from './routes/quest/CreateQuest.jsx'
import QuestEditor from './routes/quest/QuestEditor.jsx'
import CreateCase from './routes/case/CreateCase.jsx'
import InviteProfessor from './routes/inviteprofessor/InviteProfessor.jsx'

const router = createBrowserRouter([
  {
    path: '/', 
    element: <Login />,
  },
  {
    path: '/invite/professor/:inviteToken',
    element: <Login />,
  },
  {
    path: '/invite/quest/:questToken',
    element: <QuestInviteRedirect />,
  },
  {
    path: '/person',
    element: <Person />,
  },
  {
    path: '/quests',
    element: <Quests />
  },
  {
    path: '/quests/:questId/cases/',  
    element: <QuestCases />
  },
  {
  path: '/quests/create',
  element: <CreateQuest />
  },
  {
  path: '/quests/:questId/edit',
  element: <QuestEditor />
  },
  {
    path: '/cases/create',
    element: <CreateCase />,
  },
  {
    path:'invite/professor',
    element: <InviteProfessor  />,
  }
])

function App() {
  console.log("App carregado!");
  return (
    <RouterProvider router={router} />
    
  )
}
console.log("Login renderizado!");

export default App
