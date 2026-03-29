import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { reference } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
            Booking request received
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            Thanks for your booking request!
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-700">
            Your booking reference is
            <span className="font-bold">
              {reference ? ` ${reference} ` : ""}
            </span>
          </p>
          <p className="mt-1">
            We will review availability and confirm the stay as soon as
            possible. You will receive a confirmation email once your booking is
            confirmed.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/book"
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
            >
              Back to booking
            </Link>
            <Link
              href="/"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
            >
              Return home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
