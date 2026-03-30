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
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center">
              <div className="-my-3 flex-none overflow-hidden sm:-my-4">
                <Image
                  src={siteContent.logoDarkPath}
                  alt={siteContent.brandName}
                  width={256}
                  height={362}
                  className="h-auto w-24 object-contain sm:w-28"
                  sizes="(max-width: 640px) 96px, 112px"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Omborokko Safaris
                </p>
                <p className="text-lg font-semibold text-stone-950">
                  Admin Campsite Managment
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr] sm:px-6">
        <aside className="h-fit rounded-3xl border border-stone-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
          <div className="pt-3">
            <AdminShellNav />
          </div>
        </aside>
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
