# Implementation Plan: F12. Administration Panel

**Prerequisites:**
- F02 (Authentication System) and F03 (Video Upload) implemented — this feature depends on both
- Node.js/TypeScript toolchain and PostgreSQL already running per `./scripts/init.sh`
- No new environment variables or libraries beyond what F02/F03 already configured

### Stage 1: Domain and Persistence Foundations

**1. User entity mutations and admin-gate invariant** - Extend the `User` entity with a `lastLoginAt` field and the `suspend`, `reactivate`, `recordLogin`, and `assertIsAdmin` behaviors described in the spec, preserving the entity's existing immutable style.

**2. New and extended domain errors** - Add the admin-masking, self-action, last-admin, and email-confirmation-mismatch errors to `domain/user/errors.ts`, following the existing error hierarchy and status-code conventions.

**3. Repository and query contract extensions** - Add the write-side `delete` methods needed for cascading removal (`UserRepository`, `VideoRepository`), the cascade-enumeration method on `VideoRepository`, the session-invalidation method on `SessionRepository`, the new `VideoQueries.countAll`, and the new `UserQueries` contract (list, count, count-admins) described in the spec.

**4. Prisma schema, migration, and repository/query implementations** - Add the `lastLoginAt` column and its migration; implement every new repository and query method on both the Prisma-backed and in-memory implementations, and update the user mapper to carry the new field.

### Stage 2: Application Layer

**5. Shared admin-authorization helper** - Introduce the helper that loads the acting user (when present) and enforces the admin-only, masked-404 rule described in the spec, so every admin use case reuses one implementation of that rule.

**6. Admin use cases** - Implement the overview, list, suspend, reactivate, and delete use cases described in the spec, including the delete use case's cascade orchestration and the ordering between its last-admin and self-action guards.

**7. Login use case extension** - Extend the existing authentication use case to reject suspended accounts and to record a successful login's timestamp, per the spec's Technical Decisions.

### Stage 3: HTTP Layer

**8. Admin handlers and route registration** - Add the five admin handlers and their route table, wired with the authentication posture described in the spec (routes tolerate an absent/invalid token; the use case layer enforces admin).

**9. Composition root wiring** - Wire the new repositories, queries, use cases, and handlers into `main.ts`, and merge the new route group into the existing HTTP route barrel.

### Stage 4: Frontend

**10. Admin gate and navigation shell** - Add the `/admin` nested layout that resolves the current session against the backend and renders the not-found page for anyone who isn't a confirmed admin, plus the admin-area navigation component.

**11. Dashboard page** - Add the `/admin` page and its metrics-card component, sourced from the new overview endpoint.

**12. Users page and interactive table** - Add the `/admin/users` page and its client-side table component covering search, per-column sorting, pagination, and the suspend/reactivate row actions described in the spec.

**13. Delete confirmation flow** - Add the email-confirmation delete modal and wire it to the corresponding proxy route.

**14. Route Handler proxies** - Add the five `/api/admin/*` proxy routes, following the existing bearer-token-forwarding pattern used by every other authenticated proxy in `apps/web/app/api/`.
