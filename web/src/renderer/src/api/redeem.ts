import apiClient from './client'
import type { ApiResult, RedeemCode, PaginatedResponse } from '../types'

export const redeemApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    status?: string
  }): Promise<ApiResult<PaginatedResponse<RedeemCode>>> => apiClient.get('/redeem', { params }),

  create: (data: {
    pointsValue: number
    expiresAt?: string
    count?: number
  }): Promise<ApiResult<RedeemCode[]>> => apiClient.post('/redeem', data),

  use: (code: string): Promise<ApiResult<{ points: number; balance: number }>> =>
    apiClient.post('/redeem/use', { code }),

  update: (id: string, data: Partial<RedeemCode>): Promise<ApiResult<RedeemCode>> =>
    apiClient.put(`/redeem/${id}`, data)
}
