/**
 * Local-only helper: refresh Firebase CLI user OAuth token.
 * Set FIREBASE_CLI_CLIENT_SECRET in your shell (never commit it).
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const CLIENT_ID =
  process.env.FIREBASE_CLI_CLIENT_ID ||
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";

export function loadFirebaseCliTokens() {
  const configPath = resolve(homedir(), ".config", "configstore", "firebase-tools.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const tokens = config.tokens;
  if (!tokens?.refresh_token) {
    throw new Error("Run: npx firebase-tools@latest login");
  }
  return tokens;
}

export async function getFirebaseCliAccessToken(tokens = loadFirebaseCliTokens()) {
  if (tokens.access_token && tokens.expires_at > Date.now()) {
    return tokens.access_token;
  }

  const clientSecret = process.env.FIREBASE_CLI_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error(
      "Set FIREBASE_CLI_CLIENT_SECRET in your environment to run this script locally."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description || "Token refresh failed");
  }
  return data.access_token;
}
