import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import { config } from "@/config/env";

import { UserPrismaRepository } from "@/infra/repository/user/user.prisma-repository";
import { SessionPrismaRepository } from "@/infra/repository/session/session.prisma-repository";

import { CreateUserUseCase } from "@/usecase/user/create-user.usecase";
import { AuthenticateUserUseCase } from "@/usecase/user/authenticate-user.usecase";
import { GetCurrentUserUseCase } from "@/usecase/user/get-current-user.usecase";
import { RevokeSessionUseCase } from "@/usecase/session/revoke-session.usecase";
import { ResolveSessionUseCase } from "@/usecase/session/resolve-session.usecase";

import { RegisterHandler } from "@/infra/http/auth/register.handler";
import { LoginHandler } from "@/infra/http/auth/login.handler";
import { LogoutHandler } from "@/infra/http/auth/logout.handler";
import { MeHandler } from "@/infra/http/auth/me.handler";

import { buildHttpRoutes } from "@/infra/http/index";
import { AuthMiddleware } from "@/infra/http/middleware/auth";
import { buildFastifyServer } from "@/infra/http/fastify-server";

export function bootstrap(): Promise<FastifyInstance> {
  // 1. Singletons
  const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });

  // 2. Repositories
  const userRepo = new UserPrismaRepository(prisma);
  const sessionRepo = new SessionPrismaRepository(prisma);

  // 3. Use cases
  const createUser = new CreateUserUseCase(userRepo, sessionRepo, config.sessionSecret);
  const authenticateUser = new AuthenticateUserUseCase(userRepo, sessionRepo, config.sessionSecret);
  const getCurrentUser = new GetCurrentUserUseCase(userRepo);
  const revokeSession = new RevokeSessionUseCase(sessionRepo, config.sessionSecret);
  const resolveSession = new ResolveSessionUseCase(sessionRepo, userRepo, config.sessionSecret);

  // 4. Handlers
  const registerHandler = new RegisterHandler(createUser);
  const loginHandler = new LoginHandler(authenticateUser);
  const logoutHandler = new LogoutHandler(revokeSession);
  const meHandler = new MeHandler(getCurrentUser);

  // 5. Routes + auth middleware
  const routes = buildHttpRoutes({ registerHandler, loginHandler, logoutHandler, meHandler });
  const authMiddleware = new AuthMiddleware(resolveSession);

  // 6. Server
  const app = buildFastifyServer({ routes, authMiddleware, logger: { level: config.logLevel } });
  app.addHook("onClose", () => prisma.$disconnect());

  return Promise.resolve(app);
}

async function start(): Promise<void> {
  const app = await bootstrap();
  await app.listen({ port: config.port, host: "0.0.0.0" });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await start();
}
