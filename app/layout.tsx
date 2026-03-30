import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { Providers } from "@/app/providers";
import { getSiteUrl } from "@/lib/utils/site-url";
import "@/app/globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Omborokko Safaris",
    template: "%s | Omborokko Safaris",
  },
  applicationName: "Omborokko Safaris",
  description:
    "Book a remote bush campsite stay at Omborokko Safaris in Namibia, with warm showers, flush toilets, and wide open mountain views.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Omborokko Safaris",
    title: "Omborokko Safaris",
    description:
      "Remote bush camping in Namibia with essential comforts, mountain views, and a simple request-and-confirm booking flow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omborokko Safaris",
    description:
      "Remote bush camping in Namibia with essential comforts, mountain views, and a simple request-and-confirm booking flow.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="relative isolate min-h-screen overflow-x-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 -top-20 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-48"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%+4rem)] aspect-[1155/678] w-[46rem] -translate-x-1/2 rotate-[14deg] bg-gradient-to-tr from-[#8EAD56] via-[#C68A38] to-[#7B4D2D] opacity-20 sm:left-[calc(50%+14rem)] sm:w-[88rem]"
            />
          </div>
          <Providers>{children}</Providers>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
