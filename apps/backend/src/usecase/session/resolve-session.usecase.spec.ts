import { beforeEach, describe, expect, it } from "vitest";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import { Session } from "@/domain/session/session.entity";
import { User } from "@/domain/user/user.entity";
import { ResolveSessionUseCase } from "./resolve-session.usecase";

const SECRET = "test-secret";

describe("ResolveSessionUseCase", () => {
  let sessionRepo: SessionInMemoryRepository;
  let userRepo: UserInMemoryRepository;
  let useCase: ResolveSessionUseCase;

  beforeEach(() => {
    sessionRepo = new SessionInMemoryRepository();
    userRepo = new UserInMemoryRepository();
    useCase = new ResolveSessionUseCase(sessionRepo, userRepo, SECRET);
  });

  it("resolves an active session to {id, isAdmin}", async () => {
    const user = User.create({ name: "Ada", email: "ada@example.com", password: "ValidPass123" });
    await userRepo.save(user);
    const session = Session.create({ userId: user.id, secret: SECRET });
    await sessionRepo.save(session);

    const resolved = await useCase.execute({ token: session.rawToken as string });

    expect(resolved).toEqual({ id: user.id, isAdmin: false });
  });

  it("returns null for an unknown token", async () => {
    expect(await useCase.execute({ token: "unknown-token" })).toBeNull();
  });

  it("returns null for an expired session", async () => {
    const user = User.create({ name: "Ada", email: "ada@example.com", password: "ValidPass123" });
    await userRepo.save(user);
    const session = Session.create({ userId: user.id, secret: SECRET });
    await sessionRepo.save(
      Session.restore({
        id: session.id,
        userId: session.userId,
        tokenDigest: session.tokenDigest,
        createdAt: session.createdAt,
        expiresAt: new Date(Date.now() - 1000),
      }),
    );

    expect(await useCase.execute({ token: session.rawToken as string })).toBeNull();
  });
});
