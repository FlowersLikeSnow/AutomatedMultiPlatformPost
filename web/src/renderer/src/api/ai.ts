import apiClient from './client'
import type { ApiResult } from '../types'

export const aiApi = {
  generateText: (params: {
    prompt: string
    topic?: string
    style?: string
    platform?: string
    hashtags?: string[]
  }): Promise<ApiResult<{ text: string }>> => apiClient.post('/ai/generate-text', params)
}
