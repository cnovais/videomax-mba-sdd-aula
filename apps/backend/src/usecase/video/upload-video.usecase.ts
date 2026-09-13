import { randomUUID } from "node:crypto";
import { Video } from "@/domain/video/video.entity";
import type { VideoRepository } from "@/domain/video/video.repository";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";
import type { MediaProbeGateway } from "@/domain/video/media-probe.gateway";
import type { ThumbnailGateway } from "@/domain/video/thumbnail.gateway";
import { VideoExtension } from "@/domain/video/video-extension.vo";
import { type UploadVideoInput, type UploadVideoOutput, toOutput } from "./upload-video.dto";

/**
 * Orchestrates, in order: format guard, stream-to-disk, duration probe,
 * best-effort thumbnail extraction, persist. See spec's Technical
 * Decisions for why probing/thumbnailing run synchronously here rather
 * than deferred to a background job.
 */
export class UploadVideoUseCase {
  constructor(
    private readonly videoRepo: VideoRepository,
    private readonly storage: VideoStorageGateway,
    private readonly probe: MediaProbeGateway,
    private readonly thumbnails: ThumbnailGateway,
  ) {}

  async execute(input: UploadVideoInput): Promise<UploadVideoOutput> {
    const extension = VideoExtension.create(input.originalFilename);

    const storageId = randomUUID();
    const storageKey = `videos/${storageId}/${input.originalFilename}`;
    const thumbnailKey = `thumbnails/${storageId}.jpg`;

    const { sizeBytes } = await this.storage.store(input.content, storageKey);
    const { durationSeconds } = await this.probe.probe(this.storage.pathFor(storageKey));
    const thumbnailResult = await this.thumbnails.extract(
      this.storage.pathFor(storageKey),
      durationSeconds,
      this.storage.pathFor(thumbnailKey),
    );

    // The extension's own length is already known from the guard above —
    // no need for a second `lastIndexOf(".")` scan to strip it.
    const title = input.originalFilename.slice(0, -(extension.value.length + 1));

    const video = Video.create({
      userId: input.actorId,
      title,
      originalFilename: input.originalFilename,
      storageKey,
      sizeBytes,
      durationSeconds,
      containerFormat: extension.value,
      thumbnailPath: thumbnailResult ? thumbnailKey : null,
    });
    await this.videoRepo.save(video);

    return toOutput(video);
  }
}
