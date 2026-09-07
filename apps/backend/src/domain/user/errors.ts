import {
  ConflictError,
  DomainError,
  NotFoundError,
} from "@/domain/_shared/errors";

export class InvalidEmailError extends DomainError {
  readonly code = "INVALID_EMAIL";
  readonly status = 422;

  constructor(value: string) {
    super(`Invalid email: "${value}"`);
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = "WEAK_PASSWORD";
  readonly status = 422;

  constructor(reasons: string[]) {
    super(`Password too weak: ${reasons.join(", ")}`, { reasons });
  }
}

export class UserNotFoundError extends NotFoundError {
  readonly code = "USER_NOT_FOUND";
  readonly status = 404;

  constructor(id: string) {
    super(`User not found: ${id}`);
  }
}

export class UserAlreadyExistsError extends ConflictError {
  readonly code = "USER_ALREADY_EXISTS";
  readonly status = 409;

  constructor(email: string) {
    super(`User already exists: ${email}`);
  }
}
