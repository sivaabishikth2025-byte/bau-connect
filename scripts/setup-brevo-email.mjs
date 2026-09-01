/**
 * Brevo (Sendinblue) email setup — free tier, no credit card.
 * Run: node scripts/setup-brevo-email.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) return {};
  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter(l => l && !l.startsWith("#"))
      .map(l => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
}

const env = loadEnv();
const key = env.BREVO_API_KEY;

console.log(`
=== BAU Connect email (Brevo — FREE) ===

No payment or credit card needed for the free plan (300 emails/day).

1. Sign up: https://www.brevo.com
2. Brevo → Settings → SMTP & API → Create API key (v3)
3. Brevo → Senders, Domains & Dedicated IPs → Domains → Add baustudentconnect.com
4. Add the DNS records Brevo shows in Namecheap Advanced DNS
   (keep Netlify A/CNAME + any existing records)

5. Add to .env.local:
   BREVO_API_KEY=xkeysib-...
   EMAIL_FROM=BAU Connect <notifications@baustudentconnect.com>

6. Netlify → Environment variables:
   BREVO_API_KEY
   EMAIL_FROM
   FIREBASE_SERVICE_ACCOUNT
   NEXT_PUBLIC_APP_URL=https://baustudentconnect.com

Then redeploy the site.
`);

if (key?.startsWith("xkeysib-")) {
  console.log("Found BREVO_API_KEY in .env.local — setting on Netlify...\n");
  try {
    execSync(`netlify env:set BREVO_API_KEY "${key}"`, { stdio: "inherit", cwd: root });
    const from = env.EMAIL_FROM || "BAU Connect <notifications@baustudentconnect.com>";
    execSync(`netlify env:set EMAIL_FROM "${from}"`, { stdio: "inherit", cwd: root });
    console.log("\nDone. Redeploy on Netlify.");
  } catch {
    console.log("Add BREVO_API_KEY manually in the Netlify dashboard.");
  }
} else {
  console.log("No BREVO_API_KEY in .env.local yet.");
}
