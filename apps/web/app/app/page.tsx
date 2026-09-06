import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { backendFetch } from "@/lib/backend-client";
import { getSessionToken } from "@/lib/session";

/**
 * Minimal placeholder authenticated landing, delivered by F02 only so its
 * own "logout redirects to /" and "login/registration redirect to /app"
 * ACs are verifiable without depending on F04 (the real owner of `/app`,
 * which replaces this file wholesale). See spec's Technical Decisions.
 */
export default async function AppPlaceholderPage() {
  const token = await getSessionToken();
  if (!token) redirect("/");

  const response = await backendFetch("/auth/me", { method: "GET" }, token);
  // A Server Component cannot clear cookies itself (Next.js restriction),
  // so a stale/invalid token redirects through the logout Route Handler's
  // GET variant, which clears the cookie before landing on `/` — this
  // avoids a redirect loop with `/`'s own cookie-presence check.
  if (!response.ok) redirect("/api/auth/logout");

  const user = (await response.json()) as { name: string };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <p className="text-lg text-ink">Welcome, {user.name}.</p>
      <LogoutButton />
    </main>
  );
}
