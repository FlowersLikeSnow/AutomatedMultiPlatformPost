import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
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

interface MenuItemDef {
  key: string
  path: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const menuItems: MenuItemDef[] = [
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

  const selectedKey =
    visibleItems.find(
      (item) =>
        item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path)
    )?.key ?? 'home'

  const menuClick: MenuProps['onClick'] = (e) => {
    const item = visibleItems.find((i) => i.key === e.key)
    if (item) navigate(item.path)
  }

  const antdItems: MenuProps['items'] = visibleItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: t(item.label)
  }))

  return (
    <div
      className={`flex flex-col h-full bg-(--sidebar-bg) border-r border-(--border-color) transition-all duration-200 ${
        sidebarCollapsed ? 'w-15' : 'w-55'
      }`}
    >
      {/* 用户信息区域 */}
      <div className="flex flex-col items-center p-3 border-b border-(--border-color)">
        <div className="w-10 h-10 rounded-full bg-(--primary-color) flex items-center justify-center text-white font-bold text-sm">
          {currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        {!sidebarCollapsed && (
          <>
            <span className="mt-2 text-sm font-medium truncate max-w-full text-(--text-color)">
              {currentUser?.username || 'User'}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-(--primary-color)">
              <Coins size={12} />
              <span>{balance}</span>
            </div>
          </>
        )}
      </div>

      {/* antd Menu */}
      <Menu
        mode="inline"
        inlineCollapsed={sidebarCollapsed}
        selectedKeys={[selectedKey]}
        items={antdItems}
        onClick={menuClick}
        className="flex-1 border-none bg-transparent!"
        style={{ paddingTop: 8 }}
      />
    </div>
  )
}
