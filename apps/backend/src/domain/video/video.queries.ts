import type { PageInput, PageOutput } from "@/domain/_shared/pagination";
import type { Video } from "./video.entity";

export type VideoListItem = {
  id: string;
  title: string;
  status: string;
  thumbnailPath: string | null;
  sizeBytes: number;
  durationSeconds: number;
  uploadedAt: Date;
  attemptCount: number;
  failureReason: string | null;
};

export interface VideoQueries {
  listByUser(userId: string, page: PageInput): Promise<PageOutput<VideoListItem>>;
  countAll(): Promise<number>;
  findDue(limit: number, now: Date): Promise<Video[]>;
  processingStatus(id: string): Promise<{ status: string; attemptCount: number } | null>;
}
