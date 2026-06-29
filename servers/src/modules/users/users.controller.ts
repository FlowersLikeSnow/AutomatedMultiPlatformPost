import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CreateUserDto } from './dto/create-user.dto'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('super_admin', 'admin')
  findAll(@Query() query: { page?: number; pageSize?: number; keyword?: string; role?: string }) {
    return this.usersService.findAll(query)
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id)
  }

  @Post()
  @Roles('super_admin', 'admin')
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  @Put(':id')
  @Roles('super_admin', 'admin')
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data)
  }

  @Delete(':id')
  @Roles('super_admin')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id)
  }

  @Put(':id/reset-password')
  @Roles('super_admin', 'admin')
  async resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.usersService.resetPassword(id, body.newPassword)
  }

  @Put(':id/points')
  @Roles('super_admin', 'admin')
  adjustPoints(@Param('id') id: string, @Body() body: { points: number; description: string }) {
    return this.usersService.adjustPoints(id, body.points, body.description)
  }
}
