import { z } from "zod";
import { UnauthenticatedError } from "@/domain/_shared/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { RenameVideoUseCase } from "@/usecase/video/rename-video.usecase";
import type { UpdateVideoDescriptionUseCase } from "@/usecase/video/update-video-description.usecase";
const schema = z.object({ title: z.string().optional(), description: z.string().optional() }).refine((v) => v.title !== undefined || v.description !== undefined);
export class UpdateHandler implements Handler {
  constructor(private readonly rename: RenameVideoUseCase, private readonly describe: UpdateVideoDescriptionUseCase) {}
  async handle(req: HttpRequest): Promise<HttpResponse> { if (!req.user) throw new UnauthenticatedError(); const body = schema.parse(req.body); const videoId = req.params["id"]; if (!videoId) throw new Error("Missing video id"); const common = { actorId: req.user.id, videoId }; if (body.title !== undefined && body.description !== undefined) { const title = await this.rename.execute({ ...common, title: body.title }); const description = await this.describe.execute({ ...common, description: body.description }); return { status: 200, body: { ...title, ...description } }; } if (body.title !== undefined) return { status: 200, body: await this.rename.execute({ ...common, title: body.title }) }; return { status: 200, body: await this.describe.execute({ ...common, description: body.description as string }) }; }
}
