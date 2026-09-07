import { UnauthenticatedError } from "@/domain/_shared/errors";
import type { HttpRequest } from "@/infra/http/types";
import type { ResolveSessionUseCase } from "@/usecase/session/resolve-session.usecase";

/**
 * Authentication middleware. Populates `req.user` by resolving the
 * `Authorization: Bearer <token>` header via `ResolveSessionUseCase`.
 *
 * - When `requiresAuth` is true (protected routes, e.g. `GET /auth/me`):
 *   an absent or unresolvable token throws `UnauthenticatedError` (401).
 * - When `requiresAuth` is false (public routes, and routes that must
 *   themselves tolerate an absent/invalid token — `POST /auth/logout`):
 *   the middleware never rejects the request. It still resolves and
 *   attaches `req.user` when a valid token is presented.
 *
 * Authorization (what the resolved caller may do) is a use-case concern,
 * not this middleware's — see the `clean-arch` skill's `authorization.md`.
 */
export class AuthMiddleware {
  constructor(private readonly resolveSession: ResolveSessionUseCase) {}

  async resolve(req: HttpRequest, requiresAuth: boolean): Promise<HttpRequest> {
    const token = extractBearerToken(req.headers);

    if (!token) {
      if (requiresAuth) throw new UnauthenticatedError();
      return req;
    }

    const resolved = await this.resolveSession.execute({ token });
    if (!resolved) {
      if (requiresAuth) throw new UnauthenticatedError();
      return req;
    }

    return { ...req, user: resolved };
  }
}

export function extractBearerToken(
  headers: HttpRequest["headers"],
): string | undefined {
  const raw = headers["authorization"] ?? headers["Authorization"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("Bearer ")) return undefined;
  const token = value.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
}
