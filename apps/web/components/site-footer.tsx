import { VMWordmark } from "@/components/vm-wordmark";

/**
 * Slim footer bar — wordmark + copyright on the left, legal links and a
 * status indicator on the right. Matches
 * docs/design/design-system-pages/components/footer.jsx (VMFooter).
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-3.5 font-mono text-[11.5px] tracking-[0.02em] text-muted">
      <div className="flex items-center gap-3.5">
        <VMWordmark size={12} />
        <span className="text-faint">© 2026</span>
      </div>
      <div className="flex items-center gap-4.5">
        <span>Privacy</span>
        <span>Terms</span>
        <span>Contact</span>
        <span className="inline-flex items-center gap-1.5 border-l border-line pl-3.5 text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          All systems operational
        </span>
      </div>
    </footer>
  );
}
