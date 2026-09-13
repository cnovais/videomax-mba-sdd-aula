import { UnauthenticatedError } from "@/domain/_shared/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { DeleteVideoUseCase } from "@/usecase/video/delete-video.usecase";
export class DeleteHandler implements Handler { constructor(private readonly deleteVideo: DeleteVideoUseCase) {} async handle(req: HttpRequest): Promise<HttpResponse> { if (!req.user) throw new UnauthenticatedError(); const videoId = req.params["id"]; if (!videoId) throw new Error("Missing video id"); await this.deleteVideo.execute({ actorId: req.user.id, videoId }); return { status: 204 }; } }
