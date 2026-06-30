import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class AiService {
  private openai: OpenAI

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL')
    })
  }

  async generateText(params: { prompt: string; topic?: string; style?: string; platform?: string; hashtags?: string[] }) {
    const model = this.configService.get<string>('OPENAI_MODEL', 'glm-5')

    let userPrompt = params.prompt
    if (params.topic) userPrompt += `\n主题: ${params.topic}`
    if (params.style) userPrompt += `\n风格: ${params.style}`
    if (params.platform) userPrompt += `\n请适配${params.platform}的内容风格`
    if (params.hashtags?.length) userPrompt += `\n请包含以下话题标签: ${params.hashtags.join(', ')}`

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: '你是一个专业的社交媒体内容创作者，擅长写吸引人的文案。请直接输出文案内容，不要添加任何解释。' },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000
      })

      return { text: completion.choices[0]?.message?.content || '' }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '未知错误'
      throw new BadRequestException(`AI 生成失败: ${msg}`)
    }
  }
}
