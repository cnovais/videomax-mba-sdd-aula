import type { Video } from "./video.entity";

export interface VideoRepository {
  findById(id: string): Promise<Video | null>;
  save(video: Video): Promise<void>;
  delete(id: string): Promise<void>;
}
