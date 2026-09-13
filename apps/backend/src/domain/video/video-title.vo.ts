import { InvalidTitleError } from "./errors";
export class VideoTitle {
  private constructor(private readonly _value: string) {}
  get value(): string { return this._value; }
  static create(raw: string): VideoTitle { const value = raw.trim(); if (value.length < 1 || value.length > 200) throw new InvalidTitleError(raw); return new VideoTitle(value); }
  equals(other: VideoTitle): boolean { return this.value === other.value; }
}
