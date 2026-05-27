import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiTokensService } from '../../modules/api-tokens/api-tokens.service';

const apiTokensService = new ApiTokensService();

export async function apiTokenGuard(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  if (!authorization) {
    reply.status(401).send({ success: false, message: 'Missing authorization header', statusCode: 401 });
    return;
  }

  const parts = authorization.split(' ');
  let token: string;

  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    token = parts[1];
  } else if (parts.length === 1) {
    token = parts[0];
  } else {
    reply.status(401).send({ success: false, message: 'Invalid authorization header format', statusCode: 401 });
    return;
  }

  if (!token.startsWith('dx_')) {
    reply.status(401).send({ success: false, message: 'Invalid API token format', statusCode: 401 });
    return;
  }

  const tokenData = await apiTokensService.validateToken(token);
  if (!tokenData) {
    reply.status(401).send({ success: false, message: 'Invalid or expired API token', statusCode: 401 });
    return;
  }

  const membership = await (await import('@deployx/database')).prisma.membership.findFirst({
    where: { userId: tokenData.userId, acceptedAt: { not: null } },
    orderBy: { createdAt: 'asc' },
    include: { organization: true },
  });

  (request as any).user = {
    sub: tokenData.userId,
    email: tokenData.user.email,
    orgId: membership?.orgId || '',
    role: membership?.role || 'VIEWER',
  };

  (request as any).apiToken = {
    id: tokenData.id,
    scopes: tokenData.scopes,
  };
}

export async function jwtOrApiTokenGuard(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;

  if (authorization) {
    const parts = authorization.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (token.startsWith('dx_')) {
      return apiTokenGuard(request, reply);
    }
  }

  return jwtAuthGuard(request, reply);
}

import { jwtAuthGuard } from './jwt-auth.guard';
