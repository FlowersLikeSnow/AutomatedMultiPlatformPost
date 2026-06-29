import { proxy } from 'valtio'
import { authStore } from './authStore'

interface PointsState {
  balance: number
  loading: boolean
}

export const pointsStore = proxy<PointsState>({
  balance: 0,
  loading: false
})

export function setPointsBalance(balance: number): void {
  pointsStore.balance = balance
  if (authStore.currentUser) {
    authStore.currentUser.points_remaining = balance
    localStorage.setItem('user', JSON.stringify(authStore.currentUser))
  }
}

export function setPointsLoading(loading: boolean): void {
  pointsStore.loading = loading
}

export function initPoints(): void {
  if (authStore.currentUser) {
    pointsStore.balance = authStore.currentUser.points_remaining
  }
}
