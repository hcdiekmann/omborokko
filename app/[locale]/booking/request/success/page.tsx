import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Link } from "@/i18n/navigation";
import { getLanguageAlternates } from "@/lib/seo/locales";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reference?: string }>;
};

export async function generateMetadata({
  params
}: Pick<PageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BookingSuccessPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/booking/request/success`,
      languages: {
        ...getLanguageAlternates("/booking/request/success"),
        "x-default": "/en/booking/request/success"
      }
    },
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function BookingSuccessPage({
  params,
  searchParams
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { reference } = await searchParams;
  const t = await getTranslations({ locale, namespace: "BookingSuccessPage" });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex-1 max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {t("title")}
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-700">
            {t("referencePrefix")}
            <span className="font-bold">{reference ? ` ${reference} ` : ""}</span>
          </p>
          <p className="mt-1">{t("body")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/book"
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
            >
              {t("backToBooking")}
            </Link>
            <Link
              href="/"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
            >
              {t("returnHome")}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
