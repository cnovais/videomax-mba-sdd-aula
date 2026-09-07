import { beforeEach, describe, expect, it } from "vitest";
import { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { User } from "@/domain/user/user.entity";
import { UnauthenticatedError } from "@/domain/_shared/errors";
import { AuthenticateUserUseCase } from "@/usecase/user/authenticate-user.usecase";
import type { HttpRequest } from "@/infra/http/types";
import { LoginHandler } from "./login.handler";

function request(body: unknown): HttpRequest {
  return { method: "POST", path: "/auth/login", params: {}, query: {}, headers: {}, body };
}

describe("LoginHandler", () => {
  let handler: LoginHandler;

  beforeEach(async () => {
    const userRepo = new UserInMemoryRepository();
    const sessionRepo = new SessionInMemoryRepository();
    await userRepo.save(
      User.create({ name: "Existing User", email: "existing@example.com", password: "ValidPass123" }),
    );
    handler = new LoginHandler(new AuthenticateUserUseCase(userRepo, sessionRepo, "test-secret"));
  });

  it("returns 200 with user + sessionToken on correct credentials", async () => {
    const res = await handler.handle(request({ email: "existing@example.com", password: "ValidPass123" }));
    expect(res.status).toBe(200);
    const body = res.body as { user: { email: string }; sessionToken: string };
    expect(body.user.email).toBe("existing@example.com");
    expect(body.sessionToken).toBeTruthy();
  });

  it("propagates UnauthenticatedError with a generic message on wrong password", async () => {
    await expect(
      handler.handle(request({ email: "existing@example.com", password: "WrongPass999" })),
    ).rejects.toMatchObject(new UnauthenticatedError("Invalid email or password"));
  });
});
