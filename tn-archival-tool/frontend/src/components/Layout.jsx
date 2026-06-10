import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/new-request': 'New Archive Request',
  '/archived-records': 'Archived Records',
  '/record-details': 'Record Details',
  '/reports': 'System Reports',
  '/users': 'User Management',
  '/settings': 'Settings & Configuration',
}

export default function Layout({ user, onLogout }) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  )
}
