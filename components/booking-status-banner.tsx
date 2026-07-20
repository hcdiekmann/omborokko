"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

type StoredBookingRequest = {
  clientRequestId: string;
  reference: string;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
  guestEmail: string;
  createdAt?: string;
};

type RecoveredBooking = {
  booking_reference: string;
  status: BookingStatus;
  check_in_date: string;
  check_out_date: string;
  requested_unit_count: number;
  guest_email: string;
  created_at?: string;
};

const ACTIVE_REQUEST_KEY = "omborokko.activeBookingRequest";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isRelevant(value: StoredBookingRequest) {
  return value.checkOutDate >= todayIso();
}

function readStoredRequest() {
  try {
    const raw = window.localStorage.getItem(ACTIVE_REQUEST_KEY);
    if (!raw) return null;

    const value = JSON.parse(raw) as StoredBookingRequest;
    if (!value.reference || !value.clientRequestId || !isRelevant(value)) {
      window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
      return null;
    }

    return value;
  } catch {
    window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
    return null;
  }
}

function toStoredRequest(clientRequestId: string, booking: RecoveredBooking): StoredBookingRequest {
  return {
    clientRequestId,
    reference: booking.booking_reference,
    status: booking.status,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    requestedUnitCount: booking.requested_unit_count,
    guestEmail: booking.guest_email,
    createdAt: booking.created_at
  };
}

function statusKey(status: BookingStatus) {
  if (status === "confirmed") return "BookingForm.activeRequestStatusConfirmed";
  if (status === "rejected") return "BookingForm.activeRequestStatusRejected";
  if (status === "cancelled") return "BookingForm.activeRequestStatusCancelled";
  return "BookingForm.activeRequestStatusPending";
}

function bodyKey(status: BookingStatus) {
  if (status === "confirmed") return "BookingForm.activeRequestBodyConfirmed";
  if (status === "rejected") return "BookingForm.activeRequestBodyRejected";
  if (status === "cancelled") return "BookingForm.activeRequestBodyCancelled";
  return "BookingForm.activeRequestBodyPending";
}

export function BookingStatusBanner() {
  const t = useTranslations();
  const locale = useLocale();
  const [request, setRequest] = useState<StoredBookingRequest | null>(null);

  useEffect(() => {
    const stored = readStoredRequest();
    if (!stored) return;

    setRequest(stored);
    const clientRequestId = stored.clientRequestId;

    async function refresh() {
      const response = await fetch(
        "/api/bookings/request/recover?clientRequestId=" + encodeURIComponent(clientRequestId),
        { method: "GET" }
      );
      const payload = await response.json().catch(() => null);
      const booking = payload?.data?.booking as RecoveredBooking | undefined;

      if (!response.ok) return;

      if (!booking) {
        window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
        setRequest(null);
        return;
      }

      const updated = toStoredRequest(clientRequestId, booking);
      window.localStorage.setItem(ACTIVE_REQUEST_KEY, JSON.stringify(updated));
      setRequest(updated);
    }

    void refresh();
  }, []);

  if (!request) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="border-b border-stone-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm text-stone-800 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-stone-950">
            {t("BookingForm.activeRequestTitle")} {request.reference}
          </p>
          <p className="mt-1 leading-6 text-stone-700">
            {t(bodyKey(request.status))} <span className="font-medium text-stone-900">{t(statusKey(request.status))}</span> · {dateFormatter.format(new Date(request.checkInDate))} - {dateFormatter.format(new Date(request.checkOutDate))}
          </p>
        </div>
        <Link
          href="/book"
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          {t("BookingForm.viewRequest")}
        </Link>
      </div>
    </div>
  );
}
