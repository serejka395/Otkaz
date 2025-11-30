import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv();
loadEnv({ path: '.env.local', override: false });

const datasourceUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!datasourceUrl) {
  throw new Error('Database connection string is not set (POSTGRES_PRISMA_URL or DATABASE_URL)');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrl,
    shadowDatabaseUrl: process.env.POSTGRES_URL_NON_POOLING || datasourceUrl,
  },
});
