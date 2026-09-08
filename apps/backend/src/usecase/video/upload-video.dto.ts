import type { Readable } from "node:stream";
import type { Video } from "@/domain/video/video.entity";

export type UploadVideoInput = {
  actorId: string;
  originalFilename: string;
  content: Readable;
};

export type UploadVideoOutput = {
  id: string;
  title: string;
  description: string;
  originalFilename: string;
  sizeBytes: number;
  durationSeconds: number;
  containerFormat: string;
  status: string;
  thumbnailUrl: string | null;
  uploadedAt: string;
};

/** Shared with list-videos.dto.ts's `toItemOutput` — one source of truth for the URL scheme. */
export function toThumbnailUrl(id: string, thumbnailPath: string | null): string | null {
  return thumbnailPath ? `/videos/${id}/thumbnail` : null;
}

export function toOutput(video: Video): UploadVideoOutput {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    originalFilename: video.originalFilename,
    sizeBytes: video.sizeBytes,
    durationSeconds: video.durationSeconds,
    containerFormat: video.containerFormat,
    status: video.status,
    thumbnailUrl: toThumbnailUrl(video.id, video.thumbnailPath),
    uploadedAt: video.uploadedAt.toISOString(),
  };
}
