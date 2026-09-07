import type { GetHealthHandler } from "./get-health.handler";
import type { HttpRoute } from "@/infra/http/types";

export type HealthRoutesDeps = {
  getHealthHandler: GetHealthHandler;
};

export const healthRoutes = (deps: HealthRoutesDeps): HttpRoute[] => [
  { method: "GET", path: "/health", handler: deps.getHealthHandler },
];
