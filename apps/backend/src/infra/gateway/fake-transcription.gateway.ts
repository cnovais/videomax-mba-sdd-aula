import type { TranscriptionGateway, TranscriptionResult } from "@/domain/video/transcription.gateway";
export class FakeTranscriptionGateway implements TranscriptionGateway {
  constructor(private readonly result: TranscriptionResult | Error = { language: "en", segments: [{ startSeconds: 0, endSeconds: 1, text: "Example transcript" }] }) {}

  async transcribe(_audioPath: string): Promise<TranscriptionResult> {
    if (this.result instanceof Error) return Promise.reject(this.result);
    return Promise.resolve(this.result);
  }
}
