import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'

@Injectable()
export class ConsumptionService {
  constructor(private db: DatabaseService) {}

  findAll(params?: { page?: number; pageSize?: number; userId?: string; type?: string; startDate?: string; endDate?: string }) {
    const database = this.db.getDb()
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const offset = (page - 1) * pageSize

    let where = '1=1'
    const queryParams: any[] = []

    if (params?.userId) { where += ' AND cr.user_id = ?'; queryParams.push(params.userId) }
    if (params?.type) { where += ' AND cr.type = ?'; queryParams.push(params.type) }
    if (params?.startDate) { where += ' AND cr.created_at >= ?'; queryParams.push(params.startDate) }
    if (params?.endDate) { where += ' AND cr.created_at <= ?'; queryParams.push(params.endDate) }

    const total = (database.prepare(`SELECT COUNT(*) as count FROM consumption_records cr WHERE ${where}`).get(...queryParams) as any).count
    const items = database.prepare(`
      SELECT cr.*, u.username as user_name
      FROM consumption_records cr LEFT JOIN users u ON cr.user_id = u.id
      WHERE ${where} ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
    `).all(...queryParams, pageSize, offset)

    return { items, total, page, pageSize }
  }

  getStatistics() {
    const database = this.db.getDb()
    const totalConsumed = Math.abs((database.prepare("SELECT COALESCE(SUM(points), 0) as total FROM consumption_records WHERE points < 0").get() as any).total)
    const totalRecharged = (database.prepare("SELECT COALESCE(SUM(points), 0) as total FROM consumption_records WHERE points > 0").get() as any).total

    return { totalConsumed, totalRecharged, totalPoints: totalRecharged - totalConsumed }
  }
}
