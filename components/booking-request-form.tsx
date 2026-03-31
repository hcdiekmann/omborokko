"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangeField } from "@/components/date-range-field";
import { useRouter } from "@/i18n/navigation";
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

export function BookingRequestForm({
  maxGuestsPerCampsite,
}: {
  maxGuestsPerCampsite: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<FormValues>({
    resolver: zodResolver(
      createBookingRequestSchema({
        dateFormat: t("BookingValidation.dateFormat"),
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

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/bookings/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload.error?.message ?? t("BookingForm.requestFailed");
      form.setError("root", { message });
      return;
    }

    const reference = payload.data.booking.booking_reference;
    router.push(`/${locale}/booking/request/success?reference=${encodeURIComponent(reference)}`);
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
              });
              form.setValue("checkOutDate", checkOutDate, {
                shouldDirty: true,
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
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? t("BookingForm.submitting")
              : t("BookingForm.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
