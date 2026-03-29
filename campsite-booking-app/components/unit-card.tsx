import Image from "next/image";
import Link from "next/link";

import { siteContent } from "@/lib/content/site-content";
import type { Tables } from "@/types/database";

export function UnitCard({ unit }: { unit: Tables<"campsite_units"> }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="relative h-56">
        <Image
          src={unit.cover_image_url || "/images/campsite/hero-river-view.webp"}
          alt={unit.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-stone-950">{unit.name}</h3>
          <p className="text-sm leading-6 text-stone-600">{unit.short_description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-stone-700">
          <span className="rounded-full bg-stone-100 px-3 py-1">Max {unit.max_guests} guests</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">Adults N$ {unit.base_price_per_night}/night</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">Children N$ {unit.child_price_per_night}/night</span>
        </div>
        <p className="text-xs text-stone-500">
          {siteContent.pricing.adultLabel}: N$ {siteContent.pricing.adultRate} · {siteContent.pricing.childLabel}: N$ {siteContent.pricing.childRate}
        </p>
        <Link
          href={`/units/${unit.slug}`}
          className="inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
        >
          View campsite
        </Link>
      </div>
    </article>
  );
}
