import type { User } from "@/domain/user/user.entity";
import type { UserRepository } from "@/domain/user/user.repository";

/** LSP-substitutable fake for tests — no database required. */
export class UserInMemoryRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.usersById.get(id) ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    for (const user of this.usersById.values()) {
      if (user.email === email) return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }

  save(user: User): Promise<void> {
    this.usersById.set(user.id, user);
    return Promise.resolve();
  }
}
