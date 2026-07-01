import { resolve } from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import type { BrowserContext, Page } from 'playwright'
import type { PlatformCode, PlatformUserInfo, PostContent, PostResult, ApiResponse } from '../shared/types'
import { logger } from '../main/utils/logger'
import { getEnvVar } from '../main/utils/env'

export abstract class BrowserBase {
  protected context: BrowserContext | null = null
  protected page: Page | null = null
  protected platformCode: PlatformCode
  protected userDataDir: string
  protected platformUserInfo: PlatformUserInfo | null = null

  constructor(platformCode: PlatformCode) {
    this.platformCode = platformCode
    this.userDataDir = resolve(app.getPath('userData'), 'playwright-profile', platformCode)

    if (!existsSync(this.userDataDir)) {
      mkdirSync(this.userDataDir, { recursive: true })
    }
  }

  // 子类必须实现
  abstract get loginUrl(): string
  abstract get homeUrl(): string
  abstract get publishUrl(): string
  abstract getUserInfo(): Promise<PlatformUserInfo | null>
  abstract publish(content: PostContent): Promise<PostResult>

  async init(headless?: boolean): Promise<void> {
    if (this.context) return

    // For login, always show browser; for other operations, read from .ENV
    const showBrowser = headless !== undefined ? !headless : getEnvVar('HIDE_BROWSER', 'true') === 'true'
    const isHeadless = !showBrowser

    try {
      // 动态导入 playwright-extra
      const { chromium } = await import('playwright-extra')
      const stealth = await import('puppeteer-extra-plugin-stealth').then(m => m.default())
      chromium.use(stealth)

      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless: isHeadless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai'
      })

      this.page = this.context.pages()[0] || await this.context.newPage()
      logger.info(`[Browser:${this.platformCode}] Initialized (headless=${isHeadless})`)
    } catch (error) {
      logger.error(`[Browser:${this.platformCode}] Init failed:`, error)
      throw error
    }
  }

  async login(): Promise<ApiResponse<PlatformUserInfo>> {
    try {
      // Always show browser for login - need to exit first if already in headless mode
      if (this.context) {
        await this.exit()
      }
      await this.init(false)
      if (!this.page) throw new Error('Page not initialized')

      await this.page.goto(this.loginUrl, { waitUntil: 'domcontentloaded' })
      logger.info(`[Browser:${this.platformCode}] Login page opened: ${this.loginUrl}`)

      // 等待用户手动登录（检测 URL 跳转到首页）
      const loggedIn = await this.waitForLogin()
      if (!loggedIn) {
        return { code: 400, msg: '登录超时或取消' }
      }

      // 获取用户信息
      const userInfo = await this.getUserInfo()
      if (userInfo) {
        this.platformUserInfo = userInfo
        logger.info(`[Browser:${this.platformCode}] Login success:`, userInfo.nickname)

        // 如果 HIDE_BROWSER=true，登录成功后隐藏浏览器（关闭后以 headless 模式重新初始化）
        if (getEnvVar('HIDE_BROWSER', 'false') === 'true') {
          logger.info(`[Browser:${this.platformCode}] HIDE_BROWSER=true, switching to headless mode`)
          await this.exit()
          await this.init(true)
        }

        return { code: 200, data: userInfo }
      }

      return { code: 200, data: { nickname: 'Unknown' } }
    } catch (error) {
      logger.error(`[Browser:${this.platformCode}] Login failed:`, error)
      return { code: 500, msg: error instanceof Error ? error.message : '登录失败' }
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.exit()
      this.platformUserInfo = null
      logger.info(`[Browser:${this.platformCode}] Logged out`)
      return { code: 200 }
    } catch (error) {
      logger.error(`[Browser:${this.platformCode}] Logout failed:`, error)
      return { code: 500, msg: error instanceof Error ? error.message : '登出失败' }
    }
  }

  async checkLoginStatus(): Promise<ApiResponse<{ loggedIn: boolean }>> {
    try {
      await this.init()
      if (!this.page) throw new Error('Page not initialized')

      await this.page.goto(this.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

      // 检查是否被重定向到登录页
      const currentUrl = this.page.url()
      const isLoggedIn = !currentUrl.includes('login') && !currentUrl.includes('passport')

      return { code: 200, data: { loggedIn: isLoggedIn } }
    } catch (error) {
      logger.error(`[Browser:${this.platformCode}] Check login status failed:`, error)
      return { code: 500, msg: error instanceof Error ? error.message : '检查登录状态失败' }
    }
  }

  protected async waitForLogin(timeout = 120000): Promise<boolean> {
    if (!this.page) return false

    try {
      // 等待 URL 变化（离开登录页）
      await this.page.waitForURL((url) => {
        const urlStr = url.toString()
        return !urlStr.includes('login') && !urlStr.includes('passport') && urlStr.includes(this.getHomeDomain())
      }, { timeout })
      return true
    } catch {
      return false
    }
  }

  protected getHomeDomain(): string {
    try {
      return new URL(this.homeUrl).hostname
    } catch {
      return ''
    }
  }

  async exit(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close()
        this.context = null
        this.page = null
        logger.info(`[Browser:${this.platformCode}] Closed`)
      }
    } catch (error) {
      logger.error(`[Browser:${this.platformCode}] Exit error:`, error)
    }
  }

  getUserInfoCached(): PlatformUserInfo | null {
    return this.platformUserInfo
  }
}
