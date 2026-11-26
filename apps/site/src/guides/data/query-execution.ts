import { blocks, CANVAS, code, defineGuide, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: two tables as blocks, orders on the left and returns at the back. The plan is built on the floor between them:
// a scan in front of each table, a join where the two rails meet, an aggregate, and the result on a board at the end.
// Rows ride the rails from the tables to the result. Later stops split the scan over three lanes and mark the node whose
// row count is far from its estimate.
const G = isoGrid(310, 52, 30);
const LANE = [3.8, 6, 8.2], MAIN = 6, RET = 12.7;
const O0 = 1, OUT = 5.95, SCAN = 6.2, MERGE = 9.7, JOIN = 12, AGG = 17.5, END = 24.5;
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

/** The orders table: three rows of chunks, one row in front of each lane. */
const orders = (group: string, hues: Hue[]): El[] => LANE.map((gy, i) =>
  blocks(`o${i}-${group}`, O0, gy - 0.5, 4, 1, [0, 1, 2, 3].map(() => ({ h: 18, hue: hues[i] })), { gap: 0.25, group }));
const scan = (id: string, lane: number, group: string, extra = {}): El =>
  prism(id, SCAN, LANE[lane] - 0.5, 1, 1, 26, { hue: "track", glyph: "search", group, ...extra });
const join = (id: string, group: string, title: string, sub: string): El =>
  prism(id, JOIN, MAIN - 0.7, 1.4, 1.4, 34, { hue: "track", glyph: "merge", title, sub, at: "sw", group });
const BOARD: Pt = [540, 186];

export default defineGuide({
  id: "query-execution", track: "data", module: "Analytical systems", slug: "query-execution",
  title: "Query execution",
  summary: "An engine turns SQL into a plan: a tree of scans, joins and aggregations chosen by estimated cost and run in parallel. Reading that plan, with true row counts beside the estimates, is how a slow query is diagnosed.",
  forLeads: "A slow query is a plan problem before it is a hardware problem. Ask for the plan, then decide between one large machine and a cluster, and put limits on what each team may run at once.",
  status: "draft", minutes: 7,
  counters: ["Plan", "Join", "Orders scanned by", "Rows out of the join"],
  whatIf: { label: "What if returns were scanned again for every order?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Tables, costs and row counts are illustrative",
    label: "Two tables stand on the floor as blocks: orders with six million rows and returns with four hundred thousand. Finance asks in SQL for refunds by channel. At first a single route runs from orders to returns, travelled once per order. Then the plan is built: a scan in front of each table, a join where their rails meet, an aggregate, and a result board with three rows. A board lists three candidate plans with costs and marks the hash join as cheapest. The orders scan then splits into three lanes that meet at an exchange. A board of estimated and actual row counts marks the join, which emitted nine million rows against an estimate of four hundred thousand. Last, a board of resource groups shows Finance at its limit with one query queued.",
    els: [
      raise(code("sql", 0, 0, 292, ["SELECT o.channel, SUM(r.amount)", "FROM orders o", "JOIN returns r", "  ON r.order_no = o.order_no", "GROUP BY o.channel"], { keywords: ["SELECT", "FROM", "JOIN", "ON", "GROUP", "BY", "SUM"], title: "Finance asks", sub: "refunds by channel", always: true }), [176, 524], 12),
      pawn("fin", 15.6, 13.2, "Finance", undefined, { always: true }),

      ...orders("o-plain", ["sand", "sand", "sand"]),
      ...orders("o-split", ["sky", "sand", "mint"]),
      pill("orders-l", [100, 84], "orders", { sub: "6M rows", glyph: "table", always: true }),
      blocks("returns", RET - 0.5, -5, 3, 1, [0, 1, 2].map(() => ({ h: 18, hue: "rose" as Hue })), { gap: 0.25, dir: "gy", always: true }),
      pill("returns-l", [800, 92], "returns", { sub: "400k rows", glyph: "table", always: true }),

      // 1. no plan: every order walks to returns and the table is scanned again
      line("naive", [G.p(OUT, MAIN), G.p(RET, MAIN), G.p(RET, -0.9)], { group: "naive" }),
      stop("n-corner", ...G.p(RET, MAIN), undefined, undefined, { group: "naive" }),
      pill("naive-l", up(RET + 1.8, 4.2, 0), "once per order", { glyph: "loop", anchor: "start", sub: "6M scans of returns", group: "naive" }),

      // 2 to 6. the plan on the floor
      line("main", [G.p(OUT, MAIN), G.p(END, MAIN)], { group: "plan" }),
      line("ret", [G.p(RET, -0.9), G.p(RET, MAIN - 0.7)], { group: "plan" }),
      stop("s-o", ...G.p(OUT + 0.2, MAIN), undefined, undefined, { group: "anchor" }),
      stop("s-x", ...G.p(8.8, MAIN), undefined, undefined, { group: "anchor" }),
      stop("s-jin", ...G.p(JOIN - 1.6, MAIN), undefined, undefined, { group: "anchor" }),
      stop("s-jout", ...G.p(JOIN + 1.8, MAIN), undefined, undefined, { group: "anchor" }),
      stop("s-ain", ...G.p(AGG - 2.1, MAIN), undefined, undefined, { group: "anchor" }),
      stop("s-aout", ...G.p(AGG + 2.5, MAIN), undefined, undefined, { group: "anchor" }),
      stop("s-end", ...G.p(AGG + 3.2, MAIN), undefined, undefined, { group: "anchor" }),
      stop("r-0", ...G.p(RET, -0.7), undefined, undefined, { group: "anchor" }),
      stop("r-in", ...G.p(RET, 3.3), undefined, undefined, { group: "anchor" }),
      prism("scan-r", RET - 0.5, 0.2, 1, 1, 26, { hue: "track", glyph: "search", title: "Scan returns", at: "e", group: "plan" }),
      scan("scan-1", 1, "scan1", { title: "Scan orders", at: "sw" }),
      scan("scan-3", 1, "scan3"), scan("scan-a", 0, "scan3"),
      scan("scan-b", 2, "scan3", { title: "Scan orders", sub: "one lane per core", at: "sw" }),
      line("lane-a", [G.p(OUT, LANE[0]), G.p(MERGE, LANE[0]), G.p(MERGE, MAIN)], { group: "scan3" }),
      line("lane-b", [G.p(OUT, LANE[2]), G.p(MERGE, LANE[2]), G.p(MERGE, MAIN)], { group: "scan3" }),
      stop("s-merge", ...G.p(MERGE, MAIN), "exchange", undefined, { at: "s", group: "scan3" }),
      join("join-0", "join0", "Join", "method not chosen"),
      join("join-h", "joinh", "Hash join", "built on returns"),
      prism("agg", AGG, MAIN - 0.7, 1.4, 1.4, 34, { hue: "track", glyph: "stack", title: "Aggregate", sub: "sum by channel", at: "sw", group: "plan" }),
      raise(table("result", 0, 0, 156, ["channel", "refunded"], [["web", "31,400"], ["app", "12,900"], ["store", "8,200"]], { at: [12, 86], rowH: 24, title: "Result", sub: "3 rows", group: "plan" }), G.p(END, MAIN), 26),

      // the boards: candidate plans, measured plan, resource groups
      raise(list("cands", 0, 0, 262, [{ t: "nested loop    cost 9,400k", strike: true }, { t: "merge join     cost   310k", strike: true }, { t: "hash join      cost    96k", hot: true }], { title: "Candidate plans", sub: "estimated cost", mono: true, group: "cands" }), BOARD, 26),
      raise(table("explain", 0, 0, 262, ["node", "estimated", "actual"], [["Aggregate", "3", "3"], { cells: ["Hash join", "400k", "9M"], hot: true }, ["Scan orders", "6M", "6M"], ["Scan returns", "400k", "400k"]], { at: [14, 124, 204], rowH: 21, title: "EXPLAIN ANALYZE", sub: "rows", mono: true, group: "explain" }), BOARD, 26),
      pill("bad", [652, 306], "22 times the estimate", { tone: "alert", anchor: "start", to: G.p(JOIN + 2.6, MAIN), group: "explain" }),
      pill("rg-l", [452, 508], "third query waits", { glyph: "clock", anchor: "start", group: "rg" }),
      raise(table("rg", 0, 0, 262, ["group", "running", "queued"], [{ cells: ["finance", "2 of 2", "1"], hot: true }, ["support", "1 of 2", "0"]], { at: [14, 124, 204], rowH: 24, title: "Resource groups", sub: "limit per team", group: "rg" }), BOARD, 26),
    ],
  },
  steps: [
    step({
      id: "no-plan", label: "No plan", kind: "problem", title: "SQL names the result, not the method",
      caption: "Finance asks for refunds by channel. The query can be executed in many ways that give the same result. The plainest scans returns again for every order.",
      show: ["o-plain", "naive"], counters: ["none chosen", "returns scanned per order", "1 core", "unknown"],
      rides: [ride("naive", 0.04, 0.86, "4468", { via: ["n-corner"], then: "scan again" })],
      body: ["A given SQL query can be executed in a wide variety of different ways, each of which produces the same set of results. The text of the query does not choose among them.",
        "In a nested loop join the right relation is scanned once for every row found in the left relation. The strategy is easy to implement and can be very time consuming."],
      claims: ["query-execution-many-ways", "query-execution-nested-loop"],
    }),
    step({
      id: "plan", label: "Plan", kind: "idea", title: "A plan is a tree of scans, joins and aggregations",
      caption: "Scan nodes at the bottom return raw rows from each table. A join node and an aggregate node above them turn six million orders into three rows.",
      show: ["o-plain", "plan", "scan1", "join0"], counters: ["tree of 4 nodes", "method not chosen", "1 core", "unknown"],
      rides: [ride("main", "s-o", "s-end", "rows", { via: ["s-aout"], then: "3 rows" }), ride("ret", "r-0", "r-in", "rows")],
      body: ["The structure of a query plan is a tree of plan nodes. Nodes at the bottom level are scan nodes that return raw rows from a table. Joining, aggregation and sorting are further nodes above the scan nodes.",
        "DuckDB reaches this tree in stages: a parser, a binder that resolves tables and columns against the catalog, a logical planner, an optimiser, and a physical plan generator that converts the logical operator tree into a tree of physical operators.",
        { callout: { label: "Key idea", text: "Every engine in this guide, on one machine or many, runs some version of this tree." } }],
      claims: ["query-execution-plan-tree", "query-execution-duckdb-phases"],
    }),
    step({
      id: "optimise", label: "Optimise", kind: "mechanism", title: "The optimiser picks the cheapest plan it can estimate",
      caption: "It costs each candidate from table statistics. Here a hash join wins: returns is loaded into a hash table, then each order probes it.",
      show: ["o-plain", "plan", "scan1", "joinh", "cands"], counters: ["cheapest of 3", "hash join", "1 core", "400k estimated"],
      rides: [ride("ret", "r-0", "r-in", "build"), ride("main", "s-o", "s-jin", "probe")],
      body: ["Where it is computationally feasible, the PostgreSQL optimiser examines each possible execution plan and selects the one expected to run the fastest. Choosing the right plan for the query and the data is, in its documentation's words, absolutely critical for good performance.",
        "A cost-based optimiser works from statistics. Trino uses table statistics provided by connectors to estimate the costs of different join orders and picks the order with the lowest computed cost. The order in which joins are executed can have a significant impact on performance.",
        "In a hash join one input is scanned and loaded into a hash table keyed on the join attributes. The other input is then scanned, and each row is looked up in the hash table.",
        "Optimisers also move work towards the scan. DuckDB pushes filters down into the query plan and reorders joins using dynamic programming. The Polars lazy API applies filters as early as possible at scan level and selects only the columns that are needed."],
      claims: ["query-execution-cheapest", "query-execution-critical", "query-execution-trino-cbo", "query-execution-hash-join", "query-execution-duckdb-optimiser", "query-execution-polars-pushdown"],
    }),
    step({
      id: "parallel", label: "Parallel", kind: "mechanism", title: "The plan runs in parallel",
      caption: "Three cores scan orders at once, each pushing batches of column values up the plan. A distributed engine runs the same stages as tasks on worker machines.",
      show: ["o-split", "plan", "scan3", "joinh", "cands"], counters: ["cheapest of 3", "hash join", "3 cores", "400k estimated"],
      rides: [ride("lane-a", 0.03, 0.47, "batch"), ride("main", "s-o", "s-x", "batch"), ride("lane-b", 0.03, 0.47, "batch")],
      body: ["Vectorised execution: DuckDB uses a columnar-vectorised engine in which a large batch of values, a vector, is processed in one operation. Its documentation states that this greatly reduces the overhead of systems that process each row sequentially. Its chunks of data are pushed through the operator tree.",
        "Across cores: PostgreSQL can devise query plans that use multiple CPUs, in which every background worker executes the parallel portion of the plan. Polars divides the workload among the available CPU cores.",
        "Across machines: Trino breaks execution into a hierarchy of stages. A stage is implemented as a series of tasks distributed over a network of workers, tasks operate on splits, which are sections of a larger data set, and exchanges transfer data between nodes for different stages of a query.",
        { callout: { label: "Cost of moving data", text: "Spark's shuffle redistributes data across partitions. It is an expensive operation since it involves disk I/O, data serialisation and network I/O." } }],
      claims: ["query-execution-vectorised", "query-execution-push", "query-execution-pg-parallel", "query-execution-polars-cores", "query-execution-trino-stages", "query-execution-trino-exchange", "query-execution-shuffle"],
    }),
    step({
      id: "read-plan", label: "Read the plan", kind: "watch-out", title: "The plan shows where the time goes",
      caption: "`EXPLAIN ANALYZE` runs the query and prints true row counts beside the estimates. The join was estimated at 400,000 rows and emitted 9 million.",
      show: ["o-split", "plan", "scan3", "joinh", "explain"], counters: ["cheapest of 3", "hash join", "3 cores", "400k estimated, 9M actual"],
      rides: [ride("main", "s-jout", "s-ain", "9M rows", { tone: "alert" })],
      body: ["With the `ANALYZE` option, PostgreSQL's `EXPLAIN` actually executes the query and displays the true row counts and true run time accumulated within each plan node, along with the estimates. The thing that is usually most important to look for is whether the estimated row counts are reasonably close to reality.",
        "Estimates come from statistics that are always approximate, even when freshly updated, and table row counts usually contain somewhat out-of-date values.",
        "Trino's `EXPLAIN ANALYZE` executes the statement and shows the distributed execution plan along with the cost of each operation. Spark's Adaptive Query Execution uses runtime statistics to choose the most efficient plan, and its documentation notes that data skew can severely downgrade the performance of join queries.",
        { callout: { label: "Where to look", text: "Find the node where estimated and actual rows part ways. Everything above it was planned for the wrong amount of data." } }],
      claims: ["query-execution-explain-analyze", "query-execution-estimates", "query-execution-stats-approx", "query-execution-trino-explain", "query-execution-aqe", "query-execution-skew"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "One machine or a cluster",
      caption: "",
      show: ["o-split", "plan", "scan3", "joinh", "rg"], counters: ["cheapest of 3", "hash join", "3 cores", "400k estimated, 9M actual"],
      rides: [ride("main", "s-o", "s-end", "rows", { via: ["s-aout"], then: "3 rows" })],
      body: [{ pair: {
        left: { label: "Single-node engine", items: ["DuckDB, Polars", "Work divided among the CPU cores"] },
        right: { label: "Distributed engine", items: ["Spark, Trino", "Stages run as tasks on workers", "A shuffle costs disk and network I/O"] },
      } },
        "DuckDB does not run as a separate process by default: it is embedded within a host process. A distributed engine adds a coordinator, which in Trino parses statements, plans queries and manages the worker nodes.",
        "A shared engine needs limits. In Trino a query belongs to a single resource group and consumes resources from that group. When the group runs out of a resource, running queries do not fail and new queries are queued."],
      claims: ["query-execution-duckdb-embedded", "query-execution-polars-cores", "query-execution-trino-coordinator", "query-execution-trino-stages", "query-execution-shuffle", "query-execution-resource-groups"],
    }),
  ],
  governance: { text: "In Trino a query belongs to a single resource group and consumes resources from that group. When the group runs out, running queries do not fail and new queries are queued, so Finance at its limit waits without taking capacity from Support.", claims: ["query-execution-resource-groups"] },
  closing: {
    pitfalls: [
      "Adding machines to a query before reading its plan.",
      "Trusting row estimates when the table statistics are stale.",
      "Running every team's queries in one pool with no limits or queue.",
    ],
    questions: [
      "Which nodes sit at the bottom of a query plan, and what do they return?",
      "What does EXPLAIN ANALYZE show that a plain EXPLAIN does not?",
      "What happens to a new query when its resource group has run out of a resource?",
    ],
  },
});
