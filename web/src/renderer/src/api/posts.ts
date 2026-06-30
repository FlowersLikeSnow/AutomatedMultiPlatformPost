import apiClient from './client'
import type { ApiResult, PostRecord, PostPlatformRecord, DashboardStats, PaginatedResponse } from '../types'

export const postApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    status?: string
    platformId?: string
  }): Promise<ApiResult<PaginatedResponse<PostRecord>>> => apiClient.get('/posts', { params }),

  getById: (id: string): Promise<ApiResult<PostRecord>> => apiClient.get(`/posts/${id}`),

  create: (data: Partial<PostRecord>): Promise<ApiResult<PostRecord>> => apiClient.post('/posts', data),

  update: (id: string, data: Partial<PostRecord>): Promise<ApiResult<PostRecord>> => apiClient.put(`/posts/${id}`, data),

  updateStatus: (id: string, status: string, error?: string): Promise<ApiResult<void>> =>
    apiClient.put(`/posts/${id}/status`, { status, error }),

  delete: (id: string): Promise<ApiResult<void>> => apiClient.delete(`/posts/${id}`),

  getPlatforms: (postId: string): Promise<ApiResult<PostPlatformRecord[]>> =>
    apiClient.get(`/posts/${postId}/platforms`),

  addPlatforms: (postId: string, platformIds: string[]): Promise<ApiResult<void>> =>
    apiClient.post(`/posts/${postId}/platforms`, { platformIds }),

  updatePlatformStatus: (
    postId: string,
    platformId: string,
    data: { status: string; error?: string; platformPostId?: string }
  ): Promise<ApiResult<void>> => apiClient.put(`/posts/${postId}/platforms/${platformId}`, data),

  getStatistics: (): Promise<ApiResult<DashboardStats>> => apiClient.get('/posts/statistics')
}
