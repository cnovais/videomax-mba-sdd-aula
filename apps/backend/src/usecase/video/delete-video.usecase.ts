import { VideoNotFoundError } from "@/domain/video/errors";
import type { VideoRepository } from "@/domain/video/video.repository";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";
import type { DeleteVideoInput } from "./delete-video.dto";
export class DeleteVideoUseCase {
  constructor(private readonly repo: VideoRepository, private readonly storage: VideoStorageGateway) {}
  async execute(input: DeleteVideoInput): Promise<void> { const video = await this.repo.findById(input.videoId); if (!video || video.userId !== input.actorId) throw new VideoNotFoundError(input.videoId); await this.repo.delete(video.id); await this.remove(video.storageKey); if (video.thumbnailPath) await this.remove(video.thumbnailPath); }
  private async remove(key: string): Promise<void> { try { await this.storage.delete(key); } catch { /* row deletion is authoritative */ } }
}
