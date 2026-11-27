import { blocks, CANVAS, defineGuide, drum, isoGrid, line, list, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Row } from "@signal-path/engine";

// The floor: two rows of blocks, one colour per order. The back row is what Checkout sent, the front row is what the ledger holds.
// A message travels down the rail from its sent block to its ledger slot. A lost message leaves a dashed slot, a retry adds a red block in front.
// Each block is its own element, so a stop can swap one slot without redrawing the row.
const G = isoGrid(500, 100, 30);
const SIZE = 1.2, STEP = 2.15, H = 20;
const SENT = 0, LEDGER = 7.5, FRONT = LEDGER + SIZE + 0.4, LANE = 4.3;
const slot = (k: number) => k * STEP + SIZE / 2;
const X = slot(3), END = 5 * STEP + SIZE;
const BOARD: [number, number] = [815, 510];
const up = (gx: number, gy: number, dy: number): [number, number] => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
const ORDERS: { n: string; hue: Hue }[] = [
  { n: "4468", hue: "sand" }, { n: "4469", hue: "sky" }, { n: "4470", hue: "mint" }, { n: "4471", hue: "track" }, { n: "4472", hue: "violet" }, { n: "4473", hue: "rose" },
];
const sent = (k: number): El => blocks(`sent-${k}`, k * STEP, SENT, 1, SIZE, [{ h: H, hue: ORDERS[k].hue, label: ORDERS[k].n }], { at: "n", ...(k < 4 ? { always: true } : { group: "more" }) });
const row = (k: number): El => blocks(`row-${k}`, k * STEP, LEDGER, 1, SIZE, [{ h: H, hue: ORDERS[k].hue }], k < 3 ? { always: true } : { group: k === 3 ? "row" : "more" });
const ledger = (id: string, rows: Row[], sub: string): El =>
  raise(table(id, 0, 0, 216, ["order", "amount"], rows, { at: [14, 118], rowH: 25, title: "Ledger", sub, mono: true, group: id }), BOARD, 30);

export default defineGuide({
  id: "delivery-guarantees", track: "data", module: "Ingestion", slug: "delivery-guarantees",
  title: "Delivery guarantees",
  summary: "A sender that gets no acknowledgement cannot tell whether its message was written. Not resending risks a gap, resending risks a duplicate, and an idempotent write makes the resend harmless.",
  forLeads: "A guarantee holds only as far as the write that records it. Ask each pipeline what a retry does to its target, and reconcile the target against the source so gaps and duplicates are counted.",
  status: "draft", minutes: 7,
  counters: ["Messages sent", "Ledger rows", "After a failure", "Difference"],
  whatIf: { label: "What if Checkout never resent?", step: 1, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and amounts are illustrative",
    label: "Two rows of blocks on the floor, one colour per order. The back row holds the messages Checkout sent, the front row the rows the ledger holds. A rail carries order 4471 from its sent block to its ledger slot. Without a retry the slot stays empty: five rows for six messages. With a retry a second red block appears: seven rows. With an idempotency key the retry lands on the same block. Then the row and the reader's offset sit inside one transaction outline. At the last stop a marker walks a lane between the rows and counts six against six.",
    els: [
      prism("co", -2.9, SENT, SIZE, SIZE, 30, { hue: "track", glyph: "pen", title: "Checkout", sub: "sends order events", at: "w", always: true }),
      drum("led", -2.25, LEDGER + SIZE / 2, 0.72, 26, { glyph: "database", title: "Ledger", sub: "one row per order", at: "w", always: true }),
      ...ORDERS.map((_, k) => sent(k)), ...ORDERS.map((_, k) => row(k)),

      // the delivery rail from the sent block of 4471 to its ledger slot
      line("rail", [G.p(X, SIZE + 0.3), G.p(X, LEDGER - 0.7)], { group: "rail" }),
      stop("send", ...G.p(X, 2.2), undefined, undefined, { group: "rail" }),
      stop("net", ...G.p(X, 3.45), "network", undefined, { at: "e", group: "rail" }),
      stop("land", ...G.p(X, 4.7), undefined, undefined, { group: "rail" }),

      // 1 and 2. the slot of 4471 is unknown, then empty
      blocks("hole", 3 * STEP, LEDGER, 1, SIZE, [{ h: H, state: "closed" }], { group: "hole" }),
      pill("ask", G.p(3.4, 12), "no acknowledgement", { sub: "written or not?", tone: "alert", to: up(X, LEDGER + SIZE, 2), group: "ask" }),
      pill("gap", G.p(3.4, 12), "gap", { sub: "4471 never arrived", tone: "alert", to: up(X, LEDGER + SIZE, 2), group: "gap" }),

      // 3. the retry is written as a second row
      blocks("dup", 3 * STEP, FRONT, 1, SIZE, [{ h: H, state: "alert", label: "4471 again" }], { at: "s", group: "dup" }),

      // 4. the key
      pill("key", G.p(3.4, 12), "Idempotency key", { sub: "same key, same row", glyph: "key", tone: "track", to: up(X, LEDGER + SIZE, 2), group: "key" }),

      // 5. the row and the offset inside one transaction
      blocks("offset", 3 * STEP, FRONT, 1, SIZE, [{ h: 10, hue: "paper", label: "offset 4" }], { at: "s", group: "tx" }),
      line("tx", [G.p(3 * STEP - 0.45, LEDGER - 0.45), G.p(3 * STEP + SIZE + 0.45, LEDGER - 0.45), G.p(3 * STEP + SIZE + 0.45, FRONT + SIZE + 0.45), G.p(3 * STEP - 0.45, FRONT + SIZE + 0.45)], { loop: true, w: 3, tone: "track", group: "tx" }),
      pill("txl", G.p(2.2, 11.6), "one transaction", { glyph: "lock", to: G.p(3 * STEP - 0.45, FRONT + 0.6), group: "tx" }),

      // 6. the reconciliation lane between the rows
      line("lane", [G.p(-0.4, LANE), G.p(END + 0.2, LANE)], { tone: "ink", w: 3, group: "audit" }),
      ...ORDERS.map((_, k) => stop(`a-${k}`, ...G.p(slot(k), LANE), String(k + 1), undefined, { mono: true, group: "audit" })),

      ledger("t-ask", [["4469", "349"], ["4470", "899"], { cells: ["4471", "?"], mute: true }], "3 rows, or 4"),
      ledger("t-gap", [["4470", "899"], { cells: ["4471", "1290"], strike: true }, ["4472", "1450"]], "5 rows"),
      ledger("t-dup", [["4470", "899"], ["4471", "1290"], { cells: ["4471", "1290"], hue: "rose" }, ["4472", "1450"]], "7 rows"),
      ledger("t-key", [["4470", "899"], { cells: ["4471", "1290"], hot: true }, ["4472", "1450"]], "6 rows"),
      raise(list("t-tx", 0, 0, 216, [{ t: "row 4471  1290" }, { t: "offset 3 to 4" }, { t: "commit", hot: true }], { title: "One transaction", mono: true, group: "t-tx" }), BOARD, 30),
      raise(table("t-rec", 0, 0, 216, ["check", "count"], [["sent", "6"], ["ledger rows", "6"], ["missing", "0"], ["duplicate", "0"]], { at: [14, 150], rowH: 25, title: "Reconciliation", group: "t-rec" }), [200, 510], 30),
    ],
  },
  steps: [
    step({
      id: "uncertain", label: "No answer", kind: "problem", title: "A lost acknowledgement leaves the sender guessing",
      caption: "Checkout sends order 4471 to the ledger and no acknowledgement returns. It cannot tell whether the row was written.",
      show: ["rail", "hole", "ask", "t-ask"], counters: ["4", "3 or 4", "unknown", "unknown"],
      rides: [ride("rail", "send", "land", "4471", { via: ["net"], then: "no answer" })],
      body: ["A network error says what the sender saw. It does not say what the receiver did. Kafka states the case for its producer: after a network error while publishing, the producer cannot be sure whether the error happened before or after the message was committed.",
        "Every delivery guarantee is an answer to this one situation."],
      claims: ["delivery-guarantees-uncertain"],
    }),
    step({
      id: "at-most", label: "At most once", kind: "idea", title: "At most once leaves a gap",
      caption: "Checkout never resends. Six messages were sent and five rows arrived. Order 4471 is missing from the ledger.",
      show: ["rail", "more", "hole", "gap", "t-gap"], counters: ["6", "5", "no resend", "1 missing"],
      rides: [ride("rail", "send", "net", "4471", { then: "lost" })],
      body: ["Kafka defines at most once as: messages may be lost but are never redelivered.",
        "Flink describes the same outcome for a stream job: it makes no effort to recover from failures."],
      claims: ["delivery-guarantees-semantics", "delivery-guarantees-modes"],
    }),
    step({
      id: "at-least", label: "At least once", kind: "mechanism", title: "At least once leaves a duplicate",
      caption: "Checkout resends until an acknowledgement arrives. The first write had succeeded, so order 4471 is in the ledger twice: seven rows for six messages.",
      show: ["rail", "more", "row", "dup", "t-dup"], counters: ["6", "7", "resend", "1 duplicate"],
      rides: [ride("rail", "send", "land", "4471 again", { via: ["net"], then: "second row" })],
      body: ["Kafka defines at least once as: messages are never lost but may be redelivered.",
        "Dataflow moves records between workers this way. The sending worker retries its remote call until it receives positive acknowledgement, and the documentation notes that these retries might create duplicates."],
      claims: ["delivery-guarantees-semantics", "delivery-guarantees-retry"],
    }),
    step({
      id: "idempotent", label: "Idempotent", kind: "mechanism", title: "An idempotency key lands the retry on the same row",
      caption: "The retry carries the same key as the first attempt. The ledger recognises the key and keeps one row. Delivered twice, written once: effectively once.",
      show: ["rail", "more", "row", "key", "t-key"], counters: ["6", "6", "resend, same key", "none"],
      rides: [ride("rail", "send", "land", "4471 again", { via: ["net"], then: "same row" })],
      body: ["Stripe's API takes an idempotency key that the client generates. The server uses it to recognise retries of the same request, so a request repeated after a connection error does not create a second object.",
        "Deduplication applies the same idea inside a pipeline. Kafka's idempotent producer sends a sequence number with every message, and the broker uses it with the producer's ID so that resending does not add duplicate entries to the log. Dataflow tags every message with a unique ID and drops a record whose ID it has already committed.",
        "Apache Pulsar names the result effectively-once: a message is persisted only once even if it is produced more than once.",
        { callout: { label: "Key idea", text: "The key belongs to the operation, not to the attempt. A new key on each retry is a new row." } }],
      claims: ["delivery-guarantees-idempotency-key", "delivery-guarantees-idempotent-producer", "delivery-guarantees-retry", "delivery-guarantees-effectively-once"],
    }),
    step({
      id: "transaction", label: "One commit", kind: "watch-out", title: "Exactly once needs the row and the offset in one commit",
      caption: "The reader's position in the log is stored with its output. Both commit or neither does, so a replay after a crash resumes at offset 4.",
      show: ["rail", "more", "row", "tx", "t-tx"], counters: ["6", "6", "replay from offset", "none"],
      rides: [ride("rail", "send", "land", "4471", { via: ["net"], then: "row + offset" })],
      body: ["Kafka lets a consumer store its offset in the same place as its output. Within Kafka, the offset is written in the same transaction as the output topics, and a transaction writes all of its messages or none of them.",
        "Flink states the conditions for exactly once end to end: the sources must be replayable and the sinks must be transactional or idempotent. In exactly-once mode its Kafka sink writes all messages in a Kafka transaction that is committed on a checkpoint.",
        "Exactly once describes the result. Flink recovers by rewinding and replaying the source, so an event may be processed again while it affects the managed state once.",
        "The guarantee stops at the transaction. Dataflow states that side effects, including writes to an external store, are not exactly once unless the sink implements exactly-once semantics itself. Where a custom sink is needed, it advises making the write idempotent."],
      claims: ["delivery-guarantees-offset-with-output", "delivery-guarantees-transactions", "delivery-guarantees-end-to-end", "delivery-guarantees-kafka-sink", "delivery-guarantees-processing", "delivery-guarantees-side-effects", "delivery-guarantees-idempotent"],
    }),
    step({
      id: "decision", label: "Reconcile", kind: "decision", title: "Count the ledger against what was sent",
      caption: "",
      show: ["more", "row", "audit", "t-rec"], counters: ["6", "6", "resend, same key", "0 missing, 0 duplicate"],
      rides: [ride("lane", "a-0", "a-5", "compare", { via: ["a-1", "a-2", "a-3", "a-4"], then: "6 = 6" })],
      body: [{ pair: {
        left: { label: "Safe retries", items: ["Resend until acknowledged", "One key per operation", "Row and offset in one commit"] },
        right: { label: "Reconciliation", items: ["Compare target with source", "A missing row is a gap", "An extra row is a duplicate"] },
      } },
        "A guarantee is a design claim until the target is compared with the source. AWS DMS data validation compares each row in the source with its corresponding row at the target and reports mismatches. Its failure types include a record missing at the target."],
      claims: ["delivery-guarantees-reconciliation"],
    }),
  ],
  governance: { text: "Gaps and duplicates are defects found by reconciling the target against the source. AWS DMS data validation compares each source row with its row at the target and reports mismatches, including rows missing at the target.", claims: ["delivery-guarantees-reconciliation"] },
  closing: {
    pitfalls: [
      "Generating a new idempotency key for each attempt, which turns every retry into a new row.",
      "Calling a pipeline exactly once when its last write to an external system is neither transactional nor idempotent.",
      "Committing the offset and the result separately, so a crash between the two loses or repeats a message.",
    ],
    questions: [
      "What does the target hold after the same message is written twice?",
      "Is the reader's offset committed together with its output?",
      "Which count shows a gap, and which shows a duplicate?",
    ],
  },
});
