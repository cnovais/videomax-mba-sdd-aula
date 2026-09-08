import type { HttpRoute } from "@/infra/http/types";
import type { UploadHandler } from "./upload.handler";
import type { ListHandler } from "./list.handler";
import type { ThumbnailHandler } from "./thumbnail.handler";

export type VideoRoutesDeps = {
  uploadHandler: UploadHandler;
  listHandler: ListHandler;
  thumbnailHandler: ThumbnailHandler;
};

export const videoRoutes = (deps: VideoRoutesDeps): HttpRoute[] => [
  { method: "POST", path: "/videos", handler: deps.uploadHandler, requiresAuth: true, isMultipart: true },
  { method: "GET", path: "/videos", handler: deps.listHandler, requiresAuth: true },
  { method: "GET", path: "/videos/:id/thumbnail", handler: deps.thumbnailHandler, requiresAuth: true },
];
