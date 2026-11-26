import { blocks, CANVAS, defineGuide, isoGrid, line, list, pawn, pill, prism, raise, ride, slab, step, stop } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// The floor: data is sky blocks, compute is blocks in the track colour.
// First every node keeps its own blocks on a local disk behind it. Then the blocks move onto one object storage plate at the back,
// and engines stand in front of it, each on its own rail. Engines come and go. The blocks stay.
// Each object is its own blocks element, so a record can rest on a rail in front of the plate.
const G = isoGrid(350, 95, 30), Z = 10;
const OLD = [0.3, 4.9, 9.5, 14.1], COL = [2, 6.5, 11], RAIL = [2.9, 7.5, 11.9];
const NODE = 8.7, EDGE = 1.4, NEAR = 3.6, FAR = 6.1;
const up = (gx: number, gy: number, dy: number): [number, number] => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

/** A node of the coupled cluster: compute in front, its local disk right behind it. */
const node = (k: number, sub: string, full = 4): El[] => [
  prism(`node${k}`, OLD[k], 6.8, 1.8, 1.8, 34, { hue: "track", glyph: "gear", title: `Node ${k + 1}`, sub, at: "s", group: "coupled" }),
  blocks(`disk${k}`, OLD[k], 4.8, 2, 0.8, [0, 1, 2, 3].map((i) => ({ h: 20, hue: "sky" as const, state: i < full ? undefined : "closed" as const })), { gap: 0.2, group: "coupled" }),
];
/** One object on the storage plate. Row 0 is the front row, row 1 the back row that arrives when storage grows. */
const object = (k: number, row: 0 | 1, group: string, hot = false): El =>
  blocks(`o${row}-${k}-${group}`, 1 + k * 1.1, row === 0 ? 0.1 : -1.3, 1, 0.8, [{ h: hot ? 30 : 18, hue: "sky", hot }], { z: Z, group });
const READ = [1, 2];
const objects: El[] = [
  ...Array.from({ length: 12 }, (_, k) => (READ.includes(k) ? [object(k, 0, "rest"), object(k, 0, "read", true)] : [object(k, 0, "objs")])).flat(),
  ...Array.from({ length: 12 }, (_, k) => object(k, 1, "grow")),
];
const rail = (k: number, group: string, closed = false): El[] => [
  line(group, [G.p(RAIL[k], EDGE), G.p(RAIL[k], NODE)], { group, state: closed ? "closed" : undefined }),
  ...(closed ? [] : [stop(`a${k}`, ...G.p(RAIL[k], NEAR), undefined, undefined, { group }), stop(`z${k}`, ...G.p(RAIL[k], FAR), undefined, undefined, { group })]),
];
const engine = (id: string, sub: string, group: string, closed = false): El =>
  prism(id, COL[0], NODE, 1.8, 1.8, 34, { hue: closed ? undefined : "track", glyph: "search", title: "Finance warehouse", sub, at: "s", state: closed ? "closed" : undefined, group });
const bill = (id: string, items: Parameters<typeof list>[4]): El =>
  raise(list(id, 0, 0, 214, items, { title: "The bill", sub: "per month", mono: true, group: id }), [806, 508], 26);

export default defineGuide({
  id: "separating-storage-from-compute", track: "data", module: "Analytical systems", slug: "separating-storage-from-compute",
  title: "Separating storage from compute",
  summary: "Durable object storage holds the data. Compute that keeps nothing but a cache attaches when there is work, so each side scales on its own and is paid for on its own.",
  forLeads: "The data bill follows the volume kept and the compute bill follows the work done. One storage layer is also one place to encrypt, log access and enforce retention.",
  status: "draft", minutes: 7,
  counters: ["Data lives on", "Compute running", "Storage grows by", "Paid for"],
  whatIf: { label: "What if each node kept its own disk?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Nodes, objects and bill lines are illustrative",
    label: "Three database nodes each keep order data on a local disk, drawn as blue blocks behind each node. A fourth node is bought only for its disk, and data shifts onto it. Then the blocks move onto one object storage plate, and the nodes are switched off while the data stays. A Finance warehouse starts on a query, reads two objects and suspends. Storage doubles without any compute, while an elastic cluster and a serverless engine read the same objects. A resumed warehouse has an empty cache and reads over the network again. At the last stop, encryption, access logging and retention are marked on the storage plate. A bill card shows storage and compute on separate lines.",
    els: [
      // 1. the coupled cluster: every node is compute and disk together
      ...node(0, "CPU and disk"), ...node(1, "CPU and disk"), ...node(2, "CPU and disk"), ...node(3, "bought for its disk", 2),
      line("bal", [G.p(-1.4, 3.2), G.p(14.2, 3.2)], { group: "coupled" }),
      ...[0, 1, 2, 3].map((k) => stop(`b${k}`, ...G.p(OLD[k] - 0.8, 3.2), undefined, undefined, { group: "coupled" })),
      pill("full", [470, 118], "Disks full", { sub: "CPU half idle", anchor: "start", group: "coupled" }),
      bill("bill1", [{ t: "4 nodes  all day", hot: true }, { t: "disk     in the node", mute: true }]),

      // 2 to 6. one storage plate at the back, engines in front
      slab("store", 0.5, -1.8, 14, 3.2, undefined, { group: "store" }),
      pill("store-l", [372, 40], "Object storage", { tone: "track", glyph: "stack", sub: "S3 API", anchor: "end", group: "store" }),
      ...objects,
      pill("zones", [760, 150], "Copies in 3 zones", { glyph: "layers", to: up(12.6, -1.2, 12), group: "zones" }),

      // 2. the old nodes, switched off, and the data on its way out
      ...COL.map((c, k) => prism(`off${k}`, c, NODE, 1.8, 1.8, 34, { title: `Node ${k + 1}`, sub: "switched off", at: "s", state: "closed", group: "off" })),
      ...rail(0, "r0"), ...rail(0, "r0x", true), ...rail(1, "r1"), ...rail(2, "r2"),

      // 3. compute attaches on demand
      pawn("fin", -1, 5, "Finance", "Sales by channel?", { side: "w", group: "ask" }),
      engine("wh", "starts on a query", "wh"), engine("wh-off", "suspended", "wh-off", true), engine("wh-cold", "resumed", "cold"),
      bill("bill2", ["storage  12 objects", { t: "compute  none", mute: true }]),
      bill("bill3", ["storage  12 objects", { t: "compute  4 minutes", hot: true }]),

      // 4. each side grows alone
      blocks("cluster", COL[1], NODE, 2, 0.9, [0, 1, 2, 3].map(() => ({ h: 34, hue: "track" as const })), { gap: 0.2, title: "Elastic cluster", sub: "4 nodes, 1 hour", at: "s", group: "many" }),
      prism("sls", COL[2] + 0.2, NODE, 1.4, 1.4, 24, { hue: "track", glyph: "play", title: "Serverless engine", sub: "paid per query", at: "s", group: "many" }),
      pill("grew", [700, 120], "24 objects", { sub: "no compute added", to: up(10.4, -1.3, 22), group: "grew" }),
      bill("bill4", [{ t: "storage  24 objects", hot: true }, "cluster  1 hour", "queries  3"]),
      bill("bill5", ["storage  24 objects", { t: "compute  4 minutes", hot: true }]),

      // 5. the distance between the two
      blocks("cache", 5, NODE - 0.4, 2, 0.9, [{ h: 14, state: "closed" }, { h: 14, state: "closed" }], { gap: 0.2, group: "cold" }),
      pill("cache-l", [322, 322], "Cache empty", { sub: "dropped on suspend", anchor: "start", group: "cold" }),
      pill("net", up(4.6, 4.4, 0), "Network", { glyph: "globe", sub: "on every read", anchor: "start", group: "cold" }),

      // 6. the controls sit on the storage layer
      pill("enc", [560, 40], "Encrypted at rest", { glyph: "lock", to: up(4.6, -1.5, 12), group: "gov" }),
      pill("log", [704, 96], "Access log", { glyph: "eye", sub: "requests recorded", to: up(8.4, -1.5, 12), group: "gov" }),
      pill("keep", [836, 168], "Retention", { glyph: "clock", sub: "lock, then expire", to: up(12.6, -1.5, 12), group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "coupled", label: "Coupled", kind: "problem", title: "Each node carries its own disk",
      caption: "Vinterhus keeps its orders on three nodes with local disks. The disks are full, so a fourth node is bought for its disk, its CPU comes with it, and data shifts across.",
      show: ["coupled", "bill1"], counters: ["node disks", "4 nodes, always", "adding a node", "nodes, all day"],
      rides: [ride("bal", "b1", "b3", "rebalance", { via: ["b2"] })],
      body: ["Dremel at Google began on shared-nothing servers, each keeping a disjoint subset of the data on local disks. Its authors list what that coupling cost: the system could not be resized without shifting data around, and scaling storage required adding servers and scaling CPU as well.",
        "The data was also locked in. It could be reached only through the engine that owned the disks."],
      claims: ["separating-storage-from-compute-coupled"],
    }),
    step({
      id: "apart", label: "Apart", kind: "idea", title: "The data moves to object storage",
      caption: "The order files become objects in one shared store, which keeps copies in several zones. Every node can be switched off and the data is still there.",
      show: ["store", "objs", "rest", "zones", "off", "r1", "bill2"], counters: ["object storage", "none", "adding objects", "storage only"],
      rides: [ride("r1", "z1", "a1", "12 objects")],
      body: ["An object store keeps each file as an object under a key in a bucket. In its standard storage class Amazon S3 stores objects on multiple devices across at least three Availability Zones, so durability belongs to the store and no longer to the query engine.",
        "The S3 API is offered well beyond AWS. Ceph exposes an API compatible with the basic data access model of S3, Cloudflare R2 implements the S3 API, and Trino reads Amazon S3 and compatible stores, of which it tests AWS S3 and MinIO.",
        { callout: { label: "Key idea", text: "Compute that keeps no data of its own is stateless. It can be stopped, resized or replaced without touching the data." } }],
      claims: ["separating-storage-from-compute-decoupled", "separating-storage-from-compute-objects", "separating-storage-from-compute-zones", "separating-storage-from-compute-s3-api"],
    }),
    step({
      id: "attach", label: "On demand", kind: "mechanism", title: "Compute attaches when there is work",
      caption: "Finance asks for sales by channel. A warehouse starts, reads the two objects the query needs, answers and suspends. Compute is billed for the minutes it ran.",
      show: ["store", "objs", "read", "zones", "ask", "wh", "r0", "bill3"], counters: ["object storage", "1 warehouse", "adding objects", "storage, plus 4 minutes"],
      rides: [ride("r0", "a0", "z0", "2 objects")],
      body: ["Snowflake keeps persisted data in a central repository that every compute node can reach. Its warehouses can be started and stopped at any time, and one that sits idle is suspended automatically.",
        "A warehouse is billed only while it works. Snowflake bills per second, with a 60-second minimum each time the warehouse starts."],
      claims: ["separating-storage-from-compute-central", "separating-storage-from-compute-on-demand", "separating-storage-from-compute-per-second"],
    }),
    step({
      id: "scale", label: "Scale apart", kind: "mechanism", title: "Each side grows without the other",
      caption: "A year of orders doubles the store and adds no compute. For the nightly job an elastic cluster runs for an hour. A serverless engine reads the same objects with nothing provisioned.",
      show: ["store", "objs", "rest", "grow", "grew", "wh-off", "r0x", "many", "r1", "r2", "bill4"], counters: ["object storage", "1 cluster, 1 engine", "adding objects", "storage and compute apart"],
      rides: [ride("r1", "a1", "z1", "24 objects"), ride("r2", "a2", "z2", "1 object")],
      body: ["Elastic compute services analyse data in cloud storage, and because compute is decoupled from storage each can scale independently. BigQuery states the same of its own architecture.",
        "Each Snowflake warehouse is an independent cluster that does not affect the others, and a multi-cluster warehouse starts and stops clusters as the load changes.",
        "Amazon Athena queries data directly in Amazon S3 with SQL. It is serverless: there is no infrastructure to manage and the charge is for the queries run.",
        "The bill splits the same way. Snowflake charges storage at a flat rate per terabyte and compute by use, and BigQuery charges for compute and storage separately."],
      claims: ["separating-storage-from-compute-decoupled", "separating-storage-from-compute-bigquery", "separating-storage-from-compute-central", "separating-storage-from-compute-elastic", "separating-storage-from-compute-serverless", "separating-storage-from-compute-billing"],
    }),
    step({
      id: "distance", label: "Distance", kind: "watch-out", title: "Every read crosses the network",
      caption: "The data is no longer beside the CPU. A running warehouse keeps a cache of what it has read, and suspending drops it, so the first query after a resume is slower.",
      show: ["store", "objs", "read", "grow", "zones", "ask", "cold", "r0", "bill5"], counters: ["object storage", "1 warehouse, cold", "adding objects", "storage, plus 4 minutes"],
      rides: [ride("r0", "a0", "z0", "2 objects")],
      body: ["When Dremel first read from disaggregated storage, queries ran an order of magnitude slower. Closing the gap took work on the storage format, the metadata, query affinity and prefetching, after which the disaggregated system outperformed the one on local disks for typical workloads.",
        "Snowflake states the trade plainly: suspending a warehouse saves credits and drops its cache of table data, which may slow the first queries after it resumes."],
      claims: ["separating-storage-from-compute-latency", "separating-storage-from-compute-cache"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What the separation gives and needs",
      caption: "",
      show: ["store", "objs", "rest", "grow", "wh", "r0", "many", "r1", "r2", "gov", "bill4"], counters: ["object storage", "3 engines, on demand", "adding objects", "storage and compute apart"],
      rides: [ride("r0", "a0", "z0", "2 objects"), ride("r2", "a2", "z2", "1 object")],
      body: [{ pair: {
        left: { label: "It gives", items: ["Storage and compute sized apart", "Many engines on one copy", "One place for controls"] },
        right: { label: "It needs", items: ["Caching near the compute", "Suspend rules for idle compute", "Access granted at the store"] },
      } },
        "Amazon S3 encrypts every new object with SSE-S3 as the base level for every bucket, and has done so since 5 January 2023. Requests can be recorded with CloudTrail, server access logs or both.",
        "Object Lock holds objects write-once for a retention period, and a Lifecycle expiration rule deletes them when their time is up. Buckets and objects are private until access is granted."],
      claims: ["separating-storage-from-compute-encryption", "separating-storage-from-compute-logging", "separating-storage-from-compute-retention", "separating-storage-from-compute-private", "separating-storage-from-compute-cache", "separating-storage-from-compute-on-demand"],
    }),
  ],
  governance: { text: "Every engine reads the same objects, so the storage layer is the one place to control them. Amazon S3 encrypts each new object by default, can log requests, and can lock objects for a retention period.", claims: ["separating-storage-from-compute-encryption", "separating-storage-from-compute-logging", "separating-storage-from-compute-retention"] },
  closing: {
    pitfalls: [
      "Leaving compute running when idle, which brings back the bill of the coupled cluster.",
      "Suspending so eagerly that every query starts on an empty cache.",
      "Granting an engine broad access at the store and relying on the engine alone to restrict it.",
    ],
    questions: [
      "What happens to the data when every engine is switched off?",
      "Which line of the bill grows when a year of orders is added, and which does not?",
      "Why is the first query after a resume slower than the next?",
    ],
  },
});
