import { SessionToken } from "@/domain/session/session-token.vo";
import type { SessionRepository } from "@/domain/session/session.repository";
import type { RevokeSessionInput } from "./revoke-session.dto";

/**
 * Logout: deletes the session matching the presented token's digest.
 * Idempotent — no error when the token is absent, malformed, or already
 * doesn't match an active session.
 */
export class RevokeSessionUseCase {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly sessionSecret: string,
  ) {}

  async execute(input: RevokeSessionInput): Promise<void> {
    if (!input.token) return;

    const digest = SessionToken.digestFor(input.token, this.sessionSecret);
    await this.sessionRepo.deleteByTokenDigest(digest);
  }
}
