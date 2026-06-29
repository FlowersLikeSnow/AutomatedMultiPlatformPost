import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import type { PlatformCode, PostContent } from '../../shared/types'
import { playwrightManager } from '../../playwright/playwright-manager'
import { logger } from '../utils/logger'

function registerPlatformHandlers(platform: PlatformCode, prefix: string): void {
  ipcMain.handle(`${prefix}:login`, async () => {
    logger.info(`[IPC] ${platform} login`)
    return playwrightManager.login(platform)
  })

  ipcMain.handle(`${prefix}:logout`, async () => {
    logger.info(`[IPC] ${platform} logout`)
    return playwrightManager.logout(platform)
  })

  ipcMain.handle(`${prefix}:get_user_info`, async () => {
    logger.info(`[IPC] ${platform} get_user_info`)
    return playwrightManager.getUserInfo(platform)
  })

  ipcMain.handle(`${prefix}:check_login_status`, async () => {
    logger.info(`[IPC] ${platform} check_login_status`)
    return playwrightManager.checkLoginStatus(platform)
  })

  ipcMain.handle(`${prefix}:publish`, async (_event, content: PostContent) => {
    logger.info(`[IPC] ${platform} publish`)
    return playwrightManager.publish(platform, content)
  })

  ipcMain.handle(`${prefix}:show_browser`, async (_event, visible: boolean) => {
    logger.info(`[IPC] ${platform} show_browser: ${visible}`)
    return playwrightManager.showBrowser(platform, visible)
  })
}

export function registerPlatformIpcHandlers(): void {
  registerPlatformHandlers('xiaohongshu', 'xhs')
  registerPlatformHandlers('douyin', 'douyin')
  registerPlatformHandlers('kuaishou', 'kuaishou')

  logger.info('[IPC] Platform handlers registered (xhs, douyin, kuaishou)')
}
