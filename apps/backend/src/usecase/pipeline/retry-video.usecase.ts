import { VideoNotFailedError, VideoNotFoundError } from "@/domain/video/errors";
import type { VideoRepository } from "@/domain/video/video.repository";
import type { RetryVideoInput, RetryVideoOutput } from "./retry-video.dto";
export class RetryVideoUseCase {
  constructor(private readonly videos: VideoRepository) {}
  async execute(input: RetryVideoInput): Promise<RetryVideoOutput> {
    const video = await this.videos.findById(input.videoId);
    if (!video || video.userId !== input.actorId) throw new VideoNotFoundError(input.videoId);
    if (video.status !== "failed" || !video.failedStage || video.failedStage === "validating") throw new VideoNotFailedError(input.videoId);
    video.retry();
    await this.videos.save(video);
    return { id: video.id, status: video.status, attemptCount: video.attemptCount };
  }
}
