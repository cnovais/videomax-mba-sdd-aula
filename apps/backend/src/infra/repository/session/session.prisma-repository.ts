import type { PrismaClient } from "@prisma/client";
import type { Session } from "@/domain/session/session.entity";
import type { SessionRepository } from "@/domain/session/session.repository";
import { SessionMapper } from "./session.mapper";

export class SessionPrismaRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(session: Session): Promise<void> {
    const data = SessionMapper.toPersistence(session);
    await this.prisma.session.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findByTokenDigest(tokenDigest: string): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { tokenHash: tokenDigest } });
    return row ? SessionMapper.toDomain(row) : null;
  }

  async deleteByTokenDigest(tokenDigest: string): Promise<void> {
    // deleteMany (not delete) so an unknown digest is a no-op, not a thrown error — idempotent.
    await this.prisma.session.deleteMany({ where: { tokenHash: tokenDigest } });
  }
}
