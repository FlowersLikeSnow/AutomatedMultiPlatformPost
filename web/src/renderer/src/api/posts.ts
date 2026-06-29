import apiClient from './client'
import type { ApiResult, PostRecord, DashboardStats, PaginatedResponse } from '../types'

export const postApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    status?: string
    platformId?: string
  }): Promise<ApiResult<PaginatedResponse<PostRecord>>> => apiClient.get('/posts', { params }),

  getById: (id: string): Promise<ApiResult<PostRecord>> => apiClient.get(`/posts/${id}`),

  create: (data: Partial<PostRecord>): Promise<ApiResult<PostRecord>> => apiClient.post('/posts', data),

  updateStatus: (id: string, status: string, error?: string): Promise<ApiResult<void>> =>
    apiClient.put(`/posts/${id}/status`, { status, error }),

  getStatistics: (): Promise<ApiResult<DashboardStats>> => apiClient.get('/posts/statistics')
}
