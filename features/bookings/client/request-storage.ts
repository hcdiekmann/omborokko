"use client";

// Browser-side memory of the guest's latest booking request, shared by the
// booking form and the WebMCP tools so both show the same request.

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

export type StoredBookingRequest = {
  clientRequestId?: string;
  reference: string;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
  guestEmail: string;
  guestMessage?: string | null;
  createdAt?: string;
};

export type BookingSummary = {
  booking_reference: string;
  status: BookingStatus;
  check_in_date: string;
  check_out_date: string;
  requested_unit_count: number;
  guest_email: string;
  guest_message?: string | null;
  created_at?: string;
};

const ACTIVE_REQUEST_KEY = "omborokko.activeBookingRequest";
const PENDING_REQUEST_KEY = "omborokko.pendingBookingRequestId";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isStoredRequestRelevant(value: StoredBookingRequest) {
  return value.checkOutDate >= todayIso();
}


export function readStoredRequest() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_REQUEST_KEY);
    if (!raw) return null;

    const value = JSON.parse(raw) as StoredBookingRequest;
    if (!value.reference || !value.guestEmail || !isStoredRequestRelevant(value)) {
      window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
      return null;
    }

    return value;
  } catch {
    window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
    return null;
  }
}

/** Fired on window whenever the stored request changes. */
export const STORED_REQUEST_CHANGED_EVENT = "omborokko:booking-request-changed";

export function saveStoredRequest(value: StoredBookingRequest) {
  window.localStorage.setItem(ACTIVE_REQUEST_KEY, JSON.stringify(value));
  window.localStorage.removeItem(PENDING_REQUEST_KEY);
  window.dispatchEvent(new Event(STORED_REQUEST_CHANGED_EVENT));
}

export function clearStoredRequest() {
  window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
  window.localStorage.removeItem(PENDING_REQUEST_KEY);
}

function createClientRequestId() {
  return crypto.randomUUID();
}

export function getRetryableClientRequestId() {
  const stored = window.localStorage.getItem(PENDING_REQUEST_KEY);
  if (stored) return stored;

  const created = createClientRequestId();
  window.localStorage.setItem(PENDING_REQUEST_KEY, created);
  return created;
}

export function createStoredRequestFromSubmit(
  clientRequestId: string,
  values: Pick<StoredBookingRequest, "checkInDate" | "checkOutDate" | "requestedUnitCount" | "guestEmail">,
  booking: { booking_reference: string; status: BookingStatus }
): StoredBookingRequest {
  return {
    clientRequestId,
    reference: booking.booking_reference,
    status: booking.status,
    checkInDate: values.checkInDate,
    checkOutDate: values.checkOutDate,
    requestedUnitCount: values.requestedUnitCount,
    guestEmail: values.guestEmail,
    createdAt: new Date().toISOString()
  };
}

export function createStoredRequestFromSummary(booking: BookingSummary, clientRequestId?: string): StoredBookingRequest {
  return {
    clientRequestId,
    reference: booking.booking_reference,
    status: booking.status,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    requestedUnitCount: booking.requested_unit_count,
    guestEmail: booking.guest_email,
    guestMessage: booking.guest_message,
    createdAt: booking.created_at
  };
}
