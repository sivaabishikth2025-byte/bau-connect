"use client";

import { createElement, useEffect, useRef, useState } from "react";

export default function FloorModelViewer({ floor, onClose }: { floor: string; onClose: () => void }) {
  const label = floor === "1" ? "The Bay · 1st floor" : floor === "2" ? "2nd floor" : "3rd floor";
  const dialog = useRef<HTMLDialogElement>(null);
  const viewer = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [rotating, setRotating] = useState(true);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let active = true;
    import("@google/model-viewer").then(() => {
      if (active) setReady(true);
    }).catch(() => { if (active) setError(true); });
    return () => {
      active = false;
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const element = viewer.current;
    if (!element) return;
    const onLoad = () => setLoaded(true);
    const onError = () => setError(true);
    element.addEventListener("load", onLoad);
    element.addEventListener("error", onError);
    return () => {
      element.removeEventListener("load", onLoad);
      element.removeEventListener("error", onError);
    };
  }, [ready]);

  return (
    <dialog ref={dialog} onCancel={onClose} onClick={e => {
      if (e.target === dialog.current) onClose();
    }} aria-labelledby="floor-model-title"
      className="w-[calc(100%-2rem)] max-w-5xl rounded-3xl p-0 shadow-2xl backdrop:bg-black/60">
      <div className="bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="floor-model-title" className="text-xl font-bold text-primary">{label}</h2>
          <button autoFocus onClick={onClose} className="rounded-xl px-4 py-2 bg-gray-100 font-semibold">Close</button>
        </div>
        <div className="relative mt-4 rounded-2xl bg-slate-100 overflow-hidden" style={{ height: "min(65vh, 600px)" }}>
          {ready && !error && createElement("model-viewer", {
            ref: viewer,
            src: "/models/bau-floor-" + floor + ".glb",
            alt: "Interactive 3D model of " + label,
            "camera-controls": "",
            "auto-rotate": rotating ? "" : undefined,
            "auto-rotate-delay": "1500",
            "rotation-per-second": "15deg",
            "camera-orbit": "0deg 55deg auto",
            "shadow-intensity": "1",
            "touch-action": "none",
            style: { width: "100%", height: "100%" },
          })}
          {!loaded && !error && <p role="status" className="absolute inset-0 flex items-center justify-center pointer-events-none">Loading {label}…</p>}
          {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p>The model could not load. Please close the viewer and try again.</p>
          </div>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">Drag to rotate · Scroll or pinch to zoom · Right-drag or use two fingers to pan</p>
          <button disabled={!loaded || error} onClick={() => setRotating(v => !v)}
            className="rounded-xl bg-primary text-white px-4 py-2 disabled:opacity-50">
            {rotating ? "Pause rotation" : "Resume rotation"}
          </button>
        </div>
      </div>
    </dialog>
  );
}


