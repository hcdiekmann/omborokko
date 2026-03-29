import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function BookLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="h-[340px] animate-pulse rounded-[2rem] bg-stone-200" />
            <div className="hidden gap-4 sm:grid sm:grid-cols-3">
              <div className="h-28 animate-pulse rounded-2xl bg-stone-200 sm:h-32" />
              <div className="h-28 animate-pulse rounded-2xl bg-stone-200 sm:h-32" />
              <div className="h-28 animate-pulse rounded-2xl bg-stone-200 sm:h-32" />
            </div>
          </div>
          <div className="space-y-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-32 animate-pulse rounded-full bg-stone-200" />
            <div className="h-10 w-64 animate-pulse rounded-full bg-stone-200" />
            <div className="space-y-3 border-t border-stone-200 pt-5">
              <div className="h-4 w-full animate-pulse rounded-full bg-stone-200" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-stone-200" />
              <div className="h-4 w-4/6 animate-pulse rounded-full bg-stone-200" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-36 animate-pulse rounded-full bg-stone-200" />
              <div className="h-8 w-36 animate-pulse rounded-full bg-stone-200" />
              <div className="h-8 w-28 animate-pulse rounded-full bg-stone-200" />
            </div>
          </div>
        </section>
        <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="h-6 w-52 animate-pulse rounded-full bg-stone-200" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200 sm:col-span-2" />
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-stone-200 sm:col-span-2" />
            <div className="h-11 animate-pulse rounded-2xl bg-stone-200 sm:col-span-2" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
