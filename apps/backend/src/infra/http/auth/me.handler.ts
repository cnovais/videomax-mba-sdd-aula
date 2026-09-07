import { UnauthenticatedError } from "@/domain/_shared/errors";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { GetCurrentUserUseCase } from "@/usecase/user/get-current-user.usecase";

export class MeHandler implements Handler {
  constructor(private readonly getCurrentUser: GetCurrentUserUseCase) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    // Defensive: `requiresAuth: true` on this route means the middleware
    // would already have thrown UnauthenticatedError before reaching here.
    if (!req.user) throw new UnauthenticatedError();
    const output = await this.getCurrentUser.execute({ actorId: req.user.id });
    return { status: 200, body: output };
  }
}
