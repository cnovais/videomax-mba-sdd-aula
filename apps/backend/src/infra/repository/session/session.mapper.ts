import type { Session as SessionRow } from "@prisma/client";
import { Session } from "@/domain/session/session.entity";

export type SessionPersistenceData = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export class SessionMapper {
  static toDomain(row: SessionRow): Session {
    return Session.restore({
      id: row.id,
      userId: row.userId,
      tokenDigest: row.tokenHash,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    });
  }

  static toPersistence(session: Session): SessionPersistenceData {
    return {
      id: session.id,
      userId: session.userId,
      tokenHash: session.tokenDigest,
      expiresAt: session.expiresAt,
    };
  }
}
