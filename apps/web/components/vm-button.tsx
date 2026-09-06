/**
 * Button styling shared across nav/hero CTAs.
 * Matches docs/design/design-system-pages/components/ui.jsx (VMButton).
 * Exposed as a className builder (not a component) so both real
 * `<Link>` anchors and `<button>` elements can share the same look —
 * navigation CTAs must render as real anchors for correct href behavior.
 */
export type VMButtonVariant = "solid" | "outline";
export type VMButtonSize = "md" | "lg";

const sizeClasses: Record<VMButtonSize, string> = {
  md: "h-8 gap-1.5 px-3 text-[13px]",
  lg: "h-10 gap-2 px-4 text-sm",
};

const variantClasses: Record<VMButtonVariant, string> = {
  solid:
    "border border-accent-hi bg-accent text-white shadow-[var(--shadow-vm-sm)] hover:bg-accent-hi",
  outline: "border border-line-strong bg-surface text-ink hover:bg-sunken",
};

export function vmButtonClasses(
  variant: VMButtonVariant = "solid",
  size: VMButtonSize = "md",
) {
  return [
    "inline-flex items-center justify-center rounded-md font-medium tracking-[-0.005em]",
    "whitespace-nowrap transition-colors duration-150",
    sizeClasses[size],
    variantClasses[variant],
  ].join(" ");
}
