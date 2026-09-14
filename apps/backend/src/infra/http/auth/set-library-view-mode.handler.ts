import { z } from "zod";
import { UnauthenticatedError } from "@/domain/_shared/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { SetLibraryViewModeUseCase } from "@/usecase/user/set-library-view-mode.usecase";
const schema = z.object({ viewMode: z.string() });
export class SetLibraryViewModeHandler implements Handler { constructor(private readonly useCase: SetLibraryViewModeUseCase) {} async handle(req: HttpRequest): Promise<HttpResponse> { if (!req.user) throw new UnauthenticatedError(); const body = schema.parse(req.body); return { status: 200, body: await this.useCase.execute({ actorId: req.user.id, viewMode: body.viewMode as "grid" | "list" }) }; } }
