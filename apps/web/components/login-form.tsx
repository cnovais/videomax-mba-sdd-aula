"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { vmButtonClasses } from "@/components/vm-button";

const inputClasses =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink " +
  "outline-none transition-colors focus:border-accent";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/app");
        return;
      }

      const data = (await response.json()) as { message?: string };
      // The backend never discloses whether the email or the password was
      // wrong — this generic message is forwarded verbatim by the proxy.
      setError(data.message ?? "Invalid email or password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink-2">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
        />
      </div>

      {error ? (
        <p className="text-[13px] text-err" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className={vmButtonClasses("solid", "lg")}>
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
