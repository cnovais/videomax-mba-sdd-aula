import { describe, expect, it } from "vitest";
import { Email } from "./email.vo";
import { InvalidEmailError } from "./errors";

describe("Email", () => {
  it("normalizes a valid address (trim + lowercase)", () => {
    const email = Email.create("  Ada@Example.com  ");
    expect(email.value).toBe("ada@example.com");
  });

  it("rejects a malformed address", () => {
    expect(() => Email.create("not-an-email")).toThrow(InvalidEmailError);
  });

  it("equals compares normalized values", () => {
    const a = Email.create("ada@example.com");
    const b = Email.create("ADA@EXAMPLE.COM");
    expect(a.equals(b)).toBe(true);
  });
});
