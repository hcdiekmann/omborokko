import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Chrome/Edge ship WebMCP behind an origin trial. Register the site at
// https://developer.chrome.com/origintrials and set the token here to enable
// it for visitors (local development can use chrome://flags instead).
const webMcpOriginTrialToken = process.env.WEBMCP_ORIGIN_TRIAL_TOKEN;

const nextConfig: NextConfig = {
  typedRoutes: true,
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
