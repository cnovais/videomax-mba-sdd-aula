import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HowItWorks } from "@/components/how-it-works";

describe("HowItWorks", () => {
  it("renders three steps in order", () => {
    const { container } = render(<HowItWorks />);
    const text = container.textContent ?? "";

    const dropIndex = text.indexOf("Drop it in");
    const transcribeIndex = text.indexOf("We transcribe");
    const readIndex = text.indexOf("You read");

    expect(dropIndex).toBeGreaterThanOrEqual(0);
    expect(transcribeIndex).toBeGreaterThan(dropIndex);
    expect(readIndex).toBeGreaterThan(transcribeIndex);
  });
});
