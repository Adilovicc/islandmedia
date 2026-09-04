import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env itself. Neon writes DATABASE_URL and
// DATABASE_URL_UNPOOLED into .env.local via `neon env pull`.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT, not pooled. Migrations, dumps and anything session-scoped fail
    // over PgBouncer in transaction mode — and never with an error that names
    // pooling ("prepared statement s0 already exists" is the usual disguise).
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
