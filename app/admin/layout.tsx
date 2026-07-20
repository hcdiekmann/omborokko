import Link from "next/link";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { AdminShellNav } from "@/components/admin-shell-nav";
import { LogoutButton } from "@/components/logout-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = routing.defaultLocale;
  setRequestLocale(locale);
  const messages = await getMessages();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const typedProfile = (profile ?? null) as Pick<
    Tables<"profiles">,
    "role"
  > | null;

  if (!typedProfile || typedProfile.role !== "admin") {
    redirect("/login?redirectTo=/admin");
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-stone-50">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center justify-between gap-4 lg:justify-start">
              <Link href="/admin" className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-950">Omborokko Admin</p>
                <p className="truncate text-xs text-stone-500">Campsite management</p>
              </Link>
              <div className="flex items-center gap-2 lg:hidden">
                <Link href="/en" className="text-xs font-medium text-stone-600 hover:text-stone-950">
                  Website
                </Link>
                <LogoutButton />
              </div>
            </div>

            <div className="min-w-0 flex-1 lg:flex lg:justify-center">
              <AdminShellNav />
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <Link href="/en" className="text-sm font-medium text-stone-600 transition hover:text-stone-950">
                Website
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-7">
          <div className="min-w-0 space-y-5">{children}</div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
