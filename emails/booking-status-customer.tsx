import { Section, Text } from "@react-email/components";
import * as React from "react";

import { DetailTable, EmailShell } from "@/emails/components/email-shell";
import type { Enums } from "@/types/database";

export type BookingStatusEmailProps = {
  bookingReference: string;
  guestName: string;
  status: Enums<"booking_status">;
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
  assignedUnitNames: string[];
  totalAmount: string;
  adminNotes?: string | null;
};

const titleByStatus: Record<Enums<"booking_status">, string> = {
  pending: "Your booking request is still pending",
  confirmed: "Your booking request has been approved",
  rejected: "Your booking request was not approved",
  cancelled: "Your booking has been cancelled"
};

const introByStatus: Record<Enums<"booking_status">, string> = {
  pending: "Your request is still under review.",
  confirmed: "Good news. Your campsite request has been confirmed.",
  rejected: "Unfortunately we could not approve your requested stay.",
  cancelled: "Your campsite booking has been cancelled."
};

export default function BookingStatusCustomerEmail(props: BookingStatusEmailProps) {
  return (
    <EmailShell
      preview={`${props.bookingReference} is now ${props.status}`}
      title={titleByStatus[props.status]}
    >
      <Text style={paragraph}>Hello {props.guestName},</Text>
      <Text style={paragraph}>{introByStatus[props.status]}</Text>
      <DetailTable
        rows={[
          { label: "Reference", value: props.bookingReference },
          { label: "Status", value: props.status.charAt(0).toUpperCase() + props.status.slice(1) },
          { label: "Stay", value: `${props.checkInDate} to ${props.checkOutDate}` },
          { label: "Campsites requested", value: String(props.requestedUnitCount) },
          { label: "Total", value: props.totalAmount },
          {
            label: "Assigned campsites",
            value:
              props.status === "confirmed"
                ? props.assignedUnitNames.join(", ")
                : "Not assigned"
          }
        ]}
      />
      {props.adminNotes ? (
        <Section style={noteCard}>
          <Text style={noteTitle}>Message from the team</Text>
          <Text style={noteText}>{props.adminNotes}</Text>
        </Section>
      ) : null}
      {props.status === "confirmed" ? (
        <Text style={paragraph}>
          Please keep this reference for your arrival. Payment is made onsite in cash.
        </Text>
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
  backgroundColor: "#f6efe5",
  borderRadius: "20px",
  border: "1px solid #e5d8c6"
};

const noteTitle = {
  margin: "0 0 8px",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: "#8c6c49"
};

const noteText = {
  margin: 0,
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#4f3e2c"
};
