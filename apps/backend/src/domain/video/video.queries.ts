import type { PageInput, PageOutput } from "@/domain/_shared/pagination";

export type VideoListItem = {
  id: string;
  title: string;
  status: string;
  thumbnailPath: string | null;
  sizeBytes: number;
  durationSeconds: number;
  uploadedAt: Date;
};

export interface VideoQueries {
  listByUser(userId: string, page: PageInput): Promise<PageOutput<VideoListItem>>;
}
