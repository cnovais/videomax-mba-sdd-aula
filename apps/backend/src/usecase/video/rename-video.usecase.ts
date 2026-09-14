import { VideoNotFoundError } from "@/domain/video/errors";
import type { VideoRepository } from "@/domain/video/video.repository";
import type { RenameVideoInput, RenameVideoOutput } from "./rename-video.dto";
export class RenameVideoUseCase {
  constructor(private readonly repo: VideoRepository) {}
  async execute(input: RenameVideoInput): Promise<RenameVideoOutput> { const video = await this.repo.findById(input.videoId); if (!video || video.userId !== input.actorId) throw new VideoNotFoundError(input.videoId); const updated = video.rename(input.title); await this.repo.save(updated); return { id: updated.id, title: updated.title }; }
}
