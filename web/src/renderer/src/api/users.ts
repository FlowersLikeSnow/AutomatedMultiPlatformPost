import apiClient from './client'
import type { ApiResult, UserInfo, PaginatedResponse } from '../types'

export const userApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    keyword?: string
    role?: string
  }): Promise<ApiResult<PaginatedResponse<UserInfo>>> => apiClient.get('/users', { params }),

  getById: (id: string): Promise<ApiResult<UserInfo>> => apiClient.get(`/users/${id}`),

  create: (data: Partial<UserInfo> & { password: string }): Promise<ApiResult<UserInfo>> =>
    apiClient.post('/users', data),

  update: (id: string, data: Partial<UserInfo>): Promise<ApiResult<UserInfo>> =>
    apiClient.put(`/users/${id}`, data),

  delete: (id: string): Promise<ApiResult<void>> => apiClient.delete(`/users/${id}`),

  resetPassword: (id: string, newPassword: string): Promise<ApiResult<void>> =>
    apiClient.put(`/users/${id}/reset-password`, { newPassword }),

  adjustPoints: (
    id: string,
    points: number,
    description: string
  ): Promise<ApiResult<{ balance: number }>> =>
    apiClient.put(`/users/${id}/points`, { points, description })
}
