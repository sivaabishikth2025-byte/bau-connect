"use client";

import { googleMapsEmbedUrl } from "@/lib/google-maps";

interface GoogleMapEmbedProps {
  query: string;
  zoom?: number;
  className?: string;
  height?: string;
  title?: string;
}

export default function GoogleMapEmbed({
  query,
  zoom = 16,
  className = "",
  height = "min(72vh, 720px)",
  title = "Google Maps",
}: GoogleMapEmbedProps) {
  const src = googleMapsEmbedUrl(query, zoom);

  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-white/20 shadow-[0_28px_70px_rgba(0,0,0,0.4)] bg-[#e8eef4] ${className}`}
      style={{ height }}
    >
      <iframe
        key={src}
        title={title}
        src={src}
        className="h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
