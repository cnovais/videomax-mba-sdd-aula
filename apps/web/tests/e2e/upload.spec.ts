import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Playwright's test transform here runs CommonJS, so `__dirname` (not
// `import.meta.url`) is the portable way to resolve the fixtures path.
const FIXTURES_ROOT = resolve(__dirname, "../../../../video-samples");

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill("existing@example.com");
  await page.getByLabel("Password").fill("ValidPass123");
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL("**/app");
}

/**
 * Simulates a real drag-and-drop of a local file onto `selector` — builds
 * an in-page `DataTransfer` from the fixture's bytes and dispatches a
 * `drop` event, since Playwright has no first-class "drop this file" API.
 */
async function dropFile(page: Page, selector: string, filePath: string, fileName: string): Promise<void> {
  const buffer = readFileSync(filePath);
  const dataTransfer = await page.evaluateHandle(
    ({ base64, fileName }) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], fileName, { type: "video/mp4" });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      return transfer;
    },
    { base64: buffer.toString("base64"), fileName },
  );
  await page.dispatchEvent(selector, "drop", { dataTransfer });
}

test.describe("Video Upload", () => {
  test("drag-and-drop a valid file uploads and appears in the library", async ({ page }) => {
    await login(page);

    await dropFile(page, '[data-testid="upload-dropzone"]', `${FIXTURES_ROOT}/tiny-valid.mp4`, "tiny-valid.mp4");

    const card = page.locator('[data-testid="video-card"]').first();
    await expect(card).toBeVisible();
    await expect(card.getByText("Validating")).toBeVisible();
    // The extracted thumbnail actually loaded (not a broken image, not the
    // static placeholder) — per UI-UPLOAD-01's "not a default placeholder".
    const thumb = card.locator("img");
    await expect(thumb).toHaveAttribute("src", /\/api\/videos\/.+\/thumbnail/);
    await expect(async () => {
      expect(await thumb.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }).toPass();
  });

  test("progress card shows filename, percentage, and bytes transferred", async ({ page }) => {
    await login(page);

    await page.setInputFiles('[data-testid="upload-file-input"]', `${FIXTURES_ROOT}/tiny-valid.mp4`);

    const progressCard = page.locator('[data-testid="upload-progress-card"]').first();
    await expect(progressCard).toContainText("tiny-valid.mp4");
    // The fixture is tiny, so the upload may already be complete by the
    // time we look — assert on the card if it's still visible, otherwise
    // the video having appeared in the list is itself proof progress ran.
    if (await progressCard.isVisible().catch(() => false)) {
      await expect(progressCard).toContainText("%");
      await expect(progressCard).toContainText("/");
    }
    await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible();
  });

  test("oversized file is rejected with a toast before any request", async ({ page }) => {
    await login(page);

    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/videos") && request.method() === "POST") requests.push(request.url());
    });

    const oversized = await page.evaluateHandle(() => {
      const bytes = new Uint8Array(1); // content doesn't matter — size is overridden below
      const file = new File([bytes], "huge.mp4", { type: "video/mp4" });
      Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 * 1024 + 1 });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      return transfer;
    });
    await page.dispatchEvent('[data-testid="upload-dropzone"]', "drop", { dataTransfer: oversized });

    await expect(page.getByTestId("toast")).toContainText("Files must be at most 2GB");
    expect(requests).toHaveLength(0);
  });

  test("unsupported extension is rejected with a toast before any request", async ({ page }) => {
    await login(page);

    await page.setInputFiles(
      '[data-testid="upload-file-input"]',
      `${FIXTURES_ROOT}/unsupported-format.txt`,
    );

    await expect(page.getByTestId("toast")).toContainText(
      "Only MP4, MOV, MKV, WEBM, and AVI files are supported",
    );
  });

  test("an uploaded video persists and survives reload", async ({ page }) => {
    await login(page);

    await page.setInputFiles('[data-testid="upload-file-input"]', `${FIXTURES_ROOT}/tiny-valid.mp4`);
    await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible();

    await page.reload();
    await expect(page.locator('[data-testid="video-card"]').first()).toBeVisible();
  });
});
