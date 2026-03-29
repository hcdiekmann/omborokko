import { updateAdminBookingStatus } from "@/features/admin/server/service";
import { sendBookingStatusEmail } from "@/lib/email/booking-mailer";
import { updateBookingStatusSchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = updateBookingStatusSchema.parse(await request.json());
    const booking = await updateAdminBookingStatus(id, payload.status, payload.adminNotes);
    await sendBookingStatusEmail(id, payload.status).catch((error) => {
      console.error("Failed to send booking status email", error);
    });

    return ok(booking);
  } catch (error) {
    return fail(error);
  }
}
