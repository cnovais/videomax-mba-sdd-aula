import type { Transcription } from "@/domain/video/transcription.entity";
import type { TranscriptionRepository } from "@/domain/video/transcription.repository";
export class TranscriptionInMemoryRepository implements TranscriptionRepository { private readonly values = new Map<string, Transcription>(); findByVideoId(id: string) { return Promise.resolve(this.values.get(id) ?? null); } save(value: Transcription) { this.values.set(value.videoId, value); return Promise.resolve(); } }
