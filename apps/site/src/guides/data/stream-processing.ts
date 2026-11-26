import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";

// One order rides continuously through a stateful job. A board above the floor holds one event-time window;
// the watermark advances along its own rail and decides when that window can be closed.
const G = isoGrid(180, 220, 27);
const end = 22;
const main = line("orders", [G.p(0, 0), G.p(end, 0)], { always: true });
const wmLine = line("watermark", [G.p(4, -3), G.p(19, -3)], { tone: "ink", w: 3, group: "time" });
const boardAt: [number, number] = [500, 315];
const windowTable = (id: string, rows: Parameters<typeof table>[5], group: string, sub: string) =>
  raise(table(id, 0, 0, 280, ["channel", "orders", "window"], rows, { at: [12, 90, 184], rowH: 24, title: "5-minute window", sub, group }), boardAt, 110);

export default defineGuide({
  id: "stream-processing", track: "data", module: "Transformation", slug: "stream-processing",
  title: "Stream processing",
  summary: "Continuous computation keeps state, groups events into windows and uses watermarks to decide when late data is final.",
  forLeads: "The lateness policy is a correctness decision. It sets how long a result can change, what happens to an event that arrives after that boundary, and when the state for a window can be cleared.",
  status: "draft", minutes: 7,
  counters: ["Window state", "Event-time progress", "Late orders", "Result"],
  whatIf: { label: "What if the job used arrival time?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and times are illustrative",
    label: "Checkout sends order events along a rail to a stream-processing job and Finance. A raised table holds the running total for a five-minute event-time window. A second rail carries the watermark that signals event-time progress. When the watermark passes the window end, the job emits the result and can clear its state. A late order can update that result during allowed lateness; beyond the chosen boundary it is dropped or sent to a side output.",
    els: [
      main,
      stop("in", ...G.p(0, 0), undefined, undefined, { big: true, always: true }),
      stop("window", ...G.p(7, 0), undefined, undefined, { always: true }),
      stop("job", ...G.p(13, 0), undefined, undefined, { always: true }),
      stop("sink", ...G.p(end, 0), undefined, undefined, { big: true, always: true }),
      drum("checkout", -1, -4, 1, 42, { hue: "sky", glyph: "stack", title: "Checkout", sub: "writes orders", at: "n", always: true }),
      prism("processor", 10, -11, 1.5, 1.5, 32, { hue: "track", glyph: "clock", title: "Stream job", sub: "stateful window", at: "se", always: true }),
      prism("finance", 18, -8, 1.4, 1.4, 30, { hue: "sand", glyph: "chart", title: "Finance", sub: "reads totals", at: "se", always: true }),

      windowTable("raw", [["web", "2", "10:00-10:05"], ["store", "1", "10:00-10:05"]], "arrival", "arrival-time count"),
      windowTable("open", [["web", "2", "10:00-10:05"], ["store", "1", "10:00-10:05"]], "open", "open, state retained"),
      windowTable("closed", [["web", "2", "10:00-10:05"], ["store", "1", "10:00-10:05"]], "closed", "emitted at 10:06"),
      windowTable("updated", [{ cells: ["web", "3", "10:00-10:05"], hot: true }, ["store", "1", "10:00-10:05"]], "updated", "late order included"),
      windowTable("final", [["web", "2", "10:00-10:05"], ["store", "1", "10:00-10:05"]], "final", "state cleared at 10:08"),

      wmLine,
      stop("wm-start", ...G.p(4, -3), undefined, undefined, { group: "time" }),
      stop("wm-mid", ...G.p(16, -3), undefined, undefined, { group: "time" }),
      stop("wm-end", ...G.p(19, -3), undefined, undefined, { group: "time" }),

      line("late-route", [G.p(13, 0), G.p(13, 3), G.p(18, 3)], { group: "late" }),
      stop("late-in", ...G.p(13, 3), undefined, undefined, { group: "late" }),
      stop("late-out", ...G.p(18, 3), undefined, undefined, { group: "late" }),
      pill("late-label", [470, 485], "Late data", { tone: "alert", glyph: "clock", sub: "after allowed lateness", group: "late" }),
      pill("side-output", [790, 100], "Side output", { glyph: "arrow", sub: "inspect discarded events", group: "late" }),
    ],
  },
  steps: [
    step({
      id: "arrival", label: "Arrival", kind: "problem", title: "Arrival time can misplace an order",
      caption: "Order 4471 occurred at 10:04 but reached the job at 10:08. Grouping by arrival time puts it in a later window than the order belongs to.",
      show: ["arrival"], counters: ["not retained", "not tracked", "1 delayed", "misgrouped"],
      rides: [ride("orders", "in", "window", "4471 10:04")],
      body: ["A stream is unbounded, so a count over all its records has no final value. Stream processing scopes calculations such as counts and sums to windows."],
      claims: ["stream-processing-windows", "stream-processing-time"],
    }),
    step({
      id: "event-time", label: "Event time", kind: "idea", title: "Event time follows when the order happened",
      caption: "The order carries its occurrence time. The stream job groups it by 10:04 even though the event arrived at 10:08.",
      show: ["open", "time"], counters: ["retained", "10:03", "1 delayed", "window open"],
      rides: [ride("orders", "in", "job", "4471 10:04")],
      body: ["Flink distinguishes event time, when the event occurred on its producing device, from processing time, the system clock of the machine running the operation. Kafka Streams uses timestamps on records to define the time semantics for its windows."],
      claims: ["stream-processing-time", "stream-processing-kafka-grace"],
    }),
    step({
      id: "window", label: "Window", kind: "mechanism", title: "A window groups events into a bounded calculation",
      caption: "The job keeps counts by channel for 10:00 to 10:05. Its state holds the partial totals while more events for that window may arrive.",
      show: ["open", "time"], counters: ["3 events", "10:03", "1 delayed", "partial total"],
      rides: [ride("orders", "window", "job", "4472 10:02", { then: "web +1" })],
      body: ["A window assigner puts each event into one or more time windows. Tumbling windows are fixed and non-overlapping; a sliding window can overlap and assign one event to multiple windows. Windowed operators retain state to build their aggregates.",
        "Kafka Streams windows group records with the same key. Apache Flink and Spark Structured Streaming also support windowed aggregation. Flink SQL expresses tumbling and hopping windows in the query."],
      claims: ["stream-processing-windows", "stream-processing-state", "stream-processing-sql-window"],
    }),
    step({
      id: "watermark", label: "Watermark", kind: "mechanism", title: "A watermark signals progress in event time",
      caption: "The watermark reaches 10:06, past the 10:05 window end. The job emits its total and treats the window as closed.",
      show: ["closed", "time"], counters: ["emitted", "10:06", "0", "window result"],
      rides: [ride("watermark", "wm-start", "wm-mid", "10:06")],
      body: ["A Flink watermark at t declares that event time has reached t and no events timestamped at or before t are expected. A watermark tells the window operator when event time has passed the window's end."],
      claims: ["stream-processing-watermark"],
    }),
    step({
      id: "late", label: "Late event", kind: "watch-out", title: "Allowed lateness can revise an emitted result",
      caption: "Order 4473 has time 10:04 and arrives at 10:07. The job retains window state through 10:08, so the late order updates the web total.",
      show: ["updated", "time", "late"], counters: ["retained until 10:08", "10:06", "1 included", "revised total"],
      rides: [ride("orders", "in", "late-in", "4473 10:04", { tone: "alert" }), ride("late-route", "late-in", "late-out", "web +1")],
      body: ["Flink's allowed-lateness setting retains a window after its end watermark. A late event may cause the window to fire again and emit an updated result. Kafka Streams expresses this waiting period as the window grace period. Spark Structured Streaming uses withWatermark to bound retained state and allow late data to update aggregates."],
      claims: ["stream-processing-late", "stream-processing-kafka-grace", "stream-processing-spark-watermark"],
    }),
    step({
      id: "decision", label: "Decide", kind: "decision", title: "Choose when a window becomes final",
      caption: "",
      show: ["final", "time", "late"], counters: ["cleared at 10:08", "10:08", "after boundary", "final total"],
      rides: [ride("orders", "in", "sink", "4471 10:04"), ride("watermark", "wm-mid", "wm-end", "10:08")],
      body: [{ pair: {
        left: { label: "Keep state", items: ["Allow late updates", "Emit a revised result"] },
        right: { label: "Clear state", items: ["Bound memory", "Drop or route later events"] },
      } },
        "Flink drops late events by default once the watermark passes the window end. It can retain state for an allowed-lateness period and route discarded events to a side output. Kafka Streams uses a grace period to set the latest arrival accepted for a window."],
      claims: ["stream-processing-late", "stream-processing-kafka-grace", "stream-processing-policy"],
    }),
  ],
  governance: { text: "The lateness policy is a correctness decision. State how long a window accepts late events and whether events beyond that boundary are dropped or routed for review, because that choice determines when downstream results are treated as final.", claims: ["stream-processing-policy"] },
  closing: {
    pitfalls: [
      "Grouping by processing time when the question is about when an order occurred.",
      "Using a long lateness threshold without accounting for retained window state and delayed output.",
      "Treating the first emitted window result as final when late updates are still allowed.",
    ],
    questions: [
      "Does the business question use event time or processing time?",
      "How late can an order arrive and still change the result?",
      "Who reviews events that arrive beyond the window's lateness boundary?",
    ],
  },
});
