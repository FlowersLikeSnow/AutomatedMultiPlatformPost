import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { AiService } from '../ai/ai.service'
import { v4 as uuid } from 'uuid'

@Injectable()
export class PostsService {
  constructor(
    private db: DatabaseService,
    private aiService: AiService
  ) {}

  findAll(userId: string, params?: { page?: number; pageSize?: number; status?: string; platformId?: string }) {
    const database = this.db.getDb()
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const offset = (page - 1) * pageSize

    let where = 'p.user_id = ?'
    const queryParams: any[] = [userId]

    if (params?.status) {
      where += ' AND p.status = ?'
      queryParams.push(params.status)
    }
    if (params?.platformId) {
      where += ' AND p.platform_id = ?'
      queryParams.push(params.platformId)
    }

    const total = (database.prepare(`SELECT COUNT(*) as count FROM posts p WHERE ${where}`).get(...queryParams) as any).count
    const items = database
      .prepare(
        `SELECT p.*, pt.name as template_name, pl.name as platform_name
        FROM posts p
        LEFT JOIN post_templates pt ON p.template_id = pt.id
        LEFT JOIN platforms pl ON p.platform_id = pl.id
        WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...queryParams, pageSize, offset)

    return { items, total, page, pageSize }
  }

  findById(id: string) {
    const item = this.db
      .getDb()
      .prepare(
        `SELECT p.*, pt.name as template_name, pl.name as platform_name
        FROM posts p
        LEFT JOIN post_templates pt ON p.template_id = pt.id
        LEFT JOIN platforms pl ON p.platform_id = pl.id
        WHERE p.id = ?`
      )
      .get(id)
    if (!item) throw new NotFoundException('记录不存在')
    return item
  }

  create(userId: string, data: any) {
    const id = uuid()
    this.db
      .getDb()
      .prepare(
        `INSERT INTO posts (id, user_id, template_id, platform_id, content_text, image_urls, hashtags, status, image_count, word_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        userId,
        data.template_id || null,
        data.platform_id || null,
        data.content_text || '',
        JSON.stringify(data.image_urls || []),
        Array.isArray(data.hashtags) ? data.hashtags.join(',') : data.hashtags || '',
        data.status || 'pending',
        data.image_count ?? 0,
        data.word_count ?? 30
      )

    // If status is 'generating', trigger async AI generation
    if (data.status === 'generating' && data.template_id) {
      this.generateContentAsync(id, data.template_id)
    }

    return this.findById(id)
  }

  private async generateContentAsync(postId: string, templateId: string): Promise<void> {
    try {
      // Get template details
      const template = this.db
        .getDb()
        .prepare('SELECT * FROM post_templates WHERE id = ?')
        .get(templateId) as any

      if (!template) {
        throw new Error('模板不存在')
      }

      // Generate text via AI
      const hashtags = template.hashtags ? template.hashtags.split(',').filter(Boolean) : []
      const result = await this.aiService.generateText({
        prompt: template.text_prompt,
        style: template.image_style,
        hashtags
      })

      // Update post with generated content
      this.db
        .getDb()
        .prepare(
          `UPDATE posts SET content_text = ?, status = 'content_ready' WHERE id = ?`
        )
        .run(result.text, postId)
    } catch (error) {
      // Update status to failed if generation fails
      const errorMsg = error instanceof Error ? error.message : 'AI 生成失败'
      this.db
        .getDb()
        .prepare(
          `UPDATE posts SET status = 'failed', error_message = ? WHERE id = ?`
        )
        .run(errorMsg, postId)
    }
  }

  update(id: string, data: any) {
    const database = this.db.getDb()
    const post = database.prepare('SELECT * FROM posts WHERE id = ?').get(id)
    if (!post) throw new NotFoundException('记录不存在')

    const updates: string[] = []
    const values: any[] = []

    if (data.content_text !== undefined) {
      updates.push('content_text = ?')
      values.push(data.content_text)
    }
    if (data.image_urls !== undefined) {
      updates.push('image_urls = ?')
      values.push(JSON.stringify(data.image_urls))
    }
    if (data.hashtags !== undefined) {
      updates.push('hashtags = ?')
      values.push(Array.isArray(data.hashtags) ? data.hashtags.join(',') : data.hashtags)
    }

    if (updates.length === 0) return this.findById(id)

    values.push(id)
    database.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  updateStatus(id: string, status: string, error?: string) {
    const database = this.db.getDb()
    const post = database.prepare('SELECT * FROM posts WHERE id = ?').get(id)
    if (!post) throw new NotFoundException('记录不存在')

    const updates = ['status = ?']
    const values: any[] = [status]

    if (error) {
      updates.push('error_message = ?')
      values.push(error)
    }
    if (status === 'published') {
      updates.push("published_at = datetime('now', 'localtime')")
    }
    values.push(id)

    database.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return { success: true }
  }

  delete(id: string) {
    const database = this.db.getDb()
    const post = database.prepare('SELECT * FROM posts WHERE id = ?').get(id)
    if (!post) throw new NotFoundException('记录不存在')

    // Delete related post_platforms first
    database.prepare('DELETE FROM post_platforms WHERE post_id = ?').run(id)
    // Delete the post
    database.prepare('DELETE FROM posts WHERE id = ?').run(id)

    return { success: true }
  }

  // Post-Platform methods
  findPlatforms(postId: string) {
    return this.db
      .getDb()
      .prepare(
        `SELECT pp.*, pl.name as platform_name, pl.code as platform_code
        FROM post_platforms pp
        JOIN platforms pl ON pp.platform_id = pl.id
        WHERE pp.post_id = ?
        ORDER BY pp.created_at`
      )
      .all(postId)
  }

  addPlatforms(postId: string, platformIds: string[]) {
    const database = this.db.getDb()
    const insert = database.prepare(
      `INSERT INTO post_platforms (id, post_id, platform_id, status)
       VALUES (?, ?, ?, 'pending')`
    )

    const insertMany = database.transaction((ids: string[]) => {
      for (const platformId of ids) {
        insert.run(uuid(), postId, platformId)
      }
    })

    insertMany(platformIds)
    return { success: true }
  }

  updatePlatformStatus(postId: string, platformId: string, data: { status: string; error?: string; platformPostId?: string }) {
    const database = this.db.getDb()
    const record = database
      .prepare('SELECT * FROM post_platforms WHERE post_id = ? AND platform_id = ?')
      .get(postId, platformId)

    if (!record) throw new NotFoundException('平台记录不存在')

    const updates: string[] = ['status = ?']
    const values: any[] = [data.status]

    if (data.error) {
      updates.push('error_message = ?')
      values.push(data.error)
    }
    if (data.platformPostId) {
      updates.push('platform_post_id = ?')
      values.push(data.platformPostId)
    }
    if (data.status === 'published') {
      updates.push("published_at = datetime('now', 'localtime')")
    }

    values.push(postId, platformId)
    database.prepare(`UPDATE post_platforms SET ${updates.join(', ')} WHERE post_id = ? AND platform_id = ?`).run(...values)
    return { success: true }
  }

  getStatistics(userId: string) {
    const database = this.db.getDb()

    const totalPosts = (database.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId) as any).count
    const user = database.prepare('SELECT points_remaining, points_consumed FROM users WHERE id = ?').get(userId) as any

    const platformStatus = database
      .prepare(
        `SELECT pl.code, pl.name, pa.status
        FROM platform_accounts pa JOIN platforms pl ON pa.platform_id = pl.id
        WHERE pa.user_id = ?`
      )
      .all(userId)

    const recentPosts = database
      .prepare(
        `SELECT p.*, pt.name as template_name, pl.name as platform_name FROM posts p
        LEFT JOIN post_templates pt ON p.template_id = pt.id
        LEFT JOIN platforms pl ON p.platform_id = pl.id
        WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 5`
      )
      .all(userId)

    return {
      totalPosts,
      pointsBalance: user?.points_remaining || 0,
      pointsConsumed: user?.points_consumed || 0,
      platformStatus,
      recentPosts
    }
  }
}
