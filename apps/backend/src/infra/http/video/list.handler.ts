import { z } from "zod";
import { UnauthenticatedError } from "@/domain/_shared/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { ListVideosUseCase } from "@/usecase/video/list-videos.usecase";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export class ListHandler implements Handler {
  constructor(private readonly listVideos: ListVideosUseCase) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    if (!req.user) throw new UnauthenticatedError();
    const { page, pageSize } = querySchema.parse(req.query);
    const output = await this.listVideos.execute({ actorId: req.user.id, page, pageSize });
    return { status: 200, body: output };
  }
}
