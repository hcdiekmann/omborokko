"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-800 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 disabled:pointer-events-none disabled:opacity-30";

/**
 * Airbnb-style calendar: circular day buttons, black start/end markers and a
 * continuous band across the selected range. The day cell carries the range
 * band and styles its day button (the circle) through `[&>button]` variants.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("relative", className)}
      classNames={{
        root: "rdp-root",
        months: "relative flex flex-col gap-8 md:flex-row md:gap-10",
        month: "w-full space-y-3",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "text-base font-semibold text-stone-950",
        nav: "absolute inset-x-0 top-0 z-10 flex items-center justify-between",
        button_previous: navButtonClassName,
        button_next: navButtonClassName,
        chevron: "pointer-events-none h-4 w-4",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 pb-2 text-center text-xs font-semibold text-stone-500",
        week: "mt-0.5 flex w-full",
        day: "relative flex-1 p-0 text-center",
        day_button: cn(
          "relative mx-auto flex aspect-square w-full max-w-12 items-center justify-center rounded-full text-[15px] font-medium text-stone-900 outline-none transition-colors",
          "[@media(hover:hover)]:hover:ring-[1.5px] [@media(hover:hover)]:hover:ring-inset [@media(hover:hover)]:hover:ring-stone-950 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-950",
        ),
        selected: "rdp-selected [&>button]:bg-stone-950 [&>button]:text-white",
        range_start:
          "rdp-range-start bg-gradient-to-r from-transparent from-50% to-stone-100 to-50%",
        range_end:
          "rdp-range-end bg-gradient-to-l from-transparent from-50% to-stone-100 to-50%",
        range_middle:
          "rdp-range-middle bg-stone-100 [&.rdp-range-middle>button]:bg-transparent [&.rdp-range-middle>button]:text-stone-950",
        today: "rdp-today [&>button]:underline [&>button]:decoration-2 [&>button]:underline-offset-4",
        outside: "rdp-outside opacity-40",
        disabled:
          "rdp-disabled [&>button]:cursor-not-allowed [&>button]:text-stone-300 [&>button]:line-through [&>button:hover]:ring-0",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", chevronClassName)} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", chevronClassName)} />
          ),
      }}
      {...props}
    />
  );
}
