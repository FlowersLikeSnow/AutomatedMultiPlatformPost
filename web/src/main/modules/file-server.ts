// 本地文件服务 - 为渲染进程提供本地图片访问
import { protocol, ipcMain } from 'electron'
import { resolve, extname } from 'path'
import { readFile, readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { app } from 'electron'
import { nanoid } from 'nanoid'
import sharp from 'sharp'
import { IPC_CHANNELS } from '../../shared/types'
import type { ApiResponse } from '../../shared/types'
import { logger } from '../utils/logger'

const IMAGES_DIR_NAME = 'generated-images'
const PROTOCOL_SCHEME = 'app-images'

function getImagesDir(): string {
  return resolve(app.getPath('userData'), IMAGES_DIR_NAME)
}

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
}

export function initFileServer(): void {
  // 注册自定义协议
  protocol.registerFileProtocol(PROTOCOL_SCHEME, (request, callback) => {
    const url = new URL(request.url)
    const filename = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    const filePath = resolve(getImagesDir(), filename)

    if (!existsSync(filePath)) {
      logger.warn(`[FileServer] File not found: ${filePath}`)
      callback({ error: -6 }) // NET::ERR_FILE_NOT_FOUND
      return
    }

    callback({ path: filePath })
  })

  // 注册 IPC handlers
  ipcMain.handle(IPC_CHANNELS.GET_LOCAL_IMAGE_URL, (_event, filename: string): string => {
    return `${PROTOCOL_SCHEME}://${filename}`
  })

  ipcMain.handle(IPC_CHANNELS.GET_LOCAL_IMAGE_PATH, (_event, filename: string): string => {
    return resolve(getImagesDir(), filename)
  })

  ipcMain.handle(
    IPC_CHANNELS.SAVE_LOCAL_IMAGE,
    async (_event, buffer: ArrayBuffer, ext?: string): Promise<ApiResponse<{ filename: string; path: string }>> => {
      try {
        const dir = getImagesDir()
        if (!existsSync(dir)) {
          const { mkdir } = await import('fs/promises')
          await mkdir(dir, { recursive: true })
        }

        const fileExt = ext || '.webp'
        const filename = `${nanoid(12)}${fileExt}`
        const filePath = resolve(dir, filename)
        const buf = Buffer.from(buffer)

        // 压缩图片
        let finalBuffer: Buffer
        if (buf.length > 100 * 1024) {
          finalBuffer = await sharp(buf)
            .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
            .toFormat('webp', { quality: 82 })
            .toBuffer()
        } else {
          finalBuffer = buf
        }

        const { writeFile } = await import('fs/promises')
        await writeFile(filePath, finalBuffer)

        logger.info(`[FileServer] Saved image: ${filename} (${buf.length} -> ${finalBuffer.length} bytes)`)

        return {
          success: true,
          data: { filename, path: filePath }
        }
      } catch (error) {
        logger.error('[FileServer] Save image failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )

  logger.info('[FileServer] File server initialized')
}

// 获取本地图片列表
export async function listLocalImages(): Promise<string[]> {
  const dir = getImagesDir()
  if (!existsSync(dir)) return []

  try {
    const files = await readdir(dir)
    return files.filter((f) => {
      const ext = extname(f).toLowerCase()
      return ['.webp', '.png', '.jpg', '.jpeg', '.gif'].includes(ext)
    })
  } catch {
    return []
  }
}
