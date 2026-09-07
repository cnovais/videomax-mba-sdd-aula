import type { User } from "@/domain/user/user.entity";

export type AuthenticateUserInput = {
  email: string;
  password: string;
};

export type AuthenticateUserOutput = {
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
  };
  sessionToken: string;
};

export function toOutput(user: User, sessionToken: string): AuthenticateUserOutput {
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
