import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { PlatformsService } from './platforms.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Get()
  findAll() { return this.platformsService.findAll() }

  @Get(':id')
  findById(@Param('id') id: string) { return this.platformsService.findById(id) }
}
