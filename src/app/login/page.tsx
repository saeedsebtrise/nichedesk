import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { Wordmark } from "@/components/shared/Wordmark";
import { appPassword, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  // Nothing to log in to when the lock is off.
  if (!appPassword()) redirect(next);

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-cream-200 bg-white/90 p-8 shadow-xl">
        <Wordmark />
        <h1 className="font-display mt-8 text-2xl font-extrabold tracking-tight text-ink-900">
          Log in to your desk
        </h1>
        <p className="mt-1 text-sm text-ink-700">This NicheDesk is password protected.</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
