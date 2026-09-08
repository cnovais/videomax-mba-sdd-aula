import { Readable } from "node:stream";
import { beforeEach, describe, expect, it } from "vitest";
import { VideoInMemoryRepository } from "@/infra/repository/video/video.in-memory-repository";
import { VideoInMemoryQueries } from "@/infra/queries/video/video.in-memory-queries";
import { InMemoryVideoStorageGateway } from "@/infra/gateway/in-memory-video-storage.gateway";
import { FakeMediaProbeGateway } from "@/infra/gateway/fake-media-probe.gateway";
import { FakeThumbnailGateway } from "@/infra/gateway/fake-thumbnail.gateway";
import { UploadVideoUseCase } from "./upload-video.usecase";
import { ListVideosUseCase } from "./list-videos.usecase";

describe("ListVideosUseCase", () => {
  let videoRepo: VideoInMemoryRepository;
  let uploadUseCase: UploadVideoUseCase;
  let listUseCase: ListVideosUseCase;

  beforeEach(() => {
    videoRepo = new VideoInMemoryRepository();
    uploadUseCase = new UploadVideoUseCase(
      videoRepo,
      new InMemoryVideoStorageGateway(),
      new FakeMediaProbeGateway(30),
      new FakeThumbnailGateway(true),
    );
    listUseCase = new ListVideosUseCase(new VideoInMemoryQueries(videoRepo));
  });

  it("lists only the requesting user's videos", async () => {
    await uploadUseCase.execute({
      actorId: "user-1",
      originalFilename: "mine.mp4",
      content: Readable.from(Buffer.from("a")),
    });
    await uploadUseCase.execute({
      actorId: "user-2",
      originalFilename: "not-mine.mp4",
      content: Readable.from(Buffer.from("b")),
    });

    const output = await listUseCase.execute({ actorId: "user-1", page: 1, pageSize: 20 });

    expect(output.total).toBe(1);
    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.title).toBe("mine");
  });
});
