import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { RedeemService } from './redeem.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('redeem')
export class RedeemController {
  constructor(private readonly service: RedeemService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Get()
  findAll(@Query() query: any) { return this.service.findAll(query) }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Post()
  create(@Body() data: { pointsValue: number; expiresAt?: string; count?: number }) { return this.service.create(data) }

  @UseGuards(JwtAuthGuard)
  @Post('use')
  use(@CurrentUser('sub') userId: string, @Body() body: { code: string }) { return this.service.use(userId, body.code) }
}
