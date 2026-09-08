import { InvalidVideoStatusError } from "./errors";

const ALLOWED = ["validating", "transcribing", "summarizing", "ready", "failed"] as const;
export type VideoStatusValue = (typeof ALLOWED)[number];

/**
 * `transcribing`/`summarizing`/`ready`/`failed` are not reachable through
 * this feature's own use cases — F03 only ever creates a video in
 * `validating`. They are declared now because the pipeline (F07) will
 * transition into them without a schema change; keeping the full set here
 * (rather than a `validating`-only enum) avoids a second migration.
 */
export class VideoStatus {
  private constructor(readonly value: VideoStatusValue) {}

  static create(raw: string): VideoStatus {
    if (!ALLOWED.includes(raw as VideoStatusValue)) throw new InvalidVideoStatusError(raw);
    return new VideoStatus(raw as VideoStatusValue);
  }

  equals(other: VideoStatus): boolean {
    return this.value === other.value;
  }
}
