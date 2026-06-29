import { BrowserXiaohongshu } from './xiaohongshu'
import { BrowserDouyin } from './douyin'
import { BrowserKuaishou } from './kuaishou'
import type { PlatformCode, PlatformUserInfo, PostContent, PostResult, ApiResponse } from '../shared/types'
import { logger } from '../main/utils/logger'

class PlaywrightManager {
  private xiaohongshu: BrowserXiaohongshu | null = null
  private douyin: BrowserDouyin | null = null
  private kuaishou: BrowserKuaishou | null = null

  private getBrowser(code: PlatformCode) {
    switch (code) {
      case 'xiaohongshu':
        if (!this.xiaohongshu) this.xiaohongshu = new BrowserXiaohongshu()
        return this.xiaohongshu
      case 'douyin':
        if (!this.douyin) this.douyin = new BrowserDouyin()
        return this.douyin
      case 'kuaishou':
        if (!this.kuaishou) this.kuaishou = new BrowserKuaishou()
        return this.kuaishou
    }
  }

  async login(code: PlatformCode): Promise<ApiResponse<PlatformUserInfo>> {
    const browser = this.getBrowser(code)
    if (!browser) return { code: 400, msg: `Unknown platform: ${code}` }
    return browser.login()
  }

  async logout(code: PlatformCode): Promise<ApiResponse<void>> {
    const browser = this.getBrowser(code)
    if (!browser) return { code: 400, msg: `Unknown platform: ${code}` }
    return browser.logout()
  }

  async getUserInfo(code: PlatformCode): Promise<ApiResponse<PlatformUserInfo>> {
    const browser = this.getBrowser(code)
    if (!browser) return { code: 400, msg: `Unknown platform: ${code}` }
    const info = await browser.getUserInfo()
    return info ? { code: 200, data: info } : { code: 400, msg: '未登录' }
  }

  async checkLoginStatus(code: PlatformCode): Promise<ApiResponse<{ loggedIn: boolean }>> {
    const browser = this.getBrowser(code)
    if (!browser) return { code: 400, msg: `Unknown platform: ${code}` }
    return browser.checkLoginStatus()
  }

  async publish(code: PlatformCode, content: PostContent): Promise<ApiResponse<PostResult>> {
    const browser = this.getBrowser(code)
    if (!browser) return { code: 400, msg: `Unknown platform: ${code}` }
    const result = await browser.publish(content)
    return result.success
      ? { code: 200, data: result }
      : { code: 500, data: result, msg: result.error }
  }

  async showBrowser(code: PlatformCode, visible: boolean): Promise<ApiResponse<void>> {
    const browser = this.getBrowser(code)
    if (!browser) return { code: 400, msg: `Unknown platform: ${code}` }
    return browser.showBrowser(visible)
  }

  async exitAll(): Promise<void> {
    logger.info('[PlaywrightManager] Exiting all browsers...')
    const promises: Promise<void>[] = []
    if (this.xiaohongshu) promises.push(this.xiaohongshu.exit())
    if (this.douyin) promises.push(this.douyin.exit())
    if (this.kuaishou) promises.push(this.kuaishou.exit())
    await Promise.all(promises)
    this.xiaohongshu = null
    this.douyin = null
    this.kuaishou = null
    logger.info('[PlaywrightManager] All browsers closed')
  }
}

// 单例
export const playwrightManager = new PlaywrightManager()
