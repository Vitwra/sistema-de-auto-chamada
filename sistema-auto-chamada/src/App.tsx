import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { CreateAccountPage } from './pages/CreateAccountPage'
import { StudentDashboardPage } from './pages/StudentDashboardPage'
import { ProfessorDashboardPage } from './pages/ProfessorDashboardPage'
import { StudentAttendancePage } from './pages/StudentAttendancePage'
import { ProfessorClassDetailPage } from './pages/ProfessorClassDetailPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/criar-conta" element={<CreateAccountPage />} />
          <Route path="/aluno" element={<StudentDashboardPage />} />
          <Route path="/aluno/chamada" element={<StudentAttendancePage />} />
          <Route path="/professor" element={<ProfessorDashboardPage />} />
          <Route
            path="/professor/aulas/:id"
            element={<ProfessorClassDetailPage />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
