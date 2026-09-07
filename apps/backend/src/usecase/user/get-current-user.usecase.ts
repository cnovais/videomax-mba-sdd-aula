import { UserNotFoundError } from "@/domain/user/errors";
import type { UserRepository } from "@/domain/user/user.repository";
import type { GetCurrentUserInput, GetCurrentUserOutput } from "./get-current-user.dto";

/**
 * Loads the authenticated caller's public profile. Used by `GET /auth/me`
 * — the frontend's `/app` placeholder calls this to render the current
 * user's name. Not part of the spec's original Component Overview list;
 * added because handlers may not access repositories directly (rule 16),
 * and `ResolveSessionUseCase`'s `{id, isAdmin}` (built for `req.user`,
 * shared by every protected route) intentionally omits name/email.
 */
export class GetCurrentUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    const user = await this.userRepo.findById(input.actorId);
    if (!user) throw new UserNotFoundError(input.actorId);
    return { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
  }
}
