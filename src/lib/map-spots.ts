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

export function findSpotIdByPlaceName(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("bay atlantic") || n.includes("bau")) return "bau-campus";

  for (const s of TRANSIT_SPOTS) {
    const sn = s.name.toLowerCase();
    if (n.includes(sn) || sn.includes(n)) return s.id;
  }
  for (const s of EXPLORE_DC) {
    const sn = s.name.toLowerCase();
    if (n.includes(sn) || sn.includes(n)) return s.id;
  }
  return null;
}

export function getMapSpot(id: string): MapSpot | undefined {
  return MAP_SPOTS.find(s => s.id === id);
}

export const MAP_CENTER = { lat: BAU_CAMPUS.lat, lng: BAU_CAMPUS.lng };

export const LAYER_MARKER_COLORS: Record<MapSpotLayer, string> = {
  campus: "#28AAE2",
  transit: "#DBA631",
  area: "#F15B47",
};
