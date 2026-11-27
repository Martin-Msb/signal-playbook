import { CANVAS, blocks, defineGuide, isoGrid, line, pill, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(480, 178, 34);
const months = [
  { key: "jan", name: "January", gy: -1.5, hue: "sky" as const },
  { key: "feb", name: "February", gy: 2, hue: "mint" as const },
  { key: "mar", name: "March", gy: 5.5, hue: "track" as const },
];
const makePartition = (group: string, active?: string, clustered = false) => months.flatMap((m) =>
  [0, 1].map((row) => blocks(`${m.key}-${row}-${group}`, -3.6 + row * 2.1, m.gy, 4, 0.9,
    [0, 1, 2, 3].map((i) => ({ h: active && active !== m.key ? 8 : clustered ? 25 + (i % 2) * 4 : 18, hue: m.hue, state: active && active !== m.key ? "closed" as const : undefined })),
    { gap: 0.13, group })),
);
const labelY = (gx: number, gy: number, lift = 24): [number, number] => {
  const p = G.p(gx, gy);
  return [p[0], p[1] - lift];
};

export default defineGuide({
  id: "partitioning-clustering-and-pruning", track: "data", module: "Storage", slug: "partitioning-clustering-and-pruning",
  title: "Partitioning, clustering and pruning",
  summary: "Organising a table by the columns queries filter on lets the engine skip most of the data.",
  forLeads: "Partitioning and clustering trade write and metadata work for fewer bytes scanned. The filters that actually prune data should match how people query it.",
  status: "draft", minutes: 7,
  counters: ["Layout", "Orders read", "Filter used", "Scan cost"],
  whatIf: { label: "What if the table stayed unsorted?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and scan counts are illustrative",
    label: "A table of orders arrives mixed together. The orders are first grouped by month, then clustered by customer within each month. A query for one month and one customer enters the table, partition transforms and metadata exclude irrelevant partitions and blocks, and the engine reads only the matching files and pages. A separate access policy controls which rows a person may see.",
    els: [
      prism("engine", 8, -2, 1.1, 1.1, 28, { hue: "paper", glyph: "search", title: "Query engine", sub: "March, customer 22", at: "s", group: "query" }),
      line("scan", [[908, 118], [858, 172], [770, 204], [700, 257], [630, 289]], { group: "rail" }),
      stop("s-engine", 908, 118, undefined, undefined, { group: "rail" }),
      stop("s-march", 630, 289, undefined, undefined, { group: "rail" }),
      pill("month-jan", [118, 190], "January", { group: "labels" }),
      pill("month-feb", [118, 310], "February", { group: "labels" }),
      pill("month-mar", [118, 430], "March", { group: "labels" }),
      pill("all-label", [480, 475], "order files", { group: "mixed" }),
      pill("partition-label", [480, 475], "month partitions", { group: "partition" }),
      pill("cluster-label", [480, 475], "sorted by customer", { group: "cluster" }),
      pill("stats-label", [480, 475], "min and max metadata", { group: "stats" }),
      pill("access-label", [480, 475], "access policy is separate", { group: "access" }),
      ...makePartition("mixed"),
      ...makePartition("partition"),
      ...makePartition("cluster", "mar", true),
      ...makePartition("stats", "mar", true),
      ...makePartition("access", "mar", true),
      pill("month-january", [240, 425], "January", { group: "partition-labels" }),
      pill("month-february", [480, 425], "February", { group: "partition-labels" }),
      pill("month-march", [720, 425], "March", { group: "partition-labels" }),
    ],
  },
  steps: [
    step({
      id: "mixed", label: "Mixed files", kind: "problem", title: "The query reads every order",
      caption: "Finance asks for March orders from customer 22. The files mix dates and customers, so the engine has no useful boundary to skip.",
      show: ["mixed", "query", "rail"], counters: ["mixed files", "all 24", "none", "full scan"],
      rides: [ride("scan", "s-engine", "s-march", "March order")],
      body: ["The month labels and scan count in this scene are illustrative. Without useful organisation or metadata, a filter may leave the reader considering every file."],
      claims: ["partitioning-clustering-and-pruning-prune"],
    }),
    step({
      id: "partition", label: "Partition", kind: "idea", title: "Group values by a partition transform",
      caption: "A transform maps each order date to a month. Writers place rows with the same transformed value together, so query filters can rule out other months.",
      show: ["partition", "partition-labels", "query", "rail"], counters: ["partitioned by month", "8 of 24", "date", "fewer bytes"],
      rides: [ride("scan", "s-engine", "s-march", "March")],
      body: ["Iceberg supports year, month, day and hour transforms for timestamps. It tracks the relationship to the source date so queries need not name the physical partition field.", { callout: { label: "Key idea", text: "The filter is translated into the physical layout." } }],
      claims: ["partitioning-clustering-and-pruning-partition-transform", "partitioning-clustering-and-pruning-prune", "partitioning-clustering-and-pruning-cost"],
    }),
    step({
      id: "cluster", label: "Cluster", kind: "mechanism", title: "Sort within the selected month",
      caption: "March still holds many orders. Clustering sorts them into storage blocks by customer, so a filter on customer scans only the relevant blocks.",
      show: ["cluster", "partition-labels", "query", "rail", "cluster-label"], counters: ["month + customer", "4 of 24", "date, customer", "fewer bytes"],
      rides: [ride("scan", "s-engine", "s-march", "customer 22")],
      body: ["BigQuery sorts blocks by the chosen cluster columns. With multiple columns, their order determines which columns take precedence when data is sorted into blocks."],
      claims: ["partitioning-clustering-and-pruning-cluster"],
    }),
    step({
      id: "metadata", label: "Statistics", kind: "mechanism", title: "Metadata rules out pages and blocks",
      caption: "A Parquet page index holds lower and upper bounds for each page. If customer 22 lies outside the bounds, the reader skips the page. BigQuery prunes blocks using block metadata.",
      show: ["stats", "partition-labels", "query", "rail", "stats-label"], counters: ["month + customer", "2 of 24", "min/max statistics", "lower scan"],
      rides: [ride("scan", "s-engine", "s-march", "matching range")],
      body: ["Parquet page indexes store lower and upper bounds for the values of each page, which readers can use to skip pages when scanning. BigQuery uses the filter expression and block metadata to prune the blocks a query scans."],
      claims: ["partitioning-clustering-and-pruning-statistics", "partitioning-clustering-and-pruning-cluster"],
    }),
    step({
      id: "access", label: "Access", kind: "watch-out", title: "A pruned scan is not an access rule",
      caption: "The query scans less, but a tenant filter is not automatically a permission. A row policy decides which rows a user can see.",
      show: ["access", "partition-labels", "query", "rail", "access-label"], counters: ["month + customer", "2 of 24", "policy + filter", "lower scan"],
      rides: [ride("scan", "s-engine", "s-march", "permitted rows")],
      body: ["BigQuery row-level security gives access to specific rows based on qualifying user conditions. Row-level access policy filters do not participate in query pruning on partitioned and clustered tables."],
      claims: ["partitioning-clustering-and-pruning-access"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choose a layout from real filters",
      caption: "",
      show: ["stats", "partition-labels", "query", "rail", "stats-label"], counters: ["month + customer", "2 of 24", "date, customer", "lower scan"],
      rides: [ride("scan", "s-engine", "s-march", "one range")],
      body: [{ pair: {
        left: { label: "Partition", items: ["Coarse, stable filter such as event month", "A useful boundary for scan scope"] },
        right: { label: "Cluster and prune", items: ["Sort for frequent selective filters", "Use metadata to skip ranges that cannot match"] },
      } }, "Scan size is spend: BigQuery leaves pruned partitions out of the bytes scanned. Row-level access policies stay explicit, and their filters take no part in pruning."],
      claims: ["partitioning-clustering-and-pruning-cost", "partitioning-clustering-and-pruning-access"],
    }),
  ],
  governance: { text: "Scan size is spend: BigQuery leaves pruned partitions out of the bytes scanned, which in general reduces query cost. Pruning is not an access rule. Row-level access policies decide which rows a user can see, and their filters take no part in pruning.", claims: ["partitioning-clustering-and-pruning-cost", "partitioning-clustering-and-pruning-access"] },
  closing: {
    pitfalls: [
      "Creating many tiny partitions that add metadata overhead.",
      "Clustering on values that queries rarely filter.",
      "Treating a partition filter as an access policy.",
    ],
    questions: [
      "How does a query filter map to a partition transform?",
      "What extra pruning can clustering provide inside a partition?",
      "Which separate control decides what rows a user may see?",
    ],
  },
});
