import Image from "next/image";
import { Mountain } from "lucide-react";

import { BookingRequestForm } from "@/components/booking-request-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCampsiteTemplate } from "@/features/bookings/server/service";
import { siteContent } from "@/lib/content/site-content";

export default async function BookPage() {
  const templateUnit = await getPublicCampsiteTemplate();
  const bookingNotes = [...siteContent.notes];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6">
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
            <div className="hidden gap-4 sm:grid sm:grid-cols-3">
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

            <div className="border-t border-stone-200">
              <ul className="mt-5 space-y-3">
                {bookingNotes.map((item) => (
                  <li key={item} className="text-sm leading-6 text-stone-700">
                    <span className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 flex-none rounded-full bg-amber-300" />
                      <span>{item}</span>
                    </span>
                  </li>
                ))}
              </ul>
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

        <section>
          <BookingRequestForm maxGuestsPerCampsite={templateUnit.max_guests} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
