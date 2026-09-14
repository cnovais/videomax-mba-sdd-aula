import type { TranscriptionQueries } from "@/domain/video/transcription.queries";
import type { TranscriptionRepository } from "@/domain/video/transcription.repository";
export class TranscriptionInMemoryQueries implements TranscriptionQueries { constructor(private readonly repo: TranscriptionRepository) {} findByVideoId(id: string) { return this.repo.findByVideoId(id); } }
