import { VideoNotFoundError } from "@/domain/video/errors";
import type { VideoRepository } from "@/domain/video/video.repository";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";
import type { GetVideoThumbnailInput, GetVideoThumbnailOutput } from "./get-video-thumbnail.dto";

export class GetVideoThumbnailUseCase {
  constructor(
    private readonly videoRepo: VideoRepository,
    private readonly storage: VideoStorageGateway,
  ) {}

  /**
   * Masks "doesn't exist", "not yours", and "has no thumbnail yet" behind
   * the same 404 — no signal to a caller probing IDs it doesn't own.
   */
  async execute(input: GetVideoThumbnailInput): Promise<GetVideoThumbnailOutput> {
    const video = await this.videoRepo.findById(input.videoId);
    if (!video || video.userId !== input.actorId || !video.thumbnailPath) {
      throw new VideoNotFoundError(input.videoId);
    }
    return { stream: this.storage.readStream(video.thumbnailPath) };
  }
}
