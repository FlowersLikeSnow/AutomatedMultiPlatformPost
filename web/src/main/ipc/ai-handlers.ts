import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import type { GenerateImageParams, ExpandPromptParams, ApiResponse, GenerateImageResult } from '../../shared/types'
import { generateImage } from '../ai'
import { expandPrompt } from '../llm/prompt-expander'
import { logger } from '../utils/logger'

export function registerAiIpcHandlers(): void {
  // AI 图片生成
  ipcMain.handle(
    IPC_CHANNELS.AI_GENERATE_IMAGE,
    async (_event, params: GenerateImageParams): Promise<ApiResponse<GenerateImageResult>> => {
      try {
        logger.info(`[AI IPC] Generate image: ${params.prompt.substring(0, 50)}...`)

        const result = await generateImage({
          prompt: params.prompt,
          size: params.size,
          n: params.n,
          quality: params.quality
        })

        if (!result) {
          return { code: 500, msg: 'AI 服务不可用，请检查 .ENV 配置' }
        }

        return { code: 200, data: result }
      } catch (error) {
        logger.error('[AI IPC] Generate image failed:', error)
        return {
          code: 500,
          msg: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )

  // AI 提示词扩写
  ipcMain.handle(
    IPC_CHANNELS.AI_EXPAND_PROMPT,
    async (_event, params: ExpandPromptParams): Promise<ApiResponse<{ expandedPrompt: string }>> => {
      try {
        logger.info(`[AI IPC] Expand prompt: ${params.basePrompt.substring(0, 50)}...`)

        const expanded = await expandPrompt(params.basePrompt, params.style)

        return { code: 200, data: { expandedPrompt: expanded } }
      } catch (error) {
        logger.error('[AI IPC] Expand prompt failed:', error)
        return {
          code: 500,
          msg: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )

  logger.info('[AI IPC] AI handlers registered')
}
