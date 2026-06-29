import { BrowserBase } from '../browser-base'
import type { PlatformUserInfo, PostContent, PostResult } from '../../shared/types'
import { logger } from '../../main/utils/logger'

export class BrowserKuaishou extends BrowserBase {
  constructor() {
    super('kuaishou')
  }

  get loginUrl(): string {
    return 'https://cp.kuaishou.com'
  }

  get homeUrl(): string {
    return 'https://cp.kuaishou.com/article/publish/video'
  }

  get publishUrl(): string {
    return 'https://cp.kuaishou.com/article/publish/video'
  }

  protected getHomeDomain(): string {
    return 'cp.kuaishou.com'
  }

  async getUserInfo(): Promise<PlatformUserInfo | null> {
    if (!this.page) return null

    try {
      await this.page.goto(this.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await this.page.waitForTimeout(2000)

      const userInfo = await this.page.evaluate(() => {
        const avatarEl = document.querySelector('.user-avatar img, [class*="avatar"] img, .header-avatar img') as HTMLImageElement
        const nicknameEl = document.querySelector('.user-name, .nickname, [class*="name"]')

        return {
          avatar: avatarEl?.src || '',
          nickname: nicknameEl?.textContent?.trim() || '快手用户'
        }
      })

      logger.info(`[Kuaishou] User info: ${JSON.stringify(userInfo)}`)
      return userInfo
    } catch (error) {
      logger.error('[Kuaishou] Get user info failed:', error)
      return { nickname: '快手用户' }
    }
  }

  async publish(content: PostContent): Promise<PostResult> {
    if (!this.page) return { success: false, error: 'Page not initialized' }

    try {
      logger.info('[Kuaishou] Starting publish...')

      // 导航到发布页
      await this.page.goto(this.publishUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.page.waitForTimeout(3000)

      // 上传图片/视频
      if (content.imagePaths.length > 0) {
        await this.uploadFiles(content.imagePaths)
      }

      // 填写描述
      await this.fillDescription(content.text)

      // 添加话题标签
      if (content.hashtags && content.hashtags.length > 0) {
        await this.addHashtags(content.hashtags)
      }

      // 点击发布
      await this.clickPublish()

      // 等待发布完成
      const published = await this.waitForPublishSuccess()

      if (published) {
        logger.info('[Kuaishou] Publish success')
        return { success: true }
      } else {
        return { success: false, error: '发布超时' }
      }
    } catch (error) {
      logger.error('[Kuaishou] Publish failed:', error)
      return { success: false, error: error instanceof Error ? error.message : '发布失败' }
    }
  }

  private async uploadFiles(paths: string[]): Promise<void> {
    if (!this.page) return

    const uploadInput = await this.page.$('input[type="file"]')
    if (uploadInput) {
      await uploadInput.setInputFiles(paths)
      logger.info(`[Kuaishou] Uploaded ${paths.length} files`)
      await this.page.waitForTimeout(5000)
    } else {
      logger.warn('[Kuaishou] Upload input not found')
    }
  }

  private async fillDescription(text: string): Promise<void> {
    if (!this.page) return

    // 快手描述输入框
    const descEditor = await this.page.$('[contenteditable="true"], .ql-editor, .desc-input, #description')
    if (descEditor) {
      await descEditor.click()
      await descEditor.fill(text)
      logger.info('[Kuaishou] Description filled')
      await this.page.waitForTimeout(1000)
    }
  }

  private async addHashtags(hashtags: string[]): Promise<void> {
    if (!this.page || hashtags.length === 0) return

    for (const tag of hashtags) {
      const descEditor = await this.page.$('[contenteditable="true"], .ql-editor')
      if (descEditor) {
        await descEditor.click()
        await this.page.keyboard.type(` #${tag} `)
        await this.page.waitForTimeout(1500)

        // 点击话题建议
        const suggestion = await this.page.$(`[class*="topic"]:has-text("${tag}"), .topic-item:has-text("${tag}")`)
        if (suggestion) {
          await suggestion.click()
          await this.page.waitForTimeout(500)
        }
      }
    }
    logger.info(`[Kuaishou] Added ${hashtags.length} hashtags`)
  }

  private async clickPublish(): Promise<void> {
    if (!this.page) return

    const publishBtn = await this.page.$('button:has-text("发布"), [class*="publish"] button, .submit-btn')
    if (publishBtn) {
      await publishBtn.click()
      logger.info('[Kuaishou] Publish button clicked')
    } else {
      throw new Error('Publish button not found')
    }
  }

  private async waitForPublishSuccess(timeout = 60000): Promise<boolean> {
    if (!this.page) return false

    try {
      await Promise.race([
        this.page.waitForSelector(':text("发布成功"), [class*="success"]', { timeout }),
        this.page.waitForURL('**/article/publish**', { timeout })
      ])
      return true
    } catch {
      return false
    }
  }
}
