import { UnauthenticatedError } from "@/domain/_shared/errors";
import type { UserRepository } from "@/domain/user/user.repository";
import { Session } from "@/domain/session/session.entity";
import type { SessionRepository } from "@/domain/session/session.repository";
import { type AuthenticateUserInput, type AuthenticateUserOutput, toOutput } from "./authenticate-user.dto";

/**
 * Login: verifies credentials with a single generic failure for both
 * "no such user" and "wrong password" — the message never discloses
 * which. Issues a new session on success.
 */
export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly sessionSecret: string,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(normalizedEmail);

    if (!user || !user.verifyPassword(input.password)) {
      throw new UnauthenticatedError("Invalid email or password");
    }

    const session = Session.create({ userId: user.id, secret: this.sessionSecret });
    await this.sessionRepo.save(session);

    return toOutput(user, session.rawToken as string);
  }
}
