import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FfprobeMediaProbeGateway } from "./ffprobe-media-probe.gateway";

const FIXTURES_ROOT = fileURLToPath(new URL("../../../../../video-samples", import.meta.url));

describe("FfprobeMediaProbeGateway (real ffprobe)", () => {
  it("probes the exact duration of a valid video", async () => {
    const gateway = new FfprobeMediaProbeGateway();
    const { durationSeconds } = await gateway.probe(resolve(FIXTURES_ROOT, "tiny-valid.mp4"));
    expect(durationSeconds).toBe(3);
  });

  it("probes duration on an audio-only container too (no video stream needed)", async () => {
    const gateway = new FfprobeMediaProbeGateway();
    const { durationSeconds } = await gateway.probe(resolve(FIXTURES_ROOT, "audio-only.mp4"));
    expect(durationSeconds).toBe(3);
  });
});
