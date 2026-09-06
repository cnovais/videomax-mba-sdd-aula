import { beforeEach, describe, expect, it } from "vitest";
import { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { User } from "@/domain/user/user.entity";
import { UnauthenticatedError } from "@/domain/_shared/errors";
import { AuthenticateUserUseCase } from "./authenticate-user.usecase";

const SECRET = "test-secret";

describe("AuthenticateUserUseCase", () => {
  let userRepo: UserInMemoryRepository;
  let sessionRepo: SessionInMemoryRepository;
  let useCase: AuthenticateUserUseCase;

  beforeEach(async () => {
    userRepo = new UserInMemoryRepository();
    sessionRepo = new SessionInMemoryRepository();
    useCase = new AuthenticateUserUseCase(userRepo, sessionRepo, SECRET);
    await userRepo.save(
      User.create({ name: "Existing User", email: "existing@example.com", password: "ValidPass123" }),
    );
  });

  it("authenticates with correct credentials", async () => {
    const output = await useCase.execute({ email: "existing@example.com", password: "ValidPass123" });
    expect(output.user.email).toBe("existing@example.com");
    expect(output.sessionToken).toBeTruthy();
  });

  it("rejects wrong password with a generic error", async () => {
    await expect(
      useCase.execute({ email: "existing@example.com", password: "WrongPass999" }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("rejects an unknown email with the same generic error", async () => {
    await expect(
      useCase.execute({ email: "nobody@example.com", password: "WrongPass999" }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
