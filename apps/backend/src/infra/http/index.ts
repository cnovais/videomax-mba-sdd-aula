import { authRoutes, type AuthRoutesDeps } from "./auth/auth.routes";
import { healthRoutes, type HealthRoutesDeps } from "./health/health.routes";
import { videoRoutes, type VideoRoutesDeps } from "./video/video.routes";
import type { HttpRoute } from "./types";

// Single allowed barrel (rule 4) — the boundary between the structured
// per-feature route arrays and the framework adapter in main.ts.
export type HttpDeps = AuthRoutesDeps & HealthRoutesDeps & VideoRoutesDeps;

export const buildHttpRoutes = (deps: HttpDeps): HttpRoute[] => [
  ...authRoutes(deps),
  ...healthRoutes(deps),
  ...videoRoutes(deps),
];
