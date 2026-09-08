import type { PrismaClient } from "@prisma/client";
import type { PageInput, PageOutput } from "@/domain/_shared/pagination";
import type { VideoListItem, VideoQueries } from "@/domain/video/video.queries";

export class VideoPrismaQueries implements VideoQueries {
  constructor(private readonly prisma: PrismaClient) {}

  async listByUser(userId: string, page: PageInput): Promise<PageOutput<VideoListItem>> {
    const skip = (page.page - 1) * page.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { userId },
        orderBy: { uploadedAt: "desc" },
        skip,
        take: page.pageSize,
      }),
      this.prisma.video.count({ where: { userId } }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        thumbnailPath: row.thumbnailPath,
        sizeBytes: row.sizeBytes,
        durationSeconds: row.durationSeconds,
        uploadedAt: row.uploadedAt,
      })),
      page: page.page,
      pageSize: page.pageSize,
      total,
    };
  }
}
