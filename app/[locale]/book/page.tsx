import type { Metadata } from "next";
import { TentTree } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BookingRequestForm } from "@/components/booking-request-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCampsiteTemplate } from "@/features/bookings/server/service";
import { getLanguageAlternates } from "@/lib/seo/locales";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BookPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/book`,
      languages: {
        ...getLanguageAlternates("/book"),
        "x-default": "/en/book"
      }
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `/${locale}/book`
    }
  };
}

export default async function BookPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "BookPage" });
  const homeT = await getTranslations({ locale, namespace: "HomePage" });
  const templateUnit = await getPublicCampsiteTemplate();
  const bookingNotes = [
    homeT("notes.maxGuests"),
    homeT("notes.fourByFour"),
    homeT("notes.noPower")
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex-1 max-w-6xl space-y-6 px-4 py-5 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h1 className="hero-title text-3xl font-semibold tracking-tight text-stone-950">
              {t("title")}
            </h1>

            <div className="border-t border-stone-200">
              <ul className="mt-5 space-y-3">
                {bookingNotes.map((item) => (
                  <li key={item} className="text-sm leading-6 text-stone-700">
                    <span className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 flex-none rounded-full bg-amber-300" />
                      <span>{item}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              role="note"
              className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <TentTree className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">
                  {t("safariNoticeTitle")}
                </p>
                <p className="text-sm leading-6 text-amber-900/80">
                  {t("safariNoticeBody")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-stone-700">
              <span className="rounded-full bg-stone-100 px-3 py-1">
                {t("adultLabel")}: N$ {templateUnit.base_price_per_night} {t("perNight")}
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1">
                {t("childLabel")}: N$ {templateUnit.child_price_per_night} {t("perNight")}
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1">
                {t("noCleaningFees")}
              </span>
            </div>
          </div>

          <div>
            <BookingRequestForm maxGuestsPerCampsite={templateUnit.max_guests} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
