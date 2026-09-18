import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSupabaseConfig } from "./config";
import { logServerTiming } from "@/lib/server-timing";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies; proxy.ts refreshes them.
        }
      },
    },
  });
}

export const getSupabaseUser = cache(async () => {
  const startedAt = performance.now();

  try {
    const supabase = await createSupabaseServerClient();
    const authStartedAt = performance.now();
    const { data, error } = await supabase.auth.getUser();
    logServerTiming("supabase.auth.getUser", authStartedAt, {
      success: !error,
    });
    logServerTiming("supabase.getSupabaseUser", startedAt, {
      success: !error,
    });
    return error ? null : data.user;
  } catch {
    logServerTiming("supabase.getSupabaseUser", startedAt, { success: false });
    return null;
  }
});
