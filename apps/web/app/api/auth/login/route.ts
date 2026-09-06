import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-client";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

/**
 * Proxies `POST /auth/login` to the backend. Same shape as the register
 * proxy: consumes the returned `sessionToken` into the first-party
 * cookie, forwards errors verbatim, never echoes the raw token.
 */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json();

  const backendResponse = await backendFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const { user, sessionToken } = data as { user: unknown; sessionToken: string };
  const response = NextResponse.json({ user }, { status: backendResponse.status });
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: THIRTY_DAYS_SECONDS,
    path: "/",
  });
  return response;
}
