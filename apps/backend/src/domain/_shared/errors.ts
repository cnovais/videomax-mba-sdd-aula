/**
 * Shared error hierarchy. `AppError` carries its own HTTP status and a
 * stable `code` string for API consumers. Concrete per-feature errors
 * extend the abstract categories below; the central `toHttpResponse`
 * mapper (infra/http/error-handler.ts) is the only place these are
 * translated into an HTTP response.
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly status: number;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

// Abstract categories — concrete errors per feature extend these.
export abstract class DomainError extends AppError {} // 400 / 422 — invariant violation
export abstract class NotFoundError extends AppError {} // 404 — resource does not exist
export abstract class ConflictError extends AppError {} // 409 — state conflict

// Concrete generic errors — instantiated directly by use cases / middleware.
export class UnauthenticatedError extends AppError {
  readonly code = "UNAUTHENTICATED";
  readonly status = 401;

  constructor(message = "Authentication required") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor(message = "Forbidden") {
    super(message);
  }
}

export class InvalidIdError extends DomainError {
  readonly code = "INVALID_ID";
  readonly status = 422;

  constructor(value: string) {
    super(`Invalid id: "${value}"`);
  }
}
