import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaNeon } from '@prisma/adapter-neon';
import { env } from './env.js';

const databaseUrl = env.DATABASE_URL;

const adapter = new PrismaNeon({
  connectionString: databaseUrl,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
