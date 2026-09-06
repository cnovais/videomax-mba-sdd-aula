/**
 * Videomax logo mark + wordmark.
 * Matches docs/design/design-system-pages/components/tokens.jsx
 * (VMMark + VMWordmark) — play triangle in a rounded square, with a
 * "transcription segment" line cutting across.
 */
export function VMMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="block shrink-0"
    >
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="4.5"
        stroke="currentColor"
        strokeWidth={1.75}
      />
      <path d="M9 8.2 L16.5 12 L9 15.8 Z" fill="currentColor" />
      <line
        x1="2.5"
        y1="17.5"
        x2="21.5"
        y2="17.5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function VMWordmark({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center text-ink"
      style={{ gap: size * 0.42 }}
    >
      <span className="text-accent">
        <VMMark size={size * 1.15} />
      </span>
      <span
        className="font-semibold leading-none tracking-[-0.02em]"
        style={{ fontSize: size }}
      >
        videomax<span className="text-accent">.</span>
      </span>
    </span>
  );
}
