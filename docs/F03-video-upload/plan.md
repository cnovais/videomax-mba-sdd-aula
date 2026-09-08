# Implementation Plan: F03. Video Upload

**Prerequisites:**
- F02 (Authentication System) implemented and merged — this feature builds on its session/bearer-token plumbing
- `ffmpeg` and `ffprobe` available on `PATH` in every environment this feature runs in (dev, test, CI)
- The two large sample videos documented in the project's `AGENTS.md` downloaded into `video-samples/` for manual verification (not required for automated tests, which use a small synthetic fixture this feature generates)

### Stage 1: Video Domain and Persistence

**1. Video Aggregate** - Implement the `Video` entity, `VideoId` and `VideoStatus` VOs, and the feature's `errors.ts`, per the spec's Component Overview.

**2. Database Schema and Migration** - Add the `Video` model and its migration to the existing Prisma schema, per the spec's Data Model.

**3. Repository and Queries** - Implement the Prisma-backed and in-memory `VideoRepository` and `VideoQueries`, per this project's established repository/queries convention.

### Stage 2: Storage and Media Processing Gateways

**4. Storage Gateway** - Implement the stream-based `VideoStorageGateway` interface plus its local-disk production implementation and in-memory fake, per the spec's Technical Decisions.

**5. Media Probe and Thumbnail Gateways** - Implement `MediaProbeGateway` (`ffprobe`) and `ThumbnailGateway` (`ffmpeg`), each with a production implementation shelling out to the system binary and a fake for tests. The thumbnail gateway's failure path must not throw — it returns a "no thumbnail" result the use case interprets as a fallback.

**6. Environment Configuration** - Add `STORAGE_ROOT` to `apps/backend/src/config/env.ts` and the `.env`/`.env.example`/`.env.test` files, per the spec's Assumptions.

### Stage 3: Upload Use Case and Backend HTTP API

**7. Upload Video Use Case** - Implement `UploadVideoUseCase`, orchestrating store → probe → thumbnail → persist in the order the spec describes, including the server-side format/size guard.

**8. List Videos Use Case** - Implement `ListVideosUseCase` using `VideoQueries` and this project's `PageInput`/`PageOutput` pagination convention.

**9. HTTP Handlers, Routes, and Multipart Wiring** - Register `@fastify/multipart` in the framework adapter, implement the upload and list handlers and routes, and wire everything into the composition root, per the spec's Component Overview.

### Stage 4: Frontend Upload Experience

**10. Proxy Route Handler** - Implement `apps/web/app/api/videos/route.ts`, streaming the multipart `POST` body to the backend and forwarding `GET` list requests, attaching the bearer token from the session cookie.

**11. Client-Side Upload Logic** - Implement `lib/upload-client.ts`: extension/size validation before transfer, the single-flight upload queue, and `XMLHttpRequest`-based progress reporting.

**12. Upload UI Components** - Build the drop zone, upload progress card, toast, and minimal video list components, following the design system's Option B ("Signal", dark) visual language per the spec's Technical Decisions.

**13. Compose the `/app` Placeholder** - Extend F02's existing placeholder page with the new components and an initial server-side video list fetch.

### Stage 5: Verification

**14. Fixture Generation** - Generate the small synthetic `video-samples/tiny-valid.mp4` fixture (via `ffmpeg`) used by automated tests, per the spec's Assumptions.

**15. Automated Test Coverage** - Write the backend unit/integration tests (entity, VOs, use cases with fakes, real-binary gateway tests against the fixture) and the frontend unit/component tests, per the spec's Testing Strategy.

**16. End-to-End Coverage** - Write the Playwright specs covering a full upload, the two client-side rejection cases, and the non-blocking-navigation behavior, against the real backend.
