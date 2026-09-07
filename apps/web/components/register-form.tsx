"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { vmButtonClasses } from "@/components/vm-button";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

const PASSWORD_RULE_MESSAGES: Record<string, string> = {
  too_short: "Password must be at least 8 characters",
  missing_letter: "Password must contain at least one letter",
  missing_number: "Password must contain at least one number",
};

const inputClasses =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink " +
  "outline-none transition-colors focus:border-accent";

function fieldMessage(errors: FieldErrors, field: keyof FieldErrors): React.ReactNode {
  const message = errors[field];
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[13px] text-err" role="alert">
      {message}
    </p>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        router.push("/app");
        return;
      }

      const data = (await response.json()) as {
        code?: string;
        message?: string;
        details?: { reasons?: string[] };
      };
      setErrors(mapErrorToFields(data));
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-ink-2">
          Full name
        </label>
        <input id="name" name="name" type="text" autoComplete="name" required className={inputClasses} />
        {fieldMessage(errors, "name")}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink-2">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} />
        {fieldMessage(errors, "email")}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={inputClasses}
        />
        {fieldMessage(errors, "password")}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-medium text-ink-2">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClasses}
        />
        {fieldMessage(errors, "confirmPassword")}
      </div>

      {errors.form ? (
        <p className="text-[13px] text-err" role="alert">
          {errors.form}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className={vmButtonClasses("solid", "lg")}>
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function mapErrorToFields(data: {
  code?: string;
  message?: string;
  details?: { reasons?: string[] };
}): FieldErrors {
  if (data.code === "WEAK_PASSWORD") {
    const reasons = data.details?.reasons ?? [];
    const messages = reasons.map((reason) => PASSWORD_RULE_MESSAGES[reason] ?? reason);
    return { password: messages.join(". ") || "Password is too weak" };
  }

  if (data.code === "USER_ALREADY_EXISTS") {
    return { email: "An account with this email already exists — try logging in" };
  }

  if (data.code === "INVALID_EMAIL") {
    return { email: "Please enter a valid email address" };
  }

  return { form: data.message ?? "Something went wrong. Please try again." };
}
