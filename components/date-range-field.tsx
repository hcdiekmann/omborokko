"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, addMonths, format, isBefore, parseISO, startOfMonth, startOfToday } from "date-fns";
import { af, de, enUS, es, fr, it } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

export type NightAvailabilityStatus = "available" | "limited" | "full";

export type NightAvailability = {
  night_date: string;
  available_count: number;
  total_count: number;
  requested_unit_count: number;
  availability_status: NightAvailabilityStatus;
};

type DateRangeFieldProps = {
  checkInDate: string;
  checkOutDate: string;
  onChange: (value: { checkInDate: string; checkOutDate: string }) => void;
  className?: string;
  label?: string;
  error?: string;
  requestedUnitCount?: number;
  onAvailabilityError?: (message: string | null) => void;
};

function toRange(
  checkInDate: string,
  checkOutDate: string,
): DateRange | undefined {
  if (!checkInDate) return undefined;

  return {
    from: parseISO(checkInDate),
    to: checkOutDate ? parseISO(checkOutDate) : undefined,
  };
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function rangeIncludesFullNight(checkInDate: string, checkOutDate: string, nightsByDate: Map<string, NightAvailability>) {
  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) return false;

  let cursor = parseISO(checkInDate);
  const departure = parseISO(checkOutDate);

  while (isBefore(cursor, departure)) {
    const night = nightsByDate.get(toIsoDate(cursor));
    if (night?.availability_status === "full") return true;
    cursor = addDays(cursor, 1);
  }

  return false;
}

const datePickerLocales = {
  en: enUS,
  af,
  de,
  es,
  fr,
  it
} as const;

export function DateRangeField({
  checkInDate,
  checkOutDate,
  onChange,
  className,
  label = "Stay dates",
  error,
  requestedUnitCount = 1,
  onAvailabilityError,
}: DateRangeFieldProps) {
  const locale = useLocale();
  const t = useTranslations("DateRangeField");
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(checkInDate ? parseISO(checkInDate) : startOfToday()));
  const [nights, setNights] = useState<NightAvailability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const selectedRange = toRange(checkInDate, checkOutDate);
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const nightsByDate = useMemo(
    () => new Map(nights.map((night) => [night.night_date, night])),
    [nights]
  );
  const rangeAvailabilityError = rangeIncludesFullNight(checkInDate, checkOutDate, nightsByDate)
    ? t("rangeUnavailable")
    : null;
  const fullDates = nights
    .filter((night) => night.availability_status === "full")
    .map((night) => parseISO(night.night_date));
  const limitedDates = nights
    .filter((night) => night.availability_status === "limited")
    .map((night) => parseISO(night.night_date));
  const rangeLabel = checkInDate
    ? checkOutDate
      ? `${formatter.format(parseISO(checkInDate))} - ${formatter.format(parseISO(checkOutDate))}`
      : `${formatter.format(parseISO(checkInDate))} - ${t("selectDeparture")}`
    : t("placeholder");
  const hasCompleteRange = Boolean(checkInDate && checkOutDate);
  const visibleError = error ?? rangeAvailabilityError;

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const startDate = toIsoDate(startOfMonth(month));
    const endDate = toIsoDate(addMonths(startOfMonth(month), 2));
    const search = new URLSearchParams({
      startDate,
      endDate,
      requestedUnitCount: String(requestedUnitCount)
    });

    setIsLoadingAvailability(true);
    fetch(`/api/availability/calendar?${search.toString()}`, { signal: controller.signal })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) return;
        setNights(payload.data?.nights ?? []);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setNights([]);
      })
      .finally(() => setIsLoadingAvailability(false));

    return () => controller.abort();
  }, [month, open, requestedUnitCount]);

  useEffect(() => {
    onAvailabilityError?.(rangeAvailabilityError);
  }, [onAvailabilityError, rangeAvailabilityError]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-stone-700">
        {label === "Stay dates" ? t("label") : label}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-full items-center justify-start rounded-2xl border border-stone-300 bg-white px-4 text-left text-sm font-normal text-stone-900 transition-colors hover:bg-stone-50 hover:border-stone-950",
              !checkInDate && "text-stone-500",
              visibleError && "border-red-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {rangeLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={10}
          className="w-[min(24rem,calc(100vw-2rem))] rounded-md p-3 shadow-xl sm:w-auto sm:p-4"
        >
          <Calendar
            mode="range"
            locale={datePickerLocales[locale as keyof typeof datePickerLocales] ?? enUS}
            numberOfMonths={1}
            selected={selectedRange}
            min={1}
            disabled={{ before: startOfToday() }}
            defaultMonth={selectedRange?.from ?? startOfToday()}
            month={month}
            onMonthChange={(nextMonth) => setMonth(startOfMonth(nextMonth))}
            modifiers={{ full: fullDates, limited: limitedDates }}
            modifiersClassNames={{
              full: "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-red-500",
              limited: "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-amber-500"
            }}
            onSelect={(range) => {
              onChange({
                checkInDate: range?.from ? toIsoDate(range.from) : "",
                checkOutDate: range?.to ? toIsoDate(range.to) : "",
              });
            }}
          />
          <div className="mt-3 space-y-2 px-1 text-xs text-stone-600">
            <p>{isLoadingAvailability ? t("loadingAvailability") : t("rangeHint")}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="h-2 w-2 rounded-full bg-amber-500" />{t("limited")}</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="h-2 w-2 rounded-full bg-red-500" />{t("full")}</span>
            </div>
          </div>
          {rangeAvailabilityError ? <p className="mt-2 px-1 text-xs text-red-600">{rangeAvailabilityError}</p> : null}
          <div className="mt-4 flex justify-end gap-2 border-t border-stone-200 px-1 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-stone-600 hover:text-stone-950"
              onClick={() =>
                onChange({
                  checkInDate: "",
                  checkOutDate: "",
                })
              }
            >
              {t("clear")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              disabled={!hasCompleteRange || Boolean(rangeAvailabilityError)}
              title={!hasCompleteRange ? t("doneDisabled") : rangeAvailabilityError ?? undefined}
              onClick={() => setOpen(false)}
            >
              {t("done")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {visibleError ? <p className="text-xs text-red-600">{visibleError}</p> : null}
    </div>
  );
}
