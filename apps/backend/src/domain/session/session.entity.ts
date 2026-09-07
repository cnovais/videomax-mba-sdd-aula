import { Id } from "@/domain/_shared/id.vo";
import { SessionToken } from "./session-token.vo";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, fixed (no sliding renewal)

export type CreateSessionProps = {
  userId: string;
  secret: string;
};

export type RestoreSessionProps = {
  id: string;
  userId: string;
  tokenDigest: string;
  createdAt: Date;
  expiresAt: Date;
};

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _tokenDigest: string,
    private readonly _createdAt: Date,
    private readonly _expiresAt: Date,
    private readonly _rawToken: string | undefined,
  ) {}

  /** Generates a fresh opaque token (raw + digest) and a 30-day expiry. */
  static create(props: CreateSessionProps): Session {
    const token = SessionToken.create(props.secret);
    const createdAt = new Date();
    return new Session(
      Id.generateValue(),
      props.userId,
      token.digest,
      createdAt,
      new Date(createdAt.getTime() + SESSION_LIFETIME_MS),
      token.raw,
    );
  }

  /** Rehydrates from persistence. Never carries the raw token — only its digest is stored. */
  static restore(props: RestoreSessionProps): Session {
    return new Session(
      props.id,
      props.userId,
      props.tokenDigest,
      props.createdAt,
      props.expiresAt,
      undefined,
    );
  }

  isExpired(referenceDate: Date = new Date()): boolean {
    return referenceDate.getTime() >= this._expiresAt.getTime();
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get tokenDigest(): string {
    return this._tokenDigest;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  /** Only populated right after `create()`. Never persisted or rehydrated. */
  get rawToken(): string | undefined {
    return this._rawToken;
  }

  toJSON(): never {
    throw new Error("Do not serialize Entity directly. Use toOutput() in the use case DTO.");
  }
}
