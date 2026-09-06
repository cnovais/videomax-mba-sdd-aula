import Link from "next/link";
import { VMWordmark } from "@/components/vm-wordmark";

/**
 * Top navigation bar: product logo on the left, "Log in" link on the
 * right. Matches docs/design/design-system-pages/components/landing.jsx
 * header, minus the header's duplicate "Create account" button (kept
 * only once, in the hero) so the CTA has a single unambiguous target.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-line px-12 py-[18px]">
      <Link href="/" aria-label="videomax home">
        <VMWordmark size={18} />
      </Link>
      <nav className="flex items-center gap-4 text-[13px] text-ink-2">
        <Link href="/login" className="hover:text-ink">
          Log in
        </Link>
      </nav>
    </header>
  );
}
