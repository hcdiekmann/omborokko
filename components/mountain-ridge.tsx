import { cn } from "@/lib/utils/cn";

type MountainRidgeProps = {
  className?: string;
};

// Decorative Namibian skyline (table mountain, koppie, dome, twin peaks over calm
// dunes), pinned to the bottom of the nearest positioned parent.
export function MountainRidge({ className }: MountainRidgeProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className={cn("absolute inset-x-0 bottom-0 h-14 w-full sm:h-16", className)}
      >
        <path
          d="M0 80V50L30 48Q60 46 90 47L92.1 47.1Q120 48 147.5 43L161.2 40.5Q175 38 187.7 32.1L195.9 28.2Q205 24 215 23.8L288 22.3Q300 22 311.1 26.5L318.9 29.5Q330 34 341.4 37.8L345 39Q360 44 375.8 43.1L410 41.1Q430 40 448.5 32.3L490.4 14.9Q495 13 499.7 14.6L530.7 25.1Q545 30 560 28.5L565 28Q575 27 584.7 29.5L611 36.4Q640 44 670 45L670 45Q700 46 729.9 43L730 43Q760 40 789.6 34.1L795 33Q830 26 865 33L875.4 35.1Q900 40 925 42L925 42Q950 44 973 34L999.5 22.4Q1005 20 1010.7 21.9L1027.4 27.5Q1035 30 1042.8 28.3L1056.1 25.3Q1062 24 1067.6 26.1L1086.6 33.2Q1110 42 1134.9 44L1140 44.4Q1160 46 1180 45L1200 44V80Z"
          className="fill-amber-900/[0.06]"
        />
        <path
          d="M0 80V62L55 59Q110 56 165 58.8L174.9 59.2Q230 62 285 58L300.1 56.9Q340 54 380 56L394.7 56.7Q420 58 445 54L460.1 51.6Q470 50 480 49.9L530 49.1Q540 49 549.8 51L557.5 52.5Q575 56 592.8 57.1L632.5 59.5Q690 63 747.5 59.5L760.1 58.7Q820 55 879.9 58L880.1 58Q940 61 999.9 57L1000.1 57Q1060 53 1119.9 55.6L1200 59V80Z"
          className="fill-stone-900/[0.05]"
        />
      </svg>
    </div>
  );
}
