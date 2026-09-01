/**
 * Enable Maps + Places APIs using Firebase CLI user credentials.
 * Run: node scripts/enable-google-maps-apis.mjs
 */
import { getFirebaseCliAccessToken } from "./firebase-cli-auth.mjs";

const projectId = "baudate-8fdb8";

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

const token = await getFirebaseCliAccessToken();
const services = [
  "maps-backend.googleapis.com",
  "places-backend.googleapis.com",
];
let ok = true;
for (const s of services) {
  if (!(await enableApi(s, token))) ok = false;
}
process.exit(ok ? 0 : 1);
