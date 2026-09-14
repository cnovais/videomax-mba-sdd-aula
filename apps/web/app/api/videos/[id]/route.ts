import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-client";
import { requireSessionToken } from "@/lib/session";
type Context = { params: Promise<{ id: string }> };
async function proxy(request: Request, context: Context): Promise<Response> { const token = await requireSessionToken(); if (token instanceof Response) return token; const { id } = await context.params; const init: RequestInit = { method: request.method, headers: { "content-type": request.headers.get("content-type") ?? "application/json" } }; if (request.method === "PATCH") init.body = await request.text(); const result = await backendFetch(`/videos/${id}`, init, token); if (result.status === 204) return new Response(null, { status: 204 }); return NextResponse.json(await result.json(), { status: result.status }); }
export async function PATCH(request: Request, context: Context): Promise<Response> { return proxy(request, context); }
export async function DELETE(request: Request, context: Context): Promise<Response> { return proxy(request, context); }
