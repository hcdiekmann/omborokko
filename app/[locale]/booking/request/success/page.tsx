import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getLanguageAlternates } from "@/lib/seo/locales";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BookingSuccessPage" });

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
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function BookingSuccessPage({ params }: PageProps) {
  const { locale } = await params;

  redirect(`/${locale}/book`);
}
