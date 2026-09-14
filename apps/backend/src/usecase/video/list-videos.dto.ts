import type { PageInput, PageOutput } from "@/domain/_shared/pagination";
import type { VideoListItem } from "@/domain/video/video.queries";
import { toThumbnailUrl } from "./upload-video.dto";

export type ListVideosInput = PageInput & { actorId: string };
export type ListVideosOutput = PageOutput<VideoListItemDto>;

export type VideoListItemDto = {
  id: string;
  title: string;
  status: string;
  thumbnailUrl: string | null;
  sizeBytes: number;
  durationSeconds: number;
  uploadedAt: string;
  attemptCount: number;
  failureReason: string | null;
};

export function toItemOutput(item: VideoListItem): VideoListItemDto {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    thumbnailUrl: toThumbnailUrl(item.id, item.thumbnailPath),
    sizeBytes: item.sizeBytes,
    durationSeconds: item.durationSeconds,
    uploadedAt: item.uploadedAt.toISOString(),
    attemptCount: item.attemptCount,
    failureReason: item.failureReason,
  };
}
