import { VideoId } from "./video-id.vo";
import { VideoStatus } from "./video-status.vo";

export type CreateVideoProps = {
  userId: string;
  title: string;
  originalFilename: string;
  storageKey: string;
  sizeBytes: number;
  durationSeconds: number;
  containerFormat: string;
  thumbnailPath: string | null;
  nextAttemptAt?: Date;
};

export type RestoreVideoProps = {
  id: string;
  userId: string;
  title: string;
  description: string;
  originalFilename: string;
  storageKey: string;
  sizeBytes: number;
  durationSeconds: number;
  containerFormat: string;
  status: string;
  thumbnailPath: string | null;
  uploadedAt: Date;
  attemptCount?: number;
  nextAttemptAt?: Date | null;
  failedStage?: string | null;
  failureReason?: string | null;
  audioStorageKey?: string | null;
};

export class Video {
  private constructor(
    private readonly _id: VideoId,
    private readonly _userId: string,
    private readonly _title: string,
    private readonly _description: string,
    private readonly _originalFilename: string,
    private readonly _storageKey: string,
    private readonly _sizeBytes: number,
    private readonly _durationSeconds: number,
    private readonly _containerFormat: string,
    private _status: VideoStatus,
    private readonly _thumbnailPath: string | null,
    private readonly _uploadedAt: Date,
    private _attemptCount: number,
    private _nextAttemptAt: Date | null,
    private _failedStage: string | null,
    private _failureReason: string | null,
    private _audioStorageKey: string | null,
  ) {}

  /**
   * Applies creation rules: a freshly uploaded video always starts in
   * `validating` (F07 owns every later transition) with an empty
   * description (F04's edit-description modal is the only way to set one).
   * `title` is expected to already be the filename-without-extension
   * default — F03 has no title input at upload time (PRD: title is only
   * user-editable later, via F04's rename).
   */
  static create(props: CreateVideoProps): Video {
    return new Video(
      VideoId.generate(),
      props.userId,
      props.title.trim(),
      "",
      props.originalFilename,
      props.storageKey,
      props.sizeBytes,
      props.durationSeconds,
      props.containerFormat,
      VideoStatus.create("validating"),
      props.thumbnailPath,
      new Date(), 0, props.nextAttemptAt ?? new Date(), null, null, null,
    );
  }

  /** Rehydrates from persistence. Skips every creation rule. */
  static restore(props: RestoreVideoProps): Video {
    return new Video(
      VideoId.from(props.id),
      props.userId,
      props.title,
      props.description,
      props.originalFilename,
      props.storageKey,
      props.sizeBytes,
      props.durationSeconds,
      props.containerFormat,
      VideoStatus.create(props.status),
      props.thumbnailPath,
      props.uploadedAt,
      props.attemptCount ?? 0,
      props.nextAttemptAt === undefined ? props.uploadedAt : props.nextAttemptAt,
      props.failedStage ?? null,
      props.failureReason ?? null,
      props.audioStorageKey ?? null,
    );
  }

  get id(): string {
    return this._id.value;
  }

  get userId(): string {
    return this._userId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get originalFilename(): string {
    return this._originalFilename;
  }

  get storageKey(): string {
    return this._storageKey;
  }

  get sizeBytes(): number {
    return this._sizeBytes;
  }

  get durationSeconds(): number {
    return this._durationSeconds;
  }

  get containerFormat(): string {
    return this._containerFormat;
  }

  get status(): string {
    return this._status.value;
  }

  get thumbnailPath(): string | null {
    return this._thumbnailPath;
  }

  get uploadedAt(): Date {
    return this._uploadedAt;
  }

  get attemptCount(): number { return this._attemptCount; }
  get nextAttemptAt(): Date | null { return this._nextAttemptAt; }
  get failedStage(): string | null { return this._failedStage; }
  get failureReason(): string | null { return this._failureReason; }
  get audioStorageKey(): string | null { return this._audioStorageKey; }

  markValidated(audioStorageKey: string): void { this._audioStorageKey = audioStorageKey; this._nextAttemptAt = new Date(); }
  advanceTo(stage: "transcribing" | "summarizing" | "ready"): void {
    this._status = VideoStatus.create(stage);
    this._attemptCount = 0;
    this._failedStage = null;
    this._failureReason = null;
    this._nextAttemptAt = new Date();
  }
  recordTransientFailure(stage: "transcribing" | "summarizing", reason: string, now = new Date()): void {
    this._attemptCount += 1; this._failedStage = stage; this._failureReason = reason;
    if (this._attemptCount >= 3) { this._status = VideoStatus.create("failed"); this._nextAttemptAt = null; return; }
    const delays = [60_000, 300_000, 900_000];
    this._nextAttemptAt = new Date(now.getTime() + (delays[this._attemptCount - 1] ?? 900_000));
  }
  failValidation(reason: string): void { this._status = VideoStatus.create("failed"); this._failedStage = "validating"; this._failureReason = reason; this._nextAttemptAt = null; }
  retry(): void {
    if (this.status !== "failed" || !this._failedStage || this._failedStage === "validating") throw new Error("Video cannot be retried without a retryable failed stage");
    this._status = VideoStatus.create(this._failedStage); this._attemptCount = 0; this._failureReason = null; this._nextAttemptAt = new Date();
  }

  toJSON(): never {
    throw new Error("Do not serialize Entity directly. Use toOutput() in the use case DTO.");
  }
}
