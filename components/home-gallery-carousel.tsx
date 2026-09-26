"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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

  // Restarts whenever the slide changes, so manual navigation gets a full interval.
  useEffect(() => {
    if (!isDesktop || isPaused || images.length < 2) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, isDesktop, isPaused, images.length]);

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
    <div className="space-y-4">
      <div
        className="relative touch-pan-y overflow-hidden rounded-xl bg-stone-100"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
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
                sizes="(max-width: 768px) 100vw, 1200px"
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
            aria-label="Show previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto h-10 w-10 rounded-full bg-white/85 p-0 hover:bg-white"
            onClick={showNext}
            aria-label="Show next image"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show image ${index + 1}`}
            className={cn(
              "h-2.5 rounded-full transition-all",
              activeIndex === index
                ? "w-8 bg-amber-700"
                : "w-2.5 bg-stone-300 hover:bg-stone-400",
            )}
          />
        ))}
      </div>
    </div>
  );
}
