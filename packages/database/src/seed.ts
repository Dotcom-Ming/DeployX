import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'admin@deployx.dev' },
    update: {},
    create: {
      email: 'admin@deployx.dev',
      name: 'Admin User',
      emailVerified: true,
    },
  });

  console.log(`Created test user: ${user.email}`);

  // Create test organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'deployx' },
    update: {},
    create: {
      name: 'DeployX',
      slug: 'deployx',
      plan: 'ENTERPRISE',
      ownerId: user.id,
      defaultRegion: 'us-east-1',
    },
  });

  console.log(`Created test organization: ${organization.slug}`);

  // Create owner membership
  await prisma.membership.upsert({
    where: {
      userId_orgId: {
        userId: user.id,
        orgId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      orgId: organization.id,
      role: 'OWNER',
      acceptedAt: new Date(),
    },
  });

  console.log('Created owner membership');

  // Create default admin account
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.admin.upsert({
    where: { email: 'admin@deployx.io' },
    update: {},
    create: {
      email: 'admin@deployx.io',
      name: 'Super Admin',
      passwordHash,
      role: 'super_admin',
    },
  });

  console.log('Created default admin: admin@deployx.io / admin123');

  // Seed CasbinRule with default RBAC policies for all 5 roles
  const rbacPolicies = [
    { ptype: 'p', v0: 'OWNER', v1: 'organization', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'project', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'deployment', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'domain', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'env_variable', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'member', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'billing', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'api_token', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'audit_log', v2: '*' },
    { ptype: 'p', v0: 'OWNER', v1: 'subscription', v2: '*' },
    { ptype: 'p', v0: 'ADMIN', v1: 'organization', v2: 'read' },
    { ptype: 'p', v0: 'ADMIN', v1: 'organization', v2: 'update' },
    { ptype: 'p', v0: 'ADMIN', v1: 'project', v2: '*' },
    { ptype: 'p', v0: 'ADMIN', v1: 'deployment', v2: '*' },
    { ptype: 'p', v0: 'ADMIN', v1: 'domain', v2: '*' },
    { ptype: 'p', v0: 'ADMIN', v1: 'env_variable', v2: '*' },
    { ptype: 'p', v0: 'ADMIN', v1: 'member', v2: 'read' },
    { ptype: 'p', v0: 'ADMIN', v1: 'billing', v2: 'read' },
    { ptype: 'p', v0: 'ADMIN', v1: 'api_token', v2: '*' },
    { ptype: 'p', v0: 'ADMIN', v1: 'audit_log', v2: 'read' },
    { ptype: 'p', v0: 'ADMIN', v1: 'subscription', v2: 'read' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'organization', v2: 'read' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'project', v2: 'read' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'project', v2: 'create' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'project', v2: 'update' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'deployment', v2: '*' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'domain', v2: 'read' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'env_variable', v2: 'read' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'member', v2: 'read' },
    { ptype: 'p', v0: 'DEVELOPER', v1: 'audit_log', v2: 'read' },
    { ptype: 'p', v0: 'VIEWER', v1: 'organization', v2: 'read' },
    { ptype: 'p', v0: 'VIEWER', v1: 'project', v2: 'read' },
    { ptype: 'p', v0: 'VIEWER', v1: 'deployment', v2: 'read' },
    { ptype: 'p', v0: 'VIEWER', v1: 'domain', v2: 'read' },
    { ptype: 'p', v0: 'VIEWER', v1: 'env_variable', v2: 'read' },
    { ptype: 'p', v0: 'VIEWER', v1: 'member', v2: 'read' },
    { ptype: 'p', v0: 'VIEWER', v1: 'audit_log', v2: 'read' },
    { ptype: 'p', v0: 'BILLING_MANAGER', v1: 'organization', v2: 'read' },
    { ptype: 'p', v0: 'BILLING_MANAGER', v1: 'billing', v2: '*' },
    { ptype: 'p', v0: 'BILLING_MANAGER', v1: 'subscription', v2: '*' },
    { ptype: 'p', v0: 'BILLING_MANAGER', v1: 'invoice', v2: '*' },
    { ptype: 'p', v0: 'BILLING_MANAGER', v1: 'usage_record', v2: 'read' },
    { ptype: 'p', v0: 'BILLING_MANAGER', v1: 'member', v2: 'read' },
    { ptype: 'g', v0: 'OWNER', v1: 'ADMIN' },
    { ptype: 'g', v0: 'ADMIN', v1: 'DEVELOPER' },
    { ptype: 'g', v0: 'DEVELOPER', v1: 'VIEWER' },
  ];

  await prisma.casbinRule.deleteMany();
  for (const policy of rbacPolicies) {
    await prisma.casbinRule.create({ data: policy });
  }

  console.log(`Seeded ${rbacPolicies.length} RBAC policies into CasbinRule`);
  console.log('Seed completed successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
