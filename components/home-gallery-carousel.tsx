"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type HomeGalleryCarouselProps = {
  images: readonly string[];
  alt: string;
};

export function HomeGalleryCarousel({
  images,
  alt,
}: HomeGalleryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-100">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
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
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-950/30 to-transparent" />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10 w-10 rounded-full bg-white/85 p-0 hover:bg-white"
            onClick={showPrevious}
            aria-label="Show previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10 w-10 rounded-full bg-white/85 p-0 hover:bg-white"
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
