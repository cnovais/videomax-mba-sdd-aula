import { UnsupportedFormatError } from "./errors";

const ALLOWED = ["mp4", "mov", "mkv", "webm", "avi"] as const;
export type AllowedVideoExtension = (typeof ALLOWED)[number];

/**
 * The PRD's accepted-format allowlist as a domain invariant, not a loose
 * constant — extension is exactly the value the client-side check also
 * validates, so the two stay in lockstep by construction (see spec's
 * Technical Decisions).
 */
export class VideoExtension {
  static readonly ALLOWED = ALLOWED;

  private constructor(readonly value: AllowedVideoExtension) {}

  /** Derives and validates the extension from a filename (e.g. "clip.MP4" -> "mp4"). */
  static create(filename: string): VideoExtension {
    const dotIndex = filename.lastIndexOf(".");
    const raw = dotIndex === -1 ? "" : filename.slice(dotIndex + 1).toLowerCase();
    if (!ALLOWED.includes(raw as AllowedVideoExtension)) throw new UnsupportedFormatError(filename);
    return new VideoExtension(raw as AllowedVideoExtension);
  }
}
