import { cookies } from "next/headers";

/**
 * Placeholder session-cookie contract owned by F01 (Landing Page).
 *
 * F01 has no dependency on F02 (Authentication System) per the PRD's
 * Section 8 dependency graph, yet must satisfy its own acceptance
 * criterion that authenticated visitors are redirected away from `/`.
 * This module defines and reads a minimal, self-contained signal: any
 * non-empty `videomax_session` cookie means "authenticated" for the
 * purposes of this route. F02 is expected to issue this exact cookie
 * name when it implements real session management; until then, tests
 * and browser automation can set the cookie directly to simulate an
 * authenticated visitor without depending on any login flow.
 */
export const SESSION_COOKIE_NAME = "videomax_session";

/** True when the current request carries a non-empty session cookie. */
export async function hasActiveSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return Boolean(sessionCookie?.value);
}
