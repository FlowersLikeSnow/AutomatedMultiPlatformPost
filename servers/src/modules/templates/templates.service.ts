import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { v4 as uuid } from 'uuid'

@Injectable()
export class TemplatesService {
  constructor(private db: DatabaseService) {}

  findAll(userId: string, params?: { page?: number; pageSize?: number }) {
    const database = this.db.getDb()
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const offset = (page - 1) * pageSize

    const total = (database.prepare('SELECT COUNT(*) as count FROM post_templates WHERE user_id = ?').get(userId) as any).count
    const items = database.prepare('SELECT * FROM post_templates WHERE user_id = ? ORDER BY is_default DESC, created_at DESC LIMIT ? OFFSET ?').all(userId, pageSize, offset)

    return { items, total, page, pageSize }
  }

  findById(id: string) {
    const item = this.db.getDb().prepare('SELECT * FROM post_templates WHERE id = ?').get(id)
    if (!item) throw new NotFoundException('模板不存在')
    return item
  }

  create(userId: string, data: any) {
    const id = uuid()
    this.db.getDb().prepare(`
      INSERT INTO post_templates (id, user_id, name, text_prompt, image_style, hashtags, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, data.name, data.text_prompt || '', data.image_style || '', JSON.stringify(data.hashtags || []), data.category || 'general')
    return this.findById(id)
  }

  update(id: string, data: any) {
    const database = this.db.getDb()
    const item = database.prepare('SELECT * FROM post_templates WHERE id = ?').get(id)
    if (!item) throw new NotFoundException('模板不存在')

    const updates: string[] = []
    const values: any[] = []
    if (data.name) { updates.push('name = ?'); values.push(data.name) }
    if (data.text_prompt !== undefined) { updates.push('text_prompt = ?'); values.push(data.text_prompt) }
    if (data.image_style !== undefined) { updates.push('image_style = ?'); values.push(data.image_style) }
    if (data.hashtags !== undefined) { updates.push('hashtags = ?'); values.push(JSON.stringify(data.hashtags)) }
    if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category) }
    updates.push("updated_at = datetime('now', 'localtime')")
    values.push(id)

    database.prepare(`UPDATE post_templates SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  delete(id: string) {
    this.db.getDb().prepare('DELETE FROM post_templates WHERE id = ?').run(id)
    return { success: true }
  }

  setDefault(userId: string, id: string) {
    const database = this.db.getDb()
    database.prepare('UPDATE post_templates SET is_default = 0 WHERE user_id = ?').run(userId)
    database.prepare('UPDATE post_templates SET is_default = 1 WHERE id = ?').run(id)
    return { success: true }
  }
}
