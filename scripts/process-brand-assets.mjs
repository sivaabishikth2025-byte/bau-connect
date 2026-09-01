/**
 * Remove solid backgrounds and regenerate logo + favicon assets.
 * Run: node scripts/process-brand-assets.mjs
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const LOGO_SOURCE_CANDIDATES = [
  "C:\\Users\\Admin\\Downloads\\White Blue Professional Internship Job Fair Brochure.png",
  resolve(root, "public", "bau-logo-source.png"),
];
const FAVICON_SOURCE_CANDIDATES = [
  "C:\\Users\\Admin\\Downloads\\LOGOS & ICONS.png",
  resolve(root, "public", "bau-favicon-source.png"),
];

function pickSource(candidates) {
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(`No source found: ${candidates.join(", ")}`);
}

function colorDistance(r, g, b, t) {
  const dr = r - t.r;
  const dg = g - t.g;
  const db = b - t.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function removeBackground(input, targets, tolerance) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    for (const t of targets) {
      if (colorDistance(r, g, b, t) <= tolerance) {
        pixels[i + 3] = 0;
        break;
      }
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

const NAVY = [
  { r: 28, g: 45, b: 90 },
  { r: 20, g: 35, b: 75 },
  { r: 15, g: 26, b: 53 },
  { r: 10, g: 22, b: 40 },
];

const WHITE = [
  { r: 255, g: 255, b: 255 },
  { r: 250, g: 250, b: 250 },
  { r: 245, g: 245, b: 245 },
];

const logoSource = pickSource(LOGO_SOURCE_CANDIDATES);
const faviconSource = pickSource(FAVICON_SOURCE_CANDIDATES);

const logoOut = resolve(root, "public", "bau-logo.png");
const iconOut = resolve(root, "src", "app", "icon.png");
const appleOut = resolve(root, "src", "app", "apple-icon.png");
const faviconOut = resolve(root, "public", "favicon.png");
const applePublicOut = resolve(root, "public", "apple-icon.png");

const logoPipeline = (await removeBackground(logoSource, NAVY, 42))
  .trim()
  .png();

await logoPipeline.clone().toFile(logoOut);

const crestPipeline = (await removeBackground(faviconSource, WHITE, 28))
  .trim()
  .resize(512, 512, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

await crestPipeline.clone().png().toFile(iconOut);
await crestPipeline
  .clone()
  .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(appleOut);
await crestPipeline
  .clone()
  .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(faviconOut);
await sharp(appleOut).toFile(applePublicOut);

console.log("Logo:", logoOut);
console.log("Favicon:", iconOut, appleOut, faviconOut);
