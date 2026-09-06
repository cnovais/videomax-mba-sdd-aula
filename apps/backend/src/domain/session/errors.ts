import { NotFoundError } from "@/domain/_shared/errors";

/**
 * Thrown internally by use cases that require an existing session
 * (none currently do — resolution failure is signaled by returning
 * `null`, per `ResolveSessionUseCase`). Kept for symmetry with other
 * features and for any future use case that must load a session by id
 * and treat absence as an error. At the HTTP boundary, "no resolvable
 * session" surfaces as `UnauthenticatedError` (401), not this error.
 */
export class SessionNotFoundError extends NotFoundError {
  readonly code = "SESSION_NOT_FOUND";
  readonly status = 404;

  constructor(tokenDigest: string) {
    super(`Session not found for token digest: ${tokenDigest}`);
  }
}
