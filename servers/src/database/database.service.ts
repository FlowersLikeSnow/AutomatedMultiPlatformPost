import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database.Database

  constructor(private configService: ConfigService) {
    const dbPath = this.configService.get<string>('DATABASE_PATH', './data/app.db')
    const dbDir = dirname(dbPath)

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  onModuleInit(): void {
    this.initMigrations()
    this.runMigrations()
    this.seedInitialData()
  }

  getDb(): Database.Database {
    return this.db
  }

  private initMigrations(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `)
  }

  private runMigrations(): void {
    const migrations = this.getMigrations()
    const applied = new Set(
      this.db
        .prepare('SELECT version FROM schema_migrations')
        .all()
        .map((r: any) => r.version)
    )

    for (const migration of migrations) {
      if (!applied.has(migration.version)) {
        console.log(`[DB] Applying migration: ${migration.version} - ${migration.name}`)
        this.db.exec(migration.sql)
        this.db
          .prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
          .run(migration.version, migration.name)
      }
    }
  }

  private seedInitialData(): void {
    // Seed platforms if not exist
    const platformCount = (this.db.prepare('SELECT COUNT(*) as count FROM platforms').get() as any).count
    if (platformCount === 0) {
      const insertPlatform = this.db.prepare(
        'INSERT INTO platforms (id, name, code, icon, description) VALUES (?, ?, ?, ?, ?)'
      )
      insertPlatform.run('p1', '小红书', 'xiaohongshu', '', '种草分享平台')
      insertPlatform.run('p2', '抖音', 'douyin', '', '短视频平台')
      insertPlatform.run('p3', '快手', 'kuaishou', '', '短视频平台')
      console.log('[DB] Seeded platforms')
    }

    // Seed super admin if not exist
    const adminCount = (this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'").get() as any).count
    if (adminCount === 0) {
      const bcrypt = require('bcrypt')
      const passwordHash = bcrypt.hashSync('snrh0902', 10)
      this.db.prepare(`
        INSERT INTO users (id, username, phone, password_hash, role, points_remaining, status)
        VALUES (?, ?, ?, ?, 'super_admin', 99999, 'active')
      `).run('sa-001', '超级管理员', '17674656046', passwordHash)
      console.log('[DB] Seeded super admin (17674656046 / snrh0902)')
    }

    // Seed default settings
    const settingsCount = (this.db.prepare('SELECT COUNT(*) as count FROM settings').get() as any).count
    if (settingsCount === 0) {
      const insertSetting = this.db.prepare(
        'INSERT INTO settings (id, key, value, description) VALUES (?, ?, ?, ?)'
      )
      insertSetting.run('s1', 'points_per_post', '5', '每次发帖消耗积分')
      console.log('[DB] Seeded default settings')
    }
  }

  private getMigrations(): Array<{ version: string; name: string; sql: string }> {
    return [
      {
        version: '001',
        name: 'create_users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'admin', 'user')),
            avatar TEXT DEFAULT '',
            points_remaining INTEGER NOT NULL DEFAULT 0,
            points_consumed INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'banned', 'inactive')),
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            last_login_at TEXT,
            last_login_ip TEXT
          );
          CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
          CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        `
      },
      {
        version: '002',
        name: 'create_platforms',
        sql: `
          CREATE TABLE IF NOT EXISTS platforms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL UNIQUE,
            icon TEXT DEFAULT '',
            description TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'active'
          );
        `
      },
      {
        version: '003',
        name: 'create_platform_accounts',
        sql: `
          CREATE TABLE IF NOT EXISTS platform_accounts (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            user_id TEXT NOT NULL REFERENCES users(id),
            platform_id TEXT NOT NULL REFERENCES platforms(id),
            cookies TEXT,
            user_info_json TEXT,
            status TEXT NOT NULL DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'expired', 'error')),
            logged_in_at TEXT,
            expires_at TEXT,
            UNIQUE(user_id, platform_id)
          );
          CREATE INDEX IF NOT EXISTS idx_pa_user ON platform_accounts(user_id);
          CREATE INDEX IF NOT EXISTS idx_pa_platform ON platform_accounts(platform_id);
        `
      },
      {
        version: '004',
        name: 'create_post_templates',
        sql: `
          CREATE TABLE IF NOT EXISTS post_templates (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            user_id TEXT NOT NULL REFERENCES users(id),
            name TEXT NOT NULL,
            text_prompt TEXT NOT NULL DEFAULT '',
            image_style TEXT NOT NULL DEFAULT '',
            hashtags TEXT NOT NULL DEFAULT '[]',
            category TEXT DEFAULT 'general',
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
          );
          CREATE INDEX IF NOT EXISTS idx_pt_user ON post_templates(user_id);
        `
      },
      {
        version: '005',
        name: 'create_posts',
        sql: `
          CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            user_id TEXT NOT NULL REFERENCES users(id),
            template_id TEXT REFERENCES post_templates(id),
            platform_id TEXT NOT NULL REFERENCES platforms(id),
            content_text TEXT,
            image_urls TEXT DEFAULT '[]',
            video_url TEXT,
            hashtags TEXT DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'generating', 'publishing', 'published', 'failed', 'cancelled')),
            error_message TEXT,
            platform_post_id TEXT,
            published_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
          );
          CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
          CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform_id);
          CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
        `
      },
      {
        version: '006',
        name: 'create_redeem_codes',
        sql: `
          CREATE TABLE IF NOT EXISTS redeem_codes (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            code TEXT NOT NULL UNIQUE,
            points_value INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'unused' CHECK(status IN ('unused', 'used', 'expired')),
            used_by TEXT REFERENCES users(id),
            used_at TEXT,
            expires_at TEXT,
            created_by TEXT REFERENCES users(id),
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
          );
          CREATE INDEX IF NOT EXISTS idx_rc_code ON redeem_codes(code);
          CREATE INDEX IF NOT EXISTS idx_rc_status ON redeem_codes(status);
        `
      },
      {
        version: '007',
        name: 'create_consumption_records',
        sql: `
          CREATE TABLE IF NOT EXISTS consumption_records (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            user_id TEXT NOT NULL REFERENCES users(id),
            post_id TEXT REFERENCES posts(id),
            points INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('post', 'redeem', 'admin_adjust', 'refund')),
            description TEXT DEFAULT '',
            balance_after INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
          );
          CREATE INDEX IF NOT EXISTS idx_cr_user ON consumption_records(user_id);
          CREATE INDEX IF NOT EXISTS idx_cr_created ON consumption_records(created_at);
        `
      },
      {
        version: '008',
        name: 'create_settings',
        sql: `
          CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL DEFAULT '',
            description TEXT DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
          );
        `
      },
      {
        version: '009',
        name: 'post_platforms_and_nullable_platform',
        sql: `
          -- Create post_platforms table for tracking per-platform publish status
          CREATE TABLE IF NOT EXISTS post_platforms (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            post_id TEXT NOT NULL REFERENCES posts(id),
            platform_id TEXT NOT NULL REFERENCES platforms(id),
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','publishing','published','failed')),
            platform_post_id TEXT,
            error_message TEXT,
            published_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
          );
          CREATE INDEX IF NOT EXISTS idx_pp_post ON post_platforms(post_id);
          CREATE INDEX IF NOT EXISTS idx_pp_platform ON post_platforms(platform_id);
          CREATE INDEX IF NOT EXISTS idx_pp_status ON post_platforms(status);

          -- Recreate posts table with nullable platform_id and new status values
          CREATE TABLE IF NOT EXISTS posts_new (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            user_id TEXT NOT NULL REFERENCES users(id),
            template_id TEXT REFERENCES post_templates(id),
            platform_id TEXT REFERENCES platforms(id),
            content_text TEXT,
            image_urls TEXT DEFAULT '[]',
            video_url TEXT,
            hashtags TEXT DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'generating', 'content_ready', 'publishing', 'published', 'partial_failed', 'failed', 'cancelled')),
            error_message TEXT,
            platform_post_id TEXT,
            published_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
          );

          -- Copy existing data
          INSERT OR IGNORE INTO posts_new SELECT * FROM posts;

          -- Drop old table and rename new one
          DROP TABLE IF EXISTS posts;
          ALTER TABLE posts_new RENAME TO posts;

          -- Recreate indexes
          CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
          CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform_id);
          CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
        `
      }
    ]
  }
}
