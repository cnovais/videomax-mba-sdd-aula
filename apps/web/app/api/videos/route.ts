import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-client";
import { requireSessionToken } from "@/lib/session";

/**
 * Proxies video upload/list to the backend, forwarding the bearer token
 * from the session cookie (never exposed to the browser). `POST` streams
 * the incoming multipart body straight through — the same request never
 * buffers a large upload in this process's memory.
 */
export async function POST(request: Request): Promise<Response> {
  const token = await requireSessionToken();
  if (token instanceof Response) return token;

  const contentType = request.headers.get("content-type") ?? "";
  const backendResponse = await backendFetch(
    "/videos",
    {
      method: "POST",
      headers: { "content-type": contentType },
      body: request.body,
      // Node's fetch (undici) requires `duplex: "half"` for a streamed
      // request body; the DOM `RequestInit` type doesn't declare it yet.
      duplex: "half",
    } as RequestInit & { duplex: "half" },
    token,
  );

  const data: unknown = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}

export async function GET(request: Request): Promise<Response> {
  const token = await requireSessionToken();
  if (token instanceof Response) return token;

  const { search } = new URL(request.url);
  const backendResponse = await backendFetch(`/videos${search}`, { method: "GET" }, token);
  const data: unknown = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}
