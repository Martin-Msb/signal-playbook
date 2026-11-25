import { esc } from "@signal-path/engine";
import type { Guide } from "@signal-path/engine";
import { concept, tracks, unlocks } from "../data/curriculum.ts";
import type { Stage } from "../data/curriculum.ts";

/** One stop on the map, for the index panel and the hover card. */
export interface Station {
  key: string; title: string; track: string; trackName: string; stage: string; built: boolean; control: boolean;
  understands: string; url?: string; minutes?: number; steps?: number;
  /** Titles of what this concept builds on and unlocks. */
  buildsOn: string[]; unlocks: string[];
}

const W = 980, X0 = 196, X1 = 912, TOP = 62, ROW = 84, BLOCK = 204, GAP = 1.3, R = ROW / 2;
const COL: Record<string, string> = { data: "var(--data)", ai: "var(--ai)", ml: "var(--ml)" };
const HALO = `paint-order="stroke" stroke="var(--card)" stroke-width="6" stroke-linejoin="round"`;

/** Splits a track's stages into two rows at the stage boundary nearest the middle. */
function rows(stages: Stage[]): [Stage[], Stage[]] {
  const total = stages.reduce((n, s) => n + s.concepts.length, 0);
  let best = 1, bestD = Infinity, acc = 0;
  stages.forEach((s, i) => { acc += s.concepts.length; const d = Math.abs(acc - total / 2); if (i < stages.length - 1 && d < bestD) { bestD = d; best = i + 1; } });
  return [stages.slice(0, best), stages.slice(best)];
}
const units = (ss: Stage[]) => ss.reduce((n, s) => n + s.concepts.length, 0) + (ss.length - 1) * GAP;

/**
 * The curriculum as a network: one line per track, folded once, a stop per concept in teaching order.
 * Stops carry no text. The title is one hover away and in the index beside the map.
 */
export function network(guides: Guide[]): { svg: string; stations: Station[]; height: number } {
  const live = new Map(guides.map((g) => [g.slug, g]));
  const stations: Station[] = [];
  let lines = "", mods = "", stns = "", labels = "";
  const H = TOP + tracks.length * BLOCK - 42;

  tracks.forEach((t, ti) => {
    const c = COL[t.key], y1 = TOP + ti * BLOCK, y2 = y1 + ROW;
    const [top, bottom] = rows(t.stages);
    const dx = Math.min(34, (X1 - X0) / (Math.max(units(top), units(bottom)) - 1));
    const pos = new Map<string, { x: number; y: number }>();
    const order: string[] = [];
    const place = (ss: Stage[], y: number, dir: 1 | -1, start: number) => {
      let k = 0;
      for (const s of ss) {
        const xs = s.concepts.map(() => start + dir * dx * k++);
        k += GAP;
        s.concepts.forEach((e, i) => { pos.set(e.key, { x: xs[i], y }); order.push(e.key); });
        const a = Math.min(...xs) - 8, b = Math.max(...xs) + 8, open = s.concepts.filter((e) => live.has(e.key)).length;
        mods += `<path d="M${a} ${y + 22}v6H${b}v-6" fill="none" stroke="var(--rule)" stroke-width="2"/>`
          + `<text x="${a}" y="${y + 45}" font-size="12" font-weight="800" fill="var(--ink)" ${HALO}>${esc(s.name)}</text>`
          + `<text x="${a}" y="${y + 60}" font-size="11.5" font-weight="600" fill="var(--muted)" ${HALO}>${open} of ${s.concepts.length} open</text>`;
      }
    };
    place(top, y1, 1, X0);
    place(bottom, y2, -1, X1);
    const end = Math.min(...bottom.flatMap((s) => s.concepts.map((e) => pos.get(e.key)!.x))) - 30;
    const lastBuilt = Math.max(...order.map((k, i) => (live.has(k) ? i : -1)));
    const full = `M${X0 - 34} ${y1}H${X1 + 14}a${R} ${R} 0 0 1 0 ${ROW}H${end}`;
    let solid = "";
    if (lastBuilt >= 0) {
      const p = pos.get(order[lastBuilt])!;
      solid = p.y === y1 ? `M${X0 - 34} ${y1}H${p.x}` : `M${X0 - 34} ${y1}H${X1 + 14}a${R} ${R} 0 0 1 0 ${ROW}H${p.x}`;
    }
    lines += `<path d="${full}" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".28"/>`
      + (solid ? `<path d="${solid}" stroke="${c}" stroke-width="8" fill="none"/>` : "")
      + `<path d="M${X0 - 34} ${y1 - 10}v20" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`
      + `<path d="M${end} ${y2 - 10}v20" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity=".45"/>`;
    const bw = t.name.length * 11 + 26, openN = t.concepts.filter((e) => live.has(e.key)).length;
    labels += `<rect x="40" y="${y1 - 13}" width="${bw}" height="26" rx="8" fill="${c}"/><text x="52" y="${y1 + 5}" font-size="14.5" font-weight="800" fill="var(--card)">${t.name}</text>`
      + `<text x="40" y="${y1 + 32}" font-size="12.5" font-weight="600" fill="var(--muted)">${openN} of ${t.concepts.length} open</text>`;

    for (const e of t.concepts) {
      const g = live.get(e.key), { x, y } = pos.get(e.key)!;
      const next = unlocks(e.key);
      stations.push({
        key: e.key, title: e.title, track: t.key, trackName: t.name, stage: e.stage, built: !!g, control: e.control, understands: e.understands,
        url: g ? `/${g.track}/${g.slug}/` : undefined, minutes: g?.minutes, steps: g?.steps.length,
        buildsOn: [...e.buildsOn, ...e.seeAlso].map((k) => concept(k)!.title), unlocks: next.map((k) => k.title),
      });
      const attrs = `data-stn="${e.key}" data-needs="${[...e.buildsOn, ...e.seeAlso].join(" ")}" data-next="${next.map((k) => k.key).join(" ")}" aria-label="${esc(`${e.title}, ${g ? "open" : "planned"}`)}"`;
      const ring = `<circle class="ring" cx="${x}" cy="${y}" r="15" fill="none" stroke="var(--ink)" stroke-width="2.5"/>`;
      const hit = `<rect x="${x - dx / 2}" y="${y - 22}" width="${dx}" height="44" fill="transparent"/>`;
      const turn = e.control ? ` transform="rotate(45 ${x} ${y})"` : "";
      const shape = (r: number, extra: string) => e.control
        ? `<rect x="${x - r * 0.86}" y="${y - r * 0.86}" width="${r * 1.72}" height="${r * 1.72}" rx="2"${turn} ${extra}/>`
        : `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
      if (g) {
        stns += `<g class="here" data-here="${e.key}"><circle cx="${x}" cy="${y}" r="21" fill="${c}" opacity=".28"/></g>`
          + `<a class="stn" href="${g ? `/${g.track}/${g.slug}/` : ""}" data-guide="${e.key}" ${attrs}>${hit}${ring}`
          + `<g class="is-open">${shape(9, `fill="var(--card)" stroke="var(--ink)" stroke-width="3.5"`)}</g>`
          + `<g class="is-read">${shape(10, `fill="${c}" stroke="var(--ink)" stroke-width="2.5"`)}<path d="M${x - 4.5} ${y}l3 3 6-6.5" stroke="var(--card)" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></a>`;
      } else {
        stns += `<g class="stn" tabindex="0" ${attrs}>${hit}${ring}${shape(4.2, `fill="var(--card)" stroke="${c}" stroke-width="1.6"`)}</g>`;
      }
    }
  });

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="net-title"><title id="net-title">The curriculum as three lines, Data, AI and ML, each with one stop per concept in teaching order.</title>`
    + `${lines}${mods}${stns}${labels}</svg>`;
  return { svg, stations, height: H };
}
