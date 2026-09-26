import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NotFoundView } from "@/components/not-found-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");
  return { title: t("metaTitle") };
}

export default function LocaleNotFound() {
  return <NotFoundView />;
}
