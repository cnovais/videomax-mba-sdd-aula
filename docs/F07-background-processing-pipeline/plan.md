# Implementation Plan: F07. Background Processing Pipeline

**Prerequisites:**
- F03 (Video Upload) implemented and merged — this feature processes the video rows and stored files it produces
- `ffmpeg` and `ffprobe` available on `PATH` in every environment this feature runs in (dev, test, CI) — reused from F03
- An `OPENAI_API_KEY` available in the system environment for any environment that runs the real transcription/summary gateways (not required for automated tests, which run against fakes)

### Stage 1: Pipeline Domain Model and Persistence

**1. Extend the Video Aggregate** - Add attempt count, next-eligible-attempt timestamp, failed-stage, failure-reason, and audio-storage-key fields to the `Video` entity, plus the methods that encapsulate every attempt/backoff/failure transition, per the spec's Component Overview.

**2. Transcription and Summary Aggregates** - Implement the `Transcription` and `Summary` entities, their id value objects, and the feature's new domain errors, per the spec's Data Model.

**3. Database Schema and Migration** - Add the new `Video` columns and the `Transcription`/`Summary` tables to the Prisma schema, with a single migration, per the spec's Data Model.

**4. Repositories and Queries** - Implement the Prisma-backed and in-memory `TranscriptionRepository`/`TranscriptionQueries` and `SummaryRepository`/`SummaryQueries`, and extend `VideoQueries` with the processing-status read shape, per this project's established repository/queries convention.

### Stage 2: Media and AI Gateways

**5. Extend the Media Probe Gateway** - Add readability and codec-support fields to `MediaProbeGateway`'s return shape, update the `ffprobe`-backed production implementation and its fake, per the spec's Technical Decisions.

**6. Audio Extraction Gateway** - Implement the `AudioExtractionGateway` interface, its `ffmpeg`-backed production implementation, and its fake, per the spec's Component Overview.

**7. Transcription Gateway** - Implement the `TranscriptionGateway` interface, its OpenAI Whisper-backed production implementation using the official `openai` SDK, and a fake with configurable segments/language/failure.

**8. Summary Gateway** - Implement the `SummaryGateway` interface, its OpenAI GPT-4.1 nano-backed production implementation, and a fake with configurable overview/key-topics/failure.

**9. Environment Configuration** - Add `OPENAI_API_KEY`, the poll-interval, and the worker-concurrency settings to `apps/backend/src/config/env.ts` and the `.env`/`.env.example`/`.env.test` files, per the spec's Assumptions.

### Stage 3: Pipeline Orchestration Use Cases

**10. Backoff Schedule** - Implement the fixed 1m/5m/15m backoff constant and its attempt-number-to-delay helper, per the spec's Technical Decisions.

**11. Run Video Stage Use Case** - Implement `RunVideoStageUseCase`, dispatching to validate/transcribe/summarize logic by the video's current status and applying the success, retry-with-backoff, and terminal-failure transitions the spec describes, including the validate stage's no-retry rule.

**12. Process Pending Videos Use Case** - Implement `ProcessPendingVideosUseCase`, selecting due, non-terminal videos up to the configured concurrency and running each through `RunVideoStageUseCase`.

**13. Retry Video Use Case** - Implement `RetryVideoUseCase`, verifying ownership and `failed` status before resetting the attempt counter and re-entering the recorded failed stage.

### Stage 4: Worker Process and Retry Endpoint

**14. Pipeline Worker** - Implement `PipelineWorker`, owning the interval timer with `start()`/`stop()` and a directly-invocable tick method, per the spec's Technical Decisions on worker deployment topology.

**15. Retry HTTP Handler, Route, and Wiring** - Implement the retry handler and route, and wire every new gateway, repository, query, use case, and the worker into the composition root (`main.ts`), starting the worker alongside the HTTP server.

### Stage 5: Verification

**16. Automated Test Coverage** - Write the backend unit tests (entity transitions, backoff schedule, stage/pending/retry use cases with fakes) and the real-binary gateway integration tests (extended probe, audio extraction), per the spec's Testing Strategy.

**17. Handler and Worker Integration Tests** - Write the retry handler test and the pipeline worker lifecycle test against in-memory fakes, per the spec's Testing Strategy.

**18. Quality Gate Verification** - Run the project's quality gates and resolve any failures before considering the feature complete.
