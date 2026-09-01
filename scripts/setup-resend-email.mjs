/**
 * Print Resend + Netlify setup steps.
 * Run: node scripts/setup-resend-email.mjs
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
const key = env.RESEND_API_KEY;

console.log(`
=== BAU Connect email setup (Resend) ===

1. Create a free account: https://resend.com/signup
2. Resend → Domains → Add baustudentconnect.com
3. Copy the DNS records Resend gives you into Namecheap (Advanced DNS)
   Keep your existing Netlify A/CNAME and email records.
4. Resend → API Keys → Create key → copy it

5. Add to .env.local:
   RESEND_API_KEY=re_...
   EMAIL_FROM=BAU Connect <notifications@baustudentconnect.com>

6. On Netlify (bau-connect → Environment variables), set:
   RESEND_API_KEY
   EMAIL_FROM
   FIREBASE_SERVICE_ACCOUNT  (same JSON as local)
   NEXT_PUBLIC_APP_URL=https://baustudentconnect.com

Resend free tier: 3,000 emails/month — enough for campus notifications.
`);

if (key?.startsWith("re_")) {
  console.log("Found RESEND_API_KEY in .env.local — setting on Netlify...\n");
  try {
    execSync(`netlify env:set RESEND_API_KEY "${key}"`, { stdio: "inherit", cwd: root });
    const from = env.EMAIL_FROM || "BAU Connect <notifications@baustudentconnect.com>";
    execSync(`netlify env:set EMAIL_FROM "${from}"`, { stdio: "inherit", cwd: root });
    console.log("\nNetlify env updated. Redeploy the site for changes to take effect.");
  } catch {
    console.log("Could not set Netlify env automatically. Add variables in the Netlify dashboard.");
  }
} else {
  console.log("No RESEND_API_KEY in .env.local yet — add it after creating your Resend account.");
}
