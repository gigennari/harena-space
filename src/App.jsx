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
import MyCases from './routes/case/MyCases.jsx'
import InviteToQuest from './routes/quest/InviteToQuest.jsx'
import SeeInvitations from './routes/quest/SeeInvitations.jsx'

const router = createBrowserRouter([
  //Regualar login route 
  {
    path: '/', 
    element: <Login />,
  },
  //Login route for professor invitation
  // This route is used when a professor is invited to the platform
  {
    path: '/invite/professor/:inviteToken',
    element: <Login />,
  },
  //Login route for quest invitation
  // This route is used when a user is invited to a quest 
  //The user will be redirected to the login page
  {
    path: '/invite/quest/:questToken',
    element: <QuestInviteRedirect />,
  },

  {
    path: '/person',
    element: <Person />,
  },
  //Quest route to see all quests available
  {
    path: '/quests',
    element: <Quests />
  },
  //Quest route to see cases of a specific quest
  {
    path: '/quests/:questId/cases/',  
    element: <QuestCases />
  },
  //Quest routes to create a quest 
  {
  path: '/quests/create',
  element: <CreateQuest />
  },
  //Quest route to edit a quest (add cases, remove cases, can be used to edir cases order in the future)
  {
  path: '/quests/:questId/edit',
  element: <QuestEditor />
  },
  //Case routes to create a case 
  {
    path: '/cases/create',
    element: <CreateCase />,
  },
  //Case route to see all cases created by the user
  {
    path: '/cases/mycases',
    element: <MyCases />,
  },
  //Invite professor route, this route is used to invite a professor to the platform
  {
    path:'invite/professor',
    element: <InviteProfessor  />,
  },
  //Invite to quest route, this route is used to invite a user to a quest
  {
    path:'/quests/:questId/invite',
    element: <InviteToQuest  />,
  },
  //See invitations route, this route is used to see all invitations to a quest
  {
    path:'/quests/:questId/invitations',
    element: <SeeInvitations />, 
  },

])

function App() {
  console.log("App carregado!");
  return (
    <RouterProvider router={router} />
    
  )
}
console.log("Login renderizado!");

export default App
