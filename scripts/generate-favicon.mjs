/**
 * Generate favicon assets from BAU crest PNG.
 * Run: node scripts/generate-favicon.mjs
 */
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const source =
  process.argv[2] ||
  resolve(root, "public", "bau-favicon-source.png");

const outIcon = resolve(root, "src", "app", "icon.png");
const outApple = resolve(root, "src", "app", "apple-icon.png");
const outPublic = resolve(root, "public", "favicon.png");

const pipeline = sharp(source).trim({ threshold: 12 }).resize(512, 512, {
  fit: "contain",
  background: { r: 0, g: 0, b: 0, alpha: 0 },
});

await pipeline.clone().png().toFile(outIcon);
await pipeline.clone().resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outApple);
await pipeline.clone().resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outPublic);

console.log("Wrote:", outIcon, outApple, outPublic);
