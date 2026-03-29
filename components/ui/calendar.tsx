"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        root: "rdp-root",
        months: "flex flex-col gap-4",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center px-2 py-1",
        caption_label: "text-sm font-semibold text-stone-950",
        nav: "absolute inset-x-2 top-2 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "relative z-10 h-8 w-8 rounded-md p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "relative z-10 h-8 w-8 rounded-md p-0 opacity-70 hover:opacity-100",
        ),
        chevron: "pointer-events-none h-4 w-4",
        month_grid: "w-full border-collapse px-2",
        weekdays: "mt-2 flex",
        weekday: "w-9 text-center text-[0.8rem] font-medium text-stone-600",
        week: "mt-2 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm text-stone-800",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-9 w-9 rounded-md p-0 font-normal text-stone-800 hover:bg-stone-100 hover:text-stone-950 aria-selected:opacity-100",
        ),
        selected:
          "rounded-md bg-amber-700 text-white hover:bg-amber-700 hover:text-white focus:bg-amber-700 focus:text-white",
        day_range_start:
          "day-range-start rounded-md bg-amber-700 text-white hover:bg-amber-700 hover:text-white focus:bg-amber-700 focus:text-white",
        day_range_end:
          "day-range-end rounded-md bg-amber-700 text-white hover:bg-amber-700 hover:text-white focus:bg-amber-700 focus:text-white",
        range_middle:
          "rounded-none aria-selected:bg-amber-100 aria-selected:text-stone-900",
        today: "text-stone-950 font-semibold",
        outside: "text-stone-400 opacity-60",
        disabled: "text-stone-300 opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ className, ...buttonProps }) => (
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "relative z-10 h-8 w-8 rounded-md p-0 opacity-70 hover:opacity-100",
              className,
            )}
            {...buttonProps}
          >
            <ChevronLeft className="pointer-events-none h-4 w-4" />
          </button>
        ),
        NextMonthButton: ({ className, ...buttonProps }) => (
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "relative z-10 h-8 w-8 rounded-md p-0 opacity-70 hover:opacity-100",
              className,
            )}
            {...buttonProps}
          >
            <ChevronRight className="pointer-events-none h-4 w-4" />
          </button>
        ),
      }}
      {...props}
    />
  );
}
