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

export class AdminAccessRequiredError extends NotFoundError {
  readonly code = "NOT_FOUND"; readonly status = 404;
  constructor() { super("Resource not found"); }
}
export class AccountSuspendedError extends DomainError {
  readonly code = "ACCOUNT_SUSPENDED"; readonly status = 403;
  constructor() { super("This account has been suspended"); }
}
export class LastAdminError extends ConflictError {
  readonly code = "LAST_ADMIN_CANNOT_BE_DELETED"; readonly status = 409;
  constructor() { super("The last admin cannot be deleted"); }
}
export class EmailConfirmationMismatchError extends DomainError {
  readonly code = "EMAIL_CONFIRMATION_MISMATCH"; readonly status = 422;
  constructor(value: string) { super(`Email confirmation does not match: "${value}"`); }
}
export class SelfAdminActionError extends DomainError {
  readonly code = "FORBIDDEN"; readonly status = 403;
  constructor() { super("You cannot suspend or delete your own admin account"); }
}

export class InvalidLibraryViewModeError extends DomainError {
  readonly code = "INVALID_LIBRARY_VIEW_MODE";
  readonly status = 422;
  constructor(value: string) { super(`Invalid library view mode: "${value}"`); }
}
