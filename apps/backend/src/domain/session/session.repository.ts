import type { Session } from "./session.entity";

export interface SessionRepository {
  save(session: Session): Promise<void>;
  findByTokenDigest(tokenDigest: string): Promise<Session | null>;
  deleteByTokenDigest(tokenDigest: string): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
}
