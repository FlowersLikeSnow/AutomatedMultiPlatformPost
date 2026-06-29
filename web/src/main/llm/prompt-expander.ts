// LLM 提示词扩写模块（参考 createImage/lib/llm/prompt-expander.ts）
import OpenAI from 'openai'
import { getEnvVar } from '../utils/env'
import { logger } from '../utils/logger'

const SYSTEM_PROMPT = `你是一个专业的提示词扩写专家，负责将用户简短的描述扩展为详细、生动的提示词，用于 AI 图片生成。

请遵循以下扩写规则：
1. 补充场景细节（背景、环境、氛围）
2. 补充光线描述（光源、光质、色温）
3. 补充人物细节（表情、姿态、服装质感）
4. 补充画质要求（高清、专业摄影、锐度）
5. 输出中文提示词，便于 AI 生图模型理解
6. 保持提示词简洁但完整，控制在 150 词以内
7. 使用专业摄影术语，提升提示词质量
8. 不要添加与用户描述冲突的内容

请直接输出扩写后的提示词，不要添加任何解释或前缀。`

interface ExpandOptions {
  maxTokens?: number
  temperature?: number
}

function getLLMClient(): OpenAI {
  const apiKey = getEnvVar('LLM_API_KEY', '')
  const baseUrl = getEnvVar('LLM_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')

  return new OpenAI({
    apiKey,
    baseURL: baseUrl
  })
}

export async function expandPrompt(
  basePrompt: string,
  style?: string,
  options?: ExpandOptions
): Promise<string> {
  try {
    const client = getLLMClient()
    const model = getEnvVar('LLM_MODEL', 'glm-5')

    let userContent = `基础描述：${basePrompt}`
    if (style) {
      userContent += `\n风格要求：${style}`
    }

    logger.info(`[LLM] Expanding prompt: ${basePrompt.substring(0, 50)}...`)

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent }
      ],
      max_tokens: options?.maxTokens || 500,
      temperature: options?.temperature || 0.7
    })

    const expanded = response.choices[0]?.message?.content?.trim() || basePrompt
    logger.info(`[LLM] Expanded prompt: ${expanded.substring(0, 80)}...`)
    return expanded
  } catch (error) {
    logger.error('[LLM] Prompt expansion failed:', error)
    return basePrompt // Fallback to original prompt
  }
}

export function isLLMAvailable(): boolean {
  const apiKey = getEnvVar('LLM_API_KEY', '')
  return apiKey.length > 10
}
