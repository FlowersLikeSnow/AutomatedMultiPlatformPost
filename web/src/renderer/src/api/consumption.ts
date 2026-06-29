import apiClient from './client'
import type { ApiResult, ConsumptionRecord, PaginatedResponse } from '../types'

export const consumptionApi = {
  getList: (params?: {
    page?: number
    pageSize?: number
    userId?: string
    type?: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResult<PaginatedResponse<ConsumptionRecord>>> => apiClient.get('/consumption', { params }),

  getStatistics: (): Promise<ApiResult<{ totalPoints: number; totalConsumed: number; totalRecharged: number }>> =>
    apiClient.get('/consumption/statistics')
}
