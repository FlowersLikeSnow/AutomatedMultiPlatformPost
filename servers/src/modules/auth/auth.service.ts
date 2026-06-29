import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { DatabaseService } from '../../database/database.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService
  ) {}

  async validateUser(phone: string, password: string): Promise<any> {
    const db = this.databaseService.getDb()
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被禁用')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误')
    }

    const { password_hash, ...result } = user
    return result
  }

  async login(phone: string, password: string, ip?: string) {
    const user = await this.validateUser(phone, password)
    const payload = { sub: user.id, phone: user.phone, role: user.role }
    const token = this.jwtService.sign(payload)

    // Update last login info
    const db = this.databaseService.getDb()
    db.prepare(`
      UPDATE users
      SET last_login_at = datetime('now', 'localtime'),
          last_login_ip = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(ip || null, user.id)

    return {
      user,
      token
    }
  }

  async getProfile(userId: string) {
    const db = this.databaseService.getDb()
    const user = db.prepare('SELECT id, username, phone, role, avatar, points_remaining, points_consumed, status, created_at, updated_at, last_login_at, last_login_ip FROM users WHERE id = ?').get(userId) as any

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    return user
  }
}
