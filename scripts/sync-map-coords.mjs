/**
 * Sync map coordinates from official WMATA GeoJSON + OSM Nominatim geocoding.
 * Run: node scripts/sync-map-coords.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const METRO_WMATA_NAMES = {
  mcpherson: "McPherson Sq",
  "farragut-west": "Farragut West",
  "farragut-north": "Farragut North",
  "metro-center": "Metro Center",
  "gallery-place": "Gallery Pl-Chinatown",
  "federal-triangle": "Federal Triangle",
  archives: "Archives-Navy Mem'l",
  judiciary: "Judiciary Sq",
  "mt-vernon": "Mt Vernon Sq - 7th St Convention Center",
  shaw: "Shaw-Howard Univ",
  "u-street": "U St/African-Amer Civil War Memorial/Cardozo",
  "columbia-heights": "Columbia Heights",
  dupont: "Dupont Circle",
  woodley: "Woodley Park-Zoo Adams Morgan",
  "cleveland-park": "Cleveland Park",
  "van-ness": "Van Ness-UDC",
  tenleytown: "Tenleytown-AU",
  "friendship-heights": "Friendship Heights",
  "foggy-bottom": "Foggy Bottom GWU",
  smithsonian: "Smithsonian",
  lenfant: "L'Enfant Plaza",
  "federal-center": "Federal Center SW",
  "union-station-metro": "Union Station",
  noma: "NoMa - Gallaudet U",
  "rhode-island": "Rhode Island Ave",
  brookland: "Brookland-CUA",
  "fort-totten": "Fort Totten",
  takoma: "Takoma",
  "capitol-south": "Capitol South",
  "eastern-market": "Eastern Market",
  "potomac-ave": "Potomac Ave",
  "stadium-armory": "Stadium Armory",
  benning: "Benning Road",
  minnesota: "Minnesota Ave",
  deanwood: "Deanwood",
  "navy-yard": "Navy Yard - Ballpark",
  waterfront: "Waterfront",
  anacostia: "Anacostia",
  "congress-heights": "Congress Heights",
  "southern-ave": "Southern Ave",
  rosslyn: "Rosslyn",
  "arlington-cemetery": "Arlington|Cemetery",
  pentagon: "Pentagon",
  "pentagon-city": "Pentagon City",
  "crystal-city": "Crystal City",
  "national-airport": "Ronald Reagan Washington National Airport",
  "court-house": "Court House",
  clarendon: "Clarendon",
  "virginia-square": "Virginia Square-GMU",
  ballston: "Ballston-MU",
};

const LANDMARK_QUERIES = {
  whitehouse: "White House, 1600 Pennsylvania Avenue NW, Washington, DC",
  lafayette: "Lafayette Square, Washington, DC",
  "mcpherson-park": "McPherson Square, Washington, DC",
  "farragut-square": "Farragut Square, Washington, DC",
  renwick: "Renwick Gallery, Washington, DC",
  chinatown: "Chinatown Arch, Washington, DC",
  "capital-one-arena": "Capital One Arena, Washington, DC",
  "spy-museum": "International Spy Museum, Washington, DC",
  fords: "Ford's Theatre, Washington, DC",
  portrait: "National Portrait Gallery, Washington, DC",
  "american-art": "Smithsonian American Art Museum, Washington, DC",
  "building-museum": "National Building Museum, Washington, DC",
  "archives-bldg": "National Archives Building, Washington, DC",
  "navy-memorial": "United States Navy Memorial, Washington, DC",
  mall: "National Mall, Washington, DC",
  "washington-monument": "Washington Monument, Washington, DC",
  lincoln: "Lincoln Memorial, Washington, DC",
  vietnam: "Vietnam Veterans Memorial, Washington, DC",
  korean: "Korean War Veterans Memorial, Washington, DC",
  jefferson: "Jefferson Memorial, Washington, DC",
  wwii: "National World War II Memorial, Washington, DC",
  mlk: "Martin Luther King Jr Memorial, Washington, DC",
  fdr: "Franklin Delano Roosevelt Memorial, Washington, DC",
  holocaust: "United States Holocaust Memorial Museum, Washington, DC",
  "african-american": "National Museum of African American History and Culture, Washington, DC",
  "smithsonian-castle": "Smithsonian Institution Building, Washington, DC",
  hirshhorn: "Hirshhorn Museum, Washington, DC",
  "air-space": "National Air and Space Museum, Washington, DC",
  "natural-history": "National Museum of Natural History, Washington, DC",
  "american-history": "National Museum of American History, Washington, DC",
  nga: "National Gallery of Art West Building, Washington, DC",
  "nga-east": "National Gallery of Art East Building, Washington, DC",
  "us-capitol": "United States Capitol, Washington, DC",
  "supreme-court": "Supreme Court of the United States, Washington, DC",
  "library-congress": "Library of Congress Thomas Jefferson Building, Washington, DC",
  botanic: "United States Botanic Garden, Washington, DC",
  "union-station": "Union Station Washington DC",
  "union-market": "Union Market, Washington, DC",
  "eastern-mkt": "Eastern Market, Washington, DC",
  georgetown: "Georgetown Washington DC",
  "georgetown-waterfront": "Georgetown Waterfront Park, Washington, DC",
  "kennedy-center": "John F Kennedy Center for the Performing Arts, Washington, DC",
  wharf: "The Wharf DC, Washington, DC",
  nationals: "Nationals Park, Washington, DC",
  "audi-field": "Audi Field, Washington, DC",
  zoo: "Smithsonian National Zoological Park, Washington, DC",
  cathedral: "Washington National Cathedral, Washington, DC",
  "adams-morgan": "Adams Morgan, Washington, DC",
  "u-street-corridor": "U Street, Washington, DC",
  "howard-theatre": "Howard Theatre, Washington, DC",
  phillips: "The Phillips Collection, Washington, DC",
  "national-geo": "National Geographic Museum, Washington, DC",
  "arlington-cemetery-grounds": "Arlington National Cemetery, Virginia",
  "iwo-jima": "Marine Corps War Memorial, Arlington, Virginia",
  "rock-creek": "Peirce Mill, Rock Creek Park, Washington, DC",
};

function loadMetroCoords() {
  const district = JSON.parse(readFileSync(resolve(__dirname, "metro-district.geojson"), "utf8"));
  const regional = JSON.parse(readFileSync(resolve(__dirname, "metro-regional.geojson"), "utf8"));
  const byName = new Map();
  for (const f of [...district.features, ...regional.features]) {
    byName.set(f.properties.NAME, f.geometry.coordinates);
  }
  const out = {};
  for (const [id, wmataName] of Object.entries(METRO_WMATA_NAMES)) {
    const coords = byName.get(wmataName);
    if (!coords) {
      console.warn(`Missing WMATA station: ${id} -> ${wmataName}`);
      continue;
    }
    out[id] = { lat: coords[1], lng: coords[0] };
  }
  return out;
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`;
  const res = await fetch(url, { headers: { "User-Agent": "bau-connect-map/1.0 (baustudentconnect.com)" } });
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon), display: data[0].display_name };
}

async function geocodeCampus() {
  return geocode("1510 H Street NW, Washington, DC 20005");
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const metro = loadMetroCoords();
  console.log(`Metro stations: ${Object.keys(metro).length}`);

  const campus = await geocodeCampus();
  console.log("Campus:", campus);
  await sleep(1100);

  const landmarks = {};
  for (const [id, query] of Object.entries(LANDMARK_QUERIES)) {
    const hit = await geocode(query);
    landmarks[id] = hit ? { lat: hit.lat, lng: hit.lng } : null;
    console.log(hit ? `${id}: ${hit.lat.toFixed(6)}, ${hit.lng.toFixed(6)}` : `${id}: MISSING`);
    await sleep(1100);
  }

  const output = { campus, metro, landmarks, generatedAt: new Date().toISOString() };
  writeFileSync(resolve(__dirname, "verified-coords.json"), JSON.stringify(output, null, 2));
  console.log("Wrote scripts/verified-coords.json");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
