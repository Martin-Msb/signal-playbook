import { CANVAS, blocks, code, defineGuide, isoGrid, line, list, pawn, pill, plot, prism, raise, ride, series, slab, step, table } from "@signal-path/engine";
import type { BlocksEl, Pt } from "@signal-path/engine";

// The floor: a team's query runs down the main rail, past the workload manager, to the query engine and on to billing.
// The engine reads the orders table in front of it: twelve months along the floor, four files in each month.
// The plan stands behind the rail, the bill stands at the right.
const G = isoGrid(170, 130, 30);
const PLAN: Pt = [600, 168];
const BILL: Pt = [838, 335];
const JULY = 6;

type Mode = "raw" | "all" | "cols" | "month" | "bad" | "sorted";
const SUB: Record<Mode, string> = {
  raw: "48 CSV files, 48 TB", all: "48 CSV files, 48 TB", cols: "48 Parquet files, 12 TB",
  month: "one partition a month", bad: "not sorted by product", sorted: "sorted by product",
};
/** The orders table: a column of four files for each month. Tall and coloured files are read, low ones are skipped. */
const files = (group: string, mode: Mode, z = 10) => {
  const items: BlocksEl["items"] = Array.from({ length: 48 }, (_, i) => {
    const month = i % 12, file = Math.floor(i / 12);
    if (mode === "raw") return { h: 22, hue: "paper" as const };
    if (mode === "all") return { h: 22, hot: true };
    if (mode === "cols") return { h: 12, hot: true };
    if (mode === "bad") return { h: 12, state: "alert" as const };
    const read = mode === "month" ? month === JULY : file === 3;
    return read ? { h: 12, hot: true } : { h: 4, hue: "paper" as const };
  });
  return blocks(`files-${group}`, 4, 5, 12, 0.65, items, { gap: 0.15, z, title: "orders table", sub: SUB[mode], at: "sw", group });
};
const plan = (id: string, title: string, items: Parameters<typeof list>[4]) =>
  raise(list(id, 0, 0, 216, items, { title, group: id }), PLAN, 20);
const bill = (id: string, title: string, cols: string[], rows: Parameters<typeof table>[5], at: number[], foot?: string, w = 216) =>
  raise(table(id, 0, 0, w, cols, rows, { at, title, foot, group: id }), BILL, 30);

export default defineGuide({
  id: "case-a-platform-bill-that-tracks-usage", track: "case", module: "Use cases", slug: "a-platform-bill-that-tracks-usage",
  title: "A platform bill that tracks usage",
  summary: "A data platform bill is taken apart: storage and compute are billed separately, every query carries its owner's tag, and the orders table is laid out so that queries skip most of it. Then the month's costliest query is traced and its table rebuilt.",
  forLeads: "The bill follows the data scanned, not the number of users. It comes under control when every charge has an owner and the layout of the large tables matches the filters of the queries that read them.",
  status: "draft", minutes: 12,
  counters: ["One query scans", "Charge names", "Limit on spend", "Table in storage"],
  whatIf: { label: "What if the table stayed as CSV files?", step: 3, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Sizes, prices, budgets and query counts are illustrative",
    label: "A team's query travels along a rail to a query engine, which reads an orders table of 48 files, four for each month, and sends a charge on to billing. Later stops put the files on object storage, add a workload manager that tags queries and holds budgets, rewrite the files as partitioned Parquet, and add a daily revenue table that is built once. A plan board shows how many files each query scans and a bill board shows who is charged.",
    els: [
      line("m1", [G.p(1.5, 0), G.p(8.4, 0)], { always: true }),
      line("m2", [G.p(9.6, 0), G.p(15.5, 0)], { always: true }),
      line("scan", [G.p(9, 0.6), G.p(9, 4.6)], { always: true }),
      prism("billing", 15.5, -0.6, 1.2, 1.2, 22, { hue: "sand", glyph: "scale", title: "Billing", at: "e", always: true }),
      pawn("fin", 0, 0, "Finance", undefined, { group: "fin" }),
      pawn("ops", 0, 0, "Operations", undefined, { hue: "rose", group: "ops" }),

      // Problem: one warehouse, one invoice line, every file read.
      prism("wh", 8.4, -0.6, 1.2, 1.2, 32, { hue: "sand", glyph: "table", title: "Warehouse", sub: "one cluster, always on", at: "e", group: "wh" }),
      files("raw0", "raw", 0),
      files("all0", "all", 0),
      raise(code("sql", 0, 0, 216, ["SELECT channel,", "  sum(amount)", "FROM orders", "WHERE month = 7"], { title: "Finance asks", keywords: ["SELECT", "FROM", "WHERE"], group: "sql" }), PLAN, 20),
      raise(plot("growth", 0, 0, 216, 124, [0, 15], [0, 230], { title: "A year of invoices", xt: [0, 12], xtl: ["last July", "July"], yt: [100, 200], ytl: ["1x", "2x"], group: "growth" }), BILL, 30),
      series("users", "growth", "line", [[0, 100], [12, 120]], { tone: "muted", dashed: true, label: "users", group: "growth" }),
      series("cost", "growth", "line", [[0, 100], [3, 116], [6, 140], [9, 168], [12, 200]], { label: "bill", labelAt: 2, group: "growth" }),
      bill("bill-one", "Invoice, July", ["charge", "amount"], [{ cells: ["data platform", "82,000"], hot: true }], [12, 140], "owner: none"),

      // Architecture.
      slab("store", 3.7, 4.6, 12.5, 4.1, undefined, { group: "split" }),
      pill("store-name", [16, 402], "Object storage", { sub: "paid per terabyte held", glyph: "layers", tone: "track", anchor: "start", group: "split" }),
      prism("engine", 8.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "search", title: "Query engine", sub: "starts on demand", at: "e", group: "split" }),
      files("all", "all"),
      bill("bill-split", "Invoice, July", ["charge", "amount"], [["storage", "6,000"], { cells: ["compute", "76,000"], hot: true }], [12, 140]),

      prism("gate", 2.8, -0.6, 1.2, 1.2, 16, { hue: "mint", glyph: "key", title: "Workload manager", sub: "platform team", at: "n", group: "gate" }),
      prism("gate-alert", 2.8, -0.6, 1.2, 1.2, 16, { hue: "mint", glyph: "key", title: "Workload manager", sub: "Operations over budget", at: "n", state: "alert", group: "gate-alert" }),
      bill("bill-tags", "Compute by owner", ["owner", "spent", "budget"], [["Finance", "14,000", "15,000"], ["Support", "9,000", "10,000"], { cells: ["Operations", "41,000", "20,000"], hot: true }, ["data team", "12,000", "15,000"]], [12, 102, 158]),

      files("cols", "cols"),
      raise(table("parquet", 0, 0, 254, ["product", "order", "channel", "amount"], [["SOFA-2210", "4468", "web", "640.00"], ["LAMP-0312", "4469", "app", "49.00"], ["RUG-1178", "4470", "web", "129.00"]], { at: [10, 84, 144, 196], columnHues: [undefined, undefined, "sky", "sky"], title: "One Parquet file", mono: true, group: "parquet" }), PLAN, 20),
      bill("cost-cols", "This query", ["measure", "value"], [["scans", "6 TB"], ["costs", "30.00"], ["charged to", "Finance"]], [12, 118]),

      files("month", "month"),
      plan("plan-all", "Query plan", ["aggregate by channel", "filter: July", { t: "scan: 48 of 48 files", hot: true, tone: "alert" }]),
      plan("plan-month", "Query plan", ["aggregate by channel", "filter: July", { t: "scan: 4 of 48 files", hot: true }]),
      bill("cost-month", "This query", ["measure", "value"], [["scans", "0.5 TB"], ["costs", "2.50"], ["charged to", "Finance"]], [12, 118]),

      line("reuse", [G.p(9, 2.5), G.p(15, 2.5), G.p(15, 4.6)], { group: "mv" }),
      blocks("daily", 14.3, 5, 2, 0.65, [{ h: 10, hue: "mint" }, { h: 10, hue: "mint" }, { h: 10, hue: "mint" }, { h: 10, hue: "mint" }], { gap: 0.15, z: 10, title: "Daily revenue", sub: "built once, reused", at: "se", group: "mv" }),
      plan("plan-daily", "Dashboard query plan", ["read daily revenue", { t: "31 rows, no file scan", hot: true }, "refresh: the new day only"]),
      bill("cost-daily", "Dashboard query", ["measure", "value"], [["scans", "31 rows"], ["costs", "under 0.01"], ["charged to", "Finance"]], [12, 118]),

      // Execution.
      bill("charges", "Charges, by tag", ["query", "owner", "cost"], [{ cells: ["July revenue", "Finance", "2.50"], hot: true }, ["daily board", "Finance", "0.01"], ["tickets", "Support", "1.20"]], [12, 112, 172]),
      files("bad", "bad"),
      blocks("deletes", 4.12, 8.05, 12, 0.4, Array.from({ length: 12 }, () => ({ h: 7, state: "alert" as const })), { gap: 0.4, z: 10, group: "deletes" }),
      plan("plan-bad", "Query plan", ["count returns", "filter: SOFA-2210", { t: "scan: 48 files, 12 deletes", hot: true, tone: "alert" }]),
      bill("top", "Costliest queries, July", ["query", "owner", "cost"], [{ cells: ["SOFA returns", "Operations", "3,720"], hot: true }, ["stock export", "Operations", "1,100"], ["July revenue", "Finance", "310"]], [12, 106, 184], undefined, 236),
      files("sorted", "sorted"),
      plan("plan-good", "Query plan", ["count returns", "filter: SOFA-2210", { t: "scan: 12 of 48 files", hot: true }]),
      bill("top-after", "After the rebuild", ["query", "owner", "cost"], [["stock export", "Operations", "1,100"], { cells: ["SOFA returns", "Operations", "930"], hot: true }, ["July revenue", "Finance", "310"]], [12, 106, 184], undefined, 236),
    ],
  },
  steps: [
    step({
      id: "bill", label: "The bill", kind: "problem", phase: "problem", title: "The bill doubled in a year",
      caption: "The data platform costs 82,000 a month, up from 41,000. The number of users grew by a fifth. The invoice is one line.",
      show: ["fin", "wh", "files-raw0", "raw0", "sql", "growth"], counters: ["unknown", "nobody", "none", "48 TB of CSV files"],
      rides: [ride("cost", 0, 1, "41,000", { then: "82,000" })],
      body: ["The cost did not follow the head count. Something else grew: the data, the number of queries, or the amount of data each query reads.",
        "FinOps is the practice of creating financial accountability for technology spend. It starts by making the spend visible to the teams that cause it."],
      claims: ["cost-and-workload-management-finops"],
    }),
    step({
      id: "blind", label: "Full scan", kind: "problem", phase: "problem", title: "Every query reads the whole table",
      caption: "Finance asks for July revenue by channel. The warehouse reads all 48 files to answer. The charge joins one shared bill with no owner.",
      show: ["fin", "wh", "all0", "plan-all", "bill-one"], counters: ["48 TB", "nobody", "none", "48 TB of CSV files"],
      rides: [ride("m1", 0, 0.68, "July sales?"), ride("scan", 0, 0.475, "48 TB", { tone: "alert" }), ride("m2", 0, 0.58, "240.00", { then: "owner?", tone: "alert" })],
      body: ["A query plan is a tree. Scan nodes at the bottom return raw rows, and filters and aggregations sit above them. Here the scan has nothing to skip, so the filter on July runs after every row has been read.",
        "The warehouse holds the data and runs the queries as one product. Where storage and processing are coupled, one cannot be resized without the other.",
        { callout: { label: "The gap", text: "The bill shows a total. It does not show who ran what, or how much data each query touched." } }],
      claims: ["query-execution-plan-tree", "separating-storage-from-compute-coupled", "warehouses-lakes-and-lakehouses-warehouse"],
    }),
    step({
      id: "split", label: "Two meters", kind: "mechanism", phase: "architecture", title: "Storage and compute are billed apart",
      caption: "The files move to object storage, paid for by the terabyte held. A query engine starts on demand and is paid for by the work it does.",
      show: ["fin", "split", "all", "plan-all", "bill-split"], counters: ["48 TB", "storage or compute", "none", "48 TB of CSV files"],
      rides: [ride("scan", 0, 0.475, "48 TB"), ride("m2", 0, 0.58, "compute 240")],
      concepts: ["separating-storage-from-compute", "warehouses-lakes-and-lakehouses"],
      body: ["Elastic compute over cloud object storage decouples the two, so each scales on its own. Storage is charged per terabyte held, and compute only while it is working.",
        "Files on object storage are a data lake: an engine such as Trino reads them directly. A compute cluster can be started, stopped and resized at any time.",
        "The split invoice already says something: storage is 6,000 of the 82,000. The problem is compute."],
      claims: ["separating-storage-from-compute-decoupled", "separating-storage-from-compute-billing", "separating-storage-from-compute-on-demand", "warehouses-lakes-and-lakehouses-lake"],
    }),
    step({
      id: "tags", label: "Tags", kind: "mechanism", phase: "architecture", title: "Every workload carries its owner's tag",
      caption: "The platform team runs a workload manager. It tags each query with its team and holds a budget for each. The compute bill splits by owner.",
      show: ["fin", "split", "gate", "all", "plan-all", "bill-tags"], counters: ["48 TB", "the owner's tag", "a budget per owner", "48 TB of CSV files"],
      rides: [ride("m1", 0, 0.68, "July sales?", { via: [0.1], then: "tag finance" }), ride("m2", 0, 0.58, "Finance 240")],
      concepts: ["cost-and-workload-management", "platform-architecture-and-operating-model"],
      body: ["Budgets track actual cost against planned cost and raise alerts at thresholds. Attributing compute charges to the place where the queries run supports internal chargeback.",
        "The division of labour is an operating model. The platform team provides the self-serve infrastructure and enforces the rules automatically. Each domain team owns its data and answers for its spend.",
        "Capacity can also be reserved in isolated pools, one per workload or team, so one team's queries do not consume another's."],
      claims: ["cost-and-workload-management-budgets", "cost-and-workload-management-reservations", "platform-architecture-and-operating-model-platform", "platform-architecture-and-operating-model-federated-governance", "platform-architecture-and-operating-model-mesh-ownership"],
    }),
    step({
      id: "columns", label: "Columns", kind: "mechanism", phase: "architecture", title: "Columnar files let a query read two columns",
      caption: "Rewritten as Parquet, each file stores its values column by column, encoded and compressed. The query reads channel and amount and skips the rest.",
      show: ["fin", "split", "gate", "cols", "parquet", "cost-cols"], counters: ["6 TB", "the owner's tag", "a budget per owner", "12 TB of Parquet"],
      rides: [ride("scan", 0, 0.475, "48 TB", { then: "6 TB" }), ride("m2", 0, 0.58, "Finance 30")],
      concepts: ["file-formats-and-encoding", "columnar-storage"],
      body: ["CSV writes each record on a line, so a reader takes whole rows. Parquet is column oriented: the chunks of one column are contiguous, and the file metadata gives the start of every chunk, so a reader goes straight to the columns it wants.",
        "Parquet defines dictionary and run-length encodings and compresses the pages, which is why the same orders take less space.",
        "Querying only the columns needed is a documented cost practice."],
      claims: ["file-formats-and-encoding-csv", "file-formats-and-encoding-columnar", "file-formats-and-encoding-footer", "columnar-storage-locations", "columnar-storage-encodings", "columnar-storage-compression", "cost-and-workload-management-pruning"],
    }),
    step({
      id: "prune", label: "Partitions", kind: "mechanism", phase: "architecture", title: "Partitions let the engine skip eleven months",
      caption: "A table format records which files hold which month. The plan filters on July, so the scan opens 4 files of 48.",
      show: ["fin", "split", "gate", "month", "plan-month", "cost-month"], counters: ["0.5 TB", "the owner's tag", "a budget per owner", "12 TB, partitioned by month"],
      rides: [ride("scan", 0, 0.475, "6 TB", { then: "0.5 TB" }), ride("m2", 0, 0.58, "Finance 2.50")],
      concepts: ["partitioning-clustering-and-pruning", "query-execution", "warehouses-lakes-and-lakehouses"],
      body: ["Iceberg groups similar rows when writing and turns a query's predicate into a partition predicate, so files that cannot match are skipped. The person writing the query does not need to know how the table is partitioned.",
        "A lakehouse keeps the files in an open format on object storage and adds a metadata layer that defines which files make up the table. An optimiser pushes the filter down to the scan.",
        "Pruned partitions are left out of the bytes a query is billed for."],
      claims: ["partitioning-clustering-and-pruning-partition-transform", "partitioning-clustering-and-pruning-prune", "partitioning-clustering-and-pruning-cost", "query-execution-plan-tree", "query-execution-duckdb-optimiser", "warehouses-lakes-and-lakehouses-lakehouse", "warehouses-lakes-and-lakehouses-iceberg"],
    }),
    step({
      id: "reuse", label: "Built once", kind: "mechanism", phase: "architecture", title: "A result asked for often is built once",
      caption: "A daily revenue table is kept beside the orders. Each night adds the one new day. Dashboards read 31 rows and scan no files.",
      show: ["fin", "split", "gate", "mv", "month", "plan-daily", "cost-daily"], counters: ["31 rows", "the owner's tag", "a budget per owner", "12 TB and a daily table"],
      rides: [ride("reuse", 0, 0.6, "add 1 day"), ride("reuse", 1, 0.22, "31 rows")],
      concepts: ["incremental-processing-and-materialisation"],
      body: ["An incremental model transforms only the new or changed rows on each run instead of the whole source. A unique key lets a rerun replace a day instead of adding it twice.",
        "A materialised view stores the result of its query. Refreshed incrementally, it processes only what changed since the last refresh.",
        "A full refresh rebuilds the table from all the data, which is the way back when the logic was wrong."],
      claims: ["incremental-processing-and-materialisation-cost", "incremental-processing-and-materialisation-key", "incremental-processing-and-materialisation-materialised-view", "incremental-processing-and-materialisation-dynamic-table", "incremental-processing-and-materialisation-backfill"],
    }),
    step({
      id: "ordinary", label: "A query", kind: "mechanism", phase: "execution", title: "A Finance query costs 2.50",
      caption: "Tagged for Finance, the July query passes the budget check, reads 4 files and is charged to its owner.",
      show: ["fin", "split", "gate", "mv", "month", "plan-month", "charges"], counters: ["0.5 TB", "Finance", "a budget per owner", "12 TB and a daily table"],
      rides: [ride("m1", 0, 0.68, "July sales?", { via: [0.1], then: "tag finance" }), ride("scan", 0, 0.475, "0.5 TB"), ride("m2", 0, 0.58, "Finance 2.50")],
      concepts: ["cost-and-workload-management", "query-execution"],
      body: ["The same question cost 240.00 against the CSV files. Nothing about the question changed. The plan did.",
        "A dry run estimates the bytes a query will process before it runs, and a limit on bytes billed can refuse a query whose estimate is too high."],
      claims: ["cost-and-workload-management-dry-run", "cost-and-workload-management-budget-control", "query-execution-many-ways"],
    }),
    step({
      id: "costliest", label: "Costliest", kind: "watch-out", phase: "execution", title: "The costliest query belongs to Operations",
      caption: "It counts returns of one product every six hours. The table is not sorted by product, so each run reads all 48 files and 12 delete files left by returns.",
      show: ["ops", "split", "gate-alert", "mv", "bad", "deletes", "plan-bad", "top"], counters: ["6 TB, 124 times", "Operations", "Operations over budget", "12 TB and 12 delete files"],
      rides: [ride("m1", 0, 0.68, "returns?", { via: [0.1], then: "tag: ops" }), ride("scan", 0, 0.475, "6 TB", { tone: "alert" }), ride("m2", 0, 0.58, "30 x 124", { then: "ops 3,720", tone: "alert" })],
      concepts: ["cost-and-workload-management", "row-level-changes-and-table-maintenance", "query-execution"],
      body: ["The tag leads from the bill to the team, and the plan shows the cause: the filter is on product, and the partitions are by month, so no file can be skipped.",
        "A return changes a row in a file that cannot be changed. In Iceberg, data files are immutable and row-level deletes are written to separate delete files, which every later read must apply.",
        "A budget alert fires when actual cost crosses a threshold."],
      claims: ["query-execution-plan-tree", "query-execution-explain-analyze", "row-level-changes-and-table-maintenance-deletes", "cost-and-workload-management-budgets"],
    }),
    step({
      id: "rebuild", label: "Rebuild", kind: "decision", phase: "execution", title: "A rebuild sorts each month by product",
      caption: "",
      show: ["ops", "split", "gate", "mv", "sorted", "plan-good", "top-after"], counters: ["1.5 TB, 124 times", "Operations", "budget and a bytes limit", "12 TB, compacted and sorted"],
      rides: [ride("scan", 0, 0.475, "6 TB", { then: "1.5 TB" }), ride("m2", 0, 0.58, "7.50 x 124", { then: "ops 930" })],
      concepts: ["row-level-changes-and-table-maintenance", "partitioning-clustering-and-pruning", "platform-architecture-and-operating-model"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["A tag on every query", "A budget for every owner", "Layout matched to filters"] },
        right: { label: "Do not rely on", items: ["One shared bill", "Asking teams to scan less", "A larger cluster"] },
      } },
        "Operations owns the query and the platform team owns the maintenance job. Rewriting the data files merges the delete files into them and combines small files, and the rewrite sorts each month by product.",
        "With the files sorted, the lower and upper bounds kept for each file show which ones can hold SOFA-2210. The scan opens one file a month.",
        "Adding capacity makes a query finish sooner and raises the cost. It does not reduce the data read."],
      claims: ["row-level-changes-and-table-maintenance-compact", "partitioning-clustering-and-pruning-cluster", "partitioning-clustering-and-pruning-statistics", "platform-architecture-and-operating-model-mesh-functions", "cost-and-workload-management-sizing", "cost-and-workload-management-budget-control"],
    }),
  ],
  governance: { text: "Scan size is spend, so the layout of a table is a cost control. Budgets sit on workloads, and every charge is attributable to an owner.", claims: ["partitioning-clustering-and-pruning-cost", "cost-and-workload-management-budgets", "cost-and-workload-management-budget-control"] },
  closing: {
    pitfalls: [
      "Reading the bill as a head count problem when it follows the data scanned.",
      "Partitioning a table by a column its heaviest query does not filter on.",
      "Letting delete files and small files pile up between maintenance runs.",
    ],
    questions: [
      "Which part of the invoice changed when the files became Parquet?",
      "Why did partitioning by month not help the Operations query?",
      "Who should pay for the rebuild: the platform team or Operations?",
    ],
  },
});
