export type StepKind = "problem" | "idea" | "mechanism" | "watch-out" | "decision";
export type TrackKey = "data" | "ai" | "ml";
/** The three phases of a use case, in order. */
export type Phase = "problem" | "architecture" | "execution";
export type Pt = [number, number];
/** Ink roles. track is the guide's line colour, alert is reserved for attacks and failures. */
export type Tone = "ink" | "muted" | "track" | "alert";
export type Side = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface ElBase {
  id: string;
  /** Drawn in every step. */
  always?: boolean;
  /** Steps may show a whole group by name. */
  group?: string;
  /** Text shown when the reader hovers the element. Generated from the element when absent. */
  tip?: string;
  /** Id of a card this element is meant to sit on, such as a pill placed on a plot. The overlap check allows that pair. */
  on?: string;
}

/** A tinted region with a tab label: a system boundary such as a warehouse or a context window. */
export interface ZoneEl extends ElBase { kind: "zone"; x: number; y: number; w: number; h: number; label?: string; tone?: Tone }
/** A route. Corners are rounded; author points at 45 or 90 degree angles. */
export interface LineEl extends ElBase {
  kind: "line"; pts: Pt[];
  /** open is in service, closed is removed, planned is not built. */
  state?: "open" | "closed" | "planned";
  tone?: Tone; w?: number;
  /** Close the path into a loop. */
  loop?: boolean;
  /** Draw an arrow head at the end, for thin connectors. */
  head?: boolean;
}
/** A station on a line. */
export interface StopEl extends ElBase {
  kind: "stop"; x: number; y: number; big?: boolean;
  label?: string; sub?: string; at?: Side;
  /** end draws a terminus bar, closed a struck station. */
  state?: "open" | "end" | "closed";
  /** Angle of a terminus bar in degrees, 90 is vertical. */
  angle?: number;
  /** Set the label in the data face, for identifiers. */
  mono?: boolean;
}
/** A database drum. */
export interface DbEl extends ElBase { kind: "db"; x: number; y: number; w: number; h: number; title?: string; sub?: string; at?: Side; tone?: Tone }
/** A plate for a process or component, with a glyph. */
export interface BoxEl extends ElBase {
  kind: "box"; x: number; y: number; w: number; h: number; title: string; sub?: string; glyph?: string;
  state?: "open" | "closed" | "hot" | "alert";
  /** Set the title in the data face, for identifiers such as model names. */
  mono?: boolean;
}
export type Row = string[] | { cells: string[]; hot?: boolean; strike?: boolean; mute?: boolean; hue?: Hue };
/** A table drawn as a table: header, rows, highlighted rows, and per-column or row hues. */
export interface TableEl extends ElBase {
  kind: "table"; x: number; y: number; w: number; cols: string[];
  /** Column offsets from the left edge. Even spacing when absent. */
  at?: number[];
  /** Optional fill hue for each column, in column order. */
  columnHues?: (Hue | undefined)[];
  rows: Row[]; rowH?: number; title?: string; sub?: string; mono?: boolean; foot?: string; tone?: Tone;
  /** Set the title under the card, for cards that hang below a line. */
  below?: boolean;
  /** Floor point the card stands on: draws a post and a foot. */
  stand?: Pt;
}
/** Code on a ticket. Words in keywords are set in the line colour. */
export interface CodeEl extends ElBase { kind: "code"; x: number; y: number; w: number; lines: string[]; keywords?: string[]; hot?: number[]; title?: string; sub?: string; mono?: boolean; below?: boolean; stand?: Pt }
/** A document, file or message with a folded corner. */
export interface DocEl extends ElBase { kind: "doc"; x: number; y: number; w: number; h: number; title: string; lines?: string[]; tone?: Tone; mono?: boolean; stand?: Pt }
/** A container that fills from the bottom, for budgets such as a context window. */
export interface WindowEl extends ElBase {
  kind: "window"; x: number; y: number; w: number; h: number; cap: number; title?: string; limit?: string;
  segs: { label: string; value: number; hot?: boolean; tone?: Tone }[];
}
/** A model: a plate with a network glyph. */
export interface ModelEl extends ElBase { kind: "model"; x: number; y: number; w: number; h: number; title: string; sub?: string; state?: "open" | "hot" | "frozen" | "alert" }
/** A person with an optional speech bubble. */
export interface PersonEl extends ElBase { kind: "person"; x: number; y: number; title?: string; say?: string; side?: "e" | "w" }
export type Item = string | { t: string; hot?: boolean; strike?: boolean; mute?: boolean; tone?: Tone };
/** A ranked or ordered list on a card. cut draws the threshold after that many items. */
export interface ListEl extends ElBase {
  kind: "list"; x: number; y: number; w: number; items: Item[]; title?: string; sub?: string;
  numbered?: boolean; rowH?: number; cut?: number; cutLabel?: string; mono?: boolean; below?: boolean; stand?: Pt;
}
/** A small decision tree: one split, two leaves. */
export interface TreeEl extends ElBase { kind: "tree"; x: number; y: number; w: number; h: number; title: string; sub?: string; leaves: [string, string]; split?: string; stand?: Pt }
export interface MatrixEl extends ElBase {
  kind: "matrix"; x: number; y: number; cell: [number, number]; gap: number;
  /** Opacity per cell, 0 to 1. */
  values: number[][];
}
export interface MarksEl extends ElBase {
  kind: "marks"; x: number; y: number; rowH: number;
  /** true draws a filled dot, false a hollow dot, a string draws text in the data face. */
  values: (boolean | string)[]; tone?: Tone; strong?: boolean;
}
export interface LabelEl extends ElBase {
  kind: "label"; x: number; y: number; text: string;
  anchor?: "start" | "middle" | "end"; tone?: Tone; strong?: boolean; size?: number; mono?: boolean;
  /** A leader line from the label to a point. */
  to?: Pt;
}
/** A thin annotation arrow along an SVG path. */
export interface ArrowEl extends ElBase {
  kind: "arrow"; d: string; tone?: Tone; dashed?: boolean; head?: boolean;
  label?: string; labelAt?: Pt; labelAnchor?: "start" | "middle" | "end";
}
/** A row of small tables, for synthetic pretraining data. */
export interface SheetsEl extends ElBase { kind: "sheets"; x: number; y: number; n: number; w: number; h: number; gap: number }

/** Material of a volume: a soft pastel with a lit top and shaded sides. track follows the guide's line colour. */
export type Hue = "paper" | "track" | "sand" | "sky" | "mint" | "violet" | "rose" | "ink";

/** Isometric projection of a scene: screen origin of grid point 0,0 and half the width of one cell. */
export interface Iso { ox: number; oy: number; a: number }

/** A block on the floor: a system or a process, with a glyph on its top face. Grid coordinates of its back corner. */
export interface PrismEl extends ElBase {
  kind: "prism"; gx: number; gy: number; w: number; d: number; h: number;
  hue?: Hue; glyph?: string; title?: string; sub?: string;
  /** Where the name plate sits: under the front corner, above the block, beside it, or below and to the left. */
  at?: "s" | "n" | "e" | "w" | "sw" | "se";
  /** closed draws a struck outline, for something removed. */
  state?: "open" | "closed" | "alert";
  /** Height of the floor the block stands on, in pixels. */
  z?: number;
}
/** A store: a drum centred on a grid point. */
export interface DrumEl extends ElBase { kind: "drum"; gx: number; gy: number; r: number; h: number; hue?: Hue; glyph?: string; title?: string; sub?: string; state?: "open" | "alert"; at?: "s" | "n" | "e" | "w" | "sw" | "se"; z?: number }
/** A raised floor plate: a system boundary that other objects stand on. */
export interface SlabEl extends ElBase { kind: "slab"; gx: number; gy: number; w: number; d: number; h: number; label?: string; hue?: Hue; glyph?: string }
/** A glass container that fills with layers, for budgets such as a context window. */
export interface TankEl extends ElBase {
  kind: "tank"; gx: number; gy: number; w: number; d: number; h: number; cap: number; title?: string; limit?: string;
  segs: { label: string; value: number; hot?: boolean; hue?: Hue }[];
}
/** A name plate or annotation with an optional glyph, in screen coordinates. */
export interface PillEl extends ElBase {
  kind: "pill"; x: number; y: number; text: string; sub?: string; glyph?: string; tone?: Tone;
  anchor?: "start" | "middle" | "end"; mono?: boolean;
  /** A leader line to a point. */
  to?: Pt;
}
/** A person standing on the floor, with an optional speech plate. */
export interface PawnEl extends ElBase { kind: "pawn"; gx: number; gy: number; title?: string; say?: string; side?: "e" | "w"; hue?: Hue; z?: number }

/**
 * A chart on a card, with axes in data units. Its series are separate elements that name the plot,
 * so a step can reveal them one at a time.
 */
export interface PlotEl extends ElBase {
  kind: "plot"; x: number; y: number; w: number; h: number;
  /** Data range of each axis: [from, to]. */
  xr: [number, number]; yr: [number, number];
  title?: string; sub?: string; xLabel?: string; yLabel?: string;
  /** Tick values. Left out, only the ends of the axis are labelled. */
  xt?: number[]; yt?: number[];
  /** Tick text, one per tick value, for category axes. */
  xtl?: string[]; ytl?: string[];
  grid?: boolean; below?: boolean; stand?: Pt;
}
/**
 * One series on a plot, in the plot's data units.
 * line and area join the points, points draws marks, bars draws columns from the x axis,
 * band shades between two values on an axis and rule draws a line across the plot at one value.
 * A record can ride a line series: name the series as the ride's line.
 */
export interface SeriesEl extends ElBase {
  kind: "series"; plot: string; as: "line" | "points" | "area" | "bars" | "band" | "rule" | "rect";
  pts?: [number, number][];
  /** band: [from, to]. rule: the value. Both on `axis`, x by default. */
  at?: number | [number, number]; axis?: "x" | "y";
  /** rect: [xFrom, yFrom, xTo, yTo] in plot data units. */
  region?: [number, number, number, number];
  tone?: Tone;
  /** Fill of points and bars. hues gives one per point, for classes. */
  hue?: Hue; hues?: Hue[];
  dashed?: boolean; smooth?: boolean; w?: number; r?: number;
  /** Indexes of the points or bars drawn emphasised. */
  hot?: number[];
  label?: string;
  /** Index of the point the label sits at. The last point by default. */
  labelAt?: number;
}
export type Cell = string | { t: string; hot?: boolean; mute?: boolean; strike?: boolean; tone?: Tone; hue?: Hue };
/** A strip or grid of labelled cells: tokens, log entries, column chunks, a bitmap. Items fill row by row. */
export interface CellsEl extends ElBase {
  kind: "cells"; x: number; y: number; cols: number; cell: [number, number]; gap?: number; items: Cell[];
  title?: string; sub?: string;
  /** Text in the data face. true by default. */
  mono?: boolean;
  /** A small caption under each column, such as an offset. */
  ticks?: string[];
  /** false draws the cells bare, without the card behind them. */
  card?: boolean; below?: boolean; stand?: Pt;
}
/** A row or grid of small blocks on the floor, for amounts and layouts: file chunks, shards, replicas, a histogram. */
export interface BlocksEl extends ElBase {
  kind: "blocks"; gx: number; gy: number; cols: number;
  /** Side of one block and the space between blocks, in grid units. */
  size: number; gap?: number;
  /** One block each, in order. h is its height in pixels. */
  items: { h: number; hue?: Hue; hot?: boolean; state?: "open" | "closed" | "alert"; label?: string }[];
  /** The direction a row runs in. gx by default. */
  dir?: "gx" | "gy";
  title?: string; sub?: string; glyph?: string; at?: "s" | "n" | "e" | "w" | "sw" | "se"; z?: number;
}
/** A node of a tree or graph: a dot, a box or a diamond centred on a point. Join nodes with thin lines. */
export interface NodeEl extends ElBase {
  kind: "node"; x: number; y: number; shape?: "dot" | "box" | "diamond"; label?: string; sub?: string;
  /** Width of a box. Fitted to the text when left out. */
  w?: number; r?: number;
  hot?: boolean; mute?: boolean; tone?: Tone; hue?: Hue; mono?: boolean;
  /** Where a dot's label sits. */
  at?: Side;
}
/** A neural network on a card: columns of units with weighted connections. */
export interface LayersEl extends ElBase {
  kind: "layers"; x: number; y: number; w: number; h: number;
  /** Units per layer, input first. */
  sizes: number[];
  labels?: string[];
  /** Explicit [fromLayer, fromUnit, toLayer, toUnit] connections. Defaults to fully connected adjacent layers. */
  connections?: [number, number, number, number][];
  /** Units drawn lit, as [layer, unit]. Connections between lit units are lit too. */
  hot?: [number, number][];
  title?: string; sub?: string; below?: boolean; stand?: Pt;
}

export type El = ZoneEl | LineEl | StopEl | DbEl | BoxEl | TableEl | CodeEl | DocEl | WindowEl | ModelEl | PersonEl | ListEl | TreeEl | MatrixEl | MarksEl | LabelEl | ArrowEl | SheetsEl
  | PrismEl | DrumEl | SlabEl | TankEl | PillEl | PawnEl | PlotEl | SeriesEl | CellsEl | BlocksEl | NodeEl | LayersEl;

/** The record that rides a line in a step. Stops are named by id or given as a fraction of the line. */
export interface Ride {
  line: string;
  from: string | number;
  to: string | number;
  /** Stops where the record pauses on the way. */
  via?: (string | number)[];
  /** Text on the record, in the data face. */
  label: string;
  /** The record's text after it reaches its final stop. */
  then?: string;
  shape?: "pill" | "row" | "doc" | "dot" | "puck";
  tone?: Tone;
}

export type Block =
  | { p: string }
  | { callout: { label: string; text: string } }
  | { bars: { caption: string; scale: "log" | "linear"; min: number; max: number; rows: { label: string; claim: string }[] } }
  | { pair: { left: { label: string; items: string[] }; right: { label: string; items: string[] } } };

export interface Step {
  id: string;
  label: string;
  kind: StepKind;
  title: string;
  /** Visible text. Title, caption and any pair together stay within the word budget. */
  caption: string;
  /** Element ids or group names drawn in this step, in addition to the always-on elements. */
  show: string[];
  /** One value per guide counter, same order. */
  counters: string[];
  /** Records that ride in this step. */
  rides?: Ride[];
  /** Pair and bars blocks are shown with the step. Paragraphs and callouts are the step's detail, one action away. */
  body: Block[];
  /** Ledger claim ids that back this step. */
  claims: string[];
  /** Use cases only: the phase this stop belongs to. */
  phase?: Phase;
  /** Use cases only: keys of the curriculum concepts this stop puts to work. */
  concepts?: string[];
}

export interface Guide {
  id: string;
  /** A guide sits on a track. A use case crosses tracks and has the track "case". */
  track: TrackKey | "case";
  module: string;
  slug: string;
  title: string;
  summary: string;
  /** One or two sentences for transformation leads. */
  forLeads: string;
  status: "draft" | "published";
  minutes: number;
  counters: string[];
  /** iso turns the scene into a floor seen from above at an angle: a grid, flat stops, a raised rail and a puck for the record. */
  scene: { viewBox: [number, number]; label: string; els: El[]; note?: string; iso?: Iso };
  steps: Step[];
  /** A counterfactual the reader can switch on from step `from` onward: it shows the scene of step `step`. */
  whatIf?: { label: string; step: number; from: number };
  /** Where governance or security meets this concept, in one or two sentences, with the claims that back it. */
  governance: { text: string; claims: string[] };
  closing: { pitfalls: string[]; questions: string[] };
}

export interface Source {
  id: string; title: string; url: string;
  kind: "primary" | "secondary";
  vendor: boolean;
  note?: string;
}

export interface Claim {
  id: string;
  text: string;
  /** A durable mechanism, B current practice, C dated fact. */
  class: "A" | "B" | "C";
  sources: string[];
  /** ISO date of the last check against the sources. */
  verified: string;
  flags: string[];
  review: "pending" | "approved";
  /** Numeric value for dated blocks such as bar rows. */
  value?: number;
  display?: string;
}

export const defineGuide = (g: Guide): Guide => g;
