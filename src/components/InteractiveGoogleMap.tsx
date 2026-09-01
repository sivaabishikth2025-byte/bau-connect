"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  findSpotIdByPlaceName,
  getMapSpot,
  LAYER_MARKER_COLORS,
  MAP_CENTER,
  MAP_SPOTS,
  type MapSpot,
  type MapSpotLayer,
} from "@/lib/map-spots";

const MAP_HEIGHT = "min(72vh, 720px)";
const LIBRARIES: ("places")[] = ["places"];
const LOADER_ID = "bau-google-maps";

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

function nearestSpot(
  lat: number,
  lng: number,
  spots: MapSpot[],
  maxKm: number
): string | null {
  let best: { id: string; d: number } | null = null;
  for (const spot of spots) {
    const d = distKm(lat, lng, spot.lat, spot.lng);
    if (d <= maxKm && (!best || d < best.d)) best = { id: spot.id, d };
  }
  return best?.id ?? null;
}

const SpotMarker = memo(function SpotMarker({
  spot,
  selected,
  onSelect,
}: {
  spot: MapSpot;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const color = LAYER_MARKER_COLORS[spot.layer];
  const scale =
    selected ? (spot.layer === "campus" ? 18 : 15) : spot.layer === "campus" ? 16 : 13;

  return (
    <Marker
      position={{ lat: spot.lat, lng: spot.lng }}
      title={spot.title}
      clickable
      onClick={() => onSelect(spot.id)}
      zIndex={selected ? 1000 : spot.layer === "campus" ? 500 : 100}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.95,
        strokeColor: "#ffffff",
        strokeWeight: selected ? 3 : 2,
        scale,
      }}
    />
  );
});

interface InteractiveGoogleMapProps {
  selectedId: string;
  onSelect: (id: string) => void;
  visibleLayers?: MapSpotLayer[];
}

export default function InteractiveGoogleMap({
  selectedId,
  onSelect,
  visibleLayers = ["campus", "transit", "area"],
}: InteractiveGoogleMapProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(16);

  const selectedSpot = useMemo(() => getMapSpot(selectedId), [selectedId]);

  const visibleSpots = useMemo(
    () => MAP_SPOTS.filter(s => visibleLayers.includes(s.layer)),
    [visibleLayers]
  );

  useEffect(() => {
    if (!map || !selectedSpot) return;
    map.panTo({ lat: selectedSpot.lat, lng: selectedSpot.lng });
    map.setZoom(selectedId === "bau-campus" ? 17 : 16);
  }, [map, selectedSpot, selectedId]);

  const onMapLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
    setZoom(m.getZoom() ?? 16);
  }, []);

  const onZoomChanged = useCallback(() => {
    if (map) setZoom(map.getZoom() ?? 16);
  }, [map]);

  const pickNearest = useCallback(
    (lat: number, lng: number) => {
      const maxKm = zoom >= 15 ? 0.35 : zoom >= 13 ? 0.8 : 2;
      const id = nearestSpot(lat, lng, visibleSpots, maxKm);
      if (id) onSelect(id);
    },
    [onSelect, visibleSpots, zoom]
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent & { placeId?: string }) => {
      const latLng = e.latLng;
      if (!latLng) return;

      if (e.placeId && map) {
        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
          { placeId: e.placeId, fields: ["name"] },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.name) {
              const id = findSpotIdByPlaceName(place.name);
              if (id) {
                onSelect(id);
                return;
              }
            }
            pickNearest(latLng.lat(), latLng.lng());
          }
        );
        return;
      }

      pickNearest(latLng.lat(), latLng.lng());
    },
    [map, onSelect, pickNearest]
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      clickableIcons: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: "greedy",
      disableDoubleClickZoom: false,
    }),
    []
  );

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-[28px] border border-white/20 bg-white/10 p-8 text-center text-white text-sm"
        style={{ height: MAP_HEIGHT }}
      >
        Map API key missing from production build. Set{" "}
        <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Netlify and redeploy.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-[28px] border border-red-300/40 bg-red-950/30 p-8 text-center text-white text-sm"
        style={{ height: MAP_HEIGHT }}
      >
        <p>Could not load Google Maps on this domain.</p>
        <p className="text-white/70 text-xs">
          Allow <strong>baustudentconnect.com</strong> in your Google Maps API key referrers, then
          redeploy.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="rounded-[28px] border border-white/20 bg-white/10 animate-pulse"
        style={{ height: MAP_HEIGHT }}
      />
    );
  }

  return (
    <div
      className="relative z-20 overflow-hidden rounded-[28px] border border-white/20 shadow-[0_28px_70px_rgba(0,0,0,0.4)] touch-auto"
      style={{ height: MAP_HEIGHT }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", touchAction: "auto" }}
        center={MAP_CENTER}
        zoom={16}
        onLoad={onMapLoad}
        onZoomChanged={onZoomChanged}
        onClick={onMapClick}
        options={mapOptions}
      >
        {visibleSpots.map(spot => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            selected={spot.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
