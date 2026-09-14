import { AdminAccessRequiredError } from "@/domain/user/errors";
import type { User } from "@/domain/user/user.entity";
import type { UserRepository } from "@/domain/user/user.repository";
export async function requireAdminActor(repo: UserRepository, actorId?: string): Promise<User> { const actor = actorId ? await repo.findById(actorId) : null; if (!actor || !actor.isAdmin) throw new AdminAccessRequiredError(); return actor; }
