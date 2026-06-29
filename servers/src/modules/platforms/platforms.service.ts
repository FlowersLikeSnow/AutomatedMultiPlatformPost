import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'

@Injectable()
export class PlatformsService {
  constructor(private db: DatabaseService) {}

  findAll() {
    return this.db.getDb().prepare('SELECT * FROM platforms WHERE status = ?').all('active')
  }

  findById(id: string) {
    return this.db.getDb().prepare('SELECT * FROM platforms WHERE id = ?').get(id)
  }

  findByCode(code: string) {
    return this.db.getDb().prepare('SELECT * FROM platforms WHERE code = ?').get(code)
  }
}
