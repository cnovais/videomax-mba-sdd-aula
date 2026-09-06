"use client";

import { useState } from "react";
import { PlayIcon, SearchIcon } from "@/components/icons";
import { VMBadge } from "@/components/vm-badge";

/**
 * Decorative interactive preview inside the hero — a miniature mock of
 * the video player + transcription panel (F08), used purely as a
 * marketing illustration. No contract item covers this panel; it does
 * not represent real product data.
 * Matches docs/design/design-system-pages/components/landing.jsx.
 */
const SEGMENTS = [
  {
    time: "00:00",
    text: "So the first thing we do is drop the video straight into the browser.",
  },
  {
    time: "00:12",
    text: "No sign-up gates, no clip length limits — just the raw file.",
  },
  {
    time: "00:28",
    text: "A couple seconds in, the pipeline picks it up and starts transcribing.",
  },
  {
    time: "00:47",
    text: "You can actually watch the segments stream in, word by word.",
  },
  {
    time: "01:09",
    text: "Then the summary lands at the bottom with the key topics pulled out.",
  },
];

export function HeroDemo() {
  const [active, setActive] = useState(2);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-vm-lg)]">
      {/* chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-panel px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="ml-2 font-mono text-[11px] text-muted">
          videomax.app/demo
        </span>
        <div className="flex-1" />
        <VMBadge tone="ok" dot>
          Ready · EN
        </VMBadge>
      </div>

      <div className="grid grid-cols-[1.3fr_1fr]">
        {/* player */}
        <div className="border-r border-line p-3.5">
          <div
            className="relative aspect-video overflow-hidden rounded"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.32 0.02 35) 0%, oklch(0.18 0.03 65) 100%)",
            }}
          >
            <div className="absolute left-2 top-2 font-mono text-[10px] tracking-wide text-white/70">
              INTERVIEW · TAKE 02
            </div>
            <div className="absolute bottom-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[10px] text-white">
              14:28
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
                <PlayIcon />
              </div>
            </div>
          </div>
          <div className="mt-3.5 rounded-md border border-line bg-sunken p-3">
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              Summary · overview
            </div>
            <div className="text-xs leading-relaxed text-ink-2">
              A walk-through of the first-upload flow, from drop-zone to
              ready-to-read transcript. Covers file limits, the
              pipeline&apos;s three stages, and how the summary block is
              assembled.
            </div>
          </div>
        </div>

        {/* transcription */}
        <div className="py-2.5 pl-2.5 pr-1">
          <div className="flex items-center gap-1.5 px-2 pb-2">
            <SearchIcon className="text-muted" />
            <span className="text-xs text-faint">Search transcript…</span>
          </div>
          <div className="flex flex-col">
            {SEGMENTS.map((segment, i) => {
              const isActive = i === active;
              return (
                <button
                  key={segment.time}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`grid grid-cols-[48px_1fr] gap-2.5 rounded px-2.5 py-2 text-left ${
                    isActive
                      ? "border-l-2 border-accent bg-accent-lo"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] ${isActive ? "text-accent-ink" : "text-muted"}`}
                  >
                    {segment.time}
                  </span>
                  <span
                    className={`text-[12.5px] leading-relaxed ${isActive ? "text-ink" : "text-ink-2"}`}
                  >
                    {segment.text}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2 px-2.5 py-2 font-mono text-[10px] text-muted">
            <span className="text-accent">▸</span>
            CLICK A SEGMENT → VIDEO JUMPS
          </div>
        </div>
      </div>
    </div>
  );
}
