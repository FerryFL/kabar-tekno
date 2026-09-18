import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logServerTiming } from "@/lib/server-timing";

export async function proxy(request: NextRequest) {
  const startedAt = performance.now();
  const response = NextResponse.next({ request: { headers: request.headers } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.cookies.toString());
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const authStartedAt = performance.now();
  const { data } = await supabase.auth.getClaims();
  logServerTiming("proxy.supabase.getClaims", authStartedAt, {
    pathname: request.nextUrl.pathname,
  });
  const claims = data?.claims;
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = pathname === "/login" || pathname === "/auth/callback";

  if (!claims && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (claims && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    const redirectPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  logServerTiming("proxy.total", startedAt, {
    pathname: request.nextUrl.pathname,
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
