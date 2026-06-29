import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { v4 as uuid } from 'uuid'
import { randomBytes } from 'crypto'

@Injectable()
export class RedeemService {
  constructor(private db: DatabaseService) {}

  findAll(params?: { page?: number; pageSize?: number; status?: string }) {
    const database = this.db.getDb()
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const offset = (page - 1) * pageSize

    let where = '1=1'
    const queryParams: any[] = []
    if (params?.status) { where += ' AND rc.status = ?'; queryParams.push(params.status) }

    const total = (database.prepare(`SELECT COUNT(*) as count FROM redeem_codes rc WHERE ${where}`).get(...queryParams) as any).count
    const items = database.prepare(`
      SELECT rc.*, u.username as used_by_name
      FROM redeem_codes rc LEFT JOIN users u ON rc.used_by = u.id
      WHERE ${where} ORDER BY rc.created_at DESC LIMIT ? OFFSET ?
    `).all(...queryParams, pageSize, offset)

    return { items, total, page, pageSize }
  }

  create(data: { pointsValue: number; expiresAt?: string; count?: number; createdBy?: string }) {
    const database = this.db.getDb()
    const count = data.count || 1
    const results: any[] = []

    for (let i = 0; i < count; i++) {
      const id = uuid()
      const code = randomBytes(8).toString('hex').toUpperCase()
      database.prepare(`
        INSERT INTO redeem_codes (id, code, points_value, expires_at, created_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, code, data.pointsValue, data.expiresAt || null, data.createdBy || null)
      results.push(database.prepare('SELECT * FROM redeem_codes WHERE id = ?').get(id))
    }

    return results
  }

  use(userId: string, code: string) {
    const database = this.db.getDb()
    return database.transaction(() => {
      const redeem = database.prepare("SELECT * FROM redeem_codes WHERE code = ? AND status = 'unused'").get(code) as any
      if (!redeem) throw new NotFoundException('兑换码无效或已使用')

      if (redeem.expires_at && new Date(redeem.expires_at) < new Date()) {
        database.prepare("UPDATE redeem_codes SET status = 'expired' WHERE id = ?").run(redeem.id)
        throw new BadRequestException('兑换码已过期')
      }

      // Update redeem code
      database.prepare("UPDATE redeem_codes SET status = 'used', used_by = ?, used_at = datetime('now', 'localtime') WHERE id = ?")
        .run(userId, redeem.id)

      // Add points to user
      const user = database.prepare('SELECT points_remaining FROM users WHERE id = ?').get(userId) as any
      const newBalance = user.points_remaining + redeem.points_value
      database.prepare("UPDATE users SET points_remaining = ?, updated_at = datetime('now', 'localtime') WHERE id = ?")
        .run(newBalance, userId)

      // Record consumption
      database.prepare(`
        INSERT INTO consumption_records (id, user_id, points, type, description, balance_after)
        VALUES (?, ?, ?, 'redeem', ?, ?)
      `).run(uuid(), userId, redeem.points_value, `兑换码: ${code}`, newBalance)

      return { points: redeem.points_value, balance: newBalance }
    })()
  }
}
