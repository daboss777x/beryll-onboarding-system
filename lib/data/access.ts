import "server-only";
import type { Role } from "../types";

/** Route access rules shared by middleware.ts and requireUser(). */

export const HOME_FOR_ROLE: Record<Role, string> = {
  hire: "/today",
  manager: "/team",
  buddy: "/buddy",
};

export function homeFor(role: Role): string {
  return HOME_FOR_ROLE[role];
}

const PUBLIC_PREFIXES = ["/login", "/logout", "/styleguide", "/api/health"];

const ROLE_PREFIXES: Record<Role, string[]> = {
  manager: ["/team"],
  buddy: ["/buddy"],
  hire: [
    "/today", "/roadmap", "/learn", "/contracts", "/labs", "/practice", "/people", "/me",
    "/quiz", "/checklist", "/missions", "/review", "/pulse", "/certification",
  ],
};

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => matches(pathname, p));
}

/** The role that owns this path, or null if any signed-in user may open it. */
export function roleForPath(pathname: string): Role | null {
  for (const role of Object.keys(ROLE_PREFIXES) as Role[]) {
    if (ROLE_PREFIXES[role].some((p) => matches(pathname, p))) return role;
  }
  return null;
}

export function canAccess(role: Role, pathname: string): boolean {
  const owner = roleForPath(pathname);
  return owner === null || owner === role;
}

/** Only allow same-site relative redirects (no "//evil.com"). */
export function safeNext(next: string | null | undefined, role: Role): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || isPublicPath(next)) return homeFor(role);
  return canAccess(role, next.split("?")[0]) ? next : homeFor(role);
}
