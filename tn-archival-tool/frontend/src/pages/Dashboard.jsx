import { IconEye, IconList, IconPlus, IconSearch } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBadge from '../components/StatusBadge'
import api from '../api/client'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_cases: 0,
    urls_archived: 0,
    captured_today: 0,
    pending_requests: 0,
    completed: 0,
  })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search/Filter states
  const [searchCase, setSearchCase] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('All Platforms')
  const [filterStatus, setFilterStatus] = useState('All Status')

  useEffect(() => {
    async function fetchData() {
      try {
        const statsData = await api.reports.dashboardStats()
        const requestsData = await api.requests.list()
        
        setStats(statsData)
        setRecords(requestsData)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredRecords = records.filter(rec => {
    const matchesCase = rec.case_number?.toLowerCase().includes(searchCase.toLowerCase())
    const matchesPlatform = filterPlatform === 'All Platforms' || rec.platform?.toLowerCase() === filterPlatform.toLowerCase()
    
    let mappedStatus = rec.status
    const matchesStatus = filterStatus === 'All Status' || 
      (filterStatus === 'Completed' && mappedStatus === 'completed') ||
      (filterStatus === 'Pending' && (mappedStatus === 'pending' || mappedStatus === 'processing'))
      
    return matchesCase && matchesPlatform && matchesStatus
  })

  const statsItems = [
    { label: 'Total Cases', value: stats.total_cases, sub: 'All districts' },
    { label: 'URLs Archived', value: stats.urls_archived, sub: 'Verified & stored', border: 'border-t-emerald-500' },
    { label: 'Captured Today', value: stats.captured_today, sub: 'Live evidence', border: 'border-t-amber-500' },
    { label: 'Pending Requests', value: stats.pending_requests, sub: 'Awaiting archival', border: 'border-t-orange-500' },
    { label: 'Completed', value: stats.completed, sub: 'Evidence secured', border: 'border-t-slate-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium animate-pulse">Loading dashboard statistics...</p>
      </div>
    )
  }

  return (
    <section>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statsItems.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white p-5 rounded-lg shadow-sm border stat-card ${stat.border || ''}`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </p>
            <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border shadow-sm mb-6">
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <input 
            type="text" 
            placeholder="Case No. CYB-2026-..." 
            className="text-sm w-48"
            value={searchCase}
            onChange={(e) => setSearchCase(e.target.value)}
          />
          <select 
            className="text-sm"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option>All Platforms</option>
            <option>Facebook</option>
            <option>Twitter</option>
            <option>Instagram</option>
            <option>Telegram</option>
            <option>YouTube</option>
          </select>
          <select 
            className="text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h4 className="font-bold text-slate-700 flex items-center gap-2">
            <IconList className="text-accent-blue" size={20} /> Recent Capture Requests
          </h4>
          <Link
            to="/new-request"
            className="bg-accent-blue text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90"
          >
            <IconPlus size={16} /> New Request
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4 border-b">Case No.</th>
                <th className="p-4 border-b">Platform</th>
                <th className="p-4 border-b">Username/Handle</th>
                <th className="p-4 border-b">URL</th>
                <th className="p-4 border-b">Date Submitted</th>
                <th className="p-4 border-b">Status</th>
                <th className="p-4 border-b">Officer</th>
                <th className="p-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No requests found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id}>
                    <td className="p-4 font-medium">{row.case_number}</td>
                    <td className="p-4 capitalize">{row.platform}</td>
                    <td className="p-4 text-slate-500">{row.target_handle || '-'}</td>
                    <td className="p-4 text-blue-500 truncate max-w-[200px]" title={row.url}>
                      <a href={row.url} target="_blank" rel="noopener noreferrer">{row.url}</a>
                    </td>
                    <td className="p-4">{new Date(row.submitted_at).toLocaleString()}</td>
                    <td className="p-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="p-4">{row.submitted_by_username}</td>
                    <td className="p-4">
                      {row.status === 'completed' ? (
                        <Link
                          to="/archived-records"
                          className="border rounded px-2 py-1 inline-flex items-center gap-1 hover:bg-slate-50 text-xs font-semibold text-accent-blue"
                        >
                          <IconEye size={14} /> View Evidence
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Processing...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
