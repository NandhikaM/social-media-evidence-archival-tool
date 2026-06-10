import { IconShieldLock } from '@tabler/icons-react'
import { useState } from 'react'
import api from '../api/client'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await api.login(username, password)
      const user = await api.me()
      onLoginSuccess(user)
    } catch (err) {
      setError(err.message || 'Incorrect username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800/30 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-300">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex bg-blue-600/10 p-4 rounded-full border border-blue-500/20 text-blue-500 mb-2">
            <IconShieldLock size={36} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">TN Cybercrime Wing</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Social Media Archival Tool
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              placeholder="Enter your IO username"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/60 pt-6 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Authorized Personnel Only
          </p>
          <p className="text-[9px] text-slate-600 mt-1">
            Activity is monitored &amp; subject to strict auditing.
          </p>
        </div>
      </div>
    </div>
  )
}
