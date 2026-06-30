import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { v4 as uuid } from 'uuid'

@Injectable()
export class PostsService {
  constructor(private db: DatabaseService) {}

  findAll(userId: string, params?: { page?: number; pageSize?: number; status?: string; platformId?: string }) {
    const database = this.db.getDb()
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const offset = (page - 1) * pageSize

    let where = 'p.user_id = ?'
    const queryParams: any[] = [userId]

    if (params?.status) { where += ' AND p.status = ?'; queryParams.push(params.status) }
    if (params?.platformId) { where += ' AND p.platform_id = ?'; queryParams.push(params.platformId) }

    const total = (database.prepare(`SELECT COUNT(*) as count FROM posts p WHERE ${where}`).get(...queryParams) as any).count
    const items = database.prepare(`
      SELECT p.*, pl.name as platform_name
      FROM posts p LEFT JOIN platforms pl ON p.platform_id = pl.id
      WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).all(...queryParams, pageSize, offset)

    return { items, total, page, pageSize }
  }

  findById(id: string) {
    const item = this.db.getDb().prepare('SELECT p.*, pl.name as platform_name FROM posts p LEFT JOIN platforms pl ON p.platform_id = pl.id WHERE p.id = ?').get(id)
    if (!item) throw new NotFoundException('记录不存在')
    return item
  }

  create(userId: string, data: any) {
    const id = uuid()
    this.db.getDb().prepare(`
      INSERT INTO posts (id, user_id, template_id, platform_id, content_text, image_urls, hashtags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, data.template_id || null, data.platform_id, data.content_text || '', JSON.stringify(data.image_urls || []), Array.isArray(data.hashtags) ? data.hashtags.join(',') : (data.hashtags || ''), data.status || 'pending')
    return this.findById(id)
  }

  updateStatus(id: string, status: string, error?: string) {
    const database = this.db.getDb()
    const post = database.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any
    if (!post) throw new NotFoundException('记录不存在')

    const updates = ["status = ?"]
    const values: any[] = [status]

    if (error) { updates.push('error_message = ?'); values.push(error) }
    if (status === 'published') { updates.push("published_at = datetime('now', 'localtime')") }
    values.push(id)

    database.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return { success: true }
  }

  getStatistics(userId: string) {
    const database = this.db.getDb()

    const totalPosts = (database.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId) as any).count
    const user = database.prepare('SELECT points_remaining, points_consumed FROM users WHERE id = ?').get(userId) as any

    const platformStatus = database.prepare(`
      SELECT pl.code, pl.name, pa.status
      FROM platform_accounts pa JOIN platforms pl ON pa.platform_id = pl.id
      WHERE pa.user_id = ?
    `).all(userId)

    const recentPosts = database.prepare(`
      SELECT p.*, pl.name as platform_name FROM posts p
      LEFT JOIN platforms pl ON p.platform_id = pl.id
      WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 5
    `).all(userId)

    return {
      totalPosts,
      pointsBalance: user?.points_remaining || 0,
      pointsConsumed: user?.points_consumed || 0,
      platformStatus,
      recentPosts
    }
  }
}
