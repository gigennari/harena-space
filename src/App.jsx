import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './routes/login/Login.jsx'
import Person from './routes/person/Person.jsx'
import Quests from './routes/quest/Quests.jsx'
import QuestCases from './routes/quest/QuestCases.jsx' // ✅ Importa a nova página

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
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
    path: '/quest/:questId',  // ✅ Rota dinâmica para QuestCases
    element: <QuestCases />
  }
])

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
