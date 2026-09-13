import type { TranscriptSegment } from "./transcription.gateway";
export class Transcription {
  private constructor(readonly videoId: string, readonly language: string, readonly segments: TranscriptSegment[]) {}
  static create(props: { videoId: string; language: string; segments: TranscriptSegment[] }): Transcription { return new Transcription(props.videoId, props.language, props.segments); }
}
