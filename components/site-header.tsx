import Image from "next/image";
import Link from "next/link";

import { siteContent } from "@/lib/content/site-content";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200/80 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-0 text-lg font-semibold tracking-tight text-stone-900 sm:gap-1"
        >
          <div className="-my-4 flex-none overflow-hidden sm:-my-5">
            <Image
              src={siteContent.logoDarkPath}
              alt={siteContent.brandName}
              width={256}
              height={362}
              className="h-auto w-28 object-contain"
              sizes="(max-width: 640px) 112px, 128px"
            />
          </div>
          <div className="-ml-3 sm:-ml-4">
            <p className="brand-title text-[1.95rem] sm:text-[2.35rem]">
              {siteContent.brandName}
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
              Namibian bush accommodation
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
