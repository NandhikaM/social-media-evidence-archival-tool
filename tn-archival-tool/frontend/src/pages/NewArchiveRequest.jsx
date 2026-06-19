import { IconUpload, IconLoader2, IconCircleCheck } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import api from '../api/client'

const TAMIL_NADU_DISTRICTS = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli",
  "Vellore", "Erode", "Thoothukudi", "Dindigul", "Kancheepuram", "Thanjavur",
  "Tiruppur", "Ranipet", "Krishnagiri", "Namakkal", "Cuddalore", "Ariyalur",
  "Chengalpattu", "Dharmapuri", "Kallakurichi", "Kanyakumari", "Karur",
  "Mayiladuthurai", "Nagapattinam", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Sivagangai", "Tenkasi", "Theni", "Tiruvallur",
  "Tiruvannamalai", "Tiruvarur", "Tirupathur", "Villupuram", "Virudhunagar"
]

export default function NewArchiveRequest() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [mode, setMode] = useState('single')
  
  // Form States
  const [caseNumber, setCaseNumber] = useState('')
  const [firNumber, setFirNumber] = useState('')
  const [district, setDistrict] = useState(user?.district || '')
  const [priority, setPriority] = useState('normal')
  const [platform, setPlatform] = useState('facebook')
  const [url, setUrl] = useState('')
  const [targetHandle, setTargetHandle] = useState('')
  const [justification, setJustification] = useState('')
  const [bulkUrlsText, setBulkUrlsText] = useState('')

  // UI Status
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleReset = () => {
    setCaseNumber('')
    setFirNumber('')
    setUrl('')
    setTargetHandle('')
    setJustification('')
    setBulkUrlsText('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate Case Number pattern: CYB-YYYY-NNN
    const caseRegex = /^CYB-\d{4}-\d{3}$/
    if (!caseRegex.test(caseNumber)) {
      setError('Case Number must match the format CYB-YYYY-NNN (e.g. CYB-2026-048)')
      return
    }

    if (!justification) {
      setError('Please provide a justification for evidence preservation.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'single') {
        if (!url) {
          setError('Please provide a social media URL.')
          setSubmitting(false)
          return
        }
        await api.requests.create({
          case_number: caseNumber,
          fir_number: firNumber || null,
          district,
          priority,
          platform,
          url,
          target_handle: targetHandle || null,
          justification,
        })
      } else {
        const urls = bulkUrlsText
          .split('\n')
          .map((u) => u.trim())
          .filter((u) => u.length > 0)
        
        if (urls.length === 0) {
          setError('Please paste at least one URL.')
          setSubmitting(false)
          return
        }
        await api.requests.createBulk({
          case_number: caseNumber,
          fir_number: firNumber || null,
          district,
          priority,
          platform,
          urls,
          justification,
        })
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(err.message || 'An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="max-w-4xl mx-auto">
      <div className="flex bg-slate-200 p-1 rounded-lg w-fit mb-8">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
            mode === 'single' ? 'bg-white shadow-sm' : 'text-slate-600'
          }`}
          disabled={submitting}
        >
          Single URL
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
            mode === 'bulk' ? 'bg-white shadow-sm' : 'text-slate-600'
          }`}
          disabled={submitting}
        >
          Bulk URL Upload
        </button>
      </div>

      {success ? (
        <div className="bg-white border rounded-lg shadow-sm p-12 text-center space-y-4">
          <div className="inline-flex bg-emerald-50 text-emerald-500 p-4 rounded-full border border-emerald-100">
            <IconCircleCheck size={48} className="animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Archival Job Queued</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            The social media capture request has been successfully submitted to the RQ worker queue.
            Redirecting to dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg shadow-sm p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Case Number *</label>
              <input
                type="text"
                className="w-full focus:ring-1 focus:ring-accent-blue"
                placeholder="e.g. CYB-2026-048"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value.toUpperCase())}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">FIR Number (Optional)</label>
              <input
                type="text"
                className="w-full"
                placeholder="e.g. 12/2026"
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Investigating Officer</label>
              <input
                type="text"
                className="w-full bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                value={`${user?.full_name || user?.username} (${user?.district})`}
                disabled
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">District (Optional)</label>
              <select
                className="w-full"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={submitting}
              >
                <option value="">Select district (Optional)</option>
                {TAMIL_NADU_DISTRICTS.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Priority *</label>
              <select
                className="w-full"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={submitting}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical (Threat to life)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Platform *</label>
              <select
                className="w-full"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={submitting}
              >
                <option value="facebook">Facebook</option>
                <option value="twitter">X (Twitter)</option>
                <option value="instagram">Instagram</option>
                <option value="telegram">Telegram</option>
                <option value="youtube">YouTube</option>
                <option value="other">Other Website</option>
              </select>
            </div>
          </div>

          {mode === 'single' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Social Media URL *</label>
                <input
                  type="url"
                  className="w-full border-accent-blue/30 bg-blue-50/30"
                  placeholder="https://www.platform.com/post/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Target Username/Handle (Optional)</label>
                <input
                  type="text"
                  className="w-full"
                  placeholder="e.g. @handle"
                  value={targetHandle}
                  onChange={(e) => setTargetHandle(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Manual URL Entry *</label>
                <textarea
                  className="w-full h-32 text-sm font-mono leading-relaxed"
                  placeholder="Paste multiple URLs here (one URL per line)..."
                  value={bulkUrlsText}
                  onChange={(e) => setBulkUrlsText(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 mt-6">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Archival Justification/Description *
            </label>
            <textarea
              className="w-full h-24"
              placeholder="Reason for archival / legal justification..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 rounded-md text-sm font-bold text-slate-600 border hover:bg-slate-50 transition-all"
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md text-sm font-bold text-white bg-accent-blue hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
              disabled={submitting}
            >
              {submitting && <IconLoader2 size={16} className="animate-spin" />}
              {submitting ? 'Submitting to Queue...' : 'Start Archival Process'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
