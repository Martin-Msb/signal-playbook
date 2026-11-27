import { CANVAS, band, defineGuide, isoGrid, line, note, pawn, plot, plotPoint, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";
import type { El, PlotEl } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the lens: recall since release, then last week's inputs and scores laid over the training period.
// The right one is the monitor: three signals, each with its training value and its live value. The model stands in front, and its owner arrives with the alert.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Share of orders, in percent, per 50 of order amount: the training period, then last week. */
const AMOUNT_REF = [12, 23, 20, 14, 10, 7, 5, 3, 2, 2, 1, 1];
const AMOUNT_LIVE = [5, 10, 12, 13, 13, 12, 10, 9, 7, 5, 3, 1];
/** Share of orders, in percent, per 0.1 of return score. Orders scoring 0.5 or more are flagged as likely returns. */
const SCORE_REF = [31, 23, 15, 11, 8, 4, 3, 2, 2, 1];
const SCORE_LIVE = [20, 17, 15, 13, 11, 8, 6, 5, 3, 2];

const tops = (bins: number[], width: number) => bins.map((n, i) => [(i + 0.5) * width, n] as [number, number]);
const meanOf = (bins: number[], width: number) => Math.round(bins.reduce((s, n, i) => s + n * (i + 0.5) * width, 0) / 100);
const flagged = (bins: number[]) => bins.slice(5).reduce((a, b) => a + b, 0);
/** Jensen-Shannon distance between two binned distributions, base 2. */
const distance = (p: number[], q: number[]) => {
  const kl = (a: number[], b: number[]) => a.reduce((s, v, i) => (v ? s + (v / 100) * Math.log2(v / b[i]) : s), 0);
  const m = p.map((v, i) => (v + q[i]) / 2);
  return Math.sqrt((kl(p, m) + kl(q, m)) / 2);
};
const MEAN_REF = meanOf(AMOUNT_REF, 50), MEAN_LIVE = meanOf(AMOUNT_LIVE, 50);
const DRIFT = distance(AMOUNT_REF, AMOUNT_LIVE).toFixed(2), LIMIT = "0.10";
const FLAG_REF = flagged(SCORE_REF), FLAG_LIVE = flagged(SCORE_LIVE);

/** Recall measured from labels, by week since release. A return can take 30 days, so week 12 is the latest complete week at week 16. */
const MEASURED: [number, number][] = [[0, 0.86], [2, 0.86], [4, 0.85], [6, 0.84], [8, 0.81], [10, 0.76], [12, 0.71]];
const FLOOR = 0.75;

const board = <T extends PlotEl>(p: T) => raise(p, F1, 30);
const TIME = board(plot("time", 0, 0, 430, 280, [0, 16], [0.5, 1], { title: "Recall since release", xt: [0, 4, 8, 12, 16], yt: [0.5, 0.75, 1], xLabel: "weeks live", yLabel: "recall", group: "time" }));
const AMOUNT = board(plot("amount", 0, 0, 430, 280, [0, 660], [0, 30], { title: "Order amount", xt: [0, 150, 300, 450, 600], yt: [0, 10, 20, 30], xLabel: "amount", yLabel: "% of orders", group: "amount" }));
const SCORE = board(plot("score", 0, 0, 430, 280, [0, 1.08], [0, 40], { title: "Return score", xt: [0, 0.5, 1], yt: [0, 20, 40], xLabel: "score", yLabel: "% of orders", group: "score" }));

const mark = (id: string, p: PlotEl, x: number, y: number): El => stop(id, ...plotPoint(p, x, y), undefined, undefined, { group: "anchor" });

const SIGNALS: [string, string, string][] = [
  ["inputs: amount", `mean ${MEAN_REF}`, `mean ${MEAN_LIVE}`],
  ["predictions", `${FLAG_REF}% flagged`, `${FLAG_LIVE}% flagged`],
  ["outcomes: recall", "0.86", "0.71, week 12"],
];
/** The monitor with the first n signals watched. `fresh` rows are the ones added or breached at this stop. */
const monitor = (id: string, n: number, fresh: number[]): El => raise(table(id, 0, 0, 400, ["signal", "training", "live"],
  SIGNALS.map(([signal, ref, live], i) => (i < n ? { cells: [signal, ref, live], hot: fresh.includes(i) } : { cells: [signal, ref, "not watched"], mute: true })),
  { at: [16, 170, 272], rowH: 46, title: "Monitor", group: id }), F2, 60);

const model = (id: string, title: string, sub: string, extra: { state?: "alert" } = {}): El =>
  prism(id, 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "model", title, sub, at: "n", group: id, ...extra });

export default defineGuide({
  id: "monitoring-and-drift", track: "ml", module: "Production", slug: "monitoring-and-drift",
  title: "Monitoring and drift",
  summary: "The world changes after training. Inputs, predictions and outcomes are watched in production and compared with the training period, so that drift is found before its cost is.",
  forLeads: "A test score describes the past. Each monitored signal needs a threshold, an owner for its alert and an agreed response, and labelled outcomes arrive later than the decisions they judge.",
  status: "draft", minutes: 7,
  counters: ["Signals watched", "Input drift", "Measured recall", "Alert owner"],
  whatIf: { label: "What if nothing were watched?", step: 0, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, scores, distances and thresholds are illustrative",
    label: "Two boards. The left one starts as a chart of recall since release with only the test score on it, becomes a histogram of last week's order amounts laid over the training period, then the same for the model's scores, and returns to recall over time, now measured from labels that end four weeks before today. The right one is a monitor with three signals: inputs, predictions and outcomes, each with its training value and its live value. The return model stands in front. An alert travels from the monitor to Operations, and fresh labels travel to the model for retraining.",
    els: [
      TIME,
      series("flat", "time", "line", [[0, 0.86], [16, 0.86]], { tone: "muted", dashed: true, w: 3, group: "assumed" }),
      note("assumed-n", plotPoint(TIME, 8, 0)[0], plotPoint(TIME, 0, 0.66)[1], "no measurement since release", { anchor: "middle", tone: "muted", strong: true, size: 12, on: "time", group: "assumed" }),
      series("test", "time", "points", [[0, 0.86]], { hue: "track", r: 6, hot: [0], group: "assumed" }),

      band("pending", "time", 12, 16, { tone: "muted", group: "late" }),
      note("pending-n", plotPoint(TIME, 14, 0)[0], plotPoint(TIME, 0, 0.94)[1], "labels pending", { anchor: "middle", tone: "muted", strong: true, size: 12, on: "time", group: "late" }),
      series("real", "time", "line", MEASURED, { w: 4, label: "measured", labelAt: 3, group: "late" }),
      series("real-dots", "time", "points", MEASURED, { hue: "track", r: 4.5, hot: [6], group: "late" }),
      series("guess", "time", "line", [[12, 0.71], [14, 0.72], [16, 0.72]], { tone: "ink", dashed: true, w: 3, group: "late" }),
      note("guess-n", plotPoint(TIME, 14, 0)[0], plotPoint(TIME, 0, 0.665)[1], "estimated", { anchor: "middle", strong: true, size: 12, on: "time", group: "late" }),
      ...MEASURED.map(([week, value]) => mark(`w${week}`, TIME, week, value)),

      band("breach", "time", 0.5, FLOOR, { axis: "y", tone: "alert", group: "limit" }),
      rule("floor", "time", FLOOR, { axis: "y", tone: "alert", w: 3, group: "limit" }),
      note("floor-n", plotPoint(TIME, 0.5, 0)[0], plotPoint(TIME, 0, 0.6)[1], "alert below 0.75", { tone: "alert", strong: true, size: 12, on: "time", group: "limit" }),

      AMOUNT,
      series("amount-ref", "amount", "bars", tops(AMOUNT_REF, 50), { hue: "sky", label: "training", labelAt: 1, group: "amount" }),
      series("amount-live", "amount", "line", tops(AMOUNT_LIVE, 50), { w: 4, label: "last week", labelAt: 7, group: "amount" }),
      series("shift", "amount", "line", [[MEAN_REF, 27], [MEAN_LIVE, 27]], { tone: "ink", w: 3, group: "amount" }),
      mark("at-ref", AMOUNT, MEAN_REF, 27), mark("at-live", AMOUNT, MEAN_LIVE, 27),
      note("amount-n", plotPoint(AMOUNT, 645, 0)[0], plotPoint(AMOUNT, 0, 21.5)[1], `distance ${DRIFT}`, { anchor: "end", tone: "alert", strong: true, on: "amount", group: "amount" }),
      note("amount-t", plotPoint(AMOUNT, 645, 0)[0], plotPoint(AMOUNT, 0, 18.5)[1], `threshold ${LIMIT}`, { anchor: "end", tone: "muted", on: "amount", group: "amount" }),

      SCORE,
      band("score-flag", "score", 0.5, 1.08, { group: "score" }),
      rule("score-cut", "score", 0.5, { label: "flagged from 0.50", w: 3, group: "score" }),
      series("score-ref", "score", "bars", tops(SCORE_REF, 0.1), { hue: "sky", label: "training", labelAt: 1, group: "score" }),
      series("score-live", "score", "line", tops(SCORE_LIVE, 0.1), { w: 4, label: "last week", labelAt: 6, group: "score" }),
      note("score-a", plotPoint(SCORE, 1.05, 0)[0], plotPoint(SCORE, 0, 27)[1], `last week ${FLAG_LIVE}%`, { anchor: "end", strong: true, on: "score", group: "score" }),
      note("score-b", plotPoint(SCORE, 1.05, 0)[0], plotPoint(SCORE, 0, 22)[1], `training ${FLAG_REF}%`, { anchor: "end", tone: "muted", on: "score", group: "score" }),

      monitor("m0", 0, []), monitor("m1", 1, [0]), monitor("m2", 2, [1]), monitor("m3", 3, [2]),

      line("feed-a-plan", [G.p(7.1, 7.8), F1], { state: "planned", group: "off" }),
      line("feed-b-plan", [F2, G.p(7.8, 7.1)], { state: "planned", group: "off" }),
      line("feed-a", [G.p(7.1, 7.8), F1], { group: "on" }),
      line("feed-b", [F2, G.p(7.8, 7.1)], { group: "on" }),
      line("alert", [F2, G.p(7.8, 3.5), G.p(11.2, 3.5)], { tone: "alert", group: "alert" }),
      model("blind", "Return model", "tested at release"),
      model("watched", "Return model", "week 16"),
      model("stale", "Return model", "below its floor", { state: "alert" }),
      model("renewed", "Return model", "retrained"),
      pawn("owner", 12, 3.5, "Operations", "owns the alert", { group: "alert" }),
    ],
  },
  steps: [
    step({
      id: "once", label: "Tested once", kind: "problem", title: "A model is tested once, on data from the past",
      caption: "The Vinterhus return model reached a recall of 0.86 on held-out orders before release. Sixteen weeks later that figure is still quoted, and nothing checks it.",
      show: ["time", "assumed", "m0", "off", "blind"], counters: ["0 of 3", "unknown", "0.86 at test", "none"],
      rides: [ride("flat", 0, 1, "test 0.86", { then: "assumed 0.86" })],
      body: ["Models are tested on held-out data to estimate their future performance. That estimate assumes the process underlying the inputs and the outputs remains constant.",
        "Drift occurs when the process at prediction time differs from the process that generated the training data. Performance can then no longer be expected to match the test score, and seemingly subtle changes in a data distribution can destroy the performance of a strong model.",
        { callout: { label: "Key idea", text: "Models lose performance through constantly evolving data profiles as well as through code. They can decay in more ways than conventional software." } }],
      claims: ["monitoring-and-drift-constant", "monitoring-and-drift-decay"],
    }),
    step({
      id: "inputs", label: "Inputs", kind: "idea", title: "Live inputs are compared with the training period",
      caption: "Since furniture went on sale in the app, orders are larger. Last week's order amounts no longer match the reference, and the distance between them passes its threshold.",
      show: ["amount", "m1", "on", "watched"], counters: ["1 of 3", DRIFT, "0.86 at test", "none"],
      rides: [ride("shift", "at-ref", "at-live", `mean ${MEAN_REF}`, { then: `mean ${MEAN_LIVE}` })],
      body: ["A shift in the distribution of the input data is data drift, also named covariate drift or input drift. It may result in the model giving unreliable predictions.",
        "Two samples always differ a little. A two-sample hypothesis test decides whether the difference is drift or natural randomness: when the p-value falls below a chosen threshold, drift is suggested. The two-sample Kolmogorov-Smirnov test, available in SciPy as `ks_2samp`, is one such test.",
        "Monitoring tools also use distances. Vertex AI Model Monitoring scores numerical features with the Jensen-Shannon divergence and alerts when the distance passes a threshold. Evidently compares a reference dataset with a current one, and offers the population stability index (PSI), Wasserstein distance and Jensen-Shannon distance.",
        "The distance on the board is the Jensen-Shannon distance between the two histograms."],
      claims: ["monitoring-and-drift-covariate", "monitoring-and-drift-test", "monitoring-and-drift-ks", "monitoring-and-drift-vertex", "monitoring-and-drift-evidently"],
    }),
    step({
      id: "predictions", label: "Predictions", kind: "mechanism", title: "Predictions are a proxy while labels are missing",
      caption: `The model's scores have shifted too. It now flags ${FLAG_LIVE}% of orders as likely returns, against ${FLAG_REF}% in training. No label was needed to see this.`,
      show: ["score", "m2", "on", "watched"], counters: ["2 of 3", DRIFT, "0.86 at test", "none"],
      body: ["Real-time ground truths are not typically available, so proxies are required. A model's predictions can be monitored to check for prior drift, a shift in the distribution of the outputs.",
        "Amazon SageMaker Model Monitor captures the requests to an endpoint and the resulting predictions, builds a baseline from the dataset that trained the model, and reports predictions outside the baseline's constraints as violations.",
        { callout: { label: "Key idea", text: "The inputs and the predictions are known the moment a prediction is made. The outcome is not." } }],
      claims: ["monitoring-and-drift-proxy", "monitoring-and-drift-baseline"],
    }),
    step({
      id: "outcomes", label: "Outcomes", kind: "watch-out", title: "Outcomes arrive late",
      caption: "A return can take 30 days, so measured recall ends four weeks ago, at 0.71. Estimates fill the gap, but they do not work under concept drift.",
      show: ["time", "late", "m3", "on", "watched"], counters: ["3 of 3", DRIFT, "0.71, week 12", "none"],
      rides: [ride("real", "w0", "w12", "recall 0.86", { via: ["w8"], then: "recall 0.71" })],
      body: ["Concept drift occurs when the process generating the outcome from the inputs has changed. Here furniture is returned more often than the small goods the model learned from, so the same order now has a different chance of coming back.",
        "Performance can be estimated in the absence of ground truth. NannyML's Confidence-based Performance Estimation (CBPE) uses the confidence scores of the predictions and assumes they are well calibrated. Direct Loss Estimation (DLE) trains a second model to estimate the loss.",
        "CBPE deals well with data drift and will not work under concept drift. Except in very specific cases, there is no way to identify concept drift without ground truth data.",
        "Comparing model outputs with the real-world outcomes is outcomes analysis. Back-testing is one form of it."],
      claims: ["monitoring-and-drift-concept", "monitoring-and-drift-estimate", "monitoring-and-drift-estimate-limit", "monitoring-and-drift-outcomes"],
    }),
    step({
      id: "alert", label: "Alert", kind: "mechanism", title: "A threshold turns a signal into an alert with an owner",
      caption: "Recall has fallen below the agreed floor of 0.75. The monitor raises an alert, and Operations, the named owner, receives it.",
      show: ["time", "late", "limit", "m3", "on", "alert", "stale"], counters: ["3 of 3", DRIFT, "0.71, week 12", "Operations"],
      rides: [ride("alert", 0.1, 0.72, "recall 0.71", { then: "alert", tone: "alert" })],
      body: ["Persistent deviations outside an organisation's established performance thresholds may warrant adjustment, recalibration or redevelopment of the model.",
        "A threshold is a trade. In a hypothesis test it is the desired false positive rate: looser thresholds alert on noise, tighter ones respond late. When data arrives one record at a time, online detectors such as ADWIN keep a variable-length window of recent items and signal a change when its two halves stop agreeing.",
        { callout: { label: "Governance", text: "The NIST AI Risk Management Framework has responsibilities assigned and understood for superseding, disengaging or deactivating an AI system whose performance or outcomes are inconsistent with its intended use." } }],
      claims: ["monitoring-and-drift-thresholds", "monitoring-and-drift-alpha", "monitoring-and-drift-adwin", "monitoring-and-drift-nist"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Retraining runs on a schedule or on a signal",
      caption: "",
      show: ["time", "late", "limit", "m3", "on", "alert", "renewed"], counters: ["3 of 3", DRIFT, "0.71, week 12", "Operations"],
      rides: [ride("feed-b", 0.12, 0.6, "fresh labels", { then: "retrain" })],
      body: [{ pair: {
        left: { label: "On a schedule", items: ["Fresh labelled data arrives regularly", "Runs whether or not anything changed"] },
        right: { label: "On a signal", items: ["Performance degradation or drift", "Needs monitoring and thresholds"] },
      } },
        "Google's MLOps guidance lists the triggers for a training pipeline: on demand, on a schedule, on availability of new training data, on model performance degradation, and on significant changes in the data distributions. Continuous training automates the retraining and serving of the model on those triggers.",
        "Retraining is one response among several. A model that no longer performs as expected may warrant overlays, adjustment or redevelopment, and an alert can also lead to auditing upstream systems or fixing data quality issues.",
        "Retraining needs labels for the new period. Here the last four weeks of orders have no outcome yet, so a retrained model learns from data that is already a month old."],
      claims: ["monitoring-and-drift-triggers", "monitoring-and-drift-ongoing", "monitoring-and-drift-actions"],
    }),
  ],
  governance: { text: "Ongoing monitoring is a model risk control. US banking supervisors describe it as evaluating whether a model performs as expected as products, clients, data and market conditions change, and the EU AI Act has providers of high-risk AI systems collect and analyse performance data throughout the system's lifetime. An alert needs an owner: the NIST AI Risk Management Framework has responsibilities assigned for acting on a system that no longer performs as intended.", claims: ["monitoring-and-drift-ongoing", "monitoring-and-drift-eu-post-market", "monitoring-and-drift-eu-plan", "monitoring-and-drift-nist", "monitoring-and-drift-nist-production"] },
  closing: {
    pitfalls: [
      "Quoting the test score months after release as if it were a live measurement.",
      "Watching only input drift, which says nothing about a changed relationship between inputs and outcomes.",
      "Raising alerts that no named person is responsible for acting on.",
    ],
    questions: [
      "Which of the three signals are available at prediction time, and which arrives late?",
      "Why can a performance estimate stay steady while concept drift lowers the measured figure?",
      "Who receives the alert, and what are they expected to do within what time?",
    ],
  },
});
