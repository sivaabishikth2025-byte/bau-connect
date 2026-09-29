"use client";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import {
  BAU_CAMPUS, BUILDING_FLOORS, CAMPUS_LOCATIONS, TRANSIT_SPOTS, EXPLORE_DC,
  floorLabel, hasFloorModel, volunteerCategoryMeta
} from "@/lib/constants";
import {
  appleMapsDirectionsUrl,
  appleMapsSearchUrl,
  campusMapQuery,
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
  isAppleDevice,
  landmarkMapQuery,
  transitMapQuery,
} from "@/lib/google-maps";
import { isNativeApp } from "@/lib/native";
import { VolunteerJob } from "@/types";
import {
  ExternalLink, Navigation, Train,
  HandHeart, Users, LocateFixed, Landmark
} from "lucide-react";
import Link from "next/link";

const InteractiveGoogleMap = dynamic(() => import("@/components/InteractiveGoogleMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-[28px] border border-white/20 bg-white/10 animate-pulse" style={{ height: "min(40vh, 360px)" }} />
  ),
});

const FloorModelViewer = dynamic(() => import("@/components/FloorModelViewer"), { ssr: false });

type SpotKind = "campus" | "transit" | "area";

function MapContent() {
  const [openFloor, setOpenFloor] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const spotParam = searchParams.get("spot");
  const interactiveUrl = process.env.NEXT_PUBLIC_BAU_INTERACTIVE_MAP_URL;
  const detailRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string>("bau-campus");
  const [volunteerJobs, setVolunteerJobs] = useState<(VolunteerJob & { id: string })[]>([]);

  const selectSpot = useCallback((id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  useEffect(() => {
    if (spotParam) setSelectedId("bau-campus");
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

  const highlightedRoom = CAMPUS_LOCATIONS.find(c => c.id === spotParam);
  const selectedTransit = TRANSIT_SPOTS.find(s => s.id === selectedId);
  const selectedLandmark = EXPLORE_DC.find(s => s.id === selectedId);

  const spotKind: SpotKind = selectedId === "bau-campus"
    ? "campus"
    : selectedTransit
      ? "transit"
      : "area";

  const selectedTitle =
    spotKind === "campus"
      ? BAU_CAMPUS.name
      : selectedTransit?.name ?? selectedLandmark?.name ?? BAU_CAMPUS.name;

  const mapQuery = useMemo(() => {
    if (spotKind === "campus") return campusMapQuery();
    if (selectedTransit) return transitMapQuery(selectedTransit.name);
    if (selectedLandmark) return landmarkMapQuery(selectedLandmark.name);
    return campusMapQuery();
  }, [spotKind, selectedTransit, selectedLandmark]);

  const [apple, setApple] = useState(false);
  const [native, setNative] = useState(false);
  useEffect(() => {
    setApple(isAppleDevice());
    setNative(isNativeApp());
  }, []);

  const directionsUrl = useMemo(() => {
    const build = apple ? appleMapsDirectionsUrl : googleMapsDirectionsUrl;
    if (spotKind === "campus") return build(BAU_CAMPUS.address);
    return build(mapQuery, BAU_CAMPUS.address, "walking");
  }, [apple, spotKind, mapQuery]);

  const openInMapsUrl = apple ? appleMapsSearchUrl(mapQuery) : googleMapsSearchUrl(mapQuery);
  const mapsAppName = apple ? "Apple Maps" : "Google Maps";
  // Native shell: plain navigation lets Capacitor hand the URL to the system maps app.
  const externalLinkProps = native ? {} : { target: "_blank", rel: "noopener noreferrer" };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8 relative z-10 pb-8 md:pb-8">
      {openFloor && <FloorModelViewer key={openFloor} floor={openFloor} onClose={() => setOpenFloor(null)} />}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">BAU Connect Map</h1>
          <p className="text-white/50 text-sm mt-1">
            Tap a place on the map or pick from the lists. The panel updates instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={directionsUrl}
            {...externalLinkProps}
            className="inline-flex items-center gap-2 bg-secondary text-primary text-xs font-bold px-4 py-2.5 rounded-2xl"
          >
            <Navigation size={14} /> Directions
          </a>
          <a
            href={openInMapsUrl}
            {...externalLinkProps}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-2xl"
          >
            <ExternalLink size={14} /> Open in {mapsAppName}
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
            style={{ height: "min(240px, 38vh)" }}
            allowFullScreen
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-white/40 text-[11px] font-bold uppercase tracking-wide">Now viewing</span>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-primary">
          {spotKind === "campus" && <span className="w-2 h-2 rounded-full bg-sky" />}
          {spotKind === "transit" && <Train size={12} className="text-secondary" />}
          {spotKind === "area" && <Landmark size={12} className="text-accent" />}
          {selectedTitle}
        </span>
        <button
          type="button"
          onClick={() => selectSpot("bau-campus")}
          className="ml-auto inline-flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-bold bg-white/10 text-white/80"
        >
          <LocateFixed size={12} /> Back to campus
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 mb-6">
        <InteractiveGoogleMap selectedId={selectedId} onSelect={selectSpot} />

        <div
          ref={detailRef}
          key={`detail-${selectedId}`}
          className="bg-white rounded-3xl shadow-lg p-5 flex flex-col min-h-[280px]"
        >
          {spotKind === "campus" && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-sky mb-1">Campus</p>
              <h2 className="font-black text-primary text-lg mb-1">{BAU_CAMPUS.name}</h2>
              <p className="text-sm text-gray-500 mb-3">{BAU_CAMPUS.address}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                BAU is one downtown building. Rooms and volunteer shifts are listed by floor below.
              </p>
              {highlightedRoom && (
                <div className="mb-4 rounded-2xl bg-sky/10 border border-sky/20 p-3">
                  <p className="text-xs font-bold text-sky">Looking for</p>
                  <p className="font-bold text-primary text-sm">{highlightedRoom.name}</p>
                  <p className="text-xs text-gray-500">
                    {BUILDING_FLOORS.includes(highlightedRoom.floor as (typeof BUILDING_FLOORS)[number])
                      ? floorLabel(highlightedRoom.floor)
                      : highlightedRoom.floor}{" "}
                    · {highlightedRoom.blurb}
                  </p>
                </div>
              )}
            </>
          )}

          {spotKind === "transit" && selectedTransit && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-secondary mb-1 flex items-center gap-1">
                <Train size={12} /> WMATA Metro
              </p>
              <h2 className="font-black text-primary text-xl mb-1">{selectedTransit.name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{selectedTransit.note}</p>
            </>
          )}

          {spotKind === "area" && selectedLandmark && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-accent mb-1 flex items-center gap-1">
                <Landmark size={12} /> Explore DC
              </p>
              <h2 className="font-black text-primary text-xl mb-1">{selectedLandmark.name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{selectedLandmark.note}</p>
            </>
          )}

          <p className="text-xs text-gray-400 mb-4 mt-auto">
            Showing <strong className="text-gray-600">{selectedTitle}</strong> on Google Maps.
          </p>

          <a
            href={directionsUrl}
            {...externalLinkProps}
            className="text-center bg-primary text-white font-bold text-sm py-2.5 rounded-2xl"
          >
            {spotKind === "campus" ? "Get directions to campus" : "Walk from campus"}
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h2 className="font-black text-primary text-lg mb-1 flex items-center gap-2">
            <Train size={18} className="text-secondary" /> All Metro stations
          </h2>
          <p className="text-gray-500 text-sm mb-3">Tap a station — Google Maps and the panel update</p>
          <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {TRANSIT_SPOTS.map(s => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => selectSpot(s.id)}
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
                  type="button"
                  onClick={() => selectSpot(s.id)}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUILDING_FLOORS.map(f => {
              const available = hasFloorModel(f);
              return (
                <button
                  key={f}
                  type="button"
                  disabled={!available}
                  onClick={() => setOpenFloor(f)}
                  aria-label={available ? "Open " + floorLabel(f) + " interactive 3D model" : floorLabel(f) + " — model not available yet"}
                  title={available ? "Explore in 3D" : "3D model not available yet"}
                  className="px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-center font-bold text-sm text-primary enabled:hover:bg-sky/10 enabled:hover:border-sky disabled:cursor-default disabled:opacity-50"
                >
                  {floorLabel(f)}
                </button>
              );
            })}
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
    <div className="min-h-screen app-bottom-pad md:pb-0 md:pt-20 relative overflow-x-hidden" style={{ background: appPageBg }}>
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




