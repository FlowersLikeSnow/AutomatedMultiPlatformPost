import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
  ThemeMode,
  ConfigStore,
  PlatformUserInfo,
  PostContent,
  PostResult,
  GenerateImageParams,
  GenerateImageResult,
  ExpandPromptParams,
  ApiResponse
} from '../shared/types'

const electronAPI = {
  // Window control
  minimize: () => ipcRenderer.invoke(IPC_CHANNELS.MINIMIZE),
  maximize: () => ipcRenderer.invoke(IPC_CHANNELS.MAXIMIZE),
  close: () => ipcRenderer.invoke(IPC_CHANNELS.CLOSE),
  toggle_devtools: () => ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_DEVTOOLS),

  // Theme
  get_theme: (): Promise<ThemeMode> => ipcRenderer.invoke(IPC_CHANNELS.GET_THEME),
  set_theme: (theme: ThemeMode) => ipcRenderer.invoke(IPC_CHANNELS.SET_THEME, theme),
  toggle_theme: (): Promise<ThemeMode> => ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_THEME),
  on_theme_changed: (callback: (theme: ThemeMode) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: ThemeMode): void => callback(theme)
    ipcRenderer.on(IPC_CHANNELS.THEME_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.THEME_CHANGED, handler)
  },

  // Config
  get_config: (): Promise<ConfigStore> => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),
  save_config: (config: Partial<ConfigStore>) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONFIG, config),

  // Logging
  log: (msg: string) => ipcRenderer.invoke(IPC_CHANNELS.LOG, msg),
  log_error: (msg: string) => ipcRenderer.invoke(IPC_CHANNELS.LOG_ERROR, msg),
  get_log_path: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.GET_LOG_PATH),

  // 平台（统一使用 PlatformCode 作为键名）
  xiaohongshu: {
    login: (): Promise<ApiResponse<PlatformUserInfo>> => ipcRenderer.invoke(IPC_CHANNELS.XHS_LOGIN),
    logout: (): Promise<ApiResponse<void>> => ipcRenderer.invoke(IPC_CHANNELS.XHS_LOGOUT),
    getUserInfo: (): Promise<ApiResponse<PlatformUserInfo>> => ipcRenderer.invoke(IPC_CHANNELS.XHS_GET_USER_INFO),
    checkLoginStatus: (): Promise<ApiResponse<{ loggedIn: boolean }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.XHS_CHECK_LOGIN_STATUS),
    publish: (content: PostContent): Promise<ApiResponse<PostResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.XHS_PUBLISH, content),
    showBrowser: (visible: boolean): Promise<ApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.XHS_SHOW_BROWSER, visible)
  },

  // 抖音
  douyin: {
    login: (): Promise<ApiResponse<PlatformUserInfo>> => ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_LOGIN),
    logout: (): Promise<ApiResponse<void>> => ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_LOGOUT),
    getUserInfo: (): Promise<ApiResponse<PlatformUserInfo>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_GET_USER_INFO),
    checkLoginStatus: (): Promise<ApiResponse<{ loggedIn: boolean }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_CHECK_LOGIN_STATUS),
    publish: (content: PostContent): Promise<ApiResponse<PostResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_PUBLISH, content),
    showBrowser: (visible: boolean): Promise<ApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOUYIN_SHOW_BROWSER, visible)
  },

  // 快手
  kuaishou: {
    login: (): Promise<ApiResponse<PlatformUserInfo>> => ipcRenderer.invoke(IPC_CHANNELS.KUAISHOU_LOGIN),
    logout: (): Promise<ApiResponse<void>> => ipcRenderer.invoke(IPC_CHANNELS.KUAISHOU_LOGOUT),
    getUserInfo: (): Promise<ApiResponse<PlatformUserInfo>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KUAISHOU_GET_USER_INFO),
    checkLoginStatus: (): Promise<ApiResponse<{ loggedIn: boolean }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KUAISHOU_CHECK_LOGIN_STATUS),
    publish: (content: PostContent): Promise<ApiResponse<PostResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KUAISHOU_PUBLISH, content),
    showBrowser: (visible: boolean): Promise<ApiResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.KUAISHOU_SHOW_BROWSER, visible)
  },

  // AI
  ai: {
    generateImage: (params: GenerateImageParams): Promise<ApiResponse<GenerateImageResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_IMAGE, params),
    expandPrompt: (params: ExpandPromptParams): Promise<ApiResponse<{ expandedPrompt: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_EXPAND_PROMPT, params)
  },

  // 本地文件
  file: {
    getLocalImageUrl: (filename: string): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_LOCAL_IMAGE_URL, filename),
    getLocalImagePath: (filename: string): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_LOCAL_IMAGE_PATH, filename),
    saveLocalImage: (
      buffer: ArrayBuffer,
      ext?: string
    ): Promise<ApiResponse<{ filename: string; path: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVE_LOCAL_IMAGE, buffer, ext)
  }
}

contextBridge.exposeInMainWorld('app', electronAPI)

export type ElectronAPIType = typeof electronAPI
