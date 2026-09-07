import type { HttpRoute } from "@/infra/http/types";
import type { LoginHandler } from "./login.handler";
import type { LogoutHandler } from "./logout.handler";
import type { MeHandler } from "./me.handler";
import type { RegisterHandler } from "./register.handler";

export type AuthRoutesDeps = {
  registerHandler: RegisterHandler;
  loginHandler: LoginHandler;
  logoutHandler: LogoutHandler;
  meHandler: MeHandler;
};

export const authRoutes = (deps: AuthRoutesDeps): HttpRoute[] => [
  { method: "POST", path: "/auth/register", handler: deps.registerHandler },
  { method: "POST", path: "/auth/login", handler: deps.loginHandler },
  { method: "POST", path: "/auth/logout", handler: deps.logoutHandler },
  { method: "GET", path: "/auth/me", handler: deps.meHandler, requiresAuth: true },
];
