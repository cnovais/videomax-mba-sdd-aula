import { describe, expect, it } from "vitest";
import { HashedPassword } from "./hashed-password.vo";
import { WeakPasswordError } from "./errors";

describe("HashedPassword", () => {
  it("hashes and verifies a strong password", () => {
    const password = HashedPassword.create("ValidPass123");
    expect(password.compare("ValidPass123")).toBe(true);
    expect(password.compare("SomethingElse1")).toBe(false);
    expect(password.value).not.toBe("ValidPass123");
  });

  it("rejects a password missing a digit", () => {
    try {
      HashedPassword.create("OnlyLetters");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(WeakPasswordError);
      expect((error as WeakPasswordError).details).toEqual({
        reasons: ["missing_number"],
      });
    }
  });

  it("rejects a password missing a letter", () => {
    expect(() => HashedPassword.create("12345678")).toThrow(WeakPasswordError);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(() => HashedPassword.create("ab1")).toThrow(WeakPasswordError);
  });

  it("restore skips validation and hashing", () => {
    const restored = HashedPassword.restore("already-hashed-value");
    expect(restored.value).toBe("already-hashed-value");
  });
});
