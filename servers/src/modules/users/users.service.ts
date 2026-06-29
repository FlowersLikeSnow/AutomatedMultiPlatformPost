import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import * as bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  findAll(params?: { page?: number; pageSize?: number; keyword?: string; role?: string }) {
    const database = this.db.getDb()
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const offset = (page - 1) * pageSize

    let where = '1=1'
    const queryParams: any[] = []

    if (params?.keyword) {
      where += ' AND (username LIKE ? OR phone LIKE ?)'
      queryParams.push(`%${params.keyword}%`, `%${params.keyword}%`)
    }
    if (params?.role) {
      where += ' AND role = ?'
      queryParams.push(params.role)
    }

    const total = (database.prepare(`SELECT COUNT(*) as count FROM users WHERE ${where}`).get(...queryParams) as any).count
    const items = database.prepare(`SELECT id, username, phone, role, avatar, points_remaining, points_consumed, status, created_at, updated_at, last_login_at, last_login_ip FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...queryParams, pageSize, offset)

    return { items, total, page, pageSize }
  }

  findById(id: string) {
    const user = this.db.getDb().prepare('SELECT id, username, phone, role, avatar, points_remaining, points_consumed, status, created_at, updated_at, last_login_at, last_login_ip FROM users WHERE id = ?').get(id) as any
    if (!user) throw new NotFoundException('用户不存在')
    return user
  }

  async create(data: { username: string; phone: string; password: string; role?: string; points_remaining?: number }) {
    const database = this.db.getDb()
    const existing = database.prepare('SELECT id FROM users WHERE phone = ? OR username = ?').get(data.phone, data.username)
    if (existing) throw new BadRequestException('手机号或用户名已存在')

    const passwordHash = await bcrypt.hash(data.password, 10)
    const id = uuid()
    database.prepare(`
      INSERT INTO users (id, username, phone, password_hash, role, points_remaining, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(id, data.username, data.phone, passwordHash, data.role || 'user', data.points_remaining || 0)

    return this.findById(id)
  }

  update(id: string, data: { username?: string; role?: string; points_remaining?: number; status?: string }) {
    const database = this.db.getDb()
    const user = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    if (!user) throw new NotFoundException('用户不存在')

    const updates: string[] = []
    const values: any[] = []

    if (data.username !== undefined) { updates.push('username = ?'); values.push(data.username) }
    if (data.role !== undefined) { updates.push('role = ?'); values.push(data.role) }
    if (data.points_remaining !== undefined) { updates.push('points_remaining = ?'); values.push(data.points_remaining) }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status) }

    updates.push("updated_at = datetime('now', 'localtime')")
    values.push(id)

    database.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  delete(id: string) {
    const database = this.db.getDb()
    const user = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    if (!user) throw new NotFoundException('用户不存在')
    if (user.role === 'super_admin') throw new BadRequestException('不能删除超级管理员')

    database.prepare('DELETE FROM users WHERE id = ?').run(id)
    return { success: true }
  }

  async resetPassword(id: string, newPassword: string) {
    const database = this.db.getDb()
    const user = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    if (!user) throw new NotFoundException('用户不存在')

    const passwordHash = await bcrypt.hash(newPassword, 10)
    database.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(passwordHash, id)
    return { success: true }
  }

  adjustPoints(id: string, points: number, description: string) {
    const database = this.db.getDb()
    return database.transaction(() => {
      const user = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
      if (!user) throw new NotFoundException('用户不存在')

      const newBalance = user.points_remaining + points
      if (newBalance < 0) throw new BadRequestException('积分不足')

      database.prepare("UPDATE users SET points_remaining = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(newBalance, id)

      const recordId = uuid()
      database.prepare(`
        INSERT INTO consumption_records (id, user_id, points, type, description, balance_after)
        VALUES (?, ?, ?, 'admin_adjust', ?, ?)
      `).run(recordId, id, points, description, newBalance)

      return { balance: newBalance }
    })()
  }
}
