import { z } from "zod";
import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";
import type { CreateUserUseCase } from "@/usecase/user/create-user.usecase";

// Shape only: required fields, correct JSON types, sane length bounds.
// Email format and password strength are domain invariants (Email VO,
// HashedPassword VO) so a malformed value surfaces as a 422 domain error,
// not a 400 VALIDATION_ERROR — see error-handling.md's 400-vs-422 split.
const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().min(1),
  password: z.string().min(1),
});

export class RegisterHandler implements Handler {
  constructor(private readonly createUser: CreateUserUseCase) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const input = schema.parse(req.body);
    const output = await this.createUser.execute(input);
    return { status: 201, body: output };
  }
}
