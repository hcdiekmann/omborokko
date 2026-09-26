"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusEvent, TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const AUTO_SCROLL_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 50;

type HomeGalleryCarouselProps = {
  images: readonly string[];
  alt: string;
};

export function HomeGalleryCarousel({
  images,
  alt,
}: HomeGalleryCarouselProps) {
  const t = useTranslations("Gallery");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setIsDesktop(desktopQuery.matches && !reducedMotionQuery.matches);

    update();
    desktopQuery.addEventListener("change", update);
    reducedMotionQuery.addEventListener("change", update);
    return () => {
      desktopQuery.removeEventListener("change", update);
      reducedMotionQuery.removeEventListener("change", update);
    };
  }, []);

  // Pause while hovered or while keyboard focus is inside the carousel.
  const isAutoScrolling = isDesktop && !isHovered && !hasFocus && images.length > 1;

  // Restarts whenever the slide changes, so manual navigation gets a full interval.
  useEffect(() => {
    if (!isAutoScrolling) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, isAutoScrolling, images.length]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setHasFocus(false);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return;
    }
    setDragOffset(event.touches[0].clientX - touchStartX.current);
  }

  function handleTouchEnd() {
    if (dragOffset <= -SWIPE_THRESHOLD_PX) {
      showNext();
    } else if (dragOffset >= SWIPE_THRESHOLD_PX) {
      showPrevious();
    }
    touchStartX.current = null;
    setDragOffset(0);
  }

  const isDragging = dragOffset !== 0;

  return (
    <div
      className="space-y-2 md:space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={(event) => setHasFocus(event.target.matches(":focus-visible"))}
      onBlur={handleBlur}
    >
      <div
        className="relative touch-pan-y overflow-hidden rounded-xl bg-stone-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className={cn(
            "flex",
            !isDragging && "transition-transform duration-500 ease-out",
          )}
          style={{
            transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
          }}
        >
          {images.map((image) => (
            <div
              key={image}
              className="relative h-[24rem] w-full shrink-0 sm:h-[34rem] lg:h-[40rem]"
            >
              <Image
                src={image}
                alt={alt}
                fill
                draggable={false}
                className="object-cover"
                quality={80}
                sizes="(max-width: 1152px) 100vw, 1152px"
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-950/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-center justify-between px-4 md:flex">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto h-10 w-10 rounded-full bg-white/85 p-0 hover:bg-white"
            onClick={showPrevious}
            aria-label={t("previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto h-10 w-10 rounded-full bg-white/85 p-0 hover:bg-white"
            onClick={showNext}
            aria-label={t("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-center">
        <button
          type="button"
          onClick={showPrevious}
          aria-label={t("previous")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 md:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div aria-hidden="true" className="flex items-center gap-2">
          {images.map((image, index) => (
            <span
              key={image}
              className={cn(
                "h-2.5 rounded-full transition-all",
                activeIndex === index ? "w-8 bg-amber-700" : "w-2.5 bg-stone-300",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={showNext}
          aria-label={t("next")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 md:hidden"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="sr-only" aria-live={isAutoScrolling ? "off" : "polite"}>
        {t("position", { current: activeIndex + 1, total: images.length })}
      </p>
    </div>
  );
}
