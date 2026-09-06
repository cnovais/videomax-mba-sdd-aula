import { describe, expect, it } from "vitest";
import { Session } from "./session.entity";
import { SessionToken } from "./session-token.vo";

const SECRET = "test-secret";

describe("Session", () => {
  it("generates a raw token, a digest, and a 30-day expiry on create", () => {
    const before = Date.now();
    const session = Session.create({ userId: "user-1", secret: SECRET });

    expect(session.rawToken).toBeTruthy();
    expect(session.tokenDigest).toBe(SessionToken.digestFor(session.rawToken as string, SECRET));
    expect(session.userId).toBe("user-1");
    expect(session.isExpired()).toBe(false);

    const expectedExpiry = before + 30 * 24 * 60 * 60 * 1000;
    expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 5000);
    expect(session.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 5000);
  });

  it("restore never carries the raw token", () => {
    const restored = Session.restore({
      id: "session-1",
      userId: "user-1",
      tokenDigest: "some-digest",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000),
    });

    expect(restored.rawToken).toBeUndefined();
    expect(restored.tokenDigest).toBe("some-digest");
  });

  it("isExpired is true once past expiresAt", () => {
    const session = Session.restore({
      id: "session-1",
      userId: "user-1",
      tokenDigest: "digest",
      createdAt: new Date(Date.now() - 2000),
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(session.isExpired()).toBe(true);
  });
});
