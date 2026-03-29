import * as React from "react";

import { cn } from "@/lib/utils/cn";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn("min-h-28 w-full rounded-2xl border border-stone-300 px-3 py-2 text-sm", className)} {...props} />;
  }
);

Textarea.displayName = "Textarea";
