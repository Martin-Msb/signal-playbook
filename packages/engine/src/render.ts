import type {
  ArrowEl, BlocksEl, BoxEl, CellsEl, CodeEl, DbEl, DocEl, DrumEl, El, Guide, Hue, Iso, Item, LabelEl, LayersEl, LineEl, ListEl, MarksEl, MatrixEl, ModelEl,
  NodeEl, PawnEl, PersonEl, PillEl, PlotEl, PrismEl, Pt, Ride, Row, SeriesEl, SheetsEl, Side, SlabEl, StopEl, TableEl, TankEl, Tone, TreeEl, WindowEl, ZoneEl,
} from "./types.ts";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TONE: Record<Tone, string> = { ink: "var(--ink)", muted: "var(--muted)", track: "var(--tc)", alert: "var(--alert)" };
const WASH: Record<Tone, string> = { ink: "var(--card)", muted: "var(--card)", track: "var(--tw)", alert: "var(--aw)" };
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Approximate advance of a string, for layout checks and pill widths. Calibrated on Overpass and Overpass Mono. */
export function textWidth(s: string, size: number, o: { mono?: boolean; bold?: boolean } = {}): number {
  if (o.mono) return s.length * size * 0.6;
  let w = 0;
  for (const ch of s) {
    if (/[il.,:;'|!]/.test(ch)) w += 0.25;
    else if (/[fjrt()\[\] ]/.test(ch)) w += 0.32;
    else if (/[mwMW]/.test(ch)) w += 0.82;
    else if (/[A-Z0-9]/.test(ch)) w += 0.62;
    else w += 0.52;
  }
  return w * size * (o.bold ? 1.06 : 1);
}

/** 24 by 24 stroke glyphs for plates and the interface. */
export const ICONS: Record<string, string> = {
  gear: "M10.3 3h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  chevrons: "M4 6l6 6-6 6 M11 6l6 6-6 6 M18 6l3 6-3 6",
  shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z M9 12l2 2 4-4",
  chart: "M4 20V4 M4 20h16 M8 16v-5 M12 16V8 M16 16v-3",
  wrench: "M14.5 5.5a4 4 0 015 5l-9 9a2.1 2.1 0 01-3-3l9-9 M14.5 5.5l-2 2 3 3 2-2",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18",
  pointer: "M5 12h11 M12 7l5 5-5 5 M4 5v14",
  pen: "M4 20l4-1 11-11-3-3L5 16z M14 6l3 3",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 100 6 3 3 0 000-6z",
  play: "M7 4l13 8-13 8z",
  lock: "M6 11h12v9H6z M8 11V8a4 4 0 018 0v3",
  file: "M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c0-4 3.6-6 8-6s8 2 8 6",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14z M16 16l4 4",
  merge: "M5 4v4a4 4 0 004 4h6 M5 20v-4a4 4 0 014-4 M15 8l4 4-4 4",
  sort: "M7 4v16 M4 7l3-3 3 3 M14 6h7 M14 12h5 M14 18h3",
  check: "M4 12l5 5L20 6",
  x: "M6 6l12 12 M18 6L6 18",
  clock: "M12 4a8 8 0 100 16 8 8 0 000-16z M12 8v4l3 2",
  layers: "M12 3l9 5-9 5-9-5z M3 13l9 5 9-5",
  mail: "M3 6h18v12H3z M3 6l9 7 9-7",
  loop: "M20 12a8 8 0 01-14.3 5 M4 12a8 8 0 0114.3-5 M18 3v4h-4 M6 21v-4h4",
  flag: "M5 21V4 M5 4h12l-2 4 2 4H5",
  scale: "M12 4v16 M5 8h14 M5 8l-3 6h6z M19 8l-3 6h6z M8 20h8",
  stack: "M4 7h16 M4 12h16 M4 17h16",
  code: "M8 7l-5 5 5 5 M16 7l5 5-5 5 M13.5 5l-3 14",
  net: "M7 7a2 2 0 11-4 0 2 2 0 014 0z M7 17a2 2 0 11-4 0 2 2 0 014 0z M14 12a2 2 0 11-4 0 2 2 0 014 0z M21 7a2 2 0 11-4 0 2 2 0 014 0z M21 17a2 2 0 11-4 0 2 2 0 014 0z M6.7 8.1l3.6 2.8 M6.7 15.9l3.6-2.8 M13.7 10.9l3.6-2.8 M13.7 13.1l3.6 2.8",
  tree: "M12 4a2 2 0 100 4 2 2 0 000-4z M6 16a2 2 0 100 4 2 2 0 000-4z M18 16a2 2 0 100 4 2 2 0 000-4z M11 7.7L7 16.2 M13 7.7l4 8.5",
  table: "M4 5h16v14H4z M4 10h16 M4 14.5h16 M10 10v9",
  funnel: "M4 5h16l-6 7v6l-4 2v-8z",
  split: "M12 21v-7 M12 14L6 8 M12 14l6-6 M3 5h6v3 M15 5h6v3",
  key: "M15 9a4 4 0 11-3.9 4.9L4 21 M7 18l2 2 M10 15l2 2",
  moon: "M20 14a8 8 0 01-10-10 8 8 0 1010 10z",
  map: "M4 6.5h5l6 11h5 M9 6.5h11 M4 17.5h5",
  doc: "M6 3h9l3 3v15H6z M9 10h6 M9 14h6 M9 18h3",
  lines: "M4 6h16 M4 12h16 M4 18h10",
  replay: "M4 12a8 8 0 108-8H8 M8 1v6h6",
  arrowR: "M5 12h14 M13 6l6 6-6 6",
  arrowL: "M19 12H5 M11 6l-6 6 6 6",
  sun: "M12 7a5 5 0 100 10 5 5 0 000-10z M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4.2 4.2l2.1 2.1 M17.7 17.7l2.1 2.1 M4.2 19.8l2.1-2.1 M17.7 6.3l2.1-2.1",
};
export const glyph = (name: string, x: number, y: number, size: number, color: string, sw = 2) =>
  `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1((size / 24) * 1000) / 1000})" fill="none" stroke="${color}" stroke-width="${r1((sw * 24) / size)}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name] ?? ""}"/></g>`;

/* ---------- geometry ---------- */

/** SVG path through the points with rounded corners. */
export function routePath(pts: Pt[], radius = 16, loop = false): string {
  const P = loop ? [...pts, pts[0], pts[1]] : pts;
  if (P.length < 2) return "";
  let d = loop ? "" : `M${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length - 1; i++) {
    const [ax, ay] = P[i - 1], [bx, by] = P[i], [cx, cy] = P[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const p1: Pt = [bx - ((bx - ax) / l1) * r, by - ((by - ay) / l1) * r];
    const p2: Pt = [bx + ((cx - bx) / l2) * r, by + ((cy - by) / l2) * r];
    d += (d ? ` L${r1(p1[0])} ${r1(p1[1])}` : `M${r1(p1[0])} ${r1(p1[1])}`) + ` Q${bx} ${by} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  if (!loop) d += ` L${P.at(-1)![0]} ${P.at(-1)![1]}`;
  else d += " Z";
  return d;
}

/** Dense samples of the rounded route with cumulative length, so engine and browser agree on positions. */
export function sampleRoute(pts: Pt[], radius = 16, loop = false): { x: number; y: number; s: number }[] {
  const P = loop ? [...pts, pts[0], pts[1]] : pts;
  const out: { x: number; y: number; s: number }[] = [];
  let s = 0;
  const push = (x: number, y: number) => {
    const last = out.at(-1);
    if (last) s += Math.hypot(x - last.x, y - last.y);
    out.push({ x, y, s });
  };
  if (!loop) push(P[0][0], P[0][1]);
  for (let i = 1; i < P.length - 1; i++) {
    const [ax, ay] = P[i - 1], [bx, by] = P[i], [cx, cy] = P[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const p1: Pt = [bx - ((bx - ax) / l1) * r, by - ((by - ay) / l1) * r];
    const p2: Pt = [bx + ((cx - bx) / l2) * r, by + ((cy - by) / l2) * r];
    push(p1[0], p1[1]);
    for (let t = 0.125; t <= 1; t += 0.125) {
      const u = 1 - t;
      push(u * u * p1[0] + 2 * u * t * bx + t * t * p2[0], u * u * p1[1] + 2 * u * t * by + t * t * p2[1]);
    }
  }
  if (!loop) push(P.at(-1)![0], P.at(-1)![1]);
  else push(out[0].x, out[0].y);
  return out;
}

function pointAt(samples: { x: number; y: number; s: number }[], f: number): Pt {
  const total = samples.at(-1)!.s, target = Math.max(0, Math.min(1, f)) * total;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if (b.s >= target) {
      const t = b.s === a.s ? 0 : (target - a.s) / (b.s - a.s);
      return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
    }
  }
  return [samples.at(-1)!.x, samples.at(-1)!.y];
}

/** Fraction of the route nearest to a point. */
export function fractionOf(samples: { x: number; y: number; s: number }[], x: number, y: number): number {
  let best = 0, bd = Infinity;
  const total = samples.at(-1)!.s;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / l2)) : 0;
    const px = a.x + dx * t, py = a.y + dy * t, d = (px - x) ** 2 + (py - y) ** 2;
    if (d < bd) { bd = d; best = (a.s + Math.sqrt(l2) * t) / total; }
  }
  return Math.round(best * 10000) / 10000;
}

export interface RideGeometry { from: number; to: number; via: number[]; rest: Pt; label: string; then?: string }

/** Resolves a ride's stops to fractions of its line and finds where the record rests. */
export function rideGeometry(guide: Guide, ride: Ride): RideGeometry | undefined {
  const line = guide.scene.els.find((e) => e.id === ride.line);
  let samples: { x: number; y: number; s: number }[];
  if (line?.kind === "line") samples = sampleRoute(line.pts, 16, line.loop);
  else if (line?.kind === "series" && line.as === "line") {
    const p = plotOf(guide.scene.els, line);
    if (!p || (line.pts?.length ?? 0) < 2) return undefined;
    let acc = 0;
    samples = seriesPts(p, line).map(([x, y], i, all) => { if (i) acc += Math.hypot(x - all[i - 1][0], y - all[i - 1][1]); return { x, y, s: acc }; });
  } else return undefined;
  const frac = (p: string | number): number | undefined => {
    if (typeof p === "number") return p;
    const stop = guide.scene.els.find((e) => e.id === p);
    if (!stop || stop.kind !== "stop") return undefined;
    return fractionOf(samples, stop.x, stop.y);
  };
  const from = frac(ride.from), to = frac(ride.to);
  const via = (ride.via ?? []).map(frac);
  if (from === undefined || to === undefined || via.some((v) => v === undefined)) return undefined;
  return { from, to, via: via as number[], rest: pointAt(samples, to), label: ride.label, then: ride.then };
}

/* ---------- text ---------- */

const halo = `paint-order="stroke" stroke="var(--card)" stroke-width="5" stroke-linejoin="round"`;
function text(x: number, y: number, s: string, o: { size?: number; w?: number; fill?: string; anchor?: string; mono?: boolean; halo?: boolean; cls?: string; strike?: boolean } = {}): string {
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${o.size ?? 13}" font-weight="${o.w ?? 500}"${o.mono ? ' class="m"' : o.cls ? ` class="${o.cls}"` : ""} fill="${o.fill ?? "var(--ink)"}"${o.anchor && o.anchor !== "start" ? ` text-anchor="${o.anchor}"` : ""}${o.halo ? " " + halo : ""}${o.strike ? ' text-decoration="line-through"' : ""}>${esc(s)}</text>`;
}

/** Title and sub line placed on one side of a point. */
function sideLabel(x: number, y: number, at: Side, title?: string, sub?: string, gap = 22, muted = false, mono = false): string {
  if (!title && !sub) return "";
  const tf = muted ? "var(--faint)" : "var(--ink)";
  const ts = mono ? 13.5 : 15;
  if (at === "s") return (title ? text(x, y + gap + 8, title, { size: ts, w: 800, anchor: "middle", fill: tf, halo: true, mono }) : "") + (sub ? text(x, y + gap + (title ? 26 : 8), sub, { size: 12.5, fill: "var(--muted)", anchor: "middle", halo: true }) : "");
  if (at === "n") return (title ? text(x, y - gap - (sub ? 18 : 0), title, { size: ts, w: 800, anchor: "middle", fill: tf, halo: true, mono }) : "") + (sub ? text(x, y - gap, sub, { size: 12.5, fill: "var(--muted)", anchor: "middle", halo: true }) : "");
  const anchor = at === "e" ? "start" : "end", dx = at === "e" ? gap : -gap;
  return (title ? text(x + dx, y + (sub ? -3 : 5), title, { size: ts, w: 800, anchor, fill: tf, halo: true, mono }) : "") + (sub ? text(x + dx, y + (title ? 14 : 5), sub, { size: 12.5, fill: "var(--muted)", anchor, halo: true }) : "");
}

/** Title above a card, with the sub line right-aligned on the same baseline. */
function cardHead(x: number, y: number, w: number, title?: string, sub?: string, mono?: boolean, tone?: Tone): string {
  return (title ? text(x, y, title, { size: mono ? 13.5 : 15, w: 800, mono, fill: tone && tone !== "ink" ? TONE[tone] : "var(--ink)", halo: true }) : "")
    + (sub ? text(x + w, y, sub, { size: 12.5, fill: "var(--muted)", anchor: "end", halo: true }) : "");
}
/** Baseline for a card's title: above the card, or under it. */
const headY = (y: number, h: number, below?: boolean) => (below ? y + h + 22 : y - 10);

/* ---------- elements ---------- */

function zone(el: ZoneEl): string {
  const tone = el.tone ?? "track";
  const tw = el.label ? textWidth(el.label, 13, { bold: true }) + 30 : 0;
  return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="26" fill="${WASH[tone]}"/>`
    + (el.label ? `<path d="M${el.x + 26} ${el.y}H${el.x + 26 + tw - 10}Q${el.x + 26 + tw} ${el.y} ${el.x + 26 + tw} ${el.y + 10}V${el.y + 18}Q${el.x + 26 + tw} ${el.y + 28} ${el.x + 26 + tw - 10} ${el.y + 28}H${el.x + 26}Z" fill="${TONE[tone]}"/>`
      + text(el.x + 40, el.y + 19, el.label, { size: 13, w: 800, fill: "var(--card)" }) : "");
}

function line(el: LineEl, uid: string, iso = false): string {
  const d = routePath(el.pts, 16, el.loop);
  const state = el.state ?? "open";
  const tone = el.tone ?? (state === "closed" ? "muted" : "track");
  const w = el.w ?? (state === "closed" ? 5 : 9);
  const head = el.head ? ` marker-end="url(#${uid}-h-${tone})"` : "";
  if (state === "closed") return `<path d="${d}" class="ln closed" fill="none" stroke="var(--faint)" stroke-width="${w}" stroke-dasharray="1 10" stroke-linecap="round" stroke-linejoin="round"${head}/>`;
  const under = iso && w >= 6 ? `<path d="${d}" class="ln" pathLength="1" fill="none" stroke="color-mix(in srgb, ${TONE[tone]} 62%, #000)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 4)"${state === "planned" ? ' opacity=".3"' : ""}/>` : "";
  return under + `<path d="${d}" id="${uid}-${el.id}" class="ln" pathLength="1" fill="none" stroke="${TONE[tone]}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${state === "planned" ? ' opacity=".3"' : ""}${head}/>`;
}

/** Where a stop's name plate sits on the floor. Rails run diagonally, so the diagonal corners are the clear ones. */
function stopPlate(el: StopEl): [number, number, PlateOpts] {
  const o: PlateOpts = { sub: el.sub, mono: el.mono }, [, h] = plateSize(el.label ?? "", o), at = el.at ?? "s";
  if (at === "n") return [el.x, el.y - h - 20, o];
  if (at === "sw") return [el.x + 8, el.y + 14, { ...o, anchor: "end" }];
  if (at === "se") return [el.x - 8, el.y + 14, { ...o, anchor: "start" }];
  if (at === "nw") return [el.x + 8, el.y - h - 18, { ...o, anchor: "end" }];
  if (at === "ne") return [el.x - 8, el.y - h - 18, { ...o, anchor: "start" }];
  if (at === "e") return [el.x + 24, el.y - h / 2, { ...o, anchor: "start" }];
  if (at === "w") return [el.x - 24, el.y - h / 2, { ...o, anchor: "end" }];
  return [el.x, el.y + 16, o];
}
function stop(el: StopEl, iso = false): string {
  const r = el.big ? 13 : 10;
  let s: string;
  if (iso && el.state !== "end" && el.state !== "closed") {
    const rx = r * 1.35, ry = rx / 2;
    s = `<ellipse cx="${el.x}" cy="${el.y + 4}" rx="${r1(rx)}" ry="${r1(ry)}" fill="var(--ink)"/><ellipse cx="${el.x}" cy="${el.y}" rx="${r1(rx)}" ry="${r1(ry)}" fill="var(--card)" stroke="var(--ink)" stroke-width="${el.big ? 4 : 3.5}"/>`;
    if (!el.label) return s;
    const [px, py, po] = stopPlate(el);
    return s + plate(px, py, el.label, po);
  }
  if (el.state === "end") {
    const a = el.angle ?? 90;
    s = `<rect x="${el.x - 3.5}" y="${el.y - 17}" width="7" height="34" rx="3.5" fill="var(--ink)" transform="rotate(${a - 90} ${el.x} ${el.y})"/>`;
  } else if (el.state === "closed") {
    s = `<rect x="${el.x - 13}" y="${el.y - 13}" width="26" height="26" rx="6" fill="var(--card)" stroke="var(--faint)" stroke-width="3"/><path d="M${el.x - 5.5} ${el.y - 5.5}l11 11m0 -11l-11 11" stroke="var(--faint)" stroke-width="3" stroke-linecap="round"/>`;
  } else s = `<circle cx="${el.x}" cy="${el.y}" r="${r}" fill="var(--card)" stroke="var(--ink)" stroke-width="${el.big ? 4 : 3.5}"/>`;
  return s + sideLabel(el.x, el.y, el.at ?? "s", el.label, el.sub, r + 12, el.state === "closed", el.mono);
}

function db(el: DbEl): string {
  const { x, y, w, h } = el, ry = Math.min(12, h * 0.14), cx = x + w / 2;
  const stroke = el.tone === "alert" ? "var(--alert)" : el.tone === "track" ? "var(--tc)" : "var(--ink)";
  const at = el.at ?? "s";
  const lab = at === "s" ? sideLabel(cx, y + h, "s", el.title, el.sub, 4) : at === "n" ? sideLabel(cx, y, "n", el.title, el.sub, 10) : at === "e" ? sideLabel(x + w, y + h / 2, "e", el.title, el.sub, 14) : sideLabel(x, y + h / 2, "w", el.title, el.sub, 14);
  return `<path d="M${x} ${y + ry}V${y + h - ry}A${w / 2} ${ry} 0 0 0 ${x + w} ${y + h - ry}V${y + ry}" fill="var(--card)" stroke="${stroke}" stroke-width="2.5"/>`
    + `<ellipse cx="${cx}" cy="${y + ry}" rx="${w / 2}" ry="${ry}" fill="var(--card)" stroke="${stroke}" stroke-width="2.5"/>`
    + `<path d="M${x} ${y + ry + (h - 2 * ry) / 3}A${w / 2} ${ry} 0 0 0 ${x + w} ${y + ry + (h - 2 * ry) / 3}M${x} ${y + ry + (2 * (h - 2 * ry)) / 3}A${w / 2} ${ry} 0 0 0 ${x + w} ${y + ry + (2 * (h - 2 * ry)) / 3}" fill="none" stroke="${stroke}" stroke-width="1.5"/>`
    + lab;
}

function box(el: BoxEl): string {
  const { x, y, w, h } = el;
  const st = el.state ?? "open";
  const stroke = st === "closed" ? "var(--faint)" : st === "hot" ? "var(--tc)" : st === "alert" ? "var(--alert)" : "var(--ink)";
  const fill = st === "hot" ? "var(--tw)" : st === "alert" ? "var(--aw)" : "var(--card)";
  const g = el.glyph;
  const tx = g ? x + 52 : x + 16;
  const ink = st === "closed" ? "var(--faint)" : "var(--ink)";
  const cy = y + h / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2.5"${st === "closed" ? ' stroke-dasharray="6 6"' : ""}/>`
    + (g ? `<circle cx="${x + 28}" cy="${cy}" r="16" fill="${st === "closed" ? "var(--card)" : st === "alert" ? "var(--alert)" : "var(--tc)"}"${st === "closed" ? ' stroke="var(--faint)" stroke-width="2"' : ""}/>` + glyph(st === "closed" ? "x" : g, x + 19, cy - 9, 18, st === "closed" ? "var(--faint)" : "var(--card)", 2.2) : "")
    + text(tx, el.sub ? cy - 3 : cy + 5, el.title, { size: el.mono ? 13.5 : 15, w: 800, fill: ink, mono: el.mono, strike: st === "closed" })
    + (el.sub ? text(tx, cy + 15, st === "closed" ? "closed" : el.sub, { size: 12.5, w: st === "closed" ? 800 : 500, fill: st === "closed" ? "var(--faint)" : "var(--muted)" }) : "");
}

const rowOf = (r: Row) => (Array.isArray(r) ? { cells: r } : r);
export function tableHeight(el: TableEl) { return 28 + el.rows.length * (el.rowH ?? 28) + 6 + (el.foot ? 18 : 0); }
function colX(el: TableEl): number[] {
  if (el.at) return el.at.map((a) => el.x + a);
  const cw = (el.w - 24) / el.cols.length;
  return el.cols.map((_, i) => el.x + 12 + i * cw);
}
function table(el: TableEl, uid = "", iso = false): string {
  const rh = el.rowH ?? 28, h = tableHeight(el), xs = colX(el);
  const stroke = el.tone === "alert" ? "var(--alert)" : el.tone === "track" ? "var(--tc)" : "var(--ink)";
  let s = post(el.x, el.y, el.w, h, el.stand, uid) + (iso ? edge(el.x, el.y, el.w, h) : "") + cardHead(el.x, headY(el.y, h, el.below), el.w, el.title, el.sub, el.mono, el.tone)
    + `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${h}" rx="12" fill="var(--card)" stroke="${stroke}" stroke-width="2.5"/>`
    + el.cols.map((c, i) => text(xs[i], el.y + 18, c, { size: 11, w: 600, mono: true, fill: "var(--muted)" })).join("")
    + `<path d="M${el.x} ${el.y + 27}H${el.x + el.w}" stroke="${stroke}" stroke-width="2"/>`;
  el.rows.forEach((raw, j) => {
    const r = rowOf(raw), top = el.y + 28 + j * rh;
    const tip = r.cells.map((v, i) => `${el.cols[i]} ${v}`).join(" · ");
    s += `<g data-tip="${esc(tip)}">`;
    if (r.hot || r.hue) s += `<rect x="${el.x + 3}" y="${top + 2}" width="${el.w - 6}" height="${rh - 4}" rx="5" fill="${r.hot ? (el.tone === "alert" ? "var(--alert)" : "var(--tc)") : M(r.hue!, "t")}"/>`;
    else {
      s += `<rect x="${el.x + 3}" y="${top}" width="${el.w - 6}" height="${rh}" fill="transparent"/>`;
      if (j < el.rows.length - 1) s += `<path d="M${el.x + 10} ${top + rh}H${el.x + el.w - 10}" stroke="var(--rule)" stroke-width="1.5"/>`;
    }
    s += r.cells.map((v, i) => {
      const left = i === 0 ? el.x + 3 : (xs[i - 1] + xs[i]) / 2;
      const right = i === r.cells.length - 1 ? el.x + el.w - 3 : (xs[i] + xs[i + 1]) / 2;
      const colHue = !r.hot && !r.hue ? el.columnHues?.[i] : undefined;
      const reverse = r.hot || r.hue === "ink" || colHue === "ink" || colHue === "track";
      const cellFill = colHue ? `<rect x="${r1(left)}" y="${top + 1}" width="${r1(right - left)}" height="${rh - 2}" fill="${M(colHue, "t")}"/>` : "";
      return cellFill + text(xs[i], top + rh / 2 + 4.5, v, { size: 12, w: r.hot ? 700 : 500, mono: true, fill: reverse ? "var(--card)" : r.strike ? "var(--muted)" : r.mute ? "var(--faint)" : "var(--ink)", strike: r.strike });
    }).join("");
    s += `</g>`;
  });
  if (el.foot) s += text(xs[0], el.y + h - 9, el.foot, { size: 11, mono: true, fill: "var(--faint)" });
  return s;
}

export function codeHeight(el: CodeEl) { return 20 + el.lines.length * 20 + 8; }
function ticket(x: number, y: number, w: number, h: number, r = 8): string {
  return `M${x + 12} ${y}H${x + w - 12}Q${x + w} ${y} ${x + w} ${y + 12}V${y + h / 2 - r}A${r} ${r} 0 0 0 ${x + w} ${y + h / 2 + r}V${y + h - 12}Q${x + w} ${y + h} ${x + w - 12} ${y + h}H${x + 12}Q${x} ${y + h} ${x} ${y + h - 12}V${y + h / 2 + r}A${r} ${r} 0 0 0 ${x} ${y + h / 2 - r}V${y + 12}Q${x} ${y} ${x + 12} ${y}Z`;
}
function code(el: CodeEl, uid = "", iso = false): string {
  const h = codeHeight(el);
  const kw = el.keywords ?? ["select", "from", "join", "using", "create", "table", "as", "where", "group", "by"];
  const alt = kw.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(\\b(?:${alt})\\b)`), isKw = new RegExp(`^(?:${alt})$`);
  let s = post(el.x, el.y, el.w, h, el.stand, uid) + (iso ? `<path d="${ticket(el.x, el.y + 5, el.w, h)}" fill="var(--ink)"/>` : "")
    + cardHead(el.x, headY(el.y, h, el.below), el.w, el.title, el.sub, el.mono) + `<path d="${ticket(el.x, el.y, el.w, h)}" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
  el.lines.forEach((ln, i) => {
    const y = el.y + 26 + i * 20;
    if (el.hot?.includes(i)) s += `<rect x="${el.x + 6}" y="${y - 14}" width="${el.w - 12}" height="20" rx="4" fill="var(--tw)"/>`;
    const parts = ln.split(re).filter((p) => p !== "");
    s += `<text x="${el.x + 16}" y="${y}" font-size="12" class="m" xml:space="preserve">${parts.map((p) => (isKw.test(p) ? `<tspan fill="var(--tc)" font-weight="700">${esc(p)}</tspan>` : `<tspan fill="var(--ink)">${esc(p)}</tspan>`)).join("")}</text>`;
  });
  return s;
}

function doc(el: DocEl, uid = "", iso = false): string {
  const { x, y, w, h } = el, f = 16;
  const stroke = el.tone === "alert" ? "var(--alert)" : el.tone === "track" ? "var(--tc)" : "var(--ink)";
  const fill = el.tone === "alert" ? "var(--aw)" : "var(--card)";
  const sheet = (dy: number) => `M${x} ${y + 10 + dy}Q${x} ${y + dy} ${x + 10} ${y + dy}H${x + w - f}L${x + w} ${y + f + dy}V${y + h - 10 + dy}Q${x + w} ${y + h + dy} ${x + w - 10} ${y + h + dy}H${x + 10}Q${x} ${y + h + dy} ${x} ${y + h - 10 + dy}Z`;
  return post(x, y, w, h, el.stand, uid) + (iso ? `<path d="${sheet(5)}" fill="${stroke}"/>` : "") + `<path d="${sheet(0)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<path d="M${x + w - f} ${y}V${y + f}H${x + w}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`
    + text(x + 14, y + 26, el.title, { size: 14.5, w: 800, fill: el.tone === "alert" ? "var(--alert)" : "var(--ink)" })
    + (el.lines ?? []).map((l, i) => text(x + 14, y + 47 + i * 18, l, { size: el.mono ? 11.5 : 12.5, mono: el.mono, fill: "var(--muted)" })).join("");
}

function windowEl(el: WindowEl): string {
  const { x, y, w, h } = el, inner = h - 12;
  let s = (el.title ? text(x, y - 12, el.title, { size: 15, w: 800 }) : "")
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
  let acc = 0;
  for (const seg of el.segs) {
    const sh = (seg.value / el.cap) * inner, top = y + h - 6 - acc - sh;
    const fill = seg.hot ? "var(--tc)" : seg.tone === "ink" ? "var(--ink)" : seg.tone === "alert" ? "var(--alert)" : "var(--seg)";
    s += `<g data-tip="${esc(seg.label)}"><rect x="${x + 6}" y="${r1(top + 1.5)}" width="${w - 12}" height="${r1(Math.max(sh - 3, 2))}" rx="${Math.min(6, sh / 3)}" fill="${fill}"/>`;
    const m = /^(.*?)\s+(\S*\d\S*)$/.exec(seg.label);
    const ly = top + sh / 2 + 4.5;
    s += m
      ? `<text x="${x + w + 14}" y="${r1(ly)}" font-size="13" font-weight="${seg.hot ? 800 : 600}" fill="${seg.hot ? "var(--tc)" : "var(--ink)"}">${esc(m[1])} <tspan class="m" font-size="12" font-weight="600">${esc(m[2])}</tspan></text>`
      : text(x + w + 14, ly, seg.label, { size: 13, w: 600 });
    s += `</g>`;
    acc += sh;
  }
  if (el.limit) s += `<path d="M${x - 8} ${y + 6}H${x + w + 8}" stroke="var(--alert)" stroke-width="2" stroke-dasharray="5 4"/>` + text(x + w + 14, y + 10, el.limit, { size: 12, w: 800, fill: "var(--alert)" });
  return s;
}

function model(el: ModelEl): string {
  const { x, y, w, h } = el;
  const st = el.state ?? "open";
  const stroke = st === "hot" ? "var(--tc)" : st === "alert" ? "var(--alert)" : "var(--ink)";
  const fill = st === "hot" ? "var(--tw)" : st === "alert" ? "var(--aw)" : "var(--card)";
  const gs = Math.min(h - 20, 48), gx = x + 12, gy = y + (h - gs) / 2;
  const cols = [[0.5], [0.15, 0.5, 0.85], [0.3, 0.7]].map((c, i) => c.map((v) => [gx + (i * gs) / 2, gy + v * gs] as Pt));
  let net = "";
  for (let i = 0; i < cols.length - 1; i++) for (const a of cols[i]) for (const b of cols[i + 1]) net += `<path d="M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}" stroke="${stroke}" stroke-width="1.4" opacity=".55"/>`;
  for (const c of cols) for (const p of c) net += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="4.5" fill="${st === "open" ? "var(--card)" : stroke}" stroke="${stroke}" stroke-width="2"/>`;
  const tx = gx + gs + 16, cy = y + h / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>` + net
    + (st === "frozen" ? glyph("lock", x + w - 30, y + 8, 18, "var(--muted)", 2) : "")
    + text(tx, el.sub ? cy - 3 : cy + 5, el.title, { size: 15, w: 800, fill: st === "alert" ? "var(--alert)" : "var(--ink)" })
    + (el.sub ? text(tx, cy + 15, el.sub, { size: 12.5, fill: "var(--muted)" }) : "");
}

function person(el: PersonEl): string {
  const { x, y } = el;
  let s = `<circle cx="${x}" cy="${y - 22}" r="11" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/><path d="M${x - 18} ${y + 12}V${y + 4}Q${x - 18} ${y - 7} ${x - 6} ${y - 7}H${x + 6}Q${x + 18} ${y - 7} ${x + 18} ${y + 4}V${y + 12}Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (el.title) s += text(x, y + 32, el.title, { size: 14, w: 800, anchor: "middle", halo: true });
  if (el.say) {
    const tw = textWidth(el.say, 13.5, { bold: true }) + 28, east = (el.side ?? "e") === "e";
    const bx = east ? x + 30 : x - 30 - tw, by = y - 52;
    const b1 = east ? bx + 16 : bx + tw - 32, b2 = b1 + 16, tipX = east ? x + 16 : x - 16;
    s += `<path d="M${r1(b1)} ${by + 30}L${tipX} ${y - 26}L${r1(b2)} ${by + 30}Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>`
      + `<rect x="${r1(bx)}" y="${by}" width="${r1(tw)}" height="36" rx="18" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`
      + text(bx + tw / 2, by + 23, el.say, { size: 13.5, w: 700, anchor: "middle" });
  }
  return s;
}

const itemOf = (it: Item) => (typeof it === "string" ? { t: it } : it);
export function listHeight(el: ListEl) { return 8 + el.items.length * (el.rowH ?? 28); }
function list(el: ListEl, uid = "", iso = false): string {
  const rh = el.rowH ?? 28, h = listHeight(el);
  let s = post(el.x, el.y, el.w, h, el.stand, uid) + (iso ? edge(el.x, el.y, el.w, h) : "") + cardHead(el.x, headY(el.y, h, el.below), el.w, el.title, el.sub)
    + `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${h}" rx="12" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
  el.items.forEach((raw, i) => {
    const it = itemOf(raw), top = el.y + 4 + i * rh;
    const hotFill = it.tone === "alert" ? "var(--alert)" : "var(--tc)";
    s += `<g data-tip="${esc(it.t)}">`;
    if (it.hot) s += `<rect x="${el.x + 4}" y="${top + 2}" width="${el.w - 8}" height="${rh - 4}" rx="6" fill="${hotFill}"/>`;
    else if (i > 0) s += `<path d="M${el.x + 10} ${top}H${el.x + el.w - 10}" stroke="var(--rule)" stroke-width="1.5"/>`;
    const tx = el.numbered ? el.x + 38 : el.x + 14;
    if (el.numbered) s += text(el.x + 14, top + rh / 2 + 4.5, String(i + 1), { size: 12, w: 700, mono: true, fill: it.hot ? "var(--card)" : "var(--faint)" });
    s += text(tx, top + rh / 2 + 4.5, it.t, { size: el.mono ? 12 : 13, mono: el.mono, w: it.hot ? 800 : 500, fill: it.hot ? "var(--card)" : it.strike ? "var(--muted)" : it.mute ? "var(--faint)" : it.tone === "alert" ? "var(--alert)" : "var(--ink)", strike: it.strike });
    s += `</g>`;
  });
  if (el.cut !== undefined) {
    const cy = el.y + 4 + el.cut * rh;
    s += `<path d="M${el.x - 10} ${cy}H${el.x + el.w + 10}" stroke="var(--alert)" stroke-width="2.5" stroke-dasharray="6 5"/>`;
    if (el.cutLabel) s += text(el.x + el.w + 16, cy + 4.5, el.cutLabel, { size: 12.5, w: 800, fill: "var(--alert)", halo: true });
  }
  return s;
}

function tree(el: TreeEl, uid = "", iso = false): string {
  const { x, y, w, h } = el, rx = x + w / 2, ry = y + 50, ly = y + h - 34;
  const lx = [x + w * 0.27, x + w * 0.73];
  return post(x, y, w, h, el.stand, uid) + (iso ? `<rect x="${x}" y="${y + 5}" width="${w}" height="${h}" rx="14" fill="var(--tc)"/>` : "")
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="var(--tw)" stroke="var(--tc)" stroke-width="2.5"/>`
    + text(x + 14, y + 24, el.title, { size: 15, w: 800 })
    + (el.sub ? text(x + w - 14, y + 24, el.sub, { size: 12, fill: "var(--muted)", anchor: "end" }) : "")
    + lx.map((lxx) => `<path d="M${rx} ${ry + 7}L${r1(lxx)} ${ly - 12}" stroke="var(--ink)" stroke-width="2.5"/>`).join("")
    + `<circle cx="${rx}" cy="${ry}" r="8" fill="var(--ink)"/>`
    + (el.split ? text(rx + 14, ry + 4, el.split, { size: 11.5, mono: true, fill: "var(--muted)" }) : "")
    + lx.map((lxx, i) => `<rect x="${r1(lxx - 34)}" y="${ly - 13}" width="68" height="26" rx="6" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>` + text(lxx, ly + 4.5, el.leaves[i], { size: 12, w: 700, mono: true, anchor: "middle" })).join("");
}

function matrix(el: MatrixEl): string {
  const [cw, ch] = el.cell;
  return `<g fill="var(--tc)">` + el.values.map((row, r) => row.map((o, c) =>
    `<rect x="${el.x + c * (cw + el.gap)}" y="${el.y + r * (ch + el.gap)}" width="${cw}" height="${ch}" rx="2" opacity="${o}"/>`).join("")).join("") + `</g>`;
}

function marks(el: MarksEl): string {
  return el.values.map((v, i) => {
    const cy = el.y + el.rowH * i + el.rowH / 2;
    if (typeof v === "string") return text(el.x, cy + 4.5, v, { size: 12.5, w: el.strong ? 800 : 500, mono: true, anchor: "middle", fill: TONE[el.tone ?? "track"] });
    return `<circle cx="${el.x}" cy="${cy}" r="5.5" stroke="var(--ink)" stroke-width="2" fill="${v ? "var(--tc)" : "var(--card)"}"/>`;
  }).join("");
}

function label(el: LabelEl): string {
  const fill = TONE[el.tone ?? "ink"];
  const lead = el.to ? `<path d="M${el.x} ${el.y + 4}L${el.to[0]} ${el.to[1]}" stroke="${fill}" stroke-width="1.5"/><circle cx="${el.to[0]}" cy="${el.to[1]}" r="3" fill="${fill}"/>` : "";
  return lead + text(el.x, el.y, el.text, { size: el.size ?? 13, w: el.strong ? 800 : 600, anchor: el.anchor, fill, mono: el.mono, halo: true });
}

function arrow(el: ArrowEl, uid: string): string {
  const tone = el.tone ?? "muted";
  return `<path d="${el.d}" fill="none" stroke="${TONE[tone]}" stroke-width="2" stroke-linecap="round"${el.dashed ? ' stroke-dasharray="3 6"' : ""}${el.head === false ? "" : ` marker-end="url(#${uid}-h-${tone})"`}/>`
    + (el.label && el.labelAt ? text(el.labelAt[0], el.labelAt[1], el.label, { size: 12.5, w: 700, anchor: el.labelAnchor ?? "middle", fill: TONE[tone], halo: true }) : "");
}

function sheets(el: SheetsEl): string {
  let s = "";
  for (let i = 0; i < el.n; i++) {
    const x = el.x + i * (el.w + el.gap);
    s += `<rect x="${x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="5" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>`
      + `<path d="M${x} ${el.y + 8}H${x + el.w}M${x} ${el.y + el.h / 2 + 3}H${x + el.w}M${x + el.w / 3} ${el.y}V${el.y + el.h}M${x + (2 * el.w) / 3} ${el.y}V${el.y + el.h}" stroke="var(--ink)" stroke-width="1" opacity=".45"/>`;
  }
  return s;
}


/* ---------- the floor: isometric volumes ---------- */

/** Grid point to screen point. One cell is 2a wide and a tall; z is height in pixels. */
export const project = (o: Iso, gx: number, gy: number, z = 0): Pt => [o.ox + (gx - gy) * o.a, o.oy + ((gx + gy) * o.a) / 2 - z];
const pts = (list: Pt[]) => list.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ");
const M = (hue: Hue, face: "t" | "l" | "r") => `var(--m-${hue}-${face})`;
const face = (list: Pt[], fill: string, extra = "") => `<polygon points="${pts(list)}" fill="${fill}" stroke="var(--ink)" stroke-width="2.25" stroke-linejoin="round"${extra}/>`;

interface PlateOpts { sub?: string; glyph?: string; tone?: Tone; anchor?: "start" | "middle" | "end"; mono?: boolean; strike?: boolean }
/** Size of a name plate, for layout checks. */
export function plateSize(title: string, o: PlateOpts = {}): [number, number] {
  const tw = Math.max(textWidth(title, o.mono ? 12.5 : 13.5, { bold: true, mono: o.mono }), o.sub ? textWidth(o.sub, 11.5) : 0);
  return [Math.ceil(tw + (o.glyph ? 34 : 0) + 24), o.sub ? 44 : 30];
}
/** A name plate: a raised label with an optional glyph. x, y is the centre of its top edge unless anchored. */
function plate(x: number, y: number, title: string, o: PlateOpts = {}): string {
  const [w, h] = plateSize(title, o);
  const left = o.anchor === "start" ? x : o.anchor === "end" ? x - w : x - w / 2;
  const tone = o.tone ?? "ink";
  const edge = tone === "muted" ? "var(--faint)" : TONE[tone], fill = tone === "alert" ? "var(--aw)" : tone === "track" ? "var(--tw)" : "var(--card)";
  const ink = tone === "ink" ? "var(--ink)" : tone === "muted" ? "var(--faint)" : TONE[tone];
  const tx = left + 12 + (o.glyph ? 34 : 0);
  return `<rect x="${r1(left)}" y="${r1(y + 3.5)}" width="${w}" height="${h}" rx="${h / 2 > 15 ? 13 : h / 2}" fill="${edge}"/>`
    + `<rect x="${r1(left)}" y="${r1(y)}" width="${w}" height="${h}" rx="${h / 2 > 15 ? 13 : h / 2}" fill="${fill}" stroke="${edge}" stroke-width="2"${tone === "muted" ? ' stroke-dasharray="5 4"' : ""}/>`
    + (o.glyph ? `<circle cx="${r1(left + 21)}" cy="${r1(y + h / 2)}" r="11" fill="${tone === "ink" ? "var(--tc)" : ink}"/>` + glyph(o.glyph, left + 14, y + h / 2 - 7, 14, "var(--card)", 2.2) : "")
    + text(tx, y + (o.sub ? 19 : 19.5), title, { size: o.mono ? 12.5 : 13.5, w: 800, fill: ink, mono: o.mono, strike: o.strike })
    + (o.sub ? text(tx, y + 35, o.sub, { size: 11.5, w: 500, fill: tone === "ink" ? "var(--muted)" : ink }) : "");
}
/** Where a name plate goes relative to a volume's screen box. */
function plateAt(at: "s" | "n" | "e" | "w" | "sw" | "se", box: { x0: number; y0: number; x1: number; y1: number }, title: string, o: PlateOpts): [number, number, PlateOpts] {
  const [, h] = plateSize(title, o), cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
  if (at === "sw") return [cx + 12, box.y1 + 8, { ...o, anchor: "end" }];
  if (at === "se") return [cx - 12, box.y1 + 8, { ...o, anchor: "start" }];
  if (at === "n") return [cx, box.y0 - h - 12, o];
  if (at === "e") return [box.x1 + 12, cy - h / 2, { ...o, anchor: "start" }];
  if (at === "w") return [box.x0 - 12, cy - h / 2, { ...o, anchor: "end" }];
  return [cx, box.y1 + 10, o];
}
const shadow = (list: Pt[], uid: string) => `<polygon points="${pts(list.map(([x, y]) => [x + 5, y + 9] as Pt))}" fill="var(--shade)" filter="url(#${uid}-soft)"/>`;

function prismCorners(el: { gx: number; gy: number; w: number; d: number; h: number; z?: number }, o: Iso) {
  const z = el.z ?? 0, { gx, gy, w, d, h } = el;
  return {
    A: project(o, gx, gy, z + h), B: project(o, gx + w, gy, z + h), C: project(o, gx + w, gy + d, z + h), D: project(o, gx, gy + d, z + h),
    A0: project(o, gx, gy, z), B0: project(o, gx + w, gy, z), C0: project(o, gx + w, gy + d, z), D0: project(o, gx, gy + d, z),
  };
}
const prismBox = (c: ReturnType<typeof prismCorners>) => ({ x0: c.D[0], y0: c.A[1], x1: c.B[0], y1: c.C0[1] });

function prism(el: PrismEl, o: Iso, uid: string): string {
  const c = prismCorners(el, o), hue = el.hue ?? "paper", closed = el.state === "closed", alert = el.state === "alert";
  const mid: Pt = [(c.A[0] + c.C[0]) / 2, (c.A[1] + c.C[1]) / 2];
  const gs = Math.min(28, el.w * o.a * 0.8, el.d * o.a * 0.8);
  let s: string;
  if (closed) {
    const dash = ' fill="none" stroke="var(--faint)" stroke-width="2" stroke-dasharray="5 5" stroke-linejoin="round"';
    s = `<polygon points="${pts([c.A, c.B, c.C, c.D])}"${dash}/><polygon points="${pts([c.D, c.C, c.C0, c.D0])}"${dash}/><polygon points="${pts([c.B, c.C, c.C0, c.B0])}"${dash}/>`
      + (el.title ? glyph("x", mid[0] - gs / 2, mid[1] - gs / 2, gs, "var(--faint)", 2.4) : "");
  } else {
    s = shadow([c.D0, c.C0, c.B0, c.A0], uid) + face([c.D, c.C, c.C0, c.D0], alert ? "var(--alert)" : M(hue, "l")) + face([c.B, c.C, c.C0, c.B0], alert ? "var(--alert)" : M(hue, "r")) + face([c.A, c.B, c.C, c.D], alert ? "var(--aw)" : M(hue, "t"))
      + `<polyline points="${pts([[c.D[0] + 5, c.D[1] + 1.5], [c.A[0], c.A[1] + 4], [c.B[0] - 5, c.B[1] + 1.5]])}" fill="none" stroke="var(--glint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      + (el.glyph ? glyph(el.glyph, mid[0] - gs / 2, mid[1] - gs / 2, gs, hue === "ink" ? "var(--card)" : "var(--ink)", 2.2) : "");
  }
  if (el.title) {
    const [x, y, po] = plateAt(el.at ?? "s", prismBox(c), el.title, { sub: closed ? el.sub ?? "closed" : el.sub, tone: alert ? "alert" : closed ? "muted" : "ink", strike: closed });
    s += plate(x, y, el.title, po);
  }
  return s;
}

function drumGeo(el: DrumEl, o: Iso) {
  const [cx, cy] = project(o, el.gx, el.gy, el.z ?? 0), rx = el.r * o.a * Math.SQRT2, ry = rx / 2;
  return { cx, cy, rx, ry, top: cy - el.h, box: { x0: cx - rx, y0: cy - el.h - ry, x1: cx + rx, y1: cy + ry } };
}
function drum(el: DrumEl, o: Iso, uid: string): string {
  const g = drumGeo(el, o), hue = el.hue ?? "sky", { cx, cy, rx, ry, top } = g, stroke = el.state === "alert" ? "var(--alert)" : "var(--ink)";
  const ring = (y: number) => `<path d="M${r1(cx - rx)} ${r1(y)}A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(y)}" fill="none" stroke="var(--ink)" stroke-width="1.5" opacity=".55"/>`;
  let s = `<ellipse cx="${r1(cx + 5)}" cy="${r1(cy + 8)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="var(--shade)" filter="url(#${uid}-soft)"/>`
    + `<path d="M${r1(cx - rx)} ${r1(top)}V${r1(cy)}A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(cy)}V${r1(top)}Z" fill="${el.state === "alert" ? "var(--aw)" : `url(#${uid}-cyl-${hue})`}" stroke="${stroke}" stroke-width="2.25" stroke-linejoin="round"/>`
    + ring(top + (cy - top) / 3) + ring(top + (2 * (cy - top)) / 3)
    + `<ellipse cx="${r1(cx)}" cy="${r1(top)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${el.state === "alert" ? "var(--alert)" : M(hue, "t")}" stroke="${stroke}" stroke-width="2.25"/>`
    + `<path d="M${r1(cx - rx + 7)} ${r1(top - 1)}A${r1(rx - 7)} ${r1(ry - 3.5)} 0 0 1 ${r1(cx)} ${r1(top - ry + 3.5)}" fill="none" stroke="var(--glint)" stroke-width="2" stroke-linecap="round"/>`
    + (el.glyph ? glyph(el.glyph, cx - 11, top - 11, 22, "var(--ink)", 2.2) : "");
  if (el.title) { const [x, y, po] = plateAt(el.at ?? "s", g.box, el.title, { sub: el.sub }); s += plate(x, y, el.title, po); }
  return s;
}

function slab(el: SlabEl, o: Iso, uid: string): string {
  const c = prismCorners(el, o), hue = el.hue ?? "track";
  return shadow([c.D0, c.C0, c.B0, c.A0], uid) + face([c.D, c.C, c.C0, c.D0], M(hue, "l")) + face([c.B, c.C, c.C0, c.B0], M(hue, "r"))
    + face([c.A, c.B, c.C, c.D], hue === "track" ? "var(--tw)" : M(hue, "t"))
    + (el.label ? plate(c.D0[0] + 4, c.D0[1] + 16, el.label, { glyph: el.glyph, tone: "track", anchor: "start" }) : "");
}

function tank(el: TankEl, o: Iso): string {
  const full = prismCorners(el, o), scale = el.h / el.cap;
  let s = face([full.D0, full.C0, full.B0, full.A0], "var(--m-paper-l)", ' opacity=".5"');
  let acc = 0, lastY = Infinity;
  for (const seg of el.segs) {
    const hh = seg.value * scale, hue: Hue = seg.hue ?? (seg.hot ? "track" : "paper");
    const c = prismCorners({ ...el, z: (el.z ?? 0) + acc, h: hh } as PrismEl, o);
    const m = /^(.*?)\s+(\S*\d\S*)$/.exec(seg.label);
    // labels keep a line of air between them, even when the layers are thin
    const ly = Math.min((c.B[1] + c.B0[1]) / 2 + 4.5, lastY - 15);
    lastY = ly;
    s += `<g data-tip="${esc(seg.label)}">` + face([c.D, c.C, c.C0, c.D0], M(hue, "l")) + face([c.B, c.C, c.C0, c.B0], M(hue, "r")) + face([c.A, c.B, c.C, c.D], M(hue, "t"))
      + `<path d="M${r1(c.B[0] + 3)} ${r1((c.B[1] + c.B0[1]) / 2)}L${r1(c.B[0] + 16)} ${r1(ly - 4.5)}" stroke="var(--ink)" stroke-width="1.5"/>`
      + (m ? `<text x="${r1(c.B[0] + 22)}" y="${r1(ly)}" font-size="13" font-weight="${seg.hot ? 800 : 600}" fill="${seg.hot ? "var(--tc)" : "var(--ink)"}" ${halo}>${esc(m[1])} <tspan class="m" font-size="12">${esc(m[2])}</tspan></text>` : text(c.B[0] + 22, ly, seg.label, { size: 13, w: 600, halo: true }))
      + `</g>`;
    acc += hh;
  }
  const glass = ' fill="var(--glass)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"';
  s += `<polygon points="${pts([full.D, full.C, full.C0, full.D0])}"${glass}/><polygon points="${pts([full.B, full.C, full.C0, full.B0])}"${glass}/><polygon points="${pts([full.A, full.B, full.C, full.D])}"${glass}/>`;
  if (el.limit) s += `<polygon points="${pts([full.A, full.B, full.C, full.D])}" fill="none" stroke="var(--alert)" stroke-width="2.5" stroke-dasharray="6 5" stroke-linejoin="round"/>` + plate(full.B[0] + 14, full.B[1] - 30, el.limit, { tone: "alert", anchor: "start" });
  if (el.title) s += plate((full.D[0] + full.B[0]) / 2, full.A[1] - 44, el.title, {});
  return s;
}

function pill(el: PillEl): string {
  const o: PlateOpts = { sub: el.sub, glyph: el.glyph, tone: el.tone, anchor: el.anchor ?? "middle", mono: el.mono };
  const [w, h] = plateSize(el.text, o);
  const cx = o.anchor === "start" ? el.x + w / 2 : o.anchor === "end" ? el.x - w / 2 : el.x;
  const lead = el.to ? `<path d="M${r1(cx)} ${r1(el.y + h / 2)}L${el.to[0]} ${el.to[1]}" stroke="${el.tone && el.tone !== "ink" ? TONE[el.tone] : "var(--ink)"}" stroke-width="2"/><circle cx="${el.to[0]}" cy="${el.to[1]}" r="4" fill="${el.tone && el.tone !== "ink" ? TONE[el.tone] : "var(--ink)"}"/>` : "";
  return lead + plate(el.x, el.y, el.text, o);
}

function pawn(el: PawnEl, o: Iso, uid: string): string {
  const [x, y] = project(o, el.gx, el.gy, el.z ?? 0), hue = el.hue ?? "sand";
  let s = `<ellipse cx="${r1(x + 4)}" cy="${r1(y + 5)}" rx="17" ry="8" fill="var(--shade)" filter="url(#${uid}-soft)"/>`
    + `<path d="M${r1(x - 15)} ${r1(y)}V${r1(y - 22)}Q${r1(x - 15)} ${r1(y - 36)} ${r1(x)} ${r1(y - 36)}Q${r1(x + 15)} ${r1(y - 36)} ${r1(x + 15)} ${r1(y - 22)}V${r1(y)}A15 7 0 0 1 ${r1(x - 15)} ${r1(y)}Z" fill="url(#${uid}-cyl-${hue})" stroke="var(--ink)" stroke-width="2.25" stroke-linejoin="round"/>`
    + `<circle cx="${r1(x)}" cy="${r1(y - 48)}" r="11.5" fill="${M(hue, "t")}" stroke="var(--ink)" stroke-width="2.25"/>`;
  if (el.title) s += plate(x, y + 14, el.title, {});
  if (el.say) {
    const east = (el.side ?? "e") === "e", [w] = plateSize(el.say, {});
    const px = east ? x + 26 : x - 26, py = y - 96;
    s += `<path d="M${r1(east ? px + 14 : px - 14)} ${py + 28}L${r1(east ? x + 12 : x - 12)} ${r1(y - 58)}L${r1(east ? px + 34 : px - 34)} ${py + 28}Z" fill="var(--card)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>` + plate(px, py, el.say, { anchor: east ? "start" : "end" });
    void w;
  }
  return s;
}

/** A post and a foot under a card that stands on the floor. */
function post(x: number, y: number, w: number, h: number, stand: Pt | undefined, uid: string): string {
  if (!stand) return "";
  return `<ellipse cx="${stand[0] + 3}" cy="${stand[1] + 4}" rx="18" ry="8" fill="var(--shade)" filter="url(#${uid}-soft)"/>`
    + `<path d="M${r1(x + w / 2)} ${r1(y + h - 2)}L${stand[0]} ${stand[1]}" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>`
    + `<ellipse cx="${stand[0]}" cy="${stand[1]}" rx="13" ry="6.5" fill="var(--ink)"/>`;
}
/** The dark edge that gives a card thickness on the floor. */
const edge = (x: number, y: number, w: number, h: number, rx = 12) => `<rect x="${x}" y="${y + 5}" width="${w}" height="${h}" rx="${rx}" fill="var(--ink)"/>`;

/* ---------- charts, cells, blocks, nodes ---------- */

const PAD = { l: 42, r: 14, t: 16, b: 30 };
/** Canvas point of a data point on a plot. Use it to place a label or a pill beside a point. */
export function plotPoint(p: PlotEl, vx: number, vy: number): Pt {
  const iw = p.w - PAD.l - PAD.r, ih = p.h - PAD.t - PAD.b;
  return [p.x + PAD.l + ((vx - p.xr[0]) / (p.xr[1] - p.xr[0])) * iw, p.y + p.h - PAD.b - ((vy - p.yr[0]) / (p.yr[1] - p.yr[0])) * ih];
}
const plotOf = (els: El[], s: SeriesEl) => els.find((e): e is PlotEl => e.kind === "plot" && e.id === s.plot);
const tick = (v: number) => String(Math.round(v * 1000) / 1000);

function plot(el: PlotEl, uid: string, iso: boolean): string {
  const [x0, y0] = plotPoint(el, el.xr[0], el.yr[0]), [x1, y1] = plotPoint(el, el.xr[1], el.yr[1]);
  const xt = el.xt ?? el.xr, yt = el.yt ?? el.yr;
  let s = post(el.x, el.y, el.w, el.h, el.stand, uid) + (iso ? edge(el.x, el.y, el.w, el.h) : "") + cardHead(el.x, headY(el.y, el.h, el.below), el.w, el.title, el.sub)
    + `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="12" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
  if (el.grid !== false) s += yt.map((v) => `<path d="M${r1(x0)} ${r1(plotPoint(el, 0, v)[1])}H${r1(x1)}" stroke="var(--rule)" stroke-width="1.5"/>`).join("");
  s += `<path d="M${r1(x0)} ${r1(y1)}V${r1(y0)}H${r1(x1)}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += xt.map((v, i) => { const x = plotPoint(el, v, 0)[0]; return `<path d="M${r1(x)} ${r1(y0)}v4" stroke="var(--ink)" stroke-width="2"/>` + text(x, y0 + 17, el.xtl?.[i] ?? tick(v), { size: 11, mono: true, fill: "var(--muted)", anchor: "middle" }); }).join("");
  s += yt.map((v, i) => text(x0 - 7, plotPoint(el, 0, v)[1] + 4, el.ytl?.[i] ?? tick(v), { size: 11, mono: true, fill: "var(--muted)", anchor: "end" })).join("");
  if (el.xLabel) s += text(x1, y0 - 7, el.xLabel, { size: 11.5, w: 700, fill: "var(--muted)", anchor: "end", halo: true });
  if (el.yLabel) s += text(x0 + 7, y1 + 9, el.yLabel, { size: 11.5, w: 700, fill: "var(--muted)", halo: true });
  return s;
}

/** Canvas points of a series. A smooth line is sampled, so the drawn path and the route a record rides are the same polyline. */
function seriesPts(p: PlotEl, s: SeriesEl): Pt[] {
  const raw = (s.pts ?? []).map(([a, b]) => plotPoint(p, a, b));
  if (!s.smooth || raw.length < 3) return raw;
  const out: Pt[] = [];
  for (let i = 0; i < raw.length - 1; i++) {
    const p0 = raw[Math.max(0, i - 1)], p1 = raw[i], p2 = raw[i + 1], p3 = raw[Math.min(raw.length - 1, i + 2)];
    for (let k = 0; k < 8; k++) {
      const t = k / 8, t2 = t * t, t3 = t2 * t;
      const at = (j: 0 | 1) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([at(0), at(1)]);
    }
  }
  out.push(raw.at(-1)!);
  return out;
}

function series(el: SeriesEl, p: PlotEl | undefined, uid: string): string {
  if (!p) return "";
  const col = TONE[el.tone ?? "track"], P = seriesPts(p, el);
  const [x0, y0] = plotPoint(p, p.xr[0], p.yr[0]), [x1, y1] = plotPoint(p, p.xr[1], p.yr[1]);
  const hot = new Set(el.hot ?? []);
  const path = P.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join("");
  let s = "", anchor: Pt | undefined = P.length ? P[Math.min(P.length - 1, el.labelAt ?? P.length - 1)] : undefined;
  if (el.as === "line") {
    s = `<path d="${path}" id="${uid}-${esc(el.id)}"${el.dashed ? ' stroke-dasharray="2 7"' : ' class="ln" pathLength="1"'} fill="none" stroke="${col}" stroke-width="${el.w ?? 3.5}" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (el.as === "area") {
    s = `<path d="${path}L${r1(P.at(-1)![0])} ${r1(y0)}L${r1(P[0][0])} ${r1(y0)}Z" fill="${col}" opacity=".16"/><path d="${path}" fill="none" stroke="${col}" stroke-width="${el.w ?? 2.5}" stroke-linejoin="round"/>`;
  } else if (el.as === "points") {
    const r = el.r ?? 5;
    s = P.map(([x, y], i) => {
      const hue = el.hues?.[i] ?? el.hue, lit = hot.has(i);
      return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${lit ? r + 2 : r}" fill="${hue ? M(hue, "l") : col}" stroke="var(--ink)" stroke-width="${lit ? 3 : 1.75}"/>`;
    }).join("");
  } else if (el.as === "bars") {
    const xs = P.map((q) => q[0]), gap = xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => x - xs[i])) : 40, bw = Math.max(6, gap * 0.68);
    s = P.map(([x, y], i) => `<rect x="${r1(x - bw / 2)}" y="${r1(Math.min(y, y0))}" width="${r1(bw)}" height="${r1(Math.abs(y0 - y))}" rx="3" fill="${el.hues?.[i] ? M(el.hues[i], "l") : el.hue ? M(el.hue, "l") : col}"${hot.size && !hot.has(i) ? ' opacity=".4"' : ""} stroke="var(--ink)" stroke-width="2"/>`).join("");
  } else if (el.as === "band") {
    const [a, b] = Array.isArray(el.at) ? el.at : [el.at ?? 0, el.at ?? 0];
    const [ax, ay] = plotPoint(p, a, a), [bx, by] = plotPoint(p, b, b);
    const r = el.axis === "y" ? [x0, Math.min(ay, by), x1 - x0, Math.abs(by - ay)] : [Math.min(ax, bx), y1, Math.abs(bx - ax), y0 - y1];
    s = `<rect x="${r1(r[0])}" y="${r1(r[1])}" width="${r1(r[2])}" height="${r1(r[3])}" fill="${col}" opacity=".14"/>`;
    anchor = [r[0] + 2, r[1] + 20];
  } else if (el.as === "rect") {
    const [xf, yf, xt, yt] = el.region ?? [0, 0, 0, 0];
    const [xa, ya] = plotPoint(p, xf, yf), [xb, yb] = plotPoint(p, xt, yt);
    const left = Math.max(x0, Math.min(xa, xb)), right = Math.min(x1, Math.max(xa, xb));
    const top = Math.max(y1, Math.min(ya, yb)), bottom = Math.min(y0, Math.max(ya, yb));
    s = `<rect x="${r1(left)}" y="${r1(top)}" width="${r1(Math.max(0, right - left))}" height="${r1(Math.max(0, bottom - top))}" fill="${col}" opacity=".18"/>`;
    anchor = [left + 2, top + 20];
  } else {
    const v = Array.isArray(el.at) ? el.at[0] : el.at ?? 0, [vx, vy] = plotPoint(p, v, v);
    s = el.axis === "y" ? `<path d="M${r1(x0)} ${r1(vy)}H${r1(x1)}" stroke="${col}" stroke-width="${el.w ?? 2.5}" stroke-dasharray="6 5"/>` : `<path d="M${r1(vx)} ${r1(y0)}V${r1(y1)}" stroke="${col}" stroke-width="${el.w ?? 2.5}" stroke-dasharray="6 5"/>`;
    anchor = el.axis === "y" ? [x1 - textWidth(el.label ?? "", 12, { bold: true }) - 10, vy] : [vx, y1 + 18];
  }
  if (el.label && anchor) s += text(anchor[0] + 6, anchor[1] - 8, el.label, { size: 12, w: 800, fill: col, halo: true });
  return s;
}

/** Width and height of a cells element, card included. */
export function cellsSize(el: CellsEl): [number, number] {
  const gap = el.gap ?? 4, rows = Math.ceil(el.items.length / el.cols), pad = el.card === false ? 0 : 10;
  return [el.cols * el.cell[0] + (el.cols - 1) * gap + pad * 2, rows * el.cell[1] + (rows - 1) * gap + pad * 2 + (el.ticks ? 17 : 0)];
}
function cells(el: CellsEl, uid: string, iso: boolean): string {
  const gap = el.gap ?? 4, [w, h] = cellsSize(el), pad = el.card === false ? 0 : 10, [cw, ch] = el.cell, mono = el.mono !== false;
  let s = post(el.x, el.y, w, h, el.stand, uid) + cardHead(el.x, headY(el.y, h, el.below), w, el.title, el.sub);
  if (el.card !== false) s += (iso ? edge(el.x, el.y, w, h) : "") + `<rect x="${el.x}" y="${el.y}" width="${w}" height="${h}" rx="12" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
  el.items.forEach((raw, i) => {
    const it = typeof raw === "string" ? { t: raw } : raw;
    const x = el.x + pad + (i % el.cols) * (cw + gap), y = el.y + pad + Math.floor(i / el.cols) * (ch + gap);
    const edgeCol = it.mute ? "var(--faint)" : it.tone === "alert" ? "var(--alert)" : "var(--ink)";
    const fill = it.hot ? (it.tone === "alert" ? "var(--alert)" : "var(--tc)") : it.hue ? M(it.hue, "t") : "var(--card)";
    s += `<rect x="${r1(x)}" y="${r1(y)}" width="${cw}" height="${ch}" rx="6" fill="${fill}" stroke="${edgeCol}" stroke-width="2"${it.mute ? ' stroke-dasharray="4 4"' : ""}/>`
      + (it.t ? text(x + cw / 2, y + ch / 2 + 4.5, it.t, { size: 12, w: it.hot ? 800 : 600, mono, anchor: "middle", fill: it.hot ? "var(--card)" : it.mute ? "var(--faint)" : it.strike ? "var(--muted)" : "var(--ink)", strike: it.strike }) : "");
  });
  const rows = Math.ceil(el.items.length / el.cols);
  (el.ticks ?? []).forEach((t, c) => { s += text(el.x + pad + c * (cw + gap) + cw / 2, el.y + pad + rows * (ch + gap) - gap + 13, t, { size: 10.5, mono: true, fill: "var(--muted)", anchor: "middle" }); });
  return s;
}

/** Grid position of every block, back to front. */
function blockCells(el: BlocksEl) {
  const step = el.size + (el.gap ?? 0.25), along = el.dir ?? "gx";
  return el.items.map((it, i) => {
    const c = i % el.cols, r = Math.floor(i / el.cols);
    return { it, gx: el.gx + (along === "gx" ? c : r) * step, gy: el.gy + (along === "gx" ? r : c) * step };
  }).sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
}
const blockPrism = (el: BlocksEl, c: ReturnType<typeof blockCells>[number]): PrismEl =>
  ({ kind: "prism", id: el.id, gx: c.gx, gy: c.gy, w: el.size, d: el.size, h: Math.max(2, c.it.h), hue: c.it.hot ? "track" : c.it.hue ?? "paper", state: c.it.state, title: c.it.label, at: el.at, z: el.z });
function blocksBox(el: BlocksEl, o: Iso) {
  const bs = blockCells(el).map((c) => prismBox(prismCorners(blockPrism(el, c), o)));
  return { x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)), x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)) };
}
function blocks(el: BlocksEl, o: Iso, uid: string): string {
  let s = blockCells(el).map((c) => prism(blockPrism(el, c), o, uid)).join("");
  if (el.title) { const [x, y, po] = plateAt(el.at ?? "s", blocksBox(el, o), el.title, { sub: el.sub, glyph: el.glyph }); s += plate(x, y, el.title, po); }
  return s;
}

/** Width and height of a box or diamond node. */
export function nodeSize(el: NodeEl): [number, number] {
  if ((el.shape ?? "dot") === "dot") return [(el.r ?? 9) * 2, (el.r ?? 9) * 2];
  const tw = Math.max(textWidth(el.label ?? "", 13, { bold: true, mono: el.mono }), el.sub ? textWidth(el.sub, 11.5) : 0);
  return [el.w ?? Math.ceil(tw + 26), el.sub ? 44 : 30];
}
function node(el: NodeEl): string {
  const shape = el.shape ?? "dot", col = el.tone === "alert" ? "var(--alert)" : "var(--tc)";
  const fill = el.hot ? col : el.hue ? M(el.hue, "t") : "var(--card)";
  const stroke = el.mute ? "var(--faint)" : el.tone === "alert" ? "var(--alert)" : "var(--ink)";
  const ink = el.hot ? "var(--card)" : el.mute ? "var(--faint)" : "var(--ink)", dash = el.mute ? ' stroke-dasharray="5 4"' : "";
  if (shape === "dot") {
    const r = el.r ?? 9;
    return `<circle cx="${el.x}" cy="${el.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3"${dash}/>` + sideLabel(el.x, el.y, el.at ?? "s", el.label, el.sub, r + 10, !!el.mute, el.mono);
  }
  const [w, h] = nodeSize(el), x = el.x - w / 2, y = el.y - h / 2;
  const outline = (dy: number) => shape === "diamond"
    ? `M${el.x} ${y - 7 + dy}L${x + w + 12} ${el.y + dy}L${el.x} ${y + h + 7 + dy}L${x - 12} ${el.y + dy}Z`
    : `M${x + 9} ${y + dy}H${x + w - 9}Q${x + w} ${y + dy} ${x + w} ${y + 9 + dy}V${y + h - 9 + dy}Q${x + w} ${y + h + dy} ${x + w - 9} ${y + h + dy}H${x + 9}Q${x} ${y + h + dy} ${x} ${y + h - 9 + dy}V${y + 9 + dy}Q${x} ${y + dy} ${x + 9} ${y + dy}Z`;
  return (el.mute ? "" : `<path d="${outline(3.5)}" fill="${stroke}"/>`) + `<path d="${outline(0)}" fill="${fill}" stroke="${stroke}" stroke-width="2.25" stroke-linejoin="round"${dash}/>`
    + (el.label ? text(el.x, el.sub ? el.y - 2 : el.y + 4.5, el.label, { size: 13, w: 800, anchor: "middle", fill: ink, mono: el.mono }) : "")
    + (el.sub ? text(el.x, el.y + 14, el.sub, { size: 11.5, anchor: "middle", fill: el.hot ? "var(--card)" : "var(--muted)" }) : "");
}

/** Centre of every unit of a layers element, layer by layer. */
export function layerUnitPositions(el: LayersEl): Pt[][] {
  const n = el.sizes.length, top = el.y + 18, bottom = el.y + el.h - (el.labels ? 30 : 16);
  return el.sizes.map((k, i) => {
    const x = el.x + 28 + (n > 1 ? (i * (el.w - 56)) / (n - 1) : (el.w - 56) / 2);
    return Array.from({ length: k }, (_, j) => [x, top + ((j + 0.5) * (bottom - top)) / k] as Pt);
  });
}
function layers(el: LayersEl, uid: string, iso: boolean): string {
  const U = layerUnitPositions(el), lit = new Set((el.hot ?? []).map(([a, b]) => `${a}.${b}`));
  let s = post(el.x, el.y, el.w, el.h, el.stand, uid) + (iso ? edge(el.x, el.y, el.w, el.h) : "") + cardHead(el.x, headY(el.y, el.h, el.below), el.w, el.title, el.sub)
    + `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="12" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>`;
  let dim = "", bright = "";
  const links = el.connections ?? U.slice(0, -1).flatMap((col, i) => col.flatMap((_, ai) => U[i + 1].map((__, bi) => [i, ai, i + 1, bi] as [number, number, number, number])));
  for (const [i, ai, j, bi] of links) {
    const a = U[i]?.[ai], b = U[j]?.[bi];
    if (!a || !b) continue;
    const on = lit.has(`${i}.${ai}`) && lit.has(`${j}.${bi}`), d = `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`;
    if (on) bright += `<path d="${d}" stroke="var(--tc)" stroke-width="2.5"/>`;
    else dim += `<path d="${d}" stroke="var(--ink)" stroke-width="1.25" opacity="${r1(0.1 + (((ai * 7 + bi * 13 + i * 5) % 9) / 9) * 0.3)}"/>`;
  }
  s += dim + bright;
  U.forEach((col, i) => {
    s += col.map(([x, y], j) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="7.5" fill="${lit.has(`${i}.${j}`) ? "var(--tc)" : "var(--card)"}" stroke="var(--ink)" stroke-width="2.25"/>`).join("");
    if (el.labels?.[i]) s += text(col[0][0], el.y + el.h - 11, el.labels[i], { size: 11, w: 700, fill: "var(--muted)", anchor: i === 0 ? "start" : i === U.length - 1 ? "end" : "middle" });
  });
  return s;
}

/* ---------- tips ---------- */

function tipOf(el: El): string | undefined {
  if (el.tip) return el.tip;
  const join = (a?: string, b?: string) => [a, b].filter(Boolean).join(": ");
  switch (el.kind) {
    case "stop": return join(el.label, el.sub) || undefined;
    case "db": case "box": case "model": case "prism": case "drum": return join(el.title, el.sub) || undefined;
    case "slab": return el.label;
    case "pawn": return el.say ? join(el.title, el.say) : el.title;
    case "doc": return [el.title, ...(el.lines ?? [])].join(". ");
    case "code": return el.title;
    case "tree": case "plot": case "cells": case "layers": case "blocks": return join(el.title, el.sub) || undefined;
    case "node": return el.shape && el.shape !== "dot" ? undefined : join(el.label, el.sub) || undefined;
    case "person": return el.say ? join(el.title, el.say) : el.title;
    default: return undefined;
  }
}

/* ---------- tokens ---------- */

export function tokenBody(label: string, shape: Ride["shape"] = "row", tone: Tone = "track"): string {
  const col = TONE[tone];
  const tw = textWidth(label, 12.5, { mono: true });
  if (shape === "pill") {
    const w = tw + 40;
    return `<rect class="tb" x="${r1(-w / 2)}" y="-16" width="${r1(w)}" height="32" rx="16" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/><circle class="td" cx="${r1(-w / 2 + 17)}" cy="0" r="6.5" fill="${col}"/><text class="tt m" x="${r1(-w / 2 + 30)}" y="4.5" font-size="12.5" font-weight="700" fill="var(--ink)">${esc(label)}</text>`;
  }
  if (shape === "doc") {
    const w = tw + 34;
    return `<path class="tb" d="M${r1(-w / 2)} -15H${r1(w / 2 - 9)}L${r1(w / 2)} -6V15H${r1(-w / 2)}Z" fill="var(--card)" stroke="${col}" stroke-width="3" stroke-linejoin="round"/><text class="tt m" x="${r1(-w / 2 + 12)}" y="4.5" font-size="12.5" font-weight="700" fill="${col}">${esc(label)}</text>`;
  }
  if (shape === "puck") {
    const w = tw + 24;
    return `<ellipse cx="0" cy="5" rx="15" ry="7.5" fill="color-mix(in srgb, ${col} 55%, #000)" stroke="var(--ink)" stroke-width="2"/><ellipse cx="0" cy="0" rx="15" ry="7.5" fill="${col}" stroke="var(--ink)" stroke-width="2.5"/>`
      + `<path d="M0 -9V-20" stroke="var(--ink)" stroke-width="2"/><rect x="${r1(-w / 2)}" y="-44.5" width="${r1(w)}" height="26" rx="13" fill="var(--ink)"/>`
      + `<rect class="tb" x="${r1(-w / 2)}" y="-48" width="${r1(w)}" height="26" rx="13" fill="var(--card)" stroke="var(--ink)" stroke-width="2.25"/><text class="tt m" x="${r1(-w / 2 + 12)}" y="-30.5" font-size="12.5" font-weight="700" fill="var(--ink)">${esc(label)}</text>`;
  }
  if (shape === "dot") return `<circle class="tb" r="9" fill="${col}" stroke="var(--ink)" stroke-width="3"/><text class="tt m" x="0" y="-16" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)" ${halo}>${esc(label)}</text>`;
  const w = tw + 24;
  return `<rect class="tb" x="${r1(-w / 2)}" y="-14" width="${r1(w)}" height="28" rx="6" fill="${col}" stroke="var(--ink)" stroke-width="2.5"/><text class="tt m" x="${r1(-w / 2 + 12)}" y="4.5" font-size="12.5" font-weight="700" fill="var(--card)">${esc(label)}</text>`;
}

/* ---------- scene ---------- */

/** True when a step draws the element. */
export function isOn(el: El, show: readonly string[]): boolean {
  return !!el.always || show.includes(el.id) || (!!el.group && show.includes(el.group));
}

const LAYER: Record<string, number> = { zone: 0, slab: 0, line: 1, stop: 1.5, arrow: 2, label: 5, pill: 5 };
const HUES: Hue[] = ["paper", "track", "sand", "sky", "mint", "violet", "rose", "ink"];

/** How near the viewer an element stands on the floor: larger is nearer and drawn later. */
function depth(el: El, o: Iso): number {
  switch (el.kind) {
    case "prism": case "tank": return project(o, el.gx + el.w, el.gy + el.d)[1];
    case "drum": return project(o, el.gx, el.gy)[1] + el.r * o.a * 0.7;
    case "pawn": return project(o, el.gx, el.gy)[1];
    case "table": case "code": case "list": case "doc": case "tree": case "plot": case "cells": case "layers": return el.stand ? el.stand[1] : el.y;
    case "blocks": { const cs = blockCells(el), last = cs.at(-1)!; return project(o, last.gx + el.size, last.gy + el.size)[1]; }
    case "node": return el.y;
    default: return 0;
  }
}

function draw(el: El, uid: string, o: Iso | undefined, els: El[]): string {
  const iso = !!o, O = o ?? { ox: 0, oy: 0, a: 30 };
  switch (el.kind) {
    case "plot": return plot(el, uid, iso);
    case "series": return series(el, plotOf(els, el), uid);
    case "cells": return cells(el, uid, iso);
    case "blocks": return blocks(el, O, uid);
    case "node": return node(el);
    case "layers": return layers(el, uid, iso);
    case "prism": return prism(el, O, uid);
    case "drum": return drum(el, O, uid);
    case "slab": return slab(el, O, uid);
    case "tank": return tank(el, O);
    case "pill": return pill(el);
    case "pawn": return pawn(el, O, uid);
    case "zone": return zone(el);
    case "line": return line(el, uid, iso);
    case "stop": return stop(el, iso);
    case "db": return db(el);
    case "box": return box(el);
    case "table": return table(el, uid, iso);
    case "code": return code(el, uid, iso);
    case "doc": return doc(el, uid, iso);
    case "window": return windowEl(el);
    case "model": return model(el);
    case "person": return person(el);
    case "list": return list(el, uid, iso);
    case "tree": return tree(el, uid, iso);
    case "matrix": return matrix(el);
    case "marks": return marks(el);
    case "label": return label(el);
    case "arrow": return arrow(el, uid);
    case "sheets": return sheets(el);
  }
}

/** Renders the full scene as an SVG string. Every element is present; the ones drawn in the step carry the class on. */
export function renderScene(guide: Guide, stepIndex = 0): string {
  const uid = guide.id.toLowerCase();
  const show = guide.steps[stepIndex]?.show ?? [];
  const [w, h] = guide.scene.viewBox;
  const wrap = (el: El, inner: string) => {
    const tip = tipOf(el);
    return `<g data-el="${esc(el.id)}"${el.group ? ` data-group="${esc(el.group)}"` : ""} data-kind="${el.kind}"${tip ? ` data-tip="${esc(tip)}"` : ""} class="el${isOn(el, show) ? " on" : ""}">${inner}</g>`;
  };
  const o = guide.scene.iso;
  const els = guide.scene.els;
  // A series is drawn just in front of its plot.
  const near = (el: El): number => { if (!o) return 0; if (el.kind !== "series") return depth(el, o); const p = plotOf(els, el); return p ? depth(p, o) + 0.01 : 0; };
  const order = [...els].sort((a, b) => (LAYER[a.kind] ?? 3) - (LAYER[b.kind] ?? 3) || near(a) - near(b));
  const body = order.map((el) => wrap(el, draw(el, uid, o, els))).join("");
  const onSeries = (id: string) => els.some((e) => e.id === id && e.kind === "series");
  const tokens = guide.steps.flatMap((st, i) => (st.rides ?? []).map((ride, k) => {
    const g = rideGeometry(guide, ride);
    if (!g) return "";
    const rest = g.then ?? g.label;
    return `<g class="tok${i === stepIndex ? " on" : ""}" data-step="${i}" data-k="${k}" data-line="${uid}-${esc(ride.line)}" data-from="${g.from}" data-to="${g.to}" data-via="${g.via.join(",")}" data-label="${esc(ride.label)}"${g.then ? ` data-then="${esc(g.then)}"` : ""} data-rest="${r1(g.rest[0])},${r1(g.rest[1])}" transform="translate(${r1(g.rest[0])} ${r1(g.rest[1])})">${tokenBody(rest, ride.shape ?? (onSeries(ride.line) ? "dot" : o ? "puck" : "row"), ride.tone)}</g>`;
  })).join("");
  const marker = (name: string, color: string) =>
    `<marker id="${uid}-h-${name}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></marker>`;
  const cyl = (hue: Hue) => `<linearGradient id="${uid}-cyl-${hue}" x1="0" x2="1"><stop offset="0" style="stop-color:var(--m-${hue}-t)"/><stop offset=".55" style="stop-color:var(--m-${hue}-l)"/><stop offset="1" style="stop-color:var(--m-${hue}-r)"/></linearGradient>`;
  const floorDefs = o ? HUES.map(cyl).join("")
    + `<filter id="${uid}-soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>`
    + `<pattern id="${uid}-floor" width="${o.a * 2}" height="${o.a}" patternUnits="userSpaceOnUse" patternTransform="translate(${o.ox} ${o.oy})"><path d="M0 ${o.a / 2}L${o.a} 0L${o.a * 2} ${o.a / 2}L${o.a} ${o.a}Z" fill="none" stroke="var(--grid)" stroke-width="1"/></pattern>`
    + `<radialGradient id="${uid}-fade" cx=".5" cy=".5" r=".7"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${uid}-mask"><rect width="${w}" height="${h}" fill="url(#${uid}-fade)"/></mask>` : "";
  const floor = o ? `<rect width="${w}" height="${h}" fill="url(#${uid}-floor)" mask="url(#${uid}-mask)"/>` : "";
  const defs = `<defs>${(Object.keys(TONE) as Tone[]).map((t) => marker(t, TONE[t])).join("")}${floorDefs}</defs>`;
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(guide.scene.label)}">${defs}${floor}<g class="world">${body}</g><g class="toks">${tokens}</g>`
    + (guide.scene.note ? text(w - 12, h - 10, guide.scene.note, { size: 11.5, w: 600, anchor: "end", fill: "var(--faint)" }) : "")
    + `</svg>`;
}

/* ---------- layout checks ---------- */

/** Text that would overflow its card, and elements outside the canvas. An empty array means the scene lays out. */
export function sceneWarnings(guide: Guide): string[] {
  const out: string[] = [];
  const [W, H] = guide.scene.viewBox;
  const fit = (id: string, what: string, need: number, room: number) => { if (need > room + 1) out.push(`${guide.id} ${id}: ${what} needs ${Math.round(need)}px, has ${Math.round(room)}px`); };
  const inside = (id: string, x0: number, y0: number, x1: number, y1: number) => {
    if (x0 < -1 || y0 < -1 || x1 > W + 1 || y1 > H + 1) out.push(`${guide.id} ${id}: outside the canvas (${Math.round(x0)},${Math.round(y0)} to ${Math.round(x1)},${Math.round(y1)})`);
  };
  for (const el of guide.scene.els) {
    switch (el.kind) {
      case "box": {
        const room = el.w - (el.glyph ? 52 : 16) - 12;
        fit(el.id, "title", textWidth(el.title, el.mono ? 13.5 : 15, { bold: true, mono: el.mono }), room);
        if (el.sub) fit(el.id, "sub line", textWidth(el.sub, 12.5), room);
        inside(el.id, el.x, el.y, el.x + el.w, el.y + el.h);
        break;
      }
      case "table": {
        const xs = colX(el).map((v) => v - el.x);
        const rows = el.rows.map(rowOf);
        el.cols.forEach((c, i) => {
          const room = (i + 1 < xs.length ? xs[i + 1] : el.w - 8) - xs[i] - 6;
          fit(el.id, `column ${c}`, Math.max(textWidth(c, 11, { mono: true }), ...rows.map((r) => textWidth(r.cells[i] ?? "", 12, { mono: true }))), room);
        });
        if (el.title) fit(el.id, "heading", textWidth(el.title, el.mono ? 13.5 : 15, { bold: true, mono: el.mono }) + (el.sub ? textWidth(el.sub, 12.5) + 12 : 0), el.w + (el.sub ? 0 : 400));
        inside(el.id, el.x, el.y - (el.title && !el.below ? 26 : 0), el.x + Math.max(el.w, el.below && el.title ? textWidth(el.title, el.mono ? 13.5 : 15, { bold: true, mono: el.mono }) : 0), el.y + tableHeight(el) + (el.below && el.title ? 28 : 0));
        break;
      }
      case "code":
        fit(el.id, "code line", Math.max(...el.lines.map((l) => textWidth(l, 12, { mono: true }))), el.w - 28);
        if (el.title) fit(el.id, "heading", textWidth(el.title, 15, { bold: true }) + (el.sub ? textWidth(el.sub, 12.5) + 12 : 0), el.w + (el.sub ? 0 : 400));
        inside(el.id, el.x, el.y - (el.title && !el.below ? 26 : 0), el.x + el.w, el.y + codeHeight(el) + (el.below && el.title ? 28 : 0));
        break;
      case "list":
        fit(el.id, "item", Math.max(...el.items.map((i) => textWidth(itemOf(i).t, el.mono ? 12 : 13, { mono: el.mono, bold: itemOf(i).hot }))), el.w - (el.numbered ? 38 : 14) - 10);
        if (el.title && el.sub) fit(el.id, "heading", textWidth(el.title, 15, { bold: true }) + textWidth(el.sub, 12.5) + 12, el.w);
        inside(el.id, el.x, el.y - (el.title && !el.below ? 26 : 0), el.x + el.w, el.y + listHeight(el) + (el.below && el.title ? 28 : 0));
        break;
      case "doc":
        fit(el.id, "title", textWidth(el.title, 14.5, { bold: true }), el.w - 34);
        for (const l of el.lines ?? []) fit(el.id, "line", textWidth(l, el.mono ? 11.5 : 12.5, { mono: el.mono }), el.w - 24);
        inside(el.id, el.x, el.y, el.x + el.w, el.y + el.h);
        break;
      case "model":
        fit(el.id, "title", textWidth(el.title, 15, { bold: true }), el.w - Math.min(el.h - 20, 48) - 40);
        if (el.sub) fit(el.id, "sub line", textWidth(el.sub, 12.5), el.w - Math.min(el.h - 20, 48) - 40);
        inside(el.id, el.x, el.y, el.x + el.w, el.y + el.h);
        break;
      case "plot": {
        if (el.title) fit(el.id, "heading", textWidth(el.title, 15, { bold: true }) + (el.sub ? textWidth(el.sub, 12.5) + 12 : 0), el.w);
        inside(el.id, el.x, el.y - (el.title && !el.below ? 26 : 0), el.x + el.w, el.y + el.h + (el.title && el.below ? 28 : 5));
        break;
      }
      case "series": {
        const p = plotOf(guide.scene.els, el);
        if (!p) { out.push(`${guide.id} ${el.id}: series names plot ${el.plot}, which does not exist`); break; }
        if (el.as === "rect" && (!el.region || el.region.some((v) => !Number.isFinite(v)))) out.push(`${guide.id} ${el.id}: a rect series needs four finite data coordinates`);
        for (const [a, b] of el.pts ?? []) if (a < Math.min(...p.xr) || a > Math.max(...p.xr) || b < Math.min(...p.yr) || b > Math.max(...p.yr)) { out.push(`${guide.id} ${el.id}: point ${a},${b} is outside the axes of ${p.id}`); break; }
        if ((el.as === "line" || el.as === "area") && (el.pts?.length ?? 0) < 2) out.push(`${guide.id} ${el.id}: a ${el.as} series needs at least two points`);
        break;
      }
      case "cells": {
        const [w, h] = cellsSize(el);
        for (const raw of el.items) { const t = typeof raw === "string" ? raw : raw.t; fit(el.id, `cell ${t}`, textWidth(t, 12, { mono: el.mono !== false, bold: true }), el.cell[0] - 6); }
        if (el.title) fit(el.id, "heading", textWidth(el.title, 15, { bold: true }) + (el.sub ? textWidth(el.sub, 12.5) + 12 : 0), Math.max(w, 400));
        inside(el.id, el.x, el.y - (el.title && !el.below ? 26 : 0), el.x + w, el.y + h + (el.title && el.below ? 28 : 5));
        break;
      }
      case "layers":
        for (const [a, b, c, d] of el.connections ?? []) if (!el.sizes[a] || !el.sizes[c] || b >= el.sizes[a] || d >= el.sizes[c]) out.push(`${guide.id} ${el.id}: connection ${a}.${b} to ${c}.${d} uses a missing unit`);
        inside(el.id, el.x, el.y - (el.title && !el.below ? 26 : 0), el.x + el.w, el.y + el.h + (el.title && el.below ? 28 : 5));
        break;
      case "node": {
        const [w, h] = nodeSize(el), d = el.shape === "diamond" ? 12 : 0;
        if (el.w && el.label) fit(el.id, "label", textWidth(el.label, 13, { bold: true, mono: el.mono }), el.w - 14);
        inside(el.id, el.x - w / 2 - d, el.y - h / 2 - d, el.x + w / 2 + d, el.y + h / 2 + d);
        break;
      }
      case "tree":
        fit(el.id, "heading", textWidth(el.title, 15, { bold: true }) + (el.sub ? textWidth(el.sub, 12) + 10 : 0), el.w - 28);
        for (const l of el.leaves) fit(el.id, "leaf", textWidth(l, 12, { mono: true }), 62);
        inside(el.id, el.x, el.y, el.x + el.w, el.y + el.h);
        break;
      case "zone": inside(el.id, el.x, el.y, el.x + el.w, el.y + el.h); break;
      case "line": for (const [x, y] of el.pts) inside(el.id, x - 4, y - 4, x + 4, y + 4); break;
      case "stop": {
        if (guide.scene.iso) break;
        const tw = Math.max(textWidth(el.label ?? "", el.mono ? 13.5 : 15, { bold: true, mono: el.mono }), textWidth(el.sub ?? "", 12.5));
        const at = el.at ?? "s";
        if (at === "s") inside(el.id, el.x - tw / 2, el.y, el.x + tw / 2, el.y + (el.sub ? 52 : 36));
        else if (at === "n") inside(el.id, el.x - tw / 2, el.y - (el.sub ? 56 : 40), el.x + tw / 2, el.y);
        else if (at === "e") inside(el.id, el.x, el.y - 18, el.x + 24 + tw, el.y + 18);
        else inside(el.id, el.x - 24 - tw, el.y - 18, el.x, el.y + 18);
        break;
      }
      case "label": {
        const tw = textWidth(el.text, el.size ?? 13, { bold: el.strong, mono: el.mono });
        const x0 = el.anchor === "middle" ? el.x - tw / 2 : el.anchor === "end" ? el.x - tw : el.x;
        inside(el.id, x0, el.y - 12, x0 + tw, el.y + 4);
        break;
      }
      case "window": {
        const lw = Math.max(...el.segs.map((s) => textWidth(s.label, 13, { bold: true })), el.limit ? textWidth(el.limit, 12, { bold: true }) : 0);
        inside(el.id, el.x, el.y - (el.title ? 28 : 0), el.x + el.w + 14 + lw, el.y + el.h);
        break;
      }
      case "person": {
        if (el.say) {
          const tw = textWidth(el.say, 13.5, { bold: true }) + 28;
          const east = (el.side ?? "e") === "e";
          inside(el.id, east ? el.x - 20 : el.x - 30 - tw, el.y - 52, east ? el.x + 30 + tw : el.x + 20, el.y + 40);
        }
        break;
      }
      case "db": inside(el.id, el.x, el.y, el.x + el.w, el.y + el.h); break;
    }
  }
  for (const [i, st] of guide.steps.entries()) {
    for (const ride of st.rides ?? []) {
      const g = rideGeometry(guide, ride);
      if (!g) continue;
      const tw = textWidth(g.then ?? g.label, 12.5, { mono: true }) + 40;
      inside(`step ${i + 1} record`, g.rest[0] - tw / 2, g.rest[1] - 16, g.rest[0] + tw / 2, g.rest[1] + 16);
    }
  }
  return out;
}

/* ---------- collisions on the floor ---------- */

interface Box { name: string; own: string; x0: number; y0: number; x1: number; y1: number; vol?: boolean; host?: string }
const plateBox = (name: string, own: string, x: number, y: number, title: string, o: PlateOpts): Box => {
  const [w, h] = plateSize(title, o);
  const left = o.anchor === "start" ? x : o.anchor === "end" ? x - w : x - w / 2;
  return { name, own, x0: left, y0: y, x1: left + w, y1: y + h + 4 };
};
/** Screen boxes of everything that must not overlap: volumes, their name plates, cards and annotations. */
function boxesOf(el: El, o: Iso): Box[] {
  const id = el.id;
  switch (el.kind) {
    case "prism": {
      const b = prismBox(prismCorners(el, o)), out: Box[] = [{ name: id, own: id, vol: true, ...b }];
      if (el.title) { const [x, y, po] = plateAt(el.at ?? "s", b, el.title, { sub: el.state === "closed" ? el.sub ?? "closed" : el.sub }); out.push(plateBox(`${id} plate`, id, x, y, el.title, po)); }
      return out;
    }
    case "drum": {
      const g = drumGeo(el, o), out: Box[] = [{ name: id, own: id, vol: true, ...g.box }];
      if (el.title) { const [x, y, po] = plateAt(el.at ?? "s", g.box, el.title, { sub: el.sub }); out.push(plateBox(`${id} plate`, id, x, y, el.title, po)); }
      return out;
    }
    case "tank": {
      const c = prismCorners(el, o), b = prismBox(c);
      const lw = Math.max(...el.segs.map((s) => textWidth(s.label, 13, { bold: true })));
      const out: Box[] = [{ name: id, own: id, vol: true, ...b }, { name: `${id} labels`, own: id, x0: b.x1 + 16, y0: c.B[1], x1: b.x1 + 26 + lw, y1: c.B0[1] + 8 }];
      if (el.title) out.push(plateBox(`${id} plate`, id, (c.D[0] + c.B[0]) / 2, c.A[1] - 44, el.title, {}));
      return out;
    }
    case "pawn": {
      const [x, y] = project(o, el.gx, el.gy, el.z ?? 0), out: Box[] = [{ name: id, own: id, x0: x - 16, y0: y - 60, x1: x + 16, y1: y + 8 }];
      if (el.title) out.push(plateBox(`${id} plate`, id, x, y + 14, el.title, {}));
      if (el.say) { const east = (el.side ?? "e") === "e"; out.push(plateBox(`${id} speech`, id, east ? x + 26 : x - 26, y - 96, el.say, { anchor: east ? "start" : "end" })); }
      return out;
    }
    case "pill": return [plateBox(id, id, el.x, el.y, el.text, { sub: el.sub, glyph: el.glyph, anchor: el.anchor ?? "middle", mono: el.mono })];
    case "stop": { if (!el.label) return []; const [px, py, po] = stopPlate(el); return [plateBox(`${id} plate`, id, px, py, el.label, po)]; }
    case "table": case "code": case "list": {
      const h = el.kind === "table" ? tableHeight(el) : el.kind === "code" ? codeHeight(el) : listHeight(el);
      return [{ name: id, own: id, x0: el.x, y0: el.y - (el.title && !el.below ? 24 : 0), x1: el.x + el.w, y1: el.y + h + 5 + (el.title && el.below ? 26 : 0) }];
    }
    case "doc": case "tree": return [{ name: id, own: id, x0: el.x, y0: el.y, x1: el.x + el.w, y1: el.y + el.h + 5 }];
    case "plot": case "layers": return [{ name: id, own: id, x0: el.x, y0: el.y - (el.title && !el.below ? 24 : 0), x1: el.x + el.w, y1: el.y + el.h + 5 + (el.title && el.below ? 26 : 0) }];
    case "cells": { const [w, h] = cellsSize(el); return [{ name: id, own: id, x0: el.x, y0: el.y - (el.title && !el.below ? 24 : 0), x1: el.x + w, y1: el.y + h + 5 + (el.title && el.below ? 26 : 0) }]; }
    case "node": { if ((el.shape ?? "dot") === "dot") return []; const [w, h] = nodeSize(el); return [{ name: id, own: id, x0: el.x - w / 2, y0: el.y - h / 2, x1: el.x + w / 2, y1: el.y + h / 2 + 4 }]; }
    case "blocks": {
      const out: Box[] = [];
      blockCells(el).forEach((c, i) => {
        const prismEl = blockPrism(el, c), b = prismBox(prismCorners(prismEl, o)), own = `${id}-block-${i}`;
        out.push({ name: `${id} block ${i + 1}`, own, vol: true, ...b });
        if (c.it.label) {
          const [x, y, po] = plateAt(el.at ?? "s", b, c.it.label, { tone: c.it.state === "alert" ? "alert" : "ink" });
          out.push(plateBox(`${id} block ${i + 1} plate`, own, x, y, c.it.label, po));
        }
      });
      const b = blocksBox(el, o);
      if (el.title) { const [x, y, po] = plateAt(el.at ?? "s", b, el.title, { sub: el.sub, glyph: el.glyph }); out.push(plateBox(`${id} plate`, id, x, y, el.title, po)); }
      return out;
    }
    case "label": {
      const tw = textWidth(el.text, el.size ?? 13, { bold: el.strong, mono: el.mono });
      const x0 = el.anchor === "middle" ? el.x - tw / 2 : el.anchor === "end" ? el.x - tw : el.x;
      return [{ name: id, own: id, x0, y0: el.y - 12, x1: x0 + tw, y1: el.y + 4 }];
    }
    default: return [];
  }
}

/** Overlaps and out-of-canvas volumes in a floor scene, step by step. An empty array means every step is clear. */
export function sceneCollisions(guide: Guide): string[] {
  const o = guide.scene.iso;
  if (!o) return [];
  const [W, H] = guide.scene.viewBox, out = new Set<string>();
  guide.steps.forEach((st, i) => {
    const boxes = guide.scene.els.filter((e) => isOn(e, st.show)).flatMap((e) => boxesOf(e, o).map((b) => ({ ...b, host: e.on })));
    for (const ride of st.rides ?? []) {
      const g = rideGeometry(guide, ride);
      if (!g) continue;
      const tw = textWidth(g.then ?? g.label, 12.5, { mono: true }) + 24;
      const track = guide.scene.els.find((e) => e.id === ride.line);
      // The record's box depends on its shape: a puck and a dot carry their text above, the others are the text.
      const shape = ride.shape ?? (track?.kind === "series" ? "dot" : "puck");
      const half = (shape === "pill" ? tw + 16 : tw) / 2, [up, down] = shape === "puck" ? [50, 12] : shape === "dot" ? [28, 10] : [16, 16];
      boxes.push({ name: `record "${g.then ?? g.label}"`, own: `ride-${ride.line}-${ride.label}`, host: track?.kind === "series" ? track.plot : track?.on, x0: g.rest[0] - half, y0: g.rest[1] - up, x1: g.rest[0] + half, y1: g.rest[1] + down });
    }
    for (const b of boxes) if (b.x0 < -2 || b.y0 < -2 || b.x1 > W + 2 || b.y1 > H + 2) out.add(`${guide.id}: ${b.name} leaves the canvas (${Math.round(b.x0)},${Math.round(b.y0)} to ${Math.round(b.x1)},${Math.round(b.y1)})`);
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
      const p = boxes[a], q = boxes[b];
      if (p.own === q.own || (p.vol && q.vol) || p.host === q.own || q.host === p.own) continue;
      const ox = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), oy = Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0);
      if (ox > 6 && oy > 6) out.add(`${guide.id} step ${i + 1}: ${p.name} overlaps ${q.name} by ${Math.round(ox)}x${Math.round(oy)}`);
    }
  });
  return [...out];
}

/** Width of a bar as a percentage of its track. */
export function barWidth(value: number, scale: "log" | "linear", min: number, max: number): number {
  const f = scale === "log" ? (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) : (value - min) / (max - min);
  return Math.round(Math.max(0, Math.min(1, f)) * 1000) / 10;
}
