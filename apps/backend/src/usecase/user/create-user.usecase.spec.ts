import { beforeEach, describe, expect, it } from "vitest";
import { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { UserAlreadyExistsError } from "@/domain/user/errors";
import { CreateUserUseCase } from "./create-user.usecase";

const SECRET = "test-secret";

describe("CreateUserUseCase", () => {
  let userRepo: UserInMemoryRepository;
  let sessionRepo: SessionInMemoryRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepo = new UserInMemoryRepository();
    sessionRepo = new SessionInMemoryRepository();
    useCase = new CreateUserUseCase(userRepo, sessionRepo, SECRET);
  });

  it("persists a new user and issues a session", async () => {
    const output = await useCase.execute({
      name: "New User",
      email: "newuser@example.com",
      password: "ValidPass123",
    });

    expect(output.user.email).toBe("newuser@example.com");
    expect(output.sessionToken).toBeTruthy();

    const stored = await userRepo.findByEmail("newuser@example.com");
    expect(stored).not.toBeNull();
  });

  it("throws UserAlreadyExistsError for a duplicate email", async () => {
    await useCase.execute({
      name: "Someone",
      email: "existing@example.com",
      password: "ValidPass123",
    });

    await expect(
      useCase.execute({
        name: "Someone Else",
        email: "existing@example.com",
        password: "ValidPass123",
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });
});
