import { CANVAS, band, defineGuide, drum, isoGrid, line, note, pawn, pill, plot, plotPoint, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";
import type { El, PlotEl } from "@signal-path/engine";

// Four boards stand in a row: one signal each for the orders table, a reading per day.
// Under them is the lineage of that table: the order system loads it, Finance and Support read it.
// The reader follows freshness: steady, then out of its band on the day a batch is missed, then back.
const G = isoGrid(215, 288, 30);

/** Hours since the last load of the orders table, read at 08:00 each day. The load runs at 06:00. */
const AGE = [2, 2, 3, 2, 2, 2, 4, 2, 2, 3, 2];
/** Rows in each daily batch, in thousands. */
const ROWS = [4.2, 4.4, 4.1, 4.6, 5.1, 3.6, 3.4, 4.3, 4.5, 4.2, 4.7];
/** Columns in each batch. */
const COLS = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
/** Mean order amount in each batch. */
const MEAN = [168, 171, 165, 170, 174, 162, 166, 169, 172, 167, 170];
const LATE = 26, LIMIT = 12, MISSED = 12;

const days = (values: number[], from = 1) => values.map((v, i) => [from + i, v] as [number, number]);
const XR: [number, number] = [0.5, 13.5], XT = [1, 4, 7, 10, 13];
const board = (id: string, cx: number, title: string, yr: [number, number], yt: number[], yLabel: string): PlotEl =>
  raise(plot(id, 0, 0, 218, 150, XR, yr, { title, xt: XT, yt, xLabel: "day", yLabel, always: true }), [cx, 212], 14);

const FRESH = board("fresh", 125, "Freshness", [-6, 30], [0, 12, 24], "hours old");
const VOLUME = board("volume", 362, "Volume", [0, 8], [0, 4, 8], "rows, k");
const SCHEMA = board("schema", 598, "Schema", [6, 12], [6, 9, 12], "columns");
const DIST = board("dist", 835, "Distribution", [100, 240], [100, 170, 240], "mean amount");
const BOARDS: [PlotEl, number[], [number, number]][] = [[FRESH, AGE, [0, 6]], [VOLUME, ROWS, [3, 5.6]], [SCHEMA, COLS, [8.5, 9.5]], [DIST, MEAN, [150, 190]]];

const mid = (p: PlotEl) => (p.yr[0] + p.yr[1]) / 2;
const mark = (id: string, p: PlotEl, x: number, y: number): El => stop(id, ...plotPoint(p, x, y), undefined, undefined, { group: "anchor" });

/** The live record of the incident. `n` entries are written, the rest are still to come. */
const ENTRIES: [string, string][] = [
  ["08:00", "freshness alert"],
  ["08:10", "lead assigned"],
  ["08:25", "Finance, Support told"],
  ["10:40", "batch reloaded"],
  ["day 13", "review, retry added"],
];
const record = (id: string, n: number, sub: string): El => raise(table(id, 0, 0, 270, ["time", "entry"],
  ENTRIES.map((cells, i) => (i < n ? { cells, hot: i === n - 1 } : { cells: [cells[0] === "day 13" ? "day 13" : "", "to come"], mute: true })),
  { at: [14, 80], rowH: 25, title: "Incident record", sub, group: id }), [810, 510], 12);

const ordersTable = (id: string, sub: string, extra: { state?: "alert" } = {}): El =>
  drum(id, 5, 2.7, 0.95, 30, { hue: "track", glyph: "table", title: "orders", sub, at: "s", group: id, ...extra });
const report = (id: string, sub: string, extra: { state?: "alert" } = {}): El =>
  prism(id, 9.8, -0.8, 1.6, 1.6, 26, { hue: "mint", glyph: "chart", title: "Finance report", sub, at: "s", group: id, ...extra });
const assistant = (id: string, sub: string, extra: { state?: "alert" } = {}): El =>
  prism(id, 4.2, -4.9, 1.6, 1.6, 26, { hue: "sand", glyph: "user", title: "Refund assistant", sub, at: "e", group: id, ...extra });

export default defineGuide({
  id: "observability-and-incident-response", track: "data", module: "Operation", slug: "observability-and-incident-response",
  title: "Observability and incident response",
  summary: "Freshness, volume, schema and distribution are monitored like service health, and data incidents are detected, triaged and reviewed.",
  forLeads: "Set service levels with data consumers, make failures actionable, and keep an incident record that turns response into prevention.",
  status: "draft", minutes: 7,
  counters: ["Signals watched", "Freshness", "Service level", "Incident record"],
  whatIf: { label: "What if nothing were watched?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Batches, readings and times are illustrative",
    label: "Four charts stand in a row above the floor: freshness, volume, schema and distribution of the Vinterhus orders table, one reading per day. They start empty, fill with eleven days of readings, and gain shaded bands for the expected range and a service level line on freshness. On day 12 the batch is missed: freshness leaves its band and crosses the service level while the other three charts have no reading. On the floor the order system loads the orders table, which feeds the Finance report and the Support refund assistant. The alert pages the data team, the stale table and both consumers turn red, and an incident record fills with a timeline that ends in a reload and a review.",
    els: [
      FRESH, VOLUME, SCHEMA, DIST,

      // Before the concept: four empty boards.
      ...BOARDS.map(([p]) => note(`${p.id}-off`, plotPoint(p, 7, 0)[0], plotPoint(p, 0, mid(p))[1], "not measured", { anchor: "middle", tone: "muted", strong: true, size: 12, on: p.id, group: "off" })),

      // Eleven days of readings, then what is expected of each.
      ...BOARDS.map(([p, , [lo, hi]]) => band(`${p.id}-band`, p.id, lo, hi, { axis: "y", group: "expected" })),
      ...BOARDS.map(([p, values]) => series(`${p.id}-line`, p.id, "line", days(values), { w: 3, group: "signals" })),
      ...BOARDS.map(([p, values]) => series(`${p.id}-dots`, p.id, "points", days(values), { hue: "track", r: 3, group: "signals" })),
      rule("level", "fresh", LIMIT, { axis: "y", tone: "alert", w: 2.5, group: "level" }),
      note("level-n", plotPoint(FRESH, 1, 0)[0], plotPoint(FRESH, 0, 15)[1], "service level 12 h", { tone: "alert", strong: true, size: 11, on: "fresh", group: "level" }),
      note("band-n", plotPoint(VOLUME, 1, 0)[0], plotPoint(VOLUME, 0, 6.3)[1], "expected range", { strong: true, size: 11, on: "volume", group: "expected" }),

      // Day 12: no batch. Freshness climbs out of its band, the other three have nothing to read.
      series("late", "fresh", "line", [[11, 2], [MISSED, LATE]], { tone: "alert", w: 4, group: "missed" }),
      series("late-dot", "fresh", "points", [[MISSED, LATE]], { hue: "rose", r: 5, hot: [0], group: "missed" }),
      ...[VOLUME, SCHEMA, DIST].map((p) => band(`${p.id}-gap`, p.id, 11.5, 12.5, { tone: "muted", group: "gap" })),
      ...[VOLUME, SCHEMA, DIST].map((p) => note(`${p.id}-gap-n`, plotPoint(p, 12, 0)[0], plotPoint(p, 0, p.yr[0] + (p.yr[1] - p.yr[0]) * 0.8)[1], "no batch", { anchor: "middle", tone: "muted", strong: true, size: 11, on: p.id, group: "gap" })),

      // Day 13: reloaded. Every signal is back inside its band.
      series("back", "fresh", "line", [[MISSED, LATE], [13, 2]], { w: 3, group: "recovered" }),
      series("back-dot", "fresh", "points", [[13, 2]], { hue: "track", r: 4, group: "recovered" }),
      ...([[VOLUME, [4.7, 4.4, 4.3]], [SCHEMA, [9, 9, 9]], [DIST, [170, 168, 169]]] as [PlotEl, number[]][]).flatMap(([p, values]) => [
        series(`${p.id}-back`, p.id, "line", days(values, 11), { w: 3, group: "recovered" }),
        series(`${p.id}-back-dots`, p.id, "points", days(values.slice(1), 12), { hue: "track", r: 3, group: "recovered" }),
      ]),
      mark("d1", FRESH, 1, 2), mark("d11", FRESH, 11, 2), mark("d12", FRESH, MISSED, LATE), mark("d13", FRESH, 13, 2),
      mark("v1", VOLUME, 1, 4.2), mark("v11", VOLUME, 11, 4.7),

      // The floor: where the table comes from and who reads it.
      line("flow", [G.p(0, 0), G.p(5, 0), G.p(9.5, 0)], { always: true }),
      line("branch", [G.p(5, 0), G.p(5, -3)], { always: true }),
      stop("source", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("loaded", ...G.p(5, 0), undefined, undefined, { always: true }),
      stop("finance", ...G.p(9.5, 0), undefined, undefined, { always: true }),
      stop("to-finance", ...G.p(7, 0), undefined, undefined, { group: "anchor" }),
      stop("to-orders", ...G.p(3.6, 0), undefined, undefined, { group: "anchor" }),
      stop("support", ...G.p(5, -3), undefined, undefined, { always: true }),
      prism("system", -1.9, -0.8, 1.6, 1.6, 26, { hue: "sky", glyph: "stack", title: "Order system", sub: "batch at 06:00", at: "w", always: true }),
      ordersTable("orders-ok", "loaded daily"), ordersTable("orders-stale", "day 10, stale", { state: "alert" }), ordersTable("orders-back", "reloaded 10:40"),
      report("report-ok", "daily sales"), report("report-hit", "affected", { state: "alert" }),
      assistant("assistant-ok", "Support"), assistant("assistant-hit", "affected", { state: "alert" }),

      // The control and the response.
      raise(table("agreed", 0, 0, 270, ["term", "agreed"], [["table", "orders"], ["freshness", "under 12 h"], ["checked", "08:00 daily"], ["consumers", "Finance, Support"], ["owner", "data team"]],
        { at: [14, 100], rowH: 25, title: "Service level", group: "agreed" }), [810, 510], 12),
      pawn("team", 3, 8, "Data team", undefined, { hue: "sand", group: "team" }),
      pill("paged", [165, 438], "paged 08:00", { tone: "alert", group: "paged" }),
      pill("lead", [165, 438], "incident lead", { group: "lead" }),
      record("record-live", 3, "open"), record("record-done", 5, "reviewed"),
    ],
  },
  steps: [
    step({
      id: "unseen", label: "Missed batch", kind: "problem", title: "A missed batch fails silently",
      caption: "Today's order batch never loaded. The Finance report still opens and shows the total to day 10 as if it were current. Nothing measures the table.",
      show: ["off", "orders-ok", "report-ok", "assistant-ok"], counters: ["0 of 4", "unknown", "none", "none"],
      rides: [ride("flow", "loaded", "to-finance", "total: day 10", { then: "shown as today" })],
      body: ["A report can be available while its data is late or wrong. The job that should have failed loudly did not run at all, so no error was raised.",
        "The orders table is loaded once a day at 06:00. Finance reads it through the daily sales report, and the Support refund assistant looks orders up in it."],
      claims: ["observability-and-incident-response-four"],
    }),
    step({
      id: "signals", label: "Four signals", kind: "idea", title: "Four signals describe the health of a table",
      caption: "Each day the orders table is measured: how old it is, how many rows arrived, which columns it has and how its values are spread.",
      show: ["signals", "orders-ok", "report-ok", "assistant-ok"], counters: ["4 of 4", "2 h", "none", "none"],
      rides: [ride("fresh-line", "d1", "d11", "2 h old"), ride("volume-line", "v1", "v11", "4.7k rows")],
      body: ["Services are observed through signals such as metrics, logs and traces. A table needs signals of its own, because a pipeline can run without error and still deliver late, short or misshapen data.",
        "Great Expectations names the same four among its data quality use cases: freshness verifies that data is available within expected timeframes, volume that record quantity falls within expected bounds, schema that data structure conforms to established rules, and distribution that values adhere to expected ranges.",
        { callout: { label: "Key idea", text: "Freshness is read from the table's clock. The other three are read from the rows that arrived." } }],
      claims: ["observability-and-incident-response-signals", "observability-and-incident-response-four"],
    }),
    step({
      id: "expected", label: "Expected", kind: "mechanism", title: "Each signal gets an expected range",
      caption: "History gives every signal a band of normal readings. Finance and the data team also agree a service level: at 08:00 the table is under 12 hours old.",
      show: ["signals", "expected", "level", "agreed", "orders-ok", "report-ok", "assistant-ok"], counters: ["4 of 4", "2 h", "under 12 h", "none"],
      rides: [ride("flow", "source", "to-orders", "day 11 batch", { then: "loaded 06:00" })],
      body: ["Anomaly detection learns the band. Databricks anomaly detection analyses historical patterns to evaluate the freshness and completeness of each table: a table is marked stale when a commit is unusually late, and incomplete when its row count falls below the expected range.",
        "A service level is an agreement, not a statistic. The Google SRE Workbook gives formats for a data freshness objective, one of which is that the oldest data is no older than a set time. dbt source freshness compares observed freshness with the service level agreement an organisation has defined, and dbt asks for checks frequent enough to measure against it.",
        { callout: { label: "Governance", text: "The service level names the table, the target, the consumers and the owner. It is the control that the incident record later gives evidence for." } }],
      claims: ["observability-and-incident-response-anomaly", "observability-and-incident-response-slo", "observability-and-incident-response-freshness"],
    }),
    step({
      id: "alert", label: "Detect", kind: "mechanism", title: "A reading outside its band raises an alert",
      caption: "On day 12 no batch arrives. Freshness reaches 26 hours and crosses the service level, the other three signals have nothing to read, and the data team is paged.",
      show: ["signals", "expected", "level", "missed", "gap", "agreed", "team", "paged", "orders-stale", "report-ok", "assistant-ok"], counters: ["4 of 4", "26 h", "breached", "none"],
      rides: [ride("late", "d11", "d12", "2 h old", { then: "26 h", tone: "alert" })],
      body: ["Volume, schema and distribution are measured on a batch, so a missing batch leaves them silent. Only freshness moves. A table watched for volume alone would have shown no reading and no alarm.",
        "Prometheus alerting rules evaluate an expression and can notify when the alert fires. A for clause makes the rule wait for the condition to hold for a duration, and annotations can carry context such as a runbook link.",
        "Monitoring out-of-SLO alerts allows the team to detect issues that impact its customers."],
      claims: ["observability-and-incident-response-alerts", "observability-and-incident-response-slo"],
    }),
    step({
      id: "triage", label: "Triage", kind: "watch-out", title: "Stale data has already reached its consumers",
      caption: "Lineage shows what the orders table feeds: the Finance report and the refund assistant. The incident lead opens a record, and both teams are told before they act on old figures.",
      show: ["signals", "expected", "level", "missed", "gap", "team", "lead", "record-live", "orders-stale", "report-hit", "assistant-hit"], counters: ["4 of 4", "26 h", "breached", "open"],
      rides: [ride("flow", "loaded", "to-finance", "stale: day 10")],
      body: ["Lineage is a record of data being transformed from sources to targets. It helps to trace pipeline errors to their root cause and to assess downstream impact. Databricks rates the impact of a table anomaly by the number of downstream tables and queries affected.",
        "Google SRE describes distinct roles in an incident: command, operational work, communication and planning. The incident commander keeps a living incident document, and the communications role issues periodic updates to the response team and stakeholders.",
        { callout: { label: "Key idea", text: "Triage answers three questions in order: who is affected, who is leading, and who has been told." } }],
      claims: ["observability-and-incident-response-lineage", "observability-and-incident-response-anomaly", "observability-and-incident-response-triage"],
    }),
    step({
      id: "decide", label: "Review", kind: "decision", title: "The record closes with a review",
      caption: "",
      show: ["signals", "expected", "level", "missed", "recovered", "team", "lead", "record-done", "orders-back", "report-ok", "assistant-ok"], counters: ["4 of 4", "2 h", "met", "reviewed"],
      rides: [ride("flow", "source", "to-orders", "day 11 batch", { then: "reloaded" }), ride("back", "d12", "d13", "26 h", { then: "2 h" })],
      body: [{ pair: {
        left: { label: "During response", items: ["Assign a lead", "Record impact and actions", "Keep consumers informed"] },
        right: { label: "After recovery", items: ["Review causes", "Assign prevention actions", "Adjust checks and service levels"] },
      } }, "Google SRE describes a postmortem as a written record of an incident, its impact, the actions taken to mitigate or resolve it, the root causes and the follow-up actions to prevent recurrence. Here the review adds a retry to the 06:00 load.",
        "The record is kept. Its timeline shows when the breach was detected, who was told and when the service level was met again."],
      claims: ["observability-and-incident-response-record"],
    }),
  ],
  governance: { text: "Agree service levels with data consumers and retain incident records as compliance evidence. The record should capture the impact, response and follow-up actions so the control can be reviewed and improved.", claims: ["observability-and-incident-response-slo", "observability-and-incident-response-triage", "observability-and-incident-response-record"] },
  closing: {
    pitfalls: [
      "Treating a healthy pipeline run as proof that its data is fresh and fit for use.",
      "Watching only signals read from a batch, which stay silent when no batch arrives.",
      "Closing an incident without recording its impact, response and prevention work.",
    ],
    questions: [
      "Which freshness, volume, schema and distribution changes matter to each consumer?",
      "Which reports and assistants read this table, and who tells their owners?",
      "Which incident records and follow-up actions provide evidence that controls work?",
    ],
  },
});
