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

export class MissingFilePartError extends DomainError {
  readonly code = "MISSING_FILE_PART";
  readonly status = 400;

  constructor() {
    super('Multipart request has no "video" file part');
  }
}

// No FileTooLargeError domain class: the 413 response for an oversized
// upload is @fastify/multipart's own file-size-limit error (FST_REQ_FILE_
// TOO_LARGE), mapped inline in infra/http/error-handler.ts — the same
// pattern already used there for ZodError, which also has no AppError
// wrapper of its own.
