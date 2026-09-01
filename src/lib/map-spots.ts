import { BAU_CAMPUS, EXPLORE_DC, TRANSIT_SPOTS } from "@/lib/constants";

export type MapSpotLayer = "campus" | "transit" | "area";

export interface MapSpot {
  id: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  layer: MapSpotLayer;
}

export const MAP_SPOTS: MapSpot[] = [
  {
    id: "bau-campus",
    title: BAU_CAMPUS.name,
    note: BAU_CAMPUS.address,
    lat: BAU_CAMPUS.lat,
    lng: BAU_CAMPUS.lng,
    layer: "campus",
  },
  ...TRANSIT_SPOTS.map(s => ({
    id: s.id,
    title: s.name,
    note: s.note,
    lat: s.lat,
    lng: s.lng,
    layer: "transit" as const,
  })),
  ...EXPLORE_DC.map(s => ({
    id: s.id,
    title: s.name,
    note: s.note,
    lat: s.lat,
    lng: s.lng,
    layer: "area" as const,
  })),
];

function normalizePlaceName(name: string) {
  return name
    .toLowerCase()
    .replace(/\bwmata\b/g, "")
    .replace(/\bmetro\s+station\b/g, "station")
    .replace(/\s+station\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findSpotIdByPlaceName(name: string): string | null {
  const n = normalizePlaceName(name);
  if (
    n.includes("bay atlantic") ||
    n.includes("1510 h street") ||
    (n.includes("bau") && n.includes("univers"))
  ) {
    return "bau-campus";
  }

  for (const s of TRANSIT_SPOTS) {
    const sn = normalizePlaceName(s.name);
    if (!sn) continue;
    if (n.includes(sn) || sn.includes(n)) return s.id;
    const first = sn.split(" ")[0];
    if (first.length > 4 && n.includes(first)) return s.id;
  }
  for (const s of EXPLORE_DC) {
    const sn = normalizePlaceName(s.name);
    if (!sn) continue;
    if (n.includes(sn) || sn.includes(n)) return s.id;
  }
  return null;
}

export function getMapSpot(id: string): MapSpot | undefined {
  return MAP_SPOTS.find(s => s.id === id);
}

function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Match a map tap to the nearest catalog spot (no visible pin — lookup only). */
export function nearestMapSpotId(lat: number, lng: number, maxKm: number): string | null {
  let best: { id: string; d: number } | null = null;
  for (const spot of MAP_SPOTS) {
    const d = distKm(lat, lng, spot.lat, spot.lng);
    if (d <= maxKm && (!best || d < best.d)) best = { id: spot.id, d };
  }
  return best?.id ?? null;
}

export const MAP_CENTER = { lat: BAU_CAMPUS.lat, lng: BAU_CAMPUS.lng };

export const LAYER_MARKER_COLORS: Record<MapSpotLayer, string> = {
  campus: "#28AAE2",
  transit: "#DBA631",
  area: "#F15B47",
};
