import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { MediaProbeGateway } from "@/domain/video/media-probe.gateway";

const execFileAsync = promisify(execFile);

type FfprobeOutput = {
  format?: { duration?: string };
  streams?: Array<{ codec_type?: string; codec_name?: string }>;
};

const VIDEO_CODECS = new Set(["h264", "hevc", "mpeg4", "vp8", "vp9", "av1"]);
const AUDIO_CODECS = new Set(["aac", "mp3", "opus", "vorbis", "flac", "pcm_s16le"]);

export class FfprobeMediaProbeGateway implements MediaProbeGateway {
  async probe(path: string): Promise<{ durationSeconds: number; isReadable: boolean; hasSupportedCodecs: boolean }> {
    try {
      const { stdout } = await execFileAsync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name", "-of", "json", path]);
      const parsed = JSON.parse(stdout) as FfprobeOutput;
      const raw = parsed.format?.duration;
      const streams = parsed.streams ?? [];
      const hasSupportedCodecs = streams.length > 0 && streams.every((stream) => {
        if (stream.codec_type === "video") return VIDEO_CODECS.has(stream.codec_name ?? "");
        if (stream.codec_type === "audio") return AUDIO_CODECS.has(stream.codec_name ?? "");
        return true;
      });
      return { durationSeconds: raw ? Math.round(Number(raw)) : 0, isReadable: true, hasSupportedCodecs };
    } catch {
      return { durationSeconds: 0, isReadable: false, hasSupportedCodecs: false };
    }
  }
}
