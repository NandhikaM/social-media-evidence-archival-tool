import { useState, useEffect } from 'react'
import { IconEye, IconEyeOff, IconLock, IconUser, IconLoader2, IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import api from '../api/client'

export default function Settings() {
  const [instaUser, setInstaUser] = useState('')
  const [instaPass, setInstaPass] = useState('')
  const [fbUser, setFbUser] = useState('')
  const [fbPass, setFbPass] = useState('')
  const [twitterUser, setTwitterUser] = useState('')
  const [twitterPass, setTwitterPass] = useState('')

  const [showInstaPass, setShowInstaPass] = useState(false)
  const [showFbPass, setShowFbPass] = useState(false)
  const [showTwitterPass, setShowTwitterPass] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // 'instagram' | 'facebook' | 'twitter'
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    async function loadCreds() {
      try {
        const data = await api.settings.getCredentials()
        data.forEach((cred) => {
          if (cred.platform === 'instagram') {
            setInstaUser(cred.username)
            setInstaPass(cred.password)
          } else if (cred.platform === 'facebook') {
            setFbUser(cred.username)
            setFbPass(cred.password)
          } else if (cred.platform === 'twitter') {
            setTwitterUser(cred.username)
            setTwitterPass(cred.password)
          }
        })
      } catch (err) {
        setError(err.message || 'Failed to load social media credentials.')
      } finally {
        setLoading(false)
      }
    }
    loadCreds()
  }, [])

  const handleSave = async (platform, username, password) => {
    setError('')
    setSuccessMsg('')
    if (!username || !password) {
      setError(`Username and password cannot be empty for ${platform}.`)
      return
    }

    setSaving(platform)
    try {
      await api.settings.saveCredential({
        platform,
        username,
        password,
      })
      setSuccessMsg(`Successfully saved credentials for ${platform}.`)
    } catch (err) {
      setError(err.message || `Failed to save ${platform} credentials.`)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <IconLoader2 className="animate-spin text-accent-blue mr-2" size={24} />
        <span className="text-sm font-semibold text-slate-600">Loading settings...</span>
      </div>
    )
  }

  return (
    <section className="max-w-2xl bg-white rounded-lg border shadow-sm p-8 space-y-8">
      <div>
        <h4 className="font-bold border-b pb-2 mb-4 text-slate-800">Organizational Settings</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-slate-800">State HQ Reporting</p>
              <p className="text-xs text-slate-500">Automatically sync case hashes to state repository.</p>
            </div>
            <div className="w-12 h-6 bg-accent-blue rounded-full relative cursor-pointer opacity-80">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-bold border-b pb-2 mb-4 text-slate-800">Security &amp; Audit</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-800">Session Timeout</p>
            <select className="w-full text-sm rounded border border-slate-200 p-2 focus:ring-1 focus:ring-accent-blue focus:outline-none">
              <option>30 Minutes</option>
              <option>1 Hour</option>
              <option>4 Hours</option>
            </select>
          </div>
          <button type="button" className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-bold text-sm transition">
            Download Master Audit Log
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-bold border-b pb-2 mb-4 text-slate-800">Forensic Crawler Accounts</h4>
        <p className="text-xs text-slate-500 mb-6">
          Provide investigating officer account credentials for Instagram and Facebook. 
          The background crawler uses these accounts to automatically bypass login walls, authenticate pages, and preserve social media post contents/media securely.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center text-sm">
            <IconAlertCircle size={18} className="mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center text-sm">
            <IconCircleCheck size={18} className="mr-2 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Instagram Form */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Instagram Crawler Account</span>
              {instaUser ? (
                <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">Configured</span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">Not Configured</span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <IconUser className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Instagram Username"
                  className="w-full text-sm pl-9 pr-3 py-2 border rounded border-slate-200 focus:ring-1 focus:ring-accent-blue focus:outline-none"
                  value={instaUser}
                  onChange={(e) => setInstaUser(e.target.value)}
                />
              </div>
              <div className="relative">
                <IconLock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type={showInstaPass ? 'text' : 'password'}
                  placeholder="Instagram Password"
                  className="w-full text-sm pl-9 pr-10 py-2 border rounded border-slate-200 focus:ring-1 focus:ring-accent-blue focus:outline-none"
                  value={instaPass}
                  onChange={(e) => setInstaPass(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowInstaPass(!showInstaPass)}
                >
                  {showInstaPass ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs transition flex items-center"
                disabled={saving === 'instagram'}
                onClick={() => handleSave('instagram', instaUser, instaPass)}
              >
                {saving === 'instagram' && <IconLoader2 className="animate-spin mr-1.5" size={14} />}
                Save Instagram Credentials
              </button>
            </div>
          </div>

          {/* Facebook Form */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Facebook Crawler Account</span>
              {fbUser ? (
                <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">Configured</span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">Not Configured</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <IconUser className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Facebook Email/Username"
                  className="w-full text-sm pl-9 pr-3 py-2 border rounded border-slate-200 focus:ring-1 focus:ring-accent-blue focus:outline-none"
                  value={fbUser}
                  onChange={(e) => setFbUser(e.target.value)}
                />
              </div>
              <div className="relative">
                <IconLock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type={showFbPass ? 'text' : 'password'}
                  placeholder="Facebook Password"
                  className="w-full text-sm pl-9 pr-10 py-2 border rounded border-slate-200 focus:ring-1 focus:ring-accent-blue focus:outline-none"
                  value={fbPass}
                  onChange={(e) => setFbPass(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowFbPass(!showFbPass)}
                >
                  {showFbPass ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs transition flex items-center"
                disabled={saving === 'facebook'}
                onClick={() => handleSave('facebook', fbUser, fbPass)}
              >
                {saving === 'facebook' && <IconLoader2 className="animate-spin mr-1.5" size={14} />}
                Save Facebook Credentials
              </button>
            </div>
          </div>

          {/* Twitter Form */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Twitter (X) Crawler Account</span>
              {twitterUser ? (
                <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">Configured</span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">Not Configured</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <IconUser className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Twitter Username/Email"
                  className="w-full text-sm pl-9 pr-3 py-2 border rounded border-slate-200 focus:ring-1 focus:ring-accent-blue focus:outline-none"
                  value={twitterUser}
                  onChange={(e) => setTwitterUser(e.target.value)}
                />
              </div>
              <div className="relative">
                <IconLock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type={showTwitterPass ? 'text' : 'password'}
                  placeholder="Twitter Password"
                  className="w-full text-sm pl-9 pr-10 py-2 border rounded border-slate-200 focus:ring-1 focus:ring-accent-blue focus:outline-none"
                  value={twitterPass}
                  onChange={(e) => setTwitterPass(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowTwitterPass(!showTwitterPass)}
                >
                  {showTwitterPass ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs transition flex items-center"
                disabled={saving === 'twitter'}
                onClick={() => handleSave('twitter', twitterUser, twitterPass)}
              >
                {saving === 'twitter' && <IconLoader2 className="animate-spin mr-1.5" size={14} />}
                Save Twitter Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
