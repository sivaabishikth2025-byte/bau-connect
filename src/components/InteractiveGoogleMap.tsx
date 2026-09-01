"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import {
  findSpotIdByPlaceName,
  getMapSpot,
  MAP_CENTER,
  nearestMapSpotId,
} from "@/lib/map-spots";

const MAP_HEIGHT = "min(72vh, 720px)";
const LIBRARIES: ("places")[] = ["places"];
const LOADER_ID = "bau-google-maps";

interface InteractiveGoogleMapProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

function maxKmForZoom(zoom: number) {
  if (zoom >= 16) return 0.45;
  if (zoom >= 14) return 0.9;
  return 2;
}

export default function InteractiveGoogleMap({ selectedId, onSelect }: InteractiveGoogleMapProps) {
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
  const [zoom, setZoom] = useState(17);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);

  const selectedSpot = useMemo(() => getMapSpot(selectedId), [selectedId]);

  const onMapLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
    setZoom(m.getZoom() ?? 17);
    placesRef.current = new google.maps.places.PlacesService(m);
  }, []);

  const onZoomChanged = useCallback(() => {
    if (map) setZoom(map.getZoom() ?? 17);
  }, [map]);

  // List / sidebar selection → pan map (Google displays the place; we don't draw pins).
  useEffect(() => {
    if (!map || !selectedSpot) return;
    map.panTo({ lat: selectedSpot.lat, lng: selectedSpot.lng });
    map.setZoom(selectedId === "bau-campus" ? 17 : 16);
  }, [map, selectedSpot, selectedId]);

  const pickAt = useCallback(
    (lat: number, lng: number) => {
      const id = nearestMapSpotId(lat, lng, maxKmForZoom(zoom));
      if (id) onSelect(id);
    },
    [onSelect, zoom]
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent & { placeId?: string; stop?: () => void }) => {
      const latLng = e.latLng;
      if (!latLng) return;

      const lat = latLng.lat();
      const lng = latLng.lng();

      if (e.placeId && placesRef.current) {
        e.stop?.();
        placesRef.current.getDetails(
          { placeId: e.placeId, fields: ["name", "formatted_address"] },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              const name = place.name || place.formatted_address || "";
              const id = findSpotIdByPlaceName(name);
              if (id) {
                onSelect(id);
                return;
              }
            }
            pickAt(lat, lng);
          }
        );
        return;
      }

      pickAt(lat, lng);
    },
    [onSelect, pickAt]
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      clickableIcons: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: "greedy",
    }),
    []
  );

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-[28px] border border-white/20 bg-white/10 p-8 text-center text-white text-sm"
        style={{ height: MAP_HEIGHT }}
      >
        Map API key missing. Set <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in
        Netlify and redeploy.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-[28px] border border-red-300/40 bg-red-950/30 p-8 text-center text-white text-sm"
        style={{ height: MAP_HEIGHT }}
      >
        <p>Google Maps could not load on baustudentconnect.com.</p>
        <p className="text-white/70 text-xs">Check API key referrers and Maps JavaScript API.</p>
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
      className="relative z-20 overflow-hidden rounded-[28px] border border-white/20 shadow-[0_28px_70px_rgba(0,0,0,0.4)]"
      style={{ height: MAP_HEIGHT }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={MAP_CENTER}
        zoom={17}
        onLoad={onMapLoad}
        onZoomChanged={onZoomChanged}
        onClick={onMapClick}
        options={mapOptions}
      />
    </div>
  );
}
