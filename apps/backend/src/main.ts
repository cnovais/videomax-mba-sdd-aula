import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

import { config } from "@/config/env";

import { UserPrismaRepository } from "@/infra/repository/user/user.prisma-repository";
import { SessionPrismaRepository } from "@/infra/repository/session/session.prisma-repository";
import { VideoPrismaRepository } from "@/infra/repository/video/video.prisma-repository";
import { VideoPrismaQueries } from "@/infra/queries/video/video.prisma-queries";
import { LocalDiskVideoStorageGateway } from "@/infra/gateway/local-disk-video-storage.gateway";
import { FfprobeMediaProbeGateway } from "@/infra/gateway/ffprobe-media-probe.gateway";
import { FfmpegThumbnailGateway } from "@/infra/gateway/ffmpeg-thumbnail.gateway";

import { CreateUserUseCase } from "@/usecase/user/create-user.usecase";
import { AuthenticateUserUseCase } from "@/usecase/user/authenticate-user.usecase";
import { GetCurrentUserUseCase } from "@/usecase/user/get-current-user.usecase";
import { RevokeSessionUseCase } from "@/usecase/session/revoke-session.usecase";
import { ResolveSessionUseCase } from "@/usecase/session/resolve-session.usecase";
import { UploadVideoUseCase } from "@/usecase/video/upload-video.usecase";
import { ListVideosUseCase } from "@/usecase/video/list-videos.usecase";
import { GetVideoThumbnailUseCase } from "@/usecase/video/get-video-thumbnail.usecase";
import { RenameVideoUseCase } from "@/usecase/video/rename-video.usecase";
import { UpdateVideoDescriptionUseCase } from "@/usecase/video/update-video-description.usecase";
import { DeleteVideoUseCase } from "@/usecase/video/delete-video.usecase";
import { SetLibraryViewModeUseCase } from "@/usecase/user/set-library-view-mode.usecase";

import { RegisterHandler } from "@/infra/http/auth/register.handler";
import { LoginHandler } from "@/infra/http/auth/login.handler";
import { LogoutHandler } from "@/infra/http/auth/logout.handler";
import { MeHandler } from "@/infra/http/auth/me.handler";
import { GetHealthHandler } from "@/infra/http/health/get-health.handler";
import { UploadHandler } from "@/infra/http/video/upload.handler";
import { ListHandler } from "@/infra/http/video/list.handler";
import { ThumbnailHandler } from "@/infra/http/video/thumbnail.handler";
import { UpdateHandler } from "@/infra/http/video/update.handler";
import { DeleteHandler } from "@/infra/http/video/delete.handler";
import { SetLibraryViewModeHandler } from "@/infra/http/auth/set-library-view-mode.handler";

import { buildHttpRoutes } from "@/infra/http/index";
import { AuthMiddleware } from "@/infra/http/middleware/auth";
import { buildFastifyServer } from "@/infra/http/fastify-server";

export function bootstrap(): Promise<FastifyInstance> {
  // 1. Singletons
  const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });

  // 2. Repositories, queries, gateways
  const userRepo = new UserPrismaRepository(prisma);
  const sessionRepo = new SessionPrismaRepository(prisma);
  const videoRepo = new VideoPrismaRepository(prisma);
  const videoQueries = new VideoPrismaQueries(prisma);
  const videoStorage = new LocalDiskVideoStorageGateway(config.storageRoot);
  const mediaProbe = new FfprobeMediaProbeGateway();
  const thumbnailGateway = new FfmpegThumbnailGateway();

  // 3. Use cases
  const createUser = new CreateUserUseCase(userRepo, sessionRepo, config.sessionSecret);
  const authenticateUser = new AuthenticateUserUseCase(userRepo, sessionRepo, config.sessionSecret);
  const getCurrentUser = new GetCurrentUserUseCase(userRepo);
  const revokeSession = new RevokeSessionUseCase(sessionRepo, config.sessionSecret);
  const resolveSession = new ResolveSessionUseCase(sessionRepo, userRepo, config.sessionSecret);
  const uploadVideo = new UploadVideoUseCase(videoRepo, videoStorage, mediaProbe, thumbnailGateway);
  const listVideos = new ListVideosUseCase(videoQueries);
  const getVideoThumbnail = new GetVideoThumbnailUseCase(videoRepo, videoStorage);
  const renameVideo = new RenameVideoUseCase(videoRepo);
  const updateVideoDescription = new UpdateVideoDescriptionUseCase(videoRepo);
  const deleteVideo = new DeleteVideoUseCase(videoRepo, videoStorage);
  const setLibraryViewMode = new SetLibraryViewModeUseCase(userRepo);

  // 4. Handlers
  const registerHandler = new RegisterHandler(createUser);
  const loginHandler = new LoginHandler(authenticateUser);
  const logoutHandler = new LogoutHandler(revokeSession);
  const meHandler = new MeHandler(getCurrentUser);
  const getHealthHandler = new GetHealthHandler();
  const uploadHandler = new UploadHandler(uploadVideo);
  const listHandler = new ListHandler(listVideos);
  const thumbnailHandler = new ThumbnailHandler(getVideoThumbnail);
  const updateHandler = new UpdateHandler(renameVideo, updateVideoDescription);
  const deleteHandler = new DeleteHandler(deleteVideo);
  const setLibraryViewModeHandler = new SetLibraryViewModeHandler(setLibraryViewMode);

  // 5. Routes + auth middleware
  const routes = buildHttpRoutes({
    registerHandler,
    loginHandler,
    logoutHandler,
    meHandler,
    getHealthHandler,
    uploadHandler,
    listHandler,
    thumbnailHandler,
    updateHandler,
    deleteHandler,
    setLibraryViewModeHandler,
  });
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
