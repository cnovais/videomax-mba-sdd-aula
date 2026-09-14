import { UnauthenticatedError } from "@/domain/_shared/errors";
import { VideoNotFoundError } from "@/domain/video/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { RetryVideoUseCase } from "@/usecase/pipeline/retry-video.usecase";
export class RetryHandler implements Handler { constructor(private readonly retryVideo: RetryVideoUseCase) {} async handle(req: HttpRequest): Promise<HttpResponse> { if (!req.user) throw new UnauthenticatedError(); const id = req.params["id"]; if (!id) throw new VideoNotFoundError(""); return { status: 200, body: await this.retryVideo.execute({ actorId: req.user.id, videoId: id }) }; } }
