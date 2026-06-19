import { useState, useEffect } from 'react'
import { IconUserPlus, IconEdit, IconTrash, IconLoader2, IconAlertCircle, IconCircleCheck, IconLock, IconUser, IconShield } from '@tabler/icons-react'
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

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modals / Form States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  // Add User Fields
  const [newUsername, setNewUsername] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('investigating_officer')
  const [newDistrict, setNewDistrict] = useState('')

  // Edit User Fields
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState('investigating_officer')
  const [editDistrict, setEditDistrict] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const [submitting, setSubmitting] = useState(false)

  const loadUsers = async () => {
    try {
      const data = await api.users.list()
      setUsers(data)
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newUsername || !newFullName || !newPassword) {
      setError('Username, Full Name, and Password are required.')
      return
    }

    setSubmitting(true)
    try {
      await api.users.create({
        username: newUsername,
        full_name: newFullName,
        password: newPassword,
        role: newRole,
        district: newDistrict || null,
      })
      setSuccess(`User '${newUsername}' created successfully.`)
      setShowAddModal(false)
      // Reset Form
      setNewUsername('')
      setNewFullName('')
      setNewPassword('')
      setNewRole('investigating_officer')
      setNewDistrict('')
      loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (user) => {
    setEditingUser(user)
    setEditFullName(user.full_name)
    setEditRole(user.role)
    setEditDistrict(user.district || '')
    setEditIsActive(user.is_active)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!editFullName) {
      setError('Full Name is required.')
      return
    }

    setSubmitting(true)
    try {
      await api.users.update(editingUser.id, {
        full_name: editFullName,
        role: editRole,
        district: editDistrict || null,
        is_active: editIsActive,
      })
      setSuccess(`User '${editingUser.username}' updated successfully.`)
      setEditingUser(null)
      loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to update user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (user) => {
    setError('')
    setSuccess('')
    try {
      await api.users.update(user.id, {
        full_name: user.full_name,
        role: user.role,
        district: user.district,
        is_active: !user.is_active,
      })
      setSuccess(`User '${user.username}' status updated successfully.`)
      loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to update user status.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <IconLoader2 className="animate-spin text-accent-blue mr-2" size={24} />
        <span className="text-sm font-semibold text-slate-600">Loading user records...</span>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">User Account Management</h2>
          <p className="text-xs text-slate-500">Manage investigator credentials, access roles, and assigned districts.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs transition flex items-center gap-1.5"
        >
          <IconUserPlus size={16} />
          Add New User
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center text-sm">
          <IconAlertCircle size={18} className="mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center text-sm">
          <IconCircleCheck size={18} className="mr-2 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-4 border-b">User</th>
              <th className="p-4 border-b">Role</th>
              <th className="p-4 border-b">District</th>
              <th className="p-4 border-b">Status</th>
              <th className="p-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {users.map((user) => {
              const initials = user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'IO'
              const isAdmin = user.role === 'system_admin'
              return (
                <tr key={user.username} className={!user.is_active ? 'opacity-60 bg-slate-50/50' : ''}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-accent-blue'}`}>
                        {initials}
                      </div>
                      <div>
                        <span className="font-semibold block">{user.full_name}</span>
                        <span className="text-xs text-slate-400">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                      {isAdmin ? 'System Admin' : 'Investigating Officer'}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{user.district || <span className="text-slate-400 italic">State HQ (Optional)</span>}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-3">
                    <button
                      onClick={() => handleStartEdit(user)}
                      type="button"
                      className="text-accent-blue font-bold text-xs hover:underline uppercase flex items-center gap-0.5"
                    >
                      <IconEdit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      type="button"
                      className={`font-bold text-xs hover:underline uppercase ${user.is_active ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {user.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg border shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">Add New Investigator Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Username *</label>
                <div className="relative">
                  <IconUser className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. IO_Coimbatore"
                    className="w-full text-sm pl-9 pr-3 py-2 border rounded border-slate-200 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K. Sundaramoorthy"
                  className="w-full text-sm px-3 py-2 border rounded border-slate-200 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Password *</label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full text-sm pl-9 pr-3 py-2 border rounded border-slate-200 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role *</label>
                  <select
                    className="w-full text-sm"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="investigating_officer">Investigating Officer</option>
                    <option value="system_admin">System Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">District (Optional)</label>
                  <select
                    className="w-full text-sm"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                  >
                    <option value="">Select (Optional)</option>
                    {TAMIL_NADU_DISTRICTS.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border text-slate-500 rounded text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center"
                >
                  {submitting && <IconLoader2 className="animate-spin mr-1.5" size={14} />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg border shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800">Edit User Account: @{editingUser.username}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K. Sundaramoorthy"
                  className="w-full text-sm px-3 py-2 border rounded border-slate-200 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role *</label>
                  <select
                    className="w-full text-sm"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="investigating_officer">Investigating Officer</option>
                    <option value="system_admin">System Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">District (Optional)</label>
                  <select
                    className="w-full text-sm"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                  >
                    <option value="">Select (Optional)</option>
                    {TAMIL_NADU_DISTRICTS.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
                <label htmlFor="editIsActive" className="text-sm font-semibold text-slate-700">Account is Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border text-slate-500 rounded text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center"
                >
                  {submitting && <IconLoader2 className="animate-spin mr-1.5" size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
