import { blocks, CANVAS, defineGuide, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: each layer is a grid of blocks, one row per record and one block per field, one colour per field.
// Bronze holds every row as it arrived, with a duplicate, an unreadable amount and the email. Silver holds fewer rows and fewer fields.
// The intermediate layer adds the item count. The gold mart has one row per channel, and its revenue blocks rise with the sum.
// The rail in front carries one order from Checkout past every layer to Finance. Two cards show a layer's rows and the contracts so far.
const G = isoGrid(362, 66, 28);
const SIZE = 0.9, GAP = 0.1, H = 18, FRONT = 6, RAIL = 9;
const X = { bronze: 0, silver: 6, int: 11, gold: 17 };
const HUE: Record<string, Hue> = { order: "sand", channel: "mint", email: "rose", amount: "sky", items: "violet" };
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
/** One layer: rows of records, front edge on the same line. bad marks one block as an error, as [row, field]. */
const layer = (id: string, gx: number, fields: string[], rows: number, group: string, o: { bad?: [number, number]; heights?: number[][] } = {}): El =>
  blocks(id, gx, FRONT - rows, fields.length, SIZE, Array.from({ length: rows }, (_, r) => fields.map((f, c) =>
    ({ h: o.heights?.[r]?.[c] ?? H, hue: HUE[f], state: o.bad && o.bad[0] === r && o.bad[1] === c ? "alert" as const : undefined }))).flat(), { gap: GAP, group });
const name = (id: string, gx: number, w: number, rows: number, lift: number, text: string, group: string, glyph?: string): El =>
  pill(id, up(gx + w / 2 + 0.5, FRONT - rows - 0.5, lift), text, { glyph, group });
const ROWS: Pt = [806, 232], CONTRACT: Pt = [172, 522];
const rowsCard = (id: string, title: string, sub: string, cols: string[], hues: Hue[], rows: string[][], at: number[]): El =>
  raise(table(id, 0, 0, 268, cols, rows, { at, columnHues: hues, rowH: 24, title, sub, mono: true, group: id }), ROWS, 30);
const CONTRACTS = [["Bronze", "as it arrived", "data team"], ["Silver", "validated", "data team"], ["Intermediate", "joined", "data team"], ["Gold mart", "summed", "Finance"]];
const contract = (n: number, hot = true): El =>
  raise(table(hot ? `c${n}` : "c-all", 0, 0, 322, ["layer", "quality", "audience"], CONTRACTS.slice(0, n).map((cells, k) => ({ cells, hot: hot && k === n - 1 })), { at: [12, 118, 234], rowH: 24, title: "Layer contracts", sub: "quality and audience", group: hot ? `c${n}` : "c-all" }), CONTRACT, 28);
const NAMES: [string, number, number, number, number, string][] = [
  ["bronze", X.bronze, 4, 6, 64, "Bronze"], ["silver", X.silver, 3, 4, 60, "Silver"], ["int", X.int, 4, 4, 74, "Intermediate"], ["gold", X.gold, 3, 3, 78, "Gold mart"],
];

export default defineGuide({
  id: "data-layers", track: "data", module: "Transformation", slug: "data-layers",
  title: "Data layers",
  summary: "Raw, cleaned and modelled layers give each dataset a quality contract and an intended audience.",
  forLeads: "Each layer has a purpose, quality expectation and audience. Restrict raw records to the people and processes that need them, then expose curated outputs to their intended users.",
  status: "draft", minutes: 6,
  counters: ["Layer", "Rows", "Fields", "Audience"],
  whatIf: { label: "What if Finance read the raw orders?", step: 0, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, values and audiences are illustrative",
    label: "Orders are drawn as blocks on the floor, one row per record and one block per field. The raw table has six rows and four fields, with a duplicate of order 4471, one unreadable amount and the customer email. It becomes the bronze layer. Silver holds four valid rows and three fields, without the email. The intermediate layer adds an item count to each order. The gold mart has one row per channel, with revenue blocks of different heights. A rail carries order 4471 from Checkout past each layer to Finance. One card shows sample rows of the current layer and another lists each layer's quality and audience. At the last stop each layer carries its access rule.",
    els: [
      line("rail", [G.p(-1.5, RAIL), G.p(20.4, RAIL)], { always: true }),
      stop("s-co", ...G.p(-1.3, RAIL), undefined, undefined, { always: true }),
      stop("s-bronze", ...G.p(X.bronze + 1.5, RAIL), undefined, undefined, { always: true }),
      stop("s-silver", ...G.p(X.silver + 1.5, RAIL), undefined, undefined, { always: true }),
      stop("s-int", ...G.p(X.int + 1.5, RAIL), undefined, undefined, { always: true }),
      stop("s-gold", ...G.p(X.gold + 0.5, RAIL), undefined, undefined, { always: true }),
      stop("s-fin", ...G.p(18.8, RAIL), undefined, undefined, { always: true }),
      prism("co", -3, RAIL - 0.7, 1.4, 1.4, 30, { hue: "track", glyph: "pen", title: "Checkout", sub: "writes orders", at: "n", always: true }),
      prism("fin-raw", 21.2, RAIL - 0.7, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "reads raw orders", at: "e", group: "direct" }),
      prism("fin", 21.2, RAIL - 0.7, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "revenue by channel", at: "e", group: "layered" }),
      prism("sup", 6.4, RAIL + 1.6, 1.4, 1.4, 30, { glyph: "wrench", title: "Support", sub: "reads raw orders", at: "s", group: "direct" }),

      // the layers
      layer("b-raw", X.bronze, ["order", "channel", "email", "amount"], 6, "raw", { bad: [1, 3] }),
      layer("b-silver", X.silver, ["order", "channel", "amount"], 4, "silver"),
      layer("b-int", X.int, ["order", "channel", "items", "amount"], 4, "int"),
      layer("b-gold", X.gold, ["channel", "order", "amount"], 3, "gold", { heights: [[18, 12, 6], [18, 20, 42], [18, 12, 40]] }),
      name("n-raw", X.bronze, 4, 6, 64, "Raw orders", "direct"),
      ...NAMES.map(([id, gx, w, rows, lift, text]) => name(`n-${id}`, gx, w, rows, lift, text, `n-${id}`)),
      ...NAMES.map(([id, gx, w, rows, lift, text]) => name(`g-${id}`, gx, w, rows, lift, text, "gov", id === "gold" ? "key" : "lock")),

      // sample rows of the current layer
      rowsCard("rows-raw", "Raw orders", "6 rows, 4 fields", ["order", "channel", "email", "amount"], ["sand", "mint", "rose", "sky"], [["4469", "store", "j.p@…", "n/a"], ["4471", "web", "s.o@…", "1290"], ["4471", "web", "s.o@…", "1290"]], [12, 72, 142, 208]),
      rowsCard("rows-silver", "Silver orders", "4 rows, 3 fields", ["order", "channel", "amount"], ["sand", "mint", "sky"], [["4470", "web", "899"], ["4471", "web", "1290"], ["4473", "app", "2100"]], [12, 100, 190]),
      rowsCard("rows-int", "Orders with items", "4 rows, 4 fields", ["order", "channel", "items", "amount"], ["sand", "mint", "violet", "sky"], [["4470", "web", "1", "899"], ["4471", "web", "2", "1290"], ["4473", "app", "3", "2100"]], [12, 72, 142, 208]),
      rowsCard("rows-gold", "Revenue by channel", "3 rows, 3 fields", ["channel", "orders", "revenue"], ["mint", "sand", "sky"], [["store", "1", "129"], ["web", "2", "2189"], ["app", "1", "2100"]], [12, 100, 190]),

      // the contracts, one more row at each layer
      contract(1), contract(2), contract(3), contract(4), contract(4, false),
    ],
  },
  steps: [
    step({
      id: "unlayered", label: "Raw use", kind: "problem", title: "Every consumer reads the raw orders",
      caption: "Finance and Support both read the table Checkout writes. It holds order 4471 twice, one unreadable amount and every customer email.",
      show: ["raw", "direct", "rows-raw"], counters: ["none", "6, one repeated", "4, with email", "anyone"],
      rides: [ride("rail", "s-co", "s-fin", "4471 twice")],
      body: ["The table has six rows and four fields. The values are illustrative. Without a boundary between source records and purpose-built outputs, each reader repeats the same repairs and receives fields it does not need.",
        "A boundary can be enforced. Unity Catalog access control includes privileges and ownership on securable objects, and table-level filtering and masking."],
      claims: ["data-layers-access"],
    }),
    step({
      id: "bronze", label: "Bronze", kind: "idea", title: "Keep a raw layer for reprocessing",
      caption: "The bronze layer preserves the source rows with minimal transformation, faults included. Later layers can be rebuilt from it when requirements change.",
      show: ["raw", "n-bronze", "layered", "rows-raw", "c1"], counters: ["bronze", "6, one repeated", "4, with email", "data team"],
      rides: [ride("rail", "s-co", "s-bronze", "4471 web 1290")],
      body: ["Databricks describes bronze tables as preserving raw source data with minimal transformation, so silver or gold layers can reprocess the bronze source if requirements change. This is Databricks' medallion architecture guidance.",
        { callout: { label: "Key idea", text: "Each layer has a contract: what quality it promises and who it is for. The bronze contract promises only that nothing was changed." } }],
      claims: ["data-layers-bronze"],
    }),
    step({
      id: "silver", label: "Silver", kind: "mechanism", title: "Clean and validate records",
      caption: "Silver filters, cleans and parses row by row. Here the repeat of 4471 and the unreadable amount stay behind in bronze, and so does the email.",
      show: ["raw", "n-bronze", "silver", "n-silver", "layered", "rows-silver", "c2"], counters: ["silver", "4", "3", "data team"],
      rides: [ride("rail", "s-bronze", "s-silver", "4471 twice", { then: "4471 once" })],
      body: ["Databricks describes silver-layer transformations as incremental row-level filtering, cleaning and parsing. In this illustrative flow, four of the six bronze rows are valid, and the email is not needed in the analytical order model."],
      claims: ["data-layers-silver"],
    }),
    step({
      id: "intermediate", label: "Intermediate", kind: "mechanism", title: "Prepare reusable models before outputs",
      caption: "dbt names its layers staging, intermediate and marts. A staging model keeps the shape of its source. This intermediate model joins each order to its items, ready for a mart.",
      show: ["raw", "n-bronze", "silver", "n-silver", "int", "n-int", "layered", "rows-int", "c3"], counters: ["intermediate", "4", "4, with items", "data team"],
      rides: [ride("rail", "s-silver", "s-int", "4471", { then: "4471, 2 items" })],
      body: ["dbt's project guidance separates staging models from intermediate models and marts. It describes staging as the entry layer for source-conformed models, generally one to one with source tables, with transformations such as renaming and type casting.",
        "It describes intermediate models as preparing staging models for marts, with patterns such as grouping, pivoting and isolating complex logic."],
      claims: ["data-layers-dbt-staging", "data-layers-dbt-intermediate"],
    }),
    step({
      id: "gold", label: "Gold", kind: "watch-out", title: "A mart is shaped for its audience",
      caption: "The gold mart holds one row per channel with revenue already summed. It is an output for Finance, not another copy of the orders.",
      show: ["raw", "n-bronze", "silver", "n-silver", "int", "n-int", "gold", "n-gold", "layered", "rows-gold", "c4"], counters: ["gold mart", "3, one per channel", "3", "Finance"],
      rides: [ride("rail", "s-int", "s-gold", "4471, 1290", { then: "web 2189" })],
      body: ["Databricks describes gold tables as precomputed aggregations, metrics and summaries for dashboards, reporting tools and downstream consumers. dbt describes marts as the layer expressly intended for end users. These are vendor-stated patterns, not a required universal naming scheme."],
      claims: ["data-layers-gold", "data-layers-dbt-marts"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Set a contract and audience per layer",
      caption: "",
      show: ["raw", "silver", "int", "gold", "gov", "layered", "rows-gold", "c-all"], counters: ["four, each with a contract", "3, one per channel", "3", "Finance, by grant"],
      rides: [ride("rail", "s-gold", "s-fin", "web 2189")],
      body: [{ pair: {
        left: { label: "Define", items: ["What each layer guarantees", "Which audience may use it"] },
        right: { label: "Enforce", items: ["Restrict raw and intermediate data", "Grant access to curated outputs"] },
      } }, "Unity Catalog supports grants on securable objects and table-level filtering and masking. dbt recommends keeping intermediate models out of the main production schema or using a schema with special permissions."],
      claims: ["data-layers-access", "data-layers-dbt-intermediate"],
    }),
  ],
  governance: { text: "Raw and intermediate layers can contain fields or models that are not for broad use. Define access by audience: Unity Catalog grants privileges on securable objects and supports row and column filtering, while dbt advises keeping intermediate models outside the main production schema or in a specially permissioned schema.", claims: ["data-layers-access", "data-layers-dbt-intermediate"] },
  closing: {
    pitfalls: [
      "Treating bronze, silver and gold as a mandatory architecture rather than one named pattern.",
      "Publishing intermediate models to general users when they are only preparation for a mart.",
      "Assuming a layer name enforces a quality contract or access policy by itself.",
    ],
    questions: [
      "What source data must remain available for reprocessing?",
      "Which checks define a valid silver record?",
      "Who should be able to read the curated output, and who should not read the raw layer?",
    ],
  },
});
