import type { PrismaClient } from "@prisma/client";
import type { Video } from "@/domain/video/video.entity";
import type { VideoRepository } from "@/domain/video/video.repository";
import { VideoMapper } from "./video.mapper";

export class VideoPrismaRepository implements VideoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Video | null> {
    const row = await this.prisma.video.findUnique({ where: { id } });
    return row ? VideoMapper.toDomain(row) : null;
  }

  async save(video: Video): Promise<void> {
    const data = VideoMapper.toPersistence(video);
    await this.prisma.video.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
