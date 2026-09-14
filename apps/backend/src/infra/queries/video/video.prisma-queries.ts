import type { PrismaClient } from "@prisma/client";
import type { PageInput, PageOutput } from "@/domain/_shared/pagination";
import type { VideoListItem, VideoQueries, VideoSort } from "@/domain/video/video.queries";
import { VideoMapper } from "@/infra/repository/video/video.mapper";

export class VideoPrismaQueries implements VideoQueries {
  constructor(private readonly prisma: PrismaClient) {}

  async listByUser(userId: string, page: PageInput, sort: VideoSort): Promise<PageOutput<VideoListItem>> {
    const skip = (page.page - 1) * page.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { userId },
        orderBy: sort === "title" ? { title: "asc" } : { uploadedAt: sort === "oldest" ? "asc" : "desc" },
        skip,
        take: page.pageSize,
      }),
      this.prisma.video.count({ where: { userId } }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        thumbnailPath: row.thumbnailPath,
        sizeBytes: row.sizeBytes,
        durationSeconds: row.durationSeconds,
        uploadedAt: row.uploadedAt,
        attemptCount: row.attemptCount,
        failureReason: row.failureReason,
      })),
      page: page.page,
      pageSize: page.pageSize,
      total,
    };
  }
  countAll(): Promise<number> { return this.prisma.video.count(); }

  async findDue(limit: number, now: Date): Promise<ReturnType<typeof VideoMapper.toDomain>[]> {
    const rows = await this.prisma.video.findMany({ where: { status: { notIn: ["ready", "failed"] }, nextAttemptAt: { lte: now } }, take: limit });
    return rows.map((row) => VideoMapper.toDomain(row));
  }

  async processingStatus(id: string): Promise<{ status: string; attemptCount: number } | null> {
    return this.prisma.video.findUnique({ where: { id }, select: { status: true, attemptCount: true } });
  }
}
