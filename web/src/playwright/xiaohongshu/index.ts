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
    return 'https://creator.xiaohongshu.com/publish/publish?from=tab_switch&target=image'
  }

  protected getHomeDomain(): string {
    return 'creator.xiaohongshu.com'
  }

  async getUserInfo(): Promise<PlatformUserInfo | null> {
    if (!this.page) return null

    try {
      logger.info('[XHS] Getting user info...')
      await this.page.goto(this.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await this.page.waitForTimeout(2000)

      const userInfo = await this.page.evaluate(() => {
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
      logger.info('[XHS] Starting publish flow...')
      logger.info(`[XHS] Content: text="${content.text?.substring(0, 50)}...", images=${content.imagePaths?.length || 0}, hashtags=${content.hashtags?.length || 0}`)

      // Step 1: Navigate to publish page
      logger.info('[XHS] Step 1: Navigate to publish page')
      const currentUrl = this.page.url()
      if (currentUrl.includes('publish/publish')) {
        await this.page.goto(this.publishUrl, { timeout: 30000 })
        logger.info('[XHS] Navigated to publish page')
      } else {
        logger.info('[XHS] Already on publish page')
      }
      await this.page.waitForSelector('.header-tabs', { timeout: 10000 })
      logger.info('[XHS] Header tabs loaded')
      // 点击 上传图文 按钮 (选择可见的 tab，带 data-hp-bound 属性，排除隐藏的)
      try {
        // 找到包含"上传图文"文本且可见的 creator-tab (带 data-hp-bound 且没有 inline opacity)
        const tabs = await this.page.$$('.header-tabs .creator-tab[data-hp-bound]:not([style*="opacity: 1e-05"])')
        let clicked = false
        for (const tab of tabs) {
          const text = await tab.textContent()
          if (text?.includes('上传图文')) {
            await tab.click({ force: true })
            logger.info('[XHS] Clicked "上传图文" tab')
            clicked = true
            break
          }
        }
        if (!clicked) {
          logger.warn('[XHS] "上传图文" tab not found')
        }
      } catch (error) {
        logger.error('[XHS] Failed to click "上传图文":', error)
      }
      await this.page.waitForTimeout(2000)

      // Step 2: Check for image upload buttons
      logger.info('[XHS] Step 2: Check image upload buttons')
      const uploadButtons = await this.page.$$('.image-upload-buttons button')
      if (uploadButtons.length < 2) {
        logger.error('[XHS] Image upload buttons not found')
        return { success: false, error: '找不到图片上传按钮' }
      }
      logger.info('[XHS] Found image upload buttons')

      // Step 3: Check if post has images
      const hasImages = content.imagePaths && content.imagePaths.length > 0
      if (hasImages) {
        // Has images: click first button "生成图片"
        logger.info('[XHS] Step 3: Has images, clicking "生成图片" button')
        await uploadButtons[0].click()
        logger.info('[XHS] Clicked "生成图片" button')
        await this.page.waitForTimeout(2000)

        // Wait for cover list and randomly select one
        logger.info('[XHS] Step 3.1: Wait for cover list and select one')
        await this.page.waitForSelector('.cover-list-container', { timeout: 30000 })
        const coverItems = await this.page.$$('.cover-item-container')
        if (coverItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * coverItems.length)
          await coverItems[randomIndex].click()
          logger.info(`[XHS] Selected cover item ${randomIndex + 1}/${coverItems.length}`)
        }
        await this.page.waitForTimeout(1000)

        // Click confirm button under overview-footer
        logger.info('[XHS] Step 3.2: Click confirm button')
        const confirmBtn = await this.page.$('.overview-footer button')
        if (confirmBtn) {
          await confirmBtn.click()
          logger.info('[XHS] Clicked confirm button')
        }
        await this.page.waitForTimeout(2000)

        // Upload images at the bottom
        logger.info('[XHS] Step 3.3: Upload images')
        const addImageBtn = await this.page.$('text=添加图片')
        if (addImageBtn) {
          await addImageBtn.click()
          await this.page.waitForTimeout(1000)
        }

        // Find file input and upload images
        const fileInput = await this.page.$('input[type="file"]')
        if (fileInput && content.imagePaths.length > 0) {
          await fileInput.setInputFiles(content.imagePaths)
          logger.info(`[XHS] Uploaded ${content.imagePaths.length} images`)
          await this.page.waitForTimeout(3000)
        }
      } else {
        // No images: click second button "文字配图"
        logger.info('[XHS] Step 3: No images, clicking "文字配图" button')
        await uploadButtons[1].click()
        logger.info('[XHS] Clicked "文字配图" button')
      }

      // Step 4: Wait for editor-paragraph and fill content
      logger.info('[XHS] Step 4: Wait for editor-paragraph and fill content')
      await this.page.waitForSelector('.editor-paragraph', { timeout: 10000 })
      const editorParagraph = await this.page.$('.editor-paragraph')
      if (editorParagraph) {
        await editorParagraph.click()
        // Extract text without hashtags
        const textWithoutHashtags = content.text?.replace(/#[^\s#]+/g, '').trim() || ''
        await editorParagraph.fill(textWithoutHashtags)
        logger.info(`[XHS] Filled content: "${textWithoutHashtags.substring(0, 50)}..."`)
      }
      await this.page.waitForTimeout(1000)

      // Step 5: Click "生成图片" part (edit-text-button-text)
      logger.info('[XHS] Step 5: Click "生成图片" button')
      const generateImageBtn = await this.page.$('.edit-text-button-text')
      if (generateImageBtn) {
        await generateImageBtn.click()
        logger.info('[XHS] Clicked "生成图片" button')
      }
      await this.page.waitForTimeout(2000)

      // Step 6: Wait for cover list and randomly select one (only if no images originally)
      if (!hasImages) {
        logger.info('[XHS] Step 6: Wait for cover list and select one')
        await this.page.waitForSelector('.cover-list-container', { timeout: 30000 })
        const coverItems = await this.page.$$('.cover-item-container')
        if (coverItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * coverItems.length)
          await coverItems[randomIndex].click()
          logger.info(`[XHS] Selected cover item ${randomIndex + 1}/${coverItems.length}`)
        } else {
          logger.warn('[XHS] No cover items found')
        }
        await this.page.waitForTimeout(1000)

        // Step 7: Click button under overview-footer
        logger.info('[XHS] Step 7: Click confirm button')
        const confirmBtn = await this.page.$('.overview-footer button')
        if (confirmBtn) {
          await confirmBtn.click()
          logger.info('[XHS] Clicked confirm button')
        }
        await this.page.waitForTimeout(2000)
      }

      // Step 8: Wait for markers-container
      logger.info('[XHS] Step 8: Wait for markers-container')
      await this.page.waitForSelector('.markers-container', { timeout: 15000 })
      logger.info('[XHS] markers-container appeared')

      // Step 9: Wait for ProseMirror and process hashtags
      logger.info('[XHS] Step 9: Process hashtags')
      await this.page.waitForSelector('.ProseMirror', { timeout: 10000 })
      const firstP = await this.page.$('.ProseMirror p')
      if (firstP) {
        logger.info('[XHS] Found ProseMirror p element')
      }

      // Extract hashtags from content
      const hashtags = content.hashtags || []
      logger.info(`[XHS] Hashtags to add: ${hashtags.join(', ')}`)

      for (const tag of hashtags) {
        logger.info(`[XHS] Adding hashtag: #${tag}`)

        // Click on the editor area first
        const proseMirror = await this.page.$('.ProseMirror')
        if (proseMirror) {
          await proseMirror.click()
          await this.page.waitForTimeout(500)
        }

        // Type the hashtag
        await this.page.keyboard.type(` #${tag} `)
        await this.page.waitForTimeout(1500)

        // Wait for topic suggestion and select it
        const topicContainer = await this.page.$('#creator-editor-topic-container')
        if (topicContainer) {
          const firstItem = await topicContainer.$('.item')
          if (firstItem) {
            await firstItem.click()
            logger.info(`[XHS] Selected topic suggestion for: #${tag}`)
            await this.page.waitForTimeout(500)
          } else {
            // Press Enter if no suggestion
            await this.page.keyboard.press('Enter')
            logger.info(`[XHS] No suggestion, pressed Enter for: #${tag}`)
          }
        } else {
          await this.page.keyboard.press('Enter')
          logger.info(`[XHS] No topic container, pressed Enter for: #${tag}`)
        }
        await this.page.waitForTimeout(500)
      }

      // Step 10: Click publish button (ce-btn bg-red)
      logger.info('[XHS] Step 10: Click publish button')
      const publishBtn = await this.page.$('.ce-btn.bg-red')
      if (publishBtn) {
        await publishBtn.click()
        logger.info('[XHS] Clicked publish button')
      } else {
        logger.error('[XHS] Publish button not found')
        return { success: false, error: '找不到发布按钮' }
      }

      // Step 11: Wait for success message
      logger.info('[XHS] Step 11: Wait for publish success')
      try {
        await this.page.waitForSelector('text=发布成功', { timeout: 30000 })
        logger.info('[XHS] Publish success!')
        return { success: true }
      } catch {
        logger.warn('[XHS] Success message not found, checking URL...')
        // Check if redirected to home
        await this.page.waitForTimeout(3000)
        const url = this.page.url()
        if (url.includes('/home') || url.includes('/new/home')) {
          logger.info('[XHS] Redirected to home, assuming success')
          return { success: true }
        }
        return { success: false, error: '发布超时' }
      }
    } catch (error) {
      logger.error('[XHS] Publish failed:', error)
      return { success: false, error: error instanceof Error ? error.message : '发布失败' }
    }
  }
}
