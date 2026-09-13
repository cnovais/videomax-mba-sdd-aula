import { DescriptionTooLongError } from "./errors";
export class VideoDescription {
  private constructor(private readonly _value: string) {}
  get value(): string { return this._value; }
  static create(raw: string): VideoDescription { if (raw.length > 2000) throw new DescriptionTooLongError(raw); return new VideoDescription(raw); }
  equals(other: VideoDescription): boolean { return this.value === other.value; }
}
