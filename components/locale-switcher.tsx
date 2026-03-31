"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeMeta: Record<
  (typeof routing.locales)[number],
  { flag: string; short: string; nameKey: string }
> = {
  en: { flag: "🇬🇧", short: "EN", nameKey: "english" },
  de: { flag: "🇩🇪", short: "DE", nameKey: "german" },
  fr: { flag: "🇫🇷", short: "FR", nameKey: "french" },
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LocaleSwitcher");
  const current =
    localeMeta[locale as keyof typeof localeMeta] ?? localeMeta.en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full border-stone-200 bg-white/80 px-3 text-stone-700"
          aria-label={t("label")}
        >
          {/*<Languages className="h-4 w-4 text-stone-500 sm:hidden" />*/}
          <span className="text-sm leading-none">{current.flag}</span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] sm:inline">
            {current.short}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("selectLanguage")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale}>
          {routing.locales.map((item) => (
            <DropdownMenuRadioItem
              key={item}
              value={item}
              onSelect={() => router.replace(pathname, { locale: item })}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm leading-none">
                  {localeMeta[item].flag}
                </span>
                <span>{t(localeMeta[item].nameKey)}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
