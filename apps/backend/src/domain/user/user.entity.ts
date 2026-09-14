import { Email } from "./email.vo";
import { HashedPassword } from "./hashed-password.vo";
import { UserId } from "./user-id.vo";
import { LibraryViewMode, type LibraryViewModeValue } from "./library-view-mode.vo";

export type CreateUserProps = {
  name: string;
  email: string;
  password: string;
};

export type RestoreUserProps = {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: Date;
  libraryViewMode?: string;
};

export class User {
  private constructor(
    private readonly _id: UserId,
    private readonly _name: string,
    private readonly _email: Email,
    private readonly _hashedPassword: HashedPassword,
    private readonly _isAdmin: boolean,
    private readonly _isSuspended: boolean,
    private readonly _createdAt: Date,
    private readonly _libraryViewMode: LibraryViewMode,
  ) {}

  /**
   * Applies creation rules: strength-validates and hashes the password
   * (`HashedPassword.create`), format-validates the email (`Email.create`).
   * Name shape (1-200 chars, non-empty) is validated at the HTTP boundary
   * (handler's zod schema) — no domain error is reserved for it because
   * the contract does not surface one.
   */
  static create(props: CreateUserProps): User {
    return new User(
      UserId.generate(),
      props.name.trim(),
      Email.create(props.email),
      HashedPassword.create(props.password),
      false,
      false,
      new Date(),
      LibraryViewMode.create("grid"),
    );
  }

  /** Rehydrates from persistence. Skips every creation rule. */
  static restore(props: RestoreUserProps): User {
    return new User(
      UserId.from(props.id),
      props.name,
      Email.fromTrusted(props.email),
      HashedPassword.restore(props.hashedPassword),
      props.isAdmin,
      props.isSuspended,
      props.createdAt,
      LibraryViewMode.create(props.libraryViewMode ?? "grid"),
    );
  }

  verifyPassword(rawPassword: string): boolean {
    return this._hashedPassword.compare(rawPassword);
  }

  get id(): string {
    return this._id.value;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email.value;
  }

  get hashedPassword(): string {
    return this._hashedPassword.value;
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }

  get isSuspended(): boolean {
    return this._isSuspended;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get libraryViewMode(): LibraryViewModeValue { return this._libraryViewMode.value; }
  changeLibraryViewMode(mode: string): User { return User.restore({ id: this.id, name: this.name, email: this.email, hashedPassword: this.hashedPassword, isAdmin: this.isAdmin, isSuspended: this.isSuspended, createdAt: this.createdAt, libraryViewMode: LibraryViewMode.create(mode).value }); }

  toJSON(): never {
    throw new Error("Do not serialize Entity directly. Use toOutput() in the use case DTO.");
  }
}
