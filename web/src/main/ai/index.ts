// AI 模块入口（参考 createImage/lib/ai/index.ts）
import type { ImageGenAdapter, GenParams, EditParams, GenResult } from './adapter'
import { OpenAIImageAdapter } from './openai-image'
import { logger } from '../utils/logger'

const adapters = new Map<string, ImageGenAdapter>()
let defaultAdapter: ImageGenAdapter | null = null

export function registerAdapter(adapter: ImageGenAdapter, asDefault = false): void {
  adapters.set(adapter.modelId, adapter)
  if (asDefault || !defaultAdapter) {
    defaultAdapter = adapter
  }
  logger.info(`[AI] Registered adapter: ${adapter.name} (${adapter.modelId})`)
}

export function getAdapter(modelId?: string): ImageGenAdapter | null {
  if (modelId) return adapters.get(modelId) || null
  return defaultAdapter
}

export async function generateImage(params: GenParams, modelId?: string): Promise<GenResult | null> {
  const adapter = getAdapter(modelId)
  if (!adapter) {
    logger.error('[AI] No adapter available for image generation')
    return null
  }

  const available = await adapter.isAvailable()
  if (!available) {
    logger.error('[AI] Adapter not available (check API key)')
    return null
  }

  return adapter.generate(params)
}

export async function editImage(params: EditParams, modelId?: string): Promise<GenResult | null> {
  const adapter = getAdapter(modelId)
  if (!adapter?.edit) {
    logger.error('[AI] No adapter with edit support available')
    return null
  }

  return adapter.edit(params)
}

// 初始化默认适配器
export function initDefaultAdapter(): void {
  const adapter = new OpenAIImageAdapter()
  registerAdapter(adapter, true)
}

// 自动初始化
initDefaultAdapter()

export type { ImageGenAdapter, GenParams, EditParams, GenResult } from './adapter'
