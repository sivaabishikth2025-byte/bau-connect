"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import {
  BAU_CAMPUS, CAMPUS_LOCATIONS, DC_SPOTS, TRANSIT_SPOTS, EXPLORE_DC, MAP_LAYERS,
  volunteerCategoryMeta
} from "@/lib/constants";
import { BASEMAPS, LAYER_COLORS, type BasemapId, type MapLayerId, type MapPin } from "@/lib/basemaps";
import { VolunteerJob } from "@/types";
import {
  ExternalLink, Navigation, Train,
  HandHeart, Users, LocateFixed, Building2, Landmark
} from "lucide-react";
import Link from "next/link";

function walkMins(lat: number, lng: number) {
  const R = 6371;
  const dLat = ((lat - BAU_CAMPUS.lat) * Math.PI) / 180;
  const dLng = ((lng - BAU_CAMPUS.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((BAU_CAMPUS.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(a));
  return Math.max(1, Math.round((km / 4.5) * 60));
}

const CampusMap = dynamic(() => import("@/components/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-3xl bg-white/10 border border-white/10 animate-pulse" style={{ height: "min(72vh, 680px)" }} />
  ),
});

function MapContent() {
  const searchParams = useSearchParams();
  const spotParam = searchParams.get("spot");
  const interactiveUrl = process.env.NEXT_PUBLIC_BAU_INTERACTIVE_MAP_URL;

  const [activeLayers, setActiveLayers] = useState<MapLayerId[]>(["campus", "transit", "area"]);
  const [basemap, setBasemap] = useState<BasemapId>("streets");
  const [selectedId, setSelectedId] = useState<string | null>(spotParam ? "bau-campus" : "bau-campus");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [volunteerJobs, setVolunteerJobs] = useState<(VolunteerJob & { id: string })[]>([]);

  useEffect(() => {
    if (spotParam) {
      setSelectedId("bau-campus");
      const room = CAMPUS_LOCATIONS.find(c => c.id === spotParam);
      if (room) setFloorFilter(room.floor);
    }
  }, [spotParam]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "volunteers"));
        setVolunteerJobs(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as VolunteerJob & { id: string }))
            .filter(j => (j.status || "active") === "active" && !j.seedId && j.organizerId !== "campus" && j.requirements)
        );
      } catch {
        setVolunteerJobs([]);
      }
    })();
  }, []);

  const floors = useMemo(() => {
    const set = new Set(CAMPUS_LOCATIONS.map(c => c.floor));
    return ["all", ...Array.from(set)];
  }, []);

  const rooms = useMemo(
    () => CAMPUS_LOCATIONS.filter(c => floorFilter === "all" || c.floor === floorFilter),
    [floorFilter]
  );

  const highlightedRoom = CAMPUS_LOCATIONS.find(c => c.id === spotParam);

  const pins: MapPin[] = useMemo(() => {
    const campus: MapPin = {
      id: "bau-campus",
      title: BAU_CAMPUS.name,
      subtitle: BAU_CAMPUS.address,
      lat: BAU_CAMPUS.lat,
      lng: BAU_CAMPUS.lng,
      layer: "campus",
      color: LAYER_COLORS.campus,
      meta: "Single downtown building. Use the floor directory for rooms",
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

  const selectedPin = pins.find(p => p.id === selectedId) || null;
  const selectedDc = DC_SPOTS.find(s => s.id === selectedId);

  const toggleLayer = (id: MapLayerId) => {
    setActiveLayers(prev =>
      prev.includes(id) ? (prev.length === 1 ? prev : prev.filter(l => l !== id)) : [...prev, id]
    );
  };

  const directionsUrl = selectedPin
    ? `https://www.google.com/maps/dir/?api=1&destination=${selectedPin.lat},${selectedPin.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${BAU_CAMPUS.lat},${BAU_CAMPUS.lng}`;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 relative z-10 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-black text-white">BAU Connect Map</h1>
          <p className="text-white/50 text-sm mt-1">
            Real Metro stations and DC landmarks around 1510 H Street NW. Campus rooms stay in the floor directory.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-secondary text-primary text-xs font-bold px-4 py-2.5 rounded-2xl"
          >
            <Navigation size={14} /> Directions
          </a>
          <Link
            href="/volunteers"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-2xl"
          >
            <HandHeart size={14} /> Volunteers
          </Link>
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-2xl"
          >
            <Users size={14} /> Campus feed
          </Link>
        </div>
      </div>

      {interactiveUrl && (
        <div className="mb-5 rounded-3xl overflow-hidden shadow-xl border border-white/10 bg-black/20">
          <div className="px-4 py-3 bg-white/10 flex items-center justify-between">
            <p className="text-white text-sm font-bold">Official BAU interactive map</p>
            <a href={interactiveUrl} target="_blank" rel="noopener noreferrer" className="text-sky text-xs font-semibold flex items-center gap-1">
              Full screen <ExternalLink size={12} />
            </a>
          </div>
          <iframe
            title="BAU interactive map"
            src={interactiveUrl}
            className="w-full border-0 bg-white"
            style={{ height: "min(360px, 45vh)" }}
            allowFullScreen
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-white/40 text-[11px] font-bold uppercase tracking-wide self-center mr-1">Map style</span>
        {BASEMAPS.map(b => (
          <button
            key={b.id}
            onClick={() => setBasemap(b.id)}
            className={`px-3 py-2 rounded-full text-xs font-bold transition border ${
              basemap === b.id ? "bg-secondary text-primary border-secondary" : "bg-white/10 text-white/70 border-white/10"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {MAP_LAYERS.map(layer => {
          const on = activeLayers.includes(layer.id as MapLayerId);
          return (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id as MapLayerId)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition border ${
                on ? "bg-white text-primary border-white" : "bg-white/10 text-white/60 border-white/10"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: layer.color }} />
              {layer.label}
            </button>
          );
        })}
        <button
          onClick={() => setSelectedId("bau-campus")}
          className="ml-auto inline-flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-bold bg-white/10 text-white/80"
        >
          <LocateFixed size={12} /> Recenter campus
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 mb-6">
        <CampusMap
          pins={pins}
          activeLayers={activeLayers}
          selectedId={selectedId}
          basemap={basemap}
          onSelect={pin => setSelectedId(pin.id)}
        />

        <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col min-h-[280px]">
          {selectedId === "bau-campus" && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-sky mb-1">Campus</p>
              <h2 className="font-black text-primary text-lg mb-1">{BAU_CAMPUS.name}</h2>
              <p className="text-sm text-gray-500 mb-3">{BAU_CAMPUS.address}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                BAU is one downtown building. Rooms and volunteer shifts are listed by floor. They are not stacked as map pins.
              </p>
              {highlightedRoom && (
                <div className="mb-4 rounded-2xl bg-sky/10 border border-sky/20 p-3">
                  <p className="text-xs font-bold text-sky">Looking for</p>
                  <p className="font-bold text-primary text-sm">{highlightedRoom.name}</p>
                  <p className="text-xs text-gray-500">Floor {highlightedRoom.floor} · {highlightedRoom.blurb}</p>
                </div>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${BAU_CAMPUS.lat},${BAU_CAMPUS.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-center bg-primary text-white font-bold text-sm py-2.5 rounded-2xl"
              >
                Get directions to campus
              </a>
            </>
          )}

          {selectedDc && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-secondary mb-1 flex items-center gap-1">
                {selectedDc.kind === "transit" ? <Train size={12} /> : <Landmark size={12} />}
                {selectedDc.kind === "transit" ? "WMATA Metro" : "Explore DC"}
              </p>
              <h2 className="font-black text-primary text-xl mb-1">{selectedDc.name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{selectedDc.note}</p>
              <p className="text-xs font-bold text-sky mb-4">
                About {walkMins(selectedDc.lat, selectedDc.lng)} min walk from BAU
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${BAU_CAMPUS.lat},${BAU_CAMPUS.lng}&destination=${selectedDc.lat},${selectedDc.lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-center bg-primary text-white font-bold text-sm py-2.5 rounded-2xl"
              >
                Walk from campus
              </a>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h2 className="font-black text-primary text-lg mb-1 flex items-center gap-2">
            <Train size={18} className="text-secondary" /> Metro near campus
          </h2>
          <p className="text-gray-500 text-sm mb-3">Real WMATA stations. Tap to fly the map</p>
          <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {TRANSIT_SPOTS.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setActiveLayers(prev => prev.includes("transit") ? prev : [...prev, "transit"]);
                    setSelectedId(s.id);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition ${
                    selectedId === s.id ? "border-secondary bg-secondary/10" : "border-gray-100 hover:border-secondary/40"
                  }`}
                >
                  <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h2 className="font-black text-primary text-lg mb-1 flex items-center gap-2">
            <Landmark size={18} className="text-accent" /> Explore DC
          </h2>
          <p className="text-gray-500 text-sm mb-3">Museums, monuments, and hangouts</p>
          <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {EXPLORE_DC.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setActiveLayers(prev => prev.includes("area") ? prev : [...prev, "area"]);
                    setSelectedId(s.id);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition ${
                    selectedId === s.id ? "border-accent bg-accent/10" : "border-gray-100 hover:border-accent/40"
                  }`}
                >
                  <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h2 className="font-black text-primary text-lg mb-1 flex items-center gap-2">
            <Building2 size={18} className="text-sky" /> Floor directory
          </h2>
          <p className="text-gray-500 text-sm mb-3">Indoor rooms inside the same building</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {floors.map(f => (
              <button
                key={f}
                onClick={() => setFloorFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                  floorFilter === f ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {f === "all" ? "All floors" : `Floor ${f}`}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {rooms.map(c => (
              <div
                key={c.id}
                className={`p-3 rounded-2xl border ${
                  spotParam === c.id ? "border-primary bg-primary/5" : "border-gray-100"
                }`}
              >
                <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Floor {c.floor} · {c.blurb}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h2 className="font-black text-primary text-lg mb-1 flex items-center gap-2">
            <HandHeart size={18} className="text-secondary" /> Volunteer board
          </h2>
          <p className="text-gray-500 text-sm mb-3">
            Staff-posted requirements. Apply on Volunteers
          </p>
          {volunteerJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No volunteer requirements posted yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {volunteerJobs.slice(0, 10).map(j => {
                const spot = CAMPUS_LOCATIONS.find(c => c.id === j.campusSpotId);
                return (
                  <li key={j.id} className="p-3 rounded-2xl border border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{j.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {volunteerCategoryMeta(j.category).label} · {spot ? `${spot.name} · Floor ${spot.floor}` : j.location || "Campus"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/volunteers" className="inline-block mt-3 text-sky text-sm font-bold">
            Browse volunteer board →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <div className="min-h-screen md:pt-16 relative overflow-hidden" style={{ background: appPageBg }}>
      <AppStarfield />
      <Navbar />
      <Suspense
        fallback={
          <div className="flex justify-center pt-24">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <MapContent />
      </Suspense>
    </div>
  );
}
