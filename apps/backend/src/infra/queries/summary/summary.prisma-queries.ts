import type { PrismaClient } from "@prisma/client";
import type { SummaryQueries } from "@/domain/video/summary.queries";
import { Summary } from "@/domain/video/summary.entity";

export class SummaryPrismaQueries implements SummaryQueries {
  constructor(private readonly prisma: PrismaClient) {}

  async findByVideoId(videoId: string): Promise<Summary | null> {
    const row = await this.prisma.summary.findUnique({ where: { videoId } });
    return row ? Summary.create({ videoId: row.videoId, overview: row.overview, keyTopics: row.keyTopics as string[] }) : null;
  }
}
