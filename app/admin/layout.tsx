import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

import { siteContent } from "@/lib/content/site-content";

import { AdminShellNav } from "@/components/admin-shell-nav";
import { LogoutButton } from "@/components/logout-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:gap-4 lg:py-4">
          <div className="min-w-0 flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center">
              <div className="-my-2 flex-none overflow-hidden sm:-my-3">
                <Image
                  src={siteContent.logoDarkPath}
                  alt={siteContent.brandName}
                  width={256}
                  height={362}
                  className="h-auto w-16 object-contain sm:w-20 lg:w-24"
                  sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:text-xs">
                  Omborokko Safaris
                </p>
                <p className="text-base font-semibold leading-tight text-stone-950 sm:text-lg">
                  Admin Campsite Managment
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/book"
              className="text-sm text-stone-600 transition-colors hover:text-stone-950"
            >
              Go to website
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:gap-6 lg:px-6 lg:py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-stone-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-sm lg:p-3">
          <AdminShellNav />
        </aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </main>
    </div>
  );
}
