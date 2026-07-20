import { NextRequest } from "next/server";

import { getBookingRequestByClientRequestId } from "@/features/bookings/server/service";
import { bookingRecoveryQuerySchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const params = bookingRecoveryQuerySchema.parse({
      clientRequestId: request.nextUrl.searchParams.get("clientRequestId") ?? ""
    });
    const booking = await getBookingRequestByClientRequestId(params.clientRequestId);

    return ok({ booking });
  } catch (error) {
    return fail(error);
  }
}
