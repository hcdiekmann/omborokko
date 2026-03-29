import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide", {
  variants: {
    variant: {
      stone: "bg-stone-100 text-stone-700",
      pending: "bg-amber-100 text-amber-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-stone-200 text-stone-700",
      block: "bg-amber-50 text-amber-700",
      booking: "bg-blue-50 text-blue-700"
    }
  },
  defaultVariants: {
    variant: "stone"
  }
});

export function Badge({
  className,
  variant,
  children
}: React.PropsWithChildren<{ className?: string } & VariantProps<typeof badgeVariants>>) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}
