import type { Handler } from "@/infra/http/handler";
import type { HttpRequest, HttpResponse } from "@/infra/http/types";

/**
 * Process-liveness check consumed by `scripts/init.sh`'s readiness wait.
 * Deliberately has no use case / domain dependency: "is the HTTP server
 * accepting requests" carries no business rule to orchestrate. Database
 * reachability is already verified earlier in `init.sh` by the migration
 * step, so this stays a static liveness signal rather than a dependency
 * health check.
 */
export class GetHealthHandler implements Handler {
  handle(_req: HttpRequest): Promise<HttpResponse> {
    return Promise.resolve({ status: 200, body: { status: "ok" } });
  }
}
