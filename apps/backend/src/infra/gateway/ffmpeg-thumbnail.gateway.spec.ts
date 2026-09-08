import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FfmpegThumbnailGateway } from "./ffmpeg-thumbnail.gateway";

const FIXTURES_ROOT = fileURLToPath(new URL("../../../../../video-samples", import.meta.url));

describe("FfmpegThumbnailGateway (real ffmpeg)", () => {
  let outDir: string;

  beforeEach(async () => {
    outDir = await mkdtemp(join(tmpdir(), "ffmpeg-thumbnail-spec-"));
  });

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it("extracts a JPEG frame from a valid video", async () => {
    const gateway = new FfmpegThumbnailGateway();
    const outputPath = join(outDir, "thumb.jpg");

    const result = await gateway.extract(resolve(FIXTURES_ROOT, "tiny-valid.mp4"), 3, outputPath);

    expect(result).not.toBeNull();
    expect(result?.sizeBytes).toBeGreaterThan(0);
    const bytes = await readFile(outputPath);
    // JPEG magic number.
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
  });

  it("returns null for a file with no video stream (audio-only.mp4)", async () => {
    const gateway = new FfmpegThumbnailGateway();
    const outputPath = join(outDir, "thumb.jpg");

    const result = await gateway.extract(resolve(FIXTURES_ROOT, "audio-only.mp4"), 3, outputPath);

    expect(result).toBeNull();
  });
});
