import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Popconfirm } from 'antd'
import type { MenuProps } from 'antd'
import { useSnapshot } from 'valtio'
import { authStore, isAdmin, clearAuth } from '../../stores/authStore'
import { uiStore, toggleSidebar } from '../../stores/uiStore'
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
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
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
      className={`flex flex-col h-full bg-(--sidebar-bg) transition-all duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-32'
      }`}
    >
      {/* 用户信息区域 */}
      <div className="relative flex flex-col items-center py-2 border-b border-r border-(--border-color)">
        <div className="w-11 h-11 rounded-full bg-(--primary-color) flex items-center justify-center text-white font-bold text-sm shadow-md shadow-(--primary-color)/20">
          {currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        {!sidebarCollapsed ? (
          <>
            <span className="mt-2 text-sm font-semibold truncate max-w-full px-3 text-(--text-color)">
              {currentUser?.username || 'User'}
            </span>
            <div className="flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-(--primary-color)/8 text-(--primary-color) text-xs">
              <Coins size={11} />
              <span className="font-medium">{balance}</span>
            </div>
          </>
        ) : (
          <span className="mt-1.5 text-[10px] text-(--text-color)/40 truncate max-w-full px-1">
            {currentUser?.username?.[0]?.toUpperCase() || 'U'}
          </span>
        )}
        {/* 收起/展开按钮 — 右上角 */}
        <button
          onClick={toggleSidebar}
          className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 rounded-md text-(--text-color)/30 hover:text-(--text-color)/70 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* antd Menu */}
      <Menu
        mode="inline"
        inlineCollapsed={sidebarCollapsed}
        selectedKeys={[selectedKey]}
        items={antdItems}
        onClick={menuClick}
        className="flex-1 border-none bg-transparent!"
        style={{ paddingTop: 4, width: '100%' }}
      />

      {/* 退出登录 */}
      <div className="border-t border-r border-(--border-color) p-2">
        <Popconfirm
          title="确定退出登录？"
          description="退出后需重新登录"
          onConfirm={() => {
            clearAuth()
            navigate('/auth/login')
          }}
          okText="退出"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <button
            className={`flex items-center w-full rounded-lg transition-all cursor-pointer ${
              sidebarCollapsed
                ? 'justify-center py-2 text-(--text-color)/35 hover:text-red-500 hover:bg-red-500/8'
                : 'gap-2.5 px-3 py-2 text-(--text-color)/45 hover:text-red-500 hover:bg-red-500/8'
            }`}
            title={sidebarCollapsed ? '退出登录' : undefined}
          >
            <LogOut size={15} />
            {!sidebarCollapsed && <span className="text-[13px]">退出登录</span>}
          </button>
        </Popconfirm>
      </div>
    </div>
  )
}
