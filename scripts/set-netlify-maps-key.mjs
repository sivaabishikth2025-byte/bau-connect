import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "..", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith("#"))
    .map(l => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const key = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!key) {
  console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing");
  process.exit(1);
}

execSync(`netlify env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "${key}"`, { stdio: "inherit" });
console.log("Netlify env updated.");
