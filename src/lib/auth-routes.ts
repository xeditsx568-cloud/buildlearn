/**
 * Route classification for Clerk middleware (TASK-101, TASK-201).
 *
 * Uses pathname matching instead of Clerk's deprecated createRouteMatcher.
 * See ADR-004 and ARCHITECTURE.md § Auth.
 */

/** Routes accessible without authentication. */
export const PUBLIC_ROUTE_PREFIXES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/privacy",
  "/terms",
] as const;

/** Authenticated app shell routes under `(app)` route group. */
export const PROTECTED_APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/learn",
  "/project",
  "/build",
] as const;

/** Onboarding wizard routes under `(onboarding)` route group (TASK-201). */
export const ONBOARDING_ROUTE_PREFIX = "/onboarding";

/** Post-auth destination for returning users on sign-in. */
export const AUTHENTICATED_HOME = "/dashboard";

/** Post-sign-up destination for new users (TASK-201). */
export const SIGN_UP_REDIRECT = "/onboarding/goal";

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") {
    return pathname === "/";
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
}

export function isProtectedAppRoute(pathname: string): boolean {
  return PROTECTED_APP_ROUTE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
}

export function isOnboardingRoute(pathname: string): boolean {
  return matchesPrefix(pathname, ONBOARDING_ROUTE_PREFIX);
}

/** Routes that require an authenticated Clerk session. */
export function isProtectedRoute(pathname: string): boolean {
  return isProtectedAppRoute(pathname) || isOnboardingRoute(pathname);
}

export function isAuthRoute(pathname: string): boolean {
  return matchesPrefix(pathname, "/sign-in") || matchesPrefix(pathname, "/sign-up");
}
