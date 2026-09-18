import { eq } from "drizzle-orm";
import { cache } from "react";

import { getDb, hasDatabase } from "@/db";
import { goals, users } from "@/db/schema";
import { getSupabaseUser } from "@/lib/supabase/server";
import { logServerTiming } from "@/lib/server-timing";

export const getCurrentUser = cache(async () => {
  const startedAt = performance.now();
  if (!hasDatabase) {
    logServerTiming("current-user.no-database", startedAt);
    return null;
  }

  const authUser = await getSupabaseUser();
  if (!authUser) {
    logServerTiming("current-user.no-auth-user", startedAt);
    return null;
  }

  const db = getDb();
  const lookupStartedAt = performance.now();
  const authenticatedUser = await db.query.users.findFirst({
    where: eq(users.supabaseUserId, authUser.id),
  });
  logServerTiming("current-user.db-user-lookup", lookupStartedAt);

  if (authenticatedUser) {
    const goalStartedAt = performance.now();
    await db.insert(goals).values({ userId: authenticatedUser.id }).onConflictDoNothing({ target: goals.userId });
    logServerTiming("current-user.ensure-goal", goalStartedAt);
    logServerTiming("current-user.total", startedAt, { existing: true });
    return authenticatedUser;
  }

  const [created] = await db
    .insert(users)
    .values({
      username: `google-${authUser.id}`,
      supabaseUserId: authUser.id,
      googleAccount: authUser.email ?? null,
    })
    .onConflictDoNothing({ target: users.supabaseUserId })
    .returning();

  if (created) {
    logServerTiming("current-user.total", startedAt, { existing: false });
    await db.insert(goals).values({ userId: created.id }).onConflictDoNothing({ target: goals.userId });
    return created;
  }

  const concurrentUser = await db.query.users.findFirst({
    where: eq(users.supabaseUserId, authUser.id),
  });

  if (concurrentUser) {
    logServerTiming("current-user.total", startedAt, {
      existing: false,
      concurrent: true,
    });
    await db.insert(goals).values({ userId: concurrentUser.id }).onConflictDoNothing({ target: goals.userId });
    return concurrentUser;
  }

  throw new Error(`Could not create an app user for Supabase user ${authUser.id}.`);
});
