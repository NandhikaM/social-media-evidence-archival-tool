export default function Users() {
  const users = [
    {
      initials: 'U1',
      name: 'User_1',
      role: 'Investigating Officer',
      roleStyle: 'bg-slate-100 text-slate-800',
      district: 'Chennai South',
      lastLogin: '2026-06-05 09:00',
      avatarStyle: 'bg-blue-100 text-accent-blue',
    },
    {
      initials: 'AD',
      name: 'Admin_Super',
      role: 'System Admin',
      roleStyle: 'bg-purple-600 text-white',
      district: 'State HQ',
      lastLogin: '2026-06-05 08:30',
      avatarStyle: 'bg-purple-100 text-purple-600',
    },
  ]

  return (
    <section>
      <div className="bg-white rounded-lg border shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-4 border-b">User</th>
              <th className="p-4 border-b">Role</th>
              <th className="p-4 border-b">District</th>
              <th className="p-4 border-b">Last Login</th>
              <th className="p-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.name}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user.avatarStyle}`}
                    >
                      {user.initials}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.roleStyle}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">{user.district}</td>
                <td className="p-4 text-slate-500">{user.lastLogin}</td>
                <td className="p-4 flex gap-2">
                  <button type="button" className="text-accent-blue font-bold text-xs uppercase">
                    Edit
                  </button>
                  <button type="button" className="text-slate-400 font-bold text-xs uppercase">
                    Disable
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
