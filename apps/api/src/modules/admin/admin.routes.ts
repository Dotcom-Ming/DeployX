import { FastifyInstance } from 'fastify';
import { AdminService } from './admin.service';
import { adminGuard } from '../../common/guards/admin.guard';
import { prisma } from '@deployx/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function adminRoutes(app: FastifyInstance) {
  // Admin login (no guard)
  app.post('/admin/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ success: false, message: 'Email and password are required' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return reply.status(401).send({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return reply.status(401).send({ success: false, message: 'Invalid email or password' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
    const accessToken = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role, type: 'admin' },
      jwtSecret,
      { expiresIn: '8h' },
    );

    return {
      success: true,
      data: {
        accessToken,
        user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      },
    };
  });

  // Protected admin routes
  app.register(async function (adminScope) {
    adminScope.addHook('preHandler', adminGuard);

    // Existing admin routes
    adminScope.get('/admin/dashboard', async () => {
      const adminService = new AdminService();
      return adminService.getDashboardStats();
    });

    adminScope.get('/admin/users', async (request) => {
      const { page, pageSize, search, status } = request.query as any;
      const adminService = new AdminService();
      return adminService.getUsers(
        parseInt(page || '1', 10),
        parseInt(pageSize || '20', 10),
        search || '',
        status || 'all',
      );
    });

    adminScope.post('/admin/users/:id/suspend', async (request) => {
      const { id } = request.params as any;
      const adminService = new AdminService();
      return adminService.suspendUser(id);
    });

    adminScope.delete('/admin/users/:id', async (request) => {
      const { id } = request.params as any;
      const adminService = new AdminService();
      return adminService.deleteUser(id);
    });

    adminScope.get('/admin/organizations', async (request) => {
      const { page, pageSize, search, plan } = request.query as any;
      const adminService = new AdminService();
      return adminService.getOrganizations(
        parseInt(page || '1', 10),
        parseInt(pageSize || '20', 10),
        search || '',
        plan || 'all',
      );
    });

    adminScope.get('/admin/deployments', async (request) => {
      const { page, pageSize, status } = request.query as any;
      const adminService = new AdminService();
      return adminService.getDeployments(
        parseInt(page || '1', 10),
        parseInt(pageSize || '20', 10),
        status || 'all',
      );
    });

    adminScope.get('/admin/billing', async () => {
      const adminService = new AdminService();
      return adminService.getBillingStats();
    });

    adminScope.get('/admin/system', async () => {
      const adminService = new AdminService();
      return adminService.getSystemHealth();
    });

    // Admin management routes (super_admin only)
    adminScope.addHook('preHandler', async (request, reply) => {
      const path = (request as any).url || request.url;
      if (!path.startsWith('/admin/admins')) return;
      const user = (request as any).user;
      if (user?.role !== 'super_admin') {
        reply.status(403).send({ success: false, message: 'Super admin access required', statusCode: 403 });
      }
    });

    adminScope.get('/admin/admins', async (request) => {
      const { page, pageSize } = request.query as any;
      const p = parseInt(page || '1', 10);
      const ps = parseInt(pageSize || '20', 10);

      const [admins, total] = await Promise.all([
        prisma.admin.findMany({
          skip: (p - 1) * ps,
          take: ps,
          orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        }),
        prisma.admin.count(),
      ]);

      return {
        data: admins,
        meta: { page: p, pageSize: ps, total, hasNextPage: p * ps < total },
      };
    });

    adminScope.post('/admin/admins', async (request, reply) => {
      const { email, name, password, role } = request.body as any;

      if (!email || !name || !password) {
        return reply.status(400).send({ success: false, message: 'Email, name, and password are required' });
      }

      const existing = await prisma.admin.findUnique({ where: { email } });
      if (existing) {
        return reply.status(409).send({ success: false, message: 'Admin with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const admin = await prisma.admin.create({
        data: { email, name, passwordHash, role: role || 'admin' },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      return reply.status(201).send({ success: true, data: admin });
    });

    adminScope.patch('/admin/admins/:id', async (request, reply) => {
      const { id } = request.params as any;
      const body = request.body as any;

      const existing = await prisma.admin.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ success: false, message: 'Admin not found' });
      }

      const data: any = {};
      if (body.name) data.name = body.name;
      if (body.email) data.email = body.email;
      if (body.role) data.role = body.role;
      if (body.password) {
        data.passwordHash = await bcrypt.hash(body.password, 12);
      }

      const admin = await prisma.admin.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      return { success: true, data: admin };
    });

    adminScope.delete('/admin/admins/:id', async (request, reply) => {
      const { id } = request.params as any;

      const existing = await prisma.admin.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ success: false, message: 'Admin not found' });
      }

      await prisma.admin.delete({ where: { id } });
      return { success: true, message: 'Admin deleted' };
    });
  });
}
