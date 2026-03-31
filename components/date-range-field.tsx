"use client";

import { CalendarIcon } from "lucide-react";
import { format, parseISO, startOfToday } from "date-fns";
import { af, de, enUS, es, fr, it } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  PopoverClose,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

type DateRangeFieldProps = {
  checkInDate: string;
  checkOutDate: string;
  onChange: (value: { checkInDate: string; checkOutDate: string }) => void;
  className?: string;
  label?: string;
  error?: string;
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
}: DateRangeFieldProps) {
  const locale = useLocale();
  const t = useTranslations("DateRangeField");
  const selectedRange = toRange(checkInDate, checkOutDate);
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const rangeLabel = checkInDate
    ? checkOutDate
      ? `${formatter.format(parseISO(checkInDate))} - ${formatter.format(parseISO(checkOutDate))}`
      : formatter.format(parseISO(checkInDate))
    : t("placeholder");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-stone-700">
        {label === "Stay dates" ? t("label") : label}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-full items-center justify-start rounded-2xl border border-stone-300 bg-white px-4 text-left text-sm font-normal text-stone-900 transition-colors hover:bg-stone-50 hover:border-stone-950",
              !checkInDate && "text-stone-500",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {rangeLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={10}
          className="w-auto rounded-md p-4 shadow-xl"
        >
          <Calendar
            mode="range"
            locale={datePickerLocales[locale as keyof typeof datePickerLocales] ?? enUS}
            numberOfMonths={1}
            selected={selectedRange}
            min={1}
            disabled={{ before: startOfToday() }}
            defaultMonth={selectedRange?.from ?? startOfToday()}
            onSelect={(range) => {
              onChange({
                checkInDate: range?.from
                  ? format(range.from, "yyyy-MM-dd")
                  : "",
                checkOutDate: range?.to ? format(range.to, "yyyy-MM-dd") : "",
              });
            }}
          />
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
            <PopoverClose asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
              >
                {t("done")}
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
