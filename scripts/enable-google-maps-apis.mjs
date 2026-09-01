/**
 * Enable Maps + Places APIs using Firebase CLI user credentials.
 * Run: node scripts/enable-google-maps-apis.mjs
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const projectId = "baudate-8fdb8";
const configPath = resolve(homedir(), ".config", "configstore", "firebase-tools.json");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const tokens = config.tokens;
if (!tokens?.refresh_token) {
  console.error("Run: npx firebase-tools@latest login");
  process.exit(1);
}

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

async function enableApi(service, token) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${service}:enable`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const text = await res.text();
  if (res.ok || /ALREADY_ENABLED|already enabled/i.test(text)) {
    console.log(`Enabled: ${service}`);
    return true;
  }
  console.error(`Failed: ${service}`);
  console.error(text.slice(0, 400));
  return false;
}

const token = await getUserAccessToken();
const services = [
  "maps-backend.googleapis.com",
  "places-backend.googleapis.com",
];
let ok = true;
for (const s of services) {
  if (!(await enableApi(s, token))) ok = false;
}
process.exit(ok ? 0 : 1);
