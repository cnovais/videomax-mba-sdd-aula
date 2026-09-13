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

import { RegisterHandler } from "@/infra/http/auth/register.handler";
import { LoginHandler } from "@/infra/http/auth/login.handler";
import { LogoutHandler } from "@/infra/http/auth/logout.handler";
import { MeHandler } from "@/infra/http/auth/me.handler";
import { GetHealthHandler } from "@/infra/http/health/get-health.handler";
import { UploadHandler } from "@/infra/http/video/upload.handler";
import { ListHandler } from "@/infra/http/video/list.handler";
import { ThumbnailHandler } from "@/infra/http/video/thumbnail.handler";
import { RetryHandler } from "@/infra/http/video/retry.handler";
import { TranscriptionPrismaRepository } from "@/infra/repository/transcription/transcription.prisma-repository";
import { SummaryPrismaRepository } from "@/infra/repository/summary/summary.prisma-repository";
import { FfmpegAudioExtractionGateway } from "@/infra/gateway/ffmpeg-audio-extraction.gateway";
import { OpenAiWhisperTranscriptionGateway } from "@/infra/gateway/openai-whisper-transcription.gateway";
import { OpenAiSummaryGateway } from "@/infra/gateway/openai-summary.gateway";
import { RunVideoStageUseCase } from "@/usecase/pipeline/run-video-stage.usecase";
import { ProcessPendingVideosUseCase } from "@/usecase/pipeline/process-pending-videos.usecase";
import { RetryVideoUseCase } from "@/usecase/pipeline/retry-video.usecase";
import { PipelineWorker } from "@/infra/worker/pipeline-worker";

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
  const transcriptionRepo = new TranscriptionPrismaRepository(prisma);
  const summaryRepo = new SummaryPrismaRepository(prisma);
  const runStage = new RunVideoStageUseCase(videoRepo, videoStorage, mediaProbe, new FfmpegAudioExtractionGateway(), new OpenAiWhisperTranscriptionGateway(config.openaiApiKey), transcriptionRepo, new OpenAiSummaryGateway(config.openaiApiKey), summaryRepo);
  const worker = new PipelineWorker(new ProcessPendingVideosUseCase(videoQueries, runStage, config.pipelineWorkerConcurrency), config.pipelinePollIntervalMs);

  // 3. Use cases
  const createUser = new CreateUserUseCase(userRepo, sessionRepo, config.sessionSecret);
  const authenticateUser = new AuthenticateUserUseCase(userRepo, sessionRepo, config.sessionSecret);
  const getCurrentUser = new GetCurrentUserUseCase(userRepo);
  const revokeSession = new RevokeSessionUseCase(sessionRepo, config.sessionSecret);
  const resolveSession = new ResolveSessionUseCase(sessionRepo, userRepo, config.sessionSecret);
  const uploadVideo = new UploadVideoUseCase(videoRepo, videoStorage, mediaProbe, thumbnailGateway);
  const listVideos = new ListVideosUseCase(videoQueries);
  const getVideoThumbnail = new GetVideoThumbnailUseCase(videoRepo, videoStorage);

  // 4. Handlers
  const registerHandler = new RegisterHandler(createUser);
  const loginHandler = new LoginHandler(authenticateUser);
  const logoutHandler = new LogoutHandler(revokeSession);
  const meHandler = new MeHandler(getCurrentUser);
  const getHealthHandler = new GetHealthHandler();
  const uploadHandler = new UploadHandler(uploadVideo);
  const listHandler = new ListHandler(listVideos);
  const thumbnailHandler = new ThumbnailHandler(getVideoThumbnail);
  const retryHandler = new RetryHandler(new RetryVideoUseCase(videoRepo));

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
    retryHandler,
  });
  const authMiddleware = new AuthMiddleware(resolveSession);

  // 6. Server
  const app = buildFastifyServer({ routes, authMiddleware, logger: { level: config.logLevel } });
  app.addHook("onClose", () => prisma.$disconnect());
  app.addHook("onReady", () => worker.start());
  app.addHook("onClose", () => worker.stop());

  return Promise.resolve(app);
}

async function start(): Promise<void> {
  const app = await bootstrap();
  await app.listen({ port: config.port, host: "0.0.0.0" });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await start();
}
