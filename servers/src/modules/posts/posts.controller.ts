import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common'
import { PostsService } from './posts.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query() query: any) { return this.service.findAll(userId, query) }

  @Get('statistics')
  getStatistics(@CurrentUser('sub') userId: string) { return this.service.getStatistics(userId) }

  @Get(':id')
  findById(@Param('id') id: string) { return this.service.findById(id) }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() data: any) { return this.service.create(userId, data) }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; error?: string }) { return this.service.updateStatus(id, body.status, body.error) }
}
