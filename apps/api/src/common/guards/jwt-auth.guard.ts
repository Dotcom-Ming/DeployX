import { FastifyRequest, FastifyReply } from 'fastify';

export async function jwtAuthGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ success: false, message: 'Invalid or expired access token', statusCode: 401 });
  }
}
