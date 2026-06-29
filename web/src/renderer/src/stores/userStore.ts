import { proxy } from 'valtio'
import type { UserInfo, PaginatedResponse } from '../types'

interface UserState {
  users: PaginatedResponse<UserInfo> | null
  loading: boolean
}

export const userStore = proxy<UserState>({
  users: null,
  loading: false
})

export function setUsers(users: PaginatedResponse<UserInfo>): void {
  userStore.users = users
}

export function setUserLoading(loading: boolean): void {
  userStore.loading = loading
}
