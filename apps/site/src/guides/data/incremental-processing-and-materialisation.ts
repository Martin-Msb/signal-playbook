import { blocks, CANVAS, defineGuide, drum, isoGrid, line, pill, ride, step, stop } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// The floor: daily_sales for November, one block per daily partition, three rows of ten days.
// A tall block in the track colour is a partition this run wrote. A low block was left alone.
// The run rail passes in front of the month, and the record stops level with the day it writes.
const G = isoGrid(400, 112, 34);
const SIZE = 1.3, STEP = 1.5, RAIL = 6.6, LOW = 12, TALL = 38;
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const cell = (day: number) => ({ gx: ((day - 1) % 10) * STEP, gy: Math.floor((day - 1) / 10) * STEP });
/** A point above the middle of a day's block. */
const over = (day: number, lift: number): [number, number] => {
  const c = cell(day), p = G.p(c.gx + SIZE / 2, c.gy + SIZE / 2);
  return [p[0], p[1] - lift];
};
/** The whole month in one state: the days in `written` stand tall. */
const month = (group: string, written: number[]): El =>
  blocks(`month-${group}`, 0, 0, 10, SIZE, DAYS.map((d) => (written.includes(d) ? { h: TALL, hue: "track" as const } : { h: LOW, hue: "sand" as const })), { gap: STEP - SIZE, group });
const railAt = (day: number): [number, number] => G.p(cell(day).gx + SIZE / 2, RAIL);
const NE: [number, number] = [770, 160], SE: [number, number] = [868, 472];
const range = (from: number, to: number) => DAYS.filter((d) => d >= from && d <= to);

export default defineGuide({
  id: "incremental-processing-and-materialisation", track: "data", module: "Transformation", slug: "incremental-processing-and-materialisation",
  title: "Incremental processing and materialisation",
  summary: "Recomputing everything is simple and costly. Incremental logic processes only what changed, provided it stays idempotent.",
  forLeads: "Incremental processing cuts repeat work, but correctness then depends on the change filter and on what the target already holds. The ability to reprocess a period is the recovery path.",
  status: "draft", minutes: 7,
  counters: ["Partitions written", "Write", "Cause", "Safe to rerun"],
  whatIf: { label: "What if the rerun appended?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, dates and the discount rule are illustrative",
    label: "The table daily_sales for November is drawn as thirty blocks on the floor, one per daily partition, in three rows of ten days. A tall green block is a partition the current run wrote, and a low block was left alone. A full recompute raises all thirty. An incremental run raises only 30 November. A retried run that appends stacks a second red copy on 30 November. A late order raises only 12 November, which is overwritten. A backfill raises 13 to 19 November. A routine run with a lookback raises the last three days.",
    els: [
      line("run", [G.p(-0.9, RAIL), G.p(15.2, RAIL)], { always: true }),
      stop("s-src", ...G.p(-0.9, RAIL), undefined, undefined, { big: true, always: true }),
      stop("s-12", ...railAt(12), undefined, undefined, { group: "st-late" }),
      stop("s-13", ...railAt(13), undefined, undefined, { group: "st-fill" }),
      stop("s-19", ...railAt(19), undefined, undefined, { group: "st-fill" }),
      stop("s-30", ...railAt(30), undefined, undefined, { group: "st-new" }),
      drum("orders", -3.4, RAIL - 0.5, 1.05, 40, { hue: "sky", glyph: "stack", title: "Orders", sub: "source", at: "n", always: true }),

      pill("row-1", [302, 76], "1 to 10", { anchor: "end", always: true }),
      pill("row-2", [251, 116], "11 to 20", { anchor: "end", always: true }),
      pill("row-3", [204, 160], "21 to 30", { anchor: "end", always: true }),
      pill("name", [770, 96], "daily_sales", { sub: "November, a block per day", glyph: "table", mono: true, always: true }),

      month("full", DAYS),
      month("new", [30]),
      month("late", [12]),
      month("fill", range(13, 19)),
      month("look", [28, 29, 30]),
      blocks("copy", cell(30).gx, cell(30).gy, 1, SIZE, [{ h: TALL, state: "alert" }], { group: "dup", z: TALL }),

      pill("l-full", NE, "30 partitions rewritten", { group: "full" }),
      pill("l-new", SE, "30 Nov, written once", { to: over(30, TALL), group: "new-l" }),
      pill("l-dup", SE, "30 Nov, counted twice", { tone: "alert", to: over(30, TALL * 2), group: "dup" }),
      pill("l-late", [540, 60], "12 Nov, overwritten", { to: over(12, TALL), group: "late" }),
      pill("l-fill", NE, "13 to 19 Nov, rebuilt", { to: over(17, TALL), group: "fill" }),
      pill("l-look", SE, "new day and lookback", { to: over(30, TALL), group: "look" }),
      pill("l-recover", NE, "Backfill a period", { sub: "the recovery control", glyph: "check", group: "look" }),
    ],
  },
  steps: [
    step({
      id: "recompute", label: "Recompute", kind: "problem", title: "A full recompute rewrites every day",
      caption: "One new day of orders arrives. The run reads the whole month again and rewrites all 30 daily partitions of daily_sales to add it.",
      show: ["full", "st-new"], counters: ["30 of 30", "replace all", "new day", "yes"],
      rides: [ride("run", "s-src", "s-30", "30 days", { then: "30 written" })],
      body: ["A PostgreSQL materialised view persists the result of its defining query. REFRESH MATERIALIZED VIEW executes that query again and completely replaces the contents.",
        "The result is always right and the logic is simple. The cost is that every run repeats the work for days whose orders did not change."],
      claims: ["incremental-processing-and-materialisation-materialised-view", "incremental-processing-and-materialisation-cost"],
    }),
    step({
      id: "incremental", label: "Incremental", kind: "idea", title: "An incremental run writes only the new day",
      caption: "The run filters the source to the orders that arrived since its last run. One partition is written and 29 are left alone.",
      show: ["new", "new-l", "st-new"], counters: ["1 of 30", "insert", "new day", "not yet"],
      rides: [ride("run", "s-src", "s-30", "30 Nov", { then: "1 written" })],
      body: ["A dbt incremental model builds its table from all source rows on the first run. On later runs it transforms only the rows the model filters for and inserts them into the existing table.",
        "A Snowflake dynamic table in incremental refresh mode analyses only the data that changed since the last refresh. Its full mode reruns the whole definition and replaces the output.",
        { callout: { label: "Key idea", text: "The work follows the size of the change, not the size of the history." } }],
      claims: ["incremental-processing-and-materialisation-cost", "incremental-processing-and-materialisation-dynamic-table"],
    }),
    step({
      id: "rerun", label: "Rerun", kind: "watch-out", title: "A rerun that appends counts the day twice",
      caption: "The run fails partway and is retried. Appending stacks a second copy of 30 Nov. An idempotent run replaces what it wrote, so a retry changes nothing.",
      show: ["new", "dup", "st-new"], counters: ["1 of 30, twice", "append", "retry", "no"],
      rides: [ride("run", "s-src", "s-30", "30 Nov again", { then: "duplicate", tone: "alert" })],
      body: ["An incremental model depends on what the target already holds. Without a unique_key, dbt appends the rows the model returns, and a repeated run can insert the same rows again.",
        "With a unique_key, a matching row is updated or replaced instead of appended. dbt describes an idempotent transformation as one that is safe to rerun and gives the same result however many times it has run."],
      claims: ["incremental-processing-and-materialisation-key", "incremental-processing-and-materialisation-backfill"],
    }),
    step({
      id: "overwrite", label: "Overwrite", kind: "mechanism", title: "A late order overwrites one partition",
      caption: "Order 4471 of 12 Nov arrives on 1 Dec. The run selects all of 12 Nov again and replaces that partition. Running it twice leaves the same result.",
      show: ["late", "st-late"], counters: ["1 of 30", "overwrite partition", "late order", "yes"],
      rides: [ride("run", "s-src", "s-12", "4471, 12 Nov", { then: "replaced" })],
      body: ["dbt's insert_overwrite strategy replaces entire partitions with new data instead of merging individual rows, and overwrites only the affected partitions. The model must select all of the data that belongs in a partition it replaces.",
        "dbt's microbatch strategy applies the same idea to every batch: each batch is an independent, idempotent unit that can be built or replaced on its own."],
      claims: ["incremental-processing-and-materialisation-overwrite", "incremental-processing-and-materialisation-microbatch"],
    }),
    step({
      id: "backfill", label: "Backfill", kind: "mechanism", title: "A backfill reprocesses a range of days",
      caption: "A discount rule was wrong from 13 to 19 Nov. After the fix, a backfill reruns those seven days, each as its own batch, and leaves the rest alone.",
      show: ["fill", "st-fill"], counters: ["7 of 30", "overwrite partitions", "logic fix", "yes"],
      rides: [ride("run", "s-src", "s-19", "13 to 19 Nov", { via: ["s-13"], then: "7 rebuilt" })],
      body: ["A dbt microbatch backfill names an event-time start and end, and dbt processes the batches between them as independent queries. In Apache Airflow, a backfill creates runs for past dates of a Dag.",
        "When the affected period is unknown, dbt's full-refresh option rebuilds the incremental model from all available data."],
      claims: ["incremental-processing-and-materialisation-microbatch", "incremental-processing-and-materialisation-airflow-backfill", "incremental-processing-and-materialisation-backfill"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choose how much each run rewrites",
      caption: "",
      show: ["look", "st-new"], counters: ["3 of 30", "overwrite partitions", "new day, lookback", "yes"],
      rides: [ride("run", "s-src", "s-30", "28 to 30 Nov", { then: "3 written" })],
      body: [{ pair: {
        left: { label: "Recompute everything", items: ["Reads all history each run", "Replaces the whole result"] },
        right: { label: "Incremental", items: ["Reads only what changed", "Replaces by key or partition", "Keeps a backfill path"] },
      } },
        "A dbt microbatch model can set a lookback, which reprocesses batches before the latest one to capture late-arriving records. Each routine run then rewrites the newest days as well as the new one."],
      claims: ["incremental-processing-and-materialisation-cost", "incremental-processing-and-materialisation-key", "incremental-processing-and-materialisation-overwrite", "incremental-processing-and-materialisation-microbatch", "incremental-processing-and-materialisation-materialised-view"],
    }),
  ],
  governance: { text: "Reprocessing a period is the recovery control when source data or transformation logic was wrong. Idempotent runs and a known backfill path restore the affected days without double-counting.", claims: ["incremental-processing-and-materialisation-backfill", "incremental-processing-and-materialisation-microbatch"] },
  closing: {
    pitfalls: [
      "Appending on every run without a key or partition that identifies what the run already wrote.",
      "Filtering only on recent dates when orders for older days can still arrive.",
      "Overwriting a partition with a query that selects only part of that partition's rows.",
    ],
    questions: [
      "What does a second run of the same day leave in the target?",
      "How does an order for an already processed day reach its partition?",
      "Which period can be backfilled after a logic or source error, and how?",
    ],
  },
});
