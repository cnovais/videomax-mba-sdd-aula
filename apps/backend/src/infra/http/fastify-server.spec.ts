import { beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { CreateUserUseCase } from "@/usecase/user/create-user.usecase";
import { AuthenticateUserUseCase } from "@/usecase/user/authenticate-user.usecase";
import { GetCurrentUserUseCase } from "@/usecase/user/get-current-user.usecase";
import { RevokeSessionUseCase } from "@/usecase/session/revoke-session.usecase";
import { ResolveSessionUseCase } from "@/usecase/session/resolve-session.usecase";
import { RegisterHandler } from "./auth/register.handler";
import { LoginHandler } from "./auth/login.handler";
import { LogoutHandler } from "./auth/logout.handler";
import { MeHandler } from "./auth/me.handler";
import { buildHttpRoutes } from "./index";
import { AuthMiddleware } from "./middleware/auth";
import { buildFastifyServer } from "./fastify-server";

const SECRET = "test-secret";

function buildTestApp(): FastifyInstance {
  const userRepo = new UserInMemoryRepository();
  const sessionRepo = new SessionInMemoryRepository();

  const createUser = new CreateUserUseCase(userRepo, sessionRepo, SECRET);
  const authenticateUser = new AuthenticateUserUseCase(userRepo, sessionRepo, SECRET);
  const getCurrentUser = new GetCurrentUserUseCase(userRepo);
  const revokeSession = new RevokeSessionUseCase(sessionRepo, SECRET);
  const resolveSession = new ResolveSessionUseCase(sessionRepo, userRepo, SECRET);

  const routes = buildHttpRoutes({
    registerHandler: new RegisterHandler(createUser),
    loginHandler: new LoginHandler(authenticateUser),
    logoutHandler: new LogoutHandler(revokeSession),
    meHandler: new MeHandler(getCurrentUser),
  });

  return buildFastifyServer({
    routes,
    authMiddleware: new AuthMiddleware(resolveSession),
    logger: { level: "error" },
  });
}

describe("fastify-server — auth routes (in-memory-backed)", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildTestApp();
  });

  it("full flow: register -> me -> logout -> me (401)", async () => {
    const register = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Ada Lovelace", email: "ada@example.com", password: "ValidPass123" },
    });
    expect(register.statusCode).toBe(201);
    const { sessionToken } = register.json<{ sessionToken: string }>();
    expect(sessionToken).toBeTruthy();

    const me = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ email: "ada@example.com" });

    const logout = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(logout.statusCode).toBe(204);

    const meAfterLogout = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(meAfterLogout.statusCode).toBe(401);
  });

  it("GET /auth/me without a token returns 401", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("POST /auth/logout without a token is idempotent and returns 204", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/logout" });
    expect(res.statusCode).toBe(204);
  });

  it("POST /auth/login with wrong password returns 401 UNAUTHENTICATED", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Existing", email: "existing@example.com", password: "ValidPass123" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "existing@example.com", password: "WrongPass999" },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ code: "UNAUTHENTICATED", message: "Invalid email or password" });
  });

  it("POST /auth/register with a weak password returns 422 WEAK_PASSWORD", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Weak Pass", email: "weakpass@example.com", password: "OnlyLetters" },
    });

    expect(res.statusCode).toBe(422);
    const body = res.json<{ code: string; details: { reasons: string[] } }>();
    expect(body.code).toBe("WEAK_PASSWORD");
    expect(body.details.reasons).toContain("missing_number");
  });

  it("POST /auth/register with a duplicate email returns 409 USER_ALREADY_EXISTS", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "First", email: "dup@example.com", password: "ValidPass123" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Second", email: "dup@example.com", password: "ValidPass123" },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ code: "USER_ALREADY_EXISTS" });
  });
});
