import type { Video as VideoRow } from "@prisma/client";
import { Video } from "@/domain/video/video.entity";

export type VideoPersistenceData = {
  id: string;
  userId: string;
  title: string;
  description: string;
  originalFilename: string;
  storageKey: string;
  sizeBytes: number;
  durationSeconds: number;
  containerFormat: string;
  status: string;
  thumbnailPath: string | null;
  uploadedAt: Date;
};

export class VideoMapper {
  static toDomain(row: VideoRow): Video {
    return Video.restore({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      originalFilename: row.originalFilename,
      storageKey: row.storageKey,
      sizeBytes: row.sizeBytes,
      durationSeconds: row.durationSeconds,
      containerFormat: row.containerFormat,
      status: row.status,
      thumbnailPath: row.thumbnailPath,
      uploadedAt: row.uploadedAt,
    });
  }

  static toPersistence(video: Video): VideoPersistenceData {
    return {
      id: video.id,
      userId: video.userId,
      title: video.title,
      description: video.description,
      originalFilename: video.originalFilename,
      storageKey: video.storageKey,
      sizeBytes: video.sizeBytes,
      durationSeconds: video.durationSeconds,
      containerFormat: video.containerFormat,
      status: video.status,
      thumbnailPath: video.thumbnailPath,
      uploadedAt: video.uploadedAt,
    };
  }
}
