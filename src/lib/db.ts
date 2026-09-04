import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 no longer reads the connection string from the schema, and no
// longer loads .env at runtime — the client is constructed with a driver
// adapter over an explicit URL. Next.js loads .env.local for us locally;
// on Vercel the variable comes from the project settings.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Run `neon env pull` to write it into .env.local.",
  );
}

// The POOLED Neon endpoint. Migrations use the direct one (prisma.config.ts);
// application traffic wants PgBouncer in front of it, because a serverless
// runtime opens a connection per invocation.
const createClient = () =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Next.js discards module state on every hot reload in development, which
// would leak a connection pool per edit until Postgres refuses new clients.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
