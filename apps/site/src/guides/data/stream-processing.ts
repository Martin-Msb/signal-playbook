import { CANVAS, band, defineGuide, drum, isoGrid, line, note, pill, plot, plotPoint, prism, raise, ride, rule, series, shade, step, stop, table } from "@signal-path/engine";
import type { El, PlotEl, Row } from "@signal-path/engine";

// The picture is a chart of seven orders. Each dot sits at its event time (across) and its arrival time (up), in minutes after 10:00.
// Windows are bands on the event-time axis, the present is a line that climbs the arrival axis, and the watermark is a line that moves right.
// Beside the chart the stream job holds the per-window count as state, emits a window's count to Finance, and routes a late order to a side output.
const G = isoGrid(664, 316, 30);

/** Orders 4468 to 4474 without 4471: [event time, arrival time]. */
const ON_TIME: [number, number][] = [[1, 1.3], [2.4, 2.8], [3.5, 3.8], [5.6, 6], [7, 7.2], [8, 8.2]];
/** Order 4471: sold in a store at 10:04, sent by the till at 10:09. */
const LATE: [number, number] = [4, 9];
const END = 5, LATENESS = 2, MAX = 10.4;

const TIMES = ["10:00", "10:05", "10:10"];
const CHART: PlotEl = raise(plot("chart", 0, 0, 540, 452, [0, MAX], [0, MAX], {
  title: "Orders", sub: "one dot per order", xt: [0, 5, 10], yt: [0, 5, 10], xtl: TIMES, ytl: TIMES, xLabel: "event time", yLabel: "arrival time", grid: false, always: true,
}), [294, 522], 14);
const at = (x: number, y: number) => plotPoint(CHART, x, y);
const say = (id: string, x: number, y: number, text: string, group: string | undefined, extra: Partial<El> = {}): El =>
  ({ ...note(id, Math.round(at(x, y)[0]), Math.round(at(x, y)[1]), text, { strong: true, size: 12, on: "chart", group }), ...extra } as El);

/** The present: orders above the line have not arrived yet. */
const now = (id: string, t: number, label: string): El[] => [
  shade(`${id}-ahead`, "chart", [0, t, MAX, MAX], { tone: "muted", group: id }),
  rule(`${id}-line`, "chart", t, { axis: "y", tone: "ink", w: 2, label, group: id }),
  say(`${id}-n`, 0.15, t + 0.25, "not yet arrived", id, { tone: "muted" }),
];
/** The watermark: a line on the event-time axis, with a track under the top edge for its marker to ride. */
const watermark = (id: string, from: number, to: number): El[] => [
  rule(`${id}-line`, "chart", to, { w: 3, group: id }),
  series(id, "chart", "line", [[from, 9.45], [to, 9.45]], { w: 3, group: id }),
];

const STATE_AT: [number, number] = [786, 176];
const counts = (id: string, sub: string, cols: string[], rows: Row[]): El =>
  raise(table(id, 0, 0, 300, cols, rows, { at: cols.length === 2 ? [14, 170] : [14, 128, 190], rowH: 26, title: cols.length === 2 ? "Orders per window" : "Window state", sub, group: id }), STATE_AT, 22);
const W1 = "10:00-10:05", W2 = "10:05-10:10";
const policy = (id: string, sub: string, extra: { tone?: "alert" } = {}): El =>
  pill(id, [668, 452], "Lateness policy", { glyph: "clock", sub, group: id, ...extra });

export default defineGuide({
  id: "stream-processing", track: "data", module: "Transformation", slug: "stream-processing",
  title: "Stream processing",
  summary: "Continuous computation keeps state, groups events into windows and uses watermarks to decide when late data is final.",
  forLeads: "The lateness policy is a correctness decision. It sets how late an event can arrive and still be counted, what happens to events after that, and whether a published result can change.",
  status: "draft", minutes: 7,
  counters: ["Window state", "Watermark", "Count for 10:00-10:05", "Order 4471"],
  whatIf: { label: "What if windows used arrival time?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and times are illustrative",
    label: "A chart shows seven Vinterhus orders as dots, placed across by event time and upward by arrival time, from 10:00 to 10:10. Six orders arrive seconds after they happen. Order 4471 is sold at 10:04 and arrives at 10:09. First the chart is cut into bands by arrival time, which puts order 4471 in the wrong band. Then it is cut into five-minute windows on the event-time axis. A horizontal line marks the present and greys out orders that have not arrived, and a table beside the chart holds the count the stream job keeps for each window. A vertical watermark line moves right as newer orders arrive. When it reaches 10:05 the first window closes and its count of 3 travels along a rail from the stream job to Finance. Order 4471 then arrives late and is routed along a branch to a side output. With two minutes of allowed lateness the window is still kept, the order is counted and a revised count of 4 is emitted.",
    els: [
      CHART,

      // 1. Cut by arrival time: horizontal bands.
      band("a1", "chart", 0, 5, { axis: "y", group: "arrival" }),
      band("a2", "chart", 5, MAX, { axis: "y", tone: "muted", group: "arrival" }),
      rule("a-edge", "chart", 5, { axis: "y", tone: "ink", w: 1.5, group: "arrival" }),
      say("a1-n", 9.85, 4.45, "arrived 10:00-10:05: 3 orders", "arrival", { anchor: "end" }),
      say("a2-n", 9.85, 5.22, "arrived 10:05-10:10: 4 orders", "arrival", { anchor: "end" }),

      // 2 onward. Cut by event time: vertical bands, one per five-minute window.
      band("w1-open", "chart", 0, END, { group: "w1-open" }),
      band("w1-closed", "chart", 0, END, { tone: "muted", group: "w1-closed" }),
      band("w2", "chart", END, MAX, { tone: "muted", group: "event" }),
      band("w2-open", "chart", END, MAX, { group: "w2-open" }),
      rule("w-edge", "chart", END, { tone: "ink", w: 1.5, group: "event" }),
      say("w1-n-open", 0.15, 0.2, `window ${W1}`, "w1-open"),
      say("w1-n-closed", 0.15, 0.2, `${W1} closed`, "w1-closed", { tone: "muted" }),
      say("w2-n", 5.15, 0.2, `window ${W2}`, "event"),

      // 6. Allowed lateness: the first window stays open until the watermark reaches 10:07.
      band("grace", "chart", END, END + LATENESS, { group: "grace" }),
      say("grace-n", 5.15, 2.7, "allowed lateness", "grace"),
      say("grace-n2", 5.15, 2.2, "2 min, to 10:07", "grace"),

      // 3 onward. The present.
      ...now("now-3", 4.5, "now 10:04:30"), ...now("now-4", 7.35, "now 10:07"), ...now("now-5", 9.12, "now 10:09"),

      // The orders.
      series("delay", "chart", "line", [[4, 4], LATE], { dashed: true, tone: "alert", w: 2.5, group: "delay" }),
      series("drop", "chart", "line", [LATE, [4, 1.1]], { dashed: true, w: 2.5, group: "drop" }),
      series("orders", "chart", "points", ON_TIME, { r: 6, always: true }),
      series("late", "chart", "points", [LATE], { hue: "rose", r: 6, hot: [0], always: true }),
      say("late-n", 4, LATE[1] - 0.62, "order 4471", undefined, { anchor: "middle", always: true }),

      // 4 onward. The watermark trails the newest event time by two minutes.
      ...watermark("wm-4", 2.5, 5), ...watermark("wm-5", 5, 6), ...watermark("wm-6", 6, 6),

      // The job, its state and what leaves it.
      line("out", [G.p(0, 0), G.p(7, 0)], { always: true }),
      stop("job", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("sent", ...G.p(4.3, 0), undefined, undefined, { group: "anchor" }),
      stop("finance", ...G.p(7, 0), undefined, undefined, { always: true }),
      prism("processor", -1.7, -0.7, 1.4, 1.4, 30, { hue: "track", glyph: "clock", title: "Stream job", sub: "counts orders", at: "s", always: true }),
      prism("fin", 7.3, -0.7, 1.4, 1.4, 28, { hue: "sand", glyph: "chart", title: "Finance", sub: "reads counts", at: "s", always: true }),

      line("side", [G.p(0, 0), G.p(0, -3.6)], { group: "side" }),
      stop("side-rest", ...G.p(0, -2), undefined, undefined, { group: "anchor" }),
      stop("side-end", ...G.p(0, -3.6), undefined, undefined, { group: "side" }),
      drum("late-store", 0, -4.7, 0.8, 24, { hue: "rose", glyph: "stack", title: "Side output", sub: "late orders", at: "e", group: "side" }),

      counts("by-arrival", "cut by arrival time", ["window", "orders"], [{ cells: [W1, "3"], hot: true }, [W2, "4"]]),
      counts("by-event", "cut by event time", ["window", "orders"], [{ cells: [W1, "4"], hot: true }, [W2, "3"]]),
      counts("state-3", "held by the job", ["window", "count", "state"], [{ cells: [W1, "3", "open"], hot: true }, { cells: [W2, "", "not created"], mute: true }]),
      counts("state-4", "held by the job", ["window", "count", "state"], [{ cells: [W1, "3", "emitted"], strike: true }, { cells: [W2, "2", "open"], hot: true }]),
      counts("state-5", "held by the job", ["window", "count", "state"], [{ cells: [W1, "3", "cleared"], strike: true }, [W2, "3", "open"]]),
      counts("state-6", "held by the job", ["window", "count", "state"], [{ cells: [W1, "4", "kept to 10:07"], hot: true }, [W2, "3", "open"]]),

      policy("policy-0", "none: late is dropped", { tone: "alert" }),
      policy("policy-2", "2 min, then side output"),
    ],
  },
  steps: [
    step({
      id: "arrival", label: "Arrival", kind: "problem", title: "Counting by arrival time misplaces a late order",
      caption: "Order 4471 is sold in a store at 10:04, but the till sends it at 10:09. Five-minute windows cut on arrival time count it in the wrong window.",
      show: ["arrival", "delay", "by-arrival"], counters: ["none", "none", "3, one short", "in the wrong window"],
      rides: [ride("delay", 0, 1, "sold 10:04", { then: "arrives 10:09", tone: "alert" }), ride("out", "job", "sent", "10:00-10:05: 3", { tone: "alert" })],
      body: ["A stream has no end, so it is impossible to count all its elements. Counts and sums on a stream are scoped by windows.",
        "Apache Flink defines event time as the time that each individual event occurred on its producing device, and processing time as the system time of the machine that is executing the operation. Kafka Streams notes that out-of-order records are always possible in the real world and exist only under event time: under processing time no record can be out of order."],
      claims: ["stream-processing-time", "stream-processing-windows", "stream-processing-kafka-grace"],
    }),
    step({
      id: "event-time", label: "Event time", kind: "idea", title: "Windows are cut on event time",
      caption: "Each order is drawn at the time it happened. Tumbling five-minute windows are bands on that axis, and order 4471 falls in 10:00 to 10:05 whenever it arrives.",
      show: ["event", "w1-open", "w2-open", "drop", "by-event"], counters: ["none", "none", "4", "in its window"],
      rides: [ride("drop", 0, 1, "4471", { then: "event 10:04" })],
      body: ["In Flink a window assigner assigns each incoming element to one or more windows. Tumbling windows have a fixed size and do not overlap. Sliding windows can overlap when the slide is smaller than the window size.",
        "Kafka Streams windowing groups records that have the same key for stateful operations such as aggregations or joins. Streaming SQL states the window in the query: Flink SQL supports TUMBLE, HOP, CUMULATE and SESSION window aggregations."],
      claims: ["stream-processing-windows", "stream-processing-kafka-grace", "stream-processing-sql-window"],
    }),
    step({
      id: "state", label: "State", kind: "mechanism", title: "The job keeps a count for each open window",
      caption: "At 10:04:30 three orders have arrived for the first window. The count is state: the job holds it while more orders for that window may still come.",
      show: ["event", "w1-open", "w2-open", "now-3", "state-3"], counters: ["1 window open", "none yet", "3 so far", "not arrived"],
      body: ["Flink calls operations that remember information across multiple events stateful, and names window operators as an example. When events are aggregated per minute, hour or day, the state holds the pending aggregates. A window is created as soon as the first element that belongs to it arrives.",
        { callout: { label: "Key idea", text: "The order that is still on its way sits in the first window's band. On the clock it is 10:04:30, and nothing tells the job whether the count of 3 is complete." } }],
      claims: ["stream-processing-state"],
    }),
    step({
      id: "watermark", label: "Watermark", kind: "mechanism", title: "The watermark closes a window when it passes its end",
      caption: "The watermark trails the newest event time by two minutes. Order 4473, sold at 10:07, moves it to 10:05. The window fires and its count of 3 goes to Finance.",
      show: ["event", "w1-closed", "w2-open", "now-4", "wm-4", "state-4"], counters: ["cleared at close", "10:05", "3 emitted", "not arrived"],
      rides: [ride("wm-4", 0, 1, "watermark", { then: "watermark 10:05" }), ride("out", "job", "sent", "10:00-10:05: 3")],
      body: ["Flink measures progress in event time with watermarks. A watermark for time t declares that event time has reached t in that stream, meaning that no more elements with a timestamp of t or earlier should arrive. A window operator needs that signal to close the window in progress.",
        "Flink's built-in generator for a fixed amount of lateness emits watermarks that lag behind the maximum event-time timestamp seen in the stream by a fixed amount of time. Its event-time trigger fires once the watermark passes the end of a window.",
        "Spark Structured Streaming sets the same bound with withWatermark, which names the event-time column and a threshold for how late data is expected to be, and it uses the watermark to clean up old state. A Flink SQL window aggregation emits only a final result at the end of the window and purges intermediate state when it is no longer needed."],
      claims: ["stream-processing-watermark", "stream-processing-trigger", "stream-processing-spark-watermark", "stream-processing-sql-window"],
    }),
    step({
      id: "late", label: "Late order", kind: "watch-out", title: "A late order finds its window closed",
      caption: "Order 4471 arrives when the watermark is at 10:06, past the window's end. By default it is dropped. Here a side output catches it, and Finance still holds 3.",
      show: ["event", "w1-closed", "w2-open", "now-5", "wm-5", "delay", "state-5", "side", "policy-0"], counters: ["cleared", "10:06", "3 emitted", "late, side output"],
      rides: [ride("wm-5", 0, 1, "watermark 10:05", { then: "watermark 10:06" }), ride("side", "job", "side-rest", "4471 late", { tone: "alert" })],
      body: ["Flink defines late elements as elements that arrive after the system's event time clock, as signalled by the watermarks, has already passed their timestamp. By default late elements are dropped when the watermark is past the end of the window, and the default allowed lateness is 0.",
        "Flink's side output feature gives a stream of the data that was discarded as late. Kafka Streams discards a record that arrives after the grace period of its window has passed: the record is not processed in that window."],
      claims: ["stream-processing-late", "stream-processing-kafka-grace"],
    }),
    step({
      id: "decision", label: "Decide", kind: "decision", title: "The lateness policy decides when a count is final",
      caption: "",
      show: ["event", "w1-open", "w2-open", "grace", "now-5", "wm-6", "state-6", "side", "policy-2"], counters: ["kept to 10:07", "10:06", "4, revised", "counted"],
      rides: [ride("wm-6", 1, 1, "watermark 10:06"), ride("out", "job", "sent", "10:00-10:05: 4")],
      body: [{ pair: {
        left: { label: "Allowed lateness", items: ["Keeps window state longer", "Emits a revised count"] },
        right: { label: "Side output", items: ["Keeps the first count", "Collects discarded late orders"] },
      } },
        "With an allowed lateness, Flink still adds elements that arrive after the watermark has passed the end of the window but before the end plus the allowed lateness. Depending on the trigger, such an element may cause the window to fire again. Flink keeps the state of windows until their allowed lateness expires, and the elements emitted by a late firing should be treated as updated results of a previous computation.",
        "The same decision has other names. In Kafka Streams the grace period controls how long a window waits for out-of-order records. In Spark Structured Streaming late data within the watermark threshold is aggregated, and data later than the threshold starts getting dropped.",
        { callout: { label: "Governance", text: "State the policy with the result: how long a window accepts late orders, where later ones go, and whether a count that Finance has read can still be revised." } }],
      claims: ["stream-processing-lateness", "stream-processing-kafka-grace", "stream-processing-spark-watermark", "stream-processing-policy"],
    }),
  ],
  governance: { text: "The lateness policy is a correctness decision and must be stated. It fixes how late an event can arrive and still be counted, what happens to later events, which are dropped by default, and whether an emitted result is final or can be revised by a late firing.", claims: ["stream-processing-policy", "stream-processing-late"] },
  closing: {
    pitfalls: [
      "Cutting windows on arrival time when the question is about when an order happened.",
      "Treating the first emitted count as final while allowed lateness can still revise it.",
      "Leaving the default in place, so late orders are dropped without anyone having chosen that.",
    ],
    questions: [
      "Does the question ask when an order happened or when the system received it?",
      "How late can an order arrive and still change a count that has been emitted?",
      "Where do orders go after that boundary, and who reads them?",
    ],
  },
});
