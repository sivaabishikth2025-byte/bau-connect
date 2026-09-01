/**
 * One-time setup: copy Firebase API key to Google Maps key and enable GCP APIs.
 * Run: node scripts/setup-google-maps.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSign } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

function saveEnv(path, env) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const keys = new Set(Object.keys(env));
  const kept = lines.filter(line => {
    if (!line || line.startsWith("#")) return true;
    const i = line.indexOf("=");
    if (i === -1) return true;
    return !keys.has(line.slice(0, i));
  });
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined) kept.push(`${k}=${v}`);
  }
  writeFileSync(path, kept.filter((l, idx, arr) => !(l === "" && arr[idx + 1] === "")).join("\n") + "\n");
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signInput = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signInput);
  signer.end();
  const sig = signer.sign(sa.private_key).toString("base64url");
  const jwt = `${signInput}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || "Failed to get access token");
  return data.access_token;
}

async function enableApi(projectId, service, token) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${service}:enable`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const text = await res.text();
  if (res.ok || text.includes("ALREADY_ENABLED") || text.includes("already enabled")) {
    console.log(`  ✓ ${service}`);
    return;
  }
  console.warn(`  ! ${service}: ${text.slice(0, 200)}`);
}

const env = loadEnv(envPath);
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY in .env.local");
  process.exit(1);
}

if (!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
  env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = apiKey;
  saveEnv(envPath, { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: apiKey });
  console.log("Added NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local");
} else {
  console.log("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY already set");
}

if (!env.FIREBASE_SERVICE_ACCOUNT) {
  console.log("\nNo FIREBASE_SERVICE_ACCOUNT — enable these APIs manually in Google Cloud Console:");
  console.log("  - Maps JavaScript API");
  console.log("  - Places API");
  console.log(`  Project: ${projectId}`);
  process.exit(0);
}

const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
console.log(`\nEnabling APIs on project ${projectId}...`);
const token = await getAccessToken(sa);
await enableApi(projectId, "maps-backend.googleapis.com", token);
await enableApi(projectId, "places-backend.googleapis.com", token);
console.log("\nDone. Restart dev server.");
console.log("Set on Netlify: netlify env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY <your-key>");
