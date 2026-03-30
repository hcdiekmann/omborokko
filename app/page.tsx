import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  ShowerHead,
  Flame,
  Mountain,
  Star,
  TentTree,
  Trees,
} from "lucide-react";

import { AvailabilityChecker } from "@/components/availability-checker";
import { HomeGalleryCarousel } from "@/components/home-gallery-carousel";
import { SectionTitle } from "@/components/section-title";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteContent } from "@/lib/content/site-content";
import { getSiteUrl } from "@/lib/utils/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Remote Bush Camping in Namibia",
  description:
    "Discover Omborokko Safaris, a remote Namibian bush campsite with mountain views, warm showers, flush toilets, and easy online booking requests.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Remote Bush Camping in Namibia",
    description:
      "Discover Omborokko Safaris, a remote Namibian bush campsite with mountain views, warm showers, flush toilets, and easy online booking requests.",
    url: siteUrl,
  },
};

export default async function HomePage() {
  const lodgingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Campground",
    name: "Omborokko Safaris",
    description:
      "Remote bush camping in Namibia with warm showers, flush toilets, drinking water, and mountain views.",
    url: siteUrl.toString(),
    image: `${siteUrl.origin}/images/campsite/mountains.webp`,
    telephone: "",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NA",
    },
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "Warm water showers",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Flush toilets",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Swimming pool",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Fresh drinking water",
        value: true,
      },
    ],
    sameAs: ["https://g.page/r/CX5GoEWHNEH8EBM/review"],
  };

  const highlights = [
    {
      icon: ShowerHead,
      title: "Well-kept essentials",
      text: "Warm showers, flush toilets, drinking water, and a pool nearby.",
    },
    {
      icon: Trees,
      title: "Quiet bush setting",
      text: "Seasonal riverbeds, mountain views, and evenings that settle into total stillness.",
    },
    {
      icon: Flame,
      title: "Authentic camping",
      text: "Firepit cooking, starlit dinners, and a simple base for a proper bush stay.",
    },
    {
      icon: Compass,
      title: "Made for overlanders",
      text: "Four matching campsites, cash onsite, and a clear request-and-confirm booking flow.",
    },
  ];

  const testimonials = [
    {
      quote:
        "A beautiful place integrated into nature, well equipped, and far from any buildings.",
      author: "k g.",
      detail: "Google review",
    },
    {
      quote:
        "The facilities were immaculate, very well thought out, peaceful, and secluded.",
      author: "Laura B.",
      detail: "Google review",
    },
    {
      quote:
        "A fabulous wild campsite beside a dry river bed with spotlessly clean facilities and lovely owners.",
      author: "Oonagh",
      detail: "Google review",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(lodgingJsonLd),
          }}
        />
        <section className="relative overflow-hidden border-b border-stone-200">
          <div className="absolute inset-0">
            <Image
              src="/images/campsite/mountains.webp"
              alt="Omborokko campsite"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,24,39,0.88),rgba(68,48,34,0.62),rgba(17,24,39,0.7))]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="max-w-3xl space-y-6 sm:space-y-2  text-white">
                <div className="inline-flex items-center gap-3 rounded-[2rem] border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                  <TentTree className="h-4 w-4 flex-none text-amber-100" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                    Authentic bush camping
                  </p>
                </div>
                <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl">
                  {siteContent.heroTitle}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-100 sm:text-lg">
                  {siteContent.heroBody}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/book"
                    prefetch
                    className="rounded-full bg-amber-700 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-amber-950/20 transition hover:bg-amber-600"
                  >
                    Book Now
                  </Link>
                  <Link
                    href="#availability"
                    className="rounded-full border border-white/20 bg-black/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-black/30"
                  >
                    Check Availability
                  </Link>
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white backdrop-blur-md">
                <p className="ml-2 text-sm font-semibold uppercase tracking-[0.22em] text-amber-100">
                  Bookings on request
                </p>
                <div id="rates" className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-sm text-amber-100">
                      {siteContent.pricing.adultLabel}
                    </p>
                    <p className="text-2xl md:text-3xl md:mt-2 font-semibold">
                      N$ {siteContent.pricing.adultRate}
                    </p>
                    <p className="text-xs md:mt-2 text-stone-200">
                      Per person, per night
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-sm text-amber-100">
                      {siteContent.pricing.childLabel}
                    </p>
                    <p className="text-2xl md:text-3xl md:mt-2 font-semibold">
                      N$ {siteContent.pricing.childRate}
                    </p>
                    <p className="text-xs md:mt-2 text-stone-200">
                      Per person, per night
                    </p>
                  </div>
                </div>
                {/*<div className="mt-4 flex items-start gap-3 rounded-3xl bg-stone-950/25 p-4 text-sm text-stone-100">
                  <TentTree className="mt-0.5 h-5 w-5 flex-none text-amber-200" />
                  <p>
                    Four numbered campsites, no cleaning fees, and all requests
                    are reviewed by the team before they are confirmed.
                  </p>
                </div>*/}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6">
          <SectionTitle
            eyebrow="About the stay"
            title={"Off the Grid, With Essential Comforts"}
            description={siteContent.introBody}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <item.icon className="h-6 w-6 text-amber-700" />
                <p className="mt-4 text-base font-medium text-stone-900">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <div className="space-y-6">
            <HomeGalleryCarousel
              images={siteContent.images}
              alt={siteContent.brandName}
            />
            <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
                    <Mountain className="h-4 w-4" />
                    Campsite notes
                  </div>
                  <p className="mt-4 text-xs md:text-sm leading-6 text-stone-600">
                    A few practical details to know before you head out into the
                    bush.
                  </p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-3 lg:min-w-[62%]">
                  {siteContent.notes.map((item) => (
                    <li
                      key={item}
                      className="rounded-3xl border border-stone-200 bg-white px-4 py-4 text-sm leading-6 text-stone-700"
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 flex-none rounded-full bg-amber-300" />
                        <span>{item}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section
          id="availability"
          className="border-y border-stone-200 bg-stone-50/80"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle
              eyebrow="Booking"
              title="Check your dates before you book"
            />
            <div className="mt-8">
              <AvailabilityChecker />
            </div>
          </div>
        </section>
        <section className="border-b border-stone-200 bg-stone-50/80">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle
              eyebrow="Testimonials"
              title="What guests say about the campsite"
              // description="A few notes from recent visitors who stayed at Omborokko and shared their experience publicly on Google."
            />
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.author}
                  className="flex h-full flex-col rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-1 text-amber-600">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-5 flex-1 text-base italic leading-7 text-stone-700">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-6 border-t border-stone-100 pt-4">
                    <p className="text-sm font-semibold text-stone-950">
                      {item.author}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {item.detail}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionTitle
              eyebrow="Directions"
              title="How to find us"
              description="Please follow the road signs to reception at the farmhouse on arrival. From there, you will receive directions to the campsite, which is a further 5 km away."
            />
            <div className="mt-4 overflow-hidden rounded-md border border-stone-200 bg-stone-50 shadow-sm">
              <iframe
                title="Google Maps Omborokko Safaris"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3727.3187037577013!2d16.7204197!3d-20.8994937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1bf4d0a1bbde997f%3A0xfc41348745a0467e!2sOmborokko%20Safaris!5e0!3m2!1sen!2snz!4v1690864712755!5m2!1sen!2s"
                width="100%"
                height="350"
                loading="lazy"
                className="block w-full"
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
