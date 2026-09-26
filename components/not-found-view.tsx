import { useTranslations } from "next-intl";
import { ArrowRight, Compass } from "lucide-react";

import { MountainRidge } from "@/components/mountain-ridge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Link } from "@/i18n/navigation";

export function NotFoundView() {
  const t = useTranslations("NotFound");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-14 sm:px-6">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-stone-200 bg-white px-6 pb-24 pt-12 text-center shadow-sm sm:px-12 sm:pb-28 sm:pt-16">
          <MountainRidge className="h-24 sm:h-32" />
          <div className="relative mx-auto max-w-xl space-y-5">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Compass className="h-7 w-7" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              {t("eyebrow")}
            </p>
            <h1 className="hero-title text-4xl text-stone-950 sm:text-5xl">
              {t("title")}
            </h1>
            <p className="text-base leading-7 text-stone-600">{t("body")}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-900/30 ring-1 ring-inset ring-white/20 transition duration-200 hover:-translate-y-0.5 hover:from-amber-500 hover:to-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {t("home")}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3.5 text-sm font-semibold text-stone-900 transition duration-200 hover:-translate-y-0.5 hover:border-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              >
                {t("book")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
