import type { AudioExtractionGateway } from "@/domain/video/audio-extraction.gateway";
export class FakeAudioExtractionGateway implements AudioExtractionGateway {
  constructor(private readonly result: string | Error = "audio.wav") {}

  async extract(_videoPath: string, _outputPath: string): Promise<{ audioPath: string }> {
    if (this.result instanceof Error) return Promise.reject(this.result);
    return Promise.resolve({ audioPath: this.result });
  }
}
