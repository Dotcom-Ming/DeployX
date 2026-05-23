import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { prisma } from '@deployx/database';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMetadata = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap({
        next: async () => {
          try {
            await prisma.auditLog.create({
              data: {
                orgId: user?.orgId || 'unknown',
                userId: user?.sub || user?.id || null,
                action: auditMetadata.action,
                resource: auditMetadata.resource,
                resourceId: request.params?.id || request.params?.slug || null,
                metadata: JSON.stringify({
                  method: request.method,
                  path: request.url,
                  body: request.body ? this.sanitizeBody(request.body) : undefined,
                }),
                ipAddress: request.ip || request.connection?.remoteAddress,
                userAgent: request.headers?.['user-agent'] || null,
              },
            });
          } catch (error) {
            this.logger.error('Failed to create audit log', error);
          }
        },
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'mfaSecret'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
