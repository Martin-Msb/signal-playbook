import { blocks, CANVAS, defineGuide, drum, isoGrid, line, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(450, 130, 22);
const route = line("route", [G.p(0, 4), G.p(18, 4)], { always: true });
const blocksAt = (id: string, group: string, rows: number[], hue: "sand" | "track" | "rose" = "sand") =>
  blocks(id, 2, 10, 6, 0.8, rows.map((h) => ({ h, hue })), { gap: 0.22, group });

export default defineGuide({
  id: "incremental-processing-and-materialisation", track: "data", module: "Transformation", slug: "incremental-processing-and-materialisation",
  title: "Incremental processing and materialisation",
  summary: "Recomputing everything is simple and costly. Incremental logic processes only what changed, provided it stays idempotent.",
  forLeads: "Incremental processing lowers repeat work, but it makes correctness depend on the change filter and the target's prior state. Reprocessing provides a recovery path.",
  status: "draft", minutes: 7,
  counters: ["Rows processed", "Target operation", "Late correction", "Recovery"],
  whatIf: { label: "What if the same batch runs twice?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and dates are illustrative",
    label: "Daily order records travel from the source through a transformation into a stored daily total. A full refresh reads every day. Incremental runs take the changed date, replace its matching target value or partition, and can later rebuild history when a late correction or changed logic requires reprocessing.",
    els: [
      route,
      stop("source", ...G.p(0, 4), undefined, undefined, { big: true, always: true }),
      stop("transform", ...G.p(6, 4), undefined, undefined, { always: true }),
      stop("materialise", ...G.p(12, 4), undefined, undefined, { always: true }),
      stop("finance", ...G.p(18, 4), undefined, undefined, { big: true, always: true }),
      drum("orders", -4, 4, 1.1, 40, { hue: "sky", glyph: "stack", title: "Orders", sub: "daily source", at: "n", always: true }),
      prism("model", 5, -3, 1.4, 1.4, 32, { hue: "track", glyph: "check", title: "Daily totals", sub: "transformation", at: "s", always: true }),
      drum("target", 18, -2, 1.1, 40, { hue: "mint", glyph: "table", title: "daily_sales", sub: "materialised", at: "w", always: true }),
      blocksAt("all-days", "all-days", [17, 23, 19, 27, 21, 30]),
      blocksAt("new-day", "new-day", [4, 4, 4, 4, 4, 31], "track"),
      blocksAt("matched-day", "matched-day", [4, 4, 4, 4, 4, 31], "track"),
      blocksAt("corrected-day", "corrected-day", [4, 4, 28, 4, 4, 4], "rose"),
      blocksAt("partition", "partition", [4, 4, 28, 4, 4, 4], "rose"),
      blocksAt("backfill", "backfill", [17, 23, 29, 27, 21, 30]),
    ],
  },
  steps: [
    step({
      id: "recompute", label: "Recompute", kind: "problem", title: "The whole history is rebuilt each run",
      caption: "A materialized result stays ready for readers, but a refresh can rerun its defining query over every order day.",
      show: ["all-days"], counters: ["all days", "replace all", "none", "none"],
      rides: [ride("route", "source", "finance", "all order days")],
      body: ["A PostgreSQL materialized view stores the result of its defining query. REFRESH MATERIALIZED VIEW executes that query and replaces all of its contents.", "For a large source, repeating the full transformation may spend work on dates whose data did not change."],
      claims: ["incremental-processing-and-materialisation-materialised-view", "incremental-processing-and-materialisation-cost"],
    }),
    step({
      id: "filter", label: "Filter", kind: "idea", title: "Select only new or changed rows",
      caption: "An incremental model filters the source to the new or changed orders since its last run, leaving unchanged days out of the work.",
      show: ["new-day"], counters: ["one day", "append or merge", "none", "none"],
      rides: [ride("route", "source", "transform", "new orders")],
      body: ["dbt incremental models build a table from all source rows initially. On later runs, the model filters for rows to process and inserts them into the existing target."],
      claims: ["incremental-processing-and-materialisation-cost"],
    }),
    step({
      id: "repeat", label: "Rerun", kind: "mechanism", title: "A stable key makes a retry repeatable",
      caption: "The same day arrives again. A unique key replaces its existing daily total, so the retry does not append a second copy.",
      show: ["matched-day"], counters: ["one day", "replace matching key", "none", "rerun safely"],
      rides: [ride("route", "transform", "finance", "day 12", { via: ["materialise"], then: "replace existing" })],
      body: ["With a unique_key, dbt updates or replaces a matching target row. Appending without a reliable key can duplicate boundary rows when the run is repeated."],
      claims: ["incremental-processing-and-materialisation-key"],
    }),
    step({
      id: "partition", label: "Partition", kind: "mechanism", title: "Replace a corrected partition",
      caption: "A corrected order changes its daily total. Partition overwrite selects the full corrected day and replaces that partition in the materialised target.",
      show: ["partition"], counters: ["one partition", "overwrite partition", "day corrected", "none"],
      rides: [ride("route", "source", "materialise", "day 10 correction")],
      body: ["dbt insert_overwrite replaces affected partitions rather than matching individual rows. The model must select every row that belongs in a partition it replaces. It is suited to refreshing corrected dates without rebuilding the full table.", "Snowflake dynamic tables also support incremental refresh, which merges changed data into the materialised output; their full mode reruns the full definition."],
      claims: ["incremental-processing-and-materialisation-overwrite", "incremental-processing-and-materialisation-dynamic-table"],
    }),
    step({
      id: "backfill", label: "Backfill", kind: "watch-out", title: "A missed change can leave history wrong",
      caption: "A late correction may fall outside the filter. Reprocess the affected history, or a full refresh can rebuild the model from the source.",
      show: ["corrected-day", "backfill"], counters: ["history window", "full rebuild", "late row", "backfill"],
      rides: [ride("route", "source", "finance", "rebuild history")],
      body: ["dbt's full-refresh option rebuilds an incremental model from all available data. Idempotent transformations are safe to rerun and backfill without double-counting or drift."],
      claims: ["incremental-processing-and-materialisation-backfill"],
    }),
    step({
      id: "decide", label: "Choose", kind: "decision", title: "Choose the smallest safe reprocessing unit",
      caption: "",
      show: ["corrected-day", "partition"], counters: ["one partition", "keyed replacement", "day corrected", "reprocess period"],
      rides: [ride("route", "source", "finance", "4470 total", { via: ["transform", "materialise"], then: "reprocessed" })],
      body: [{ pair: {
        left: { label: "Routine run", items: ["Filter new and changed rows", "Use a stable unique key", "Replace affected partitions"] },
        right: { label: "Recovery", items: ["Identify the wrong period", "Reprocess or backfill it", "Check the rebuilt output"] },
      } }, "Incremental logic saves repeated work only while it handles retries and late data correctly. Keep a full-refresh or period backfill path."],
      claims: ["incremental-processing-and-materialisation-key", "incremental-processing-and-materialisation-overwrite", "incremental-processing-and-materialisation-backfill"],
    }),
  ],
  governance: { text: "Reprocessing a period is a recovery control when source data or transformation logic was wrong. Use idempotent logic and a known backfill path to restore results without double-counting.", claims: ["incremental-processing-and-materialisation-backfill"] },
  closing: {
    pitfalls: [
      "Using only an event-time cutoff when older rows can arrive late.",
      "Appending retries without a key that identifies the target row.",
      "Replacing a partition without selecting all of that partition's correct rows.",
    ],
    questions: [
      "What defines a changed row and its unique target key?",
      "How wide is the late-arriving correction window?",
      "Which period can be backfilled safely after a logic or source error?",
    ],
  },
});
