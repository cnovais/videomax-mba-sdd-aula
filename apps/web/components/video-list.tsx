import type { UploadedVideo } from "@/lib/upload-client";
import { formatBytes } from "@/lib/format-bytes";
import { VMBadge, type VMBadgeTone } from "@/components/vm-badge";

const STATUS_META: Record<string, { label: string; tone: VMBadgeTone }> = {
  validating: { label: "Validating", tone: "info" },
  transcribing: { label: "Transcribing", tone: "warn" },
  summarizing: { label: "Summarizing", tone: "accent" },
  ready: { label: "Ready", tone: "ok" },
  failed: { label: "Failed", tone: "err" },
};

/**
 * The backend returns `thumbnailUrl` as a backend-relative path (e.g.
 * `/videos/{id}/thumbnail`) — it has no notion of this app's `/api` proxy
 * prefix. Only `apps/web/app/api/videos/[id]/thumbnail/route.ts` is
 * actually registered as a Next.js route, so every rendered `<img>` must
 * go through that prefix.
 */
function thumbnailSrc(thumbnailUrl: string | null): string {
  return thumbnailUrl ? `/api${thumbnailUrl}` : "/video-placeholder.svg";
}

/**
 * Minimal placeholder library grid — this feature's own deliverable so
 * its "video appears in the library" ACs are verifiable ahead of F04
 * (the real Video Library, which replaces this with sort/filter/rename/
 * delete). See spec's Technical Decisions.
 */
export function VideoList({ videos }: { videos: UploadedVideo[] }) {
  if (videos.length === 0) {
    return (
      <p className="text-sm text-ink-2" data-testid="video-list-empty">
        Upload your first video to get started.
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      data-testid="video-list"
    >
      {videos.map((video) => {
        const status = STATUS_META[video.status] ?? { label: video.status, tone: "neutral" as VMBadgeTone };
        return (
          <div
            key={video.id}
            className="overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-vm-sm)]"
            data-testid="video-card"
            data-video-id={video.id}
          >
            <div className="relative aspect-video bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamically generated, not a static asset */}
              <img
                src={thumbnailSrc(video.thumbnailUrl)}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute left-2 top-2">
                <VMBadge tone={status.tone}>{status.label}</VMBadge>
              </div>
            </div>
            <div className="p-2">
              <p className="truncate text-sm font-medium text-ink">{video.title}</p>
              <p className="text-xs text-ink-2">{formatBytes(video.sizeBytes)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
