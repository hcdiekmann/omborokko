import { NextRequest } from "next/server";

import { getCampsiteNightlyAvailability } from "@/features/bookings/server/availability";
import { availabilityCalendarQuerySchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const params = availabilityCalendarQuerySchema.parse({
      startDate: request.nextUrl.searchParams.get("startDate"),
      endDate: request.nextUrl.searchParams.get("endDate"),
      requestedUnitCount: Number(request.nextUrl.searchParams.get("requestedUnitCount") ?? "1")
    });
    const nights = await getCampsiteNightlyAvailability(params.startDate, params.endDate, params.requestedUnitCount);

    // Counts only, identical for every visitor: let the CDN absorb repeat
    // loads. Booking requests are re-checked server-side at submit time.
    return ok(
      { nights },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    return fail(error);
  }
}
