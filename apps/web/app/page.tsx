import { redirect } from "next/navigation";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hasActiveSession } from "@/lib/session";

/**
 * Public landing page at `/`. Redirects already-authenticated visitors
 * to `/app`; otherwise renders the marketing content.
 */
export default async function LandingPage() {
  if (await hasActiveSession()) {
    redirect("/app");
  }

  return (
    <>
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <SiteFooter />
    </>
  );
}
