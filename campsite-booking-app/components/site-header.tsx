import Image from "next/image";
import Link from "next/link";

import { siteContent } from "@/lib/content/site-content";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200/80 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center text-lg font-semibold tracking-tight text-stone-900"
        >
          <div className="relative -my-3 h-24 w-24 flex-none overflow-hidden sm:-my-4 sm:h-28 sm:w-28">
            <Image
              src={siteContent.logoDarkPath}
              alt={siteContent.brandName}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 96px, 112px"
            />
          </div>
          <div>
            <p className="brand-title text-[1.95rem] sm:text-[2.35rem]">
              {siteContent.brandName}
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
              Namibian bush campsite
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
