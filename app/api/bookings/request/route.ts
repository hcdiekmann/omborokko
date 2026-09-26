import { createPendingBookingRequest } from "@/features/bookings/server/service";
import { sendBookingRequestEmails } from "@/lib/email/booking-mailer";
import { createBookingRequestSchema } from "@/lib/validation/bookings";
import { formatCurrency } from "@/lib/utils/format";
import { fail, ok } from "@/lib/utils/http";

export async function POST(request: Request) {
  try {
    const payload = createBookingRequestSchema().parse(await request.json());
    const result = await createPendingBookingRequest(payload);
    if (result.booking.created) {
      void sendBookingRequestEmails({
      bookingId: result.booking.booking_id,
      bookingReference: result.booking.booking_reference,
      guestName: `${payload.guestFirstName} ${payload.guestLastName}`,
      guestEmail: payload.guestEmail,
      guestPhone: payload.guestPhone || null,
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      requestedUnitCount: payload.requestedUnitCount,
      adultGuestsCount: payload.adultGuestsCount,
      childGuestsCount: payload.childGuestsCount,
      nights: result.pricing.nights,
      totalAmount: formatCurrency(result.pricing.totalAmount, { maximumFractionDigits: 2 }),
      notes: payload.notes || null
      }).catch((error) => {
        console.error("Failed to send booking request emails", error);
      });
    }

    return ok(result, { status: result.booking.created ? 201 : 200 });
  } catch (error) {
    return fail(error);
  }
}
