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

export function transitMapQuery(stationName: string) {
  return `${stationName} Station, Washington, DC`;
}

export function landmarkMapQuery(placeName: string) {
  return `${placeName}, Washington, DC`;
}

export function campusMapQuery() {
  return BAU_CAMPUS.address;
}
