import { CANVAS, defineGuide, isoGrid, line, pill, prism, ride, step, stop, tank } from "@signal-path/engine";
import type { TankEl } from "@signal-path/engine";

const G = isoGrid(80, 150, 30);
type Seg = TankEl["segs"][number];
const pool = (id: string, segs: Seg[]) => tank(id, 13, -1.2, 2.4, 2.4, 185, 200, segs, { title: "Monthly spend", limit: "budget", group: id });
const scans: Seg = { label: "bytes scanned", value: 55, hue: "sky" };
const compute: Seg = { label: "compute time", value: 45, hue: "sand" };
const small: Seg = { label: "bytes scanned", value: 22, hue: "sky" };
const quick: Seg = { label: "compute time", value: 25, hue: "sand" };
const quiet: Seg = { label: "older data", value: 18, hue: "mint" };

export default defineGuide({
  id: "cost-and-workload-management", track: "data", module: "Operation", slug: "cost-and-workload-management",
  title: "Cost and workload management",
  summary: "Platform cost follows compute time and data scanned. Sizing, isolation, scheduling and storage tiers shape the bill.",
  forLeads: "A lower bill is useful only when workloads still meet their service needs and retention rules.",
  status: "draft", minutes: 7,
  counters: ["Bytes scanned", "Compute time", "Workloads", "Storage"],
  whatIf: { label: "What if every workload shared one pool?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso, note: "Amounts and workloads are illustrative",
    label: "A query and a scheduled load consume a shared capacity pool while recent and older order data occupy storage. Across the stops, the team measures a scan, sizes capacity, isolates workloads, schedules batch work and tiers data under the retention policy.",
    els: [
      line("work", [G.p(0, 0), G.p(5, 0), G.p(9, 0)], { always: true }),
      stop("start", ...G.p(0, 0), undefined, { always: true }),
      stop("mid", ...G.p(5, 0), undefined, { always: true }),
      stop("end", ...G.p(9, 0), undefined, { always: true }),
      prism("query", 0, -1, 1.2, 1.2, 28, { hue: "track", glyph: "search", title: "Finance query", sub: "orders by channel", at: "s", group: "query" }),
      prism("team", 4, 3, 1.2, 1.2, 28, { hue: "mint", glyph: "table", title: "Operations", sub: "isolated pool", at: "s", group: "isolate" }),
      pill("budget", [850, 85], "budget and chargeback", { group: "budget" }),
      pill("tier", [235, 440], "retention policy", { group: "tier" }),
      pill("recent", [230, 325], "recent orders", { group: "tier" }),
      pill("archive", [230, 365], "older orders", { group: "tier" }),
      pool("full", [scans, compute]),
      pool("pruned", [small, compute]),
      pool("sized", [small, quick]),
      pool("tiered", [small, quick, quiet]),
      line("isol", [G.p(5, 1.2), G.p(5, 3)], { group: "isolate" }),
    ],
  },
  steps: [
    step({ id: "shared", label: "Shared pool", kind: "problem", title: "A bill hides different kinds of demand", caption: "Finance scans every order column while a nightly load competes for the same compute. One total hides which workload drives bytes and runtime.", show: ["full", "query"], counters: ["many", "long", "shared", "hot"], rides: [ride("work", "start", "end", "orders")], body: ["FinOps creates financial accountability through collaboration between engineering, finance and business teams."], claims: ["cost-and-workload-management-finops"] }),
    step({ id: "scan", label: "Measure", kind: "idea", title: "Count bytes before the query runs", caption: "A dry run estimates bytes processed for an on-demand query. A maximum bytes billed setting can reject a query above its limit.", show: ["full", "query", "budget"], counters: ["estimated", "long", "shared", "hot"], rides: [ride("work", "start", "mid", "query")], body: ["A dry-run estimate is an upper bound and can exceed the bytes billed after execution. Billing budgets track actual costs against planned costs, and attributing capacity charges to projects supports internal chargeback."], claims: ["cost-and-workload-management-dry-run", "cost-and-workload-management-budget-control", "cost-and-workload-management-budgets"] }),
    step({ id: "prune", label: "Trim scan", kind: "mechanism", title: "Reduce the data a query reads", caption: "Query only the columns you need and filter on the partitioning column. On-demand queries are billed by bytes read.", show: ["pruned", "query", "budget"], counters: ["lower", "long", "shared", "hot"], rides: [ride("work", "start", "end", "selected columns")], body: ["When a query uses a qualifying filter on the partitioning column, BigQuery can scan the matching partitions and skip the rest. This is called pruning."], claims: ["cost-and-workload-management-pruning", "cost-and-workload-management-dry-run"] }),
    step({ id: "size", label: "Size capacity", kind: "mechanism", title: "Match capacity to observed demand", caption: "Reservations allocate compute capacity to workloads. Autoscaling scales capacity with demand, between a baseline and a maximum reservation size.", show: ["sized", "query", "budget"], counters: ["lower", "managed", "measured", "hot"], rides: [ride("work", "mid", "end", "capacity")], body: ["More slots can reduce query runtime, but adding capacity also increases costs. Measure performance and cost together when sizing."], claims: ["cost-and-workload-management-reservations", "cost-and-workload-management-autoscaling", "cost-and-workload-management-sizing"] }),
    step({ id: "schedule", label: "Separate work", kind: "watch-out", title: "Isolate workloads and schedule batch", caption: "Separate reservations can isolate teams or workload types. Schedule batch work when it suits its service needs and capacity plan.", show: ["sized", "isolate", "budget"], counters: ["lower", "managed", "separate", "hot"], rides: [ride("work", "mid", "end", "batch window")], body: ["BigQuery reservations allocate capacity between workloads, teams or departments, each as an isolated pool of resources. Isolation does not by itself reduce total demand."], claims: ["cost-and-workload-management-reservations", "cost-and-workload-management-finops"] }),
    step({ id: "tier", label: "Tier storage", kind: "decision", title: "Keep data for its required lifetime", caption: "", show: ["tiered", "isolate", "tier", "budget"], counters: ["lower", "managed", "separate", "tiered"], rides: [ride("work", "mid", "end", "retained data")], body: [{ pair: { left: { label: "Tune", items: ["Scan fewer bytes", "Size from observed demand", "Separate and schedule workloads"] }, right: { label: "Check", items: ["Budget and chargeback", "Service needs", "Retention before tiering or deletion"] } } }], claims: ["cost-and-workload-management-lifecycle", "cost-and-workload-management-finops"] }),
  ],
  governance: { text: "Set billing budgets and alerts to track spend against plan, and attribute capacity costs to projects for chargeback. Storage transitions and expiration must follow the applicable retention policy. In Amazon S3, whether expiration permanently removes an object depends on bucket versioning.", claims: ["cost-and-workload-management-budgets", "cost-and-workload-management-lifecycle"] },
  closing: { pitfalls: ["Treating a budget as a workload plan.", "Adding capacity without checking utilisation.", "Deleting data before its retention period ends."], questions: ["Which queries scan the most data?", "Which workloads need isolated capacity?", "What retention rule permits a tier change or deletion?"] },
});
