import apiClient from './client'
import type { ApiResult, UserInfo } from '../types'

interface LoginParams {
  phone: string
  password: string
  captcha: string
  captchaId: string
}

interface LoginResult {
  user: UserInfo
  token: string
}

interface CaptchaResult {
  captchaId: string
  captchaImage: string // base64
}

export const authApi = {
  // 获取验证码
  getCaptcha: (): Promise<ApiResult<CaptchaResult>> => apiClient.get('/auth/captcha'),

  // 登录
  login: (params: LoginParams): Promise<ApiResult<LoginResult>> => apiClient.post('/auth/login', params),

  // 获取当前用户信息
  getProfile: (): Promise<ApiResult<UserInfo>> => apiClient.get('/auth/profile'),

  // 退出登录（后端无需处理，前端清除 token）
  logout: (): Promise<ApiResult<void>> => apiClient.post('/auth/logout')
}
