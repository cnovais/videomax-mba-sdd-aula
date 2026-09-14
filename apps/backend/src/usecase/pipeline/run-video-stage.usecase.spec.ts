import { describe, expect, it } from "vitest";
import type { Readable } from "node:stream";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";
import { Video } from "@/domain/video/video.entity";
import { FakeAudioExtractionGateway } from "@/infra/gateway/fake-audio-extraction.gateway";
import { FakeMediaProbeGateway } from "@/infra/gateway/fake-media-probe.gateway";
import { FakeSummaryGateway } from "@/infra/gateway/fake-summary.gateway";
import { FakeTranscriptionGateway } from "@/infra/gateway/fake-transcription.gateway";
import { SummaryInMemoryRepository } from "@/infra/repository/summary/summary.in-memory-repository";
import { TranscriptionInMemoryRepository } from "@/infra/repository/transcription/transcription.in-memory-repository";
import { VideoInMemoryRepository } from "@/infra/repository/video/video.in-memory-repository";
import { SummaryInMemoryQueries } from "@/infra/queries/summary/summary.in-memory-queries";
import { SummaryPrismaQueries } from "@/infra/queries/summary/summary.prisma-queries";
import { TranscriptionInMemoryQueries } from "@/infra/queries/transcription/transcription.in-memory-queries";
import { TranscriptionPrismaQueries } from "@/infra/queries/transcription/transcription.prisma-queries";
import { ProcessPendingVideosUseCase } from "./process-pending-videos.usecase";
import { RetryVideoUseCase } from "./retry-video.usecase";
import { RunVideoStageUseCase } from "./run-video-stage.usecase";

class FakeVideoStorage implements VideoStorageGateway {
  store(_content: Readable, _key: string): Promise<{ sizeBytes: number }> { return Promise.resolve({ sizeBytes: 0 }); }
  readStream(_key: string): Readable { throw new Error("not needed in pipeline test"); }
  pathFor(key: string): string { return `/storage/${key}`; }
  delete(_key: string): Promise<void> { return Promise.resolve(); }
}

function video(status: "validating" | "transcribing" | "summarizing" = "validating", attemptCount = 0): Video {
  const value = Video.create({ userId: "user-1", title: "sample", originalFilename: "sample.mp4", storageKey: "sample.mp4", sizeBytes: 1, durationSeconds: 4, containerFormat: "mp4", thumbnailPath: null });
  if (status === "transcribing") {
    value.markValidated("sample.mp4.wav");
    value.advanceTo("transcribing");
  }
  if (status === "summarizing") {
    value.markValidated("sample.mp4.wav");
    value.advanceTo("transcribing");
    value.advanceTo("summarizing");
  }
  for (let index = 0; index < attemptCount; index += 1) value.recordTransientFailure(status === "summarizing" ? "summarizing" : "transcribing", "temporary");
  return value;
}

function pipeline(options: { probe?: FakeMediaProbeGateway; transcription?: FakeTranscriptionGateway; summary?: FakeSummaryGateway } = {}) {
  const videos = new VideoInMemoryRepository();
  const transcripts = new TranscriptionInMemoryRepository();
  const summaries = new SummaryInMemoryRepository();
  const stage = new RunVideoStageUseCase(videos, new FakeVideoStorage(), options.probe ?? new FakeMediaProbeGateway(), new FakeAudioExtractionGateway(), options.transcription ?? new FakeTranscriptionGateway(), transcripts, options.summary ?? new FakeSummaryGateway(), summaries);
  const process = new ProcessPendingVideosUseCase({ findDue: (limit, now) => Promise.resolve(videos.all().filter((candidate) => !["ready", "failed"].includes(candidate.status) && (candidate.nextAttemptAt?.getTime() ?? 0) <= now.getTime()).slice(0, limit)), listByUser: () => Promise.resolve({ items: [], page: 1, pageSize: 20, total: 0 }), processingStatus: () => Promise.resolve(null) }, stage, 2);
  return { videos, transcripts, summaries, stage, process };
}

describe("F07 pipeline", () => {
  it("exposes transcription and summary read adapters", async () => {
    const context = pipeline();
    expect(await new TranscriptionInMemoryQueries(context.transcripts).findByVideoId("missing")).toBeNull();
    expect(await new SummaryInMemoryQueries(context.summaries).findByVideoId("missing")).toBeNull();
    void new TranscriptionPrismaQueries({} as never);
    void new SummaryPrismaQueries({} as never);
  });

  it("progresses a valid video through validation, transcription, and summary", async () => {
    const context = pipeline();
    const candidate = video();
    await context.videos.save(candidate);

    await context.process.execute();
    await context.process.execute();
    await context.process.execute();

    expect(candidate.status).toBe("ready");
    expect((await context.transcripts.findByVideoId(candidate.id))?.language).toBe("en");
    expect((await context.summaries.findByVideoId(candidate.id))?.keyTopics).toEqual(["Example topic"]);
  });

  it("fails deterministic validation without retrying", async () => {
    const context = pipeline({ probe: new FakeMediaProbeGateway(7201) });
    const candidate = video();
    await context.videos.save(candidate);

    await context.process.execute();

    expect(candidate.status).toBe("failed");
    expect(candidate.attemptCount).toBe(0);
    expect(candidate.failureReason).toBe("Videos must be at most 2 hours long");
    expect(candidate.nextAttemptAt).toBeNull();
  });

  it("backs off transient failures and marks the third failure terminal", async () => {
    const context = pipeline({ transcription: new FakeTranscriptionGateway(new Error("offline")) });
    const candidate = video("transcribing");
    await context.videos.save(candidate);

    await context.process.execute();
    expect(candidate.status).toBe("transcribing");
    expect(candidate.attemptCount).toBe(1);
    expect(candidate.nextAttemptAt).not.toBeNull();

    candidate.recordTransientFailure("transcribing", "temporary");
    await context.videos.save(candidate);
    await context.process.execute(new Date(candidate.nextAttemptAt!.getTime() + 1));
    expect(candidate.attemptCount).toBe(3);
    expect(candidate.status).toBe("failed");
    expect(candidate.nextAttemptAt).toBeNull();
  });

  it("re-enters the recorded failed stage and resets attempts", async () => {
    const context = pipeline();
    const candidate = video("transcribing", 2);
    candidate.recordTransientFailure("transcribing", "Transcription service unavailable");
    await context.videos.save(candidate);
    const retry = new RetryVideoUseCase(context.videos);

    const result = await retry.execute({ actorId: "user-1", videoId: candidate.id });
    expect(result).toEqual({ id: candidate.id, status: "transcribing", attemptCount: 0 });
    await context.process.execute();
    expect(candidate.status).toBe("summarizing");
  });
});
