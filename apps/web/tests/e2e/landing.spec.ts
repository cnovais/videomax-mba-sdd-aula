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

  test("authenticated visitor redirected to /app", async ({ page }) => {
    // F01 originally simulated authentication with a synthetic cookie
    // value ("any non-empty videomax_session cookie means authenticated"
    // — a placeholder F01's own spec flagged for F02 to replace). Now
    // that F02 has landed real session issuance and `/app` validates the
    // token against the backend, a synthetic value is correctly rejected
    // and bounced back to `/` — so this test registers for real instead.
    const email = `e2e-landing-redirect-${Date.now()}@example.com`;
    const registerResponse = await page.request.post("/api/auth/register", {
      data: { name: "Redirect Check", email, password: "ValidPass123" },
    });
    expect(registerResponse.ok()).toBe(true);

    await page.goto("/");
    await page.waitForURL("**/app");

    expect(page.url()).toContain("/app");
  });
});
