import { PrismaClient } from '@prisma/client';

// Map environment variables to DATABASE_URL for Prisma
if (!process.env.DATABASE_URL) {
  const connectionString =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (connectionString) {
    process.env.DATABASE_URL = connectionString;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('Database connection string is not configured');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
