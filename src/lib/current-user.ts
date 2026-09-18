import { eq } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db";
import { goals, users } from "@/db/schema";
import { getSupabaseUser } from "@/lib/supabase/server";

export async function getCurrentUser() {
  if (!hasDatabase) {
    return null;
  }

  const authUser = await getSupabaseUser();
  if (!authUser) {
    return null;
  }

  const db = getDb();
  const authenticatedUser = await db.query.users.findFirst({
    where: eq(users.supabaseUserId, authUser.id),
  });

  if (authenticatedUser) {
    await db.insert(goals).values({ userId: authenticatedUser.id }).onConflictDoNothing({ target: goals.userId });
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
    await db.insert(goals).values({ userId: created.id }).onConflictDoNothing({ target: goals.userId });
    return created;
  }

  const concurrentUser = await db.query.users.findFirst({
    where: eq(users.supabaseUserId, authUser.id),
  });

  if (concurrentUser) {
    await db.insert(goals).values({ userId: concurrentUser.id }).onConflictDoNothing({ target: goals.userId });
    return concurrentUser;
  }

  throw new Error(`Could not create an app user for Supabase user ${authUser.id}.`);
}
