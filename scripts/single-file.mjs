// Folds one built guide page into a single HTML file for review outside the site. Fonts and scripts are inlined.
// Usage: node scripts/single-file.mjs ml/tabular-foundation-models
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = "apps/site/dist";
const route = process.argv[2] ?? "ml/tabular-foundation-models";
let html = readFileSync(join(dist, route, "index.html"), "utf8");

html = html.replace(/<link rel="stylesheet" href="(\/[^"]+)"[^>]*>/g, (_, href) => `<style>${readFileSync(join(dist, href), "utf8")}</style>`);
html = html.replace(/<script type="module" src="(\/[^"]+)"><\/script>/g, (_, src) => `<script type="module">${readFileSync(join(dist, src), "utf8")}</script>`);
html = html.replace(/@font-face\s*\{[^}]*\}/g, (face) => {
  const url = /url\((\/_astro\/[^)]+\.woff2)\)/.exec(face)?.[1];
  if (!url || !/-latin-(ext-)?wght/.test(url)) return "";
  return face.replace(`url(${url})`, `url(data:font/woff2;base64,${readFileSync(join(dist, url)).toString("base64")})`);
});
html = html.replace(/<link rel="icon"[^>]*>/, "");
// Navigation leaves the file, so the bar keeps only the brand and the theme switch.
html = html.replace(/<nav class="tabs"[\s\S]*?<\/nav>/, "").replace(/<div class="search"[\s\S]*?<\/script>\s*<\/div>/, "").replace(/<button class="lines-btn"[\s\S]*?<\/button>/, "");
html = html.replace(/<aside class="side"[\s\S]*?<\/aside>/, "").replace(/href="\/[^"]*"/g, 'href="#"');
html = html.replace(/<script data-ui>[\s\S]*?<\/script>/, `<script>document.querySelector("[data-theme-toggle]").addEventListener("click",function(){var r=document.documentElement,d=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=d?"light":"dark"});</script>`);

const left = html.match(/(?:src|href)="\/(?!\/)[^"]*"/g);
if (left) console.warn("unresolved site-relative references:", left);
mkdirSync("preview", { recursive: true });
writeFileSync("preview/index.html", html);
console.log(`preview/index.html ${(html.length / 1024).toFixed(0)} KiB`);
