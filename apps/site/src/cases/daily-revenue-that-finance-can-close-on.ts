import { CANVAS, blocks, code, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, slab, step, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: an order leaves the order database on the left and travels the main rail to Finance on the right.
// Behind the rail lies the lakehouse, a plate carrying three layers of column chunks: raw, clean, and the fact table with its dimensions.
// Store files join from the front. A scheduler stands behind the lakehouse, a test gate and the revenue metric sit on the rail before Finance.
// The board at the back shows the nightly run, the board at the front shows the data at the stop in hand.
const G = isoGrid(100, 120, 30);
const TOP: Pt = [812, 232];    // the run board, behind the lakehouse
const LEFT: Pt = [190, 522];   // the data board, in front of the rail
const Z = 10;                  // the lakehouse plate's height

// One colour per column, the same in every layer.
const C: Record<string, Hue> = { order: "paper", date: "violet", channel: "sky", product: "sand", amount: "mint" };
const chunk = (cols: string[], rows: number, h: number | number[], o: { bad?: number; hot?: string; plain?: boolean } = {}) =>
  Array.from({ length: rows }, (_, r) => cols.map((c, k) => ({
    h: Array.isArray(h) ? h[k] : h, hue: o.plain ? "paper" as const : C[c],
    hot: o.hot === c ? true : undefined, state: o.bad === r * cols.length + k ? "alert" as const : undefined,
  }))).flat();
const B = { gap: 0.15, z: Z };
const RAWN: Pt = [455, 52], CLEANN: Pt = [625, 130];
const RAWO = ["order", "date", "channel", "amount"], RAWS = ["amount", "channel", "order", "date"], FACT = ["date", "channel", "product", "amount"];

const run = (id: string, title: string, items: Parameters<typeof list>[4]): El =>
  raise(list(id, 0, 0, 216, items, { title, numbered: true, group: id }), TOP, 28);
const data = <T extends Parameters<typeof raise>[0]>(el: T): T => raise(el, LEFT, 20);

export default defineGuide({
  id: "case-daily-revenue-that-finance-can-close-on", track: "case", module: "Use cases", slug: "daily-revenue-that-finance-can-close-on",
  title: "Daily revenue that Finance can close on",
  summary: "A revenue pipeline is assembled part by part: change capture, a raw landing in columnar files, SQL models in layers, facts and dimensions, one metric and a test gate. Then an order, a late return and a bad file run through it.",
  forLeads: "The figure Finance closes on is a product with an owner, a definition and a gate. The storage and the tools matter less than who defines revenue and what stops a wrong number from being published.",
  status: "draft", minutes: 12,
  counters: ["Figures per day", "Reports read", "Load on checkout", "Publish"],
  whatIf: { label: "What if each report kept its own rule?", step: 0, from: 6 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts, dates and table names are illustrative",
    label: "Orders leave the order database on a rail that runs to Finance. Later stops add change capture, a lakehouse plate holding a raw, a clean and a modelled layer of column chunks, store files that join from the front, a scheduler, a test gate and a revenue metric. One board lists the steps of the nightly run and another shows the data at each stop.",
    els: [
      pawn("fin", 25.4, -1.6, "Finance", undefined, { always: true }),
      prism("stores", 7.2, 4.6, 1.2, 1.2, 20, { hue: "sand", glyph: "file", title: "Stores", sub: "nightly files", at: "w", always: true }),

      // Problem: every report computes its own figure, straight from the systems.
      drum("odb", 0.5, 0, 1, 30, { hue: "sky", glyph: "table", title: "Orders", sub: "order database", at: "n", group: "odb" }),
      drum("odb-hot", 0.5, 0, 1, 30, { hue: "sky", glyph: "table", title: "Orders", sub: "order database", at: "n", state: "alert", group: "scan" }),
      line("old", [G.p(1.5, 0), G.p(20.8, 0)], { tone: "muted", w: 3, group: "old" }),
      line("so", [G.p(7.8, 4.6), G.p(7.8, 0.4)], { tone: "muted", w: 3, group: "old" }),
      prism("sheet", 20.8, -0.6, 1.2, 1.2, 18, { hue: "paper", glyph: "table", title: "Spreadsheet", sub: "reconciled by hand", at: "n", group: "old" }),
      raise(table("figs", 0, 0, 250, ["report", "revenue", "rule"], [["web", "81,460", "gross"], ["app", "79,912", "less returns"], ["store", "80,730", "with tax"]], { at: [12, 76, 150], title: "Revenue, 3 March", mono: true, group: "figs" }), TOP, 28),
      blocks("wait", 2.4, -3.6, 8, 0.55, Array.from({ length: 8 }, () => ({ h: 7, hue: "paper" as const })), { gap: 0.25, title: "Checkouts", sub: "waiting", at: "n", group: "scan" }),
      data(code("q", 0, 0, 230, ["select sum(amount)", "from orders", "where day = '03-03'"], { title: "Report query", sub: "reads every order row", keywords: ["select", "from", "where"], group: "scan" })),

      // Architecture: capture and landing.
      line("m1", [G.p(1.5, 0), G.p(10, 0)], { group: "cap" }),
      prism("cdc", 3.5, -0.6, 1.2, 1.2, 22, { hue: "violet", glyph: "lines", title: "Change capture", sub: "reads the log", at: "n", group: "cap" }),
      line("st", [G.p(7.8, 4.6), G.p(7.8, 0.4)], { group: "cap" }),
      slab("land", 5.8, -6.1, 11.2, 3.7, undefined, { group: "land" }),
      blocks("raw0-o", 6.2, -5.4, 4, 0.6, chunk(RAWO, 2, 16, { plain: true }), { ...B, group: "raw0" }),
      pill("n-land", RAWN, "Landing", { sub: "a copy for analysis", group: "raw0" }),
      blocks("raw0-s", 6.2, -3.5, 4, 0.6, chunk(RAWS, 1, [10, 16, 12, 16], { plain: true }), { ...B, group: "raw0" }),
      data(table("events", 0, 0, 230, ["op", "order", "amount"], [{ cells: ["insert", "4471", "49.00"], hot: true }, ["update", "4469", "212.00"], ["delete", "4470", ""]], { at: [12, 92, 160], title: "Change events", sub: "in commit order", mono: true, group: "events" })),

      slab("lake", 5.8, -6.1, 11.2, 3.7, "Lakehouse", { group: "lake" }),
      blocks("raw-o", 6.2, -5.4, 4, 0.6, chunk(RAWO, 2, 16), { ...B, group: "raw" }),
      pill("n-raw", RAWN, "Raw", { sub: "as it arrived", group: "raw" }),
      blocks("raw-s", 6.2, -3.5, 4, 0.6, chunk(RAWS, 1, [10, 16, 12, 16]), { ...B, group: "raw-s" }),
      blocks("raw-s-bad", 6.2, -3.5, 4, 0.6, chunk(RAWS, 1, [10, 16, 12, 16], { bad: 2 }), { ...B, group: "raw-bad" }),
      data(table("rawt", 0, 0, 290, ["order", "date", "channel", "amount"], [["4471", "03-03", "web", "49.00"], ["4472", "03-03", "app", "18.50"], ["4471", "03-03", "web", "49.00"]], { at: [12, 78, 152, 224], columnHues: [C.order, C.date, C.channel, C.amount], title: "raw_orders", sub: "one chunk per column", mono: true, group: "rawt" })),

      // Architecture: models and the schedule.
      line("m2", [G.p(10, 0), G.p(13, 0)], { group: "tr" }),
      blocks("clean", 9.9, -5, 4, 0.6, chunk(RAWO, 3, 14), { ...B, group: "tr" }),
      pill("n-clean", CLEANN, "Clean", { sub: "conformed", group: "tr" }),
      prism("sched", 2.2, -6.6, 1.2, 1.2, 22, { hue: "sand", glyph: "clock", title: "Scheduler", at: "w", group: "tr" }),
      line("go", [G.p(3.4, -6), G.p(5.8, -6)], { w: 3, group: "tr" }),
      data(code("sql", 0, 0, 250, ["select o.order_id, o.channel,", "  o.amount - r.refund as net", "from raw_orders o", "left join raw_returns r", "  using (order_id)"], { title: "stg_sales.sql", keywords: ["select", "from", "left join", "using", "as"], group: "sql" })),
      run("run2", "Nightly run, 02:00", ["load raw", { t: "build clean", hot: true }]),

      line("m3", [G.p(13, 0), G.p(16.4, 0)], { group: "star" }),
      blocks("fact", 13.6, -4.25, 4, 0.6, chunk(FACT, 2, 12), { ...B, title: "Fact and dimensions", sub: "one row per order line", at: "e", group: "fact" }),
      blocks("fact-hot", 13.6, -4.25, 4, 0.6, chunk(FACT, 2, 12, { hot: "amount" }), { ...B, title: "Fact and dimensions", sub: "one row per order line", at: "e", group: "fact-hot" }),
      blocks("dims", 13.6, -5.4, 3, 0.6, [{ h: 18, hue: C.date }, { h: 18, hue: C.channel }, { h: 18, hue: C.product }], { ...B, group: "star" }),
      data(table("factt", 0, 0, 352, ["date", "channel", "product", "net"], [{ cells: ["03-03", "web", "LAMP-0312", "49.00"], hot: true }, ["03-03", "store", "SOFA-2210", "640.00"]], { at: [12, 84, 158, 294], columnHues: [C.date, C.channel, C.product, C.amount], title: "fact_sales", sub: "keys to three dimensions", mono: true, group: "factt" })),
      run("run3", "Nightly run, 02:00", ["load raw", "build clean", { t: "build model", hot: true }]),

      // Architecture: the metric and the gate.
      line("m4", [G.p(16.4, 0), G.p(24.5, 0)], { group: "pub" }),
      prism("gate", 18.2, -0.6, 1.2, 1.2, 14, { hue: "track", glyph: "shield", title: "Tests", sub: "gate the publish", at: "sw", group: "pub" }),
      prism("metric", 20.8, -0.6, 1.2, 1.2, 16, { hue: "track", glyph: "scale", title: "Revenue", sub: "one metric", at: "n", group: "pub" }),
      data(list("def", 0, 0, 230, ["sum of net, tax excluded", "returns subtracted", { t: "owner: Finance", hot: true }, "read by every report"], { title: "Metric: revenue", group: "def" })),
      run("run5", "Nightly run, 02:00", ["load raw", "build clean", "build model", { t: "test", hot: true }, { t: "publish", hot: true }]),

      // Execution.
      run("run-ok", "Run of 4 March", ["load raw", "build clean", "build model", { t: "test: passed", hot: true }, { t: "publish: 80,730", hot: true }]),
      data(table("rep", 0, 0, 230, ["day", "revenue"], [["2 March", "77,318"], { cells: ["3 March", "80,730"], hot: true }], { at: [12, 130], title: "Finance report", mono: true, group: "rep" })),
      run("run-back", "Backfill of 3 March", ["load the late file", "rebuild 3 March", { t: "test: passed", hot: true }, { t: "publish: 80,610", hot: true }]),
      data(table("ver", 0, 0, 230, ["table version", "revenue"], [["4 March", "80,730"], { cells: ["7 March", "80,610"], hot: true }], { at: [12, 150], title: "Revenue, 3 March", mono: true, group: "ver" })),
      run("run-fail", "Run of 10 March", ["load raw", "build clean", "build model", { t: "test: failed", hot: true, tone: "alert" }, { t: "publish: skipped", mute: true }]),
      line("lin", [G.p(16.4, 1.6), G.p(7.8, 1.6)], { tone: "alert", w: 3, group: "lin" }),
      data(list("up", 0, 0, 230, ["fact_sales", "stg_sales", { t: "store file, 9 March", hot: true, tone: "alert" }], { title: "Upstream of revenue", sub: "from lineage", group: "lin" })),
    ],
  },
  steps: [
    step({
      id: "figures", label: "Three figures", kind: "problem", phase: "problem", title: "Three systems report three figures for one day",
      caption: "Web, app and store reports each apply their own rule for returns and tax. Finance reconciles them by hand, and the month closes late.",
      show: ["odb", "old", "figs"], counters: ["3, all different", "each system", "report queries", "by hand"],
      rides: [ride("old", 0, 0.8, "web 81,460"), ride("old", 0, 0.55, "app 79,912"), ride("so", 0, 0.6, "store 80,730")],
      body: ["Each figure is correct by its own rule. No rule is the organisation's, because nobody has been made accountable for defining revenue.",
        "In a data ownership model, a data owner works with the business to define centralised data definitions for a subject area."],
      claims: ["data-modelling-owner"],
    }),
    step({
      id: "scan", label: "Report load", kind: "problem", phase: "problem", title: "Report queries compete with checkout",
      caption: "Each report sums millions of order rows inside the order database. The scan is slow and can block the transactions that record orders.",
      show: ["scan", "old"], counters: ["3, all different", "the order database", "scans block orders", "by hand"],
      rides: [ride("old", 0.8, 0.27, "sum(amount)", { tone: "alert", then: "slow scan" })],
      concepts: ["operational-and-analytical-workloads"],
      body: ["A transactional system is built for many small writes that must not wait. Aggregates over millions of transactions are resource-intensive for it and can slow it down by blocking other transactions.",
        "Analytical queries are long-running and process significant portions of the stored data.",
        { callout: { label: "The gap", text: "Revenue needs one definition, computed away from the system that takes the orders." } }],
      claims: ["operational-and-analytical-workloads-contention", "operational-and-analytical-workloads-oltp", "operational-and-analytical-workloads-analytical"],
    }),
    step({
      id: "capture", label: "Capture", kind: "mechanism", phase: "architecture", title: "Changes are captured from the database log",
      caption: "Capture reads committed inserts, updates and deletes from the transaction log. Store files load as they arrive. Analysis runs on the copy, away from checkout.",
      show: ["odb", "cap", "land", "raw0", "events"], counters: ["3, all different", "a landed copy", "one log reader", "by hand"],
      rides: [ride("m1", 0, 0.92, "insert 4471", { via: [0.12] }), ride("st", 0, 0.6, "sales file")],
      concepts: ["change-data-capture", "ingestion", "operational-and-analytical-workloads"],
      body: ["The Debezium PostgreSQL connector captures committed row-level inserts, updates and deletes from the transaction log. Debezium states that log-based capture avoids the CPU cost of frequent polling and can capture deletes.",
        "The data is loaded first and transformed afterwards, inside the analytical store. Operational data is copied into the analytical system, which refreshes at a slower interval than the system that takes orders.",
        "The capture connector runs as a dedicated replication user with specific privileges, not as a superuser."],
      claims: ["change-data-capture-operations", "change-data-capture-polling", "change-data-capture-privileges", "etl-elt-definition", "operational-and-analytical-workloads-copy", "operational-and-analytical-workloads-refresh"],
    }),
    step({
      id: "land", label: "Raw layer", kind: "mechanism", phase: "architecture", title: "Raw data lands unchanged in columnar files",
      caption: "The lakehouse keeps columnar files in object storage under a transactional table layer. The raw layer preserves each source, so later layers can be rebuilt.",
      show: ["odb", "cap", "lake", "raw", "raw-s", "rawt"], counters: ["3, all different", "the raw layer", "one log reader", "by hand"],
      rides: [ride("m1", 0.5, 0.92, "4471 49.00", { then: "landed" }), ride("st", 0, 0.6, "sales file")],
      concepts: ["warehouses-lakes-and-lakehouses", "columnar-storage", "data-layers"],
      body: ["A lakehouse stores data in an object store in a standard file format such as Apache Parquet and adds a transactional metadata layer with ACID transactions and versioning.",
        "Parquet is column-oriented. A column-oriented store reads only the columns a query requires, so a sum of revenue reads the amount column and leaves the others on disk.",
        "Raw tables preserve the source with minimal transformation, so that later layers can be reprocessed from them if requirements change. The duplicate of order 4471 stays in the raw layer."],
      claims: ["warehouses-lakes-and-lakehouses-lakehouse", "columnar-storage-definition", "operational-and-analytical-workloads-layout", "data-layers-bronze", "elt-raw-retained"],
    }),
    step({
      id: "models", label: "Models", kind: "mechanism", phase: "architecture", title: "A schedule runs SQL models in order",
      caption: "Each model is a select statement under version control. Staging models rename, cast and join the raw tables. The orchestrator runs them nightly, upstream first.",
      show: ["odb", "cap", "lake", "raw", "raw-s", "tr", "sql", "run2"], counters: ["3, all different", "the clean layer", "one log reader", "nightly, unchecked"],
      rides: [ride("m2", 0, 0.87, "4471 net 49")],
      concepts: ["transformation", "the-relational-model-and-sql", "orchestration", "data-layers"],
      body: ["A dbt SQL model is a select statement, and dbt wraps it in the statements that build the table. References between models form a dependency graph that fixes the order of the run.",
        "A join pairs rows of one table with rows of another on a stated expression. Here each order is paired with its returns, and the net amount is computed once.",
        "Airflow arranges tasks in a graph, and by default a task runs when its upstream tasks have succeeded. dbt's guidance keeps every project in version control, with changes reviewed before they reach production."],
      claims: ["dbt-model-select", "dbt-ref-graph", "transformation-version-control", "data-layers-dbt-staging", "data-layers-silver", "the-relational-model-and-sql-join", "orchestration-tasks"],
    }),
    step({
      id: "star", label: "Facts", kind: "mechanism", phase: "architecture", title: "Facts and dimensions fix the grain",
      caption: "The fact table holds one row per order line. Keys link each row to date, channel and product dimensions, which filter and group every sum.",
      show: ["odb", "cap", "lake", "raw", "raw-s", "tr", "star", "fact", "factt", "run3"], counters: ["3, all different", "facts and dimensions", "one log reader", "nightly, unchecked"],
      rides: [ride("m3", 0, 0.8, "1 order line")],
      concepts: ["data-modelling", "dimensional-modelling"],
      body: ["The grain states exactly what one fact row represents, and it is declared before any dimension or fact is chosen. Facts are numeric measurements of a business event.",
        "In a star schema the fact table is linked to its dimension tables through primary and foreign key relationships. Dimensions filter and group, and the fact table is summed.",
        "A foreign key requires each value to match a row of the other table, so a sale cannot point at a product that does not exist."],
      claims: ["dimensional-modelling-grain", "dimensional-modelling-facts", "dimensional-modelling-star", "dimensional-modelling-summarise", "data-modelling-keys", "data-modelling-physical"],
    }),
    step({
      id: "metric", label: "Metric", kind: "mechanism", phase: "architecture", title: "One tested definition of revenue serves every report",
      caption: "Revenue is defined once as a metric over the fact table, owned by Finance. Tests must pass before the night's figure is published.",
      show: ["odb", "cap", "lake", "raw", "raw-s", "tr", "star", "fact-hot", "pub", "def", "run5"], counters: ["1", "the revenue metric", "one log reader", "after tests pass"],
      rides: [ride("m4", 0, 0.94, "80,730", { via: [0.04] })],
      concepts: ["analytics-and-the-semantic-layer", "data-quality"],
      body: ["In a semantic layer a metric is a function that defines a quantitative indicator, and dimensions add context to it. Reports ask for the metric and no longer carry a formula of their own.",
        "A dbt data test is a select statement that looks for failing records, and it passes when it finds none. In a build, a failing test causes the resources downstream of it to be skipped.",
        "A certified semantic model carries a badge that marks it as a trusted source. The data owner is accountable for the definition."],
      claims: ["analytics-and-the-semantic-layer-metrics", "analytics-and-the-semantic-layer-dbt", "analytics-and-the-semantic-layer-certification", "data-quality-dbt-tests", "data-quality-block-or-flag", "data-modelling-owner"],
    }),
    step({
      id: "order", label: "An order", kind: "mechanism", phase: "execution", title: "Order 4471 reaches Finance overnight",
      caption: "A web order of 49.00 is captured, landed, cleaned and added to the fact table by the 02:00 run. Tests pass, and 3 March publishes at 80,730.",
      show: ["odb", "cap", "lake", "raw", "raw-s", "tr", "star", "fact-hot", "pub", "rep", "run-ok"], counters: ["1", "the revenue metric", "one log reader", "06:00, tests passed"],
      rides: [ride("m1", 0, 0.92, "insert 4471", { via: [0.12] }), ride("m2", 0, 0.87, "net 49.00"), ride("m3", 0, 0.8, "1 fact row"), ride("m4", 0, 0.94, "80,730", { via: [0.04], then: "published" })],
      concepts: ["change-data-capture", "orchestration", "analytics-and-the-semantic-layer"],
      body: ["The insert leaves the order database as a change event. Each later step waits for the one before it, and the run's history records the state and the try number of every task.",
        "The analytical copy refreshes at a slower interval than the order database. For a daily close, one run a night is enough."],
      claims: ["change-data-capture-operations", "orchestration-tasks", "orchestration-governance", "operational-and-analytical-workloads-refresh"],
    }),
    step({
      id: "late", label: "A late return", kind: "mechanism", phase: "execution", title: "A late return restates a closed day",
      caption: "A store file arrives on 6 March with a return dated 3 March. A backfill reruns that day, and revenue falls by 120. The earlier table version stays queryable.",
      show: ["odb", "cap", "lake", "raw", "raw-s", "tr", "star", "fact-hot", "pub", "ver", "run-back"], counters: ["1, restated", "the revenue metric", "one log reader", "restated, both kept"],
      rides: [ride("st", 0, 0.6, "return -120"), ride("m3", 0, 0.8, "net -120"), ride("m4", 0, 0.94, "80,610", { via: [0.04] })],
      concepts: ["time-and-history", "orchestration"],
      body: ["The return has two times: the day it happened and the day the pipeline received it. Data does not always arrive in time order.",
        "A backfill creates runs for past dates of a scheduled pipeline. Each write to an Iceberg table creates a new snapshot, and an older snapshot can still be queried, so Finance can show what was reported on 4 March and what changed.",
        { callout: { label: "Restated, not overwritten", text: "The closed figure and the corrected figure both exist, each with its date." } }],
      claims: ["time-and-history-two-times", "time-and-history-late", "time-and-history-table-snapshots", "orchestration-backfill"],
    }),
    step({
      id: "held", label: "A failed test", kind: "decision", phase: "execution", title: "A failed test holds the publish",
      caption: "",
      show: ["odb", "cap", "lake", "raw", "raw-bad", "tr", "star", "fact", "pub", "lin", "run-fail"], counters: ["1, yesterday's", "the revenue metric", "one log reader", "held"],
      rides: [ride("st", 0, 0.6, "4480 twice", { tone: "alert" }), ride("m4", 0, 0.04, "duplicate", { tone: "alert", then: "held" }), ride("lin", 0, 0.62, "which source?", { tone: "alert" })],
      concepts: ["data-quality", "lineage"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Tests that block the publish", "Lineage back to the source", "One owner for revenue"] },
        right: { label: "Do not rely on", items: ["Warnings nobody reads", "Finance spotting the error", "Reconciling by hand"] },
      } },
        "A store file carries order 4480 twice. The uniqueness test returns a failing row, the publish step is skipped, and Finance keeps the last figure that passed.",
        "dbt ships a unique test among its generic data tests. A test of severity error blocks what is downstream of it, and one of severity warn only returns a warning.",
        "Lineage describes the datasets and jobs from which a dataset derives, which gives the information to identify the root cause of an issue. The data owner ensures that the quality of the data is known."],
      claims: ["data-quality-dbt-tests", "data-quality-block-or-flag", "data-quality-ownership", "lineage-table-graph", "lineage-impact"],
    }),
  ],
  governance: { text: "Revenue is a governed metric with one owner. Tests gate publication, and lineage shows which sources stand behind every figure.", claims: ["data-modelling-owner", "data-quality-block-or-flag", "lineage-table-graph"] },
  closing: {
    pitfalls: [
      "Letting each report keep its own formula for revenue.",
      "Running the nightly aggregate on the database that takes orders.",
      "Setting every test to warn, so that nothing ever holds a publish.",
    ],
    questions: [
      "Who decides whether returns are subtracted from revenue?",
      "How can Finance show what the 3 March figure was before it was restated?",
      "Which sources stand behind the figure that failed its test?",
    ],
  },
});
