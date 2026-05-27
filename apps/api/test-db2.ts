import 'dotenv/config';
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
import { prisma } from '@deployx/database';

const admins = await prisma.admin.findMany();
console.log('admins count:', admins.length);
console.log('admins:', admins.map(a => ({ email: a.email, name: a.name })));
await prisma.$disconnect();
