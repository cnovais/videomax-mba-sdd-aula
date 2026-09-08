import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import multipart from "@fastify/multipart";
import { toHttpResponse } from "./error-handler";
import type { AuthMiddleware } from "./middleware/auth";
import type { HttpRequest, HttpRoute } from "./types";

// PRD-fixed product policy (2GB), not deployment config — see
// domain/video/video-extension.vo.ts for the sibling format allowlist.
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

type BuildFastifyServerInput = {
  routes: HttpRoute[];
  authMiddleware: AuthMiddleware;
  logger: { level: "debug" | "info" | "warn" | "error" };
};

export function buildFastifyServer(input: BuildFastifyServerInput): FastifyInstance {
  const app = Fastify({ logger: input.logger, bodyLimit: MAX_UPLOAD_BYTES + 1024 * 1024 });
  void app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES } });
  registerErrorHandler(app);
  registerRoutes(app, input.routes, input.authMiddleware);
  return app;
}

function registerRoutes(
  app: FastifyInstance,
  routes: HttpRoute[],
  authMiddleware: AuthMiddleware,
): void {
  for (const route of routes) {
    app.route({
      method: route.method,
      url: route.path,
      handler: async (request, reply) =>
        handleRoute(route, authMiddleware, request, reply),
    });
  }
}

function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request failed");
    const response = toHttpResponse(error);
    void reply.status(response.status).send(response.body);
  });
}

async function handleRoute(
  route: HttpRoute,
  authMiddleware: AuthMiddleware,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<unknown> {
  const baseReq: HttpRequest = {
    method: route.method,
    path: request.url,
    params: toStringRecord(request.params),
    query: toQueryRecord(request.query),
    // Multipart requests never populate `body` — their content is streamed
    // into `file` (below), and only after auth passes (see attachMultipartFile).
    body: route.isMultipart ? undefined : request.body,
    headers: request.headers,
  };

  const authedReq = await authMiddleware.resolve(baseReq, route.requiresAuth ?? false);
  const httpReq = route.isMultipart ? await attachMultipartFile(authedReq, request) : authedReq;

  const response = await route.handler.handle(httpReq);
  void reply.status(response.status);
  setHeaders(reply, response.headers);
  return response.body ?? null;
}

/**
 * Reads the single file part off the multipart stream. Deliberately runs
 * AFTER `authMiddleware.resolve` in `handleRoute` — an unauthenticated
 * caller must never make this process stream a (potentially 2GB) upload
 * before being rejected.
 */
async function attachMultipartFile(req: HttpRequest, request: FastifyRequest): Promise<HttpRequest> {
  const part = await request.file();
  if (!part) return req;
  return { ...req, file: { stream: part.file, filename: part.filename } };
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, string>;
}

function toQueryRecord(value: unknown): Record<string, string | string[] | undefined> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, string | string[] | undefined>;
}

function setHeaders(reply: FastifyReply, headers: Record<string, string> | undefined): void {
  if (!headers) return;
  for (const [key, value] of Object.entries(headers)) void reply.header(key, value);
}
