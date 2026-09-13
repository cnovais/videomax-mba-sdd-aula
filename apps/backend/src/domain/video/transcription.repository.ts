import type { Transcription } from "./transcription.entity";
export interface TranscriptionRepository { findByVideoId(videoId: string): Promise<Transcription | null>; save(transcription: Transcription): Promise<void>; }
