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

export interface BasemapStyle {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  subdomains?: string;
}

export const LAYER_COLORS: Record<MapLayerId, string> = {
  campus: "#28AAE2",
  transit: "#C9A227",
  area: "#E85D4C",
};

const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();

const OSM_FALLBACK: Pick<BasemapStyle, "url" | "attribution" | "maxZoom" | "subdomains"> = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
  subdomains: "abc",
};

function cartoUrl(path: string) {
  if (!CARTO_KEY) return null;
  return `https://{s}.basemaps.cartocdn.com/${path}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_KEY)}`;
}

function cartoOrOsm(path: string): Pick<BasemapStyle, "url" | "attribution" | "maxZoom" | "subdomains"> {
  const url = cartoUrl(path);
  if (url) {
    return {
      url,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      maxZoom: 20,
      subdomains: "abcd",
    };
  }
  return OSM_FALLBACK;
}

export const BASEMAPS: BasemapStyle[] = [
  {
    id: "streets",
    label: "Streets",
    ...cartoOrOsm("rastertiles/voyager"),
  },
  {
    id: "light",
    label: "Light",
    ...cartoOrOsm("light_all"),
  },
  {
    id: "dark",
    label: "Dark",
    ...cartoOrOsm("dark_all"),
  },
  {
    id: "terrain",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; OpenTopoMap",
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

export function getBasemap(id: BasemapId): BasemapStyle {
  return BASEMAPS.find(b => b.id === id) || BASEMAPS[0];
}
