// Checks one guide on its own and draws its six stops, so a guide can be written and verified
// without building the site or loading any other guide.
//
//   node scripts/check-guide.mjs <track>/<concept key>          checks, then contact sheets in light and dark
//   node scripts/check-guide.mjs <track>/<concept key> --no-shots
//   node scripts/check-guide.mjs case/<use case key>             the same for a use case in src/cases/
//
// It reads src/guides/<track>/<key>.ts and src/ledger/guides/<key>.yaml, plus the shared ledger files.
// Exit code 0 means every rule passes. The sheets land in .shots/<key>-light.png and .shots/<key>-dark.png.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkLedger, renderScene, sceneCollisions, sceneWarnings, visibleWords } from "../packages/engine/src/index.ts";
import { readLedger } from "../apps/site/src/ledger/load.ts";
import { concept, guideErrors } from "../apps/site/src/data/curriculum.ts";
import { builtCaseErrors, caseOf } from "../apps/site/src/data/cases.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const [target, ...flags] = process.argv.slice(2);
if (!target || !/^(data|ai|ml|case)\/[a-z0-9-]+$/.test(target)) {
  console.error("usage: node scripts/check-guide.mjs <data|ai|ml>/<concept key> | case/<use case key> [--no-shots]");
  process.exit(2);
}
const [track, key] = target.split("/");
const isCase = track === "case";
const file = isCase ? join(root, "apps/site/src/cases", `${key}.ts`) : join(root, "apps/site/src/guides", track, `${key}.ts`);
if (!existsSync(file)) { console.error(`no guide file at ${file}`); process.exit(2); }
if (isCase && !caseOf(key)) { console.error(`"${key}" is not a use case key in apps/site/src/data/cases.ts`); process.exit(2); }
if (!isCase && !concept(key)) { console.error(`"${key}" is not a concept key in apps/site/src/data/curriculum.ts`); process.exit(2); }

const guide = (await import(pathToFileURL(file).href)).default;
const { sources, claims, errors: shape } = readLedger(isCase ? undefined : [key]); // a use case rests on the references of the concepts it uses
const today = new Date().toISOString().slice(0, 10);
const problems = [
  ...shape,
  ...(isCase ? builtCaseErrors([guide]) : guideErrors([guide])),
  ...checkLedger({ sources, claims, guides: [guide], today }),
  ...sceneWarnings(guide),
  ...sceneCollisions(guide),
];
if (!isCase && guide.steps.length !== 6) problems.push(`guide ${key}: has ${guide.steps.length} steps, needs 6`);
if (!guide.scene.iso) problems.push(`guide ${key}: the scene needs an iso grid, so it stands on the floor like every other guide`);
const own = new Set(claims.filter((c) => c.id.startsWith(isCase ? `case-${key}-` : `${key}-`)).map((c) => c.id));
const used = new Set([...guide.steps.flatMap((s) => s.claims), ...(guide.governance?.claims ?? [])]);
for (const id of own) if (!used.has(id)) problems.push(`claim ${id}: in the ledger fragment but used by no step`);
const text = JSON.stringify(guide);
if (/\b[DAM]\d{2}\b/.test(text.replace(/"id":"[^"]*"/g, "").replace(/"concepts":\[[^\]]*\]/g, ""))) problems.push(`guide ${key}: contains an ID code such as D06. Name concepts by title.`);

console.log(`${guide.title} (${track})`);
guide.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.kind.padEnd(9)} ${String(visibleWords(s)).padStart(2)} words  ${s.title}`));
console.log(`  claims used: ${used.size}, sources in fragment: ${sources.filter((s) => s.id.startsWith(`${key}-`)).length}`);
if (problems.length) { console.log(`\n${problems.length} problem(s):`); for (const p of problems) console.log(`  - ${p}`); }
else console.log("\nAll checks pass.");

if (!flags.includes("--no-shots")) {
  let chromium;
  try { ({ chromium } = await import("playwright-core")); } catch { console.log("\nplaywright-core is not installed, so no sheets were drawn. Run npm install."); process.exit(problems.length ? 1 : 0); }
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), process.platform === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright");
  const shells = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort() : [];
  let executablePath = process.env.SP_CHROMIUM;
  for (const d of shells.reverse()) {
    if (executablePath) break;
    const dir = join(cache, d);
    const hit = readdirSync(dir).flatMap((sub) => ["chrome-headless-shell", "headless_shell"].map((n) => join(dir, sub, n))).find(existsSync);
    if (hit) executablePath = hit;
  }
  const css = readFileSync(join(root, "apps/site/src/styles/theme.css"), "utf8");
  const font = (pkg) => {
    const dir = join(root, "node_modules/@fontsource-variable", pkg);
    return existsSync(dir) ? readFileSync(join(dir, "index.css"), "utf8").replaceAll("url(./files/", `url(${pathToFileURL(join(dir, "files")).href}/`) : "";
  };
  const out = join(root, ".shots");
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  for (const theme of ["light", "dark"]) {
    const html = `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8"><style>${font("overpass")}${font("overpass-mono")}${css}
      body{margin:0;background:#888}.sheet{display:grid;grid-template-columns:735px 735px;gap:1px}
      .frame{position:relative;width:735px;background:var(--card);overflow:hidden}
      .frame b{position:absolute;left:8px;bottom:6px;font:700 11px sans-serif;color:var(--muted)}</style></head>
      <body class="t-${track}"><div class="sheet">${guide.steps.map((s, i) => `<div class="frame"><div class="scene">${renderScene(guide, i)}</div><b>${i + 1}. ${s.label}</b></div>`).join("")}</div></body></html>`;
    const page = join(out, `${key}-${theme}.html`);
    writeFileSync(page, html);
    const p = await browser.newPage({ viewport: { width: 1471, height: 1244 }, colorScheme: theme, reducedMotion: "reduce" });
    await p.goto(pathToFileURL(page).href);
    await p.evaluate(() => document.fonts.ready);
    if (theme === "light") {
      // How much of the canvas each stop's picture fills, rails and stops left out.
      // A stop that is one rail and a few labels leaves most of the canvas empty: its picture is not doing the teaching.
      const fill = await p.evaluate(() => [...document.querySelectorAll(".frame svg")].map((svg) => {
        const f = svg.getBoundingClientRect(), C = 48, R = 27, hit = new Uint8Array(C * R);
        svg.querySelectorAll(".world .el.on").forEach((el) => {
          if (["line", "stop", "arrow"].includes(el.dataset.kind)) return;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const c0 = Math.max(0, Math.floor(((r.left - f.left) / f.width) * C)), c1 = Math.min(C - 1, Math.floor(((r.right - f.left) / f.width) * C));
          const r0 = Math.max(0, Math.floor(((r.top - f.top) / f.height) * R)), r1 = Math.min(R - 1, Math.floor(((r.bottom - f.top) / f.height) * R));
          for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) hit[y * C + x] = 1;
        });
        return Math.round((hit.reduce((a, b) => a + b, 0) / (C * R)) * 100);
      }));
      console.log(`  canvas filled per stop, %: ${fill.join("  ")}`);
      // The opening stops may be bare: they show the situation before the concept arrives.
      const mean = Math.round(fill.reduce((a, b) => a + b, 0) / fill.length);
      if (mean < 18) { problems.push(`the picture fills ${mean}% of the canvas on average, below 18%. A rail with a few labels is not a picture of the concept.`); console.log(`  - too sparse: ${mean}% of the canvas filled on average, needs 18%`); }
      fill.forEach((v, i) => { if (i >= 2 && v < 10) { problems.push(`stop ${i + 1}: the picture fills ${v}% of the canvas, below 10%`); console.log(`  - stop ${i + 1} is too sparse: ${v}% filled, needs 10%`); } });
    }
    await p.screenshot({ path: join(out, `${key}-${theme}.png`), fullPage: true });
    await p.close();
    console.log(`sheet: ${join(out, `${key}-${theme}.png`)}`);
  }
  await browser.close();
}
process.exit(problems.length ? 1 : 0);
