"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangeField } from "@/components/date-range-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBookingRequestSchema } from "@/lib/validation/bookings";

type FormValues = {
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  adultGuestsCount: number;
  childGuestsCount: number;
  notes?: string;
};

type StoredBookingRequest = {
  clientRequestId: string;
  reference: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
  guestEmail: string;
  createdAt?: string;
};

const ACTIVE_REQUEST_KEY = "omborokko.activeBookingRequest";
const PENDING_REQUEST_KEY = "omborokko.pendingBookingRequestId";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isStoredRequestRelevant(value: StoredBookingRequest) {
  return value.checkOutDate >= todayIso();
}

function isClosedStatus(status: StoredBookingRequest["status"]) {
  return status === "rejected" || status === "cancelled";
}

function readStoredRequest() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_REQUEST_KEY);
    if (!raw) return null;

    const value = JSON.parse(raw) as StoredBookingRequest;
    if (!value.reference || !value.clientRequestId || !isStoredRequestRelevant(value)) {
      window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
      return null;
    }

    return value;
  } catch {
    window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
    return null;
  }
}

function saveStoredRequest(value: StoredBookingRequest) {
  window.localStorage.setItem(ACTIVE_REQUEST_KEY, JSON.stringify(value));
  window.localStorage.removeItem(PENDING_REQUEST_KEY);
}

function createClientRequestId() {
  return crypto.randomUUID();
}

function getRetryableClientRequestId() {
  const stored = window.localStorage.getItem(PENDING_REQUEST_KEY);
  if (stored) return stored;

  const created = createClientRequestId();
  window.localStorage.setItem(PENDING_REQUEST_KEY, created);
  return created;
}

function createStoredRequestFromSubmit(
  clientRequestId: string,
  values: FormValues,
  booking: { booking_reference: string; status: StoredBookingRequest["status"] }
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

function createStoredRequestFromRecovery(
  clientRequestId: string,
  booking: {
    booking_reference: string;
    status: StoredBookingRequest["status"];
    check_in_date: string;
    check_out_date: string;
    requested_unit_count: number;
    guest_email: string;
    created_at?: string;
  }
): StoredBookingRequest {
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

export function BookingRequestForm({
  maxGuestsPerCampsite,
}: {
  maxGuestsPerCampsite: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [activeRequest, setActiveRequest] = useState<StoredBookingRequest | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(
      createBookingRequestSchema({
        dateFormat: t("BookingValidation.dateFormat"),
        checkInRequired: t("BookingValidation.checkInRequired"),
        checkOutRequired: t("BookingValidation.checkOutRequired"),
        checkOutLater: t("BookingValidation.checkOutLater"),
        firstNameRequired: t("BookingValidation.firstNameRequired"),
        lastNameRequired: t("BookingValidation.lastNameRequired"),
        emailRequired: t("BookingValidation.emailRequired"),
        emailInvalid: t("BookingValidation.emailInvalid"),
        addGuest: t("BookingValidation.addGuest")
      })
    ),
    defaultValues: {
      checkInDate: "",
      checkOutDate: "",
      requestedUnitCount: 1,
      guestFirstName: "",
      guestLastName: "",
      guestEmail: "",
      guestPhone: "",
      adultGuestsCount: 2,
      childGuestsCount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    const stored = readStoredRequest();
    if (stored) {
      setActiveRequest(stored);
      void recoverBookingRequest(stored.clientRequestId);
    }
  }, []);

  useEffect(() => {
    const checkInDate = searchParams.get("checkInDate") ?? "";
    const checkOutDate = searchParams.get("checkOutDate") ?? "";
    const requestedUnitCount = Number(
      searchParams.get("requestedUnitCount") ?? "1",
    );

    if (checkInDate) {
      form.setValue("checkInDate", checkInDate, {
        shouldDirty: false,
      });
    }

    if (checkOutDate) {
      form.setValue("checkOutDate", checkOutDate, {
        shouldDirty: false,
      });
    }

    if (Number.isFinite(requestedUnitCount) && requestedUnitCount > 0) {
      form.setValue("requestedUnitCount", requestedUnitCount, {
        shouldDirty: false,
      });
    }
  }, [form, searchParams]);


  async function recoverBookingRequest(clientRequestId: string) {
    setIsRecovering(true);

    try {
      const response = await fetch(
        "/api/bookings/request/recover?clientRequestId=" + encodeURIComponent(clientRequestId),
        { method: "GET" }
      );
      const payload = await response.json().catch(() => null);
      const booking = payload?.data?.booking;

      if (response.ok && booking) {
        const recovered = createStoredRequestFromRecovery(clientRequestId, booking);
        saveStoredRequest(recovered);
        setActiveRequest(recovered);

        return recovered;
      }

      return null;
    } finally {
      setIsRecovering(false);
    }
  }

  async function onSubmit(values: FormValues) {
    const clientRequestId = getRetryableClientRequestId();

    try {
      const response = await fetch("/api/bookings/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, clientRequestId }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.error?.message ?? t("BookingForm.requestFailed");
        form.setError("root", { message });
        return;
      }

      const booking = payload.data.booking;
      const stored = createStoredRequestFromSubmit(clientRequestId, values, booking);
      saveStoredRequest(stored);
      setActiveRequest(stored);
      form.reset(values);
    } catch {
      const recovered = await recoverBookingRequest(clientRequestId);

      if (!recovered) {
        form.setError("root", { message: t("BookingForm.uncertainResult") });
      }
    }
  }

  function clearActiveRequest() {
    window.localStorage.removeItem(ACTIVE_REQUEST_KEY);
    window.localStorage.removeItem(PENDING_REQUEST_KEY);
    setActiveRequest(null);
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  useEffect(() => {
    if (!activeRequest || isClosedStatus(activeRequest.status)) return;

    const interval = window.setInterval(() => {
      void recoverBookingRequest(activeRequest.clientRequestId);
    }, 30000);

    return () => window.clearInterval(interval);
    // The interval only needs the current stored request id/status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRequest?.clientRequestId, activeRequest?.status]);

  if (activeRequest) {
    const statusLabel = t(
      activeRequest.status === "confirmed"
        ? "BookingForm.activeRequestStatusConfirmed"
        : activeRequest.status === "rejected"
          ? "BookingForm.activeRequestStatusRejected"
          : activeRequest.status === "cancelled"
            ? "BookingForm.activeRequestStatusCancelled"
            : "BookingForm.activeRequestStatusPending"
    );
    const statusBody = t(
      activeRequest.status === "confirmed"
        ? "BookingForm.activeRequestBodyConfirmed"
        : activeRequest.status === "rejected"
          ? "BookingForm.activeRequestBodyRejected"
          : activeRequest.status === "cancelled"
            ? "BookingForm.activeRequestBodyCancelled"
            : "BookingForm.activeRequestBodyPending"
    );
    const panelClassName = isClosedStatus(activeRequest.status)
      ? "rounded-md border border-stone-200 bg-stone-50 p-4"
      : activeRequest.status === "confirmed"
        ? "rounded-md border border-green-200 bg-green-50 p-4"
        : "rounded-md border border-amber-200 bg-amber-50 p-4";

    return (
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className={panelClassName}>
            <h2 className="text-base font-semibold text-stone-950">
              {t("BookingForm.activeRequestTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {statusBody}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-medium text-stone-600">{t("BookingForm.activeRequestReference")}</dt>
                <dd className="mt-1 font-semibold text-stone-950">{activeRequest.reference}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-600">{t("BookingForm.activeRequestDates")}</dt>
                <dd className="mt-1 font-semibold text-stone-950">
                  {dateFormatter.format(new Date(activeRequest.checkInDate))} - {dateFormatter.format(new Date(activeRequest.checkOutDate))}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-stone-600">{t("BookingForm.activeRequestStatus")}</dt>
                <dd className="mt-1 font-semibold text-stone-950">{statusLabel}</dd>
              </div>
            </dl>
          </div>
          {isRecovering ? (
            <p className="text-sm text-stone-600">{t("BookingForm.recovering")}</p>
          ) : null}
          <Button
            type="button"
            variant={isClosedStatus(activeRequest.status) ? "default" : "outline"}
            className="h-11 rounded-2xl"
            onClick={clearActiveRequest}
          >
            {isClosedStatus(activeRequest.status)
              ? t("BookingForm.makeAnotherRequest")
              : t("BookingForm.startNewRequest")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DateRangeField
            className="sm:col-span-2"
            checkInDate={form.watch("checkInDate")}
            checkOutDate={form.watch("checkOutDate")}
            onChange={({ checkInDate, checkOutDate }) => {
              form.setValue("checkInDate", checkInDate, {
                shouldDirty: true,
                shouldValidate: true,
              });
              form.setValue("checkOutDate", checkOutDate, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            error={
              form.formState.errors.checkInDate?.message ??
              form.formState.errors.checkOutDate?.message
            }
          />
          <label className="space-y-2 text-sm font-medium text-stone-700">
            {t("BookingForm.campsitesNeeded")}
            <Input
              type="number"
              min={1}
              max={4}
              value={form.watch("requestedUnitCount") ?? 1}
              {...form.register("requestedUnitCount", { valueAsNumber: true })}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            {t("BookingForm.firstName")}
            <Input {...form.register("guestFirstName")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            {t("BookingForm.lastName")}
            <Input {...form.register("guestLastName")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            {t("BookingForm.email")}
            <Input type="email" {...form.register("guestEmail")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            {t("BookingForm.phone")}
            <Input {...form.register("guestPhone")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            {t("BookingForm.adults")}
            <Input
              type="number"
              min={0}
              max={maxGuestsPerCampsite * 4}
              {...form.register("adultGuestsCount", { valueAsNumber: true })}
            />
            {form.formState.errors.adultGuestsCount ? (
              <span className="text-xs text-red-600">
                {form.formState.errors.adultGuestsCount.message}
              </span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            {t("BookingForm.children")}
            <Input
              type="number"
              min={0}
              max={maxGuestsPerCampsite * 4}
              {...form.register("childGuestsCount", { valueAsNumber: true })}
            />
            {form.formState.errors.childGuestsCount ? (
              <span className="text-xs text-red-600">
                {form.formState.errors.childGuestsCount.message}
              </span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700 sm:col-span-2">
            {t("BookingForm.notes")}
            <Textarea {...form.register("notes")} />
          </label>
          {form.formState.errors.root ? (
            <p className="sm:col-span-2 text-sm text-red-600">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button
            type="submit"
            className="h-11 rounded-2xl bg-amber-700 text-white hover:bg-amber-600 sm:col-span-2"
            disabled={form.formState.isSubmitting || isRecovering}
          >
            {form.formState.isSubmitting || isRecovering
              ? t("BookingForm.submitting")
              : t("BookingForm.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
