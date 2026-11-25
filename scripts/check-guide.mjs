// Checks one guide on its own and draws its six stops, so a guide can be written and verified
// without building the site or loading any other guide.
//
//   node scripts/check-guide.mjs <track>/<concept key>          checks, then contact sheets in light and dark
//   node scripts/check-guide.mjs <track>/<concept key> --no-shots
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

const root = fileURLToPath(new URL("../", import.meta.url));
const [target, ...flags] = process.argv.slice(2);
if (!target || !/^(data|ai|ml)\/[a-z0-9-]+$/.test(target)) {
  console.error("usage: node scripts/check-guide.mjs <data|ai|ml>/<concept key> [--no-shots]");
  process.exit(2);
}
const [track, key] = target.split("/");
const file = join(root, "apps/site/src/guides", track, `${key}.ts`);
if (!existsSync(file)) { console.error(`no guide file at ${file}`); process.exit(2); }
if (!concept(key)) { console.error(`"${key}" is not a concept key in apps/site/src/data/curriculum.ts`); process.exit(2); }

const guide = (await import(pathToFileURL(file).href)).default;
const { sources, claims, errors: shape } = readLedger([key]);
const today = new Date().toISOString().slice(0, 10);
const problems = [
  ...shape,
  ...guideErrors([guide]),
  ...checkLedger({ sources, claims, guides: [guide], today }),
  ...sceneWarnings(guide),
  ...sceneCollisions(guide),
];
if (guide.steps.length !== 6) problems.push(`guide ${key}: has ${guide.steps.length} steps, needs 6`);
if (!guide.scene.iso) problems.push(`guide ${key}: the scene needs an iso grid, so it stands on the floor like every other guide`);
const own = new Set(claims.filter((c) => c.id.startsWith(`${key}-`)).map((c) => c.id));
const used = new Set([...guide.steps.flatMap((s) => s.claims), ...(guide.governance?.claims ?? [])]);
for (const id of own) if (!used.has(id)) problems.push(`claim ${id}: in the ledger fragment but used by no step`);
const text = JSON.stringify(guide);
if (/\b[DAM]\d{2}\b/.test(text.replace(/"id":"[^"]*"/g, ""))) problems.push(`guide ${key}: contains an ID code such as D06. Name concepts by title.`);

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
    await p.screenshot({ path: join(out, `${key}-${theme}.png`) });
    await p.close();
    console.log(`sheet: ${join(out, `${key}-${theme}.png`)}`);
  }
  await browser.close();
}
process.exit(problems.length ? 1 : 0);
