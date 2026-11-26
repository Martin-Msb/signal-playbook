import { CANVAS, defineGuide, isoGrid, line, pill, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(350, 270, 20);
const route = (y: number) => [G.p(0, y), G.p(20, y)];
const gate = (id: string, gx: number, gy: number, group?: string) => stop(id, ...G.p(gx, gy), undefined, undefined, { group, big: true });

export default defineGuide({
  id: "delivery-guarantees", track: "data", module: "Ingestion", slug: "delivery-guarantees",
  title: "Delivery guarantees",
  summary: "A failed acknowledgement can make a sender retry an event that was already committed. Delivery modes decide whether failures can lose or duplicate results; replay, deduplication and idempotent writes make retries safe.",
  forLeads: "A pipeline's guarantee ends at the boundary of its state and sink. Reconcile delivered event identifiers with the source so gaps and duplicates are measurable, and make any external write safe to retry.",
  status: "draft", minutes: 7,
  counters: ["Source events", "Sink writes", "Retry result", "Reconciliation"],
  whatIf: { label: "What if the acknowledgement is lost?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso, note: "Orders and event identifiers are illustrative",
    label: "Order 4471 moves from the source to a sink across a network that can fail. When the acknowledgement disappears after commit, the sender retries. The route compares at-most-once loss with at-least-once duplicates, then adds deduplication and idempotent writes. Checkpoints coordinate replay with state; source-to-sink reconciliation exposes gaps and duplicates.",
    els: [
      line("main", route(0), { always: true }),
      gate("src-stop", 0, 0), gate("net-stop", 6, 0), gate("sink-stop", 12, 0), gate("audit-stop", 20, 0),
      prism("source", -1.2, -4.1, 2, 2, 32, { glyph: "stack", hue: "sky", title: "Order log", sub: "replayable source", at: "n", always: true }),
      prism("network", 5.2, -4, 1.6, 2, 26, { glyph: "arrows", hue: "sand", title: "Network", sub: "ack may be lost", at: "n", always: true }),
      prism("sink", 9, -8, 2, 2, 32, { glyph: "database", hue: "mint", title: "Ledger", sub: "committed writes", at: "n", always: true }),
      pill("retry", G.p(0, -12), "retry", { glyph: "rotate", tone: "alert", group: "retry" }),
      pill("lost", G.p(2, 8), "ack lost", { tone: "alert", group: "retry" }),
      pill("once", G.p(17, -5), "one result per id", { glyph: "key", tone: "track", group: "dedupe" }),
      pill("idem", G.p(13, 4), "same key, same write", { glyph: "lock", tone: "track", group: "dedupe" }),
      pill("checkpoint", G.p(9, 5), "checkpoint: state + offset", { glyph: "save", group: "exact" }),
      pill("reconcile", G.p(16, -8), "compare source IDs", { glyph: "search", tone: "track", group: "audit" }),
      pill("gap", G.p(17, 6), "gap or duplicate", { glyph: "alert", tone: "alert", group: "audit" }),
      pill("drop", G.p(3.5, 4), "not replayed", { tone: "alert", group: "at-most" }),
      pill("dup", G.p(16, 5), "4471 twice", { tone: "alert", group: "at-least" }),
    ],
  },
  steps: [
    step({
      id: "uncertain", label: "Failure", kind: "problem", title: "The acknowledgement disappears",
      caption: "The ledger commits order 4471, but its acknowledgement is lost. The sender cannot tell whether the write happened.",
      show: ["retry"], counters: ["4471", "1", "uncertain", "none"],
      rides: [ride("main", "src-stop", "sink-stop", "4471")],
      body: ["A timeout describes what the sender observed, not whether the sink committed the write. Retrying may send the same event again."],
      claims: ["delivery-guarantees-retry"],
    }),
    step({
      id: "at-most", label: "At most", kind: "idea", title: "At-most-once may lose an event",
      caption: "If the sender does not retry, an event not received by the sink is lost. A committed event is not duplicated by a retry.",
      show: ["at-most"], counters: ["4471", "0 or 1", "no retry", "none"],
      rides: [ride("main", "src-stop", "net-stop", "4471")],
      body: ["Flink describes at-most-once as making no effort to recover from failures. The guarantee accepts possible loss to avoid duplicate results."],
      claims: ["delivery-guarantees-modes"],
    }),
    step({
      id: "at-least", label: "At least", kind: "mechanism", title: "Retry until acknowledged",
      caption: "The sender retries until it receives an acknowledgement. If the first write committed, the retry can create a duplicate.",
      show: ["retry", "at-least"], counters: ["4471", "1 or more", "retry", "none"],
      rides: [ride("main", "src-stop", "sink-stop", "4471", { via: ["net-stop"], then: "4471 again" })],
      body: ["At-least-once avoids loss by retrying, but the same event may be delivered more than once. The pipeline must account for duplicates."],
      claims: ["delivery-guarantees-modes", "delivery-guarantees-retry"],
    }),
    step({
      id: "dedupe", label: "Idempotent", kind: "mechanism", title: "Make the retry safe",
      caption: "A stable event ID lets the sink recognise a repeat. An idempotent write makes applying the same update again leave the same result.",
      show: ["retry", "at-least", "dedupe"], counters: ["4471", "one per ID", "deduplicated", "IDs compared"],
      rides: [ride("main", "src-stop", "sink-stop", "4471", { via: ["net-stop"], then: "4471, same ID" })],
      body: ["Dataflow tags messages with unique IDs and drops IDs already committed. Google recommends idempotent custom sinks so retries do not cause unintended side effects.",
        "Use an idempotency key tied to the logical operation, not to each attempt."],
      claims: ["delivery-guarantees-retry", "delivery-guarantees-idempotent"],
    }),
    step({
      id: "checkpoint", label: "Checkpoint", kind: "watch-out", title: "Exactly-once has a boundary",
      caption: "Flink checkpoints pair source positions with operator state. End-to-end exactly-once also needs a replayable source and transactional or idempotent sink.",
      show: ["retry", "dedupe", "exact"], counters: ["replayable", "transactional or idempotent", "recovered", "state + offset"],
      rides: [ride("main", "src-stop", "sink-stop", "4471", { via: ["net-stop"], then: "restored 4471" })],
      body: ["Exactly-once refers to the result, not necessarily one execution of every processing function. A function may run again after recovery; the state and sink must preserve the intended result.",
        "An external side effect is outside the guarantee unless the sink implements exactly-once semantics."],
      claims: ["delivery-guarantees-processing", "delivery-guarantees-end-to-end", "delivery-guarantees-checkpoint", "delivery-guarantees-side-effects"],
    }),
    step({
      id: "decision", label: "Reconcile", kind: "decision", title: "Measure the delivery boundary",
      caption: "",
      show: ["retry", "dedupe", "exact", "audit"], counters: ["source IDs", "committed IDs", "reconciled", "gaps and duplicates"],
      rides: [ride("main", "src-stop", "audit-stop", "4471")],
      body: [{ pair: {
        left: { label: "At-least-once", items: ["Retry when acknowledgement is uncertain", "Deduplicate by stable event ID", "Make external writes idempotent"] },
        right: { label: "At-most-once", items: ["Do not retry", "Accept possible loss", "Reconcile against the source"] },
      } }, "Reconcile source event IDs with committed sink IDs. Monitor missing and repeated IDs so delivery defects are measurable."],
      claims: ["delivery-guarantees-retry", "delivery-guarantees-idempotent"],
    }),
  ],
  governance: { text: "Duplicates and gaps are measurable delivery defects. Reconcile event identifiers with the source and keep the delivery guarantee explicit at each sink boundary; processing logs alone do not prove that an external write committed.", claims: ["delivery-guarantees-retry", "delivery-guarantees-side-effects"] },
  closing: {
    pitfalls: [
      "Calling an in-memory retry exactly-once when the sink can commit twice.",
      "Generating a new idempotency key for each attempt.",
      "Assuming exactly-once processing covers an external side effect.",
    ],
    questions: [
      "Can the source replay an event after a failure?",
      "Does the sink deduplicate by a stable event identifier or make the write idempotent?",
      "How do you reconcile committed event IDs with the source?",
    ],
  },
});
