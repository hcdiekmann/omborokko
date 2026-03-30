const LOCAL_FALLBACK_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  return new URL(
    configuredUrl ? normalizeSiteUrl(configuredUrl) : LOCAL_FALLBACK_URL,
  );
}
