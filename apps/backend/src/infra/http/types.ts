import type { Readable } from "node:stream";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequest = {
  method: HttpMethod;
  path: string;
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
  user?: { id: string; isAdmin: boolean };
  /**
   * Present only for `multipart/form-data` requests (routes with
   * `isMultipart: true` — see `HttpRoute` below) — the single uploaded
   * file part, as a stream, extracted by the framework adapter before the
   * handler runs. `body` stays `undefined` on these requests.
   */
  file?: { stream: Readable; filename: string };
};

export type HttpResponse = {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export type HttpRoute = {
  method: HttpMethod;
  path: string;
  handler: { handle(req: HttpRequest): Promise<HttpResponse> };
  /**
   * When true, the auth middleware requires a resolvable
   * `Authorization: Bearer <token>` header and throws `UnauthenticatedError`
   * otherwise. When false (default), the middleware still attempts to
   * resolve a presented token (populating `req.user`) but never rejects the
   * request — used by public routes (register/login) and by routes that
   * must tolerate an absent/invalid token themselves (logout).
   */
  requiresAuth?: boolean;
  /**
   * When true, the framework adapter parses the request as
   * `multipart/form-data` and populates `HttpRequest.file` instead of
   * `HttpRequest.body`.
   */
  isMultipart?: boolean;
};
