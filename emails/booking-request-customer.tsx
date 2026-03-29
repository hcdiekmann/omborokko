import { Text } from "@react-email/components";
import * as React from "react";

import { DetailTable, EmailShell } from "@/emails/components/email-shell";
import type { BookingEmailProps } from "@/emails/booking-request-admin";

export default function BookingRequestCustomerEmail(props: BookingEmailProps) {
  return (
    <EmailShell
      preview={`Your booking request ${props.bookingReference} has been received`}
      title="Your booking request is in review"
    >
      <Text style={paragraph}>
        We have received your booking request and the Omborokko Safaris team
        will review availability before confirming your stay.
      </Text>
      <DetailTable
        rows={[
          { label: "Reference", value: props.bookingReference },
          {
            label: "Requested stay",
            value: `${props.checkInDate} to ${props.checkOutDate} · ${props.nights} nights`,
          },
          {
            label: "Campsites requested",
            value: String(props.requestedUnitCount),
          },
          {
            label: "Guests",
            value: `${props.adultGuestsCount} adults · ${props.childGuestsCount} children`,
          },
          { label: "Estimated total", value: props.totalAmount },
          { label: "Payment", value: "Cash payment onsite after confirmation" },
        ]}
      />
    </EmailShell>
  );
}

const paragraph = {
  margin: "0 0 18px",
  fontSize: "16px",
  lineHeight: "1.7",
  color: "#3a2f24",
};
