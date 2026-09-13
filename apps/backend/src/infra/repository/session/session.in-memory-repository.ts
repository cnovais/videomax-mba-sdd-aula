import type { Session } from "@/domain/session/session.entity";
import type { SessionRepository } from "@/domain/session/session.repository";

/** LSP-substitutable fake for tests — no database required. */
export class SessionInMemoryRepository implements SessionRepository {
  private readonly sessionsByDigest = new Map<string, Session>();

  save(session: Session): Promise<void> {
    this.sessionsByDigest.set(session.tokenDigest, session);
    return Promise.resolve();
  }

  findByTokenDigest(tokenDigest: string): Promise<Session | null> {
    return Promise.resolve(this.sessionsByDigest.get(tokenDigest) ?? null);
  }

  deleteByTokenDigest(tokenDigest: string): Promise<void> {
    this.sessionsByDigest.delete(tokenDigest);
    return Promise.resolve();
  }
  deleteAllByUserId(userId: string): Promise<void> {
    for (const [digest, session] of this.sessionsByDigest) if (session.userId === userId) this.sessionsByDigest.delete(digest);
    return Promise.resolve();
  }
}
