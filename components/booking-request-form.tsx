"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Search } from "lucide-react";
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
import { cn } from "@/lib/utils/cn";

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

type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

type StoredBookingRequest = {
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

type BookingSummary = {
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

function isClosedStatus(status: BookingStatus) {
  return status === "rejected" || status === "cancelled";
}

function readStoredRequest() {
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

function createStoredRequestFromSummary(booking: BookingSummary, clientRequestId?: string): StoredBookingRequest {
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

function timelineTerminalKey(status: BookingStatus) {
  if (status === "confirmed") return "BookingForm.timelineConfirmed";
  if (status === "rejected") return "BookingForm.timelineRejected";
  if (status === "cancelled") return "BookingForm.timelineCancelled";
  return "BookingForm.timelineDecision";
}

function BookingTimeline({ status }: { status: BookingStatus }) {
  const t = useTranslations();
  const steps = [
    { label: t("BookingForm.timelineSent"), active: true, complete: true },
    { label: t("BookingForm.timelineReview"), active: status === "pending", complete: status !== "pending" },
    { label: t(timelineTerminalKey(status)), active: status !== "pending", complete: status !== "pending" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
              step.complete ? "border-amber-700 bg-amber-700 text-white" : step.active ? "border-amber-700 bg-white text-amber-800" : "border-stone-300 bg-white text-stone-500"
            )}
          >
            {index + 1}
          </span>
          <span className={cn("text-sm font-medium", step.active ? "text-stone-950" : "text-stone-600")}>{step.label}</span>
        </div>
      ))}
    </div>
  );
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
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupReference, setLookupReference] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
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

  const recoverBookingRequest = useCallback(async (clientRequestId: string) => {
    setIsRecovering(true);

    try {
      const response = await fetch(
        "/api/bookings/request/recover?clientRequestId=" + encodeURIComponent(clientRequestId),
        { method: "GET" }
      );
      const payload = await response.json().catch(() => null);
      const booking = payload?.data?.booking as BookingSummary | undefined;

      if (response.ok && booking) {
        const recovered = createStoredRequestFromSummary(booking, clientRequestId);
        saveStoredRequest(recovered);
        setActiveRequest(recovered);

        return recovered;
      }

      return null;
    } finally {
      setIsRecovering(false);
    }
  }, []);

  const lookupBookingRequest = useCallback(async (guestEmail: string, bookingReference: string) => {
    const response = await fetch("/api/bookings/request/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestEmail, bookingReference })
    });
    const payload = await response.json().catch(() => null);
    const booking = payload?.data?.booking as BookingSummary | undefined;

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? t("BookingForm.findRequestFailed"));
    }

    if (!booking) return null;

    const recovered = createStoredRequestFromSummary(booking);
    saveStoredRequest(recovered);
    setActiveRequest(recovered);
    return recovered;
  }, [t]);

  const refreshActiveRequest = useCallback(async (request: StoredBookingRequest) => {
    if (request.clientRequestId) return recoverBookingRequest(request.clientRequestId);
    return lookupBookingRequest(request.guestEmail, request.reference).catch(() => null);
  }, [lookupBookingRequest, recoverBookingRequest]);

  useEffect(() => {
    const stored = readStoredRequest();
    if (stored) {
      setActiveRequest(stored);
      void refreshActiveRequest(stored);
    }
  }, [refreshActiveRequest]);

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

  useEffect(() => {
    if (!activeRequest || isClosedStatus(activeRequest.status)) return;

    const interval = window.setInterval(() => {
      void refreshActiveRequest(activeRequest);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [activeRequest, refreshActiveRequest]);

  async function onSubmit(values: FormValues) {
    if (availabilityError) {
      form.setError("root", { message: availabilityError });
      return;
    }

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

  async function handleLookupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupError(null);
    setIsLookingUp(true);

    try {
      const recovered = await lookupBookingRequest(lookupEmail, lookupReference);
      if (!recovered) setLookupError(t("BookingForm.findRequestNotFound"));
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : t("BookingForm.findRequestFailed"));
    } finally {
      setIsLookingUp(false);
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-950">
                  {t("BookingForm.activeRequestTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {statusBody}
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-900 shadow-sm">
                {statusLabel}
              </span>
            </div>
            <div className="mt-5">
              <BookingTimeline status={activeRequest.status} />
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
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
                <dt className="font-medium text-stone-600">{t("BookingForm.campsitesNeeded")}</dt>
                <dd className="mt-1 font-semibold text-stone-950">{activeRequest.requestedUnitCount}</dd>
              </div>
            </dl>
            {activeRequest.guestMessage ? (
              <div className="mt-5 rounded-md border border-white/70 bg-white/70 p-3 text-sm text-stone-700">
                <p className="font-semibold text-stone-950">{t("BookingForm.guestMessageTitle")}</p>
                <p className="mt-1 leading-6">{activeRequest.guestMessage}</p>
              </div>
            ) : null}
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
      <CardContent className="space-y-5 p-5">
        <form className="rounded-md border border-stone-200 bg-stone-50 p-4" onSubmit={handleLookupSubmit}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-950">{t("BookingForm.findRequestTitle")}</p>
              <p className="mt-1 text-sm text-stone-600">{t("BookingForm.findRequestBody")}</p>
            </div>
            <label className="space-y-2 text-sm font-medium text-stone-700">
              {t("BookingForm.findRequestEmail")}
              <Input type="email" value={lookupEmail} onChange={(event) => setLookupEmail(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium text-stone-700">
              {t("BookingForm.findRequestReference")}
              <Input value={lookupReference} onChange={(event) => setLookupReference(event.target.value)} />
            </label>
            <Button type="submit" variant="outline" className="h-11 rounded-2xl" disabled={isLookingUp}>
              <Search className="mr-2 h-4 w-4" />
              {isLookingUp ? t("BookingForm.findingRequest") : t("BookingForm.findRequestButton")}
            </Button>
          </div>
          {lookupError ? <p className="mt-3 text-sm text-red-600">{lookupError}</p> : null}
        </form>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DateRangeField
            className="sm:col-span-2"
            checkInDate={form.watch("checkInDate")}
            checkOutDate={form.watch("checkOutDate")}
            requestedUnitCount={form.watch("requestedUnitCount") ?? 1}
            onAvailabilityError={setAvailabilityError}
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
            disabled={form.formState.isSubmitting || isRecovering || Boolean(availabilityError)}
            title={availabilityError ?? undefined}
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
