# Implementation Plan: F02. Authentication System

**Prerequisites:**
- Node.js 20+ and npm 10+ installed
- Docker (or a local PostgreSQL 16 instance) available for the development/test database
- No external accounts or API keys required (no third-party auth provider is used)

### Stage 1: Backend Foundation Scaffolding

**1. Monorepo Backend Scaffolding** - Initialize `apps/backend/` as a Node.js/TypeScript service with the clean-architecture skeleton (`domain/`, `usecase/`, `infra/`, `config/`, `main.ts`), the Fastify HTTP adapter, and the full quality-gate tooling (ESLint, dependency-cruiser, architecture check, madge, knip, Vitest). Wire `apps/backend` into the root npm workspace alongside `apps/web`, per the spec's Component Overview.

**2. Environment and Configuration** - Implement `apps/backend/src/config/env.ts` validating `PORT`, `DATABASE_URL`, `SESSION_SECRET`, `LOG_LEVEL`. Add `.env.example` and `.env.test`, and a root `docker-compose.yml` for local PostgreSQL, per the spec's Technical Decisions.

**3. Database Schema and Migration** - Author the Prisma schema for `users` and `sessions` (per the spec's Data Model), generate the initial migration, and add the seed script that establishes this project's persistent-state seeding convention for future backend features.

### Stage 2: User and Session Domain

**4. User Aggregate** - Implement the `User` entity, `Email` VO, `HashedPassword` VO (strength validation + bcrypt hashing + comparison), `UserId` VO, and the feature's `errors.ts`, per the spec's Component Overview.

**5. Session Aggregate** - Implement the `Session` entity and `SessionToken` VO (raw-token generation and HMAC digesting), the session repository interface, and session-specific errors.

**6. Registration and Login Use Cases** - Implement `CreateUserUseCase` and `AuthenticateUserUseCase`, each orchestrating the relevant domain rules plus session issuance, per the spec's Technical Decisions and API Contracts.

**7. Logout and Session Resolution Use Cases** - Implement `RevokeSessionUseCase` (idempotent) and `ResolveSessionUseCase` (used by the auth middleware and the `/auth/me` handler).

**8. Repository Implementations** - Implement the Prisma-backed and in-memory (fake) versions of the user and session repositories, per this project's LSP-substitutability convention.

### Stage 3: Backend HTTP API

**9. Auth Middleware** - Implement `infra/http/middleware/auth.ts`, resolving the `Authorization: Bearer` token via `ResolveSessionUseCase` and populating `req.user` on protected routes, per the spec's architecture.

**10. HTTP Handlers, Routes, and Composition Root** - Implement the register/login/logout/me handlers and routes, wire them into `infra/http/index.ts`, and assemble the composition root (`main.ts`) per the spec's Component Overview.

**11. Central Error Mapping** - Implement `toHttpResponse(err)` mapping every domain/use-case error to the status codes and bodies described in the spec's API Contracts.

### Stage 4: Frontend Integration

**12. Next.js Proxy Route Handlers** - Implement the register/login/logout Route Handlers under `apps/web/app/api/auth/`, forwarding to the backend and managing the first-party `videomax_session` cookie, per the spec's Technical Decisions.

**13. Registration and Login Pages** - Build `/register` and `/login` pages and their client-side forms, with inline validation error display, per the PRD's Experience description.

**14. Placeholder Authenticated Landing** - Build the minimal `/app` page and the "Log out" control described in the spec's Technical Decisions, so this feature's logout/redirect behavior is verifiable ahead of F04.

**15. Session Helper Extension** - Extend `apps/web/lib/session.ts` with a token accessor and add `apps/web/lib/backend-client.ts` for authenticated calls from the frontend to the backend.

### Stage 5: Verification

**16. Automated Test Coverage** - Write the backend unit/integration tests (entities, VOs, use cases, handlers) and the frontend component tests (forms, session helper), per the spec's Testing Strategy.

**17. End-to-End Coverage** - Write the Playwright specs covering registration, login (success and failure), and logout against the real backend, per the spec's Testing Strategy.
