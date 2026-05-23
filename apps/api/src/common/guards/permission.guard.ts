import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinEnforcer } from '@deployx/auth';
import { PERMISSION_KEY } from '../decorators/require-permission';

@Injectable()
export class PermissionGuard implements CanActivate {
  private enforcer: CasbinEnforcer;

  constructor(private reflector: Reflector) {
    this.enforcer = new CasbinEnforcer();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const [object, action] = requiredPermission.split(':');

    if (!object || !action) {
      return true;
    }

    const orgId = user.orgId || request.params?.slug || request.headers['x-org-id'];

    try {
      const allowed = await this.enforcer.enforce(
        user.role || 'viewer',
        orgId || '*',
        object,
        action,
      );

      if (!allowed) {
        throw new ForbiddenException(
          `You do not have permission to ${action} ${object} in this organization`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // If Casbin is not initialized, allow in development
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      throw new ForbiddenException('Permission check failed');
    }
  }
}
