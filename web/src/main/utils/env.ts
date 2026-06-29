import { resolve } from 'path'
import { existsSync } from 'fs'
import { config } from 'dotenv'
import { app } from 'electron'
import { logger } from './logger'

export function loadEnv(): void {
  // 开发模式：从项目根目录加载 .ENV
  // 生产模式：从 userData 目录加载 .ENV
  const isDev = !app.isPackaged
  const envPaths = isDev
    ? [
        resolve(process.cwd(), '.ENV'),
        resolve(__dirname, '../../.ENV')
      ]
    : [
        resolve(app.getPath('userData'), '.ENV')
      ]

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const result = config({ path: envPath })
      if (result.error) {
        logger.warn(`Failed to load .ENV from ${envPath}:`, result.error.message)
      } else {
        logger.info(`Loaded .ENV from ${envPath}`)
      }
      return
    }
  }

  logger.warn('No .ENV file found')
}

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (value === undefined) {
    logger.warn(`Environment variable ${key} is not set`)
    return ''
  }
  return value
}
