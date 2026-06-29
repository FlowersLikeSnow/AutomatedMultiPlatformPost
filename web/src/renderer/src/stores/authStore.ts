import { proxy } from 'valtio'
import type { UserInfo, UserRole } from '../types'

interface AuthState {
  isAuthenticated: boolean
  currentUser: UserInfo | null
  token: string | null
  loading: boolean
}

export const authStore = proxy<AuthState>({
  isAuthenticated: !!localStorage.getItem('token'),
  currentUser: null,
  token: localStorage.getItem('token'),
  loading: false
})

export function setUser(user: UserInfo, token: string): void {
  authStore.currentUser = user
  authStore.token = token
  authStore.isAuthenticated = true
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth(): void {
  authStore.currentUser = null
  authStore.token = null
  authStore.isAuthenticated = false
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function restoreAuth(): void {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  if (token && userStr) {
    try {
      authStore.token = token
      authStore.currentUser = JSON.parse(userStr) as UserInfo
      authStore.isAuthenticated = true
    } catch {
      clearAuth()
    }
  }
}

export function isAdmin(role?: UserRole): boolean {
  const r = role || authStore.currentUser?.role
  return r === 'super_admin' || r === 'admin'
}

export function isSuperAdmin(role?: UserRole): boolean {
  const r = role || authStore.currentUser?.role
  return r === 'super_admin'
}
