"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { createBookingTools } from "@/features/webmcp/booking-tools";

type LegacyNavigator = Navigator & { modelContext?: WebMCP.ModelContext };

function getModelContext() {
  // `document.modelContext` is the current proposal; early Chrome previews
  // exposed the same API on `navigator`.
  return document.modelContext ?? (navigator as LegacyNavigator).modelContext;
}

/**
 * Registers the site's WebMCP tools so in-browser AI agents can check
 * availability, get prices and make or find booking requests. Does nothing in
 * browsers without WebMCP. Tools are unregistered on unmount.
 */
export function WebMcpTools() {
  const locale = useLocale();
  const queryClient = useQueryClient();

  useEffect(() => {
    const modelContext = getModelContext();
    if (!modelContext) return;

    const controller = new AbortController();

    for (const tool of createBookingTools({ locale, queryClient })) {
      modelContext.registerTool(tool, { signal: controller.signal }).catch((error: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`WebMCP: could not register tool "${tool.name}"`, error);
        }
      });
    }

    return () => controller.abort();
  }, [locale, queryClient]);

  return null;
}
