import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/hero";

describe("Hero", () => {
  it("renders hero copy and CTA", () => {
    render(<Hero />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Upload a video.");
    expect(heading.textContent).toContain("three minutes");

    expect(
      screen.getByText(/timestamped transcripts and clean summaries/i),
    ).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /create account/i });
    expect(cta).toHaveAttribute("href", "/register");
  });
});
