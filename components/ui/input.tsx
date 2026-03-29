import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn("w-full rounded-2xl border border-stone-300 px-3 py-2 text-sm", className)} {...props} />;
  }
);

Input.displayName = "Input";
