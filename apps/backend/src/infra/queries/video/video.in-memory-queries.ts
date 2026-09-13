import type { PageInput, PageOutput } from "@/domain/_shared/pagination";
import type { VideoListItem, VideoQueries } from "@/domain/video/video.queries";
import type { VideoInMemoryRepository } from "@/infra/repository/video/video.in-memory-repository";

/** LSP-substitutable fake — reads from the same in-memory repository store. */
export class VideoInMemoryQueries implements VideoQueries {
  constructor(private readonly repo: VideoInMemoryRepository) {}

  listByUser(userId: string, page: PageInput): Promise<PageOutput<VideoListItem>> {
    const all = this.repo
      .all()
      .filter((video) => video.userId === userId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    const start = (page.page - 1) * page.pageSize;
    const items = all.slice(start, start + page.pageSize).map((video) => ({
      id: video.id,
      title: video.title,
      status: video.status,
      thumbnailPath: video.thumbnailPath,
      sizeBytes: video.sizeBytes,
      durationSeconds: video.durationSeconds,
      uploadedAt: video.uploadedAt,
    }));

    return Promise.resolve({ items, page: page.page, pageSize: page.pageSize, total: all.length });
  }
  countAll(): Promise<number> { return Promise.resolve(this.repo.all().length); }
}
