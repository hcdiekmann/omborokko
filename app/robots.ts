import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/utils/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/login", "/api", "/booking/request/success"],
      },
    ],
    sitemap: `${siteUrl.origin}/sitemap.xml`,
  };
}
