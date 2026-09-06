import { authRoutes, type AuthRoutesDeps } from "./auth/auth.routes";
import type { HttpRoute } from "./types";

// Single allowed barrel (rule 4) — the boundary between the structured
// per-feature route arrays and the framework adapter in main.ts.
export type HttpDeps = AuthRoutesDeps;

export const buildHttpRoutes = (deps: HttpDeps): HttpRoute[] => [...authRoutes(deps)];
