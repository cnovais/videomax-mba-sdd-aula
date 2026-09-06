import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { RegisterForm } = await import("@/components/register-form");

function fillForm(
  name: string,
  email: string,
  password: string,
  confirmPassword = password,
) {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: confirmPassword },
  });
}

describe("RegisterForm", () => {
  beforeEach(() => {
    push.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("navigates to /app on successful registration", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { name: "New User" } }),
    } as Response);

    render(<RegisterForm />);
    fillForm("New User", "newuser@example.com", "ValidPass123");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/app"));
  });

  it("shows an inline message naming the missing-number rule for a weak password", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        code: "WEAK_PASSWORD",
        message: "Password too weak: missing_number",
        details: { reasons: ["missing_number"] },
      }),
    } as Response);

    render(<RegisterForm />);
    fillForm("Weak Pass", "weakpass@example.com", "OnlyLetters");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/at least one number/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a clear inline error for a duplicate email", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        code: "USER_ALREADY_EXISTS",
        message: "User already exists: existing@example.com",
      }),
    } as Response);

    render(<RegisterForm />);
    fillForm("Someone Else", "existing@example.com", "ValidPass123");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects mismatched password confirmation client-side", async () => {
    render(<RegisterForm />);
    fillForm("Someone", "someone@example.com", "ValidPass123", "Different123");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
