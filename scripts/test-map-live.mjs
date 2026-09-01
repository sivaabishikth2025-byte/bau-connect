/**
 * Live map smoke test — run: node scripts/test-map-live.mjs
 */
import { chromium } from "playwright";

const URL = process.env.MAP_TEST_URL || "https://baustudentconnect.com/map";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const consoleErrors = [];
  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", err => consoleErrors.push(err.message));

  console.log("Opening", URL);
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);

  const bodyText = await page.locator("body").innerText();

  if (bodyText.includes("Map API key missing")) {
    console.log("FAIL: API key missing on production build");
    await browser.close();
    process.exit(1);
  }
  if (bodyText.includes("Google Maps could not load")) {
    console.log("FAIL: Google Maps load error on production");
    await browser.close();
    process.exit(1);
  }

  // Wait for Google map canvas/tiles
  const mapCanvas = page.locator(".gm-style");
  try {
    await mapCanvas.first().waitFor({ state: "visible", timeout: 30000 });
    console.log("OK: Google Maps rendered");
  } catch {
    console.log("FAIL: Google Maps did not render within 30s");
    console.log("Page snippet:", bodyText.slice(0, 500));
    await browser.close();
    process.exit(1);
  }

  const initialSidebar = await page.locator(".bg-white.rounded-3xl.shadow-lg.p-5").first().innerText();
  console.log("Initial sidebar:", initialSidebar.split("\n").slice(0, 3).join(" | "));

  // Test 1: list click — McPherson Square
  const metroBtn = page.getByRole("button", { name: /McPherson Square/i }).first();
  await metroBtn.click();
  await page.waitForTimeout(2500);
  const afterList = await page.locator(".bg-white.rounded-3xl.shadow-lg.p-5").first().innerText();
  const listWorked = /McPherson Square/i.test(afterList) && /WMATA Metro/i.test(afterList);
  console.log(listWorked ? "OK: List click updated sidebar to McPherson Square" : "FAIL: List click did not update sidebar");
  if (!listWorked) console.log("Sidebar after list:", afterList.slice(0, 300));

  // Test 2: map click after list pans to McPherson — center click should match nearest station
  let mapWorked = false;
  const mapBox = await mapCanvas.first().boundingBox();
  if (mapBox) {
    const cx = mapBox.x + mapBox.width * 0.5;
    const cy = mapBox.y + mapBox.height * 0.5;
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(2000);
    const afterMapClick = await page.locator(".bg-white.rounded-3xl.shadow-lg.p-5").first().innerText();
    mapWorked = /McPherson Square|Metro|WMATA/i.test(afterMapClick);
    console.log(mapWorked ? "OK: Map click selected a location in sidebar" : "FAIL: Map click did not update sidebar");
    if (!mapWorked) console.log("Sidebar after map click:", afterMapClick.slice(0, 300));
  }

  // Test 3: back to campus list
  await page.getByRole("button", { name: /Back to campus/i }).click();
  await page.waitForTimeout(1500);
  const afterCampus = await page.locator(".bg-white.rounded-3xl.shadow-lg.p-5").first().innerText();
  const campusWorked = /Bay Atlantic University/i.test(afterCampus);
  console.log(campusWorked ? "OK: Back to campus works" : "FAIL: Back to campus broken");

  if (consoleErrors.length) {
    console.log("\nConsole errors:");
    for (const e of consoleErrors.slice(0, 8)) console.log(" -", e.slice(0, 200));
  }

  await browser.close();

  const passed = listWorked && campusWorked && mapWorked;
  console.log(passed ? "\nRESULT: Core interactions work" : "\nRESULT: Some interactions failed");
  process.exit(passed ? 0 : 1);
}

main().catch(err => {
  console.error("Test crashed:", err);
  process.exit(1);
});
