import { DomainError, NotFoundError } from "@/domain/_shared/errors";

export class InvalidVideoStatusError extends DomainError {
  readonly code = "INVALID_VIDEO_STATUS";
  readonly status = 422;

  constructor(value: string) {
    super(`Invalid video status: "${value}"`);
  }
}

export class VideoNotFoundError extends NotFoundError {
  readonly code = "VIDEO_NOT_FOUND";
  readonly status = 404;

  constructor(id: string) {
    super(`Video not found: ${id}`);
  }
}

export class UnsupportedFormatError extends DomainError {
  readonly code = "UNSUPPORTED_FORMAT";
  readonly status = 422;

  constructor(filename: string) {
    super(`Only MP4, MOV, MKV, WEBM, and AVI files are supported: "${filename}"`);
  }
}

export class FileTooLargeError extends DomainError {
  readonly code = "FILE_TOO_LARGE";
  readonly status = 413;

  constructor(sizeBytes: number, maxBytes: number) {
    super(`Files must be at most 2GB (received ${sizeBytes} bytes, limit ${maxBytes})`);
  }
}
