"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { vmButtonClasses } from "@/components/vm-button";

/**
 * Posts to `/api/auth/logout` and navigates to `/` regardless of the
 * proxy's response — logout must always appear to succeed from the
 * user's perspective (the proxy itself is tolerant of an absent/invalid
 * session and always clears the cookie).
 */
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={vmButtonClasses("outline", "md")}
    >
      Log out
    </button>
  );
}
