import { blocks, CANVAS, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt, Row } from "@signal-path/engine";

// The floor is a calendar. Days run along gx, from 30 November to 5 December, and a dashed line marks the end of November.
// Two lanes carry the two times of a record: when it happened at the back, when it was recorded at the front.
// Between the lanes lies the orders table, one row of blocks per order. A block stands on the day its row was written.
// Overwriting leaves one block per order, versioning one block per change, a snapshot one block per order per day.
// Each block is its own element, so markers and plates can rest beside the rows.
const G = isoGrid(440, 92, 30);
const SIZE = 1.4, STEP = 2.4, H = 20;
const ROW = [2.6, 4.4, 6.2], LE = 0, LR = ROW[2] + SIZE + 2.8, MONTH = (SIZE + STEP) / 2;
const DAYS = ["30 Nov", "1 Dec", "2 Dec", "3 Dec", "4 Dec", "5 Dec"];
const slot = (k: number) => k * STEP + SIZE / 2;
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
const block = (id: string, day: number, row: number, group: string, o: { hue?: Hue; hot?: boolean } = {}): El =>
  blocks(id, day * STEP, ROW[row], 1, SIZE, [{ h: H, ...o, state: o.hue || o.hot ? undefined : "closed" }], { group });

// The daily snapshots: every order that exists on a day is copied again. Order 4471 is 1290 until the return on 3 December.
const amount = (day: number): Hue => (day < 3 ? "sky" : "violet");
const snaps: El[] = [1, 2, 3, 4, 5].map((d) => block(`s0-${d}`, d, 0, "snap", { hue: "sand" }))
  .concat([4, 5].map((d) => block(`s1-${d}`, d, 1, "snap", { hue: amount(d) })))
  .concat([3, 4, 5].map((d) => block(`s2-${d}`, d, 2, "snap", { hue: "rose" })));

const STORED: Pt = [142, 530], ASKED: Pt = [826, 196];
const stored = (id: string, sub: string, cols: string[], at: number[], rows: Row[], w = 252): El =>
  raise(table(id, 0, 0, w, cols, rows, { at, rowH: 22, title: id.startsWith("t-orders") ? "orders" : "Order 4471", sub, group: id }), STORED, 22);
const report = (id: string, sub: string, row: Row, foot: string): El =>
  raise(table(id, 0, 0, 220, ["order", "amount"], [["4470", "899"], row], { at: [12, 104], rowH: 22, title: "November report", sub, foot, group: id }), ASKED, 26);
const answer = (id: string, sub: string, item: { t: string; hot?: boolean; tone?: "alert" }): El =>
  raise(list(id, 0, 0, 236, [item], { title: "4471 on 2 Dec", sub, mono: true, group: id }), ASKED, 26);

export default defineGuide({
  id: "time-and-history", track: "data", module: "Modelling", slug: "time-and-history",
  title: "Time and history",
  summary: "A record has the time it happened and the time it was recorded. Keeping its history means choosing between overwriting, versioning and snapshots.",
  forLeads: "Whether last month's report can be reproduced is decided when the table is designed. History is the audit trail, and a retention period has to say when it ends.",
  status: "draft", minutes: 7,
  counters: ["Times per record", "Sale counted in", "History", "Rows stored"],
  whatIf: { label: "What if the row were overwritten?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts and dates are illustrative",
    label: "The floor is a calendar from 30 November to 5 December, with a dashed line at the end of November. A front lane marks when a record was recorded and a back lane marks when it happened. Between them the orders table is drawn as blocks, one row per order, each block standing on the day it was written. Order 4471 is sold on 30 November and recorded on 1 December. When its amount changes on 3 December, overwriting leaves one block and an empty outline, versioning leaves two blocks, and daily snapshots leave a block for every order on every day. Finance looks back to 2 December along the front lane. At the last stop each version carries both times, and audit, retention and deletion rights are marked.",
    els: [
      // the calendar: month boundary, the recorded lane and its days
      ...DAYS.map((_, k) => line(`day-${k}`, [G.p(slot(k), LE), G.p(slot(k), LR)], { tone: "muted", w: 1.5, state: "planned", always: true })),
      line("month", [G.p(MONTH, -3.6), G.p(MONTH, LR + 1.3)], { tone: "muted", w: 2.5, always: true }),
      pill("nov", [G.p(MONTH, -3.6)[0] - 8, 26], "November", { anchor: "end", always: true }),
      pill("dec", [G.p(MONTH, -3.6)[0] + 8, 26], "December", { anchor: "start", always: true }),
      line("laneR", [G.p(-0.4, LR), G.p(5 * STEP + SIZE + 0.4, LR)], { tone: "ink", w: 3, always: true }),
      ...DAYS.map((d, k) => stop(`r-${k}`, ...G.p(slot(k), LR), d, undefined, { mono: true, at: "sw", always: true })),
      pill("r-one", up(-1, LR, 15), "loaded", { sub: "the only time", anchor: "end", group: "one" }),
      pill("r-two", up(-1, LR, 15), "recorded", { anchor: "end", group: "two" }),
      prism("fin-a", 14.6, LR - 0.7, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "closes November", at: "e", group: "close" }),
      prism("fin-b", 14.6, LR - 0.7, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "looks back", at: "e", group: "ask" }),

      // 2 onward. the second time: when it happened
      line("laneE", [G.p(-0.4, LE), G.p(5 * STEP + SIZE + 0.4, LE)], { tone: "ink", w: 3, group: "two" }),
      ...DAYS.map((d, k) => stop(`e-${k}`, ...G.p(slot(k), LE), d, undefined, { mono: true, group: "two" })),
      pill("e-two", up(-1, LE, 15), "happened", { anchor: "end", group: "two" }),

      // the orders table as blocks: one row per order, a block on the day its row was written
      block("b4470", 0, 0, "base", { hue: "sand" }),
      block("v1", 1, 1, "v1", { hue: "sky" }),
      blocks("v1-x", STEP, ROW[1], 1, SIZE, [{ h: H, state: "closed" }], { title: "1290, overwritten", at: "e", group: "v1-gone" }), block("v1-hot", 1, 1, "v1-hot", { hot: true }),
      block("v2", 3, 1, "later", { hue: "violet" }),
      block("b4472", 2, 2, "later", { hue: "rose" }),
      block("s1-2", 2, 1, "snap", { hot: true }),
      ...snaps,
      ...["4470", "4471"].map((o, r) => pill(`o-${o}`, up(-1, ROW[r] + SIZE / 2, 15 + H / 2), o, { anchor: "end", mono: true, always: true })),
      pill("o-4472", up(-1, ROW[2] + SIZE / 2, 15 + H / 2), "4472", { anchor: "end", mono: true, group: "later" }),

      // what the table stores
      stored("t-orders-1", "one time column", ["order", "amount", "loaded"], [12, 72, 138], [["4470", "899", "30 Nov 14:12"], { cells: ["4471", "1290", "1 Dec 00:04"], hot: true }]),
      stored("t-two", "two times", ["field", "value"], [12, 104], [["amount", "1290"], { cells: ["happened", "30 Nov 23:58"], hot: true }, ["recorded", "1 Dec 00:04"]]),
      stored("t-orders-3", "one row per order", ["order", "amount", "recorded"], [12, 80, 152], [["4470", "899", "30 Nov"], { cells: ["4471", "990", "3 Dec"], hot: true }, ["4472", "349", "2 Dec"]]),
      stored("t-vers", "a row per change", ["amount", "valid from", "valid to"], [12, 84, 170], [{ cells: ["1290", "1 Dec", "3 Dec"], hot: true }, ["990", "3 Dec", "open"]]),
      stored("t-snap", "a copy per day", ["snapshot", "amount"], [12, 104], [["1 Dec", "1290"], { cells: ["2 Dec", "1290"], hot: true }, ["3 Dec", "990"], ["4 Dec", "990"]], 184),
      stored("t-bi", "both times on every row", ["amount", "happened", "recorded"], [12, 84, 170], [["1290", "30 Nov", "1 Dec"], { cells: ["990", "2 Dec", "3 Dec"], hot: true }]),

      // what Finance gets
      report("rep-load", "by load time", { cells: ["4471", "1290"], strike: true }, "total 899"),
      report("rep-event", "by event time", { cells: ["4471", "1290"], hot: true }, "total 2189"),
      answer("ans-none", "overwritten", { t: "amount  unknown", tone: "alert" }),
      answer("ans-vers", "from the version", { t: "amount  1290", hot: true }),
      answer("ans-snap", "from the snapshot", { t: "amount  1290", hot: true }),

      // 6. the controls on history
      pill("audit", [832, 34], "Audit trail", { glyph: "eye", sub: "every change kept", group: "gov" }),
      pill("keep", [832, 96], "Retention period", { glyph: "clock", sub: "then history is deleted", group: "gov" }),
      pill("priv", [832, 158], "Delete history", { glyph: "key", sub: "a privilege of its own", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "one-time", label: "One time", kind: "problem", title: "One timestamp files a sale under its load time",
      caption: "A store till sells order 4471 at 23:58 on 30 November and syncs at 00:04. The table keeps only the load time, so the November report misses the sale.",
      show: ["one", "close", "base", "v1", "t-orders-1", "rep-load"], counters: ["1", "December", "not kept", "2"],
      rides: [ride("laneR", 0, "r-1", "sold 23:58", { via: ["r-0"], then: "loaded 00:04" })],
      body: ["Data does not always arrive in time order or at predictable intervals. There is a lag between the moment an event occurs and the moment a pipeline processes it.",
        "A table with one time column records only one of those two moments. Every report that groups by that column inherits the choice."],
      claims: ["time-and-history-two-times", "time-and-history-late"],
    }),
    step({
      id: "two-times", label: "Two times", kind: "idea", title: "A record has two times",
      caption: "Event time is when the sale happened. Processing time is when the system recorded it. With both stored, the sale counts in November, where it happened.",
      show: ["two", "close", "base", "v1", "t-two", "rep-event"], counters: ["2", "November", "not kept", "2"],
      rides: [ride("laneE", "e-1", "e-0", "sale 4471"), ride("laneR", "r-1", "r-1", "sale 4471")],
      body: ["Apache Flink defines event time as the time each individual event occurred on its producing device, and processing time as the system time of the machine that executes the operation. Apache Beam draws the same line: event time comes from the timestamp on the data element, processing time from the clock of the system processing it.",
        "Stream processors that group by event time need to know when a period is complete. A watermark is that estimate: in Beam, a guess as to when all data in a window is expected to have arrived. An element that arrives after the watermark has passed the end of its window is late data.",
        { callout: { label: "Key idea", text: "Store both times. Event time answers when it happened. Processing time answers when the system knew." } }],
      claims: ["time-and-history-two-times", "time-and-history-late"],
    }),
    step({
      id: "overwrite", label: "Overwrite", kind: "watch-out", title: "Overwriting destroys history",
      caption: "On 3 December a partial return changes the amount to 990, and the row is overwritten. Finance asks what the order was on 2 December. The answer is gone.",
      show: ["two", "ask", "base", "v1-gone", "later", "t-orders-3", "ans-none"], counters: ["2", "November", "overwritten", "3"],
      rides: [ride("laneR", "r-5", "r-2", "as of 2 Dec", { tone: "alert" })],
      body: ["In dimensional modelling this is the slowly changing dimension type 1: the old attribute value in the row is overwritten with the new value. The attribute always reflects the most recent assignment, and the technique destroys history.",
        "Type 1 is easy to implement and creates no additional rows. Aggregates that were computed from the old value have to be recomputed."],
      claims: ["time-and-history-type1"],
    }),
    step({
      id: "versions", label: "Versions", kind: "mechanism", title: "Versioning adds a row for each change",
      caption: "The old row is closed with an end time and a new row opens. A query as of 2 December finds the version that was valid then: 1290.",
      show: ["two", "ask", "base", "v1-hot", "later", "t-vers", "ans-vers"], counters: ["2", "November", "a row per change", "4"],
      rides: [ride("laneR", "r-5", "r-2", "as of 2 Dec")],
      body: ["This is the slowly changing dimension type 2: a change adds a new row with the updated values. Each row carries a row effective date, a row expiration date and a current row indicator, and gets its own surrogate key because several rows now describe one member.",
        "dbt snapshots implement type 2 over a mutable source table. Each snapshot row has dbt_valid_from, the time it became valid, and dbt_valid_to, the time it was invalidated, which is NULL for the current row by default.",
        "Databases can do the same work themselves. A system-versioned temporal table, introduced in the SQL:2011 standard, moves the previous version of a row to a history table on every update and stamps it with the transaction's start time from the system clock. FOR SYSTEM_TIME AS OF then returns the values that were current at a given moment.",
        { callout: { label: "Key idea", text: "Valid from and valid to turn one row into a timeline. Reading the past is a filter on that period." } }],
      claims: ["time-and-history-type2", "time-and-history-dbt", "time-and-history-system-versioned", "time-and-history-as-of"],
    }),
    step({
      id: "snapshots", label: "Snapshots", kind: "mechanism", title: "A snapshot copies the whole table",
      caption: "Each daily snapshot holds every order as it stood that day. The query reads the copy of 2 December. Unchanged rows are stored again every day.",
      show: ["two", "ask", "base", "v1", "later", "snap", "t-snap", "ans-snap"], counters: ["2", "November", "a copy per day", "15"],
      rides: [ride("laneR", "r-5", "r-2", "as of 2 Dec")],
      body: ["A periodic snapshot fact table works at this grain. Its row summarises the measurement events of a standard period such as a day, a week or a month, and a row is typically inserted for every period even when nothing happened.",
        "Open table formats take a snapshot on every write. Each write to an Apache Iceberg table creates a new snapshot, or version, of the table, which can be used for time travel queries or as a rollback target. Delta Lake time travel queries an older snapshot of a table by timestamp or by version.",
        "A snapshot answers a question about a day with one read and no period logic. It cannot show a change that was made and reversed between two snapshots."],
      claims: ["time-and-history-periodic", "time-and-history-table-snapshots"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "How history is kept and governed",
      caption: "",
      show: ["two", "ask", "base", "v1", "later", "t-bi", "gov"], counters: ["2 on every version", "November", "kept for a retention period", "4"],
      rides: [ride("laneE", "e-3", "e-2", "return"), ride("laneR", "r-3", "r-3", "return")],
      body: [{ pair: {
        left: { label: "Keep history by", items: ["Overwriting: none kept", "Versioning: a row per change", "Snapshots: a copy per period"] },
        right: { label: "Govern it with", items: ["An audit trail of changes", "A retention period"] },
      } },
        "The return happened in the store on 2 December and was recorded on 3 December. A bitemporal table keeps both periods on every version: an application-time period for when the value applies, and system versioning for when the database held it. PostgreSQL 19 covers the application side with temporal keys, declared WITHOUT OVERLAPS.",
        "History is the audit trail. Microsoft lists auditing all data changes and data forensics among the uses of temporal tables, and MariaDB lists legal requirements to store data for a number of years. MariaDB guards the trail with a separate DELETE HISTORY privilege.",
        "History also has to end. SQL Server deletes closed versions older than a table's HISTORY_RETENTION_PERIOD, which is infinite unless set. Iceberg snapshots accumulate until they are expired, and an expired snapshot is no longer available for time travel. Delta Lake reaches 30 days back by default. Snowflake Time Travel keeps 1 day by default and at most 90 days.",
        "Where history holds personal data, the EU GDPR storage limitation principle applies: identifiable data is kept no longer than its purpose requires. The Digital Omnibus proposal to amend the GDPR was still in negotiation in late October 2026."],
      claims: ["time-and-history-bitemporal", "time-and-history-temporal-key", "time-and-history-audit", "time-and-history-retention", "time-and-history-time-travel-limits", "time-and-history-storage-limitation", "time-and-history-omnibus"],
    }),
  ],
  governance: { text: "History is the audit trail: versioned tables exist to audit every data change, and deleting history is a separate privilege. Retention rules end it. A retention period removes old versions and snapshots, and the EU GDPR storage limitation principle requires that identifiable personal data is not kept longer than necessary.", claims: ["time-and-history-audit", "time-and-history-retention", "time-and-history-storage-limitation"] },
  closing: {
    pitfalls: [
      "Grouping a report by load time when the question is about when the sale happened.",
      "Overwriting a value that a published report was built on, so the report can no longer be reproduced.",
      "Keeping versions or snapshots with no retention period, which stores personal data without an end date.",
    ],
    questions: [
      "Which two times does order 4471 carry, and which one puts it in the November report?",
      "How many rows do overwriting, versioning and daily snapshots store for the same three orders?",
      "What does a retention period remove, and what can no longer be answered afterwards?",
    ],
  },
});
