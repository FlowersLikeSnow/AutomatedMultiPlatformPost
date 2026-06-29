import { proxy } from 'valtio'
import type { PlatformAccount, PlatformCode, PlatformAccountStatus } from '../types'

interface PlatformState {
  accounts: Record<PlatformCode, PlatformAccount | null>
  loading: boolean
}

const defaultAccount = (): null => null

export const platformStore = proxy<PlatformState>({
  accounts: {
    xiaohongshu: defaultAccount(),
    douyin: defaultAccount(),
    kuaishou: defaultAccount()
  },
  loading: false
})

export function setPlatformAccount(code: PlatformCode, account: PlatformAccount | null): void {
  platformStore.accounts[code] = account
}

export function setPlatformStatus(code: PlatformCode, status: PlatformAccountStatus): void {
  const account = platformStore.accounts[code]
  if (account) {
    account.status = status
  }
}

export function setPlatformLoading(loading: boolean): void {
  platformStore.loading = loading
}

export function isPlatformLoggedIn(code: PlatformCode): boolean {
  return platformStore.accounts[code]?.status === 'online'
}
