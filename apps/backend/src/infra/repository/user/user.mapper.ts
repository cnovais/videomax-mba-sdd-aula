import type { User as UserRow } from "@prisma/client";
import { User } from "@/domain/user/user.entity";

export type UserPersistenceData = {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  isAdmin: boolean;
  isSuspended: boolean;
};

export class UserMapper {
  static toDomain(row: UserRow): User {
    return User.restore({
      id: row.id,
      name: row.name,
      email: row.email,
      hashedPassword: row.hashedPassword,
      isAdmin: row.isAdmin,
      isSuspended: row.isSuspended,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(user: User): UserPersistenceData {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hashedPassword: user.hashedPassword,
      isAdmin: user.isAdmin,
      isSuspended: user.isSuspended,
    };
  }
}
