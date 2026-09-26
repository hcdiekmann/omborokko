import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Chrome/Edge ship WebMCP behind an origin trial. Register the site at
// https://developer.chrome.com/origintrials and set the token here to enable
// it for visitors (local development can use chrome://flags instead).
const webMcpOriginTrialToken = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN;

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    // AVIF is typically 20-40% smaller than WebP, which matters on slow Namibian connections.
    formats: ["image/avif", "image/webp"],
    // Up to 2560px so full-width photos stay sharp on retina laptops.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
    // Next encodes AVIF 20 points below this value, so 80 keeps visible detail.
    qualities: [75, 80],
    minimumCacheTTL: 60 * 60 * 24 * 31
  },
  async headers() {
    if (!webMcpOriginTrialToken) return [];

    return [
      {
        source: "/:path*",
        headers: [{ key: "Origin-Trial", value: webMcpOriginTrialToken }]
      }
    ];
  }
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
