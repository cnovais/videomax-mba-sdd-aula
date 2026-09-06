import bcrypt from "bcryptjs";
import { WeakPasswordError } from "./errors";

const MIN_LENGTH = 8;
const COST_FACTOR = 10;

/**
 * Validates password strength (PRD: at least 8 characters, at least one
 * letter, at least one number) and hashes with bcrypt (cost 10) on
 * `create`. `restore` skips both — used only to rehydrate an already
 * hashed value from persistence.
 */
export class HashedPassword {
  private constructor(private readonly hash: string) {}

  static create(rawPassword: string): HashedPassword {
    const reasons = validate(rawPassword);
    if (reasons.length > 0) throw new WeakPasswordError(reasons);
    return new HashedPassword(bcrypt.hashSync(rawPassword, COST_FACTOR));
  }

  /** Rehydrates an already-hashed value from persistence. Skips validation and hashing. */
  static restore(hash: string): HashedPassword {
    return new HashedPassword(hash);
  }

  compare(rawPassword: string): boolean {
    return bcrypt.compareSync(rawPassword, this.hash);
  }

  get value(): string {
    return this.hash;
  }
}

function validate(rawPassword: string): string[] {
  const reasons: string[] = [];
  if (rawPassword.length < MIN_LENGTH) reasons.push("too_short");
  if (!/[a-zA-Z]/.test(rawPassword)) reasons.push("missing_letter");
  if (!/[0-9]/.test(rawPassword)) reasons.push("missing_number");
  return reasons;
}
