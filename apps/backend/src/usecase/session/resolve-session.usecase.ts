import { SessionNotFoundError } from "@/domain/session/errors";
import type { Session } from "@/domain/session/session.entity";
import { SessionToken } from "@/domain/session/session-token.vo";
import type { SessionRepository } from "@/domain/session/session.repository";
import type { UserRepository } from "@/domain/user/user.repository";
import type { ResolveSessionInput, ResolveSessionOutput } from "./resolve-session.dto";

/**
 * Used by the auth middleware (and indirectly by `GET /auth/me`): looks
 * up a token digest, loads the owning user, and returns `{id, isAdmin}`.
 * Returns `null` — never throws — when the token does not resolve to an
 * active session or the owning user no longer exists; the caller (the
 * auth middleware) is responsible for turning that into `UnauthenticatedError`
 * where the route requires it.
 */
export class ResolveSessionUseCase {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly userRepo: UserRepository,
    private readonly sessionSecret: string,
  ) {}

  async execute(input: ResolveSessionInput): Promise<ResolveSessionOutput | null> {
    try {
      const session = await this.loadActiveSession(input.token);
      const user = await this.userRepo.findById(session.userId);
      if (!user) return null;
      return { id: user.id, isAdmin: user.isAdmin };
    } catch (error) {
      if (error instanceof SessionNotFoundError) return null;
      throw error;
    }
  }

  private async loadActiveSession(rawToken: string): Promise<Session> {
    const digest = SessionToken.digestFor(rawToken, this.sessionSecret);
    const session = await this.sessionRepo.findByTokenDigest(digest);
    if (!session || session.isExpired()) throw new SessionNotFoundError(digest);
    return session;
  }
}
