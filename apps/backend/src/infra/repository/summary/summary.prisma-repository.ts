import type { PrismaClient } from "@prisma/client";
import { Summary } from "@/domain/video/summary.entity";
import type { SummaryRepository } from "@/domain/video/summary.repository";

export class SummaryPrismaRepository implements SummaryRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async findByVideoId(videoId: string): Promise<Summary | null> {
    const row = await this.prisma.summary.findUnique({ where: { videoId } });
    return row ? Summary.restore({ videoId: row.videoId, overview: row.overview, keyTopics: row.keyTopics as string[] }) : null;
  }
  async save(value: Summary): Promise<void> {
    await this.prisma.summary.upsert({ where: { videoId: value.videoId }, create: { videoId: value.videoId, overview: value.overview, keyTopics: value.keyTopics }, update: { overview: value.overview, keyTopics: value.keyTopics } });
  }
}
