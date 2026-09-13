import type { PrismaClient } from "@prisma/client";
import { Transcription } from "@/domain/video/transcription.entity";
import type { TranscriptionRepository } from "@/domain/video/transcription.repository";
import type { TranscriptSegment } from "@/domain/video/transcription.gateway";
export class TranscriptionPrismaRepository implements TranscriptionRepository { constructor(private readonly prisma: PrismaClient) {} async findByVideoId(videoId: string) { const row = await this.prisma.transcription.findUnique({ where: { videoId } }); return row ? Transcription.create({ videoId: row.videoId, language: row.language, segments: row.segments as unknown as TranscriptSegment[] }) : null; } async save(value: Transcription) { await this.prisma.transcription.upsert({ where: { videoId: value.videoId }, create: { videoId: value.videoId, language: value.language, segments: value.segments }, update: { language: value.language, segments: value.segments } }); } }
