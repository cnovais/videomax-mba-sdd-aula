import { expect, test } from "@playwright/test";

const BACKEND_URL = "http://localhost:4000";
const SESSION_COOKIE_NAME = "videomax_session";

test.describe("Authentication", () => {
  test("register -> auto-login -> /app, session persists across reload", async ({ page, context }) => {
    const email = `e2e-newuser-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E New User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("ValidPass123");
    await page.getByLabel("Confirm password").fill("ValidPass123");
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL("**/app");
    expect(page.url()).toContain("/app");
    await expect(page.getByText("E2E New User", { exact: false })).toBeVisible();

    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === SESSION_COOKIE_NAME)).toBe(true);

    await page.reload();
    await expect(page.getByText("E2E New User", { exact: false })).toBeVisible();
  });

  test("login with valid credentials redirects to /app and persists across reload", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("existing@example.com");
    await page.getByLabel("Password").fill("ValidPass123");
    await page.getByRole("button", { name: /log in/i }).click();

    await page.waitForURL("**/app");
    expect(page.url()).toContain("/app");
    await expect(page.getByText("Existing User", { exact: false })).toBeVisible();

    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === SESSION_COOKIE_NAME)).toBe(true);

    await page.reload();
    await expect(page.getByText("Existing User", { exact: false })).toBeVisible();
  });

  test("login with wrong password shows a generic error and stays on /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("existing@example.com");
    await page.getByLabel("Password").fill("WrongPass999");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    expect(page.url()).toContain("/login");
  });

  test("logout redirects to / and invalidates the session at the database level", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("existing@example.com");
    await page.getByLabel("Password").fill("ValidPass123");
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL("**/app");

    const cookiesBefore = await context.cookies();
    const sessionCookie = cookiesBefore.find((cookie) => cookie.name === SESSION_COOKIE_NAME);
    expect(sessionCookie).toBeDefined();
    const rawToken = sessionCookie?.value as string;

    await page.getByRole("button", { name: /log out/i }).click();
    await page.waitForURL("**/");
    expect(page.url()).not.toContain("/app");

    const cookiesAfter = await context.cookies();
    expect(cookiesAfter.some((cookie) => cookie.name === SESSION_COOKIE_NAME)).toBe(false);

    // The session row backing that cookie's token no longer exists in the
    // database: a direct call to the backend with the captured raw token
    // now resolves to 401 (verified against the real backend + real DB,
    // not a mock — see E2E-LOGOUT-01).
    const response = await page.request.get(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    expect(response.status()).toBe(401);
  });
});
