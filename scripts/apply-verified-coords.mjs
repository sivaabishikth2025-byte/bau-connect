/**
 * Patch src/lib/constants.ts lat/lng from scripts/verified-coords.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const constantsPath = resolve(__dirname, "..", "src", "lib", "constants.ts");
const verified = JSON.parse(readFileSync(resolve(__dirname, "verified-coords.json"), "utf8"));

const FALLBACK = {
  "archives-bldg": { lat: 38.893137, lng: -77.023041 },
  wwii: { lat: 38.889394, lng: -77.040482 },
  nga: { lat: 38.891297, lng: -77.019969 },
  "nga-east": { lat: 38.891406, lng: -77.017814 },
  zoo: { lat: 38.929615, lng: -77.049758 },
  "iwo-jima": { lat: 38.890474, lng: -77.069738 },
  "rock-creek": { lat: 38.9475, lng: -77.0527 },
};

const coordsById = {
  ...verified.metro,
  ...Object.fromEntries(
    Object.entries(verified.landmarks).map(([id, v]) => [id, v ?? FALLBACK[id]])
  ),
};

let source = readFileSync(constantsPath, "utf8");

// BAU_CAMPUS
source = source.replace(
  /(export const BAU_CAMPUS = \{[\s\S]*?lat: )[\d.]+(,\s*lng: )-?[\d.]+/,
  `$1${verified.campus.lat}$2${verified.campus.lng}`
);

// CAMPUS_LOCATIONS - update all lat/lng to campus coords
const campusLat = verified.campus.lat;
const campusLng = verified.campus.lng;
source = source.replace(
  /(CAMPUS_LOCATIONS = \[[\s\S]*?)(\];)/,
  (block, inner, end) => {
    const updated = inner.replace(/lat: [\d.]+, lng: -?[\d.]+/g, `lat: ${campusLat}, lng: ${campusLng}`);
    return updated + end;
  }
);

// Outdoor seating - slight offset for variety
source = source.replace(
  /id: "outdoor"[\s\S]*?lat: [\d.]+, lng: -?[\d.]+/,
  `id: "outdoor", name: "Outdoor seating", floor: "Ground", blurb: "Meet up outside near H Street.", lat: ${(campusLat - 0.00005).toFixed(6)}, lng: ${(campusLng + 0.00005).toFixed(6)}`
);

// TRANSIT_SPOTS and EXPLORE_DC entries
for (const [id, c] of Object.entries(coordsById)) {
  if (!c?.lat) continue;
  const lat = Number(c.lat.toFixed(6));
  const lng = Number(c.lng.toFixed(6));
  const re = new RegExp(`(id: "${id}"[\\s\\S]*?lat: )[\\d.]+(, lng: )-?[\\d.]+`);
  if (re.test(source)) {
    source = source.replace(re, `$1${lat}$2${lng}`);
  } else {
    console.warn(`No match for id: ${id}`);
  }
}

writeFileSync(constantsPath, source);
console.log("Updated", constantsPath);
