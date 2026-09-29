import { BAU_CAMPUS } from "@/lib/constants";

/** Google Maps embed — locations resolved by Google, not hand-entered coordinates. */
export function googleMapsEmbedUrl(query: string, zoom = 16) {
  const params = new URLSearchParams({
    q: query,
    z: String(zoom),
    output: "embed",
    hl: "en",
  });
  return `https://www.google.com/maps?${params.toString()}`;
}

export function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsDirectionsUrl(
  destination: string,
  origin?: string,
  mode: "walking" | "driving" | "transit" = "walking"
) {
  const params = new URLSearchParams({
    api: "1",
    destination,
  });
  if (origin) {
    params.set("origin", origin);
    params.set("travelmode", mode);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function isAppleDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Apple Maps universal link — opens the Maps app on iPhone/iPad. */
export function appleMapsDirectionsUrl(
  destination: string,
  origin?: string,
  mode: "walking" | "driving" | "transit" = "walking"
) {
  const params = new URLSearchParams({ daddr: destination });
  if (origin) {
    params.set("saddr", origin);
    params.set("dirflg", mode === "walking" ? "w" : mode === "transit" ? "r" : "d");
  }
  return `https://maps.apple.com/?${params.toString()}`;
}

export function appleMapsSearchUrl(query: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

/** Apple Maps on Apple devices, Google Maps everywhere else. */
export function directionsUrl(
  destination: string,
  origin?: string,
  mode: "walking" | "driving" | "transit" = "walking"
) {
  return isAppleDevice()
    ? appleMapsDirectionsUrl(destination, origin, mode)
    : googleMapsDirectionsUrl(destination, origin, mode);
}

export function transitMapQuery(stationName: string) {
  return `${stationName} Station, Washington, DC`;
}

export function landmarkMapQuery(placeName: string) {
  return `${placeName}, Washington, DC`;
}

export function campusMapQuery() {
  return BAU_CAMPUS.address;
}
