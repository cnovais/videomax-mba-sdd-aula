import { beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import { SessionInMemoryRepository } from "@/infra/repository/session/session.in-memory-repository";
import { VideoInMemoryRepository } from "@/infra/repository/video/video.in-memory-repository";
import { VideoInMemoryQueries } from "@/infra/queries/video/video.in-memory-queries";
import { InMemoryVideoStorageGateway } from "@/infra/gateway/in-memory-video-storage.gateway";
import { FakeMediaProbeGateway } from "@/infra/gateway/fake-media-probe.gateway";
import { FakeThumbnailGateway } from "@/infra/gateway/fake-thumbnail.gateway";
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
import { UploadHandler } from "./upload.handler";
import { ListHandler } from "./list.handler";
import { ThumbnailHandler } from "./thumbnail.handler";
import { buildHttpRoutes } from "@/infra/http/index";
import { AuthMiddleware } from "@/infra/http/middleware/auth";
import { buildFastifyServer } from "@/infra/http/fastify-server";

const SECRET = "test-secret";

function buildMultipartBody(
  filename: string,
  content: Buffer,
): { body: Buffer; contentType: string } {
  const boundary = "test-boundary-f03";
  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  );
  const epilogue = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    body: Buffer.concat([preamble, content, epilogue]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function buildTestApp(thumbnailSucceeds = true): FastifyInstance {
  const userRepo = new UserInMemoryRepository();
  const sessionRepo = new SessionInMemoryRepository();
  const videoRepo = new VideoInMemoryRepository();

  const createUser = new CreateUserUseCase(userRepo, sessionRepo, SECRET);
  const authenticateUser = new AuthenticateUserUseCase(userRepo, sessionRepo, SECRET);
  const getCurrentUser = new GetCurrentUserUseCase(userRepo);
  const revokeSession = new RevokeSessionUseCase(sessionRepo, SECRET);
  const resolveSession = new ResolveSessionUseCase(sessionRepo, userRepo, SECRET);
  // One shared storage instance, matching main.ts's real wiring (a single
  // gateway backing both use cases) — required for read-after-write
  // consistency between upload (writes the thumbnail) and the thumbnail
  // endpoint (reads it back).
  const videoStorage = new InMemoryVideoStorageGateway();
  const uploadVideo = new UploadVideoUseCase(
    videoRepo,
    videoStorage,
    new FakeMediaProbeGateway(180),
    new FakeThumbnailGateway(thumbnailSucceeds, videoStorage),
  );
  const listVideos = new ListVideosUseCase(new VideoInMemoryQueries(videoRepo));
  const getVideoThumbnail = new GetVideoThumbnailUseCase(videoRepo, videoStorage);

  const routes = buildHttpRoutes({
    registerHandler: new RegisterHandler(createUser),
    loginHandler: new LoginHandler(authenticateUser),
    logoutHandler: new LogoutHandler(revokeSession),
    meHandler: new MeHandler(getCurrentUser),
    getHealthHandler: new GetHealthHandler(),
    uploadHandler: new UploadHandler(uploadVideo),
    listHandler: new ListHandler(listVideos),
    thumbnailHandler: new ThumbnailHandler(getVideoThumbnail),
  });

  return buildFastifyServer({
    routes,
    authMiddleware: new AuthMiddleware(resolveSession),
    logger: { level: "error" },
  });
}

async function registerAndGetToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name: "Ada Lovelace", email: "ada@example.com", password: "ValidPass123" },
  });
  return res.json<{ sessionToken: string }>().sessionToken;
}

describe("video routes (in-memory-backed)", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildTestApp();
  });

  it("POST /videos stores the file and returns 201 with a thumbnail url", async () => {
    const token = await registerAndGetToken(app);
    const { body, contentType } = buildMultipartBody("lecture.mp4", Buffer.from("fake bytes"));

    const res = await app.inject({
      method: "POST",
      url: "/videos",
      headers: { authorization: `Bearer ${token}`, "content-type": contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
    const json = res.json<{ status: string; durationSeconds: number; thumbnailUrl: string | null }>();
    expect(json.status).toBe("validating");
    expect(json.durationSeconds).toBe(180);
    expect(json.thumbnailUrl).toMatch(/^\/videos\/.+\/thumbnail$/);
  });

  it("POST /videos without authentication returns 401", async () => {
    const { body, contentType } = buildMultipartBody("lecture.mp4", Buffer.from("x"));
    const res = await app.inject({
      method: "POST",
      url: "/videos",
      headers: { "content-type": contentType },
      payload: body,
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /videos with an unsupported extension returns 422 UNSUPPORTED_FORMAT", async () => {
    const token = await registerAndGetToken(app);
    const { body, contentType } = buildMultipartBody("notes.txt", Buffer.from("hello"));

    const res = await app.inject({
      method: "POST",
      url: "/videos",
      headers: { authorization: `Bearer ${token}`, "content-type": contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ code: "UNSUPPORTED_FORMAT" });
  });

  it("thumbnail extraction failure still returns 201 with a null thumbnailUrl", async () => {
    app = buildTestApp(false);
    const token = await registerAndGetToken(app);
    const { body, contentType } = buildMultipartBody("audio-only.mp4", Buffer.from("fake bytes"));

    const res = await app.inject({
      method: "POST",
      url: "/videos",
      headers: { authorization: `Bearer ${token}`, "content-type": contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ thumbnailUrl: null, status: "validating" });
  });

  it("GET /videos lists only the requesting user's videos", async () => {
    const token = await registerAndGetToken(app);
    const { body, contentType } = buildMultipartBody("lecture.mp4", Buffer.from("fake bytes"));
    await app.inject({
      method: "POST",
      url: "/videos",
      headers: { authorization: `Bearer ${token}`, "content-type": contentType },
      payload: body,
    });

    const res = await app.inject({
      method: "GET",
      url: "/videos",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const json = res.json<{ items: unknown[]; total: number }>();
    expect(json.total).toBe(1);
    expect(json.items).toHaveLength(1);
  });

  it("GET /videos/:id/thumbnail serves the extracted image", async () => {
    const token = await registerAndGetToken(app);
    const { body, contentType } = buildMultipartBody("lecture.mp4", Buffer.from("fake bytes"));
    const upload = await app.inject({
      method: "POST",
      url: "/videos",
      headers: { authorization: `Bearer ${token}`, "content-type": contentType },
      payload: body,
    });
    const { id } = upload.json<{ id: string }>();

    const res = await app.inject({
      method: "GET",
      url: `/videos/${id}/thumbnail`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
  });

  it("GET /videos/:id/thumbnail returns 404 for another user's video", async () => {
    const token = await registerAndGetToken(app);
    const { body, contentType } = buildMultipartBody("lecture.mp4", Buffer.from("fake bytes"));
    const upload = await app.inject({
      method: "POST",
      url: "/videos",
      headers: { authorization: `Bearer ${token}`, "content-type": contentType },
      payload: body,
    });
    const { id } = upload.json<{ id: string }>();

    const otherRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Bob", email: "bob@example.com", password: "ValidPass123" },
    });
    const otherToken = otherRes.json<{ sessionToken: string }>().sessionToken;

    const res = await app.inject({
      method: "GET",
      url: `/videos/${id}/thumbnail`,
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(res.statusCode).toBe(404);
  });
});
