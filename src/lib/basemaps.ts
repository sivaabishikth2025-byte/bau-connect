export type BasemapId = "streets" | "light" | "dark" | "satellite" | "terrain";
export type MapLayerId = "campus" | "transit" | "area";

export interface MapPin {
  id: string;
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  layer: MapLayerId;
  color: string;
  href?: string;
  meta?: string;
}

export const LAYER_COLORS: Record<MapLayerId, string> = {
  campus: "#28AAE2",
  transit: "#C9A227",
  area: "#E85D4C",
};

export const BASEMAPS: {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  subdomains?: string;
}[] = [
  {
    id: "streets",
    label: "Streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OSM &copy; CARTO",
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "light",
    label: "Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OSM &copy; CARTO",
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "dark",
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OSM &copy; CARTO",
    maxZoom: 20,
    subdomains: "abcd",
  },
  {
    id: "terrain",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OSM &copy; OpenTopoMap",
    maxZoom: 17,
    subdomains: "abc",
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    maxZoom: 19,
  },
];
