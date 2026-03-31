import { createPendingBookingRequest } from "@/features/bookings/server/service";
import { sendBookingRequestEmails } from "@/lib/email/booking-mailer";
import { createBookingRequestSchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

export async function POST(request: Request) {
  try {
    const payload = createBookingRequestSchema().parse(await request.json());
    const result = await createPendingBookingRequest(payload);
    await sendBookingRequestEmails({
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
      totalAmount: new Intl.NumberFormat("en-NA", {
        style: "currency",
        currency: result.pricing.currency,
        maximumFractionDigits: 2
      }).format(result.pricing.totalAmount),
      notes: payload.notes || null
    }).catch((error) => {
      console.error("Failed to send booking request emails", error);
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
