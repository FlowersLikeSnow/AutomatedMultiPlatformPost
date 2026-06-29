import { ipcMain, BrowserWindow, app } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import type { ThemeMode, ConfigStore } from '../../shared/types'
import { getTheme, setTheme, toggleTheme, getConfig, saveConfig } from '../modules/store'
import { getMainWindow } from '../index'
import { logger } from '../utils/logger'

export function registerIpcHandlers(): void {
  // ========== Window Control ==========
  ipcMain.handle(IPC_CHANNELS.MINIMIZE, () => {
    const win = getMainWindow()
    win?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.MAXIMIZE, () => {
    const win = getMainWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.CLOSE, () => {
    const win = getMainWindow()
    win?.hide()
  })

  ipcMain.handle(IPC_CHANNELS.TOGGLE_DEVTOOLS, () => {
    const win = getMainWindow()
    win?.webContents.toggleDevTools()
  })

  // ========== Theme ==========
  ipcMain.handle(IPC_CHANNELS.GET_THEME, (): ThemeMode => {
    return getTheme()
  })

  ipcMain.handle(IPC_CHANNELS.SET_THEME, (_event, theme: ThemeMode) => {
    setTheme(theme)
    const win = getMainWindow()
    win?.webContents.send(IPC_CHANNELS.THEME_CHANGED, theme)
  })

  ipcMain.handle(IPC_CHANNELS.TOGGLE_THEME, (): ThemeMode => {
    const newTheme = toggleTheme()
    const win = getMainWindow()
    win?.webContents.send(IPC_CHANNELS.THEME_CHANGED, newTheme)
    return newTheme
  })

  // ========== Config ==========
  ipcMain.handle(IPC_CHANNELS.GET_CONFIG, (): ConfigStore => {
    return getConfig()
  })

  ipcMain.handle(IPC_CHANNELS.SAVE_CONFIG, (_event, config: Partial<ConfigStore>) => {
    saveConfig(config)
  })

  // ========== Logging ==========
  ipcMain.handle(IPC_CHANNELS.LOG, (_event, msg: string) => {
    logger.info('[Renderer]', msg)
  })

  ipcMain.handle(IPC_CHANNELS.LOG_ERROR, (_event, msg: string) => {
    logger.error('[Renderer]', msg)
  })

  ipcMain.handle(IPC_CHANNELS.GET_LOG_PATH, () => {
    return logger.getLogPath()
  })

  // ========== Platform IPC handlers will be registered by playwright-manager ==========
  // AI IPC handlers will be registered by ai module
  // File service IPC handlers will be registered by file-server module

  logger.info('IPC handlers registered')
}
