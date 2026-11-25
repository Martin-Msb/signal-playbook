import { blocks, CANVAS, defineGuide, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// The floor: every order event is one block, coloured by order number. A row of blocks is a log, oldest on the left.
// Checkout writes down the rail on the right, into the next free slot of a row. Readers hold a position on the offset lane in front.
// Each block is its own element, so a record can rest beside a row without touching the bounding box of the whole row.
const G = isoGrid(452, 100, 30);
const SIZE = 1.45, STEP = 2, H = 20;
const ROW = [0, 3.6, 7.2], MID = ROW.map((gy) => gy + SIZE / 2);
const slot = (k: number) => k * STEP + SIZE / 2;
const TAIL = slot(5), LANE = ROW[2] + SIZE + 2;
const BOARD: [number, number] = [768, 502];
const up = (gx: number, gy: number, dy: number): [number, number] => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
const block = (id: string, k: number, p: number, group: string, hue?: Hue): El =>
  blocks(id, k * STEP, ROW[p], 1, SIZE, [{ h: H, hue, state: hue ? undefined : "closed" }], { group });

// The topic as three partitions, front row last. Slots 0 and 1 pass their retention period at the last stop.
// The front row is the queue of the first stop and the whole log of the second. The last block of each row arrives at the fourth stop.
const PARTS: Hue[][] = [["sand", "sand", "sand", "sand"], ["mint", "rose", "mint", "rose", "mint"], ["sky", "violet", "sky", "violet", "sky"]];
const parts: El[] = PARTS.flatMap((hues, p) => hues.flatMap((hue, k) => {
  const row = p === 2 ? "f" : "b";
  return k < 2
    ? [block(`p${p}-${k}`, k, p, `${row}-old`, hue), block(`p${p}-${k}-x`, k, p, "gone")]
    : [block(`p${p}-${k}`, k, p, `${row}-${k === hues.length - 1 ? "more" : "mid"}`, hue)];
}));
const offsets = (id: string, support: string[], hot = false): El =>
  raise(table(id, 0, 0, 236, ["group", "p0", "p1", "p2"], [["Finance", "4", "5", "5"], { cells: ["Support", ...support], hot }], { at: [12, 112, 154, 196], rowH: 26, title: "Offsets", sub: "next event to read", group: id }), BOARD, 28);
const event = (id: string, key: string, value: string, hot: boolean): El =>
  raise(table(id, 0, 0, 176, ["field", "value"], [{ cells: ["key", key], hot }, ["value", value], ["time", "10:42:07"]], { at: [12, 74], rowH: 24, title: "One event", group: id }), BOARD, 34);

export default defineGuide({
  id: "event-logs-and-streams", track: "data", module: "Ingestion", slug: "event-logs-and-streams",
  title: "Event logs and streams",
  summary: "An event log appends and keeps. Split into ordered partitions, it lets many consumers read the same events at their own pace and read them again.",
  forLeads: "A log lets a new team start from the events that already happened, without asking the producing team for anything. Retention, access and encryption are decisions made topic by topic.",
  status: "draft", minutes: 7,
  counters: ["Read events are", "Partitions", "Reader positions", "Replay"],
  whatIf: { label: "What if the topic were a queue?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and events are illustrative",
    label: "Order events from Checkout are drawn as blocks on the floor, one block per event and one colour per order. In a queue the delivered events disappear. In a log they stay, each at a numbered offset. The log is then split into three partitions by order number. Finance and Support each hold a marker on the offset lane of one partition: Finance at the end, Support behind and then rewound to 0. At the last stop the oldest events pass their retention period, and access and encryption are marked.",
    els: [
      prism("co", TAIL - 0.7, -3.6, 1.4, 1.4, 30, { hue: "track", glyph: "pen", title: "Checkout", sub: "writes order events", at: "n", always: true }),

      // 1. a queue on the front row: the record passes through to Finance and its slot is emptied
      line("qline", [G.p(TAIL, -2.9), G.p(TAIL, MID[2]), G.p(-3.3, MID[2])], { group: "q" }),
      stop("q-in", ...G.p(TAIL, 5.6), undefined, undefined, { group: "q" }),
      stop("q-fin", ...G.p(-1.7, MID[2]), undefined, undefined, { group: "q" }),
      ...[0, 1, 2].map((k) => block(`q-${k}`, k, 2, "q")),
      block("q-3", 3, 2, "q", "violet"),
      prism("fin", -4.7, MID[2] - 0.7, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "takes each event", at: "n", group: "q" }),
      line("q-no", [G.p(-0.9, MID[2]), G.p(-0.9, 10.2)], { state: "closed", group: "q" }),
      prism("sup", -1.6, 10.2, 1.4, 1.4, 30, { glyph: "wrench", title: "Support", sub: "connects later, finds nothing", at: "se", group: "q" }),
      pill("q-gone", up(4.6, 4.6, 32), "delivered, then deleted", { to: up(slot(2), MID[2], H), group: "q" }),

      // 2 to 6. the write rail, the partitions, and the offset lane of the front row
      line("write", [G.p(TAIL, -2.9), G.p(TAIL, MID[2])], { group: "rail" }),
      stop("w-2", ...G.p(TAIL, MID[2]), undefined, undefined, { group: "rail" }),
      stop("w-key", ...G.p(TAIL, -0.8), "hash of key", undefined, { at: "e", group: "pk" }),
      stop("w-0", ...G.p(TAIL, MID[0]), undefined, undefined, { group: "pk" }),
      stop("w-1", ...G.p(TAIL, MID[1]), undefined, undefined, { group: "pk" }),
      ...parts,
      ...ROW.map((_, p) => pill(`pl-${p}`, up(-0.9, MID[p], 15 + H / 2), `partition ${p}`, { anchor: "end", group: "pk" })),
      line("lane", [G.p(-0.3, LANE), G.p(5 * STEP + SIZE, LANE)], { tone: "ink", w: 3, group: "lane" }),
      pill("lane-l", up(-0.9, LANE, 15), "offset", { anchor: "end", group: "lane" }),
      ...[0, 1, 2, 3, 4, 5].map((k) => stop(`lane-${k}`, ...G.p(slot(k), LANE), String(k), undefined, { mono: true, group: "lane" })),
      event("evt", "4472", "paid 1450", false), event("evtk", "4471", "paid 1290", true),
      offsets("offs", ["1", "3", "2"]), offsets("offs0", ["0", "0", "0"], true), offsets("offs2", ["2", "2", "2"]),

      // 6. the controls
      pill("ret", [490, 18], "Retention", { glyph: "clock", sub: "7 days, then deleted", to: up(slot(0), MID[0], H), group: "gov" }),
      pill("tls", up(TAIL + 1.2, 3, 22), "TLS", { glyph: "lock", sub: "encrypted in transit", anchor: "start", group: "gov" }),
      pill("acl", [150, 408], "Topic ACL", { glyph: "key", sub: "who may read and write", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "queue", label: "A queue", kind: "problem", title: "A queue deletes what it delivers",
      caption: "Checkout sends order events to Finance through a queue. Each event is deleted once it is consumed, so when Support's refund assistant connects, the earlier orders are gone.",
      show: ["q"], counters: ["deleted", "none", "held by the queue", "not possible"],
      rides: [ride("qline", 0, "q-fin", "4470", { via: ["q-in"] })],
      body: ["Most messaging systems keep track on the broker of what has been consumed. Because the broker knows what is consumed, it can delete it immediately, which keeps the data small.",
        "Reading an old message again is outside the common contract of a queue."],
      claims: ["event-logs-and-streams-queue", "event-logs-and-streams-rewind"],
    }),
    step({
      id: "log", label: "The log", kind: "idea", title: "A log appends and keeps every event",
      caption: "A log only grows at the end. Each event takes the next offset and stays in place after it is read. In Apache Kafka, a topic stores events this way.",
      show: ["rail", "f-old", "f-mid", "lane", "evt"], counters: ["kept", "1", "an offset", "from any offset"],
      rides: [ride("write", 0, "w-2", "4472 paid")],
      body: ["Events are organised and durably stored in topics. An event can be read as often as needed, because events are not deleted after consumption.",
        "An event has a key, a value, a timestamp and optional metadata headers.",
        { callout: { label: "Key idea", text: "Reading does not change the log. The offset of an event never changes: it is the permanent identifier of a position in the log." } }],
      claims: ["event-logs-and-streams-kept", "event-logs-and-streams-offset", "event-logs-and-streams-event"],
    }),
    step({
      id: "partitions", label: "Partitions", kind: "mechanism", title: "Partitions keep order per key",
      caption: "A topic is split into partitions, each an ordered log with its own offsets. Events with the same key, here the order number, go to the same partition and stay in order.",
      show: ["rail", "pk", "f-old", "f-mid", "b-old", "b-mid", "lane", "evtk"], counters: ["kept", "3", "an offset per partition", "from any offset"],
      rides: [ride("write", 0, "w-1", "key 4471", { via: ["w-key"], then: "partition 1" })],
      body: ["Partitions sit on different brokers, so clients read from and write to many brokers at the same time. The producer chooses the partition, and a key given by the producer is hashed to one.",
        "Kafka guarantees that a consumer of a partition reads its events in exactly the order they were written. The guarantee is stated per partition.",
        "The partition is also the unit of replication."],
      claims: ["event-logs-and-streams-partitions", "event-logs-and-streams-key", "event-logs-and-streams-replication", "event-logs-and-streams-event"],
    }),
    step({
      id: "pace", label: "Own pace", kind: "mechanism", title: "Each consumer group keeps its own offsets",
      caption: "Finance and Support read the same events. Each group stores one number per partition, the offset of the next event to read. Finance is at the end. Support is still at 2.",
      show: ["rail", "pk", "f-old", "f-mid", "f-more", "b-old", "b-mid", "b-more", "lane", "offs"], counters: ["kept", "3", "Finance 5, Support 2", "from any offset"],
      rides: [ride("lane", "lane-0", "lane-5", "Finance"), ride("lane", "lane-0", "lane-2", "Support")],
      body: ["Each partition is consumed by exactly one consumer within each subscribing consumer group at any given time, so the position of a group in a partition is a single integer.",
        "Consumers pull from the broker. A consumer that is slower than the producer falls behind and catches up when it can.",
        "Apache Pulsar keeps the same state under another name: a partitioned topic is a set of internal topics, and each subscription has a cursor that records the last consumed position."],
      claims: ["event-logs-and-streams-position", "event-logs-and-streams-pull", "event-logs-and-streams-pulsar"],
    }),
    step({
      id: "replay", label: "Replay", kind: "mechanism", title: "A consumer rewinds to replay",
      caption: "Support fixes a bug in the refund assistant and sets its offsets back to 0. It reads the same events again, in the same order. Finance stays where it is.",
      show: ["rail", "pk", "f-old", "f-mid", "f-more", "b-old", "b-mid", "b-more", "lane", "offs0"], counters: ["kept", "3", "Finance 5, Support 0", "Support, from offset 0"],
      rides: [ride("lane", "lane-2", "lane-0", "Support"), ride("lane", "lane-5", "lane-5", "Finance")],
      body: ["The consumer names its offset in every fetch request and receives the log from that position. It controls the position and can rewind it to consume data again.",
        { callout: { label: "Key idea", text: "A consumer can deliberately rewind to an old offset. If its code had a bug, it consumes the same messages again once the bug is fixed." } }],
      claims: ["event-logs-and-streams-rewind", "event-logs-and-streams-position"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What an event log gives and needs",
      caption: "",
      show: ["rail", "pk", "gone", "f-mid", "f-more", "b-mid", "b-more", "lane", "offs2", "gov"], counters: ["kept for 7 days", "3", "Finance 5, Support 2", "from offset 2"],
      rides: [ride("lane", "lane-0", "lane-2", "Support"), ride("lane", "lane-5", "lane-5", "Finance")],
      body: [{ pair: {
        left: { label: "It gives", items: ["Many readers of the same events", "Each reader at its own pace", "Replay after a fix"] },
        right: { label: "It needs", items: ["A retention period per topic", "Access rules per topic", "Encryption in transit"] },
      } },
        "Kafka discards old events after the retention period set for the topic. Its documentation calls that period an SLA on how soon consumers must read their data. The default in Kafka 4.4 is 7 days.",
        "Long retention is one reason logs move to object storage. Kafka tiered storage keeps completed log segments in a remote tier such as S3, Pulsar moves older messages from BookKeeper to object storage, and the accepted proposal KIP-1150 lets Kafka write through to object storage.",
        "The Kafka protocol is also offered by other services. Azure Event Hubs provides a Kafka endpoint, Redpanda states that it is compatible with the Kafka protocol, and WarpStream describes a diskless platform on object stores that stays compatible with Kafka."],
      claims: ["event-logs-and-streams-retention", "event-logs-and-streams-retention-default", "event-logs-and-streams-acl", "event-logs-and-streams-encryption",
        "event-logs-and-streams-tiered", "event-logs-and-streams-pulsar-tiered", "event-logs-and-streams-diskless", "event-logs-and-streams-compatible"],
    }),
  ],
  governance: { text: "Access is granted per topic: a Kafka ACL allows or denies a principal an operation such as Read or Write on a topic. Each topic has its own retention period, and traffic between clients and brokers is encrypted with SSL/TLS once it is switched on.", claims: ["event-logs-and-streams-acl", "event-logs-and-streams-retention", "event-logs-and-streams-encryption"] },
  closing: {
    pitfalls: [
      "Relying on order across partitions when the guarantee is stated per partition.",
      "Setting a retention period shorter than the time a consumer may need to catch up or replay.",
      "Assuming encryption is on. In Kafka, SSL is disabled until it is configured.",
    ],
    questions: [
      "Why can Support read events that Finance has already read?",
      "What does a consumer group store for each partition?",
      "How far back can a replay reach, and what sets that limit?",
    ],
  },
});
