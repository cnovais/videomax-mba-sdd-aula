import { backendFetch } from "@/lib/backend-client";
import { requireSessionToken } from "@/lib/session";

/** Streams the backend's thumbnail JPEG straight through — never buffered. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const token = await requireSessionToken();
  if (token instanceof Response) return token;

  const { id } = await params;
  const backendResponse = await backendFetch(`/videos/${id}/thumbnail`, { method: "GET" }, token);

  if (!backendResponse.ok) {
    const data: unknown = await backendResponse.json();
    return Response.json(data, { status: backendResponse.status });
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: { "content-type": backendResponse.headers.get("content-type") ?? "image/jpeg" },
  });
}
