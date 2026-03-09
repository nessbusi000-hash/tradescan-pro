import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, BookOpen, BarChart2,
  Settings, LogOut, Menu, X, ChevronRight, Bell, Zap
} from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { cn } from '../../utils/helpers'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chart', icon: TrendingUp, label: 'Graphique' },
  { to: '/smc', icon: Zap, label: 'Analyse SMC' },
  { to: '/trades', icon: BarChart2, label: 'Trades' },
  { to: '/academy', icon: BookOpen, label: 'Académie' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-surface border-r border-border transition-all duration-300 z-20',
          sidebarOpen ? 'w-56' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-glow-primary">
            <TrendingUp size={16} className="text-background" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-base tracking-tight gradient-text">
              TradeScan
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                    )
                  }
                  title={!sidebarOpen ? label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium truncate">{label}</span>
                  )}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-surface-2 border border-border rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {user?.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="btn-icon" title="Déconnexion">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="btn-icon w-full flex justify-center" title="Déconnexion">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="btn-icon"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2">
            <button className="btn-icon relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="badge-primary font-mono text-xs">LIVE</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
