import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common'
import { PlatformAccountsService } from './platform-accounts.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('platform-accounts')
export class PlatformAccountsController {
  constructor(private readonly service: PlatformAccountsService) {}

  @Get()
  findByUser(@CurrentUser('sub') userId: string) { return this.service.findByUser(userId) }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; userInfo?: string }) {
    return this.service.updateStatus(id, body.status, body.userInfo)
  }
}
