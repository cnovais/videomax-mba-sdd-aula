import type { AudioExtractionGateway } from "@/domain/video/audio-extraction.gateway";
export class FakeAudioExtractionGateway implements AudioExtractionGateway { constructor(private readonly result = "audio.wav") {} extract(_videoPath: string, _outputPath: string) { return Promise.resolve({ audioPath: this.result }); } }
