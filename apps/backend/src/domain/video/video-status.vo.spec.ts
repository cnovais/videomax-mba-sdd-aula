import { describe, expect, it } from "vitest";
import { InvalidVideoStatusError } from "./errors";
import { VideoStatus } from "./video-status.vo";

describe("VideoStatus", () => {
  it("accepts every allowed value", () => {
    for (const value of ["validating", "transcribing", "summarizing", "ready", "failed"]) {
      expect(VideoStatus.create(value).value).toBe(value);
    }
  });

  it("rejects an unknown value", () => {
    expect(() => VideoStatus.create("uploading")).toThrow(InvalidVideoStatusError);
  });

  it("compares by value", () => {
    expect(VideoStatus.create("ready").equals(VideoStatus.create("ready"))).toBe(true);
    expect(VideoStatus.create("ready").equals(VideoStatus.create("failed"))).toBe(false);
  });
});
