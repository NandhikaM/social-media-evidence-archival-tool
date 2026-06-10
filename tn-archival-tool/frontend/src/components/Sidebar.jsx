import {
  IconChartBar,
  IconDatabase,
  IconFileSearch,
  IconLayoutDashboard,
  IconLogout,
  IconSettings,
  IconShieldLock,
  IconSquarePlus,
  IconUsers,
} from '@tabler/icons-react'
import { NavLink } from 'react-router-dom'

const mainNav = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/new-request', label: 'New Archive Request', icon: IconSquarePlus },
  { to: '/archived-records', label: 'Archived Records', icon: IconDatabase, badge: '48' },
  { to: '/record-details', label: 'Record Details', icon: IconFileSearch },
]

const adminNav = [
  { to: '/reports', label: 'Reports', icon: IconChartBar },
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

function NavItem({ to, label, icon: Icon, badge, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
    >
      <Icon size={20} />
      {label}
      {badge && (
        <span className="ml-auto bg-blue-900/50 text-[10px] px-1.5 rounded">{badge}</span>
      )}
    </NavLink>
  )
}

export default function Sidebar({ user, onLogout }) {
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'IO'
  const roleDisplay = user?.role === 'system_admin' ? 'System Administrator' : 'Investigating Officer'

  return (
    <aside className="bg-sidebar-dark w-64 flex-shrink-0 flex flex-col text-slate-300">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-accent-blue p-2 rounded-lg text-white">
          <IconShieldLock size={28} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight uppercase tracking-wider">
            Social Media
          </h1>
          <p className="text-[10px] text-slate-400">Archival Tool v2.0</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Main
        </p>
        {mainNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <p className="px-3 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Reports &amp; Admin
        </p>
        {adminNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="overflow-hidden flex-1">
          <p className="text-sm font-medium text-white truncate" title={user?.full_name || user?.username}>
            {user?.full_name || user?.username}
          </p>
          <p className="text-[10px] text-slate-500 truncate" title={roleDisplay}>
            {roleDisplay}
          </p>
        </div>
        <button
          onClick={onLogout}
          type="button"
          className="text-slate-500 hover:text-white transition-all flex-shrink-0"
          title="Logout"
        >
          <IconLogout size={20} />
        </button>
      </div>
    </aside>
  )
}
