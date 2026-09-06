import { Email } from "@/domain/user/email.vo";
import { User } from "@/domain/user/user.entity";
import type { UserRepository } from "@/domain/user/user.repository";
import { UserAlreadyExistsError } from "@/domain/user/errors";
import { Session } from "@/domain/session/session.entity";
import type { SessionRepository } from "@/domain/session/session.repository";
import { type CreateUserInput, type CreateUserOutput, toOutput } from "./create-user.dto";

/**
 * Registration: checks email uniqueness, creates the `User` (which
 * strength-validates and hashes the password), issues a session so the
 * caller is auto-logged-in, persists both, and returns the user plus the
 * raw (one-time) session token.
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly sessionSecret: string,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const email = Email.create(input.email);

    const existing = await this.userRepo.findByEmail(email.value);
    if (existing) throw new UserAlreadyExistsError(email.value);

    const user = User.create({
      name: input.name,
      email: email.value,
      password: input.password,
    });
    await this.userRepo.save(user);

    const session = Session.create({ userId: user.id, secret: this.sessionSecret });
    await this.sessionRepo.save(session);

    return toOutput(user, session.rawToken as string);
  }
}
