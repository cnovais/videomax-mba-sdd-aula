import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// `scripts/resolve-env.sh` (invoked by `./scripts/init.sh`) assigns each
// branch its own backend/web port pair — offset from 4000/3000 — and writes
// them into `apps/backend/.env` / `apps/web/.env.local`. Playwright's own
// `webServer` block needs to probe (and, if nothing is listening yet, spawn
// against) those same ports, not a hardcoded 4000/3000: on any branch other
// than `main` the two diverge, which manifests as an `EADDRINUSE` from the
// spawned process (it reads the real `.env` and binds the real port) racing
// a readiness probe against the wrong port that then times out. Reading the
// same `.env` files here keeps Playwright pointed at whatever `init.sh`
// actually started.
const WEB_ROOT = path.resolve(__dirname, "..", "..");
const BACKEND_ENV_PATH = path.resolve(WEB_ROOT, "..", "backend", ".env");
const WEB_ENV_PATH = path.resolve(WEB_ROOT, ".env.local");

function readEnvPort(envFilePath: string, key: string, fallback: number): number {
  if (!existsSync(envFilePath)) return fallback;
  const contents = readFileSync(envFilePath, "utf8");
  const match = contents.match(new RegExp(`^${key}=(.+)$`, "m"));
  const parsed = Number(match?.[1]?.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const BACKEND_PORT = readEnvPort(BACKEND_ENV_PATH, "PORT", 4000);
export const WEB_PORT = readEnvPort(WEB_ENV_PATH, "PORT", 3000);
export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
