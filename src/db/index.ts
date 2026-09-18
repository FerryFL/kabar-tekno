import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

declare global {
  var kabarTeknoDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
  var kabarTeknoSql: ReturnType<typeof postgres> | undefined;
}

export const hasDatabase = Boolean(connectionString);

const configuredPoolSize = Number.parseInt(process.env.DB_POOL_MAX ?? "2", 10);
const poolSize = Number.isFinite(configuredPoolSize)
  ? Math.min(Math.max(configuredPoolSize, 1), 3)
  : 2;

export function getDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.kabarTeknoSql) {
    globalThis.kabarTeknoSql = postgres(connectionString, {
      max: poolSize,
      prepare: false,
      ssl: "require",
    });
  }

  if (!globalThis.kabarTeknoDb) {
    globalThis.kabarTeknoDb = drizzle(globalThis.kabarTeknoSql, { schema });
  }

  return globalThis.kabarTeknoDb;
}
