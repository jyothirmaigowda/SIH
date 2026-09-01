import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 configuration — database URL moves from schema.prisma to here.
// See: https://pris.ly/d/config-datasource
export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: () =>
      new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
});