import { blocks, CANVAS, code, defineGuide, isoGrid, line, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// The floor: the orders table is a grid of blocks, one block per order, standing on the plate of the system that stores it.
// Checkout reaches one block down the rail on the left, through the index. Finance sends a scan along the rail in front of a grid.
// The second plate is the copy, fed by the rail that runs behind both plates. Slot 18, the front left corner, is the next free row:
// order 4474 lands there at the fifth stop. Each block is its own element, so a record can rest beside the grid.
const G = isoGrid(390, 140, 30);
const Z = 10, SIZE = 1, GAP = 0.15, PITCH = SIZE + GAP, COLS = 6, N = 24, SLOT = 18, HIT = 6;
const A0 = 0, B0 = 10.5, RX = -2.2, SCAN = 7.4, BACK = -3, LEG_A = 4, LEG_B = B0 + 2.9;
const W = COLS * PITCH - GAP, D = 4 * PITCH - GAP;
const mid = (row: number) => row * PITCH + SIZE / 2;
const LOW = 12, TALL = 30;
/** One state of a grid: which blocks stand tall, which one is lit and whether the last slot is still free. */
const grid = (id: string, gx: number, hue: Hue, o: { tall?: boolean; hot?: number; free?: boolean }): El[] =>
  Array.from({ length: N }, (_, i) => blocks(`${id}-${i}`, gx + (i % COLS) * PITCH, Math.floor(i / COLS) * PITCH, 1, SIZE,
    [i === SLOT && o.free ? { h: LOW, state: "closed" as const } : i === o.hot ? { h: TALL, hue, hot: true } : { h: o.tall ? TALL : LOW, hue }], { z: Z, group: id }));
const sql = (id: string, title: string, lines: string[], keywords: string[]): El =>
  raise(code(id, 0, 0, 226, lines, { title, keywords, group: id }), [150, 506], 30);
const jobs = (id: string, rows: number): El =>
  raise(table(id, 0, 0, 236, ["job", "rows", "writes"], [{ cells: ["one order", "1", "yes"], hot: rows === 1 }, { cells: ["a report", "all", "no"], hot: true }].slice(0, rows),
    { at: [12, 110, 170], rowH: 26, title: "Two jobs", group: id }), [780, 440], 30);
const plate = (gx: number) => slab(gx === A0 ? "oltp" : "olap", gx - 0.3, -0.3, W + 0.6, D + 0.6, undefined, gx === A0 ? { always: true } : { group: "olap" });

export default defineGuide({
  id: "operational-and-analytical-workloads", track: "data", module: "Analytical systems", slug: "operational-and-analytical-workloads",
  title: "Operational and analytical workloads",
  summary: "Serving one order means reaching one row through an index. A report reads every order to return a few totals. The two jobs compete on one system, so analytics runs on a copy in a system built for scans.",
  forLeads: "Separating the two workloads protects the systems that take orders from the queries that study them. The price is a second copy of the data, which lags the source and carries the same access, retention and erasure duties.",
  status: "draft", minutes: 7,
  counters: ["Systems", "Checkout reads", "The report reads", "Places holding emails"],
  whatIf: { label: "What if the report ran on the orders database?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and queries are illustrative",
    label: "The orders table is drawn as a grid of blocks on the plate of the operational database, one block per order. Checkout reaches a single block along a rail that passes through the index. Finance sends a report along a rail in front of the grid, and every block stands tall because every order is read. Then a second plate appears, the analytical platform, holding a copy of the grid. Orders travel across a copy rail between the plates, and the report scans the copy. At the end a new order is in the database and not yet in the copy, and access, retention and erasure are marked on the copy.",
    els: [
      // the operational database, its index and the path of one request
      plate(A0),
      pill("oltp-l", [452, 58], "Operational database", { tone: "track", glyph: "table", always: true }),
      ...grid("a-one", A0, "sand", { hot: HIT, free: true }),
      ...grid("a-scan", A0, "sand", { tall: true, free: true }),
      ...grid("a-new", A0, "sand", { hot: SLOT }),
      ...grid("a-full", A0, "sand", { hot: HIT }),
      prism("co", -7.7, mid(1) - 0.7, 1.4, 1.4, 30, { hue: "sand", glyph: "pen", title: "Checkout", sub: "one order at a time", at: "sw", always: true }),
      line("req", [G.p(-6.3, mid(1)), G.p(RX, mid(1)), G.p(RX, mid(3))], { always: true }),
      stop("r-idx", ...G.p(-4.7, mid(1)), undefined, undefined, { group: "anchor" }),
      stop("r-row", ...G.p(RX, mid(1)), undefined, undefined, { always: true }),
      stop("r-new", ...G.p(RX, mid(3)), undefined, undefined, { always: true }),
      prism("idx", -5.2, mid(1) - 0.5, 1, 1, 22, { hue: "paper", glyph: "tree", title: "Index", at: "n", always: true }),
      pill("wait", [98, 162], "waits for the scan", { tone: "alert", glyph: "clock", to: G.p(RX - 0.5, mid(1) + 0.3), group: "wait" }),

      // the report: one prism, a scan rail in front of each grid
      prism("fin", 8.3, SCAN - 0.6, 1.2, 1.2, 28, { hue: "sky", glyph: "chart", title: "Finance report", sub: "revenue by channel", at: "s", always: true }),
      line("scan-a", [G.p(8.3, SCAN), G.p(-0.3, SCAN)], { group: "scan-a" }),
      stop("sa-0", ...G.p(7.2, SCAN), undefined, undefined, { group: "scan-a" }),
      stop("sa-1", ...G.p(3.4, SCAN), undefined, undefined, { group: "scan-a" }),
      stop("sa-2", ...G.p(0.5, SCAN), undefined, undefined, { group: "scan-a" }),
      line("scan-b", [G.p(9.5, SCAN), G.p(B0 + W + 0.2, SCAN)], { group: "scan-b" }),
      stop("sb-0", ...G.p(10.6, SCAN), undefined, undefined, { group: "scan-b" }),
      stop("sb-1", ...G.p(B0 + 3.4, SCAN), undefined, undefined, { group: "scan-b" }),
      stop("sb-2", ...G.p(B0 + 6.1, SCAN), undefined, undefined, { group: "scan-b" }),
      sql("sql-one", "Checkout asks", ["select * from orders", "where order_id = 4471"], ["where"]),
      sql("sql-all", "Finance asks", ["select channel,", "  sum(amount)", "from orders", "group by channel"], ["sum", "group", "by"]),
      jobs("jobs1", 1), jobs("jobs2", 2),
      raise(table("busy", 0, 0, 236, ["request", "state"], [["Finance report", "scanning"], { cells: ["Checkout 4471", "waiting"], hot: true }], { at: [12, 150], rowH: 26, title: "Orders database", sub: "running now", tone: "alert", group: "busy" }), [780, 440], 30),

      // the analytical platform and the copy rail behind both plates
      plate(B0),
      pill("olap-l", [850, 478], "Analytical platform", { tone: "track", glyph: "layers", group: "olap" }),
      ...grid("b-scan", B0, "sky", { tall: true, free: true }),
      ...grid("b-full", B0, "sky", { tall: true }),
      line("copy", [G.p(LEG_A, -0.3), G.p(LEG_A, BACK), G.p(LEG_B, BACK), G.p(LEG_B, -0.3)], { group: "olap" }),
      stop("c-a", ...G.p(5.2, BACK), undefined, undefined, { group: "olap" }),
      stop("c-mid", ...G.p(7.3, BACK), undefined, undefined, { group: "anchor" }),
      stop("c-b", ...G.p(11.5, BACK), undefined, undefined, { group: "olap" }),
      prism("cp", 6.8, BACK - 0.5, 1, 1, 22, { hue: "track", glyph: "chevrons", title: "Copy", sub: "batch or change stream", at: "n", group: "olap" }),

      // the fifth and sixth stops: what the copy lacks and what it owes
      pill("late", [520, 304], "not copied yet", { to: [G.p(B0 + 0.3, mid(3))[0], G.p(B0 + 0.3, mid(3))[1] - Z - 6], group: "late" }),
      pill("g-acc", [770, 8], "Access", { glyph: "key", sub: "who may read emails", anchor: "start", group: "gov" }),
      pill("g-ret", [770, 56], "Retention", { glyph: "clock", sub: "no longer than necessary", anchor: "start", group: "gov" }),
      pill("g-era", [770, 104], "Erasure", { glyph: "x", sub: "reaches the copy too", anchor: "start", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "contend", label: "One system", kind: "problem", title: "A report slows the checkout",
      caption: "Finance runs a revenue report on the orders database. It reads every order, and Checkout's lookup of order 4471 waits behind it.",
      show: ["a-scan", "scan-a", "sql-all", "wait", "busy"], counters: ["1", "1 order, after a wait", "every order", "1"],
      rides: [ride("scan-a", "sa-0", "sa-2", "sum(amount)", { via: ["sa-1"] }), ride("req", 0, "r-row", "4471", { via: ["r-idx"], tone: "alert" })],
      body: ["Aggregate calculations over millions of individual transactions are very resource-intensive for an OLTP system. They can be slow to run, and they can slow the database down by blocking other transactions.",
        "The orders database at Vinterhus exists to take orders. Any tangible delay in that work has a negative effect on the day-to-day operations of the business."],
      claims: ["operational-and-analytical-workloads-contention", "operational-and-analytical-workloads-oltp"],
    }),
    step({
      id: "one", label: "One order", kind: "idea", title: "Serving one order touches one row",
      caption: "An operational request names one order. The index leads to its row, the row is read or written, and the request ends. The database handles large numbers of these independently.",
      show: ["a-one", "sql-one", "jobs1"], counters: ["1", "1 order, by index", "not running", "1"],
      rides: [ride("req", 0, "r-row", "4471", { via: ["r-idx"], then: "row 4471" })],
      body: ["Online transaction processing, OLTP, records business interactions as they occur. Its data is highly normalised, carries primary and secondary indexes and ACID guarantees, and its workload is heavy on writes with moderate reads.",
        "With an index the database does not scan the table. It might only have to walk a few levels deep into a search tree.",
        { callout: { label: "Key idea", text: "Row-oriented databases are efficient at looking up individual records. PostgreSQL and MySQL are databases of this kind." } }],
      claims: ["operational-and-analytical-workloads-oltp", "operational-and-analytical-workloads-index", "operational-and-analytical-workloads-layout", "operational-and-analytical-workloads-engines"],
    }),
    step({
      id: "all", label: "Every order", kind: "mechanism", title: "A report scans every order",
      caption: "An analytical query asks about all orders at once. It reads a significant part of the table, uses two of its columns and returns one total per channel.",
      show: ["a-scan", "scan-a", "sql-all", "jobs2"], counters: ["1", "1 order, by index", "every order", "1"],
      rides: [ride("scan-a", "sa-0", "sa-2", "sum(amount)", { via: ["sa-1"], then: "3 totals" })],
      body: ["Analytical workloads are characterised by complex, relatively long-running queries that process significant portions of the stored dataset, for example aggregations over entire tables or joins between several large tables.",
        "The floor shows 23 orders. ClickHouse states that analytics queries routinely process billions and trillions of rows.",
        { callout: { label: "Key idea", text: "An index does not help a query that needs every row. The cost of a scan is set by how much data it has to read." } }],
      claims: ["operational-and-analytical-workloads-analytical", "operational-and-analytical-workloads-scale", "operational-and-analytical-workloads-index"],
    }),
    step({
      id: "split", label: "Two systems", kind: "mechanism", title: "Each job gets its own system",
      caption: "Orders are copied from the operational database into an analytical platform. Finance scans the copy, and Checkout keeps its fast path to one row.",
      show: ["a-one", "olap", "b-scan", "scan-b", "sql-all"], counters: ["2", "1 order, by index", "every order, in the copy", "2"],
      rides: [ride("copy", "c-a", "c-b", "4471", { via: ["c-mid"] }), ride("scan-b", "sb-0", "sb-2", "sum(amount)", { via: ["sb-1"], then: "3 totals" }), ride("req", 0, "r-row", "4471", { via: ["r-idx"], then: "row 4471" })],
      body: ["Online analytical processing, OLAP, enables intricate queries without disrupting transactional systems. OLAP databases are optimised for heavy-read and low-write tasks and often preserve historical data.",
        "Analytical engines are built for the scan. DuckDB processes a large batch of values in one operation, BigQuery stores each column separately, and ClickHouse is a column-oriented database. Column-oriented databases are particularly efficient at scanning individual columns over an entire dataset.",
        "The copy is made by a pipeline. PostgreSQL logical replication sends changes to subscribers as they occur and names consolidating databases for analytics as a typical use."],
      claims: ["operational-and-analytical-workloads-olap", "operational-and-analytical-workloads-copy", "operational-and-analytical-workloads-engines", "operational-and-analytical-workloads-layout"],
    }),
    step({
      id: "duties", label: "The copy", kind: "watch-out", title: "The copy lags and holds personal data",
      caption: "Order 4474 is in the database and not yet in the copy. The copy also holds customer emails, so access rules, retention and erasure apply there too.",
      show: ["a-new", "olap", "b-scan", "scan-b", "late", "gov"], counters: ["2", "1 order, by index", "every order copied so far", "2, both under the same duties"],
      rides: [ride("req", 0, "r-new", "new 4474", { via: ["r-idx"], then: "row 4474" }), ride("scan-b", "sb-0", "sb-2", "sum(amount)", { via: ["sb-1"], then: "3 totals" })],
      body: ["Transactions constantly update the data in OLTP systems. OLAP data stores typically refresh at much slower intervals, depending on business needs, so a report answers as of the last refresh.",
        "Giving users direct access to a database has drawbacks that include security management and access control. A semantic model over the analytical copy can enforce row-level security.",
        { callout: { label: "EU GDPR, checked 26 November 2026", text: "Storage is processing. Personal data is kept no longer than necessary, with appropriate security, and a data subject can obtain its erasure from the controller without undue delay where a listed ground applies." } }],
      claims: ["operational-and-analytical-workloads-refresh", "operational-and-analytical-workloads-access", "operational-and-analytical-workloads-duties"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Which system for which job",
      caption: "",
      show: ["a-full", "olap", "b-full", "scan-b", "gov"], counters: ["2", "1 order, by index", "every order, in the copy", "2, erased in both"],
      rides: [ride("copy", "c-a", "c-b", "erase s.o@…", { via: ["c-mid"] }), ride("req", 0, "r-row", "4471", { via: ["r-idx"], then: "row 4471" }), ride("scan-b", "sb-0", "sb-2", "sum(amount)", { via: ["sb-1"], then: "3 totals" })],
      body: [{ pair: {
        left: { label: "Operational database", items: ["Point lookups and writes", "One row, by index", "The current state"] },
        right: { label: "Analytical engine", items: ["Scans and aggregates", "Many rows, few columns", "A governed copy"] },
      } },
        "Some platforms serve both jobs. Hybrid transactional and analytical processing, HTAP, runs OLTP and OLAP on the same platform and removes the need for multiple copies of the data and separate systems.",
        "Snowflake hybrid tables are one example: a row store optimised for index-based random reads and writes, beside standard tables in columnar micro-partitions that are expected to perform better on large analytical queries."],
      claims: ["operational-and-analytical-workloads-htap", "operational-and-analytical-workloads-oltp", "operational-and-analytical-workloads-olap", "operational-and-analytical-workloads-duties"],
    }),
  ],
  governance: { text: "Analytics runs on copies of operational data. Under the EU GDPR, storing personal data is processing, so the copy is held to the same storage limitation, security and erasure rules as the source.", claims: ["operational-and-analytical-workloads-duties", "operational-and-analytical-workloads-copy"] },
  closing: {
    pitfalls: [
      "Running reports on the database that takes the orders.",
      "Reading a report as live when the copy was last refreshed hours ago.",
      "Erasing a customer in the source and leaving the email in the analytical copy.",
    ],
    questions: [
      "Why does an index help Checkout and not the revenue report?",
      "What does the business gain, and what does it take on, when analytics moves to a copy?",
      "Which of your analytical copies hold personal data, and who can read them?",
    ],
  },
});
