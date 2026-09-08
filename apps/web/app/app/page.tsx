import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { VideoLibrary } from "@/components/video-library";
import { backendFetch } from "@/lib/backend-client";
import { getSessionToken } from "@/lib/session";
import type { UploadedVideo } from "@/lib/upload-client";

/**
 * Minimal placeholder authenticated landing, delivered by F02 (user
 * greeting + logout) and extended by F03 (upload drop zone + video list)
 * so each feature's own ACs are verifiable without depending on F04 (the
 * real owner of `/app`, which replaces this file wholesale). See F03
 * spec's Technical Decisions.
 */
export default async function AppPlaceholderPage() {
  const token = await getSessionToken();
  if (!token) redirect("/");

  // Neither call depends on the other's result (both only need `token`),
  // so they run concurrently — the `/videos` fetch on the failure path
  // below is simply discarded, cheaper than paying for two round trips
  // on every page load.
  const [meResponse, videosResponse] = await Promise.all([
    backendFetch("/auth/me", { method: "GET" }, token),
    backendFetch("/videos", { method: "GET" }, token),
  ]);

  // A Server Component cannot clear cookies itself (Next.js restriction),
  // so a stale/invalid token redirects through the logout Route Handler's
  // GET variant, which clears the cookie before landing on `/` — this
  // avoids a redirect loop with `/`'s own cookie-presence check.
  if (!meResponse.ok) redirect("/api/auth/logout");
  const user = (await meResponse.json()) as { name: string };

  const initialVideos: UploadedVideo[] = videosResponse.ok
    ? ((await videosResponse.json()) as { items: UploadedVideo[] }).items
    : [];

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 px-6 pt-8">
        <p className="text-lg text-ink">Welcome, {user.name}.</p>
        <LogoutButton />
      </div>
      <VideoLibrary initialVideos={initialVideos} />
    </main>
  );
}
