import Image from "next/image";
import Link from "next/link";

import { siteContent } from "@/lib/content/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 text-sm text-stone-600 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 flex-none overflow-hidden">
            <Image
              src={siteContent.logoDarkPath}
              alt={siteContent.brandName}
              fill
              className="object-contain"
              sizes="64px"
            />
          </div>
          <div>
            <p className="brand-title text-xl text-stone-900">
              {siteContent.brandName}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">
              Namibian Bush Accommodation
            </p>
          </div>
        </div>
        <div className="space-y-1"></div>
        <Link href="/admin" className="inline-flex w-fit ">
          Admin Dashboard
        </Link>
      </div>
    </footer>
  );
}
