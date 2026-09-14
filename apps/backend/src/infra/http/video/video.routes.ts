import type { HttpRoute } from "@/infra/http/types";
import type { UploadHandler } from "./upload.handler";
import type { ListHandler } from "./list.handler";
import type { ThumbnailHandler } from "./thumbnail.handler";
import type { UpdateHandler } from "./update.handler";
import type { DeleteHandler } from "./delete.handler";
import type { RetryHandler } from "./retry.handler";

export type VideoRoutesDeps = {
  uploadHandler: UploadHandler;
  listHandler: ListHandler;
  thumbnailHandler: ThumbnailHandler;
  updateHandler?: UpdateHandler;
  deleteHandler?: DeleteHandler;
  retryHandler?: RetryHandler;
};

export const videoRoutes = (deps: VideoRoutesDeps): HttpRoute[] => [
  { method: "POST", path: "/videos", handler: deps.uploadHandler, requiresAuth: true, isMultipart: true },
  { method: "GET", path: "/videos", handler: deps.listHandler, requiresAuth: true },
  { method: "GET", path: "/videos/:id/thumbnail", handler: deps.thumbnailHandler, requiresAuth: true },
  ...(deps.updateHandler ? [{ method: "PATCH" as const, path: "/videos/:id", handler: deps.updateHandler, requiresAuth: true }] : []),
  ...(deps.deleteHandler ? [{ method: "DELETE" as const, path: "/videos/:id", handler: deps.deleteHandler, requiresAuth: true }] : []),
  ...(deps.retryHandler ? [{ method: "POST" as const, path: "/videos/:id/retry", handler: deps.retryHandler, requiresAuth: true }] : []),
];
