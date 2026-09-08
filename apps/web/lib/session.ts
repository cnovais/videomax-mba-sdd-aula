import { cookies } from "next/headers";

/**
 * Session-cookie contract. F01 (Landing Page) defined `SESSION_COOKIE_NAME`
 * and `hasActiveSession()` as a placeholder — "any non-empty
 * `videomax_session` cookie means authenticated" — before real session
 * issuance existed. F02 (Authentication System) now formalizes that
 * contract with real issuance (register/login proxy Route Handlers) and
 * adds `getSessionToken()` so authenticated frontend code (the `/app`
 * placeholder, `lib/backend-client.ts` callers) can retrieve the raw
 * token to forward as `Authorization: Bearer <token>` to the backend.
 */
export const SESSION_COOKIE_NAME = "videomax_session";

/** True when the current request carries a non-empty session cookie. */
export async function hasActiveSession(): Promise<boolean> {
  return (await getSessionToken()) !== null;
}

/** The raw session token from the cookie, or null when absent/empty. */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value ? sessionCookie.value : null;
}

/**
 * The token, or a ready-to-return 401 `Response` when absent — collapses
 * the "read the cookie, 401 if missing" guard every protected proxy Route
 * Handler needs into one call: `const token = await requireSessionToken();
 * if (token instanceof Response) return token;`
 */
export async function requireSessionToken(): Promise<string | Response> {
  const token = await getSessionToken();
  if (token) return token;
  return Response.json({ code: "UNAUTHENTICATED", message: "Authentication required" }, { status: 401 });
}
