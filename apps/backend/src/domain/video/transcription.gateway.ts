export type TranscriptSegment = { startSeconds: number; endSeconds: number; text: string };
export type TranscriptionResult = { language: string; segments: TranscriptSegment[] };
export interface TranscriptionGateway { transcribe(audioPath: string): Promise<TranscriptionResult>; }
