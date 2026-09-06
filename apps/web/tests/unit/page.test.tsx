import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

const { default: LandingPage } = await import("@/app/page");

describe("LandingPage", () => {
  beforeEach(() => {
    redirect.mockReset();
  });

  it("renders landing sections when unauthenticated", async () => {
    cookies.mockResolvedValue({ get: () => undefined });

    const jsx = await LandingPage();
    render(jsx);

    expect(
      screen.getByRole("link", { name: "videomax home" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Drop it in")).toBeInTheDocument();
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects when authenticated", async () => {
    cookies.mockResolvedValue({
      get: () => ({ name: "videomax_session", value: "abc" }),
    });
    redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(LandingPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/app");
  });
});
