import { z } from "zod";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { AuthenticateUserUseCase } from "@/usecase/user/authenticate-user.usecase";

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export class LoginHandler implements Handler {
  constructor(private readonly authenticateUser: AuthenticateUserUseCase) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const input = schema.parse(req.body);
    const output = await this.authenticateUser.execute(input);
    return { status: 200, body: output };
  }
}
