import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/site-header";

describe("SiteHeader", () => {
  it("renders logo and login link", () => {
    render(<SiteHeader />);
    expect(
      screen.getByRole("link", { name: "videomax home" }),
    ).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: /log in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
