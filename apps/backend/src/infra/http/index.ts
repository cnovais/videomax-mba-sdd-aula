import { authRoutes, type AuthRoutesDeps } from "./auth/auth.routes";
import { healthRoutes, type HealthRoutesDeps } from "./health/health.routes";
import { videoRoutes, type VideoRoutesDeps } from "./video/video.routes";
import type { HttpRoute } from "./types";
import { adminRoutes, type AdminRoutesDeps } from "./admin/admin.routes";

// Single allowed barrel (rule 4) — the boundary between the structured
// per-feature route arrays and the framework adapter in main.ts.
export type HttpDeps = AuthRoutesDeps & HealthRoutesDeps & VideoRoutesDeps & Partial<AdminRoutesDeps>;

export const buildHttpRoutes = (deps: HttpDeps): HttpRoute[] => [
  ...authRoutes(deps),
  ...healthRoutes(deps),
  ...videoRoutes(deps),
  ...(deps.overviewHandler ? adminRoutes(deps as AdminRoutesDeps) : []),
];
