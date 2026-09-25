"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils/cn";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

/**
 * Bottom sheet built on Radix Dialog: focus trap, scroll lock, Escape to
 * close and portal rendering come for free. Slide/fade animations live in
 * globals.css (`.sheet-overlay`, `.sheet-content`).
 */
function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-stone-950/40" />
      <DialogPrimitive.Content
        className={cn(
          "sheet-content fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-[1.75rem] bg-white text-stone-950 shadow-2xl outline-none",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
