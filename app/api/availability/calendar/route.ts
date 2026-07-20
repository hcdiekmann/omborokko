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

    return ok({ nights });
  } catch (error) {
    return fail(error);
  }
}
