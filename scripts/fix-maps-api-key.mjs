/**
 * Fix ApiTargetBlockedMapError: add Maps + Places to Firebase browser API key restrictions.
 * Run: node scripts/fix-maps-api-key.mjs
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectId = "baudate-8fdb8";
const projectNumber = "831204733200";
const configPath = resolve(homedir(), ".config", "configstore", "firebase-tools.json");

const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "..", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith("#"))
    .map(l => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);
const targetKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY;

const config = JSON.parse(readFileSync(configPath, "utf8"));
const tokens = config.tokens;

async function getUserAccessToken() {
  if (tokens.access_token && tokens.expires_at > Date.now()) {
    return tokens.access_token;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      client_secret: "j9pD0sN4pBorFn2k1KjgXDaS",
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || "Token refresh failed");
  return data.access_token;
}

const MAP_SERVICES = [
  "maps-backend.googleapis.com",
  "places-backend.googleapis.com",
];

const FIREBASE_SERVICES = [
  "firebase.googleapis.com",
  "firebaseappcheck.googleapis.com",
  "firebaserules.googleapis.com",
  "firebasestorage.googleapis.com",
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "fcmregistrations.googleapis.com",
];

const REFERRERS = [
  "http://localhost/*",
  "http://localhost:3000/*",
  "http://localhost:3001/*",
  "http://localhost:3002/*",
  "http://127.0.0.1/*",
  "http://127.0.0.1:3000/*",
  "http://127.0.0.1:3001/*",
  "http://127.0.0.1:3002/*",
  "https://baustudentconnect.com/*",
  "https://*.baustudentconnect.com/*",
  "https://bau-connect.netlify.app/*",
  "https://*.bau-connect.netlify.app/*",
  "https://baudate-8fdb8.firebaseapp.com/*",
  "https://baudate-8fdb8.web.app/*",
];

async function api(token, path, options = {}) {
  const res = await fetch(`https://apikeys.googleapis.com/v2/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

function mergeApiTargets(existing = []) {
  const byService = new Map(existing.map(t => [t.service, t]));
  for (const service of [...FIREBASE_SERVICES, ...MAP_SERVICES]) {
    if (!byService.has(service)) byService.set(service, { service });
  }
  return [...byService.values()];
}

function mergeReferrers(existing = []) {
  const set = new Set(existing);
  for (const r of REFERRERS) set.add(r);
  return [...set];
}

const token = await getUserAccessToken();

// Enable API Keys API if needed
await fetch(`https://serviceusage.googleapis.com/v1/projects/${projectId}/services/apikeys.googleapis.com:enable`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: "{}",
}).catch(() => {});

const list = await api(token, `projects/${projectNumber}/locations/global/keys`);
const keys = list.keys || [];
if (!keys.length) {
  console.error("No API keys found");
  process.exit(1);
}

let updated = 0;
for (const key of keys) {
  const keyId = key.name.split("/").pop();
  const keyStringRes = await api(token, `projects/${projectNumber}/locations/global/keys/${keyId}/keyString`);
  const keyString = keyStringRes.keyString?.replace(/^key=/, "") || "";

  if (targetKey && keyString !== targetKey) continue;

  const full = await api(token, `projects/${projectNumber}/locations/global/keys/${keyId}`);
  const existingTargets = full.restrictions?.apiTargets || [];
  const existingReferrers = full.restrictions?.browserKeyRestrictions?.allowedReferrers || [];

  const restrictions = {
    apiTargets: mergeApiTargets(existingTargets),
    browserKeyRestrictions: {
      allowedReferrers: mergeReferrers(existingReferrers),
    },
  };

  await api(
    token,
    `projects/${projectNumber}/locations/global/keys/${keyId}?updateMask=restrictions`,
    { method: "PATCH", body: JSON.stringify({ restrictions }) }
  );

  console.log(`Updated API key: ${full.displayName || keyId}`);
  updated++;
}

if (!updated) {
  console.error("No matching API key found to update");
  process.exit(1);
}

console.log("Done — restart dev server and hard refresh the map page.");
