const DEFAULT_BACKEND_URL = "http://localhost:4000";

/**
 * Authenticated backend-call helper. Every authenticated frontend→backend
 * call (this feature's `/app` placeholder today; every future
 * authenticated route from F03 onward) goes through this so the internal
 * base URL and bearer-token wiring stay in one place.
 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<Response> {
  const baseUrl = process.env["BACKEND_INTERNAL_URL"] ?? DEFAULT_BACKEND_URL;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${baseUrl}${path}`, { ...init, headers, cache: "no-store" });
}
