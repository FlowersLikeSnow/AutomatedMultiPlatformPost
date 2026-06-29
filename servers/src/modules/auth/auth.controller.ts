import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || ''
    return this.authService.login(loginDto.phone, loginDto.password, ip)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: '退出成功' }
  }
}
