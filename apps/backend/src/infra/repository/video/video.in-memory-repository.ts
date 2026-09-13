import type { Video } from "@/domain/video/video.entity";
import type { VideoRepository } from "@/domain/video/video.repository";

/** LSP-substitutable fake for tests — no database required. */
export class VideoInMemoryRepository implements VideoRepository {
  private readonly videosById = new Map<string, Video>();

  findById(id: string): Promise<Video | null> {
    return Promise.resolve(this.videosById.get(id) ?? null);
  }

  save(video: Video): Promise<void> {
    this.videosById.set(video.id, video);
    return Promise.resolve();
  }
  delete(id: string): Promise<void> { this.videosById.delete(id); return Promise.resolve(); }
  findAllByUserId(userId: string): Promise<Video[]> { return Promise.resolve(this.all().filter((video) => video.userId === userId)); }

  /** Test-only helper: not part of the `VideoRepository` interface. */
  all(): Video[] {
    return [...this.videosById.values()];
  }
}
