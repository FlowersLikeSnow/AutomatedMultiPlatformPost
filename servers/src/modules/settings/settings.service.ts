import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { v4 as uuid } from 'uuid'

@Injectable()
export class SettingsService {
  constructor(private db: DatabaseService) {}

  findAll() {
    return this.db.getDb().prepare('SELECT * FROM settings ORDER BY key').all()
  }

  findByKey(key: string): string | null {
    const row = this.db.getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
    return row?.value || null
  }

  upsert(key: string, value: string, description?: string) {
    const database = this.db.getDb()
    const existing = database.prepare('SELECT id FROM settings WHERE key = ?').get(key)

    if (existing) {
      database.prepare("UPDATE settings SET value = ?, updated_at = datetime('now', 'localtime') WHERE key = ?").run(value, key)
    } else {
      database.prepare('INSERT INTO settings (id, key, value, description) VALUES (?, ?, ?, ?)').run(uuid(), key, value, description || '')
    }
    return { key, value }
  }

  update(key: string, value: string) {
    const database = this.db.getDb()
    database.prepare("UPDATE settings SET value = ?, updated_at = datetime('now', 'localtime') WHERE key = ?").run(value, key)
    return { key, value }
  }
}
