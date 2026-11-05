import { NextResponse, type NextRequest } from "next/server";
import { canAccess, homeFor, isPublicPath, safeNext } from "./lib/data/access";
import { SESSION_COOKIE, verifySession } from "./lib/data/session";
import { getSupabaseMiddlewareUser } from "./lib/supabase/middleware";
import { isDemoMode, isSupabaseConfigured } from "./lib/supabase/env";

/**
 * Auth gate + role routing.
 *  - Public: /login, /logout, /styleguide, /api/health, static assets (see matcher).
 *  - Signed out: pages -> /login?next=..., API -> 401 JSON.
 *  - Role areas: /team* manager, /buddy* buddy, hire routes (ROLE_PREFIXES in lib/data/access.ts) hire;
 *    wrong role -> own home (API: 403).
 *  - Demo accounts are treated as signed out while isDemoMode() is off.
 *  - "/" and "/login" (when signed in) -> role home.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const response = NextResponse.next({ request });

  const sessionUser = isSupabaseConfigured()
    ? await getSupabaseMiddlewareUser(request, response)
    : await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  // Demo accounts (every memory-store account; Supabase app_metadata.is_demo) count as signed
  // out while demo mode is off, so a session from before it was switched off stops working.
  const isDemoUser = !!sessionUser && (!("isDemo" in sessionUser) || sessionUser.isDemo);
  const user = sessionUser && isDemoUser && !isDemoMode() ? null : sessionUser;

  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    // Carry over any refreshed Supabase auth cookies.
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };
  const isApi = pathname.startsWith("/api/");

  if (pathname === "/login" && user) {
    return redirectTo(safeNext(request.nextUrl.searchParams.get("next"), user.role));
  }
  if (isPublicPath(pathname)) return response;

  if (!user) {
    if (isApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (pathname === "/") return redirectTo(homeFor(user.role));

  if (!canAccess(user.role, pathname)) {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return redirectTo(homeFor(user.role));
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?|ttf|otf|mp4|webm|pdf)$).*)",
    // API routes always run through the gate, even with a file-like ending
    // (e.g. /api/certificate/days8-30.pdf would otherwise skip it).
    "/api/:path*",
  ],
};
