import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";

import { siteContent } from "@/lib/content/site-content";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M21.805 12.227c0-.678-.061-1.33-.174-1.955H12v3.698h5.498a4.703 4.703 0 0 1-2.04 3.086v2.563h3.302c1.932-1.779 3.045-4.4 3.045-7.392Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.074-.915 6.765-2.48l-3.302-2.563c-.915.614-2.086.977-3.463.977-2.661 0-4.916-1.797-5.723-4.214H2.864v2.644A10.22 10.22 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.277 13.72A6.145 6.145 0 0 1 5.957 12c0-.598.109-1.179.32-1.72V7.636H2.864A10.22 10.22 0 0 0 1.818 12c0 1.636.392 3.186 1.046 4.364l3.413-2.644Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.065c1.5 0 2.846.516 3.907 1.53l2.93-2.93C17.07 2.99 14.756 2 12 2a10.22 10.22 0 0 0-9.136 5.636l3.413 2.644C7.084 7.862 9.339 6.065 12 6.065Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 text-sm text-stone-600 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-none overflow-hidden">
            <Image
              src={siteContent.logoDarkPath}
              alt={siteContent.brandName}
              width={256}
              height={362}
              className="h-auto w-16 object-contain"
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
        <div className="flex flex-col gap-3 md:items-center">
          <a
            href="https://g.page/r/CX5GoEWHNEH8EBM/review"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-900 transition hover:border-stone-950"
          >
            <GoogleIcon />
            <span className="inline-flex items-center gap-0">
              <span>Leave us a 5-</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-0.5" />
              <span>review</span>
            </span>

            <ExternalLink className="h-4 w-4 text-stone-500" />
          </a>
          <Link href="/admin" className="inline-flex w-fit">
            Admin Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
