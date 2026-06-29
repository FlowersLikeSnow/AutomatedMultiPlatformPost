import { BrowserBase } from '../browser-base'
import type { PlatformUserInfo, PostContent, PostResult } from '../../shared/types'
import { logger } from '../../main/utils/logger'

export class BrowserDouyin extends BrowserBase {
  constructor() {
    super('douyin')
  }

  get loginUrl(): string {
    return 'https://creator.douyin.com'
  }

  get homeUrl(): string {
    return 'https://creator.douyin.com/creator-micro/home'
  }

  get publishUrl(): string {
    return 'https://creator.douyin.com/creator-micro/content/upload'
  }

  protected getHomeDomain(): string {
    return 'creator.douyin.com'
  }

  async getUserInfo(): Promise<PlatformUserInfo | null> {
    if (!this.page) return null

    try {
      await this.page.goto(this.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await this.page.waitForTimeout(2000)

      const userInfo = await this.page.evaluate(() => {
        const avatarEl = document.querySelector('.avatar img, [class*="avatar"] img, .semi-avatar img') as HTMLImageElement
        const nicknameEl = document.querySelector('.name, .nickname, [class*="name"] span')

        return {
          avatar: avatarEl?.src || '',
          nickname: nicknameEl?.textContent?.trim() || '抖音用户'
        }
      })

      logger.info(`[Douyin] User info: ${JSON.stringify(userInfo)}`)
      return userInfo
    } catch (error) {
      logger.error('[Douyin] Get user info failed:', error)
      return { nickname: '抖音用户' }
    }
  }

  async publish(content: PostContent): Promise<PostResult> {
    if (!this.page) return { success: false, error: 'Page not initialized' }

    try {
      logger.info('[Douyin] Starting publish...')

      // 导航到上传页
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
        logger.info('[Douyin] Publish success')
        return { success: true }
      } else {
        return { success: false, error: '发布超时' }
      }
    } catch (error) {
      logger.error('[Douyin] Publish failed:', error)
      return { success: false, error: error instanceof Error ? error.message : '发布失败' }
    }
  }

  private async uploadFiles(paths: string[]): Promise<void> {
    if (!this.page) return

    const uploadInput = await this.page.$('input[type="file"]')
    if (uploadInput) {
      await uploadInput.setInputFiles(paths)
      logger.info(`[Douyin] Uploaded ${paths.length} files`)
      await this.page.waitForTimeout(5000) // 抖音上传可能需要更长时间
    } else {
      logger.warn('[Douyin] Upload input not found')
    }
  }

  private async fillDescription(text: string): Promise<void> {
    if (!this.page) return

    // 抖音的描述输入框
    const descEditor = await this.page.$('[contenteditable="true"], .ql-editor, .desc-editor, #post-textarea')
    if (descEditor) {
      await descEditor.click()
      await descEditor.fill(text)
      logger.info('[Douyin] Description filled')
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
        const suggestion = await this.page.$(`[class*="topic"]:has-text("${tag}"), .mention-list li:has-text("${tag}")`)
        if (suggestion) {
          await suggestion.click()
          await this.page.waitForTimeout(500)
        }
      }
    }
    logger.info(`[Douyin] Added ${hashtags.length} hashtags`)
  }

  private async clickPublish(): Promise<void> {
    if (!this.page) return

    const publishBtn = await this.page.$('button:has-text("发布"), [class*="publish"] button, .btn-publish')
    if (publishBtn) {
      await publishBtn.click()
      logger.info('[Douyin] Publish button clicked')
    } else {
      throw new Error('Publish button not found')
    }
  }

  private async waitForPublishSuccess(timeout = 60000): Promise<boolean> {
    if (!this.page) return false

    try {
      await Promise.race([
        this.page.waitForSelector(':text("发布成功"), [class*="success"]', { timeout }),
        this.page.waitForURL('**/creator-micro/home**', { timeout })
      ])
      return true
    } catch {
      return false
    }
  }
}
