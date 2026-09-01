"use client";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BAU_CAMPUS, DC_SPOTS } from "@/lib/constants";
import { LAYER_COLORS, getBasemap, type BasemapId, type MapLayerId, type MapPin } from "@/lib/basemaps";

export type { BasemapId, MapLayerId, MapPin };

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function pinIcon(pin: MapPin, selected = false) {
  const letter = pin.layer === "campus" ? "B" : pin.layer === "transit" ? "M" : "★";
  const size = pin.layer === "campus" ? (selected ? 46 : 40) : selected ? 34 : 26;
  const tipY = size + 8;
  return L.divIcon({
    className: "bau-pin",
    iconSize: [size, tipY],
    iconAnchor: [size / 2, tipY],
    popupAnchor: [0, -tipY],
    html: `<div class="bau-pin-wrap ${pin.layer} ${selected ? "is-selected" : ""}" style="--pin:${pin.color};--sz:${size}px">
      <div class="bau-pin-bubble">${letter}</div>
      <div class="bau-pin-point"></div>
    </div>`,
  });
}

interface CampusMapProps {
  pins?: MapPin[];
  activeLayers?: MapLayerId[];
  selectedId?: string | null;
  basemap?: BasemapId;
  onSelect?: (pin: MapPin) => void;
  className?: string;
  height?: string | number;
}

export default function CampusMap({
  pins = [],
  activeLayers = ["campus", "transit", "area"],
  selectedId = null,
  basemap = "streets",
  onSelect,
  className = "",
  height = "min(72vh, 720px)",
}: CampusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);

  const defaultPins: MapPin[] = useMemo(() => {
    const campus: MapPin = {
      id: "bau-campus",
      title: BAU_CAMPUS.name,
      subtitle: BAU_CAMPUS.address,
      lat: BAU_CAMPUS.lat,
      lng: BAU_CAMPUS.lng,
      layer: "campus",
      color: LAYER_COLORS.campus,
      meta: "One building. Floors listed in the directory",
    };
    const around = DC_SPOTS.map(s => ({
      id: s.id,
      title: s.name,
      subtitle: s.note,
      lat: s.lat,
      lng: s.lng,
      layer: (s.kind === "transit" ? "transit" : "area") as MapLayerId,
      color: s.kind === "transit" ? LAYER_COLORS.transit : LAYER_COLORS.area,
      meta: s.note,
    }));
    return [campus, ...around];
  }, []);

  const allPins = pins.length ? pins : defaultPins;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    minZoom: 12,
    maxZoom: 19,
    }).setView([BAU_CAMPUS.lat, BAU_CAMPUS.lng], 16);

    const style = getBasemap(basemap);
    tileRef.current = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: style.maxZoom || 20,
      ...(style.subdomains ? { subdomains: style.subdomains } : {}),
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(map);

    L.circle([BAU_CAMPUS.lat, BAU_CAMPUS.lng], {
      radius: 280,
      color: "#28AAE2",
      weight: 1.5,
      dashArray: "4 8",
      fillColor: "#28AAE2",
      fillOpacity: 0.08,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resize = () => map.invalidateSize();
    setTimeout(resize, 120);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      tileRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = getBasemap(basemap);
    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: style.maxZoom || 20,
      ...(style.subdomains ? { subdomains: style.subdomains } : {}),
    }).addTo(map);
    tileRef.current.bringToBack();
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const visible = allPins.filter(p => activeLayers.includes(p.layer));

    visible.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: pinIcon(pin, pin.id === selectedId),
        riseOnHover: true,
        zIndexOffset: pin.id === selectedId ? 2000 : pin.layer === "campus" ? 800 : pin.layer === "area" ? 200 : 0,
      });
      marker.bindTooltip(escapeHtml(pin.title), {
        direction: "top",
        offset: [0, -18],
        className: "bau-tip",
        opacity: 1,
      });
      marker.bindPopup(
        `<div class="bau-popup">
          <span class="bau-popup-kicker">${pin.layer === "campus" ? "Campus" : pin.layer === "transit" ? "WMATA Metro" : "Explore DC"}</span>
          <strong>${escapeHtml(pin.title)}</strong>
          ${pin.subtitle ? `<p>${escapeHtml(pin.subtitle)}</p>` : ""}
        </div>`,
        { className: "bau-popup-wrap", maxWidth: 260 }
      );
      marker.on("click", () => onSelect?.(pin));
      group.addLayer(marker);
    });

    if (selectedId) {
      const selected = visible.find(p => p.id === selectedId);
      if (selected) {
        map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
        const m = group.getLayers().find(layer => {
          const ll = (layer as L.Marker).getLatLng?.();
          return ll && ll.lat === selected.lat && ll.lng === selected.lng;
        }) as L.Marker | undefined;
        m?.openPopup();
      }
    }
  }, [allPins, activeLayers, selectedId, onSelect]);

  return (
    <div className={`bau-map-shell overflow-hidden ${className}`} style={{ height }}>
      <style>{`
        .bau-map-shell { border-radius: 28px; border: 1px solid rgba(255,255,255,.18); box-shadow: 0 28px 70px rgba(0,0,0,.4); position: relative; }
        .bau-map-shell .leaflet-container { background: #c5d8ea; font-family: inherit; }
        .bau-map-shell .leaflet-control-attribution { background: rgba(255,255,255,.72) !important; font-size: 10px; }
        .bau-map-shell .leaflet-control-zoom { border: 0 !important; box-shadow: 0 10px 28px rgba(15,26,53,.22) !important; overflow: hidden; border-radius: 16px !important; }
        .bau-map-shell .leaflet-control-zoom a { width: 38px !important; height: 38px !important; line-height: 38px !important; color: #1C2D5A !important; font-weight: 800; border-bottom: 1px solid #eef2f8 !important; }
        .bau-pin { background: transparent !important; border: 0 !important; }
        .bau-pin-wrap { display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 8px 12px rgba(15,26,53,.38)); }
        .bau-pin-bubble { width: var(--sz); height: var(--sz); border-radius: 50%; background: var(--pin); color: #fff; font: 800 11px/1 Nunito, sans-serif; display: flex; align-items: center; justify-content: center; border: 2.5px solid #fff; }
        .bau-pin-wrap.campus .bau-pin-bubble { font-size: 15px; }
        .bau-pin-wrap.transit .bau-pin-bubble { border-radius: 8px; font-size: 10px; }
        .bau-pin-point { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid var(--pin); margin-top: -2px; }
        .bau-pin-wrap.is-selected .bau-pin-bubble { outline: 3px solid rgba(255,255,255,.85); box-shadow: 0 0 0 4px color-mix(in srgb, var(--pin) 35%, transparent); }
        .bau-popup-wrap .leaflet-popup-content-wrapper { border-radius: 18px; box-shadow: 0 16px 40px rgba(15,26,53,.22); padding: 0; }
        .bau-popup-wrap .leaflet-popup-content { margin: 0; }
        .bau-popup { padding: 12px 14px 13px; }
        .bau-popup-kicker { display: block; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #7a879c; margin-bottom: 4px; }
        .bau-popup strong { color: #1C2D5A; font-size: 14px; display: block; line-height: 1.25; }
        .bau-popup p { margin: 5px 0 0; color: #5b6b86; font-size: 12px; line-height: 1.4; }
        .leaflet-popup-tip { box-shadow: none; }
        .bau-tip { background: #1C2D5A !important; color: #fff !important; border: 0 !important; border-radius: 8px !important; padding: 4px 8px !important; font-weight: 700; font-size: 11px !important; box-shadow: 0 8px 18px rgba(15,26,53,.25); }
        .bau-tip::before { border-top-color: #1C2D5A !important; }
        .bau-map-legend { position: absolute; top: 14px; left: 14px; z-index: 500; background: rgba(255,255,255,.92); backdrop-filter: blur(10px); border-radius: 16px; padding: 10px 12px; box-shadow: 0 10px 28px rgba(15,26,53,.14); font-size: 11px; font-weight: 700; color: #1C2D5A; }
        .bau-map-legend span { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
        .bau-map-legend i { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
        .bau-map-legend i.sq { border-radius: 3px; }
      `}</style>
      <div className="bau-map-legend" aria-hidden>
        <span><i style={{ background: LAYER_COLORS.campus }} /> BAU campus</span>
        <span><i className="sq" style={{ background: LAYER_COLORS.transit }} /> Metro stations</span>
        <span><i style={{ background: LAYER_COLORS.area }} /> Explore DC</span>
      </div>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

export { LAYER_COLORS } from "@/lib/basemaps";
