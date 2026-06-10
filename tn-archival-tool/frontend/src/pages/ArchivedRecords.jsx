import {
  IconCircleCheckFilled,
  IconDownload,
  IconEye,
  IconFileCertificate,
  IconFilter,
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import api from '../api/client'

export default function ArchivedRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchRecords() {
      try {
        const data = await api.records.list()
        setRecords(data)
      } catch (err) {
        setError(err.message || 'Failed to load archived records.')
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [])

  const filteredRecords = records.filter((rec) => {
    const query = searchQuery.toLowerCase()
    return (
      rec.case_number?.toLowerCase().includes(query) ||
      rec.url?.toLowerCase().includes(query) ||
      rec.submitted_by_username?.toLowerCase().includes(query) ||
      rec.sha256_hash?.toLowerCase().includes(query)
    )
  })

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return
    const headers = ['Case No.', 'Request Date', 'Platform', 'URL', 'SHA256 Hash', 'Verified']
    const rows = filteredRecords.map((r) => [
      r.case_number,
      new Date(r.captured_at).toLocaleString(),
      r.platform,
      r.url,
      r.sha256_hash,
      r.is_verified ? 'Yes' : 'No',
    ])
    
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `TN_Evidence_Export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium animate-pulse">Loading archived evidence records...</p>
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

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by case, URL, hash..."
              className="w-64 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-accent-blue text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all"
            disabled={filteredRecords.length === 0}
          >
            <IconDownload size={16} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4 border-b">Case No.</th>
                <th className="p-4 border-b">Capture Date</th>
                <th className="p-4 border-b">Platform</th>
                <th className="p-4 border-b">URL</th>
                <th className="p-4 border-b">Integrity (SHA256)</th>
                <th className="p-4 border-b">Status</th>
                <th className="p-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No archived evidence records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id}>
                    <td className="p-4 font-medium">{row.case_number}</td>
                    <td className="p-4">{new Date(row.captured_at).toLocaleString()}</td>
                    <td className="p-4 capitalize">{row.platform}</td>
                    <td className="p-4 text-slate-500 truncate max-w-[200px]" title={row.url}>
                      {row.url}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-green-600 flex items-center gap-1">
                      {row.sha256_hash ? `${row.sha256_hash.substring(0, 8)}...` : '-'}
                      {row.is_verified && <IconCircleCheckFilled className="text-emerald-500 flex-shrink-0" size={14} />}
                    </td>
                    <td className="p-4">
                      <StatusBadge status="completed" label="Secured" />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/record-details?id=${row.id}`}
                          className="p-1 border rounded hover:bg-slate-50 text-accent-blue inline-flex items-center"
                          title="View Evidence Details"
                        >
                          <IconEye size={16} />
                        </Link>
                        <a
                          href={`http://localhost:8000/${row.screenshot_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 border rounded hover:bg-slate-50 text-slate-500 inline-flex items-center"
                          title="Download Original Media"
                          download
                        >
                          <IconFileCertificate size={16} />
                        </a>
                      </div>
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
