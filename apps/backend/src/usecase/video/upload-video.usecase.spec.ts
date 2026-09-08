import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { VideoInMemoryRepository } from "@/infra/repository/video/video.in-memory-repository";
import { InMemoryVideoStorageGateway } from "@/infra/gateway/in-memory-video-storage.gateway";
import { FakeMediaProbeGateway } from "@/infra/gateway/fake-media-probe.gateway";
import { FakeThumbnailGateway } from "@/infra/gateway/fake-thumbnail.gateway";
import { UnsupportedFormatError } from "@/domain/video/errors";
import { UploadVideoUseCase } from "./upload-video.usecase";

function content(): Readable {
  return Readable.from(Buffer.from("fake video bytes"));
}

describe("UploadVideoUseCase", () => {
  it("stores the file, probes duration, extracts a thumbnail", async () => {
    const videoRepo = new VideoInMemoryRepository();
    const useCase = new UploadVideoUseCase(
      videoRepo,
      new InMemoryVideoStorageGateway(),
      new FakeMediaProbeGateway(180),
      new FakeThumbnailGateway(true),
    );

    const output = await useCase.execute({
      actorId: "user-1",
      originalFilename: "lecture.mp4",
      content: content(),
    });

    expect(output.status).toBe("validating");
    expect(output.durationSeconds).toBe(180);
    expect(output.containerFormat).toBe("mp4");
    expect(output.title).toBe("lecture");
    expect(output.thumbnailUrl).toBe(`/videos/${output.id}/thumbnail`);

    const stored = await videoRepo.findById(output.id);
    expect(stored?.status).toBe("validating");
  });

  it("keeps the video when thumbnail extraction fails", async () => {
    const videoRepo = new VideoInMemoryRepository();
    const useCase = new UploadVideoUseCase(
      videoRepo,
      new InMemoryVideoStorageGateway(),
      new FakeMediaProbeGateway(90),
      new FakeThumbnailGateway(false),
    );

    const output = await useCase.execute({
      actorId: "user-1",
      originalFilename: "audio-only.mp4",
      content: content(),
    });

    expect(output.thumbnailUrl).toBeNull();
    expect(output.status).toBe("validating");
    const stored = await videoRepo.findById(output.id);
    expect(stored).not.toBeNull();
  });

  it("throws UnsupportedFormatError for a disallowed extension", async () => {
    const videoRepo = new VideoInMemoryRepository();
    const useCase = new UploadVideoUseCase(
      videoRepo,
      new InMemoryVideoStorageGateway(),
      new FakeMediaProbeGateway(),
      new FakeThumbnailGateway(),
    );

    await expect(
      useCase.execute({ actorId: "user-1", originalFilename: "notes.txt", content: content() }),
    ).rejects.toBeInstanceOf(UnsupportedFormatError);

    expect(videoRepo.all()).toHaveLength(0);
  });
});
