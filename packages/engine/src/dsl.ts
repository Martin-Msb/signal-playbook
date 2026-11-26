import type {
  ArrowEl, BlocksEl, BoxEl, Cell, CellsEl, CodeEl, DbEl, DocEl, DrumEl, El, Hue, Iso, LabelEl, LayersEl, LineEl, ListEl, ModelEl, NodeEl, PawnEl, PersonEl, PillEl, PlotEl, PrismEl, Pt, Ride,
  SeriesEl, SlabEl, Step, StepKind, StopEl, TableEl, TankEl, TreeEl, ZoneEl, Block,
} from "./types.ts";
import { cellsSize, codeHeight, layerUnitPositions, listHeight, project, tableHeight } from "./render.ts";

/** Authoring canvas for every scene. Lines run at 45 or 90 degrees. */
export const CANVAS: [number, number] = [960, 540];

type X<T> = Partial<T>;
export const zone = (id: string, x: number, y: number, w: number, h: number, label?: string, extra: X<ZoneEl> = {}): ZoneEl => ({ kind: "zone", id, x, y, w, h, label, ...extra });
export const line = (id: string, pts: Pt[], extra: X<LineEl> = {}): LineEl => ({ kind: "line", id, pts, ...extra });
export const stop = (id: string, x: number, y: number, label?: string, sub?: string, extra: X<StopEl> = {}): StopEl => ({ kind: "stop", id, x, y, label, sub, ...extra });
export const db = (id: string, x: number, y: number, w: number, h: number, title?: string, sub?: string, extra: X<DbEl> = {}): DbEl => ({ kind: "db", id, x, y, w, h, title, sub, ...extra });
export const box = (id: string, x: number, y: number, w: number, h: number, title: string, sub?: string, extra: X<BoxEl> = {}): BoxEl => ({ kind: "box", id, x, y, w, h, title, sub, ...extra });
export const table = (id: string, x: number, y: number, w: number, cols: string[], rows: TableEl["rows"], extra: X<TableEl> = {}): TableEl => ({ kind: "table", id, x, y, w, cols, rows, ...extra });
export const code = (id: string, x: number, y: number, w: number, lines: string[], extra: X<CodeEl> = {}): CodeEl => ({ kind: "code", id, x, y, w, lines, ...extra });
export const doc = (id: string, x: number, y: number, w: number, h: number, title: string, lines?: string[], extra: X<DocEl> = {}): DocEl => ({ kind: "doc", id, x, y, w, h, title, lines, ...extra });
export const model = (id: string, x: number, y: number, w: number, h: number, title: string, sub?: string, extra: X<ModelEl> = {}): ModelEl => ({ kind: "model", id, x, y, w, h, title, sub, ...extra });
export const person = (id: string, x: number, y: number, title?: string, say?: string, extra: X<PersonEl> = {}): PersonEl => ({ kind: "person", id, x, y, title, say, ...extra });
export const list = (id: string, x: number, y: number, w: number, items: ListEl["items"], extra: X<ListEl> = {}): ListEl => ({ kind: "list", id, x, y, w, items, ...extra });
export const note = (id: string, x: number, y: number, text: string, extra: X<LabelEl> = {}): LabelEl => ({ kind: "label", id, x, y, text, ...extra });
export const arrow = (id: string, d: string, extra: X<ArrowEl> = {}): ArrowEl => ({ kind: "arrow", id, d, ...extra });

/** A ride: the record moves along a line from one stop to another. */
export const ride = (line: string, from: string | number, to: string | number, label: string, extra: X<Ride> = {}): Ride => ({ line, from, to, label, ...extra });

/** A step. Strings in the body become paragraphs of detail. */
export const step = (s: {
  id: string; label: string; kind: StepKind; title: string; caption: string;
  show: string[]; counters: string[]; body: (string | Block)[]; claims: string[]; rides?: Ride[];
}): Step => ({ ...s, body: s.body.map((b) => (typeof b === "string" ? { p: b } : b)) });

/* ---------- the floor ---------- */

/** An isometric grid for a scene. p turns a grid point into a screen point, for lines, stops and plates. */
export function isoGrid(ox = 480, oy = 80, a = 32): { iso: Iso; p: (gx: number, gy: number, z?: number) => Pt } {
  const iso = { ox, oy, a };
  return { iso, p: (gx, gy, z = 0) => project(iso, gx, gy, z).map((v) => Math.round(v * 10) / 10) as Pt };
}
export const prism = (id: string, gx: number, gy: number, w: number, d: number, h: number, extra: X<PrismEl> = {}): PrismEl => ({ kind: "prism", id, gx, gy, w, d, h, ...extra });
export const drum = (id: string, gx: number, gy: number, r: number, h: number, extra: X<DrumEl> = {}): DrumEl => ({ kind: "drum", id, gx, gy, r, h, ...extra });
export const slab = (id: string, gx: number, gy: number, w: number, d: number, label?: string, extra: X<SlabEl> = {}): SlabEl => ({ kind: "slab", id, gx, gy, w, d, h: 10, label, ...extra });
export const tank = (id: string, gx: number, gy: number, w: number, d: number, h: number, cap: number, segs: TankEl["segs"], extra: X<TankEl> = {}): TankEl => ({ kind: "tank", id, gx, gy, w, d, h, cap, segs, ...extra });
export const pill = (id: string, at: Pt, text: string, extra: X<PillEl> = {}): PillEl => ({ kind: "pill", id, x: at[0], y: at[1], text, ...extra });
export const pawn = (id: string, gx: number, gy: number, title?: string, say?: string, extra: X<PawnEl> = {}): PawnEl => ({ kind: "pawn", id, gx, gy, title, say, ...extra });

/** Stands a card on a floor point: its bottom centre sits lift pixels above the point, on a post. */
export function raise<T extends TableEl | CodeEl | ListEl | DocEl | TreeEl | PlotEl | CellsEl | LayersEl>(el: T, floor: Pt, lift = 30): T {
  const w = el.kind === "cells" ? cellsSize(el)[0] : el.w;
  const h = el.kind === "table" ? tableHeight(el) : el.kind === "code" ? codeHeight(el) : el.kind === "list" ? listHeight(el) : el.kind === "cells" ? cellsSize(el)[1] : el.h;
  return { ...el, x: Math.round(floor[0] - w / 2), y: Math.round(floor[1] - lift - h), stand: floor };
}

/* ---------- charts, cells, blocks, graphs ---------- */

/** A chart card. xr and yr are the data ranges of its axes. Add series with `series`, naming this plot's id. */
export const plot = (id: string, x: number, y: number, w: number, h: number, xr: [number, number], yr: [number, number], extra: X<PlotEl> = {}): PlotEl => ({ kind: "plot", id, x, y, w, h, xr, yr, ...extra });
/** A series on a plot, in data units. `as` is line, points, area or bars. A record can ride a line series. */
export const series = (id: string, plotId: string, as: "line" | "points" | "area" | "bars", pts: [number, number][], extra: X<SeriesEl> = {}): SeriesEl => ({ kind: "series", id, plot: plotId, as, pts, ...extra });
/** A shaded rectangle on a plot, in data coordinates [xFrom, yFrom, xTo, yTo]. */
export const shade = (id: string, plotId: string, region: [number, number, number, number], extra: X<SeriesEl> = {}): SeriesEl => ({ kind: "series", id, plot: plotId, as: "rect", region, ...extra });
/** A shaded band between two values on an axis of a plot. */
export const band = (id: string, plotId: string, from: number, to: number, extra: X<SeriesEl> = {}): SeriesEl => ({ kind: "series", id, plot: plotId, as: "band", at: [from, to], ...extra });
/** A dashed line across a plot at one value: a threshold or a limit. */
export const rule = (id: string, plotId: string, at: number, extra: X<SeriesEl> = {}): SeriesEl => ({ kind: "series", id, plot: plotId, as: "rule", at, ...extra });
/** A strip or grid of labelled cells, filled row by row. */
export const cells = (id: string, x: number, y: number, cols: number, cell: [number, number], items: Cell[], extra: X<CellsEl> = {}): CellsEl => ({ kind: "cells", id, x, y, cols, cell, items, ...extra });
/** A row or grid of small blocks on the floor. Each item gives a height in pixels. */
export const blocks = (id: string, gx: number, gy: number, cols: number, size: number, items: BlocksEl["items"], extra: X<BlocksEl> = {}): BlocksEl => ({ kind: "blocks", id, gx, gy, cols, size, items, ...extra });
/** A node of a tree or graph, centred on x, y. */
export const node = (id: string, x: number, y: number, label?: string, extra: X<NodeEl> = {}): NodeEl => ({ kind: "node", id, x, y, label, ...extra });
/** A neural network card: sizes gives the units per layer. */
export const layers = (id: string, x: number, y: number, w: number, h: number, sizes: number[], extra: X<LayersEl> = {}): LayersEl => ({ kind: "layers", id, x, y, w, h, sizes, ...extra });
/** Connect two neural-network units as a drawable, rideable route. */
export function layerConnection(id: string, network: LayersEl, from: [number, number], to: [number, number], extra: X<LineEl> = {}): LineEl {
  const units = layerUnitPositions(network), a = units[from[0]]?.[from[1]], b = units[to[0]]?.[to[1]];
  if (!a || !b) throw new RangeError(`layer connection ${id}: unit index is outside the network`);
  return line(id, [a, b], extra);
}

export interface TreeSpec { label: string; sub?: string; hot?: boolean; mute?: boolean; hue?: Hue; tone?: "alert"; group?: string; kids?: TreeSpec[] }
/**
 * Lays out a tree of nodes joined by thin lines, root at the top.
 * Node ids are `<id>-n<path>` and line ids `<id>-l<path>`, where the path is the child index at each level: the root is `<id>-n`, its first child `<id>-n0`.
 * A record can ride any of the lines. byDepth puts each level in its own group, `<id>-d0`, `<id>-d1`, so steps can grow the tree.
 */
export function treeOf(id: string, root: Pt, spec: TreeSpec, o: { dx?: number; dy?: number; shape?: NodeEl["shape"]; group?: string; byDepth?: boolean; mono?: boolean; always?: boolean } = {}): El[] {
  const dx = o.dx ?? 96, dy = o.dy ?? 72, shape = o.shape ?? "box", out: El[] = [];
  const width = (s: TreeSpec): number => (s.kids?.length ? s.kids.reduce((n, k) => n + width(k), 0) : 1);
  const total = width(spec), half = shape === "dot" ? 9 : 15;
  const walk = (s: TreeSpec, left: number, depth: number, path: string, parent?: Pt) => {
    const x = Math.round(root[0] + (left + width(s) / 2 - total / 2) * dx), y = root[1] + depth * dy;
    const group = s.group ?? (o.byDepth ? `${id}-d${depth}` : o.group);
    const shared = { group, always: o.always && !group ? true : undefined };
    if (parent) out.push(line(`${id}-l${path}`, [[parent[0], parent[1] + half + (s.sub || shape === "dot" ? 0 : 0)], [x, y - half - (s.sub ? 7 : 0)]], { tone: "ink", w: 3, ...shared }));
    out.push(node(`${id}-n${path}`, x, y, s.label, { shape, sub: s.sub, hot: s.hot, mute: s.mute, hue: s.hue, tone: s.tone, mono: o.mono, ...shared }));
    let l = left;
    (s.kids ?? []).forEach((k, i) => { walk(k, l, depth + 1, `${path}${i}`, [x, y + (s.sub ? 7 : 0)]); l += width(k); });
  };
  walk(spec, 0, 0, "");
  return out;
}
