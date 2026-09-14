import type { AudioExtractionGateway } from "@/domain/video/audio-extraction.gateway";
import type { MediaProbeGateway } from "@/domain/video/media-probe.gateway";
import type { SummaryGateway } from "@/domain/video/summary.gateway";
import type { SummaryRepository } from "@/domain/video/summary.repository";
import type { TranscriptionGateway } from "@/domain/video/transcription.gateway";
import type { TranscriptionRepository } from "@/domain/video/transcription.repository";
import type { Video } from "@/domain/video/video.entity";
import type { VideoRepository } from "@/domain/video/video.repository";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";
import { Summary } from "@/domain/video/summary.entity";
import { Transcription } from "@/domain/video/transcription.entity";
import type { RunVideoStageOutput } from "./run-video-stage.dto";

export class RunVideoStageUseCase {
  constructor(private readonly videos: VideoRepository, private readonly storage: VideoStorageGateway, private readonly probe: MediaProbeGateway, private readonly audio: AudioExtractionGateway, private readonly transcription: TranscriptionGateway, private readonly transcripts: TranscriptionRepository, private readonly summary: SummaryGateway, private readonly summaries: SummaryRepository) {}
  async execute(video: Video): Promise<RunVideoStageOutput> {
    try {
      if (video.status === "validating") return await this.validate(video);
      if (video.status === "transcribing") return await this.transcribe(video);
      if (video.status === "summarizing") return await this.summarize(video);
    } catch (error) {
      if (video.status === "transcribing") video.recordTransientFailure("transcribing", "Transcription service unavailable");
      else if (video.status === "summarizing") video.recordTransientFailure("summarizing", "Summary generation failed");
      else throw error;
      await this.videos.save(video);
    }
  }
  private async validate(video: Video): Promise<void> {
    const result = await this.probe.probe(this.storage.pathFor(video.storageKey));
    if (result.durationSeconds > 7200) {
      video.failValidation("Videos must be at most 2 hours long");
      await this.videos.save(video);
      return;
    }
    if (!result.isReadable || !result.hasSupportedCodecs) {
      video.failValidation("Invalid or unreadable file");
      await this.videos.save(video);
      return;
    }
    try {
      const output = `${video.storageKey}.wav`;
      const extracted = await this.audio.extract(this.storage.pathFor(video.storageKey), this.storage.pathFor(output));
      video.markValidated(extracted.audioPath);
      video.advanceTo("transcribing");
      await this.videos.save(video);
    } catch {
      video.failValidation("Invalid or unreadable file");
      await this.videos.save(video);
    }
  }
  private async transcribe(video: Video): Promise<void> { const result = await this.transcription.transcribe(this.storage.pathFor(video.audioStorageKey ?? video.storageKey)); await this.transcripts.save(Transcription.create({ videoId: video.id, language: result.language, segments: result.segments })); video.advanceTo("summarizing"); await this.videos.save(video); }
  private async summarize(video: Video): Promise<void> { const transcript = await this.transcripts.findByVideoId(video.id); const result = await this.summary.summarize(transcript?.segments.map((segment) => segment.text).join(" ") ?? ""); await this.summaries.save(Summary.create({ videoId: video.id, overview: result.overview, keyTopics: result.keyTopics })); video.advanceTo("ready"); await this.videos.save(video); }
}
