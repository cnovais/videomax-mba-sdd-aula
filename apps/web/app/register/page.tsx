import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { VMWordmark } from "@/components/vm-wordmark";
import { hasActiveSession } from "@/lib/session";

export default async function RegisterPage() {
  if (await hasActiveSession()) {
    redirect("/app");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="videomax home">
            <VMWordmark size={20} />
          </Link>
        </div>

        <h1 className="mb-1 text-center text-2xl font-semibold text-ink">Create your account</h1>
        <p className="mb-8 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>

        <RegisterForm />
      </div>
    </main>
  );
}
