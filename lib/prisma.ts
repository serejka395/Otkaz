import { PrismaClient } from '@prisma/client';

// Map Netlify Neon env vars to Prisma expected DATABASE_URL at runtime if needed
if (!process.env.DATABASE_URL) {
  const pooled = process.env.NETLIFY_DATABASE_URL;
  const direct = process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (pooled || direct) {
    process.env.DATABASE_URL = pooled || direct;
  }
}

const connectionString =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error('Database connection string is not configured');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: connectionString,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
