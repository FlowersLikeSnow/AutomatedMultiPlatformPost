import apiClient from './client'
import type { ApiResult, PostTemplate, PaginatedResponse } from '../types'

export const templateApi = {
  getList: (params?: { page?: number; pageSize?: number }): Promise<ApiResult<PaginatedResponse<PostTemplate>>> =>
    apiClient.get('/templates', { params }),

  getById: (id: string): Promise<ApiResult<PostTemplate>> => apiClient.get(`/templates/${id}`),

  create: (data: Partial<PostTemplate>): Promise<ApiResult<PostTemplate>> =>
    apiClient.post('/templates', data),

  update: (id: string, data: Partial<PostTemplate>): Promise<ApiResult<PostTemplate>> =>
    apiClient.put(`/templates/${id}`, data),

  delete: (id: string): Promise<ApiResult<void>> => apiClient.delete(`/templates/${id}`),

  setDefault: (id: string): Promise<ApiResult<void>> => apiClient.put(`/templates/${id}/default`)
}
