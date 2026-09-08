/**
 * Transient validation-error message for F03's own two client-side reject
 * cases (oversized file, unsupported extension). F11 (In-App Processing
 * Notifications, a later feature) owns the persistent bottom-right panel
 * for in-flight processing status — a distinct concern from this instant
 * pre-transfer feedback. See spec's Technical Decisions.
 */
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink shadow-[var(--shadow-vm-md)]"
      data-testid="toast"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-ink-2 transition-colors hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
