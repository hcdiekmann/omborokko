import * as React from "react";

import BookingRequestAdminEmail, { type BookingEmailProps } from "@/emails/booking-request-admin";
import BookingRequestCustomerEmail from "@/emails/booking-request-customer";
import BookingStatusCustomerEmail from "@/emails/booking-status-customer";
import { getEmailConfig, isEmailEnabled } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/sender";
import { getAdminBookingDetail } from "@/features/admin/server/service";
import type { Enums } from "@/types/database";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NA", {
    style: "currency",
    currency: "NAD",
    maximumFractionDigits: 2
  }).format(amount);
}

export async function sendBookingRequestEmails(input: BookingEmailProps) {
  if (!isEmailEnabled()) {
    return;
  }

  const config = getEmailConfig();
  const adminBookingUrl = config.appUrl
    ? `${config.appUrl.replace(/\/$/, "")}/admin/bookings/${input.bookingId}`
    : undefined;
  const tasks: Promise<unknown>[] = [];

  if (config.adminEmails.length) {
    tasks.push(
      sendEmail({
        to: config.adminEmails,
        subject: `New booking request ${input.bookingReference}`,
        react: <BookingRequestAdminEmail {...input} adminBookingUrl={adminBookingUrl} />,
        replyTo: input.guestEmail
      })
    );
  }

  tasks.push(
    sendEmail({
      to: [input.guestEmail],
      subject: `We received your booking request ${input.bookingReference}`,
      react: <BookingRequestCustomerEmail {...input} />,
      replyTo: config.replyToEmail || undefined
    })
  );

  await Promise.allSettled(tasks);
}

export async function sendBookingStatusEmail(bookingId: string, status: Enums<"booking_status">) {
  if (!isEmailEnabled()) {
    return;
  }

  if (!["confirmed", "rejected", "cancelled"].includes(status)) {
    return;
  }

  const bookingDetail = await getAdminBookingDetail(bookingId);
  const booking = bookingDetail.booking;
  const assignedUnitNames = bookingDetail.assignedUnits
    .map((unit) => unit.campsite_units?.name)
    .filter((value): value is string => Boolean(value));
  const config = getEmailConfig();

  await sendEmail({
    to: [booking.guest_email],
    subject: `Booking request ${booking.booking_reference} ${status}`,
    react: (
      <BookingStatusCustomerEmail
        bookingReference={booking.booking_reference}
        guestName={`${booking.guest_first_name} ${booking.guest_last_name}`}
        status={status}
        checkInDate={booking.check_in_date}
        checkOutDate={booking.check_out_date}
        requestedUnitCount={booking.requested_unit_count}
        assignedUnitNames={assignedUnitNames}
        totalAmount={formatCurrency(booking.total_amount)}
        adminNotes={booking.admin_notes}
      />
    ),
    replyTo: config.replyToEmail || undefined
  });
}
