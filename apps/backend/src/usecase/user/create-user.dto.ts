import type { User } from "@/domain/user/user.entity";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export type CreateUserOutput = {
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
  };
  sessionToken: string;
};

export function toOutput(user: User, sessionToken: string): CreateUserOutput {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
    },
    sessionToken,
  };
}
