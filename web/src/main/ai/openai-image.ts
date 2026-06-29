import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { resolve } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { app } from 'electron'
import sharp from 'sharp'
import type { ImageGenAdapter, GenParams, GenResult } from './adapter'
import { getEnvVar } from '../utils/env'
import { logger } from '../utils/logger'

// 图片压缩配置（参考 createImage）
const COMPRESS_OPTIONS = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 82
}

function getImagesDir(): string {
  return resolve(app.getPath('userData'), 'generated-images')
}

async function ensureImagesDir(): Promise<void> {
  const dir = getImagesDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

async function compressAndSave(imageBuffer: Buffer): Promise<string> {
  await ensureImagesDir()
  const fileName = `${uuidv4()}.webp`
  const filePath = resolve(getImagesDir(), fileName)

  let compressed: Buffer
  if (imageBuffer.length < 100 * 1024) {
    compressed = imageBuffer
  } else {
    compressed = await sharp(imageBuffer)
      .resize(COMPRESS_OPTIONS.maxWidth, COMPRESS_OPTIONS.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat('webp', { quality: COMPRESS_OPTIONS.quality, effort: 6 })
      .toBuffer()
  }

  await writeFile(filePath, compressed)
  logger.info(`[AI] Image saved: ${filePath} (${imageBuffer.length} -> ${compressed.length} bytes)`)
  return filePath
}

export class OpenAIImageAdapter implements ImageGenAdapter {
  name = 'NewAPI Image'
  modelId: string
  private client: OpenAI

  constructor() {
    const apiKey = getEnvVar('NEWAPI_API_KEY', '')
    const baseUrl = getEnvVar('NEWAPI_BASE_URL', 'https://api.openai.com/v1')
    this.modelId = getEnvVar('NEWAPI_MODEL', 'gpt-image-2-flatfee')

    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl.includes('/v1') ? baseUrl : `${baseUrl}/v1`,
      timeout: 1200000 // 20 minutes for image generation
    })
  }

  async generate(params: GenParams): Promise<GenResult> {
    logger.info(`[AI] Generating image: ${params.prompt.substring(0, 50)}...`)

    const response = await this.client.images.generate({
      model: this.modelId,
      prompt: params.prompt,
      size: (params.size as '1024x1024' | '1024x1792' | '1792x1024') || '1024x1024',
      n: params.n || 1,
      response_format: 'url'
    })

    const images: GenResult['images'] = []

    for (const item of response.data || []) {
      const id = uuidv4()
      let localPath = ''

      if (item.url) {
        try {
          // Download image
          const imgResponse = await fetch(item.url)
          const arrayBuffer = await imgResponse.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // Compress and save locally
          localPath = await compressAndSave(buffer)
        } catch (error) {
          logger.error('[AI] Failed to download/save image:', error)
        }
      }

      images.push({
        url: item.url || '',
        localPath,
        id
      })
    }

    return {
      images,
      metadata: {
        model: this.modelId,
        revisedPrompt: response.data?.[0]?.revised_prompt
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    const apiKey = getEnvVar('NEWAPI_API_KEY', '')
    return apiKey.length > 10
  }
}
