import { CANVAS, code, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";

// The floor: the route runs along gy = 0 from the sources (back left) to the modelled tables (front right).
// Boards stand behind the route, the warehouse is a raised plate, and Z is its height.
const G = isoGrid(110, 150, 30), Z = 10;
const on = (gx: number, gy = 0) => G.p(gx, gy, gx >= 8.2 ? Z : 0);
const stem = (id: string, a: [number, number], b: [number, number], group?: string) => line(id, [on(...a), on(...b)], { tone: "ink", w: 3, group, always: !group });
const AT = { tool: 3.4, mask: 6.8, raw: 9.3, tr: 15.9, mod: 22.2, end: 23.6 };
const raw = (masked: boolean) => [
  ["4468", "store", masked ? "•••" : "a.k@…", "no"],
  ["4469", "app", masked ? "•••" : "j.p@…", "no"],
  ["4470", "web", masked ? "•••" : "m.l@…", "no"],
  { cells: ["4471", "web", masked ? "•••" : "s.o@…", "yes"], hot: true },
];
const rawBoard = (id: string, masked: boolean) => raise(table(id, 0, 0, 196, ["order", "channel", "email", "ret"], raw(masked), { at: [10, 54, 108, 158], rowH: 26, title: "Raw tables", sub: "as delivered", group: id }), on(AT.raw, -2.2), 34);

export default defineGuide({
  id: "ingestion", track: "data", module: "Ingestion", slug: "ingestion",
  title: "Ingestion",
  summary: "The same three steps in a different order. Loading before transforming keeps the raw data and turns a pipeline change into a query.",
  forLeads: "ELT shortens the path from a new question to an answer. It moves cost onto warehouse compute and puts raw personal data in the warehouse unless it is masked first.",
  status: "draft", minutes: 7,
  counters: ["Transform runs in", "Raw data kept", "A new question needs", "Personal data lands"],
  whatIf: { label: "What if the transform ran first?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Records are illustrative",
    label: "Order 4471 rides one line from the sources into the warehouse. First an ETL tool transforms it on the way and drops its channel field. Then the load comes first: the order lands raw, and SQL inside the warehouse builds modelled tables from it.",
    els: [
      slab("wh", 8.2, -4.6, 15, 6.1, undefined, { always: true }),
      pill("wh-l", G.p(11.5, 5.6), "Warehouse or lakehouse", { tone: "track", glyph: "layers", anchor: "start", always: true }),
      line("main", [G.p(0, 0), G.p(8.2, 0), G.p(8.2, 0, Z), G.p(AT.end, 0, Z)], { always: true }),
      line("end", [on(AT.end, -0.55), on(AT.end, 0.55)], { tone: "ink", w: 7, always: true }),
      stop("p-src", ...G.p(0, 0), undefined, undefined, { big: true, always: true }),
      stop("p-2", ...on(AT.tool), undefined, undefined, { always: true }),
      stop("p-mask", ...on(AT.mask), undefined, undefined, { group: "mask" }),
      stop("p-raw", ...on(AT.raw), undefined, undefined, { group: "load" }),
      stop("p-tr", ...on(AT.tr), undefined, undefined, { always: true }),
      stop("p-mod", ...on(AT.mod), undefined, undefined, { always: true }),

      drum("src", -1.3, 0, 1.05, 44, { hue: "sky", glyph: "stack", title: "Sources", sub: "orders, payments", at: "n", always: true }),

      prism("etl", AT.tool - 0.7, -0.7, 1.4, 1.4, 30, { hue: "sand", glyph: "gear", title: "ETL tool", sub: "transform, then load", at: "sw", group: "classic" }),
      raise(table("clwh", 0, 0, 180, ["order", "amount", "ret"], [["4470", "129", "no"], { cells: ["4471", "899", "yes"], hot: true }], { at: [12, 66, 130], rowH: 26, title: "Modelled tables", foot: "no channel column", group: "classic" }), on(AT.tr, -2.2), 34),
      stem("st-clwh", [AT.tr, 0], [AT.tr, -2.2], "classic"),
      prism("bi", AT.mod - 0.6, -0.6, 1.2, 1.2, 28, { hue: "sand", glyph: "chart", title: "Dashboards", sub: "finance, operations", at: "n", z: Z, group: "classic" }),
      pawn("ask", 9.5, 10, "Finance", "Returns by sales channel?", { group: "ask" }),

      prism("el", AT.tool - 0.7, -0.7, 1.4, 1.4, 30, { hue: "mint", glyph: "chevrons", title: "Extract and load", sub: "no business logic", at: "sw", group: "load" }),
      prism("etl-x", 2.4, -4.4, 1.2, 1.2, 26, { title: "ETL tool", at: "w", state: "closed", group: "gone" }),
      rawBoard("raw", false),
      rawBoard("rawm", true),
      stem("st-raw", [AT.raw, 0], [AT.raw, -2.2], "load"),

      prism("tr", AT.tr - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "code", z: Z, group: "t" }),
      raise(code("sql", 0, 0, 196, ["select order_id,", "  channel, returned", "from raw.orders"], { title: "Transform", sub: "SQL, in place", group: "t" }), on(AT.tr, -2.2), 34),
      raise(table("mod", 0, 0, 176, ["order", "channel", "ret"], [["4470", "web", "no"], { cells: ["4471", "web", "yes"], hot: true }], { at: [12, 62, 128], rowH: 26, title: "Modelled tables", group: "t" }), on(AT.mod, -2.2), 34),
      stem("st-mod", [AT.mod, 0], [AT.mod, -2.2], "t"),

      raise(table("m2", 0, 0, 150, ["channel", "returns"], [{ cells: ["web", "1"], hot: true }, ["store", "0"], ["app", "0"]], { at: [12, 82], title: "returns_by_channel", mono: true, group: "new" }), on(20.3, -4.1), 120),
      stem("st-m2", [AT.mod, -2.2], [AT.mod, -4.1], "new"),
      stem("st-m2b", [AT.mod, -4.1], [20.3, -4.1], "new"),

      prism("mask", AT.mask - 0.6, -0.6, 1.2, 1.2, 26, { hue: "track", glyph: "shield", title: "Mask first", sub: "personal data", at: "sw", group: "mask" }),
    ],
  },
  steps: [
    step({
      id: "ask", label: "Question", kind: "problem", title: "The ETL tool dropped the channel field",
      caption: "Finance asks for returns by sales channel. The ETL tool dropped the channel field before the data reached the warehouse, so answering means changing the pipeline and reloading history.",
      show: ["classic", "ask"], counters: ["an ETL tool", "no", "a pipeline change", "already shaped"],
      rides: [ride("main", "p-src", "p-tr", "4471 web 899", { via: ["p-2"], then: "4471 899" })],
      body: ["Finance at Vinterhus asks for returns by sales channel. The ETL tool dropped the channel field two years ago, before the data reached the warehouse.",
        "Answering means changing the pipeline and reloading history."],
      claims: ["etl-elt-definition"],
    }),
    step({
      id: "reorder", label: "Reorder", kind: "idea", title: "Load first, transform later",
      caption: "ELT moves one letter. The load tool copies source data into raw tables and applies no business logic, so the raw data is in the warehouse before anyone decides what it means.",
      show: ["load", "raw", "gone"], counters: ["nothing yet", "yes", "a pipeline change", "raw"],
      rides: [ride("main", "p-src", "p-raw", "4471 web 899", { via: ["p-2"] })],
      body: ["ELT moves one letter. The load tool copies source data into raw tables and applies no business logic.",
        { callout: { label: "Key idea", text: "The raw data is in the warehouse before anyone decides what it means." } }],
      claims: ["etl-elt-definition", "elt-raw-retained"],
    }),
    step({
      id: "in-place", label: "In place", kind: "mechanism", title: "The transform runs in the warehouse",
      caption: "Transformation becomes SQL that reads the raw tables and builds modelled tables beside them, on the warehouse's own compute. The ETL tool is gone.",
      show: ["load", "raw", "gone", "t"], counters: ["the warehouse", "yes", "a pipeline change", "raw"],
      rides: [ride("main", "p-raw", "p-mod", "4471 web", { via: ["p-tr"] })],
      body: ["Transformation becomes SQL that reads the raw tables and builds modelled tables beside them, on the warehouse's own compute.",
        { callout: { label: "What changed", text: "The ETL tool is gone. Its logic is now queries inside the warehouse." } }],
      claims: ["etl-elt-definition", "dbt-runs-in-warehouse"],
    }),
    step({
      id: "new-model", label: "New model", kind: "mechanism", title: "A new question is a new model",
      caption: "The channel field is still in the raw tables. Returns by channel is one more model built from them, with no reload.",
      show: ["load", "raw", "gone", "t", "new", "ask"], counters: ["the warehouse", "yes", "a new model", "raw"],
      rides: [ride("main", "p-raw", "p-mod", "4471 web", { via: ["p-tr"], then: "web 1" })],
      body: ["The channel field is still in the raw tables. Returns by channel is one more model built from them, with no reload."],
      claims: ["elt-flexible"],
    }),
    step({
      id: "raw", label: "Personal data", kind: "watch-out", title: "Raw tables hold personal data",
      caption: "Raw tables hold whatever the source held. Where sensitive fields may not reach storage unmasked, a transform before the load remains the right tool. The transform bill moves too.",
      show: ["load", "rawm", "gone", "t", "new", "mask"], counters: ["the warehouse", "yes", "a new model", "masked before load"],
      rides: [ride("main", "p-src", "p-raw", "4471 s.o@…", { via: ["p-mask"], then: "4471 •••" })],
      body: ["Raw tables hold whatever the source held. Where sensitive fields may not reach storage unmasked, a transform before the load remains the right tool, and many organisations run both patterns.",
        "The transform bill also moves. In dbt Labs' 2026 survey, 57% of respondents reported higher warehouse and compute spend."],
      claims: ["etl-before-load", "elt-cost-shift", "survey-warehouse-spend"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "When to use ELT",
      caption: "",
      show: ["load", "rawm", "gone", "t", "new", "mask"], counters: ["the warehouse", "yes", "a new model", "masked before load"],
      rides: [ride("main", "p-src", "p-mod", "4471 •••", { via: ["p-mask", "p-raw", "p-tr"] })],
      body: [{ pair: {
        left: { label: "ELT", items: ["Questions change faster than pipelines", "Raw history has value", "Warehouse compute scales with the work"] },
        right: { label: "Transform first", items: ["Fields must be masked before storage", "Warehouse spend is the binding constraint"] },
      } },
        "Transformation is where the time goes. In the 2026 State of Data Engineering Survey, 55.4% of respondents named modelling and transformation as a top time sink."],
      claims: ["etl-before-load", "elt-cost-shift", "survey-time-sinks"],
    }),
  ],
  governance: { text: "Where sensitive data must be masked or cleansed before it reaches storage, the transform runs before the load. Many organisations run both patterns.", claims: ["etl-before-load"] },
  closing: {
    pitfalls: [
      "Loading raw personal data and planning to mask it later.",
      "Treating ELT as free because the ETL tool is gone.",
      "Rebuilding every model on every run when only new rows changed.",
    ],
    questions: [
      "What does keeping the raw tables make possible that an ETL tool prevents?",
      "Where does the cost of transformation move in ELT, and who owns that bill?",
      "Which fields in your sources may not land unmasked?",
    ],
  },
});
