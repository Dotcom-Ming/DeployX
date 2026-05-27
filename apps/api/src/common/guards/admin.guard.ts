import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@deployx/database';

export async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (process.env.ADMIN_DEV_MODE === 'true') {
    (request as any).user = { sub: 'dev-admin', email: 'admin@deployx.io', role: 'super_admin', type: 'admin' };
    return;
  }

  if (!token) {
    reply.status(401).send({ success: false, message: 'Access token is missing', statusCode: 401 });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
  try {
    const { verify } = await import('jsonwebtoken');
    const payload = verify(token, jwtSecret) as any;

    if (payload.type !== 'admin') {
      reply.status(403).send({ success: false, message: 'Admin access required', statusCode: 403 });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!admin) {
      reply.status(403).send({ success: false, message: 'Admin not found', statusCode: 403 });
      return;
    }

    (request as any).user = { sub: admin.id, email: admin.email, role: admin.role, type: 'admin' };
  } catch {
    reply.status(401).send({ success: false, message: 'Invalid or expired access token', statusCode: 401 });
  }
}
