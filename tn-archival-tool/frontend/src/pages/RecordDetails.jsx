import {
  IconAnalyze,
  IconCamera,
  IconDownload,
  IconFingerprint,
  IconInfoCircle,
  IconMaximize,
  IconPhoto,
  IconShieldCheck,
  IconZoomIn,
  IconLoader2,
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function RecordDetails() {
  const [searchParams] = useSearchParams()
  const recordIdParam = searchParams.get('id')

  const [record, setRecord] = useState(null)
  const [remarks, setRemarks] = useState([])
  const [newRemark, setNewRemark] = useState('')
  const [loading, setLoading] = useState(true)
  const [remarksLoading, setRemarksLoading] = useState(false)
  const [postingRemark, setPostingRemark] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadRecord() {
      setLoading(true)
      setError('')
      try {
        let activeId = recordIdParam
        if (!activeId) {
          // Fallback: fetch list and take the first one
          const list = await api.records.list()
          if (list.length > 0) {
            activeId = list[0].id
          } else {
            setLoading(false)
            return
          }
        }

        const recordData = await api.records.get(activeId)
        setRecord(recordData)

        // Load remarks
        setRemarksLoading(true)
        const remarksData = await api.records.listRemarks(activeId)
        setRemarks(remarksData)
      } catch (err) {
        setError(err.message || 'Failed to load record details.')
      } finally {
        setLoading(false)
        setRemarksLoading(false)
      }
    }

    loadRecord()
  }, [recordIdParam])

  const handlePostRemark = async (e) => {
    e.preventDefault()
    if (!newRemark.trim() || !record) return

    setPostingRemark(true)
    try {
      const addedRemark = await api.records.createRemark(record.id, newRemark.trim())
      setRemarks((prev) => [...prev, addedRemark])
      setNewRemark('')
    } catch (err) {
      alert(err.message || 'Failed to post remark.')
    } finally {
      setPostingRemark(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium animate-pulse">Loading evidence details...</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="bg-white border rounded-lg p-12 text-center text-slate-500 max-w-xl mx-auto shadow-sm">
        <IconCamera className="mx-auto opacity-20 mb-3" size={48} />
        <h4 className="font-bold text-slate-700">No Evidence Records Found</h4>
        <p className="text-sm text-slate-400 mt-2">
          Please submit a capture request or search again.
        </p>
      </div>
    )
  }

  // Safely extract metadata fields with fallbacks
  const meta = record.metadata || {}
  const capturedAt = record.captured_at ? new Date(record.captured_at).toLocaleString() : 'N/A'
  const imageUrl = `http://localhost:8000/${record.screenshot_path}`
  const htmlUrl = `http://localhost:8000/${record.html_path}`

  return (
    <section>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Case Information */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <IconInfoCircle className="text-accent-blue" size={20} /> Case Information
            </h4>
            <div className="space-y-4 text-sm">
              {[
                ['Case No', record.case_number],
                ['Captured Date', capturedAt],
                ['Platform', record.platform],
                ['Officer', record.submitted_by_username],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">{label}</span>
                  <span className={label === 'Case No' ? 'font-bold text-slate-800' : 'capitalize'}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Metadata */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <IconAnalyze className="text-accent-blue" size={20} /> Extracted Metadata
            </h4>
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Page Title</span>
                <p className="font-semibold text-slate-800 text-xs line-clamp-2" title={meta.title}>
                  {meta.title || 'N/A'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Page Description</span>
                <p className="text-slate-600 text-xs" title={meta.description}>
                  {meta.description || 'No description found on page.'}
                </p>
              </div>

              {meta.og_title && (
                <div className="bg-slate-50 p-2 rounded flex justify-between text-xs">
                  <span>OpenGraph Title</span>
                  <span className="font-bold truncate max-w-[150px]">{meta.og_title}</span>
                </div>
              )}

              {meta.platform && (
                <div className="bg-slate-50 p-2 rounded flex justify-between text-xs">
                  <span>Captured Platform</span>
                  <span className="font-bold capitalize">{meta.platform}</span>
                </div>
              )}
            </div>
          </div>

          {/* Integrity Verification */}
          <div className="bg-blue-900 text-white p-6 rounded-lg border shadow-md">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <IconFingerprint size={20} /> Integrity Verification
            </h4>
            <p className="text-[10px] text-blue-200 mb-2 font-bold uppercase tracking-widest">SHA256 Integrity Hash</p>
            <div className="bg-black/20 p-3 rounded font-mono text-[11px] break-all leading-relaxed border border-white/10">
              {record.sha256_hash || 'Computation Pending...'}
            </div>
            {record.is_verified && (
              <div className="mt-4 flex items-center gap-2 text-green-300 font-bold text-xs uppercase">
                <IconShieldCheck size={16} /> Hash Integrity Verified
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {/* Screenshot Preview */}
          <div className="bg-white p-6 rounded-lg border shadow-sm min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <IconPhoto className="text-accent-blue" size={20} /> Social Media Capture Preview
              </h4>
              <div className="flex gap-2">
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 p-2 rounded hover:bg-slate-200 text-slate-700"
                  title="Open Image"
                >
                  <IconMaximize size={18} />
                </a>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 rounded border flex items-center justify-center relative overflow-hidden group min-h-[300px]">
              <img
                src={imageUrl}
                alt="Archived evidence screenshot"
                className="max-h-[500px] w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="hidden absolute inset-0 flex-col items-center justify-center gap-2 text-slate-400">
                <IconCamera size={40} className="opacity-25" />
                <span className="text-xs font-semibold">Screenshot preview unavailable</span>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="truncate pr-4">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Original URL</p>
                  <p className="text-xs truncate font-mono text-blue-300">{record.url}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                  >
                    View Saved HTML
                  </a>
                  <a
                    href={imageUrl}
                    download
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                  >
                    <IconDownload size={14} /> Download Media
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Investigation Remarks */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4">Investigation Remarks</h4>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
              {remarksLoading ? (
                <p className="text-slate-400 text-xs">Loading remarks...</p>
              ) : remarks.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No remarks posted for this evidence yet.</p>
              ) : (
                remarks.map((rem) => (
                  <div key={rem.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-accent-blue">Officer ID: {rem.author_id}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rem.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-650 leading-relaxed">{rem.content}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostRemark} className="flex gap-2">
              <input
                type="text"
                className="flex-1 text-sm border-slate-200 focus:outline-none focus:border-accent-blue rounded-md px-3 py-2 border"
                placeholder="Add investigator remark or metadata annotations..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                disabled={postingRemark}
                required
              />
              <button
                type="submit"
                className="bg-accent-blue text-white px-4 py-2 rounded-md font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1 transition-all"
                disabled={postingRemark || !newRemark.trim()}
              >
                {postingRemark && <IconLoader2 size={14} className="animate-spin" />}
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
