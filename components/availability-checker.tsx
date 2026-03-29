"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { availabilityQuerySchema } from "@/lib/validation/bookings";

type FormValues = {
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
};

export function AvailabilityChecker() {
  const [result, setResult] = useState<{
    available: boolean;
    availableCount: number;
    totalCount: number;
    requestedUnitCount: number;
    availableUnits: Array<{ id: string; name: string }>;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(availabilityQuerySchema),
    defaultValues: {
      checkInDate: "",
      checkOutDate: "",
      requestedUnitCount: 1,
    },
  });

  async function onSubmit(values: FormValues) {
    setErrorMessage(null);
    setResult(null);

    const search = new URLSearchParams({
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      requestedUnitCount: String(values.requestedUnitCount),
    });
    const response = await fetch(`/api/availability?${search.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      setErrorMessage(payload.error?.message ?? "Availability check failed");
      return;
    }

    setResult(payload.data);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-stone-950">
            Check availability
          </h3>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Check-in
            <Input type="date" {...form.register("checkInDate")} />
            {form.formState.errors.checkInDate ? (
              <span className="text-xs text-red-600">
                {form.formState.errors.checkInDate.message}
              </span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-stone-700">
            Check-out
            <Input type="date" {...form.register("checkOutDate")} />
            {form.formState.errors.checkOutDate ? (
              <span className="text-xs text-red-600">
                {form.formState.errors.checkOutDate.message}
              </span>
            ) : null}
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
          <Button
            type="submit"
            className="sm:col-span-3"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Checking..." : "Check dates"}
          </Button>
        </form>
        {result ? (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${result.available ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            <p className="font-medium">
              {result.available
                ? `${result.availableCount} of ${result.totalCount} campsites are available for these dates.`
                : `Only ${result.availableCount} of ${result.totalCount} campsites are available for these dates.`}
            </p>
            {/*{result.availableUnits.length ? (
              <p className="mt-2 text-xs">
                Available now:{" "}
                {result.availableUnits.map((unit) => unit.name).join(", ")}
              </p>
            ) : null}*/}
          </div>
        ) : null}
        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
