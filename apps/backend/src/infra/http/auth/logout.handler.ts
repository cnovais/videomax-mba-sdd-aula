import type { Handler } from "@/infra/http/handler";
import { extractBearerToken } from "@/infra/http/middleware/auth";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { RevokeSessionUseCase } from "@/usecase/session/revoke-session.usecase";

/**
 * Logout is deliberately tolerant: it reads the bearer token itself
 * (rather than relying on `req.user`, which the middleware never
 * enforces for this route — see `HttpRoute.requiresAuth`) and always
 * returns 204, whether or not the token matched an active session.
 */
export class LogoutHandler implements Handler {
  constructor(private readonly revokeSession: RevokeSessionUseCase) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const token = extractBearerToken(req.headers);
    await this.revokeSession.execute({ token });
    return { status: 204 };
  }
}
