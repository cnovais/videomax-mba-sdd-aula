import type { UserRepository } from "@/domain/user/user.repository";
import { UserNotFoundError } from "@/domain/user/errors";
import { requireAdminActor } from "./require-admin-actor.dto";
export class ReactivateUserUseCase {
  constructor(private readonly users: UserRepository) {}
  async execute(i: { actorId?: string; targetUserId: string }) { await requireAdminActor(this.users, i.actorId); const target = await this.users.findById(i.targetUserId); if (!target) throw new UserNotFoundError(i.targetUserId); await this.users.save(target.reactivate()); return { id: target.id, isSuspended: false }; }
}
