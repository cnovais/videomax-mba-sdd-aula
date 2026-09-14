import type { Transcription } from "./transcription.entity";
export interface TranscriptionQueries { findByVideoId(videoId: string): Promise<Transcription | null>; }
