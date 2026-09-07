import { describe, expect, it, vi } from "vitest";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

const { hasActiveSession, getSessionToken, SESSION_COOKIE_NAME } = await import(
  "@/lib/session"
);

describe("hasActiveSession", () => {
  it("returns false with no cookie", async () => {
    cookies.mockResolvedValue({ get: () => undefined });
    await expect(hasActiveSession()).resolves.toBe(false);
  });

  it("returns true when videomax_session is set", async () => {
    cookies.mockResolvedValue({
      get: (name: string) =>
        name === SESSION_COOKIE_NAME
          ? { name, value: "anything" }
          : undefined,
    });
    await expect(hasActiveSession()).resolves.toBe(true);
  });
});

describe("getSessionToken", () => {
  it("returns null with no cookie", async () => {
    cookies.mockResolvedValue({ get: () => undefined });
    await expect(getSessionToken()).resolves.toBeNull();
  });

  it("returns the raw token value when the cookie is set", async () => {
    cookies.mockResolvedValue({
      get: (name: string) =>
        name === SESSION_COOKIE_NAME ? { name, value: "raw-token-value" } : undefined,
    });
    await expect(getSessionToken()).resolves.toBe("raw-token-value");
  });
});
