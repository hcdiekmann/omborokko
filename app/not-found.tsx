import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { NotFoundView } from "@/components/not-found-view";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "NotFound" });
  return { title: t("metaTitle") };
}

// Fallback for paths outside the locale routes (e.g. unknown /admin pages).
export default async function RootNotFound() {
  const messages = await getMessages({ locale: routing.defaultLocale });

  return (
    <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
      <NotFoundView />
    </NextIntlClientProvider>
  );
}
