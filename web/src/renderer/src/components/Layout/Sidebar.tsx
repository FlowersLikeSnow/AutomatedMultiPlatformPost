import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Popconfirm } from 'antd'
import type { MenuProps } from 'antd'
import { useSnapshot } from 'valtio'
import { authStore, isAdmin, clearAuth } from '../../stores/authStore'
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
  Coins,
  LogOut
} from 'lucide-react'

interface MenuItemDef {
  key: string
  path: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const menuItems: MenuItemDef[] = [
  { key: 'home', path: '/', label: 'menu.home', icon: <Home size={16} /> },
  { key: 'platform', path: '/platform', label: 'menu.platform', icon: <Monitor size={16} /> },
  { key: 'templates', path: '/templates', label: 'menu.templates', icon: <FileText size={16} /> },
  { key: 'post', path: '/post', label: 'menu.post', icon: <Send size={16} /> },
  { key: 'users', path: '/users', label: 'menu.users', icon: <Users size={16} />, adminOnly: true },
  { key: 'redeem', path: '/redeem', label: 'menu.redeem', icon: <Ticket size={16} />, adminOnly: true },
  { key: 'consumption', path: '/consumption', label: 'menu.consumption', icon: <Receipt size={16} />, adminOnly: true },
  { key: 'settings', path: '/settings', label: 'menu.settings', icon: <Settings size={16} /> }
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
        sidebarCollapsed ? 'w-12' : 'w-32'
      }`}
    >
      {/* 用户信息区域 */}
      <div className="flex flex-col items-center p-3 border-b border-(--border-color)">
        <div className="w-9 h-9 rounded-full bg-(--primary-color) flex items-center justify-center text-white font-bold text-xs">
          {currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        {!sidebarCollapsed && (
          <>
            <span className="mt-1.5 text-xs font-medium truncate max-w-full text-(--text-color)">
              {currentUser?.username || 'User'}
            </span>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-(--primary-color)">
              <Coins size={11} />
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
        style={{ paddingTop: 8, width: '100%' }}
      />

      {/* 退出登录 */}
      <div className="border-t border-(--border-color) p-2">
        <Popconfirm
          title="确定退出登录？"
          onConfirm={() => {
            clearAuth()
            navigate('/auth/login')
          }}
          okText="退出"
          cancelText="取消"
        >
          <button
            className={`flex items-center text-(--text-color)/50 hover:text-red-500 transition-colors cursor-pointer text-xs ${
              sidebarCollapsed ? 'justify-center w-full py-1.5' : 'gap-2 px-3 py-1.5 w-full rounded hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title={sidebarCollapsed ? '退出登录' : undefined}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span>退出登录</span>}
          </button>
        </Popconfirm>
      </div>
    </div>
  )
}
