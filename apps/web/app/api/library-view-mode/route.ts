import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-client";
import { requireSessionToken } from "@/lib/session";
export async function PATCH(request: Request): Promise<Response> { const token = await requireSessionToken(); if (token instanceof Response) return token; const result = await backendFetch("/auth/me/library-view-mode", { method: "PATCH", headers: { "content-type": "application/json" }, body: await request.text() }, token); return NextResponse.json(await result.json(), { status: result.status }); }
