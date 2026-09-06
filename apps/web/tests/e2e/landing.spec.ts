import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("landing page loads and links resolve", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const cta = page.getByRole("link", { name: /create account/i });
    await expect(cta).toHaveAttribute("href", "/register");

    const navLoginLink = page
      .getByRole("banner")
      .getByRole("link", { name: "Log in" });
    await expect(navLoginLink).toHaveAttribute("href", "/login");
  });

  test("authenticated visitor redirected to /app", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: "videomax_session",
        value: "test-session",
        url: baseURL,
      },
    ]);

    await page.goto("/");
    await page.waitForURL("**/app");

    expect(page.url()).toContain("/app");
  });
});
