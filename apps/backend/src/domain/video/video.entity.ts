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
    private readonly _status: VideoStatus,
    private readonly _thumbnailPath: string | null,
    private readonly _uploadedAt: Date,
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
      new Date(),
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

  toJSON(): never {
    throw new Error("Do not serialize Entity directly. Use toOutput() in the use case DTO.");
  }
}
