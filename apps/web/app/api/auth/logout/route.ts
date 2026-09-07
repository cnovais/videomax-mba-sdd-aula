import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-client";
import { getSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Proxies `POST /auth/logout`. Reads the cookie token; when present,
 * forwards it to the backend (which is itself tolerant of an absent or
 * invalid token — see F02's contract). Skips the backend call entirely
 * when there is no cookie. Always clears the cookie and always responds
 * success, regardless of the backend's outcome.
 */
export async function POST(): Promise<Response> {
  const token = await getSessionToken();

  if (token) {
    await backendFetch("/auth/logout", { method: "POST" }, token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

/**
 * GET variant: same clearing behavior, but redirects to `/` instead of
 * returning JSON. Used as a self-healing target when a Server Component
 * (which cannot itself write cookies — see `/app/page.tsx`) discovers the
 * cookie no longer resolves to an active session, so a stale/expired
 * cookie doesn't loop between `/` (redirects to `/app` on any non-empty
 * cookie) and `/app` (redirects back on a failed backend resolution).
 */
export async function GET(request: Request): Promise<Response> {
  const token = await getSessionToken();

  if (token) {
    await backendFetch("/auth/logout", { method: "POST" }, token);
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
