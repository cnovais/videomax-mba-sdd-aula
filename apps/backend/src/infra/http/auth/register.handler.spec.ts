import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { UserAlreadyExistsError, WeakPasswordError } from "@/domain/user/errors";
import { CreateUserUseCase } from "@/usecase/user/create-user.usecase";
import type { HttpRequest } from "@/infra/http/types";
import { RegisterHandler } from "./register.handler";

function request(body: unknown): HttpRequest {
  return { method: "POST", path: "/auth/register", params: {}, query: {}, headers: {}, body };
}

describe("RegisterHandler", () => {
  let handler: RegisterHandler;

  beforeEach(() => {
    const userRepo = new UserInMemoryRepository();
    const sessionRepo = new SessionInMemoryRepository();
    handler = new RegisterHandler(new CreateUserUseCase(userRepo, sessionRepo, "test-secret"));
  });

  it("returns 201 with user + sessionToken on the happy path", async () => {
    const res = await handler.handle(
      request({ name: "New User", email: "newuser@example.com", password: "ValidPass123" }),
    );

    expect(res.status).toBe(201);
    const body = res.body as { user: { email: string; isAdmin: boolean }; sessionToken: string };
    expect(body.user.email).toBe("newuser@example.com");
    expect(body.user.isAdmin).toBe(false);
    expect(body.sessionToken).toBeTruthy();
  });

  it("propagates WeakPasswordError for a shape-valid but weak password", async () => {
    await expect(
      handler.handle(request({ name: "Weak Pass", email: "weakpass@example.com", password: "OnlyLetters" })),
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it("propagates UserAlreadyExistsError for a duplicate email", async () => {
    await handler.handle(request({ name: "First", email: "dup@example.com", password: "ValidPass123" }));

    await expect(
      handler.handle(request({ name: "Second", email: "dup@example.com", password: "ValidPass123" })),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it("throws ZodError for a malformed body (missing required field)", async () => {
    await expect(
      handler.handle(request({ email: "no-name@example.com", password: "ValidPass123" })),
    ).rejects.toBeInstanceOf(ZodError);
  });
});
