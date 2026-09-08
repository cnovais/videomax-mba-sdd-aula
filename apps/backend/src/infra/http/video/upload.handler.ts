import { UnauthenticatedError } from "@/domain/_shared/errors";
import { MissingFilePartError } from "@/domain/video/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { UploadVideoUseCase } from "@/usecase/video/upload-video.usecase";

export class UploadHandler implements Handler {
  constructor(private readonly uploadVideo: UploadVideoUseCase) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    if (!req.user) throw new UnauthenticatedError();
    // Defensive: `isMultipart: true` on this route means the framework
    // adapter already populated `req.file` (or the request never reached
    // a handler at all, e.g. a malformed body @fastify/multipart itself
    // rejected).
    if (!req.file) throw new MissingFilePartError();

    const output = await this.uploadVideo.execute({
      actorId: req.user.id,
      originalFilename: req.file.filename,
      content: req.file.stream,
    });
    return { status: 201, body: output };
  }
}
