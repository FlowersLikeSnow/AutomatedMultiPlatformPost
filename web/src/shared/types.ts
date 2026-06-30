// IPC 通道定义
export enum IPC_CHANNELS {
  // Window control
  MINIMIZE = 'window:minimize',
  MAXIMIZE = 'window:maximize',
  CLOSE = 'window:close',
  TOGGLE_DEVTOOLS = 'window:toggle_devtools',

  // Theme
  GET_THEME = 'theme:get_theme',
  SET_THEME = 'theme:set_theme',
  TOGGLE_THEME = 'theme:toggle_theme',
  THEME_CHANGED = 'theme:theme_changed',

  // Config
  GET_CONFIG = 'config:get_config',
  SAVE_CONFIG = 'config:save_config',

  // Logging
  LOG = 'log:info',
  LOG_ERROR = 'log:error',
  GET_LOG_PATH = 'log:get_path',

  // 小红书
  XHS_LOGIN = 'xhs:login',
  XHS_LOGOUT = 'xhs:logout',
  XHS_GET_USER_INFO = 'xhs:get_user_info',
  XHS_CHECK_LOGIN_STATUS = 'xhs:check_login_status',
  XHS_PUBLISH = 'xhs:publish',

  // 抖音
  DOUYIN_LOGIN = 'douyin:login',
  DOUYIN_LOGOUT = 'douyin:logout',
  DOUYIN_GET_USER_INFO = 'douyin:get_user_info',
  DOUYIN_CHECK_LOGIN_STATUS = 'douyin:check_login_status',
  DOUYIN_PUBLISH = 'douyin:publish',

  // 快手
  KUAISHOU_LOGIN = 'kuaishou:login',
  KUAISHOU_LOGOUT = 'kuaishou:logout',
  KUAISHOU_GET_USER_INFO = 'kuaishou:get_user_info',
  KUAISHOU_CHECK_LOGIN_STATUS = 'kuaishou:check_login_status',
  KUAISHOU_PUBLISH = 'kuaishou:publish',

  // AI 图片生成
  AI_GENERATE_IMAGE = 'ai:generate_image',
  AI_GENERATE_TEXT = 'ai:generate_text',
  AI_EXPAND_PROMPT = 'ai:expand_prompt',

  // 本地文件服务
  GET_LOCAL_IMAGE_URL = 'file:get_local_image_url',
  GET_LOCAL_IMAGE_PATH = 'file:get_local_image_path',
  SAVE_LOCAL_IMAGE = 'file:save_local_image'
}

// 平台类型
export type PlatformCode = 'xiaohongshu' | 'douyin' | 'kuaishou'

// 用户角色
export type UserRole = 'super_admin' | 'admin' | 'user'

// 用户信息
export interface UserInfo {
  id: string
  username: string
  phone: string
  role: UserRole
  avatar: string
  points_remaining: number
  points_consumed: number
  status: 'active' | 'banned' | 'inactive'
  created_at: string
  updated_at: string
  last_login_at?: string
  last_login_ip?: string
}

// 平台用户信息
export interface PlatformUserInfo {
  avatar?: string
  nickname?: string
  userId?: string
  [key: string]: unknown
}

// 平台账号状态
export type PlatformAccountStatus = 'online' | 'offline' | 'expired' | 'error'

// 发帖内容
export interface PostContent {
  title?: string
  text: string
  imagePaths: string[] // 本地文件路径
  hashtags?: string[]
}

// 发帖结果
export interface PostResult {
  success: boolean
  platformPostId?: string
  error?: string
}

// 通用 API 响应
export interface ApiResponse<T = unknown> {
  code: number
  data?: T
  msg?: string
}

// AI 生成图片参数
export interface GenerateImageParams {
  prompt: string
  size?: string
  n?: number
  quality?: 'standard' | 'hd'
}

// AI 生成图片结果
export interface GenerateImageResult {
  images: Array<{
    url: string
    localPath?: string
    id: string
    b64_json?: string
  }>
  metadata?: {
    model?: string
    revisedPrompt?: string
  }
}

// AI 扩写提示词参数
export interface ExpandPromptParams {
  basePrompt: string
  style?: string
}

// 主题模式
export type ThemeMode = 'dark' | 'light'

// 配置存储
export interface ConfigStore {
  theme: ThemeMode
  lastLoginTime?: number
}

// Electron API 接口
export interface ElectronAPI {
  // Window control
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  toggle_devtools: () => Promise<void>

  // Theme
  get_theme: () => Promise<ThemeMode>
  set_theme: (theme: ThemeMode) => Promise<void>
  toggle_theme: () => Promise<ThemeMode>
  on_theme_changed: (callback: (theme: ThemeMode) => void) => () => void

  // Config
  get_config: () => Promise<ConfigStore>
  save_config: (config: Partial<ConfigStore>) => Promise<void>

  // Logging
  log: (msg: string) => Promise<void>
  log_error: (msg: string) => Promise<void>
  get_log_path: () => Promise<string>

  // 平台（统一使用 PlatformCode 作为键名）
  xiaohongshu: {
    login: () => Promise<ApiResponse<PlatformUserInfo>>
    logout: () => Promise<ApiResponse<void>>
    getUserInfo: () => Promise<ApiResponse<PlatformUserInfo>>
    checkLoginStatus: () => Promise<ApiResponse<{ loggedIn: boolean }>>
    publish: (content: PostContent) => Promise<ApiResponse<PostResult>>
  }

  douyin: {
    login: () => Promise<ApiResponse<PlatformUserInfo>>
    logout: () => Promise<ApiResponse<void>>
    getUserInfo: () => Promise<ApiResponse<PlatformUserInfo>>
    checkLoginStatus: () => Promise<ApiResponse<{ loggedIn: boolean }>>
    publish: (content: PostContent) => Promise<ApiResponse<PostResult>>
  }

  kuaishou: {
    login: () => Promise<ApiResponse<PlatformUserInfo>>
    logout: () => Promise<ApiResponse<void>>
    getUserInfo: () => Promise<ApiResponse<PlatformUserInfo>>
    checkLoginStatus: () => Promise<ApiResponse<{ loggedIn: boolean }>>
    publish: (content: PostContent) => Promise<ApiResponse<PostResult>>
  }

  // AI
  ai: {
    generateImage: (params: GenerateImageParams) => Promise<ApiResponse<GenerateImageResult>>
    expandPrompt: (params: ExpandPromptParams) => Promise<ApiResponse<{ expandedPrompt: string }>>
  }

  // 本地文件
  file: {
    getLocalImageUrl: (filename: string) => Promise<string>
    getLocalImagePath: (filename: string) => Promise<string>
    saveLocalImage: (buffer: ArrayBuffer, ext?: string) => Promise<ApiResponse<{ filename: string; path: string }>>
  }
}

declare global {
  interface Window {
    app: ElectronAPI
  }
}
