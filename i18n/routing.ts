import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "fr", "af", "es", "it"],
  defaultLocale: "en",
  localePrefix: "always"
});

export type AppLocale = (typeof routing.locales)[number];
