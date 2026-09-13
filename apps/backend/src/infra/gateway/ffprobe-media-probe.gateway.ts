import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { MediaProbeGateway } from "@/domain/video/media-probe.gateway";

const execFileAsync = promisify(execFile);

type FfprobeFormatOutput = { format?: { duration?: string } };

export class FfprobeMediaProbeGateway implements MediaProbeGateway {
  async probe(path: string): Promise<{ durationSeconds: number; isReadable: boolean; hasSupportedCodecs: boolean }> {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      path,
    ]);

    const parsed = JSON.parse(stdout) as FfprobeFormatOutput;
    const raw = parsed.format?.duration;
    return { durationSeconds: raw ? Math.round(Number(raw)) : 0, isReadable: true, hasSupportedCodecs: true };
  }
}
