import Image from "next/image";

import { AvailabilityChecker } from "@/components/availability-checker";
import { BookingRequestForm } from "@/components/booking-request-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getActiveUnits,
  getPublicCampsiteTemplate,
} from "@/features/bookings/server/service";
import { siteContent } from "@/lib/content/site-content";

export default async function BookPage() {
  const [units, templateUnit] = await Promise.all([
    getActiveUnits(),
    getPublicCampsiteTemplate(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="relative h-[340px] overflow-hidden rounded-[2rem]">
              <Image
                src={siteContent.images[0]}
                alt={siteContent.brandName}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {siteContent.images.slice(1, 4).map((image) => (
                <div
                  key={image}
                  className="relative h-28 overflow-hidden rounded-2xl sm:h-32"
                >
                  <Image
                    src={image}
                    alt={siteContent.brandName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
              Bookings on request
            </p>
            <h1 className="brand-title text-3xl font-semibold tracking-tight text-stone-950">
              Request your bush campsite stay
            </h1>

            <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  Capacity
                </p>
                <p className="mt-2 text-md font-semibold text-stone-900">
                  Max {templateUnit.max_guests} guests per campsite
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  Request one or more campsites based on the size of your group.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-stone-700">
              <span className="rounded-full bg-stone-100 px-3 py-1">
                {siteContent.pricing.adultLabel}: N${" "}
                {templateUnit.base_price_per_night}/night
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1">
                {siteContent.pricing.childLabel}: N${" "}
                {templateUnit.child_price_per_night}/night
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1">
                No cleaning fees
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AvailabilityChecker />
          <BookingRequestForm maxGuestsPerCampsite={templateUnit.max_guests} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
