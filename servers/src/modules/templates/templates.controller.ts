import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { TemplatesService } from './templates.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query() query: any) { return this.service.findAll(userId, query) }

  @Get(':id')
  findById(@Param('id') id: string) { return this.service.findById(id) }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() data: any) { return this.service.create(userId, data) }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) { return this.service.update(id, data) }

  @Delete(':id')
  delete(@Param('id') id: string) { return this.service.delete(id) }

  @Put(':id/default')
  setDefault(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.setDefault(userId, id) }
}
