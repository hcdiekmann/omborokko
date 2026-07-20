import { getBookingRequestByGuestLookup } from "@/features/bookings/server/service";
import { bookingLookupSchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

export async function POST(request: Request) {
  try {
    const params = bookingLookupSchema.parse(await request.json());
    const booking = await getBookingRequestByGuestLookup(params.guestEmail, params.bookingReference);

    return ok({ booking });
  } catch (error) {
    return fail(error);
  }
}
