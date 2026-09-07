import { beforeEach, describe, expect, it } from "vitest";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { Session } from "@/domain/session/session.entity";
import { RevokeSessionUseCase } from "./revoke-session.usecase";

const SECRET = "test-secret";

describe("RevokeSessionUseCase", () => {
  let sessionRepo: SessionInMemoryRepository;
  let useCase: RevokeSessionUseCase;

  beforeEach(() => {
    sessionRepo = new SessionInMemoryRepository();
    useCase = new RevokeSessionUseCase(sessionRepo, SECRET);
  });

  it("revokes an existing session", async () => {
    const session = Session.create({ userId: "user-1", secret: SECRET });
    await sessionRepo.save(session);

    await useCase.execute({ token: session.rawToken });

    expect(await sessionRepo.findByTokenDigest(session.tokenDigest)).toBeNull();
  });

  it("is idempotent when the token is unknown", async () => {
    await expect(useCase.execute({ token: "unknown-token" })).resolves.toBeUndefined();
  });

  it("is a no-op when no token is presented", async () => {
    await expect(useCase.execute({ token: undefined })).resolves.toBeUndefined();
  });
});
