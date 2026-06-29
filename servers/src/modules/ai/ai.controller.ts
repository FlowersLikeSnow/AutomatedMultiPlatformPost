import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AiService } from './ai.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('generate-text')
  async generateText(@Body() params: { prompt: string; topic?: string; style?: string; platform?: string; hashtags?: string[] }) {
    return this.service.generateText(params)
  }
}
