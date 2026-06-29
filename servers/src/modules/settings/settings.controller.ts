import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common'
import { SettingsService } from './settings.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() { return this.service.findAll() }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Put()
  upsert(@Body() body: { key: string; value: string; description?: string }) {
    return this.service.upsert(body.key, body.value, body.description)
  }
}
