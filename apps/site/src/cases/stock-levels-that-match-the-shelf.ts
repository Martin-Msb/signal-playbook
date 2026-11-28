import { CANVAS, blocks, cells, defineGuide, drum, isoGrid, line, pawn, plot, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";
import type { Cell, Row } from "@signal-path/engine";

// The floor: three producers on the left publish stock movements down one rail into the event log.
// The stream processor reads the log and writes each count to the stock store. The store's follower sits behind it,
// and the web shop reads from the follower. Boards: the log partition above the log, the processor's state in front of it,
// the stock store's keys above the follower.
const G = isoGrid(50, 130, 30);
const MID = G.p(9, -5.5);       // above the log
const RIGHT = G.p(15.5, -9.5);  // above the follower
const LOW: [number, number] = [285, 522]; // in front of the processor

const partition = (id: string, items: Cell[], from: number) =>
  raise(cells(id, 0, 0, 4, [62, 30], items, { title: "Partition for SOFA-2210", ticks: [0, 1, 2, 3].map((i) => String(from + i)), group: id }), MID, 30);
const state = (id: string, rows: Row[], foot: string) =>
  raise(table(id, 0, 0, 216, ["product", "store", "count"], rows, { at: [12, 112, 160], rowH: 24, title: "Processor state", foot, mono: true, group: id }), LOW, 20);
const keys = (id: string, rows: Row[]) =>
  raise(table(id, 0, 0, 216, ["key", "value"], rows, { at: [12, 166], rowH: 24, title: "Stock store", sub: "one value per key", mono: true, group: id }), RIGHT, 30);
const shelf = (id: string, rows: Row[]) =>
  raise(table(id, 0, 0, 216, ["time", "shelf", "web shop"], rows, { at: [12, 84, 140], rowH: 24, title: "SOFA-2210 at store 14", mono: true, group: id }), RIGHT, 30);

const ALL = ["log", "reg", "proc", "serve"];

export default defineGuide({
  id: "case-stock-levels-that-match-the-shelf", track: "case", module: "Use cases", slug: "stock-levels-that-match-the-shelf",
  title: "Stock levels that match the shelf",
  summary: "A nightly stock copy is replaced piece by piece: an event log, a contract at its door, a stream processor that keeps the count, and a replicated key-value store the web shop reads. Then three events run through it.",
  forLeads: "Fresh stock is a chain of small guarantees: events kept in order, counted once, served by key. What keeps it trustworthy is the contract producers publish under and a freshness objective with an owner.",
  status: "draft", minutes: 12,
  counters: ["Stock arrives as", "Checked against", "Counted by", "Web count age"],
  whatIf: { label: "What if stock were still copied nightly?", step: 1, from: 6 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Products, stores, counts and times are illustrative",
    label: "Tills, the warehouse and checkout send stock movements along a rail. At first a nightly job copies the counts to the web shop. Later stops replace it with an event log behind a schema registry, a stream processor that keeps a count per product and store, and a stock store with a leader and a follower that the web shop reads. Boards show the log partition, the processor's state and the store's keys.",
    els: [
      prism("wh", -0.6, -0.6, 1.2, 1.2, 22, { hue: "sand", glyph: "stack", title: "Warehouse", at: "n", always: true }),
      prism("tills", 0.9, -3.8, 1.2, 1.2, 22, { hue: "sand", glyph: "box", title: "Tills", at: "n", always: true }),
      prism("co", 2.4, 2.4, 1.2, 1.2, 22, { hue: "sand", glyph: "pen", title: "Checkout", at: "s", always: true }),
      line("pw", [G.p(0.6, 0), G.p(7.1, 0)], { always: true }),
      line("pt", [G.p(1.5, -2.6), G.p(1.5, 0), G.p(7.1, 0)], { always: true }),
      line("po", [G.p(3, 2.4), G.p(3, 0), G.p(7.1, 0)], { always: true }),
      prism("shop", 23, -5, 1.2, 1.2, 26, { hue: "sand", glyph: "globe", title: "Web shop", at: "s", always: true }),

      // Problem: one copy a night.
      prism("job", 7.1, -0.6, 1.2, 1.2, 22, { hue: "paper", glyph: "clock", title: "Nightly copy", sub: "runs at 02:00", at: "n", group: "night" }),
      line("n2", [G.p(8.3, 0), G.p(18.4, 0)], { tone: "muted", group: "night" }),
      drum("wstock", 19.4, 0, 1, 30, { hue: "paper", glyph: "table", title: "Web stock table", sub: "as of 02:00", at: "s", group: "night" }),
      line("n3", [G.p(19.4, -1), G.p(19.4, -4.4), G.p(23, -4.4)], { group: "night" }),
      blocks("pile", 3.9, 1.5, 6, 0.5, Array.from({ length: 12 }, (_, i) => ({ h: 7, hue: i > 9 ? "track" as const : "paper" as const })), { gap: 0.22, title: "Movements since 02:00", sub: "wait for tonight", at: "s", group: "night" }),
      shelf("cmp-1", [["02:00", "1", "1"]]),
      shelf("cmp-2", [["02:00", "1", "1"], { cells: ["14:02", "0", "1"], hot: true, hue: "rose" }]),

      // Architecture.
      prism("log", 7.1, -0.6, 1.2, 1.2, 32, { hue: "violet", glyph: "lines", title: "Event log", sub: "stock movements", at: "n", group: "log" }),
      partition("lg-a", ["e29 +6", "e30 -1", "e31 -1", "e32 -1"], 41),
      prism("reg", 5.6, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "shield", title: "Schema registry", at: "sw", group: "reg" }),
      raise(table("ct", 0, 0, 278, ["version", "change", "result"], [["v1", "five fields", "accepted"], ["v2", "adds till, default", "accepted"], { cells: ["v3", "drops store", "refused"], hot: true, hue: "rose" }], { at: [12, 66, 204], rowH: 24, title: "Movement schema", sub: "compatibility: full", group: "ct" }), LOW, 20),
      line("m2", [G.p(8.3, 0), G.p(13, 0)], { group: "proc" }),
      prism("proc", 13, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "gear", title: "Stream processor", at: "n", group: "proc" }),
      state("st-a", [{ cells: ["SOFA-2210", "14", "1"], hot: true }, ["SOFA-2210", "09", "4"], ["LAMP-0312", "14", "12"]], "committed with offset 44"),
      line("m3", [G.p(14.2, 0), G.p(18.4, 0)], { group: "serve" }),
      drum("lead", 19.4, 0, 1, 30, { hue: "sky", glyph: "table", title: "Stock store", sub: "leader", at: "s", group: "serve" }),
      line("rep", [G.p(18.9, -0.9), G.p(18.9, -3.4)], { w: 3, group: "serve" }),
      drum("fol", 18.9, -4.4, 1, 30, { hue: "sky", glyph: "table", title: "Follower", at: "n", group: "serve" }),
      line("rd", [G.p(19.9, -4.4), G.p(23, -4.4)], { group: "serve" }),
      keys("kv-a", [{ cells: ["stock:SOFA-2210:14", "1"], hot: true }, ["stock:SOFA-2210:09", "4"], ["stock:LAMP-0312:14", "12"]]),

      // Execution.
      partition("lg-b", ["e30 -1", "e31 -1", "e32 -1", { t: "e33 -1", hot: true }], 42),
      state("st-b", [{ cells: ["SOFA-2210", "14", "0"], hot: true }, ["SOFA-2210", "09", "4"], ["LAMP-0312", "14", "12"]], "committed with offset 45"),
      keys("kv-b", [{ cells: ["stock:SOFA-2210:14", "0"], hot: true }, ["stock:SOFA-2210:09", "4"], ["stock:LAMP-0312:14", "12"]]),
      partition("lg-c", ["e31 -1", "e32 -1", "e33 -1", { t: "e33 -1", hot: true, tone: "alert" }], 43),
      state("st-c", [{ cells: ["SOFA-2210", "14", "0"], hot: true }, ["SOFA-2210", "09", "4"], ["LAMP-0312", "14", "12"]], "e33 seen before: dropped"),
      partition("lg-d", ["e32 -1", "e33 -1", { t: "e33 -1", mute: true, strike: true }, { t: "e27 -1", hot: true }], 44),
      state("st-d", [["SOFA-2210", "14", "0"], { cells: ["SOFA-2210", "09", "3"], hot: true }, ["LAMP-0312", "14", "12"]], "committed with offset 47"),
      keys("kv-c", [["stock:SOFA-2210:14", "0"], { cells: ["stock:SOFA-2210:09", "3"], hot: true }, ["stock:LAMP-0312:14", "12"]]),

      raise(plot("fresh", 0, 0, 218, 150, [0, 12], [0, 20], { title: "Web count age", sub: "objective: 5 s", yLabel: "seconds", xt: [0, 4, 8, 12], yt: [0, 5, 10, 20], group: "ops" }), RIGHT, 14),
      rule("slo", "fresh", 5, { axis: "y", tone: "alert", w: 2.5, group: "ops" }),
      series("age", "fresh", "line", [[0, 2], [2, 3], [4, 2], [6, 3], [8, 14], [9, 16], [10, 4], [12, 2]], { w: 3, group: "ops" }),
      pawn("oncall", 22.5, -0.5, "Owner on call", undefined, { group: "ops" }),
    ],
  },
  steps: [
    step({
      id: "nightly", label: "Nightly copy", kind: "problem", phase: "problem", title: "Stock reaches the web shop once a night",
      caption: "Tills, the warehouse and checkout record movements all day. A batch job copies the counts at 02:00, so the web shop reads last night's shelf.",
      show: ["night", "cmp-1"], counters: ["one copy a night", "nothing", "a nightly job", "up to 24 hours"],
      rides: [ride("pt", 0, 0.52, "sale -1", { then: "waits" })],
      body: ["A batch job processes a bounded set of data: everything recorded since the last run. Each stage of a batch pipeline waits for the one before it to finish.",
        "A schedule such as once a day at midnight fixes how old the result can be. Between two runs the copy cannot change."],
      claims: ["batch-streaming-and-request-processing-bounded", "batch-streaming-and-request-processing-stages", "batch-streaming-and-request-processing-schedule"],
    }),
    step({
      id: "oversell", label: "Oversold", kind: "problem", phase: "problem", title: "The web shop sells a sofa the store no longer holds",
      caption: "The last SOFA-2210 at store 14 sells at 14:02. The web count still says 1. A customer orders it, and order 4512 is cancelled and refunded.",
      show: ["night", "cmp-2"], counters: ["one copy a night", "nothing", "a nightly job", "12 hours, and wrong"],
      rides: [ride("pt", 0, 0.52, "sold 14:02", { then: "waits" }), ride("n3", 0, 0.62, "1 in stock", { tone: "alert", then: "4512 cancelled" })],
      body: ["The sale is recorded at the till within the second. The web shop cannot see it until the next run, twelve hours later.",
        "Streaming is generally better than batch at supporting applications that need low latency.",
        { callout: { label: "The gap", text: "The shelf changes all day. The copy changes once." } }],
      claims: ["batch-streaming-and-request-processing-stages"],
    }),
    step({
      id: "log", label: "Event log", kind: "mechanism", phase: "architecture", title: "Every stock movement is published to an event log",
      caption: "Each sale, delivery and web order is appended as an event. Events for one product share a partition, keep their order and stay readable after they are read.",
      show: ["log", "lg-a"], counters: ["events, in order", "nothing", "nothing yet", "not served yet"],
      rides: [ride("pw", 0, 0.63, "e29 +6"), ride("pt", 0, 0.395, "e31 -1")],
      concepts: ["event-logs-and-streams", "batch-streaming-and-request-processing"],
      body: ["A new event is appended to one partition of its topic and gets an offset that never changes. Events with the same key are written to the same partition, and every consumer reads a partition in the order it was written.",
        "Events are not deleted after consumption, so a topic can be read as often as needed.",
        "The input is now unbounded: it may never end, so it is processed continuously as it arrives."],
      claims: ["event-logs-and-streams-offset", "event-logs-and-streams-partitions", "event-logs-and-streams-key", "event-logs-and-streams-kept", "batch-streaming-and-request-processing-bounded"],
    }),
    step({
      id: "contract", label: "Contract", kind: "mechanism", phase: "architecture", title: "A registry checks every schema against the contract",
      caption: "Producers register the schema of their events. Each new version is checked for compatibility before it is accepted, so a till release that drops the store field is refused.",
      show: ["log", "lg-a", "reg", "ct"], counters: ["events, in order", "a contract", "nothing yet", "not served yet"],
      rides: [ride("pt", 0, 0.52, "v3: no store", { tone: "alert", then: "refused" })],
      concepts: ["schema-evolution-and-data-contracts"],
      body: ["A schema registry compares each new schema version with the previous ones under a configured compatibility type, and checks before it accepts the version.",
        "Full compatibility means consumers on the new schema can read old data and consumers on the old schema can read new data. A field a reader expects and a writer omits needs a default, or resolution fails.",
        "A data contract is the agreement between a producer and its consumers. The Open Data Contract Standard gives it sections for schema, data quality, team, roles and service level."],
      claims: ["schema-evolution-and-data-contracts-compatibility", "schema-evolution-and-data-contracts-modes", "schema-evolution-and-data-contracts-avro-resolution", "schema-evolution-and-data-contracts-odcs"],
    }),
    step({
      id: "processor", label: "Processor", kind: "mechanism", phase: "architecture", title: "A stream processor keeps the count for each product and store",
      caption: "The processor reads the log continuously and holds one running count per key. Each count commits together with the log position, all or nothing.",
      show: ["log", "lg-a", "reg", "proc", "st-a"], counters: ["events, in order", "a contract", "a stream processor", "not served yet"],
      rides: [ride("m2", 0, 0.4, "e32 -1", { then: "count 1" })],
      concepts: ["stream-processing", "transactions-and-consistency", "delivery-guarantees"],
      body: ["An operation that remembers information across events is stateful. The running count is that state.",
        "A transaction bundles several steps into one all-or-nothing operation. A consumer can store its offset in the same place as its output, so the count and the position that produced it never disagree.",
        "After a failure the processor rewinds and replays the log. Exactly once means every event affects the state exactly once, not that it is processed once."],
      claims: ["stream-processing-state", "batch-streaming-and-request-processing-state", "transactions-and-consistency-atomic", "delivery-guarantees-offset-with-output", "delivery-guarantees-processing"],
    }),
    step({
      id: "serving", label: "Stock store", kind: "mechanism", phase: "architecture", title: "A key-value store answers the web shop by key",
      caption: "Counts are written to a leader and copied to a follower. The product page asks for one key at request time and reads one value, with no scan and no join.",
      show: ["log", "lg-a", "reg", "proc", "st-a", "serve", "kv-a"], counters: ["events, in order", "a contract", "a stream processor", "seconds"],
      rides: [ride("m3", 0, 0.5, "count 1"), ride("rep", 0, 0.6, "1"), ride("rd", 0, 0.5, "1 left")],
      concepts: ["non-relational-data-models", "indexes-and-storage-engines", "replication-and-sharding", "serving-data-to-applications", "batch-streaming-and-request-processing"],
      body: ["A key-value store returns the value of a key directly. Key names of the form object-type:id are the documented convention, and such stores offer no join.",
        "Without an index the system scans every row to find a match. A hash index handles equality comparisons only, which is all a lookup by key needs.",
        "The leader receives all writes and followers apply them in turn. A read from a follower may not yet reflect the latest write on the leader.",
        "A user-facing serving system is judged on availability and on request latency. Where a cache sits in front of a store, its time to live bounds how stale a value can be."],
      claims: ["non-relational-data-models-get", "non-relational-data-models-dynamodb", "indexes-and-storage-engines-scan", "indexes-and-storage-engines-hash", "replication-and-sharding-leader", "replication-and-sharding-stale", "batch-streaming-and-request-processing-request", "batch-streaming-and-request-processing-serving", "serving-data-to-applications-redis-cache-aside"],
    }),
    step({
      id: "sale", label: "A sale", kind: "mechanism", phase: "execution", title: "A sofa sells and the web count drops in seconds",
      caption: "The till at store 14 publishes the sale at 14:02:07. The processor takes the count to 0, the store is updated, and the product page shows sold out.",
      show: [...ALL, "lg-b", "st-b", "kv-b"], counters: ["events, in order", "a contract", "a stream processor", "3 seconds"],
      rides: [ride("pt", 0, 0.52, "sold 14:02:07"), ride("m2", 0, 0.4, "e33 -1", { then: "count 0" }), ride("m3", 0, 0.5, "count 0"), ride("rd", 0, 0.5, "0 left")],
      concepts: ["event-logs-and-streams", "stream-processing", "serving-data-to-applications"],
      body: ["The sale is appended at offset 45 of the partition for its product. The processor's position is the offset of the next event to read.",
        "A pipeline is judged on end-to-end latency and a serving system on request latency. Both must also return the right answer."],
      claims: ["event-logs-and-streams-offset", "event-logs-and-streams-position", "stream-processing-state", "batch-streaming-and-request-processing-serving"],
    }),
    step({
      id: "duplicate", label: "A duplicate", kind: "watch-out", phase: "execution", title: "A repeated event changes nothing",
      caption: "The till's connection drops and it sends the sale again. The processor has already committed that event id, so the second copy is dropped and the count stays 0.",
      show: [...ALL, "lg-c", "st-c", "kv-b"], counters: ["events, some twice", "a contract", "a stream processor, once", "3 seconds"],
      rides: [ride("pt", 0, 0.52, "e33 again", { tone: "alert" }), ride("m2", 0, 0.4, "e33", { tone: "alert", then: "dropped" })],
      concepts: ["delivery-guarantees", "transactions-and-consistency"],
      body: ["A producer that meets a network error cannot tell whether its message was committed. Sending again gives at least once delivery: nothing is lost, and some events arrive twice.",
        "Tagging every record with a unique id lets the receiver drop a record whose id it has already committed. An idempotent write can be retried as often as necessary.",
        { callout: { label: "What held", text: "The retry was safe because the count and the ids it has seen commit as one." } }],
      claims: ["delivery-guarantees-uncertain", "delivery-guarantees-semantics", "delivery-guarantees-retry", "delivery-guarantees-idempotent", "transactions-and-consistency-atomic"],
    }),
    step({
      id: "late", label: "A late event", kind: "mechanism", phase: "execution", title: "A late event corrects the count",
      caption: "A till at store 09 was offline. Its sale of 13:55 arrives at 14:09, inside the allowed lateness, and the count for that store is corrected to 3.",
      show: [...ALL, "lg-d", "st-d", "kv-c"], counters: ["events, some late", "a contract", "a stream processor, once", "14 minutes for one event"],
      rides: [ride("pt", 0, 0.52, "sold 13:55"), ride("m2", 0, 0.4, "e27 late", { then: "count 3" }), ride("m3", 0, 0.5, "count 3"), ride("rd", 0, 0.5, "3 left")],
      concepts: ["stream-processing"],
      body: ["Event time is when the event occurred on the device that produced it. Processing time is the clock of the machine that handles it. The log orders events by arrival, so the processor reads the time inside the event.",
        "The allowed lateness states how late an event may be before it is dropped. A result produced by a late event is an updated result of an earlier computation.",
        { callout: { label: "The policy", text: "How long to wait for late events is a correctness decision. It is written down, not left to a default." } }],
      claims: ["stream-processing-time", "stream-processing-lateness", "stream-processing-policy"],
    }),
    step({
      id: "operate", label: "Operate", kind: "decision", phase: "execution", title: "What keeps the count right",
      caption: "",
      show: [...ALL, "lg-d", "st-d", "ops"], counters: ["events, in order", "a contract", "a stream processor, once", "objective: 5 seconds"],
      rides: [ride("age", 0, 0.72, "16 s", { tone: "alert" })],
      concepts: ["observability-and-incident-response", "batch-streaming-and-request-processing"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["A freshness objective", "An alert to the owner on call", "Reconciliation against the shelf"] },
        right: { label: "Do not rely on", items: ["Cancelled orders as the alarm", "Silent retries", "A nightly recount"] },
      } },
        "A freshness objective can state that the oldest data is no older than a set time. Alerts on a missed objective detect the issues that reach customers.",
        "An alerting rule can require a condition to hold for a duration before it fires, and can carry a link to the runbook.",
        "Incident response names who commands, who operates and who communicates. The written review afterwards records impact, causes and follow-up actions.",
        "Validation that compares each source row with its target row reports the mismatches that duplicates and gaps leave behind."],
      claims: ["observability-and-incident-response-slo", "observability-and-incident-response-alerts", "observability-and-incident-response-triage", "observability-and-incident-response-record", "batch-streaming-and-request-processing-freshness", "delivery-guarantees-reconciliation"],
    }),
  ],
  governance: { text: "Producers publish under a contract, and a registry checks each schema version before it is accepted. The serving path has a freshness objective, and a missed objective alerts an owner on call.", claims: ["schema-evolution-and-data-contracts-compatibility", "schema-evolution-and-data-contracts-odcs", "observability-and-incident-response-slo", "observability-and-incident-response-alerts"] },
  closing: {
    pitfalls: [
      "Counting an event before checking whether its id was already applied.",
      "Letting a producer change its schema without a compatibility check.",
      "Measuring freshness at the processor and not where the web shop reads.",
    ],
    questions: [
      "Which part of the system knows the current count?",
      "Why does the repeated sale leave the count unchanged?",
      "What would have to change before a follower read could be trusted for the last item?",
    ],
  },
});
