import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

declare global {
  var kabarTeknoDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
  var kabarTeknoSql: ReturnType<typeof postgres> | undefined;
}

export const hasDatabase = Boolean(connectionString);

export function getDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.kabarTeknoSql) {
    globalThis.kabarTeknoSql = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  if (!globalThis.kabarTeknoDb) {
    globalThis.kabarTeknoDb = drizzle(globalThis.kabarTeknoSql, { schema });
  }

  return globalThis.kabarTeknoDb;
}
