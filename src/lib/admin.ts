import { getSupabaseUser } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "ferryfebrian.lim@gmail.com";

export function isAdminEmail(email: string | null | undefined) {
  return email?.toLowerCase() === ADMIN_EMAIL;
}

export async function isAdmin() {
  const user = await getSupabaseUser();
  return isAdminEmail(user?.email);
}
