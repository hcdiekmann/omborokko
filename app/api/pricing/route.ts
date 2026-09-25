import { NextRequest } from "next/server";

import { computeBookingPricing } from "@/features/bookings/server/pricing";
import { getPublicCampsiteTemplate } from "@/features/bookings/server/service";
import { pricingQuerySchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

function optionalNumber(value: string | null) {
  return value === null || value === "" ? undefined : Number(value);
}

/**
 * Public campsite rates, plus an optional quote when stay dates are given.
 * Prices are per person per night; the number of campsites only affects
 * capacity (max guests per campsite), not the price.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = pricingQuerySchema.parse({
      checkInDate: searchParams.get("checkInDate") || undefined,
      checkOutDate: searchParams.get("checkOutDate") || undefined,
      adultGuestsCount: optionalNumber(searchParams.get("adultGuestsCount")),
      childGuestsCount: optionalNumber(searchParams.get("childGuestsCount"))
    });
    const unit = await getPublicCampsiteTemplate();
    const quote =
      params.checkInDate && params.checkOutDate
        ? computeBookingPricing(
            unit,
            params.checkInDate,
            params.checkOutDate,
            params.adultGuestsCount,
            params.childGuestsCount
          )
        : null;

    return ok(
      {
        currency: "NAD",
        adultPricePerNight: Number(unit.base_price_per_night),
        childPricePerNight: Number(unit.child_price_per_night),
        maxGuestsPerCampsite: unit.max_guests,
        maxCampsitesPerRequest: 4,
        cleaningFee: 0,
        quote
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    return fail(error);
  }
}
