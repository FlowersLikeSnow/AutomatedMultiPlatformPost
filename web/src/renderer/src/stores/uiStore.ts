import { proxy } from 'valtio'
import type { ThemeMode } from '../types'

interface UIState {
  theme: ThemeMode
  sidebarCollapsed: boolean
  loading: boolean
}

export const uiStore = proxy<UIState>({
  theme: (localStorage.getItem('theme') as ThemeMode) || 'dark',
  sidebarCollapsed: false,
  loading: false
})

export function setTheme(theme: ThemeMode): void {
  uiStore.theme = theme
  localStorage.setItem('theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function toggleSidebar(): void {
  uiStore.sidebarCollapsed = !uiStore.sidebarCollapsed
}

export function setLoading(loading: boolean): void {
  uiStore.loading = loading
}

// 初始化主题
export function initTheme(): void {
  const savedTheme = (localStorage.getItem('theme') as ThemeMode) || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
  uiStore.theme = savedTheme
}
