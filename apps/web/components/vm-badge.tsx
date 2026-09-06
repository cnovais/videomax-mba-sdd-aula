import type { ReactNode } from "react";

/**
 * Small status/meta pill. Matches
 * docs/design/design-system-pages/components/ui.jsx (VMBadge).
 */
export type VMBadgeTone = "neutral" | "accent" | "ok";

const toneClasses: Record<VMBadgeTone, string> = {
  neutral: "bg-sunken text-ink-2 border-line",
  accent: "bg-accent-lo text-accent-ink border-transparent",
  ok: "bg-ok-bg text-ok border-transparent",
};

export function VMBadge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: VMBadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-5 items-center gap-1.5 rounded border px-1.5 text-[11px] font-medium leading-none ${toneClasses[tone]}`}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}
