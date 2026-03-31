import { NextRequest } from "next/server";

import { getCampsiteAvailability } from "@/features/bookings/server/availability";
import { availabilityQuerySchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const params = availabilityQuerySchema().parse({
      checkInDate: request.nextUrl.searchParams.get("checkInDate"),
      checkOutDate: request.nextUrl.searchParams.get("checkOutDate"),
      requestedUnitCount: Number(request.nextUrl.searchParams.get("requestedUnitCount") ?? "1")
    });

    const availability = await getCampsiteAvailability(params.checkInDate, params.checkOutDate, params.requestedUnitCount);

    return ok(availability);
  } catch (error) {
    return fail(error);
  }
}
