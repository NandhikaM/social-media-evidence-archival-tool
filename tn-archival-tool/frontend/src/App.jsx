import { useState, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import ArchivedRecords from './pages/ArchivedRecords'
import Dashboard from './pages/Dashboard'
import NewArchiveRequest from './pages/NewArchiveRequest'
import RecordDetails from './pages/RecordDetails'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Users from './pages/Users'
import Login from './pages/Login'
import api from './api/client'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('tn_archival_token')
      if (token) {
        try {
          const profile = await api.me()
          setUser(profile)
        } catch {
          localStorage.removeItem('tn_archival_token')
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const handleLoginSuccess = (profile) => {
    setUser(profile)
    navigate('/')
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {}
    setUser(null)
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xs font-bold uppercase tracking-widest animate-pulse">
          TN Cybercrime Wing • Loading System...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={handleLogout} />}>
        <Route index element={<Dashboard />} />
        <Route path="new-request" element={<NewArchiveRequest />} />
        <Route path="archived-records" element={<ArchivedRecords />} />
        <Route path="record-details" element={<RecordDetails />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
