"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteContent } from "@/lib/content/site-content";
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
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(createBookingRequestSchema),
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
      const message = payload.error?.message ?? "Booking request failed";
      form.setError("root", { message });
      return;
    }

    const reference = payload.data.booking.booking_reference;
    router.push(
      `/booking/request/success?reference=${encodeURIComponent(reference)}`,
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-stone-950">
            Submit booking request
          </h3>
        </div>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Check-in
            <Input type="date" {...form.register("checkInDate")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Check-out
            <Input type="date" {...form.register("checkOutDate")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Campsites needed
            <Input
              type="number"
              min={1}
              max={4}
              {...form.register("requestedUnitCount", { valueAsNumber: true })}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            First name
            <Input {...form.register("guestFirstName")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Last name
            <Input {...form.register("guestLastName")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Email
            <Input type="email" {...form.register("guestEmail")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Phone
            <Input {...form.register("guestPhone")} />
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Adults (16+)
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
            Children (8-15)
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
            Notes
            <Textarea {...form.register("notes")} />
          </label>
          {form.formState.errors.root ? (
            <p className="sm:col-span-2 text-sm text-red-600">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button
            type="submit"
            className="sm:col-span-2"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Submitting..." : "Request booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
