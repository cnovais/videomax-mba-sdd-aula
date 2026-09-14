import { VideoNotFoundError } from "@/domain/video/errors";
import type { VideoRepository } from "@/domain/video/video.repository";
import type { UpdateVideoDescriptionInput, UpdateVideoDescriptionOutput } from "./update-video-description.dto";
export class UpdateVideoDescriptionUseCase {
  constructor(private readonly repo: VideoRepository) {}
  async execute(input: UpdateVideoDescriptionInput): Promise<UpdateVideoDescriptionOutput> { const video = await this.repo.findById(input.videoId); if (!video || video.userId !== input.actorId) throw new VideoNotFoundError(input.videoId); const updated = video.updateDescription(input.description); await this.repo.save(updated); return { id: updated.id, description: updated.description }; }
}
