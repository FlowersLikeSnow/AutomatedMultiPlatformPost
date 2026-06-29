import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from './jwt-auth.guard'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredRoles) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()
    if (!user) {
      throw new ForbiddenException('未登录')
    }

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return true
    }

    const hasRole = requiredRoles.includes(user.role)
    if (!hasRole) {
      throw new ForbiddenException('权限不足')
    }

    return true
  }
}
