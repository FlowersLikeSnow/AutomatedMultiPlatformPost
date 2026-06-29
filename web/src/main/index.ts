import { resolve } from 'path'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/handlers'
import { initTray } from './modules/tray'
import { initConfigStore } from './modules/store'
import { initFileServer } from './modules/file-server'
import { registerAiIpcHandlers } from './ipc/ai-handlers'
import { logger } from './utils/logger'
import { loadEnv } from './utils/env'

let mainWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null

// 加载环境变量
loadEnv()

// 全局异常捕获
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason)
})

// 创建 Loading 窗口
function createLoadingWindow(): void {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  loadingWindow.loadFile(resolve(__dirname, '../renderer/loading.html'))
  loadingWindow.on('closed', () => {
    loadingWindow = null
  })
}

// 创建主窗口
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    icon: resolve(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: resolve(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // 关闭 loading 窗口
    if (loadingWindow) {
      loadingWindow.close()
    }
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发模式加载 dev server，生产模式加载打包文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(resolve(__dirname, '../renderer/index.html'))
  }
}

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // 设置应用 ID
    electronApp.setAppUserModelId('com.multiauto.post')

    // 优化默认设置
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // 初始化配置存储
    initConfigStore()

    // 创建 Loading 窗口
    createLoadingWindow()

    // 延迟创建主窗口
    setTimeout(() => {
      createMainWindow()
    }, 1500)

    // 注册 IPC 处理器
    registerIpcHandlers()

    // 初始化本地文件服务
    initFileServer()

    // 注册 AI IPC 处理器
    registerAiIpcHandlers()

    // 初始化系统托盘
    initTray()

    logger.info('Application started')
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  app.on('before-quit', () => {
    logger.info('Application quitting')
  })
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
