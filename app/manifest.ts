import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Omborokko Safaris",
    short_name: "Omborokko",
    description:
      "Remote bush camping in Namibia with essential comforts, mountain views, and a simple request-and-confirm booking flow.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f6f2",
    theme_color: "#92400e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
