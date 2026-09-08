import type { UploadProgress } from "@/lib/upload-client";
import { formatBytes } from "@/lib/format-bytes";

/** Filename, percentage, and bytes-transferred/total — per PRD's Experience. */
export function UploadProgressCard({ progress }: { progress: UploadProgress }) {
  const percentage = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;

  return (
    <div
      className="rounded-md border border-line bg-surface p-3 text-sm shadow-[var(--shadow-vm-sm)]"
      data-testid="upload-progress-card"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-ink">{progress.file.name}</span>
        <span className="shrink-0 text-ink-2">
          {progress.state === "queued" ? "Queued" : `${percentage}%`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-ink-2">
        {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
      </div>
      {progress.state === "error" && progress.errorMessage ? (
        <p className="mt-1 text-xs text-err">{progress.errorMessage}</p>
      ) : null}
    </div>
  );
}
