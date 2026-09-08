import { describe, expect, it } from "vitest";
import { Video } from "./video.entity";

const BASE_PROPS = {
  userId: "user-1",
  title: "lecture-05-rnn-vs-attention",
  originalFilename: "lecture-05-rnn-vs-attention.mkv",
  storageKey: "videos/abc/lecture-05-rnn-vs-attention.mkv",
  sizeBytes: 1503238553,
  durationSeconds: 2892,
  containerFormat: "mkv",
  thumbnailPath: "thumbnails/abc.jpg",
};

describe("Video", () => {
  it("creates a video with status validating and an empty description", () => {
    const video = Video.create(BASE_PROPS);

    expect(video.status).toBe("validating");
    expect(video.description).toBe("");
    expect(video.title).toBe("lecture-05-rnn-vs-attention");
    expect(video.durationSeconds).toBe(2892);
    expect(video.thumbnailPath).toBe("thumbnails/abc.jpg");
    expect(video.id).toBeTruthy();
  });

  it("allows a null thumbnailPath (extraction failure fallback)", () => {
    const video = Video.create({ ...BASE_PROPS, thumbnailPath: null });
    expect(video.thumbnailPath).toBeNull();
  });

  it("restores from persistence without re-applying creation rules", () => {
    const video = Video.restore({
      id: "video-1",
      userId: "user-1",
      title: "Renamed Title",
      description: "Some description",
      originalFilename: "raw.mp4",
      storageKey: "videos/video-1/raw.mp4",
      sizeBytes: 42,
      durationSeconds: 10,
      containerFormat: "mp4",
      status: "ready",
      thumbnailPath: null,
      uploadedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(video.id).toBe("video-1");
    expect(video.title).toBe("Renamed Title");
    expect(video.status).toBe("ready");
  });

  it("throws when serialized directly", () => {
    const video = Video.create(BASE_PROPS);
    expect(() => video.toJSON()).toThrow();
  });
});
