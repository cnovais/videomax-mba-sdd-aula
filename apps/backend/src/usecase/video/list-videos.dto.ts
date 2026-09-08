import type { PageInput, PageOutput } from "@/domain/_shared/pagination";
import type { VideoListItem } from "@/domain/video/video.queries";

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
};

export function toItemOutput(item: VideoListItem): VideoListItemDto {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    thumbnailUrl: item.thumbnailPath ? `/videos/${item.id}/thumbnail` : null,
    sizeBytes: item.sizeBytes,
    durationSeconds: item.durationSeconds,
    uploadedAt: item.uploadedAt.toISOString(),
  };
}
