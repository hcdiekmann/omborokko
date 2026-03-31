import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/utils/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const localizedPaths = [
    { path: "", priority: 1 },
    { path: "/book", priority: 0.9 }
  ];

  return localizedPaths.flatMap(({ path, priority }) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl.origin}/${locale}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority
    }))
  );
}
