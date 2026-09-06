import { describe, expect, it } from "vitest";
import { User } from "./user.entity";

describe("User", () => {
  it("creates a user with normalized email and a verifiable password", () => {
    const user = User.create({
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "ValidPass123",
    });

    expect(user.name).toBe("Ada Lovelace");
    expect(user.email).toBe("ada@example.com");
    expect(user.isAdmin).toBe(false);
    expect(user.isSuspended).toBe(false);
    expect(user.verifyPassword("ValidPass123")).toBe(true);
    expect(user.verifyPassword("WrongPass999")).toBe(false);
    expect(user.hashedPassword).not.toBe("ValidPass123");
  });

  it("restores a user from persistence without re-running creation rules", () => {
    const restored = User.restore({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Existing User",
      email: "existing@example.com",
      hashedPassword: "some-stored-hash",
      isAdmin: true,
      isSuspended: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(restored.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(restored.isAdmin).toBe(true);
    expect(restored.hashedPassword).toBe("some-stored-hash");
  });

  it("refuses to be serialized directly", () => {
    const user = User.create({ name: "A", email: "a@example.com", password: "ValidPass123" });
    expect(() => user.toJSON()).toThrow(/Do not serialize Entity directly/);
  });
});
