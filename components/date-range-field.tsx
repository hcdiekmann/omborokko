"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isBefore,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BOOKING_MONTHS_AHEAD,
  getNightStatus,
  useNightAvailability,
} from "@/features/bookings/client/night-availability";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils/cn";

type DateRangeValue = { checkInDate: string; checkOutDate: string };

type DateRangeFieldProps = {
  checkInDate: string;
  checkOutDate: string;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  label?: string;
  startLabel?: string;
  endLabel?: string;
  error?: string;
  requestedUnitCount?: number;
  onAvailabilityError?: (message: string | null) => void;
  /**
   * When true (default), full nights cannot be picked and a stay cannot span
   * a full night. Admin tools set this to false to still see availability
   * while being free to select any dates.
   */
  enforceAvailability?: boolean;
};

const MONTHS_AHEAD = BOOKING_MONTHS_AHEAD;
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";
const SWIPE_DISMISS_DISTANCE = 120;
const SWIPE_DISMISS_VELOCITY = 0.6;

const datePickerLocales = {
  en: enUS,
  af,
  de,
  es,
  fr,
  it
} as const;

const EMPTY_RANGE: DateRangeValue = { checkInDate: "", checkOutDate: "" };

function toRange({ checkInDate, checkOutDate }: DateRangeValue): DateRange | undefined {
  if (!checkInDate) return undefined;

  return {
    from: parseISO(checkInDate),
    to: checkOutDate ? parseISO(checkOutDate) : undefined,
  };
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function rangeIncludesFullNight({ checkInDate, checkOutDate }: DateRangeValue, fullNights: Set<string>) {
  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) return false;

  let cursor = parseISO(checkInDate);
  const departure = parseISO(checkOutDate);

  while (isBefore(cursor, departure)) {
    if (fullNights.has(toIsoDate(cursor))) return true;
    cursor = addDays(cursor, 1);
  }

  return false;
}

/**
 * Airbnb-style selection: the first tap sets check-in, the second sets
 * check-out. Tapping on or before check-in moves check-in instead, and any tap
 * after a complete range starts a new one.
 */
function nextSelection(current: DateRangeValue, day: Date): DateRangeValue {
  const isoDate = toIsoDate(day);

  if (!current.checkInDate || current.checkOutDate || isoDate <= current.checkInDate) {
    return { checkInDate: isoDate, checkOutDate: "" };
  }

  return { checkInDate: current.checkInDate, checkOutDate: isoDate };
}

function hapticTick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(8);
  }
}

export function DateRangeField({
  checkInDate,
  checkOutDate,
  onChange,
  className,
  label = "Stay dates",
  startLabel,
  endLabel,
  error,
  requestedUnitCount = 1,
  onAvailabilityError,
  enforceAvailability = true,
}: DateRangeFieldProps) {
  const locale = useLocale();
  const t = useTranslations("DateRangeField");
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const dateFnsLocale = datePickerLocales[locale as keyof typeof datePickerLocales] ?? enUS;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(EMPTY_RANGE);
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ y: number; time: number } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => startOfToday(), []);
  const firstMonth = startOfMonth(today);
  const lastMonth = addMonths(firstMonth, MONTHS_AHEAD - 1);
  const [month, setMonth] = useState(() =>
    startOfMonth(checkInDate ? parseISO(checkInDate) : today)
  );

  const committed = useMemo(
    () => ({ checkInDate, checkOutDate }),
    [checkInDate, checkOutDate]
  );
  // Desktop edits the form value live; the mobile sheet edits a draft that is
  // only committed on "Save" (dismissing the sheet discards it).
  const working = isDesktop ? committed : draft;

  // Loaded on mount (not on first open) so the calendar is usually ready by
  // the time it is opened; the query cache shares it across pickers.
  const { data: nights = [], isLoading: isLoadingAvailability } = useNightAvailability();

  const fullNights = useMemo(
    () =>
      new Set(
        nights
          .filter((night) => getNightStatus(night, requestedUnitCount) === "full")
          .map((night) => night.night_date)
      ),
    [nights, requestedUnitCount]
  );
  const limitedDates = useMemo(
    () =>
      nights
        .filter((night) => getNightStatus(night, requestedUnitCount) === "limited")
        .map((night) => parseISO(night.night_date)),
    [nights, requestedUnitCount]
  );
  const fullDates = useMemo(
    () => [...fullNights].map((night) => parseISO(night)),
    [fullNights]
  );

  const committedAvailabilityError =
    enforceAvailability && rangeIncludesFullNight(committed, fullNights)
      ? t("rangeUnavailable")
      : null;
  const workingAvailabilityError =
    enforceAvailability && rangeIncludesFullNight(working, fullNights)
      ? t("rangeUnavailable")
      : null;
  const visibleError = error ?? committedAvailabilityError;

  useEffect(() => {
    onAvailabilityError?.(committedAvailabilityError);
  }, [onAvailabilityError, committedAvailabilityError]);

  const awaitingCheckOut = Boolean(working.checkInDate && !working.checkOutDate);

  // Once check-in is chosen, the stay may not run through the next full night
  // (checking out on the morning of that night is fine).
  const checkOutLimit = useMemo(() => {
    if (!enforceAvailability || !awaitingCheckOut) return null;
    let limit: string | null = null;
    for (const night of fullNights) {
      if (night >= working.checkInDate && (!limit || night < limit)) limit = night;
    }
    return limit;
  }, [awaitingCheckOut, enforceAvailability, fullNights, working.checkInDate]);

  const isDateDisabled = useCallback(
    (date: Date) => {
      if (isBefore(date, today)) return true;
      if (!enforceAvailability) return false;

      const isoDate = toIsoDate(date);
      if (awaitingCheckOut && isoDate > working.checkInDate) {
        return Boolean(checkOutLimit && isoDate > checkOutLimit);
      }
      if (awaitingCheckOut && isoDate === working.checkInDate) return false;
      return fullNights.has(isoDate);
    },
    [awaitingCheckOut, checkOutLimit, enforceAvailability, fullNights, today, working.checkInDate]
  );

  const isInHoverPreview = useCallback(
    (date: Date) => {
      if (!awaitingCheckOut || !hoveredDate) return false;
      const isoDate = toIsoDate(date);
      return isoDate > working.checkInDate && isoDate <= toIsoDate(hoveredDate) && !isDateDisabled(date);
    },
    [awaitingCheckOut, hoveredDate, isDateDisabled, working.checkInDate]
  );

  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const monthYearFormatter = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
  const longFormatter = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const formatShort = (isoDate: string) => {
    const date = parseISO(isoDate);
    return (date.getFullYear() === today.getFullYear() ? monthFormatter : monthYearFormatter).format(date);
  };

  const nightCount =
    working.checkInDate && working.checkOutDate
      ? differenceInCalendarDays(parseISO(working.checkOutDate), parseISO(working.checkInDate))
      : 0;
  const summaryTitle = nightCount
    ? t("nights", { count: nightCount })
    : awaitingCheckOut
      ? t("selectCheckOut")
      : t("selectCheckIn");
  const summaryDetail = working.checkInDate
    ? `${formatShort(working.checkInDate)} – ${working.checkOutDate ? formatShort(working.checkOutDate) : t("addDate")}`
    : t("rangeHint");

  const weekdayLabels = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { locale: dateFnsLocale });
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(weekStart, index);
      return {
        short: format(day, "EEEEE", { locale: dateFnsLocale }),
        long: format(day, "EEEE", { locale: dateFnsLocale }),
      };
    });
  }, [dateFnsLocale]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(committed);
      setDragOffset(0);
      setMonth(startOfMonth(checkInDate ? parseISO(checkInDate) : today));
    } else {
      setHoveredDate(undefined);
    }
    setOpen(nextOpen);
  }

  function selectDay(day: Date) {
    const next = nextSelection(working, day);
    if (isDesktop) {
      onChange(next);
    } else {
      hapticTick();
      setDraft(next);
    }
  }

  function clearSelection() {
    if (isDesktop) {
      onChange(EMPTY_RANGE);
    } else {
      setDraft(EMPTY_RANGE);
    }
  }

  function saveDraft() {
    onChange(draft);
    setOpen(false);
  }

  // Scroll the mobile month list so the selected (or current) month is in view.
  useEffect(() => {
    if (!open || isDesktop) return;

    const frame = requestAnimationFrame(() => {
      const container = scrollAreaRef.current;
      if (!container) return;
      const anchor = checkInDate ? parseISO(checkInDate) : today;
      const index = Math.min(
        Math.max(differenceInCalendarMonths(anchor, firstMonth), 0),
        MONTHS_AHEAD - 1
      );
      const monthElement = container.querySelectorAll<HTMLElement>(".rdp-month-item")[index];
      container.scrollTop = monthElement ? monthElement.offsetTop - 8 : 0;
    });

    return () => cancelAnimationFrame(frame);
    // Only when the sheet opens, not on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDesktop]);

  function handleDragStart(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    dragStart.current = { y: event.clientY, time: event.timeStamp };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    setDragOffset(Math.max(0, event.clientY - dragStart.current.y));
  }

  function handleDragEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const distance = Math.max(0, event.clientY - dragStart.current.y);
    const velocity = distance / Math.max(1, event.timeStamp - dragStart.current.time);
    dragStart.current = null;
    setIsDragging(false);

    if (distance > SWIPE_DISMISS_DISTANCE || (distance > 24 && velocity > SWIPE_DISMISS_VELOCITY)) {
      handleOpenChange(false);
    } else {
      setDragOffset(0);
    }
  }

  const availabilityModifiers = {
    limited: limitedDates,
    ...(enforceAvailability ? {} : { full: fullDates }),
    preview: isInHoverPreview,
  };
  const availabilityModifierClassNames = {
    limited:
      "after:pointer-events-none after:absolute after:bottom-[14%] after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-amber-500",
    full:
      "after:pointer-events-none after:absolute after:bottom-[14%] after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-red-500",
    preview: "bg-stone-100/70",
  };

  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {t("limited")}
      </span>
      {enforceAvailability ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-stone-300 line-through">12</span>
          {t("unavailable")}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {t("full")}
        </span>
      )}
      {isLoadingAvailability ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-stone-500">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
          {t("loadingAvailability")}
        </span>
      ) : null}
    </div>
  );

  const summary = (
    <div aria-live="polite" className="min-w-0">
      <p className="text-xl font-semibold tracking-tight text-stone-950">{summaryTitle}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm",
          workingAvailabilityError ? "text-red-600" : "text-stone-500"
        )}
      >
        {workingAvailabilityError ?? summaryDetail}
      </p>
    </div>
  );

  const checkInText = checkInDate ? formatShort(checkInDate) : t("addDate");
  const checkOutText = checkOutDate ? formatShort(checkOutDate) : t("addDate");
  const resolvedStartLabel = startLabel ?? t("checkIn");
  const resolvedEndLabel = endLabel ?? t("checkOut");
  const triggerAriaLabel = checkInDate
    ? `${resolvedStartLabel}: ${longFormatter.format(parseISO(checkInDate))}. ${resolvedEndLabel}: ${
        checkOutDate ? longFormatter.format(parseISO(checkOutDate)) : t("addDate")
      }`
    : t("placeholder");

  const trigger = (
    <button
      type="button"
      aria-label={triggerAriaLabel}
      className={cn(
        "grid h-14 w-full grid-cols-2 overflow-hidden rounded-2xl border bg-white text-left transition-colors",
        "hover:border-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2",
        open ? "border-stone-950 ring-1 ring-stone-950" : "border-stone-300",
        visibleError && !open && "border-red-400"
      )}
    >
      <span className="flex min-w-0 flex-col justify-center px-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          {resolvedStartLabel}
        </span>
        <span className={cn("truncate text-sm", checkInDate ? "text-stone-950" : "text-stone-500")}>
          {checkInText}
        </span>
      </span>
      <span className="flex min-w-0 flex-col justify-center border-l border-stone-300 px-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
          {resolvedEndLabel}
        </span>
        <span className={cn("truncate text-sm", checkOutDate ? "text-stone-950" : "text-stone-500")}>
          {checkOutText}
        </span>
      </span>
    </button>
  );

  const sharedCalendarProps = {
    mode: "range" as const,
    locale: dateFnsLocale,
    selected: toRange(working),
    onSelect: (_range: DateRange | undefined, triggerDate: Date) => selectDay(triggerDate),
    disabled: isDateDisabled,
    startMonth: firstMonth,
    endMonth: lastMonth,
    modifiers: availabilityModifiers,
    modifiersClassNames: availabilityModifierClassNames,
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-stone-700">
        {label === "Stay dates" ? t("label") : label}
      </div>

      {isDesktop ? (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={10}
            collisionPadding={16}
            className="w-auto rounded-[1.75rem] p-6 shadow-2xl"
            onMouseLeave={() => setHoveredDate(undefined)}
          >
            <div className="mb-5 flex items-start justify-between gap-6">
              {summary}
            </div>
            <Calendar
              {...sharedCalendarProps}
              numberOfMonths={2}
              month={month}
              onMonthChange={(nextMonth) => setMonth(startOfMonth(nextMonth))}
              onDayMouseEnter={(date) => setHoveredDate(date)}
              classNames={{ month: "w-[19.25rem] space-y-3" }}
            />
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-stone-200 pt-4">
              {legend}
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3 font-semibold underline underline-offset-4 hover:bg-stone-100"
                  disabled={!working.checkInDate}
                  onClick={clearSelection}
                >
                  {t("clear")}
                </Button>
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  {t("close")}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            className="h-[calc(100dvh-max(env(safe-area-inset-top),0.75rem)-0.5rem)]"
            style={
              {
                "--sheet-drag-offset": `${dragOffset}px`,
                transform: dragOffset ? `translate3d(0, ${dragOffset}px, 0)` : undefined,
                transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)",
              } as React.CSSProperties
            }
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <div
              className="shrink-0 touch-none select-none border-b border-stone-200 px-4 pb-2"
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
            >
              <div className="flex justify-center pb-1 pt-2.5">
                <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-stone-300" />
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 pt-1">
                  <SheetTitle asChild>{summary}</SheetTitle>
                  <SheetDescription className="sr-only">{t("rangeHint")}</SheetDescription>
                </div>
                <button
                  type="button"
                  aria-label={t("close")}
                  className="-mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div aria-hidden="true" className="mt-3 flex">
                {weekdayLabels.map((weekday) => (
                  <span
                    key={weekday.long}
                    className="flex-1 text-center text-xs font-semibold text-stone-500"
                  >
                    {weekday.short}
                  </span>
                ))}
              </div>
            </div>

            <div
              ref={scrollAreaRef}
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-2 [-webkit-overflow-scrolling:touch]"
            >
              <Calendar
                {...sharedCalendarProps}
                numberOfMonths={MONTHS_AHEAD}
                defaultMonth={firstMonth}
                hideNavigation
                hideWeekdays
                classNames={{
                  months: "flex flex-col gap-4",
                  month: "rdp-month-item w-full space-y-2",
                  month_caption: "flex h-11 items-end px-2 pb-1",
                }}
              />
            </div>

            <div className="shrink-0 border-t border-stone-200 bg-white px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
              <div className="mb-3">{legend}</div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="-ml-2 rounded-lg px-2 py-2 text-sm font-semibold text-stone-950 underline underline-offset-4 transition-colors hover:bg-stone-100 disabled:text-stone-400"
                  disabled={!draft.checkInDate}
                  onClick={clearSelection}
                >
                  {t("clear")}
                </button>
                <Button
                  type="button"
                  size="lg"
                  className="min-w-32 rounded-xl px-7 text-base font-semibold"
                  disabled={awaitingCheckOut || Boolean(workingAvailabilityError)}
                  onClick={saveDraft}
                >
                  {t("save")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {visibleError ? <p className="text-xs text-red-600">{visibleError}</p> : null}
    </div>
  );
}
