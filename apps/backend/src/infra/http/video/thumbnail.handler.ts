import { UnauthenticatedError } from "@/domain/_shared/errors";
import { VideoNotFoundError } from "@/domain/video/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { GetVideoThumbnailUseCase } from "@/usecase/video/get-video-thumbnail.usecase";

export class ThumbnailHandler implements Handler {
  constructor(private readonly getThumbnail: GetVideoThumbnailUseCase) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    if (!req.user) throw new UnauthenticatedError();
    const videoId = req.params["id"];
    if (!videoId) throw new VideoNotFoundError("");

    const { stream } = await this.getThumbnail.execute({ actorId: req.user.id, videoId });
    return { status: 200, body: stream, headers: { "content-type": "image/jpeg" } };
  }
}
