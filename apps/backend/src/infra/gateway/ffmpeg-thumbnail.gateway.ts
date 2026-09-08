import { execFile } from "node:child_process";
import { stat, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import type { ThumbnailGateway } from "@/domain/video/thumbnail.gateway";

const execFileAsync = promisify(execFile);

export class FfmpegThumbnailGateway implements ThumbnailGateway {
  async extract(
    videoPath: string,
    durationSeconds: number,
    outputPath: string,
  ): Promise<{ sizeBytes: number } | null> {
    const timestampSeconds = Math.max(0, durationSeconds * 0.1);

    try {
      await mkdir(dirname(outputPath), { recursive: true });
      await execFileAsync("ffmpeg", [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-ss",
        String(timestampSeconds),
        "-i",
        videoPath,
        "-vframes",
        "1",
        "-q:v",
        "4",
        outputPath,
      ]);
      const { size } = await stat(outputPath);
      return { sizeBytes: size };
    } catch {
      // Best-effort: no video stream to extract from, corrupt data, ffmpeg
      // missing, etc. The caller treats a null result as "no thumbnail" —
      // never a thrown error (PRD: extraction failure must not block upload).
      return null;
    }
  }
}
