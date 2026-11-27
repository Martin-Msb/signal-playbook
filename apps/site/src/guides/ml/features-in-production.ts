import { CANVAS, code, defineGuide, drum, isoGrid, line, pill, plot, plotPoint, prism, raise, ride, rule, series, shade, step, stop, table } from "@signal-path/engine";
import type { El, Pt, Row } from "@signal-path/engine";

// Two rails cross the floor. The back rail is the training path, the front rail is the serving path.
// At the same place on each rail stands whatever computes the feature: two different pieces of code at first,
// then the offline and the online store, both fed by one feature view.
// The chart at the back is the feature's history for one customer. A marker rides it to the moment a row may read.
// The card at the front shows the row the model receives.
const G = isoGrid(262, 96, 30);
const T = 0, S = 8;
const P = (gx: number, gy: number): Pt => G.p(gx, gy);
const AT = { src: 0.9, pre: 3.4, sSrc: 1.9, sPre: 3.5, store: 6, join: 10.4, tOut: 14.2, train: 18, sOut: 12.1, model: 15.2, def: 2.8 };
const CHART: Pt = [785, 262], ROWS: Pt = [158, 528];
const HIST = raise(plot("hist-card", 0, 0, 330, 200, [1, 30], [0, 5], { title: "returns_90d", sub: "one customer, November", xt: [1, 14, 27], xtl: ["1 Nov", "14 Nov", "27 Nov"], yt: [0, 1, 2, 3], group: "chart" }), CHART, 26);
const on = (x: number, y: number, dx = 0, dy = 0): Pt => { const [px, py] = plotPoint(HIST, x, y); return [Math.round(px + dx), Math.round(py + dy)]; };

// returns_90d for the customer of order 4471: a return on 9 November, then order 4471 on 14 November,
// its own return on 20 November and one more on 25 November.
const HISTORY: [number, number][] = [[1, 0], [9, 0], [9, 1], [20, 1], [20, 2], [25, 2], [25, 3], [27, 3]];
const SEEN: [number, number][] = [[1, 0], [9, 0], [9, 1], [14, 1]];

const rows = (id: string, sub: string, r: Row[], extra: Record<string, unknown> = {}): El =>
  raise(table(id, 0, 0, 262, ["order", "placed", "returns_90d"], r, { at: [12, 76, 152], rowH: 28, title: "Model input", sub, mono: true, group: id, ...extra }), ROWS, 24);

export default defineGuide({
  id: "features-in-production", track: "ml", module: "Production", slug: "features-in-production",
  title: "Features in production",
  summary: "A feature has to mean the same thing when the model is trained and when it predicts. One definition feeds both paths, and each row reads only the value that was known at its own moment.",
  forLeads: "A model that scores well offline and poorly live often has a feature problem, not a model problem. One shared definition, joins as of the event time and a measured gap between training and serving keep the two in step.",
  status: "draft", minutes: 7,
  counters: ["Definitions", "Training reads", "Serving reads", "Skew"],
  whatIf: { label: "What if training joined today's values?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, dates and values are illustrative",
    label: "Two rails cross the floor: a training path at the back and a serving path at the front. At first each path computes the feature returns_90d with its own code and order 4471 gets two different values. Then one feature view feeds an offline store on the training path and an online store on the serving path. A chart shows the feature's history for one customer. For training, a marker rides the history to the order time of 14 November and stops at the value 1. For serving, it rides to the latest value, 3. When training reads today's value the marker runs into the shaded future and the row turns red. At the last stop served features are logged to a skew check and each store is locked to the role that may read it.",
    els: [
      line("train", [P(AT.src, T), P(AT.train - 0.8, T)], { always: true }),
      line("serve", [P(AT.sSrc, S), P(AT.model - 0.8, S)], { always: true }),
      stop("t-src", ...P(AT.src, T), "Past orders", "training path", { big: true, at: "n", always: true }),
      stop("s-src", ...P(AT.sSrc, S), "New order", "serving path", { big: true, at: "sw", always: true }),
      stop("t-pre", ...P(AT.pre, T), undefined, undefined, { always: true }),
      stop("s-pre", ...P(AT.sPre, S), undefined, undefined, { always: true }),
      stop("t-out", ...P(AT.tOut, T), undefined, undefined, { always: true }),
      stop("s-out", ...P(AT.sOut, S), undefined, undefined, { always: true }),
      prism("training", AT.train - 0.75, T - 0.75, 1.5, 1.5, 34, { hue: "paper", glyph: "gear", title: "Training", sub: "fits the model", at: "s", always: true }),
      prism("model", AT.model - 0.75, S - 0.75, 1.5, 1.5, 34, { hue: "paper", glyph: "net", title: "Returns model", sub: "predicts", at: "s", always: true }),

      // 1. two pieces of code
      prism("sql", AT.store - 0.7, T - 0.7, 1.4, 1.4, 30, { hue: "sand", glyph: "code", title: "Batch SQL", sub: "last 90 days", at: "n", group: "two" }),
      prism("svc", AT.store - 0.7, S - 0.7, 1.4, 1.4, 30, { hue: "sand", glyph: "code", title: "Service code", sub: "all returns", at: "s", state: "alert", group: "two" }),
      raise(table("two-values", 0, 0, 280, ["computed by", "returns_90d"], [["Batch SQL", "1"], { cells: ["Service code", "4"], hot: true }], { at: [12, 168], rowH: 30, title: "Order 4471", sub: "one feature, two values", tone: "alert", group: "two" }), CHART, 26),

      // 2 onward. one definition, two stores
      drum("offline", AT.store, T, 1.0, 34, { hue: "sky", glyph: "table", title: "Offline store", sub: "full history", at: "n", group: "open" }),
      drum("online", AT.store, S, 1.0, 34, { hue: "sky", glyph: "table", title: "Online store", sub: "latest values", at: "s", group: "open" }),
      drum("offline-acl", AT.store, T, 1.0, 34, { hue: "sky", glyph: "lock", title: "Offline store", sub: "training role reads", at: "n", group: "gov" }),
      drum("online-acl", AT.store, S, 1.0, 34, { hue: "sky", glyph: "lock", title: "Online store", sub: "serving role reads", at: "s", group: "gov" }),
      line("def-up", [P(AT.def + 0.7, 4), P(AT.store, 4), P(AT.store, T + 1.1)], { group: "one" }),
      line("def-down", [P(AT.def + 0.7, 4), P(AT.store, 4), P(AT.store, S - 1.1)], { group: "one" }),
      line("mat", [P(AT.store, T + 1.1), P(AT.store, S - 1.1)], { group: "one" }),
      prism("view", AT.def - 0.7, 3.3, 1.4, 1.4, 30, { hue: "track", glyph: "layers", title: "Feature view", sub: "one definition", at: "w", group: "one" }),
      raise(code("def", 0, 0, 280, ["returns_90d =", "  count(returns)", "  per customer", "  over the last 90 days"], { title: "Feature definition", sub: "in the registry", keywords: ["returns_90d"], group: "def" }), CHART, 26),

      // 3 onward. the feature's history
      HIST,
      series("history", "hist-card", "line", HISTORY, { tone: "ink", w: 3, group: "chart" }),
      shade("future", "hist-card", [14, 0, 30, 5], { tone: "alert", group: "cut" }),
      rule("when", "hist-card", 14, { tone: "ink", label: "4471 placed", group: "cut" }),
      pill("unknown", on(26.5, 1.25), "future", { tone: "alert", on: "hist-card", group: "cut" }),
      series("seen", "hist-card", "line", SEEN, { w: 5, group: "asof" }),
      series("latest", "hist-card", "line", HISTORY, { w: 5, group: "now" }),
      rule("now", "hist-card", 27, { tone: "ink", group: "now" }),
      pill("placed-now", on(27, 5, -6, 4), "4502 placed", { anchor: "end", on: "hist-card", group: "now" }),
      series("taken", "hist-card", "line", HISTORY, { tone: "alert", w: 5, group: "leak" }),
      stop("t-join", ...P(AT.join, T), "Point-in-time join", undefined, { at: "s", group: "asof" }),
      stop("t-join-x", ...P(AT.join, T), undefined, undefined, { group: "leak" }),
      pill("join-x", [P(AT.join, T)[0], P(AT.join, T)[1] + 16], "Join on customer", { sub: "order time ignored", tone: "alert", group: "leak" }),

      rows("r-train", "training row", [{ cells: ["4471", "14 Nov", "1"], hot: true }]),
      rows("r-serve", "serving request", [{ cells: ["4502", "27 Nov", "3"], hot: true }]),
      rows("r-leak", "training row", [{ cells: ["4471", "14 Nov", "3"], hot: true }], { tone: "alert", foot: "counts its own return" }),
      rows("r-both", "each as of its own moment", [["4471", "14 Nov", "1"], ["4502", "27 Nov", "3"]]),

      // 6. the controls
      line("log", [P(AT.model, S - 0.8), P(AT.model, T)], { group: "gov" }),
      stop("s-skew", ...P(AT.model, 5.2), undefined, undefined, { group: "gov" }),
      prism("skew", AT.model - 0.6, 1.9, 1.2, 1.2, 26, { hue: "track", glyph: "scale", title: "Skew check", sub: "trained vs served", at: "se", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "two-paths", label: "Two paths", kind: "problem", title: "Two code paths give one order two values",
      caption: "Training computes returns_90d in batch SQL. The checkout service computes it again in its own code. For order 4471 the model learned from 1 and is served 4.",
      show: ["two"], counters: ["2", "batch SQL", "service code", "unmeasured"],
      rides: [ride("train", "t-src", "t-out", "4471", { via: ["t-pre"], then: "4471: 1" }), ride("serve", "s-src", "s-out", "4471", { via: ["s-pre"], then: "4471: 4", tone: "alert" })],
      body: ["Vinterhus trains its returns model on past orders and uses it at checkout. One feature is returns_90d: how many orders the customer returned in the last 90 days. The training pipeline derives it with a batch query. The checkout service was written later, by another team, and counts every return the customer ever made.",
        "Google's Rules of Machine Learning call the result training-serving skew: a difference between performance during training and performance during serving. One of its causes is a discrepancy between how data is handled in the training and serving pipelines.",
        "The two paths differ by nature. Serving is online processing, where each request is handled as it arrives. Training is a batch task, where work can be combined, for example in a join. The rule is to re-use code between the two whenever possible, and not to write them in two programming languages.",
        { callout: { label: "Key idea", text: "A model applied to an example in training and to the same example at serving should give exactly the same result. That holds only if the features are the same." } }],
      claims: ["features-in-production-skew", "features-in-production-reuse-code", "features-in-production-same-result"],
    }),
    step({
      id: "one-definition", label: "One definition", kind: "idea", title: "One definition feeds both paths",
      caption: "A feature store keeps a single definition of returns_90d. The offline store holds its history for training. The online store holds the latest value for serving.",
      show: ["one", "open", "def"], counters: ["1", "offline store", "online store", "unmeasured"],
      rides: [ride("def-up", 0, 0.68, "90 days"), ride("def-down", 0, 0.715, "90 days")],
      body: ["In the Feast feature store, the registry persists the feature definitions, which are published under version control with feast apply. A feature view is the object that represents a logical group of time-series feature data as it is found in a data source.",
        "The offline store is the interface to historical feature values. It is used to build training datasets and to materialise features into the online store, which serves them at low latency in production.",
        "A transformation can also be defined once and run on both sides. Feast's on demand feature views, marked alpha, take Python transformation logic that is executed in both the historical retrieval path and the online retrieval path."],
      claims: ["features-in-production-store", "features-in-production-feature-view"],
    }),
    step({
      id: "as-of", label: "As of then", kind: "mechanism", title: "Training reads the value as of the order time",
      caption: "Order 4471 was placed on 14 November. A point-in-time join scans back from that moment and takes the latest value known then: 1.",
      show: ["one", "open", "chart", "cut", "asof", "r-train"], counters: ["1", "as of order time", "online store", "unmeasured"],
      rides: [ride("seen", 0, 1, "as of 14 Nov", { then: "1" }), ride("train", "t-src", "t-out", "4471", { via: ["t-join"], then: "4471: 1" })],
      body: ["A feature value changes over time, so a training row needs the value its order would have seen. Feast joins features onto the training rows in a point-in-time correct way: it reproduces the state of the features at a specific point in the past.",
        "Each training row carries a timestamp. For each row Feast scans backward in time from that timestamp, up to a maximum set by the feature view's TTL. The TTL is relative to the row's timestamp, not to the time the query runs.",
        { callout: { label: "Key idea", text: "The order time is the cut. Everything to its right on the chart had not happened yet when the order was placed." } }],
      claims: ["features-in-production-point-in-time"],
    }),
    step({
      id: "latest", label: "Latest", kind: "mechanism", title: "Serving reads the latest value",
      caption: "Materialisation loads each customer's newest value into the online store. Order 4502 arrives on 27 November and the model receives 3, the value at that moment.",
      show: ["one", "open", "chart", "now", "r-serve"], counters: ["1", "as of order time", "latest value", "unmeasured"],
      rides: [ride("latest", 0, 1, "now", { then: "3" }), ride("mat", 0.1, 0.7, "latest: 3"), ride("serve", "s-src", "s-out", "4502", { via: ["s-pre"], then: "4502: 3" })],
      body: ["The online store keeps only the latest feature values for each entity key, and no history. Values are loaded into it through materialisation. At prediction time the serving service retrieves the latest values and returns them to the model.",
        "Both paths now follow one rule: the newest value known at the row's own moment. For a past order that moment is the order time. For a live request it is now.",
        "The online value is only as fresh as its last load. A table that is no longer updated fails silently: the system keeps working and decays gradually. Tracking statistics of the data reduces such failures."],
      claims: ["features-in-production-online-latest", "features-in-production-stale"],
    }),
    step({
      id: "leak", label: "Future leak", kind: "watch-out", title: "Today's value leaks the future into training",
      caption: "A join without the order time gives 4471 today's value, 3. That count includes returns made after the order, among them its own. The model trains on its answer.",
      show: ["one", "open", "chart", "cut", "leak", "r-leak"], counters: ["1", "today's value", "latest value", "built in"],
      rides: [ride("taken", 0, 1, "today", { then: "3", tone: "alert" }), ride("train", "t-src", "t-out", "4471", { via: ["t-join-x"], then: "4471: 3", tone: "alert" })],
      body: ["Data leakage occurs when information that would not be available at prediction time is used when building the model. The performance estimate turns overly optimistic, and the model does worse on novel data in production.",
        "A table joined at training time and again at serving time may have changed in between, so the prediction for the same item can differ. Snapshotting a slowly changing table hourly or daily gets reasonably close and does not completely resolve the issue.",
        "The event time alone can still let a late value through. By default Feast constrains only the feature's event timestamp, so a value that was backfilled or corrected after the order can be returned for it. Passing filter_by_created_timestamp=True keeps values that were created later out of the row. Not all offline stores support the flag yet."],
      claims: ["features-in-production-leakage", "features-in-production-table-changes", "features-in-production-created-time"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Checks on every production feature",
      caption: "",
      show: ["one", "chart", "cut", "asof", "r-both", "gov"], counters: ["1", "as of order time", "latest value", "monitored"],
      rides: [ride("log", 0, "s-skew", "served: 3", { then: "match" })],
      body: [{ pair: {
        left: { label: "Keep equal", items: ["One definition, two stores", "Values as of the event time", "Served features logged"] },
        right: { label: "Control", items: ["Skew measured and monitored", "Read access per store"] },
      } },
        "The best way to make sure that training matches serving is to save the set of features used at serving time and pipe them to a log for use at training time. Even a small fraction of logged examples is enough to verify consistency between the two.",
        "Skew is measured, not assumed. A discrepancy between a model's performance on next-day data and on live data probably indicates an engineering error. TensorFlow Data Validation compares training and serving data feature by feature: a skew comparator sets a threshold, and a difference above it is reported as a skew anomaly.",
        "Features carry access rules. Feast's permission model treats reading the online store and reading the offline store as separate actions, read_online and read_offline, granted by role. It enforces them on requests through its servers and not with a local provider, and a resource that matches no permission is not secured."],
      claims: ["features-in-production-log-features", "features-in-production-same-result", "features-in-production-skew-detection", "features-in-production-permissions", "features-in-production-point-in-time"],
    }),
  ],
  governance: { text: "Training-serving skew is a correctness risk: the same example must give the same result in training and at serving, so the gap is monitored. Features carry access rules too. In Feast, reading the online store and reading the offline store are separate permissions, granted by role.", claims: ["features-in-production-same-result", "features-in-production-skew", "features-in-production-permissions"] },
  closing: {
    pitfalls: [
      "Computing a feature in one codebase for training and in another for serving.",
      "Joining training rows to the current feature table instead of the values as of each row's event time.",
      "Leaving the gap between training and serving values unmeasured after release.",
    ],
    questions: [
      "Which timestamp decides what order 4471 could have known about its customer?",
      "Why does the online store need only the latest value while the offline store needs the history?",
      "How would a difference between a logged serving value and the training value be detected?",
    ],
  },
});
