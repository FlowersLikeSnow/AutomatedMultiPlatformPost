import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'

@Injectable()
export class PlatformAccountsService {
  constructor(private db: DatabaseService) {}

  findByUser(userId: string) {
    return this.db.getDb().prepare(`
      SELECT pa.*, p.name as platform_name, p.code as platform_code, p.icon as platform_icon
      FROM platform_accounts pa
      JOIN platforms p ON pa.platform_id = p.id
      WHERE pa.user_id = ?
    `).all(userId)
  }

  updateStatus(id: string, status: string, userInfo?: string) {
    const database = this.db.getDb()
    const account = database.prepare('SELECT * FROM platform_accounts WHERE id = ?').get(id) as any
    if (!account) throw new NotFoundException('账号不存在')

    database.prepare("UPDATE platform_accounts SET status = ?, logged_in_at = datetime('now', 'localtime'), user_info_json = COALESCE(?, user_info_json) WHERE id = ?")
      .run(status, userInfo || null, id)
    return { success: true }
  }

  upsert(userId: string, platformId: string, status: string, userInfo?: string, cookies?: string) {
    const database = this.db.getDb()
    const existing = database.prepare('SELECT id FROM platform_accounts WHERE user_id = ? AND platform_id = ?').get(userId, platformId) as any

    if (existing) {
      database.prepare("UPDATE platform_accounts SET status = ?, cookies = COALESCE(?, cookies), user_info_json = COALESCE(?, user_info_json), logged_in_at = datetime('now', 'localtime') WHERE id = ?")
        .run(status, cookies, userInfo, existing.id)
    } else {
      database.prepare(`
        INSERT INTO platform_accounts (user_id, platform_id, status, cookies, user_info_json, logged_in_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run(userId, platformId, status, cookies, userInfo)
    }
    return { success: true }
  }
}
