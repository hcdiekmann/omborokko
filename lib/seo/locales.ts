import { routing } from "@/i18n/routing";

export function getLanguageAlternates(pathname = "") {
  const normalizedPath = pathname ? `/${pathname.replace(/^\/+/, "")}` : "";

  return Object.fromEntries(
    routing.locales.map((locale) => [locale, `/${locale}${normalizedPath}`])
  );
}
