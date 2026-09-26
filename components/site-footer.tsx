import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { ExternalLink, Star } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { MountainRidge } from "@/components/mountain-ridge";
import { siteContent } from "@/lib/content/site-content";
import { Separator } from "./ui/separator";

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

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-stone-200 bg-gradient-to-r from-amber-50 via-stone-50 to-orange-100/70">
      <MountainRidge />
      <div className="relative mx-auto flex max-w-6xl flex-col px-4 py-6 text-sm text-stone-600 sm:px-6 md:grid md:grid-cols-[auto_auto] md:justify-between md:gap-x-8 md:gap-y-3">
        <div className="flex items-center md:col-start-1 md:row-start-1 md:self-center">
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
              {t("Site.brandTagline")}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-xs text-stone-600 md:col-start-1 md:row-start-2 md:gap-2 md:self-end md:pl-[4.75rem]">
          <address className="not-italic">Farm Omihe 127</address>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href="tel:+264817068051"
              className="w-fit transition hover:text-stone-900"
            >
              +264 (0) 81 706 8051
            </a>
            <a
              href="https://wa.me/264817068051"
              target="_blank"
              rel="noreferrer"
              aria-label={t("Footer.whatsappLabel")}
              className="inline-flex w-fit items-center gap-1 text-stone-500 transition hover:text-stone-900"
            >
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
          </div>
          <a
            href="https://maps.google.com/?q=Omborokko+Safaris"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-xs uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-900"
          >
            <span>{t("Footer.directions")}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <a
          href="https://g.page/r/CX5GoEWHNEH8EBM/review"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex w-fit h-9 items-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-900 transition hover:border-stone-950 md:col-start-2 md:row-start-1 md:mt-0 md:self-center md:justify-self-center"
        >
          <GoogleIcon />
          <span className="inline-flex items-center gap-0">
            <span>{t("Footer.reviewPrefix")}</span>
            <Star className="mr-1 h-4 w-4 fill-amber-500 text-amber-500" />
            <span>{t("Footer.reviewSuffix")}</span>
          </span>

          {/*<ExternalLink className="h-4 w-4 text-stone-500" />*/}
        </a>
        <div className="mt-3 flex flex-col gap-3 md:col-start-2 md:row-start-2 md:mt-0 md:self-end">
          <Separator />
          <div className="flex flex-col gap-3 md:items-center md:gap-2">
            <p className="text-xs text-stone-500">{t("Footer.copyright", { year })}</p>
            <NextLink
              href="/admin"
              className="inline-flex w-fit text-xs text-stone-400 transition hover:text-stone-600"
            >
              {t("Footer.admin")}
            </NextLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
