import { BrowserBase } from '../browser-base'
import type { PlatformUserInfo, PostContent, PostResult } from '../../shared/types'
import { logger } from '../../main/utils/logger'

export class BrowserXiaohongshu extends BrowserBase {
  constructor() {
    super('xiaohongshu')
  }

  get loginUrl(): string {
    return 'https://creator.xiaohongshu.com/login'
  }

  get homeUrl(): string {
    return 'https://creator.xiaohongshu.com/new/home'
  }

  get publishUrl(): string {
    return 'https://creator.xiaohongshu.com/publish/publish'
  }

  protected getHomeDomain(): string {
    return 'creator.xiaohongshu.com'
  }

  async getUserInfo(): Promise<PlatformUserInfo | null> {
    if (!this.page) return null

    try {
      // 访问创作者中心首页获取用户信息
      await this.page.goto(this.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await this.page.waitForTimeout(2000)

      // 尝试从页面提取用户信息
      const userInfo = await this.page.evaluate(() => {
        // 尝试多种选择器
        const avatarEl = document.querySelector('.user-avatar img, .avatar img, [class*="avatar"] img') as HTMLImageElement
        const nicknameEl = document.querySelector('.user-name, .nickname, [class*="name"]')

        return {
          avatar: avatarEl?.src || '',
          nickname: nicknameEl?.textContent?.trim() || '小红书用户'
        }
      })

      logger.info(`[XHS] User info: ${JSON.stringify(userInfo)}`)
      return userInfo
    } catch (error) {
      logger.error('[XHS] Get user info failed:', error)
      return { nickname: '小红书用户' }
    }
  }

  async publish(content: PostContent): Promise<PostResult> {
    if (!this.page) return { success: false, error: 'Page not initialized' }

    try {
      logger.info('[XHS] Starting publish...')

      // 导航到发布页
      await this.page.goto(this.publishUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.page.waitForTimeout(3000)

      // 上传图片
      if (content.imagePaths.length > 0) {
        await this.uploadImages(content.imagePaths)
      }

      // 填写标题
      if (content.title) {
        await this.fillTitle(content.title)
      }

      // 填写正文
      await this.fillContent(content.text)

      // 添加话题标签
      if (content.hashtags && content.hashtags.length > 0) {
        await this.addHashtags(content.hashtags)
      }

      // 点击发布按钮
      await this.clickPublish()

      // 等待发布完成
      const published = await this.waitForPublishSuccess()

      if (published) {
        logger.info('[XHS] Publish success')
        return { success: true }
      } else {
        return { success: false, error: '发布超时' }
      }
    } catch (error) {
      logger.error('[XHS] Publish failed:', error)
      return { success: false, error: error instanceof Error ? error.message : '发布失败' }
    }
  }

  private async uploadImages(paths: string[]): Promise<void> {
    if (!this.page) return

    // 小红书发布页的图片上传
    const uploadInput = await this.page.$('input[type="file"]')
    if (uploadInput) {
      await uploadInput.setInputFiles(paths)
      logger.info(`[XHS] Uploaded ${paths.length} images`)
      await this.page.waitForTimeout(3000) // 等待上传完成
    } else {
      logger.warn('[XHS] Upload input not found')
    }
  }

  private async fillTitle(title: string): Promise<void> {
    if (!this.page) return

    // 标题输入框
    const titleInput = await this.page.$('#title, [placeholder*="标题"], .title-input input')
    if (titleInput) {
      await titleInput.fill(title)
      logger.info(`[XHS] Title filled: ${title}`)
    }
  }

  private async fillContent(text: string): Promise<void> {
    if (!this.page) return

    // 正文输入框（小红书使用 contenteditable div）
    const contentEditor = await this.page.$('#post-textarea, [contenteditable="true"], .ql-editor, .content-editor')
    if (contentEditor) {
      await contentEditor.click()
      await contentEditor.fill(text)
      logger.info('[XHS] Content filled')
      await this.page.waitForTimeout(1000)
    }
  }

  private async addHashtags(hashtags: string[]): Promise<void> {
    if (!this.page || hashtags.length === 0) return

    for (const tag of hashtags) {
      // 在正文末尾输入 # 触发话题选择
      const contentEditor = await this.page.$('#post-textarea, [contenteditable="true"], .ql-editor')
      if (contentEditor) {
        await contentEditor.click()
        await this.page.keyboard.type(` #${tag} `)
        await this.page.waitForTimeout(1000)

        // 尝试点击话题建议
        const suggestion = await this.page.$(`.topic-item:has-text("${tag}"), [class*="topic"]:has-text("${tag}")`)
        if (suggestion) {
          await suggestion.click()
          await this.page.waitForTimeout(500)
        }
      }
    }
    logger.info(`[XHS] Added ${hashtags.length} hashtags`)
  }

  private async clickPublish(): Promise<void> {
    if (!this.page) return

    // 发布按钮
    const publishBtn = await this.page.$('button:has-text("发布"), .publish-btn, [class*="publish"] button')
    if (publishBtn) {
      await publishBtn.click()
      logger.info('[XHS] Publish button clicked')
    } else {
      throw new Error('Publish button not found')
    }
  }

  private async waitForPublishSuccess(timeout = 30000): Promise<boolean> {
    if (!this.page) return false

    try {
      // 等待成功提示或页面跳转
      await Promise.race([
        this.page.waitForSelector('.success-toast, [class*="success"], :text("发布成功")', { timeout }),
        this.page.waitForURL('**/creator/home**', { timeout })
      ])
      return true
    } catch {
      return false
    }
  }
}
