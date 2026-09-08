import type { Readable } from "node:stream";

export type GetVideoThumbnailInput = {
  actorId: string;
  videoId: string;
};

export type GetVideoThumbnailOutput = {
  stream: Readable;
};
