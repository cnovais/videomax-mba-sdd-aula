import { DocIcon, MicIcon, UploadIcon } from "@/components/icons";

const STEPS = [
  {
    n: "01",
    icon: <UploadIcon />,
    heading: "Drop it in",
    description:
      "Drag a file up to 2 GB into the library. We handle the weird codecs.",
  },
  {
    n: "02",
    icon: <MicIcon />,
    heading: "We transcribe",
    description:
      "Language is detected automatically and the transcript streams in as timestamped segments you can click.",
  },
  {
    n: "03",
    icon: <DocIcon />,
    heading: "You read",
    description:
      "An AI-written overview plus key topics lands below the player. The transcript sits in a side-panel.",
  },
] as const;

/**
 * "How it works" strip: Upload → Transcribe → Summarize, one column
 * per step. Matches docs/design/design-system-pages/components/landing.jsx.
 */
export function HowItWorks() {
  return (
    <section className="px-6 pb-12 pt-4 sm:px-12">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="flex flex-col gap-2.5 bg-surface p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.06em] text-accent">
                STEP {step.n}
              </span>
              <span className="text-muted">{step.icon}</span>
            </div>
            <div className="text-lg font-semibold tracking-[-0.02em] text-ink">
              {step.heading}
            </div>
            <p className="text-[13px] leading-relaxed text-ink-2">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
