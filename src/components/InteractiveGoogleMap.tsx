"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  findSpotIdByPlaceName,
  getMapSpot,
  LAYER_MARKER_COLORS,
  MAP_CENTER,
  MAP_SPOTS,
  type MapSpotLayer,
} from "@/lib/map-spots";

const MAP_HEIGHT = "min(72vh, 720px)";
const LIBRARIES: ("places")[] = ["places"];

function markerLabel(layer: MapSpotLayer) {
  if (layer === "campus") return "B";
  if (layer === "transit") return "M";
  return "★";
}

interface InteractiveGoogleMapProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function InteractiveGoogleMap({ selectedId, onSelect }: InteractiveGoogleMapProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const selectedSpot = useMemo(() => getMapSpot(selectedId), [selectedId]);

  useEffect(() => {
    if (!map || !selectedSpot) return;
    map.panTo({ lat: selectedSpot.lat, lng: selectedSpot.lng });
    if (selectedId !== "bau-campus") {
      map.setZoom(16);
    } else {
      map.setZoom(17);
    }
  }, [map, selectedSpot, selectedId]);

  const onMapLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
  }, []);

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent & { placeId?: string; stop?: () => void }) => {
      if (!e.placeId || !map) return;
      e.stop?.();
      const service = new google.maps.places.PlacesService(map);
      service.getDetails(
        { placeId: e.placeId, fields: ["name"] },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.name) return;
          const id = findSpotIdByPlaceName(place.name);
          if (id) onSelect(id);
        }
      );
    },
    [map, onSelect]
  );

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-[28px] border border-white/20 bg-white/10 p-8 text-center text-white text-sm"
        style={{ height: MAP_HEIGHT }}
      >
        Add <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the interactive map.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center rounded-[28px] border border-red-300/40 bg-red-950/30 p-8 text-center text-white text-sm"
        style={{ height: MAP_HEIGHT }}
      >
        Could not load Google Maps. Check your API key and enable Maps JavaScript API + Places API.
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
      className="overflow-hidden rounded-[28px] border border-white/20 shadow-[0_28px_70px_rgba(0,0,0,0.4)]"
      style={{ height: MAP_HEIGHT }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={MAP_CENTER}
        zoom={16}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          clickableIcons: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {MAP_SPOTS.map(spot => {
          const selected = spot.id === selectedId;
          const color = LAYER_MARKER_COLORS[spot.layer];
          return (
            <Marker
              key={spot.id}
              position={{ lat: spot.lat, lng: spot.lng }}
              title={spot.title}
              onClick={() => onSelect(spot.id)}
              zIndex={selected ? 1000 : spot.layer === "campus" ? 500 : 100}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: selected ? 3 : 2,
                scale: selected ? (spot.layer === "campus" ? 14 : 11) : spot.layer === "campus" ? 12 : 9,
              }}
              label={{
                text: markerLabel(spot.layer),
                color: "#ffffff",
                fontSize: spot.layer === "campus" ? "11px" : "9px",
                fontWeight: "bold",
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}
