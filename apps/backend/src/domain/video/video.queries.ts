import type { PageInput, PageOutput } from "@/domain/_shared/pagination";

export type VideoListItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  thumbnailPath: string | null;
  sizeBytes: number;
  durationSeconds: number;
  uploadedAt: Date;
};

export interface VideoQueries {
  listByUser(userId: string, page: PageInput, sort: VideoSort): Promise<PageOutput<VideoListItem>>;
}
export type VideoSort = "recent" | "oldest" | "title";
