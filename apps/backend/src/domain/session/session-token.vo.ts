import { createHmac, randomBytes } from "node:crypto";

/**
 * Opaque session token: 32 random bytes, base64url-encoded. The backend
 * never stores the raw value — only an HMAC-SHA256 digest keyed by a
 * secret passed at call time (never read from `process.env` inside
 * `domain/` — the secret is injected by the use case from `config/env.ts`).
 */
export class SessionToken {
  private constructor(
    readonly raw: string,
    readonly digest: string,
  ) {}

  static create(secret: string): SessionToken {
    const raw = randomBytes(32).toString("base64url");
    return new SessionToken(raw, SessionToken.digestFor(raw, secret));
  }

  static digestFor(raw: string, secret: string): string {
    return createHmac("sha256", secret).update(raw).digest("base64url");
  }
}
