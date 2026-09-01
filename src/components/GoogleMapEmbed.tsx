"use client";

import { googleMapsEmbedUrl } from "@/lib/google-maps";

interface GoogleMapEmbedProps {
  query: string;
  zoom?: number;
  className?: string;
  height?: string;
  title?: string;
  /** When false, the iframe is display-only so list clicks stay in sync with the panel. */
  interactive?: boolean;
}

export default function GoogleMapEmbed({
  query,
  zoom = 16,
  className = "",
  height = "min(72vh, 720px)",
  title = "Google Maps",
  interactive = false,
}: GoogleMapEmbedProps) {
  const src = googleMapsEmbedUrl(query, zoom);

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/20 shadow-[0_28px_70px_rgba(0,0,0,0.4)] bg-[#e8eef4] ${className}`}
      style={{ height }}
    >
      <iframe
        key={src}
        title={title}
        src={src}
        className={`h-full w-full border-0 ${interactive ? "" : "pointer-events-none"}`}
        loading="lazy"
        allowFullScreen={interactive}
        referrerPolicy="no-referrer-when-downgrade"
      />
      {!interactive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1C2D5A]/75 to-transparent px-4 pb-3 pt-10">
          <p className="text-white text-xs font-bold text-center">
            Pick a location from the panel → map and details update together
          </p>
        </div>
      )}
    </div>
  );
}
