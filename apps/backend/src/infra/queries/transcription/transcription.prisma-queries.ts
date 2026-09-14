import type { PrismaClient } from "@prisma/client";
import type { TranscriptionQueries } from "@/domain/video/transcription.queries";
import { Transcription } from "@/domain/video/transcription.entity";
import type { TranscriptSegment } from "@/domain/video/transcription.gateway";

export class TranscriptionPrismaQueries implements TranscriptionQueries {
  constructor(private readonly prisma: PrismaClient) {}

  async findByVideoId(videoId: string): Promise<Transcription | null> {
    const row = await this.prisma.transcription.findUnique({ where: { videoId } });
    return row ? Transcription.create({ videoId: row.videoId, language: row.language, segments: row.segments as unknown as TranscriptSegment[] }) : null;
  }
}
