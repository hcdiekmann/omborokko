import { BookingRequestForm } from "@/components/booking-request-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCampsiteTemplate } from "@/features/bookings/server/service";
import { siteContent } from "@/lib/content/site-content";

export default async function BookPage() {
  const templateUnit = await getPublicCampsiteTemplate();
  const bookingNotes = [...siteContent.notes];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex-1 max-w-6xl space-y-6 px-4 py-5 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
              Booking
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

          <div>
            <BookingRequestForm
              maxGuestsPerCampsite={templateUnit.max_guests}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
