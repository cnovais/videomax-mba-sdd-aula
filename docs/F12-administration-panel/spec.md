# Spec: F12. Administration Panel

## 1. Technical Overview

**What:** A gated `/admin` area, reachable only by users whose account carries `isAdmin: true`, exposing a dashboard (total users, total videos) and a searchable/sortable/paginated user list with per-user suspend, reactivate, and delete actions. Every other caller — unauthenticated or authenticated-but-not-admin — receives an identical 404, both from the backend routes and from the Next.js pages, so the area's existence is never disclosed.

**Why:** The domain already carries `isAdmin` and `isSuspended` on `User` (schema and entity), and the auth middleware already resolves `req.user.isAdmin` on every request — F02 built the primitives F12 consumes. What's missing is: (a) the admin-only read/write surface itself (overview + user list + suspend/reactivate/delete use cases), (b) two new fields the current schema and entity don't carry yet (`lastLoginAt` for the "last login" column, plus the write paths — `User.suspend()`/`reactivate()`/`recordLogin()` — since every entity in this codebase is currently immutable, only ever created or restored, never mutated), and (c) the cascading delete orchestration (video files, thumbnails, session rows) that no feature has needed yet.

**Scope:** PRD F12 carries neither a `Core Scope` nor a `Full Scope additions` block, so this spec covers the entire feature as written in PRD Section 6. Folders, tags, transcriptions, and summaries (F05/F06/F07) are explicitly named in the PRD's cascading-delete capability, but none of those tables exist yet — F12's PRD Section 8 dependencies are only F02 and F03, so this spec's delete cascade covers exactly what F02+F03 provide today (the user row, sessions, videos, thumbnail and video files) and is written so a future F05/F06/F07 migration that adds its own `ON DELETE CASCADE` foreign key extends the cascade automatically, with no F12 code change. See **Assumptions & Decisions**.

## 2. Architecture Impact

**Affected components** (full paths in **Component Overview**):
- `apps/backend/src/domain/user/*` — entity gains mutation methods and a new field; a new `user.queries.ts` read-side contract is introduced
- `apps/backend/src/domain/video/*`, `apps/backend/src/domain/session/*` — repository/query contracts gain the methods the cascade needs
- `apps/backend/src/usecase/user/*` — five new use cases plus one shared admin-gate helper; `authenticate-user.usecase.ts` gains one call
- `apps/backend/src/infra/http/admin/*` — new route group, handlers, wiring into `main.ts`
- `apps/backend/prisma/schema.prisma` — one new nullable column, one new migration
- `apps/web/app/admin/*` — new nested layout (the gate) plus dashboard and users pages
- `apps/web/app/api/admin/*` — new Route Handler proxies (session-cookie → bearer-token bridge, matching every existing proxy)
- `apps/web/components/admin-*` — new nav, cards, table, and delete-confirmation components

```mermaid
graph TD
  A[Admin visits "/admin/users"] --> B["apps/web/app/admin/layout.tsx"]
  B -->|"GET /auth/me via backendFetch"| C[Backend: existing auth]
  B -->|not admin or not logged in| D["notFound()"]
  B -->|admin confirmed| E["apps/web/app/admin/users/page.tsx"]
  E -->|"GET /admin/users via backendFetch"| F["AdminUsersRoutes handler"]
  F --> G[ListUsersForAdminUseCase]
  G --> H[requireAdminActor helper]
  G --> I["UserQueries.listForAdmin()"]
  I --> J[(PostgreSQL: users, videos)]
  E --> K[AdminUsersTable client component]
  K -->|"suspend/reactivate/delete via /api/admin/users/*"| L["Route Handler proxies"]
  L -->|"Authorization: Bearer token"| M["Admin handlers (suspend/reactivate/delete)"]
  M --> N[SuspendUserUseCase / ReactivateUserUseCase / DeleteUserUseCase]
  N --> O["UserRepository / SessionRepository / VideoRepository / VideoStorageGateway"]
```

## 3. Technical Decisions

| Decision | Chosen Approach | Alternative Considered | Trade-off |
|---|---|---|---|
| Non-admin masking (401 vs 404) | `/admin/*` backend routes register `requiresAuth: false` (like `logout`); each admin use case calls a shared `requireAdminActor(userRepo, actorId?)` helper that throws the same 404 (`NOT_FOUND`) whether `actorId` is `undefined` (never authenticated) or resolves to a non-admin | Register routes with `requiresAuth: true` and let a non-admin get 403 | 403 (or a 401-vs-404 split by auth state) discloses that the route exists; a single 404 for both cases matches the PRD literally and the clean-arch skill's documented `/admin/*` masking pattern |
| Where the admin check lives | Business rule in each use case (`requireAdminActor`), never in HTTP middleware or in the handler | Add an `isAdmin` guard clause to `AuthMiddleware` | Middleware has no domain knowledge and would duplicate the rule across a background worker / CLI entry point later; the skill's `authorization.md` draws this line explicitly |
| Self-action guard vs. last-admin guard ordering | `DeleteUserUseCase` checks "would this leave zero admins" **before** the self-action check | Check self-action first | In this single-tier admin model the two guards are only jointly reachable when the actor **is** the sole admin deleting themself — ordering the last-admin check first gives that specific case its own distinct error code (`LAST_ADMIN_CANNOT_BE_DELETED`) instead of always surfacing the generic self-action message, satisfying both PRD ACs as independently observable outcomes |
| Entity mutation shape | `User.suspend()` / `.reactivate()` / `.recordLogin(at)` each return a **new** `User` instance (fields stay `readonly`) | Make the fields mutable in place | Every entity in this codebase (`User`, `Video`, `Session`) is immutable today — introducing the first in-place mutation would be inconsistent; returning a new instance preserves the existing convention at the cost of one extra `userRepo.save(updated)` call per write |
| Cascading delete ownership | `DeleteUserUseCase` explicitly enumerates the target's videos, deletes each file + thumbnail via `VideoStorageGateway`, deletes each video row, deletes all the user's sessions, then deletes the user row — all inside the use case | Rely solely on the Postgres `ON DELETE CASCADE` foreign keys already on `Video.userId` and `Session.userId` | The FK cascade only fires for the Prisma-backed production path and only cleans DB rows, never the on-disk files; keeping the orchestration explicit in the use case makes it identically testable against `UserInMemoryRepository` (no DB engine to cascade) and keeps file cleanup and row cleanup in the same reviewable place. The FK cascade stays configured as a defensive second layer |
| `VideoRepository.findAllByUserId` | Add a write-side listing method on `VideoRepository`, documented as an exception to the "listings belong in Queries" rule | Add the same shape to `VideoQueries` and load full entities from the DTO's ids | The cascade needs the full `Video` entity (`storageKey`, `thumbnailPath`) to drive `VideoRepository.delete` and `VideoStorageGateway.delete`, not a UI-shaped read DTO — this is a write-path enumeration (bulk delete orchestration), the same category the skill's `repository-and-queries.md` reserves for repository `findByX` methods needed by writes |
| `lastLoginAt` tracking | `AuthenticateUserUseCase.execute` calls `user.recordLogin()` and saves it before issuing the session; `User.create` defaults the field to `null` | Track logins in a separate `login_events` table | A single nullable timestamp column is exactly what the PRD's "last login" column needs; a full event log is unrequested scope. Touches an F02-owned file, but this is F12's own capability, delivered in F12's scope, on a use case F12 already depends on |
| Admin page size | Server-fixed at 50, not a client-supplied query parameter | Accept `pageSize` like `GET /videos` does (client-capped at 100) | PRD states "pagination at 50 users per page" as a fixed product policy, not a user preference — no query param to get wrong |
| `/admin` visual theme | Reuse the already-shipped Direction A ("Ember", light) tokens (`apps/web/app/globals.css`, `vm-badge.tsx`, `vm-button.tsx`) | Introduce Direction B ("Signal", dark) per this project's `CLAUDE.md`, which states "Use ONLY Option B: 'B · Signal' - Dark" | `CLAUDE.md`'s directive conflicts with what's already shipped: landing, auth, and the library are all built on Direction A/Ember tokens today. A single dark `/admin` bolted onto an otherwise light app would look like two different products. This spec follows the codebase's existing implemented tokens and flags the `CLAUDE.md` ⟷ shipped-code conflict for the team to resolve project-wide — it is outside this feature's scope to re-theme the whole app |

## 4. Component Overview

**Backend:**

| File Path | New/Modified | Purpose | Key Responsibilities |
|---|---|---|---|
| `apps/backend/src/domain/user/user.entity.ts` | Modified | Admin-relevant state and its mutations | Add `lastLoginAt: Date \| null`; add `suspend()`, `reactivate()`, `recordLogin(at)` (each returns a new instance); add `assertIsAdmin()` (throws when `!isAdmin`) |
| `apps/backend/src/domain/user/errors.ts` | Modified | New domain error types | `AdminAccessRequiredError` (404, masking), `AccountSuspendedError` (403, login-time), `LastAdminError` (409), `EmailConfirmationMismatchError` (422) |
| `apps/backend/src/domain/user/user.repository.ts` | Modified | Write-side contract | Add `delete(id): Promise<void>` (idempotent) |
| `apps/backend/src/domain/user/user.queries.ts` | New | Read-side contract for the admin list and metrics | `AdminUserListItem` DTO; `listForAdmin(input)`, `countAll()`, `countAdmins()` |
| `apps/backend/src/domain/video/video.repository.ts` | Modified | Cascade support | Add `delete(id): Promise<void>` (idempotent), `findAllByUserId(userId): Promise<Video[]>` |
| `apps/backend/src/domain/video/video.queries.ts` | Modified | Dashboard metric | Add `countAll(): Promise<number>` |
| `apps/backend/src/domain/session/session.repository.ts` | Modified | Session invalidation | Add `deleteAllByUserId(userId): Promise<void>` |
| `apps/backend/src/usecase/user/require-admin-actor.ts` | New | Shared authorization helper | Loads the actor by (possibly absent) `actorId`; throws the masking 404 when absent or non-admin; returns the loaded `User` otherwise. Used by every use case below |
| `apps/backend/src/usecase/user/get-admin-overview.usecase.ts` + `.dto.ts` | New | Dashboard metrics | `{ actorId? }` → `{ totalUsers, totalVideos }` |
| `apps/backend/src/usecase/user/list-users-for-admin.usecase.ts` + `.dto.ts` | New | User list | `{ actorId?, page, search?, sortBy?, sortDir? }` → `PageOutput<AdminUserListItem>` (server-fixed `pageSize: 50`) |
| `apps/backend/src/usecase/user/suspend-user.usecase.ts` + `.dto.ts` | New | Suspend + invalidate sessions | `{ actorId?, targetUserId }`; self-action guard; calls `sessionRepo.deleteAllByUserId` |
| `apps/backend/src/usecase/user/reactivate-user.usecase.ts` + `.dto.ts` | New | Reactivate | `{ actorId?, targetUserId }` |
| `apps/backend/src/usecase/user/delete-user.usecase.ts` + `.dto.ts` | New | Cascading delete | `{ actorId?, targetUserId, confirmEmail }`; last-admin guard, self-action guard, email-match check, then cascade |
| `apps/backend/src/usecase/user/authenticate-user.usecase.ts` | Modified | Track last login | After password verification succeeds, call `user.recordLogin()` and `userRepo.save(...)` before issuing the session; also the first place `AccountSuspendedError` is thrown, before password verification, when `user.isSuspended` |
| `apps/backend/src/infra/repository/user/user.mapper.ts`, `.prisma-repository.ts`, `.in-memory-repository.ts` | Modified | Persist `lastLoginAt`; implement `delete` | Mapper carries the new column both ways; both repositories implement `delete` (idempotent) |
| `apps/backend/src/infra/queries/user/user.prisma-queries.ts` + `.in-memory-queries.ts` | New | `UserQueries` implementations | Prisma version uses `_count`/`where`/`orderBy`; in-memory version reads the same `Map` the in-memory repository holds (existing project convention) |
| `apps/backend/src/infra/repository/video/video.prisma-repository.ts`, `.in-memory-repository.ts` | Modified | Implement `delete`, `findAllByUserId` | |
| `apps/backend/src/infra/queries/video/video.prisma-queries.ts`, `.in-memory-queries.ts` | Modified | Implement `countAll` | |
| `apps/backend/src/infra/repository/session/session.prisma-repository.ts`, `.in-memory-repository.ts` | Modified | Implement `deleteAllByUserId` | |
| `apps/backend/src/infra/http/admin/get-overview.handler.ts` | New | `GET /admin/overview` | |
| `apps/backend/src/infra/http/admin/list-users.handler.ts` | New | `GET /admin/users` | zod-validates `search`, `sortBy`, `sortDir`, `page` |
| `apps/backend/src/infra/http/admin/suspend-user.handler.ts` | New | `POST /admin/users/:id/suspend` | |
| `apps/backend/src/infra/http/admin/reactivate-user.handler.ts` | New | `POST /admin/users/:id/reactivate` | |
| `apps/backend/src/infra/http/admin/delete-user.handler.ts` | New | `DELETE /admin/users/:id` | zod-validates body `{ confirmEmail }` |
| `apps/backend/src/infra/http/admin/admin.routes.ts` | New | Route table for the group | All five routes with `requiresAuth: false` (see Technical Decisions) |
| `apps/backend/src/infra/http/index.ts` | Modified | Barrel | Merge `adminRoutes(deps)` into `buildHttpRoutes` |
| `apps/backend/src/main.ts` | Modified | Composition root | Wire the five new use cases, the new queries implementations, and the five new handlers |
| `apps/backend/prisma/schema.prisma` | Modified | New column | `User.lastLoginAt DateTime?` |

**Frontend:**

| File Path | New/Modified | Purpose | Key Responsibilities |
|---|---|---|---|
| `apps/web/app/admin/layout.tsx` | New | The gate | Reads the session cookie, calls `GET /auth/me`; on missing token, non-OK response, or `isAdmin: false`, calls `notFound()`; otherwise renders `AdminNav` + `children` |
| `apps/web/app/admin/page.tsx` | New | Dashboard | Server Component; calls `GET /admin/overview` via `backendFetch`; renders `AdminOverviewCards` |
| `apps/web/app/admin/users/page.tsx` | New | Users list | Server Component; reads `search`/`sortBy`/`sortDir`/`page` from `searchParams`; calls `GET /admin/users` via `backendFetch`; renders `AdminUsersTable` |
| `apps/web/components/admin-nav.tsx` | New | Top nav inside `/admin/*` | Links "Dashboard" (`/admin`) and "Users" (`/admin/users`) |
| `apps/web/components/admin-overview-cards.tsx` | New | Two metric cards | Total users, total videos |
| `apps/web/components/admin-users-table.tsx` | New (Client Component) | Interactive table | Search input, sortable column headers, pagination controls (URL-driven via `router.push`), per-row Suspend/Reactivate button, opens `AdminDeleteUserModal` |
| `apps/web/components/admin-delete-user-modal.tsx` | New (Client Component) | Delete confirmation | Text input must exactly match the target's email before the Delete button enables; calls the delete proxy on confirm |
| `apps/web/app/api/admin/overview/route.ts` | New | Proxy | `GET`, forwards bearer token, forwards status verbatim (including a masked 404) |
| `apps/web/app/api/admin/users/route.ts` | New | Proxy | `GET`, forwards query string and token |
| `apps/web/app/api/admin/users/[id]/suspend/route.ts` | New | Proxy | `POST` |
| `apps/web/app/api/admin/users/[id]/reactivate/route.ts` | New | Proxy | `POST` |
| `apps/web/app/api/admin/users/[id]/route.ts` | New | Proxy | `DELETE`, forwards JSON body `{ confirmEmail }` |

**Database:**

| Migration File | Tables Affected | Operation | Notes |
|---|---|---|---|
| `<timestamp>_add_user_last_login/migration.sql` | `users` | `ALTER TABLE users ADD COLUMN "lastLoginAt" TIMESTAMP(3)` | Nullable, no default — every existing row starts `null`, matching a user who registered but whose most recent login predates this migration |

## 5. API Contracts

All five endpoints require an admin actor; every one masks non-admin/unauthenticated access behind an identical 404 (see **Error Codes** below, shared across the group).

### `GET /admin/overview`
- **Authentication:** Bearer token resolved by the auth middleware (optional at the middleware level — the use case enforces admin)

**Response (200):**

| Field | Type | Description |
|---|---|---|
| `totalUsers` | `integer` | Count of all registered users, including suspended |
| `totalVideos` | `integer` | Count of all videos across all users |

```json
{ "totalUsers": 214, "totalVideos": 1893 }
```

### `GET /admin/users`

**Request (query string):**

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `search` | `string` | No | 1-200 chars | Case-insensitive substring match against name OR email |
| `sortBy` | `string` | No | enum: `name`, `email`, `createdAt`, `lastLoginAt`, `videoCount`, `status`; default `createdAt` | Column to sort by |
| `sortDir` | `string` | No | enum: `asc`, `desc`; default `desc` | Sort direction |
| `page` | `integer` | No | min 1; default 1 | Page number (page size is server-fixed at 50) |

**Response (200):**

| Field | Type | Description |
|---|---|---|
| `items[].id` | `string` | |
| `items[].name` | `string` | |
| `items[].email` | `string` | |
| `items[].createdAt` | `string` (ISO 8601) | Registration date |
| `items[].lastLoginAt` | `string \| null` | |
| `items[].videoCount` | `integer` | |
| `items[].isSuspended` | `boolean` | |
| `items[].isAdmin` | `boolean` | |
| `page`, `pageSize`, `total` | `integer` | Pagination envelope; `pageSize` is always `50` |

```json
{
  "items": [
    { "id": "u_1", "name": "Existing User", "email": "existing@example.com", "createdAt": "2026-01-04T10:00:00.000Z", "lastLoginAt": "2026-02-01T09:12:00.000Z", "videoCount": 3, "isSuspended": false, "isAdmin": false }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 214
}
```

### `POST /admin/users/:id/suspend`
**Response (200):** `{ "id": "u_1", "isSuspended": true }`

### `POST /admin/users/:id/reactivate`
**Response (200):** `{ "id": "u_1", "isSuspended": false }`

### `DELETE /admin/users/:id`

**Request (body):**

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `confirmEmail` | `string` | Yes | Must exactly equal the target user's email | Confirmation typed by the admin |

**Response:** `204 No Content`

### Error Codes (shared across the group)

| Code | HTTP Status | Description |
|---|---|---|
| `NOT_FOUND` | 404 | Caller is unauthenticated or authenticated-but-not-admin (identical response either way) |
| `USER_NOT_FOUND` | 404 | Caller is a confirmed admin, but `:id` does not resolve to any user |
| `FORBIDDEN` | 403 | Admin attempted to suspend or delete their own account |
| `LAST_ADMIN_CANNOT_BE_DELETED` | 409 | Deleting `:id` would leave zero admin accounts |
| `EMAIL_CONFIRMATION_MISMATCH` | 422 | `confirmEmail` does not equal the target's email |
| `ACCOUNT_SUSPENDED` | 403 | (Login endpoint, not this group) `POST /auth/login` for a suspended account |

## 6. Data Model

**Table: `users`** (existing table, one column added)

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `text` | No | `uuid()` | Primary key (unchanged) |
| `name`, `email`, `hashedPassword` | `text` | No | — | Unchanged |
| `isAdmin`, `isSuspended` | `boolean` | No | `false` | Unchanged — already gate F12's authorization |
| **`lastLoginAt`** | `timestamp(3)` | **Yes** | — | **New.** Set on every successful `POST /auth/login`; `null` until the first login after this migration |
| `createdAt`, `updatedAt` | `timestamp(3)` | No | — | Unchanged |

**Constraints:** no new constraints; `Video.userId` and `Session.userId` already carry `ON DELETE CASCADE` (defensive second layer per Technical Decisions).

**Migration:**
```sql
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
```

No new tables. Folders, tags, transcriptions, and summaries are out of this feature's dependency closure (see **Assumptions & Decisions**).

## 7. Testing Strategy

**Backend (Vitest, co-located `.spec.ts`, per this project's convention):**

| Test File | Type | Target | Coverage Goal |
|---|---|---|---|
| `domain/user/user.entity.spec.ts` (extended) | Unit | `suspend`, `reactivate`, `recordLogin`, `assertIsAdmin` | Every new method, including idempotency of `suspend`/`reactivate` |
| `usecase/user/require-admin-actor.spec.ts` | Unit | Masking behavior | Absent actorId, non-admin actor, admin actor — all three branches |
| `usecase/user/get-admin-overview.usecase.spec.ts` | Unit | Totals | Correct counts against `UserInMemoryRepository`/`VideoInMemoryRepository` fakes |
| `usecase/user/list-users-for-admin.usecase.spec.ts` | Unit | Search, sort, pagination | At least one case per `sortBy` value used by contract items; search substring; page 2 |
| `usecase/user/suspend-user.usecase.spec.ts` | Unit | Suspend + session invalidation + self-guard | Happy path, self-suspend rejected |
| `usecase/user/reactivate-user.usecase.spec.ts` | Unit | Reactivate | Happy path |
| `usecase/user/delete-user.usecase.spec.ts` | Unit | Cascade, guards | Happy path (videos+files+sessions gone), wrong `confirmEmail`, self-delete with ≥2 admins, self-delete as the sole admin |
| `usecase/user/authenticate-user.usecase.spec.ts` (extended) | Unit | `lastLoginAt` write, suspended rejection | Login sets `lastLoginAt`; login for a suspended user throws `AccountSuspendedError` before password comparison is asserted (regression coverage per CLAUDE.md) |
| `infra/http/admin/*.spec.ts` | Unit | Handlers | zod validation errors map to 400/422 as appropriate |

**Frontend (Vitest + Testing Library, co-located under `apps/web/tests/unit/`):**

| Test File | Type | Target | Coverage Goal |
|---|---|---|---|
| `tests/unit/admin-users-table.test.tsx` | Component | Search input, sort headers, pagination, per-row actions | Only the critical interaction paths — no granular per-prop rendering tests, per CLAUDE.md |
| `tests/unit/admin-delete-user-modal.test.tsx` | Component | Email-match gating | Delete button stays disabled until the typed value equals the target's email |

**End-to-end (Playwright, `apps/web/tests/e2e/admin.spec.ts`, extending the existing `tests/e2e/` suite alongside `auth.spec.ts` and `upload.spec.ts` — no new e2e folder, per CLAUDE.md):** covers `E2E-SUSPEND-01` and `E2E-DELETE-01` from `contract.md`. Note: this committed suite is the project's automated E2E deliverable; any ad-hoc manual browser verification during implementation should use the `playwright-cli` skill instead of driving Playwright directly, per CLAUDE.md — that guidance concerns how a human/agent manually probes the running app, not the shape of the committed test suite.

## Assumptions & Decisions

Documented per the Auto-Accept policy applied to this run (interactive interview skipped at the user's request):

1. **Complexity level:** `medium` — 5 new endpoints, one additive migration, no external services, but touching three existing aggregates (User, Video, Session).
2. **Surfaces emitted in `contract.md`:** `HTTP API`, `UI`, `E2E` — no `## Service` (no consumer outside this feature calls these use cases) and no `## Worker`/`CLI`/`Event` (PRD gives no signal for any of those for F12).
3. **Cascading delete scope** is bounded to what F02+F03 provide (user row, sessions, videos, thumbnail/video files) — see Technical Decisions and Section 6. Folders/tags/transcriptions/summaries are not modeled yet.
4. **`/admin` visual theme** follows the already-shipped Direction A/Ember tokens rather than `CLAUDE.md`'s stated Direction B/Signal-dark — flagged for the team; see Technical Decisions.
5. **Sort columns:** the six PRD-listed columns (name, email, registration date, last login, video count, status) are all exposed via `sortBy`; the contract exercises two representative ones (`name`, `videoCount`) rather than all six, consistent with this project's existing contracts (F04 exercised 3 of its sort/filter combinations, not an exhaustive matrix).
6. **No visible link to `/admin` was added** to `SiteHeader` or anywhere else in the authenticated app — no PRD AC requires one; admins reach the area by navigating to the URL directly, matching the PRD's "with my regular login... so I do not need separate credentials" framing (it says nothing about in-app discovery).
7. **Quality gates** reuse the exact 8 gates already established in `docs/F04-video-library/contract.md` (same project, same `npm run gates` wrapper, same per-workspace scripts) — no new gate introduced.
