// Drives the built site in a headless browser and checks that it behaves: stepping, the record's ride,
// scrubbing, what-if, panels, sidebar, search, theme, completion, the Map and phone width.
// Usage: npm run build && node scripts/check-app.mjs
import { createServer } from "node:http";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const dist = fileURLToPath(new URL("../apps/site/dist/", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };
const server = createServer((req, res) => {
  let path = join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
  if (!existsSync(path)) { res.writeHead(404).end("not found"); return; }
  res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }).end(readFileSync(path));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), process.platform === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright");
let executablePath = process.env.SP_CHROMIUM;
for (const d of (existsSync(cache) ? readdirSync(cache).filter((n) => n.startsWith("chromium_headless_shell-")).sort().reverse() : [])) {
  if (executablePath) break;
  executablePath = readdirSync(join(cache, d)).flatMap((sub) => ["chrome-headless-shell", "headless_shell"].map((n) => join(cache, d, sub, n))).find(existsSync);
}
const browser = await chromium.launch(executablePath ? { executablePath } : {});
let failed = 0;
const ok = (name, cond) => { if (!cond) failed++; console.log(cond ? "PASS" : "FAIL", name); };
const errs = [];

{
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`${base}/data/ingestion/`, { waitUntil: "networkidle" });
  ok("a guide starts at stop 1", await p.evaluate(() => document.querySelector(".sp.current")?.dataset.step === "0"));
  ok("the guide states what it builds on and unlocks", await p.evaluate(() => document.querySelectorAll(".path a").length >= 2));
  ok("no ID code is shown", await p.evaluate(() => !/\b[DAM]\d{2}\b/.test(document.querySelector("main").innerText)));
  await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(900);
  const mid = await p.evaluate(() => document.querySelector(".tok.on")?.getAttribute("transform"));
  await p.waitForTimeout(3500);
  const rest = await p.evaluate(() => [document.querySelector(".tok.on")?.getAttribute("transform"), document.querySelector(".tok.on")?.dataset.rest]);
  ok("the record moves during the ride and rests at its stop", mid !== rest[0] && rest[0] === `translate(${rest[1].replace(",", " ")})`);
  ok("the hash follows the stop", (await p.evaluate(() => location.hash)) === "#step-3");
  ok("the changed counter is flagged", await p.evaluate(() => document.querySelectorAll(".srow.ch").length > 0));
  await p.locator("[data-scrub]").fill("300");
  await p.waitForTimeout(100);
  ok("scrubbing moves the record", (await p.evaluate(() => document.querySelector(".tok.on")?.getAttribute("transform"))) !== rest[0]);
  await p.locator("[data-scrub]").blur(); await p.keyboard.press("w"); await p.waitForTimeout(1200);
  ok("what-if shows the counterfactual scene", await p.evaluate(() => document.querySelector("sp-guide").classList.contains("wi")));
  await p.keyboard.press("w"); await p.waitForTimeout(300);
  ok("what-if turns off", await p.evaluate(() => !document.querySelector("sp-guide").classList.contains("wi")));
  const shown = (sel) => p.evaluate((s) => getComputedStyle(document.querySelector(s)).display !== "none", sel);
  await p.click('[data-open-panel="detail"]'); await p.waitForTimeout(150);
  ok("the detail panel opens", await shown('.sp.current [data-panel="detail"]'));
  await p.click('[data-open-panel="governance"]'); await p.waitForTimeout(150);
  ok("the governance panel replaces it", (await shown('[data-panel="governance"]')) && !(await shown('.sp.current [data-panel="detail"]')));
  await p.click('[data-open-panel="references"]'); await p.waitForTimeout(150);
  ok("the reference list opens and links out", (await shown('[data-panel="references"]')) && (await p.evaluate(() => document.querySelectorAll('[data-panel="references"] a[href^="http"]').length > 0)));
  await p.click("[data-side-toggle]"); await p.waitForTimeout(400);
  ok("the sidebar opens with only the current path expanded", await p.evaluate(() => document.documentElement.classList.contains("side-open") && document.querySelectorAll(".side details.trk[open]").length === 1));
  await p.click("[data-side-toggle]");
  await p.click("[data-theme-toggle]");
  ok("the theme toggles", await p.evaluate(() => document.documentElement.dataset.theme === "dark"));
  for (let i = 0; i < 5; i++) await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(300);
  ok("finishing marks the guide read", await p.evaluate(() => JSON.parse(localStorage.getItem("sp-done") || "[]").includes("ingestion")));
  await p.keyboard.press("Meta+k"); await p.keyboard.type("agent mem");
  await p.waitForTimeout(200);
  ok("search finds a concept", await p.evaluate(() => [...document.querySelectorAll("#search-results a")].some((a) => a.textContent.includes("Agent memory"))));
  await p.keyboard.press("Enter"); await p.waitForURL("**/ai/agent-memory/");
  ok("enter opens the result", p.url().includes("agent-memory"));

  await p.goto(`${base}/ml/loss-and-optimisation/#step-3`, { waitUntil: "networkidle" });
  await p.keyboard.press("r"); await p.waitForTimeout(700);
  const a = await p.evaluate(() => document.querySelector(".tok.on")?.getAttribute("transform"));
  await p.waitForTimeout(3000);
  const b = await p.evaluate(() => document.querySelector(".tok.on")?.getAttribute("transform"));
  ok("a record rides a curve on a chart", !!a && a !== b);

  await p.goto(`${base}/map/`, { waitUntil: "networkidle" });
  ok("the map marks the finished guide read", await p.evaluate(() => document.querySelector('.net [data-stn="ingestion"]').classList.contains("read")));
  const stops = await p.evaluate(() => document.querySelectorAll(".net [data-stn]").length);
  ok(`the map has a stop for every concept (${stops})`, stops > 100);
  await p.hover('.net [data-stn="change-data-capture"]'); await p.waitForTimeout(150);
  ok("hovering a stop shows its card and what it builds on", await p.evaluate(() => !document.querySelector("[data-insp]").hidden && document.querySelector("[data-insp]").textContent.includes("Builds on") && document.querySelectorAll(".net .stn.need").length > 0));
  await p.goto(`${base}/references/`); await p.waitForURL("**/map**", { timeout: 5000 }).catch(() => {});
  ok("the old References route leads to the Map", p.url().includes("/map"));
  await c.close();
}
{
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  for (const route of ["/data/ingestion/#step-3", "/ml/loss-and-optimisation/#step-4", "/map/"]) {
    await p.goto("about:blank"); await p.goto(base + route, { waitUntil: "networkidle" });
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(`no sideways scroll at phone width on ${route}`, over <= 0);
  }
  await c.close();
}
ok("no page errors", errs.length === 0);
if (errs.length) console.log(errs.slice(0, 5));
await browser.close();
server.close();
console.log(failed ? `${failed} check(s) failed` : "All app checks pass.");
process.exit(failed ? 1 : 0);
