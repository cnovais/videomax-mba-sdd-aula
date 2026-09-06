import Link from "next/link";
import { HeroDemo } from "@/components/hero-demo";
import { SparkleIcon, UploadIcon } from "@/components/icons";
import { vmButtonClasses } from "@/components/vm-button";

/**
 * Hero section: eyebrow badge, headline, supporting paragraph, and the
 * primary "Create account" call-to-action.
 * Matches docs/design/design-system-pages/components/landing.jsx.
 */
export function Hero() {
  return (
    <section className="grid grid-cols-1 items-center gap-14 px-6 pb-8 pt-16 sm:px-12 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-accent-lo py-[5px] pl-1.5 pr-2.5 text-[11px] font-medium text-accent-ink">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-white">
            <SparkleIcon />
          </span>
          Automatic transcription · searchable library
        </div>

        <h1 className="my-5 text-[56px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink text-balance sm:text-[68px]">
          Upload a video.
          <br />
          <span className="text-muted">Read it in </span>
          <span className="text-accent">three minutes</span>
          <span className="text-muted">.</span>
        </h1>

        <p className="max-w-[520px] text-[17px] leading-relaxed text-ink-2">
          Videomax turns hours of lectures, interviews, and raw footage into
          timestamped transcripts and clean summaries you can actually
          search. Drop in a file, walk away, come back to something you can
          read.
        </p>

        <div className="mt-7 flex gap-2.5">
          <Link
            href="/register"
            className={vmButtonClasses("solid", "lg")}
            data-testid="hero-cta"
          >
            <UploadIcon />
            Create account
          </Link>
          <Link href="/login" className={vmButtonClasses("outline", "lg")}>
            Log in
          </Link>
        </div>
      </div>

      <HeroDemo />
    </section>
  );
}
