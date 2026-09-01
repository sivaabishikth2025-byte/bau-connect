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

const LOGO_DARK_SOURCE_CANDIDATES = [
  "C:\\Users\\Admin\\Downloads\\White Blue Professional Internship Job Fair Brochure.png",
  resolve(root, "public", "bau-logo-source.png"),
];
const LOGO_LIGHT_SOURCE_CANDIDATES = [
  "C:\\Users\\Admin\\Downloads\\LOGOS & ICONS (1).png",
  resolve(root, "public", "bau-logo-light-source.png"),
];
const FAVICON_SOURCE_CANDIDATES = [
  "C:\\Users\\Admin\\Downloads\\LOGOS & ICONS.png",
  resolve(root, "public", "bau-favicon-source.png"),
];

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

const NAVY_INK = { r: 28, g: 45, b: 90 };

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

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isGold(r, g, b) {
  return r > 140 && g > 110 && b < 120 && r > b + 20;
}

function isWhiteish(r, g, b, a) {
  if (a < 24) return false;
  if (isGold(r, g, b)) return false;
  if (luminance(r, g, b) > 205) return true;
  if (r > 185 && g > 185 && b > 185) return true;
  return false;
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

/** Flood-fill white from image edges so enclosed logo colors stay intact. */
async function removeWhiteBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixels = Buffer.from(data);
  const visited = new Uint8Array(width * height);
  const queue = [];

  const isBg = (x, y) => {
    const i = (y * width + x) * 4;
    const a = pixels[i + 3];
    if (a < 24) return true;
    return isWhiteish(pixels[i], pixels[i + 1], pixels[i + 2], a);
  };

  for (let x = 0; x < width; x++) {
    queue.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    queue.push([0, y], [width - 1, y]);
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const idx = y * width + x;
    if (visited[idx]) continue;
    if (!isBg(x, y)) continue;
    visited[idx] = 1;
    pixels[(y * width + x) * 4 + 3] = 0;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return sharp(pixels, {
    raw: { width, height, channels: 4 },
  });
}

async function toLightLogo(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    if (!isWhiteish(r, g, b, a)) continue;
    pixels[i] = NAVY_INK.r;
    pixels[i + 1] = NAVY_INK.g;
    pixels[i + 2] = NAVY_INK.b;
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

const logoDarkSource = pickSource(LOGO_DARK_SOURCE_CANDIDATES);
const logoLightSource = pickSource(LOGO_LIGHT_SOURCE_CANDIDATES);
const faviconSource = pickSource(FAVICON_SOURCE_CANDIDATES);

const logoDarkOut = resolve(root, "public", "bau-logo-dark.png");
const logoLightOut = resolve(root, "public", "bau-logo-light.png");
const logoDefaultOut = resolve(root, "public", "bau-logo.png");
const iconOut = resolve(root, "src", "app", "icon.png");
const appleOut = resolve(root, "src", "app", "apple-icon.png");
const faviconOut = resolve(root, "public", "favicon.png");
const applePublicOut = resolve(root, "public", "apple-icon.png");

const logoDarkBuffer = await (await removeBackground(logoDarkSource, NAVY, 42)).trim().png().toBuffer();
await sharp(logoDarkBuffer).toFile(logoDarkOut);
await sharp(logoDarkBuffer).toFile(logoDefaultOut);

const logoLightBuffer = await (await removeWhiteBackground(logoLightSource)).trim().png().toBuffer();
await sharp(logoLightBuffer).toFile(logoLightOut);

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

console.log("Logo dark:", logoDarkOut);
console.log("Logo light:", logoLightOut);
console.log("Favicon:", iconOut, appleOut, faviconOut);
