import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AudioExtractionGateway } from "@/domain/video/audio-extraction.gateway";
const execFileAsync = promisify(execFile);
export class FfmpegAudioExtractionGateway implements AudioExtractionGateway { async extract(videoPath: string, outputPath: string) { await execFileAsync("ffmpeg", ["-y", "-i", videoPath, "-vn", "-acodec", "pcm_s16le", outputPath]); return { audioPath: outputPath }; } }
