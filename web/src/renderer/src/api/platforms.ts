import apiClient from './client'
import type { ApiResult, PlatformAccount, PlatformCode } from '../types'

export const platformApi = {
  // 获取平台列表
  getPlatforms: () => apiClient.get('/platforms'),

  // 获取当前用户的平台账号
  getAccounts: (): Promise<ApiResult<PlatformAccount[]>> => apiClient.get('/platform-accounts'),

  // 更新平台账号状态
  updateAccountStatus: (
    id: string,
    status: string,
    userInfo?: string
  ): Promise<ApiResult<void>> => apiClient.put(`/platform-accounts/${id}/status`, { status, userInfo })
}
