import type {
  UserInfo,
  UserRole,
  PlatformCode,
  PlatformUserInfo,
  PlatformAccountStatus,
  PostContent,
  PostResult,
  ThemeMode
} from '@shared/types'

export type {
  UserInfo,
  UserRole,
  PlatformCode,
  PlatformUserInfo,
  PlatformAccountStatus,
  PostContent,
  PostResult,
  ThemeMode
}

// 前端数据模型

// 模板
export interface PostTemplate {
  id: string
  name: string
  text_prompt: string
  image_style: string
  hashtags: string
  category: string
  is_default: number
  created_at: string
  updated_at: string
}

// 发帖记录
export interface PostRecord {
  id: string
  template_id?: string
  platform_id: string
  platform_name?: string
  content_text: string
  image_urls: string
  hashtags: string
  status: 'pending' | 'generating' | 'publishing' | 'published' | 'failed'
  error_message?: string
  published_at?: string
  created_at: string
}

// 平台账号
export interface PlatformAccount {
  id: string
  platform_id: string
  platform_name?: string
  platform_code?: string
  platform_icon?: string
  user_info_json: string
  status: PlatformAccountStatus
  logged_in_at?: string
}

// 兑换码
export interface RedeemCode {
  id: string
  code: string
  points_value: number
  status: 'unused' | 'used' | 'expired'
  used_by?: string
  used_by_name?: string
  used_at?: string
  expires_at?: string
  created_at: string
}

// 消费记录
export interface ConsumptionRecord {
  id: string
  user_id: string
  user_name?: string
  post_id?: string
  points: number
  type: 'post' | 'redeem' | 'admin_adjust' | 'refund'
  description: string
  balance_after: number
  created_at: string
}

// 统计信息
export interface DashboardStats {
  totalPosts: number
  pointsBalance: number
  pointsConsumed: number
  platformStatus: Array<{
    code: PlatformCode
    name: string
    status: PlatformAccountStatus
  }>
  recentPosts: PostRecord[]
}

// 系统设置
export interface SystemSetting {
  id: string
  key: string
  value: string
  description: string
  updated_at: string
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// API 响应
export interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
