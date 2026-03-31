import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { siteContent } from "@/lib/content/site-content";

export function SiteHeader() {
  const t = useTranslations("Site");

  return (
    <header className="border-b border-stone-200/80 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-0 text-lg font-semibold tracking-tight text-stone-900 sm:gap-1"
        >
          <div className="-my-3 flex-none overflow-hidden sm:-my-5">
            <Image
              src={siteContent.logoDarkPath}
              alt={siteContent.brandName}
              width={256}
              height={362}
              className="h-auto w-20 object-contain sm:w-28"
              sizes="(max-width: 640px) 80px, 112px"
            />
          </div>
          <div className="-ml-2 sm:-ml-4">
            <p className="brand-title text-[1.55rem] sm:text-[2.35rem]">
              {siteContent.brandName}
            </p>
            <p className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.12em] text-stone-500 sm:text-xs sm:tracking-[0.18em]">
              {t("brandTagline")}
            </p>
          </div>
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
