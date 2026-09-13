import { InvalidLibraryViewModeError } from "./errors";
export type LibraryViewModeValue = "grid" | "list";
export class LibraryViewMode {
  private constructor(private readonly _value: LibraryViewModeValue) {}
  get value(): LibraryViewModeValue { return this._value; }
  static create(raw: string): LibraryViewMode { if (raw !== "grid" && raw !== "list") throw new InvalidLibraryViewModeError(raw); return new LibraryViewMode(raw); }
  equals(other: LibraryViewMode): boolean { return this.value === other.value; }
}
