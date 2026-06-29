import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ConsumptionService } from './consumption.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@Controller('consumption')
export class ConsumptionController {
  constructor(private readonly service: ConsumptionService) {}

  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query) }

  @Get('statistics')
  getStatistics() { return this.service.getStatistics() }
}
