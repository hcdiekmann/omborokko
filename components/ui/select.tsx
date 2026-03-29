import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return <select ref={ref} className={cn("w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm", className)} {...props} />;
  }
);

Select.displayName = "Select";
