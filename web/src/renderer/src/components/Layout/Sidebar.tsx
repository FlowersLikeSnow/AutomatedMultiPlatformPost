import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'
import { authStore, isAdmin } from '../../stores/authStore'
import { uiStore } from '../../stores/uiStore'
import { pointsStore } from '../../stores/pointsStore'
import {
  Home,
  Monitor,
  FileText,
  Send,
  Users,
  Ticket,
  Receipt,
  Settings,
  Coins
} from 'lucide-react'

interface MenuItem {
  key: string
  path: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const menuItems: MenuItem[] = [
  { key: 'home', path: '/', label: 'menu.home', icon: <Home size={18} /> },
  { key: 'platform', path: '/platform', label: 'menu.platform', icon: <Monitor size={18} /> },
  { key: 'templates', path: '/templates', label: 'menu.templates', icon: <FileText size={18} /> },
  { key: 'post', path: '/post', label: 'menu.post', icon: <Send size={18} /> },
  { key: 'users', path: '/users', label: 'menu.users', icon: <Users size={18} />, adminOnly: true },
  { key: 'redeem', path: '/redeem', label: 'menu.redeem', icon: <Ticket size={18} />, adminOnly: true },
  { key: 'consumption', path: '/consumption', label: 'menu.consumption', icon: <Receipt size={18} />, adminOnly: true },
  { key: 'settings', path: '/settings', label: 'menu.settings', icon: <Settings size={18} /> }
]

export function Sidebar(): React.ReactElement {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed } = useSnapshot(uiStore)
  const { currentUser } = useSnapshot(authStore)
  const { balance } = useSnapshot(pointsStore)

  const userIsAdmin = isAdmin()

  const visibleItems = menuItems.filter((item) => !item.adminOnly || userIsAdmin)

  return (
    <div
      className={`flex flex-col h-full bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] transition-all duration-200 ${
        sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* 用户信息区域 */}
      <div className="flex flex-col items-center p-3 border-b border-[var(--border-color)]">
        <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white font-bold text-sm">
          {currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        {!sidebarCollapsed && (
          <>
            <span className="mt-2 text-sm font-medium truncate max-w-full">
              {currentUser?.username || 'User'}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-[var(--primary-color)]">
              <Coins size={12} />
              <span>{balance}</span>
            </div>
          </>
        )}
      </div>

      {/* 菜单项 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {visibleItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-[var(--primary-color)] bg-[var(--primary-color)]/10 font-medium'
                  : 'text-[var(--text-color)] hover:bg-black/5 dark:hover:bg-white/5'
              } ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
              title={sidebarCollapsed ? t(item.label) : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{t(item.label)}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
