import { Heading, Link, Section, Text } from "@react-email/components";
import * as React from "react";

import { DetailTable, EmailShell } from "@/emails/components/email-shell";

export type BookingEmailProps = {
  bookingId: string;
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
  adultGuestsCount: number;
  childGuestsCount: number;
  nights: number;
  totalAmount: string;
  notes?: string | null;
  adminBookingUrl?: string;
};

export default function BookingRequestAdminEmail(props: BookingEmailProps) {
  return (
    <EmailShell
      preview={`New booking request ${props.bookingReference} from ${props.guestName}`}
      title="New booking request received"
    >
      <Text style={paragraph}>
        A new campsite booking request has been submitted and is waiting for review.
      </Text>
      <DetailTable
        rows={[
          { label: "Reference", value: props.bookingReference },
          { label: "Guest", value: props.guestName },
          { label: "Email", value: props.guestEmail },
          { label: "Phone", value: props.guestPhone || "Not provided" },
          { label: "Stay", value: `${props.checkInDate} to ${props.checkOutDate} · ${props.nights} nights` },
          { label: "Campsites requested", value: String(props.requestedUnitCount) },
          { label: "Guests", value: `${props.adultGuestsCount} adults · ${props.childGuestsCount} children` },
          { label: "Estimated total", value: props.totalAmount }
        ]}
      />
      {props.adminBookingUrl ? (
        <Section style={actionSection}>
          <Link href={props.adminBookingUrl} style={actionButton}>
            Open booking request
          </Link>
        </Section>
      ) : null}
      {props.notes ? (
        <Section style={noteCard}>
          <Heading as="h2" style={noteTitle}>Guest notes</Heading>
          <Text style={noteText}>{props.notes}</Text>
        </Section>
      ) : null}
    </EmailShell>
  );
}

const paragraph = {
  margin: "0 0 18px",
  fontSize: "16px",
  lineHeight: "1.7",
  color: "#3a2f24"
};

const noteCard = {
  marginTop: "18px",
  padding: "18px 20px",
  backgroundColor: "#fff8ec",
  borderRadius: "20px",
  border: "1px solid #ecd6b1"
};

const noteTitle = {
  margin: "0 0 10px",
  fontSize: "15px",
  color: "#70471f"
};

const noteText = {
  margin: 0,
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#4f3e2c"
};

const actionSection = {
  marginTop: "20px",
};

const actionButton = {
  display: "inline-block",
  padding: "12px 18px",
  borderRadius: "999px",
  backgroundColor: "#b86110",
  color: "#fffaf2",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
};
