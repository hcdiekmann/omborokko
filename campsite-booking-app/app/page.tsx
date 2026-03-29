import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  Droplets,
  Flame,
  Mountain,
  TentTree,
  Trees,
} from "lucide-react";

import { SectionTitle } from "@/components/section-title";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveUnits } from "@/features/bookings/server/service";
import { siteContent } from "@/lib/content/site-content";

export default async function HomePage() {
  const units = await getActiveUnits();
  const highlights = [
    {
      icon: Trees,
      title: "Quiet bush setting",
      text: "Seasonal riverbeds, mountain views, and evenings that settle into total stillness.",
    },
    {
      icon: Flame,
      title: "Authentic camp rhythm",
      text: "Firepit cooking, starlit dinners, and a simple base for a proper bush stay.",
    },
    {
      icon: Droplets,
      title: "Essential comforts",
      text: "Warm showers, flush toilets, drinking water, and a pool nearby.",
    },
    {
      icon: Compass,
      title: "Made for overlanders",
      text: "Four matching campsites, cash onsite, and a clear request-and-confirm booking flow.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-stone-200">
          <div className="absolute inset-0">
            <Image
              src="/images/campsite/home-bg.webp"
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
                    className="rounded-full bg-amber-700 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-amber-950/20 transition hover:bg-amber-600"
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
            //eyebrow="About the stay"
            title={"About the stay"}
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
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {siteContent.images.slice(0, 4).map((image, index) => (
                <div
                  key={image}
                  className={`relative overflow-hidden rounded-[1.75rem] ${index === 0 ? "sm:col-span-2 h-72" : "h-44 sm:h-52"}`}
                >
                  <Image
                    src={image}
                    alt={siteContent.brandName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
            <div className="rounded-[2rem] bg-stone-950 p-8 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                <Mountain className="h-4 w-4" />
                Campsite notes
              </div>
              <ul className="mt-6 space-y-3 text-sm text-stone-200">
                {siteContent.notes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
