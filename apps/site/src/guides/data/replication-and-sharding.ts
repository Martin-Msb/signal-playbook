import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Row } from "@signal-path/engine";

// The floor: a row of machines is one dataset and its copies. Checkout writes along the rail from the back left,
// the rail passes the leader and its two followers, and Finance reads at the far end.
// From the fifth stop the floor holds three rows: each row is a shard, and each shard keeps its own three copies.
// The hash ring that places a key on a shard lies on the floor behind the rows.
const G = isoGrid(300, 140, 30);
const AT = { start: -2.3, hash: -1.3, trunk: 0, a: 0, lead: 3, m1: 5.75, f1: 8.5, m2: 11.25, f2: 14, e: 16.3, fin: 18.1 };
const ROW = [0, 4.5, 9];
const BOARD: [number, number] = [236, 446];
/** Fraction of the main rail at a grid position, for rides that start between stops. */
const at = (gx: number) => Math.round(((gx - AT.start) / (AT.fin - AT.start)) * 10000) / 10000;
const top = (gx: number, gy: number, dy = 40): [number, number] => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

const machine = (id: string, gx: number, gy: number, hue: Hue, group: string, title?: string, sub?: string): El =>
  drum(id, gx, gy, 1, 40, { hue, glyph: "stack", title, sub, at: "n", group });
const holds = (id: string, rows: Row[], foot?: string): El =>
  raise(table(id, 0, 0, 214, ["copy", "latest order"], rows, { at: [12, 116], rowH: 26, title: "Each copy holds", foot, group: id }), BOARD, 30);

// Rows two and three, and the plain machines of row one, for the stops where the floor shows shards.
const shards: El[] = ROW.flatMap((gy, r) => [
  machine(`sh${r}-l`, AT.lead, gy, "track", "shards"),
  machine(`sh${r}-f1`, AT.f1, gy, "sky", "shards"),
  machine(`sh${r}-f2`, AT.f2, gy, "sky", "one-region", `Shard ${r + 1}`),
  machine(`sh${r}-f2r`, AT.f2, gy, "sand", "two-regions", `Shard ${r + 1}`),
]);

export default defineGuide({
  id: "replication-and-sharding", track: "data", module: "Analytical systems", slug: "replication-and-sharding",
  title: "Replication and sharding",
  summary: "Replication keeps copies of the data on several machines so a failure loses nothing. Sharding splits the data across machines to add capacity. Both make the reader choose how current a read must be.",
  forLeads: "The number of copies, the shard key and the regions that hold copies are set once per dataset. How consistent a read must be is chosen per use, and the strict choice costs latency and availability.",
  status: "draft", minutes: 7,
  counters: ["Copies of an order", "Still works after", "Shards", "A read returns"],
  whatIf: { label: "What if there were one machine?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "Checkout writes orders along a rail to a row of database machines, and Finance reads at the far end. First one machine holds every order and fails. Then a leader takes the writes and two followers copy it. Order 4472 is still on its way to the second follower when Finance reads that follower. With a quorum, two of three replicas acknowledge a write and two answer a read, so the read succeeds with one replica down. Then the floor shows three rows, one per shard, each with a leader and two followers, and a hash ring behind them on which order 4471 walks clockwise to shard 2. At the last stop the third machine of every shard stands in a second region.",
    els: [
      line("main", [G.p(AT.start, 0), G.p(AT.fin, 0)], { always: true }),
      stop("s-a", ...G.p(AT.a, 0), undefined, undefined, { always: true }),
      stop("s-m1", ...G.p(AT.m1, 0), undefined, undefined, { always: true }),
      stop("s-m2", ...G.p(AT.m2, 0), undefined, undefined, { always: true }),
      stop("s-e", ...G.p(AT.e, 0), undefined, undefined, { always: true }),
      prism("co", AT.start - 1.4, -0.7, 1.4, 1.4, 30, { hue: "track", glyph: "pen", title: "Checkout", sub: "writes orders", at: "w", always: true }),
      prism("fin", AT.fin, -0.7, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "reads totals", at: "sw", always: true }),

      // 1. one machine
      machine("solo", AT.lead, 0, "track", "one", "Orders database", "one machine"),
      pill("down", [640, 96], "Machine fails", { tone: "alert", glyph: "x", sub: "no writes, no reads", to: [G.p(AT.lead, 0)[0] + 40, G.p(AT.lead, 0)[1] - 30], group: "one" }),
      raise(table("only", 0, 0, 204, ["order", "channel", "amount"], [["4470", "web", "129"], ["4471", "web", "899"], { cells: ["4472", "app", "1450"], hot: true }], { at: [12, 72, 142], rowH: 26, title: "orders", sub: "the only copy", mono: true, group: "one" }), BOARD, 30),

      // 2 and 3. a leader and two followers
      machine("lead", AT.lead, 0, "track", "lf", "Leader", "takes every write"),
      machine("f1", AT.f1, 0, "sky", "lf", "Follower", "applies the log"),
      machine("f2", AT.f2, 0, "sky", "f2", "Follower", "applies the log"),
      machine("f2-lag", AT.f2, 0, "sky", "f2-lag", "Follower", "lacks 4472"),
      holds("same", [["Leader", "4472"], ["Follower 1", "4472"], ["Follower 2", "4472"]]),
      holds("behind", [["Leader", "4472"], ["Follower 1", "4472"], { cells: ["Follower 2", "4471"], hot: true }], "Finance reads follower 2"),
      pill("promote", [716, 112], "Failover", { glyph: "replay", sub: "a follower is promoted", to: top(AT.f1 + 0.9, 0, 44), group: "f2" }),
      pill("async", [700, 112], "Asynchronous", { glyph: "clock", sub: "the commit does not wait", to: top(AT.m2 - 0.25, 0, 44), group: "f2-lag" }),

      // 4. three replicas, a quorum of two, one replica down
      machine("r1", AT.lead, 0, "sky", "q", "Replica 1", "acknowledges"),
      machine("r2", AT.f1, 0, "sky", "q", "Replica 2", "acknowledges"),
      prism("r3", AT.f2 - 0.7, -0.7, 1.4, 1.4, 40, { title: "Replica 3", sub: "down", at: "n", state: "closed", group: "q" }),
      pill("r3-x", [862, 236], "Replica fails", { tone: "alert", glyph: "x", sub: "two still answer", to: [G.p(AT.f2, 0)[0] + 34, G.p(AT.f2, 0)[1] - 22], group: "q" }),
      raise(table("nwr", 0, 0, 204, ["", "counts", "here"], [["N", "replicas", "3"], ["W", "write acks", "2"], ["R", "read replies", "2"], { cells: ["", "W + R > N", "4 > 3"], hot: true }], { at: [12, 46, 152], rowH: 26, title: "Quorum", group: "q" }), BOARD, 30),

      // 5 and 6. three shards, each a leader and two followers, and the ring that places a key
      line("w2", [G.p(AT.start, 0), G.p(AT.trunk, 0), G.p(AT.trunk, ROW[1]), G.p(AT.f2, ROW[1])], { group: "shards" }),
      line("w3", [G.p(AT.start, 0), G.p(AT.trunk, 0), G.p(AT.trunk, ROW[2]), G.p(AT.f2, ROW[2])], { group: "shards" }),
      stop("s-hash", ...G.p(AT.hash, 0), "hash of key", undefined, { at: "ne", group: "shards" }),
      stop("s-r2", ...G.p(AT.m1, ROW[1]), undefined, undefined, { group: "shards" }),
      stop("s-r3", ...G.p(AT.m1, ROW[2]), undefined, undefined, { group: "shards" }),
      stop("s-r3b", ...G.p(AT.m2, ROW[2]), undefined, undefined, { group: "shards" }),
      ...shards,
      line("ring", [G.p(4, -10), G.p(8, -10), G.p(8, -6), G.p(4, -6)], { loop: true, group: "shards" }),
      stop("k", ...G.p(8, -9), "key 4471", undefined, { at: "e", mono: true, group: "shards" }),
      stop("n1", ...G.p(6, -10), "shard 1", undefined, { at: "ne", group: "shards" }),
      stop("n2", ...G.p(6, -6), "shard 2", undefined, { at: "sw", group: "shards" }),
      stop("n3", ...G.p(4, -8), "shard 3", undefined, { at: "nw", group: "shards" }),
      pill("ring-l", [720, 196], "Consistent hashing", { glyph: "loop", sub: "next shard clockwise", group: "one-region" }),

      // 6. the controls
      pill("region", [650, 470], "Second region", { glyph: "globe", sub: "a copy here sets residency", to: [G.p(AT.f2, ROW[2])[0] + 44, G.p(AT.f2, ROW[2])[1] - 14], group: "two-regions" }),
      pill("recover", [128, 440], "Recovery", { glyph: "replay", sub: "promote a follower", to: [G.p(AT.lead, ROW[2])[0], G.p(AT.lead, ROW[2])[1] + 26], group: "two-regions" }),
      pill("level", [850, 262], "Consistency level", { glyph: "scale", sub: "chosen per read", to: top(AT.fin + 0.7, 0, 34), group: "two-regions" }),
    ],
  },
  steps: [
    step({
      id: "one", label: "One machine", kind: "problem", title: "One machine holds every order",
      caption: "Vinterhus keeps every order in one database on one machine. When it fails, Checkout cannot write and Finance cannot read. Its hardware also caps capacity.",
      show: ["one"], counters: ["1", "no failure", "1", "nothing, once it fails"],
      rides: [ride("main", 0, "s-a", "4472", { tone: "alert" }), ride("main", "s-m1", "s-m2", "no reply", { tone: "alert" })],
      body: ["A single server grows by vertical scaling: a more powerful CPU, more RAM, more storage. Available technology and cloud hardware configurations impose a practical maximum.",
        "Database servers can work together so that a second server takes over quickly if the first fails, or so that several computers serve the same data. The difficulty is that a write to any server has to be propagated to all of them before their reads return consistent results."],
      claims: ["replication-and-sharding-vertical", "replication-and-sharding-together"],
    }),
    step({
      id: "copies", label: "Copies", kind: "idea", title: "Followers copy the leader",
      caption: "Every write goes to the leader. Two followers receive its log of changes and apply it. When the leader fails, a follower is promoted and takes over.",
      show: ["lf", "f2", "same"], counters: ["3", "a failed machine", "1", "the same on every copy"],
      rides: [ride("main", 0, "s-m1", "4472", { via: ["s-a"] }), ride("main", "s-m1", "s-m2", "4472")],
      body: ["This is leader and follower replication. Apache Kafka uses those names: each partition has a single leader and zero or more followers, all writes go to the leader, and followers apply its messages to their own log. PostgreSQL calls the roles primary and standby and ships the write-ahead log. MongoDB calls them primary and secondary and replicates the oplog.",
        "Failover needs care. PostgreSQL does not provide the software that identifies a failed primary, and a restarted old primary must be told it is no longer the primary, or both systems think they are the primary and data is lost. In a MongoDB replica set an eligible secondary holds an election to select a new primary.",
        { callout: { label: "Key idea", text: "A follower is a complete copy. It can replace the leader, and it can answer reads." } }],
      claims: ["replication-and-sharding-leader", "replication-and-sharding-failover", "replication-and-sharding-async", "replication-and-sharding-stale"],
    }),
    step({
      id: "lag", label: "Lag", kind: "watch-out", title: "A follower can lag behind the leader",
      caption: "Replication is asynchronous by default. Order 4472 is committed on the leader and still on its way to the second follower. Finance reads that follower and misses it.",
      show: ["lf", "f2-lag", "behind"], counters: ["3, one behind", "a failed machine", "1", "a total without 4472"],
      rides: [ride("main", 0, "s-m2", "4472", { via: ["s-m1"] }), ride("main", at(AT.f2 + 0.9), "s-e", "4471")],
      body: ["PostgreSQL streaming replication is asynchronous by default: there is a small delay between a commit on the primary and the change becoming visible on a standby. Its documentation calls the data on a standby eventually consistent with the primary.",
        "The delay is also a window for data loss. If the primary fails catastrophically, transactions not yet shipped are lost.",
        "Synchronous replication closes the window. The commit is not acknowledged until the synchronous standbys have safely received its log records, so each commit of a write transaction waits for that confirmation.",
        { callout: { label: "Key idea", text: "A read from an asynchronous follower may not reflect the state of the data on the leader. Reading there accepts eventual consistency." } }],
      claims: ["replication-and-sharding-async", "replication-and-sharding-stale", "replication-and-sharding-sync"],
    }),
    step({
      id: "quorum", label: "Quorum", kind: "mechanism", title: "A quorum makes reads overlap writes",
      caption: "Of three replicas, a write waits for two acknowledgements and a read asks two. The two sets share a replica, so Finance sees 4473 with one replica down.",
      show: ["q"], counters: ["3, two confirmed", "one failed replica", "1", "the latest write"],
      rides: [ride("main", 0, "s-m1", "4473", { via: ["s-a"] }), ride("main", "s-m2", "s-e", "4473")],
      body: ["The rule comes from Amazon's Dynamo paper. Each item is replicated at N hosts, W is the minimum number of nodes in a successful write and R in a successful read. Setting R + W > N yields a quorum-like system.",
        "Apache Cassandra sets this per operation with a consistency level. `QUORUM` needs a majority of the replicas to respond, 2 of 3 at a replication factor of 3. With `QUORUM` for reads and writes, the quorums overlap and the write is visible to the read.",
        "A majority has a price in copies: tolerating one failure takes three copies and tolerating two takes five. Kafka tracks a set of in-sync replicas instead and tolerates f failures with f+1 replicas. PostgreSQL applies a quorum to commits: the `ANY` method waits for at least the requested number of the listed standbys."],
      claims: ["replication-and-sharding-quorum", "replication-and-sharding-majority", "replication-and-sharding-sync"],
    }),
    step({
      id: "shards", label: "Shards", kind: "mechanism", title: "Shards split the data by key",
      caption: "Each order lives on one of three shards, each with its own copies. Consistent hashing puts keys and shards on a ring. A key belongs to the next shard clockwise.",
      show: ["shards", "one-region"], counters: ["3, on one shard", "one machine per shard", "3", "one shard's data per key"],
      rides: [ride("ring", "k", "n2", "4471"), ride("w2", 0, "s-r2", "4471", { via: ["s-hash"], then: "shard 2" })],
      body: ["Sharding distributes data across multiple machines, and more servers are added as capacity is needed. In MongoDB the shard key decides which shard holds a document, a router called `mongos` stands between the application and the cluster, and each shard is deployed as a replica set.",
        "Consistent hashing treats the output range of a hash function as a ring. Each node takes a position on it, and a key belongs to the first node clockwise from the key's own position. When a node arrives or leaves, only its immediate neighbours are affected. Cassandra partitions data this way: a small fraction of the keys move, where naive hashing might invalidate almost all of the mappings.",
        "MongoDB offers hashed sharding and ranged sharding. A query that does not include the shard key is broadcast to every shard, and such scatter/gather queries can be long running.",
        { callout: { label: "Key idea", text: "Sharding adds capacity and replication adds copies. A sharded system uses both: every shard is replicated." } }],
      claims: ["replication-and-sharding-sharding", "replication-and-sharding-vertical", "replication-and-sharding-ring", "replication-and-sharding-scatter"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What is set per dataset and per read",
      caption: "",
      show: ["shards", "two-regions"], counters: ["3, one in a second region", "one machine per shard", "3", "what its level allows"],
      rides: [ride("w3", "s-r3", "s-r3b", "4474"), ride("main", at(AT.f2 + 0.9), "s-e", "4471")],
      body: [{ pair: {
        left: { label: "Per dataset", items: ["Number of copies", "Shard key", "Regions holding copies"] },
        right: { label: "Per read", items: ["Leader or follower", "One replica or quorum", "Strong or eventual"] },
      } },
        "Consistency models name what a reader may see. Azure Cosmos DB offers five levels, from strongest to weakest: strong, bounded staleness, session, consistent prefix and eventual. DynamoDB offers two: eventually consistent reads by default, and strongly consistent reads when the request asks for them.",
        "Microsoft's documentation states the trade. Strong consistency offers a linearizability guarantee, increases write latencies and reduces availability during failures. Eventual consistency offers higher availability and better performance.",
        "Placing copies is a governance decision. NIST's contingency planning guide lists offsite database replication among the high-availability options for high-impact systems. A replica in another region also stores the data there: Cassandra takes a replication factor per datacentre, AWS states that it will not replicate content outside the Regions the customer chose without the customer's agreement, and CockroachDB calls keeping data on servers in specific geographic locations data domiciling.",
        "The European Data Protection Board states that the EU GDPR imposes restrictions on the transfer of personal data outside the EEA."],
      claims: ["replication-and-sharding-levels", "replication-and-sharding-quorum", "replication-and-sharding-sharding", "replication-and-sharding-recovery", "replication-and-sharding-residency", "replication-and-sharding-transfers"],
    }),
  ],
  governance: { text: "Replication is a recovery control: NIST's contingency planning guide lists offsite database replication among the high-availability options for high-impact systems. Every region that holds a replica stores the data, so the placement of copies decides data residency.", claims: ["replication-and-sharding-recovery", "replication-and-sharding-residency"] },
  closing: {
    pitfalls: [
      "Reading from a follower and expecting the write that has just been made.",
      "Promoting a follower without making sure the old leader has stopped accepting writes.",
      "Adding a replica in another region for recovery without checking where the data may be stored.",
    ],
    questions: [
      "Which orders are lost if the leader fails before an asynchronous follower receives them?",
      "With three replicas, why does a read of two see a write acknowledged by two?",
      "Which shards answer a query that does not include the shard key?",
    ],
  },
});
