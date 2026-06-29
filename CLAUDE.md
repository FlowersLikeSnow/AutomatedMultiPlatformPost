# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-platform automated posting system for Xiaohongshu, Douyin, and Kuaishou. Monorepo with Electron frontend (`web/`) and NestJS backend (`servers/`). AI content generation uses OpenAI for text and DALL-E for images (Electron main process), with prompt expansion via Aliyun DashScope/glm-5.

## Build and Development Commands

### Frontend (web/) — Electron + React

```bash
cd web
npm run dev            # Start Electron in dev mode (hot reload)
npm run build          # Typecheck + electron-vite build
npm run build:win      # Build Windows installer via electron-builder
npm run typecheck      # TypeScript type checking only
npm run lint           # Biome lint check
npm run format         # Biome auto-format
```

### Backend (servers/) — NestJS + SQLite

```bash
cd servers
npm run start:dev      # Start with watch mode (port 3000)
npm run build          # nest build to dist/
npm run start:prod     # Run production build
npm test               # Jest tests
npm run test:cov       # Jest with coverage
npm run lint           # Biome lint check
npm run format         # Biome auto-format
```

## Architecture

### Frontend (web/)

**Three-process architecture** via `electron-vite`:
- `src/main/` — Electron main process (window management, IPC, AI, Playwright)
- `src/preload/` — Context bridge exposing `window.app` API to renderer
- `src/renderer/` — React SPA (pages, stores, API clients)
- `src/shared/` — Types shared between processes (IPC channels, interfaces)
- `src/playwright/` — Browser automation for each platform

**Key patterns:**
- IPC channels defined in `src/shared/types.ts` as `IPC_CHANNELS` enum (format: `category:action`)
- All responses use `ApiResponse<T> = { code: number, data?: T, msg?: string }`
- State management via Valtio proxies in `src/renderer/src/stores/`
- AI image generation in main process (`src/main/ai/`) — adapter pattern
- LLM prompt expansion in main process (`src/main/llm/prompt-expander.ts`)
- Local images served via custom protocol `app-images://`
- Platform login/posting via Playwright with stealth plugin

**Adding a new IPC channel:**
1. Add to `IPC_CHANNELS` enum in `src/shared/types.ts`
2. Add to `ElectronAPI` interface in same file
3. Implement in `src/preload/index.ts` via `ipcRenderer.invoke()`
4. Handle in `src/main/ipc/` via `ipcMain.handle()`

### Backend (servers/)

**NestJS monolith** with 11 feature modules:
- `auth` — JWT authentication (Passport strategy)
- `users` — User CRUD with role-based access (super_admin/admin/user)
- `platforms` — Platform definitions
- `platform-accounts` — User platform sessions
- `templates` — Post templates with AI prompts
- `posts` — Published posts with status tracking
- `redeem` — Points redemption codes
- `consumption` — Points transaction records
- `ai` — OpenAI text generation proxy
- `upload` — Qiniu cloud avatar upload
- `settings` — Application settings (key-value)

**Database:** `better-sqlite3` with custom migration system in `src/database/database.service.ts`. Migrations run on startup, tracked in `schema_migrations` table. Uses WAL mode + foreign keys.

**Adding a migration:** Add to `getMigrations()` array with incremental version number, use `IF NOT EXISTS` for idempotency.

**Auth flow:** Global `JwtAuthGuard` + `RolesGuard`. Use `@Roles('admin')` decorator. Super admin bypasses all role checks. `@CurrentUser('sub')` extracts user ID from JWT.

## Configuration

**Config files use `.ENV` extension** (not `.env`). Both web/ and servers/ have their own `.ENV`.

### web/.ENV — AI services
```env
NEWAPI_API_KEY=...        # Image generation (DALL-E via NewAPI proxy)
NEWAPI_BASE_URL=...
NEWAPI_MODEL=...
LLM_API_KEY=...           # Prompt expansion (Aliyun DashScope)
LLM_BASE_URL=...
LLM_MODEL=glm-5
```

### servers/.ENV — Backend services
```env
OPENAI_API_KEY=...        # Text generation
OPENAI_BASE_URL=...
OPENAI_MODEL=...
QINIU_ACCESS_KEY=...      # Avatar upload to Qiniu cloud
QINIU_SECRET_KEY=...
QINIU_BUCKET=...
QINIU_ZONE=z2
QINIU_DOMAIN=...
QINIU_FOLDER=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
DATABASE_PATH=./data/app.db
PORT=3000
```

## API Response Format

All endpoints return unified format:
```typescript
{ code: 200, data: T, msg?: string }   // Success
{ code: 401, msg: "..." }               // Error (HTTP status as code)
```

Backend `ResponseInterceptor` wraps all responses. `HttpExceptionFilter` handles errors. Frontend axios interceptor rejects non-200 codes and shows `message.error(msg)`.

## Code Style

Biome config (both projects): 2-space indent, 100 char line width, single quotes, no trailing commas, semicolons only when needed. Warnings for `noExplicitAny` and `noNonNullAssertion`.

## TypeScript Path Aliases

**Frontend:** `@main/*`, `@shared/*`, `@playwright/*`, `@renderer/*`
**Backend:** `@/*`, `@common/*`, `@config/*`, `@database/*`, `@modules/*`

## Database Schema (8 tables)

`users` (roles: super_admin/admin/user, points system), `platforms`, `platform_accounts` (cookies/session), `post_templates`, `posts` (status: pending→generating→publishing→published/failed), `redeem_codes`, `consumption_records` (balance_after for audit), `settings` (key-value app config).

Default seed: super admin account (phone: 17674656046, password: snrh0902), 3 platforms, default points_per_post=5.
