// Folds the whole built site into one HTML file with hash navigation, for review where only a single file can be hosted.
// Fonts, styles and scripts are inlined. Usage: npm run build && node scripts/single-app.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = "apps/site/dist";
const read = (route) => readFileSync(join(dist, route, "index.html"), "utf8");
const pick = (html, re) => (re.exec(html) ?? [])[1] ?? "";
const mainOf = (html) => pick(html, /<main[^>]*>([\s\S]*)<\/main>/).replace(/<footer[\s\S]*?<\/footer>/, "").replace(/<script type="module"[\s\S]*?<\/script>/g, "");
const stylesOf = (html) => html.match(/<style[^>]*>[\s\S]*?<\/style>/g) ?? [];
const inlineScript = (html, attr) => pick(html, new RegExp(`<script${attr ? " " + attr : ""}>([\\s\\S]*?)<\\/script>`));

const pages = [];
for (const track of ["data", "ai", "ml"]) {
  const dir = join(dist, track);
  if (!existsSync(dir)) continue;
  for (const slug of readdirSync(dir)) {
    const html = read(`${track}/${slug}`);
    pages.push({ track, slug, html, id: pick(html, /<sp-guide data-id="([a-z0-9-]+)"/) });
  }
}
const home = read(""), map = read("map");
const first = pick(home, /<sp-guide data-id="([a-z0-9-]+)"/);

// Styles: one copy, with the Latin font files embedded and the other subsets dropped.
let styles = [...new Set([home, map, ...pages.map((p) => p.html)].flatMap(stylesOf))].join("");
styles = styles.replace(/@font-face\s*\{[^}]*\}/g, (face) => {
  const url = pick(face, /url\((\/_astro\/[^)]+\.woff2)\)/);
  if (!url || !/-latin-(ext-)?wght/.test(url)) return "";
  return face.replace(`url(${url})`, `url(data:font/woff2;base64,${readFileSync(join(dist, url)).toString("base64")})`);
});
const runtimeSrc = pick(pages[0].html, /<script type="module" src="(\/[^"]+)">/);
const runtime = runtimeSrc ? readFileSync(join(dist, runtimeSrc), "utf8") : pick(pages[0].html, /<script type="module">([\s\S]*?)<\/script>/);

const relink = (html) => {
  for (const p of pages) {
    html = html.replaceAll(new RegExp(`href="/${p.track}/${p.slug}/#step-\\d+"`, "g"), `href="#${p.id}"`);
    html = html.replaceAll(`href="/${p.track}/${p.slug}/"`, `href="#${p.id}"`);
  }
  return html.replace(/href="\/map\/#[a-z0-9-]+"/g, 'href="#map"').replaceAll('href="/map/"', 'href="#map"').replaceAll('href="/"', `href="#${first}"`);
};
const guideView = (p) => `<div class="view t-${p.track}" id="${p.id}" data-tab="learn" hidden>${mainOf(p.html).replace("<sp-guide", '<sp-guide data-hash="off"').replace(/ id="stop-\d+"/g, "")}</div>`;

const shell = relink(home.slice(home.indexOf("<header"), home.indexOf("<main")).replace(/ aria-current="page"/g, "").replace(/class="g current"/g, 'class="g"'));
const views = relink(pages.map(guideView).join("\n")
  + `\n<div class="view" id="map" data-tab="map" hidden>${mainOf(map)}</div>`);
// Search results and map stations build their links from JSON: point those at the hash routes too.
const urls = Object.fromEntries(pages.map((p) => [`/${p.track}/${p.slug}/`, `#${p.id}`]));
const relinkJson = (html) => html.replace(/"(\/(?:data|ai|ml)\/[^"]+\/)"/g, (m, u) => (urls[u] ? `"${urls[u]}"` : m)).replace(/"\/map\/#[a-z0-9-]+"/g, '"#map"');

const router = `const views=[...document.querySelectorAll(".view")];
function show(){let id=(location.hash||"#${first}").slice(1);const v=document.getElementById(id);if(!v||!v.classList.contains("view"))return;
views.forEach(x=>x.hidden=x!==v);
document.querySelectorAll(".tabs a").forEach(a=>a.classList.toggle("current",a.dataset.tab===v.dataset.tab));
document.querySelectorAll("a.g[data-guide]").forEach(a=>a.classList.toggle("current",a.dataset.guide===id));
if(v.dataset.tab==="learn")document.querySelectorAll(".side details").forEach(d=>d.open=!!d.querySelector("a.g.current"));
scrollTo(0,0);}
addEventListener("hashchange",show);show();`;

const html = relinkJson(`<!DOCTYPE html>
<html lang="en" data-single="1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Signal Path</title>
<script>${inlineScript(home, "")}</script>
${styles}</head><body>
${shell}<main>
${views}
<footer>${pick(home, /<footer>([\s\S]*?)<\/footer>/)}</footer>
</main></div>
<script>${router}</script>
<script type="module">${runtime}</script>
<script>${inlineScript(home, "data-ui")}</script>
</body></html>`);

const left = html.match(/(?:src|href)="\/(?!\/)[^"]*"/g);
if (left) console.warn("unresolved site-relative references:", [...new Set(left)]);
mkdirSync("preview", { recursive: true });
writeFileSync("preview/app.html", html);
console.log(`preview/app.html ${(html.length / 1024).toFixed(0)} KiB, ${pages.length} guides`);
