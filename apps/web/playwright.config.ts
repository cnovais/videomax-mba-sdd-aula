import { defineConfig, devices } from "@playwright/test";
import { BACKEND_PORT, BACKEND_URL, WEB_PORT, WEB_URL } from "./tests/e2e/resolve-ports";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: WEB_URL,
  },
  webServer: [
    {
      command: "npm run dev",
      cwd: "../backend",
      port: BACKEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run build && npm run start",
      url: WEB_URL,
      env: { BACKEND_INTERNAL_URL: BACKEND_URL, PORT: String(WEB_PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
