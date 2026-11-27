import { band, CANVAS, defineGuide, isoGrid, line, note, pawn, pill, plot, plotPoint, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";

// Two boards stand on the floor. The left one is 100 scored orders, one dot each, with the threshold drawn through them.
// The right one is precision against recall for every threshold, and the current threshold is a record on that curve.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Orders per score bin of 0.05: genuine orders, then fraudulent ones. 90 genuine and 10 fraud. */
const GENUINE = [18, 14, 11, 9, 7, 6, 5, 4, 4, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0];
const FRAUD = [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1];
const mid = (bin: number) => bin * 0.05 + 0.025;
const G_DOTS = GENUINE.flatMap((n, bin) => Array.from({ length: n }, (_, i) => ({ bin, pt: [mid(bin), i + 0.5] as [number, number] })));
const F_DOTS = FRAUD.flatMap((n, bin) => (n ? [{ bin, pt: [mid(bin), GENUINE[bin] + 0.5] as [number, number] }] : []));
/** Outcomes when every order scoring at or above bin k is flagged. */
const outcome = (k: number) => {
  const tp = F_DOTS.filter((d) => d.bin >= k).length, fp = G_DOTS.filter((d) => d.bin >= k).length;
  return { tp, fp, fn: 10 - tp, recall: tp / 10, precision: tp + fp ? tp / (tp + fp) : 1 };
};

const SCORES = raise(plot("scores", 0, 0, 430, 280, [0, 1], [0, 20], { title: "100 orders by fraud score", xt: [0, 0.5, 1], yt: [0, 10, 20], always: true }), F1, 30);
const PR = raise(plot("pr", 0, 0, 430, 280, [0, 1], [0, 1], { title: "Every threshold", xt: [0, 0.5, 1], yt: [0, 0.5, 1], xLabel: "recall", yLabel: "precision", group: "pr" }), F2, 30);

/** The orders with one threshold drawn through them. Errors are the emphasised dots: genuine orders flagged, and fraud not flagged. */
const cut = (id: string, t?: number, extra: string[] = []) => {
  const k = t === undefined ? 20 : Math.round(t * 20), o = outcome(k);
  const hotG = t === undefined ? [] : G_DOTS.flatMap((d, i) => (d.bin >= k ? [i] : []));
  const hotF = t === undefined ? [] : F_DOTS.flatMap((d, i) => (d.bin < k ? [i] : []));
  const at = (x: number, y: number) => plotPoint(SCORES, x, y);
  const right = (i: number, text: string, tone: "track" | "alert" | "ink", strong = false) => note(`${id}-r${i}`, ...at((t ?? 0.4) + 0.025, 16.6 - i * 2.1), text, { tone, strong, on: "scores", group: id });
  return [
    ...(t === undefined ? [] : [band(`${id}-band`, "scores", t, 1, { group: id }), rule(`${id}-rule`, "scores", t, { label: `threshold ${t.toFixed(2)}`, w: 3.5, group: id })]),
    series(`${id}-g`, "scores", "points", G_DOTS.map((d) => d.pt), { hue: "sky", r: 4.5, tone: "muted", label: "genuine", labelAt: 42, hot: hotG, group: id }),
    series(`${id}-f`, "scores", "points", F_DOTS.map((d) => d.pt), { hue: "rose", r: 4.5, tone: "muted", label: "fraud", labelAt: 2, hot: hotF, group: id }),
    ...(t === undefined
      ? [right(0, "none flagged", "ink", true), right(1, "90 of 100 correct", "track"), right(2, "10 frauds shipped", "alert")]
      : [right(0, `${o.tp} of 10 caught`, "track", true), right(1, `${o.fp} false alarms`, "alert"), ...extra.map((e, i) => right(i + 2, e, "ink", true)),
        note(`${id}-miss`, ...at(t - 0.025, 16.6), `${o.fn} missed`, { tone: "alert", anchor: "end", on: "scores", group: id })]),
  ];
};

/** The four outcomes as a table, before the curve takes its place. */
const outcomes = (id: string, k: number) => {
  const o = outcome(k);
  return raise(table(id, 0, 0, 340, ["decision", "fraud", "genuine"], [["flagged", String(o.tp), String(o.fp)], ["not flagged", String(o.fn), String(90 - o.fp)]],
    { at: [18, 170, 250], rowH: 46, title: "Outcomes", columnHues: [undefined, "rose", "sky"], group: id }), F2, 100);
};

/** The precision-recall curve, from the highest threshold to the lowest, and a hidden marker at each threshold. */
const CURVE = Array.from({ length: 20 }, (_, i) => 19 - i).map((k) => ({ k, o: outcome(k) }));
const mark = (t: number) => `t${Math.round(t * 100)}`;

export default defineGuide({
  id: "metrics-and-thresholds", track: "ml", module: "Foundations", slug: "metrics-and-thresholds",
  title: "Metrics and thresholds",
  summary: "A classifier gives a score, and a threshold turns it into a decision. Precision and recall count the two kinds of error that accuracy hides when one class is rare.",
  forLeads: "The threshold decides who bears a false alarm and who bears a miss. It is a policy decision with a named owner, set from the cost of each error.",
  status: "draft", minutes: 7,
  counters: ["Threshold", "Fraud caught", "False alarms", "Accuracy"],
  whatIf: { label: "What if the threshold stayed at 0.50?", step: 1, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, scores and costs are illustrative",
    label: "Two charts. The left one shows 100 orders as dots stacked by fraud score, 90 genuine and 10 fraud, with a threshold line that moves. Orders to the right of the line are flagged. The right one plots precision against recall for every threshold. A record marks the current threshold on that curve and moves along it as the line on the left moves.",
    els: [
      SCORES,
      ...cut("none"), ...cut("c50", 0.5), ...cut("c30", 0.3), ...cut("c70", 0.7), ...cut("c40", 0.4, ["lowest cost"]),

      outcomes("o-none", 20), outcomes("o-50", 10),
      PR,
      series("curve", "pr", "line", CURVE.map(({ o }) => [o.recall, o.precision] as [number, number]), { tone: "ink", w: 3.5, group: "pr" }),
      ...CURVE.map(({ k, o }) => stop(`t${k * 5}`, ...plotPoint(PR, o.recall, o.precision), undefined, undefined, { group: "anchor" })),
      note("pr-high", ...plotPoint(PR, 0.06, 0.86), "high threshold", { tone: "muted", on: "pr", group: "pr" }),
      note("pr-low", ...plotPoint(PR, 0.95, 0.16), "low threshold", { tone: "muted", anchor: "end", on: "pr", group: "pr" }),
      pill("cheapest", plotPoint(PR, 0.42, 0.3), "lowest cost", { tone: "track", on: "pr", to: plotPoint(PR, 0.88, 0.36), group: "owner" }),

      line("to-scores", [G.p(7.1, 7.8), F1], { always: true }),
      line("to-pr", [G.p(7.8, 7.1), F2], { always: true }),
      prism("model", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "net", title: "Fraud model", sub: "scores each order", at: "n", always: true }),
      pawn("finance", 12, 3.5, "Finance", "owns the threshold", { group: "owner" }),
    ],
  },
  steps: [
    step({
      id: "accuracy", label: "Accuracy", kind: "problem", title: "Accuracy hides the rare class",
      caption: "A model scores 100 Vinterhus orders for fraud. Ten are fraud. Flag none of them and 90 of 100 decisions are correct, yet every fraud ships.",
      show: ["none", "o-none"], counters: ["none", "0 of 10", "0", "90%"],
      rides: [ride("to-scores", 0.15, 0.6, "100 orders", { then: "100 scores" })],
      body: ["Accuracy is the proportion of all classifications that were correct, whether positive or negative.",
        "In a class-imbalanced dataset one label is considerably more common than the other. Where one class appears 1% of the time, a model that predicts negative every time scores 99% on accuracy despite being useless.",
        "Class imbalance is also handled in training and in the metric. Downsampling trains on a disproportionately low percentage of majority class examples. Balanced accuracy avoids inflated performance estimates on imbalanced datasets."],
      claims: ["metrics-and-thresholds-accuracy", "metrics-and-thresholds-imbalance", "metrics-and-thresholds-handling"],
    }),
    step({
      id: "threshold", label: "Threshold", kind: "idea", title: "A threshold turns scores into decisions",
      caption: "Orders scoring above 0.50 are flagged for review. Two kinds of error appear: nine genuine orders held as false alarms, and two frauds missed.",
      show: ["c50", "o-50"], counters: ["0.50", "8 of 10", "9", "89%"],
      body: ["A classification threshold is the probability chosen to convert the model's output into a class. A genuine order that is flagged is a false positive. A fraud that is not flagged is a false negative.",
        "scikit-learn predicts the positive class when the probability is greater than 0.5, and its documentation states that this hard-coded rule is not ideal for most use cases.",
        { callout: { label: "Key idea", text: "The model produces the scores. The threshold is a separate choice made on top of them." } }],
      claims: ["metrics-and-thresholds-threshold", "metrics-and-thresholds-default"],
    }),
    step({
      id: "metrics", label: "Two metrics", kind: "mechanism", title: "Precision and recall count each error",
      caption: "Recall is the share of fraud that was flagged: 8 of 10. Precision is the share of flags that were fraud: 8 of 17. Each threshold is one point on the curve.",
      show: ["c50", "pr"], counters: ["0.50", "8 of 10", "9", "89%"],
      rides: [ride("curve", mark(0.95), mark(0.5), "t 0.95", { via: [mark(0.7)], then: "t 0.50" })],
      body: ["Recall is the proportion of all actual positives that were classified as positives. Precision is the proportion of the model's positive classifications that are actually positive.",
        "A precision-recall curve plots precision against recall across all thresholds. The ROC curve is the other view of performance across all thresholds. When the dataset is imbalanced, the precision-recall curve may offer the better comparison."],
      claims: ["metrics-and-thresholds-recall", "metrics-and-thresholds-precision", "metrics-and-thresholds-curves"],
    }),
    step({
      id: "trade", label: "Trade", kind: "mechanism", title: "Moving the threshold trades misses for false alarms",
      caption: "At 0.30 one more fraud is caught and recall rises to 0.90. False alarms grow from 9 to 25, and precision falls from 0.47 to 0.26.",
      show: ["c30", "pr"], counters: ["0.30", "9 of 10", "25", "74%"],
      rides: [ride("curve", mark(0.5), mark(0.3), "t 0.50", { via: [mark(0.4)], then: "t 0.30" })],
      body: ["As the threshold increases, the model predicts fewer positives overall, both true and false. Lowering it does the reverse.",
        "Precision and recall often show an inverse relationship, where improving one of them worsens the other."],
      claims: ["metrics-and-thresholds-trade"],
    }),
    step({
      id: "reward", label: "Accuracy again", kind: "watch-out", title: "Accuracy rewards missing the rare class",
      caption: "At 0.70 only two genuine orders are held and accuracy reaches 93%, the best so far. Half the fraud now ships.",
      show: ["c70", "pr"], counters: ["0.70", "5 of 10", "2", "93%"],
      rides: [ride("curve", mark(0.3), mark(0.7), "t 0.30", { via: [mark(0.5)], then: "t 0.70", tone: "alert" })],
      body: ["Accuracy counts a held genuine order and a shipped fraud as one error each. With 90 genuine orders and 10 frauds, removing false alarms moves accuracy more than catching fraud does.",
        "When the dataset is imbalanced, or one kind of mistake is more costly than the other, it is better to optimise for another metric. Recall is the metric to use when false negatives are more expensive than false positives."],
      claims: ["metrics-and-thresholds-choose", "metrics-and-thresholds-imbalance"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The cost of each error sets the threshold",
      caption: "",
      show: ["c40", "pr", "owner"], counters: ["0.40", "9 of 10", "16", "83%"],
      rides: [ride("curve", mark(0.7), mark(0.4), "t 0.70", { via: [mark(0.5)], then: "t 0.40" })],
      body: [{ pair: {
        left: { label: "Lower threshold", items: ["More fraud caught", "More genuine orders held"] },
        right: { label: "Higher threshold", items: ["Fewer false alarms", "More fraud shipped"] },
      } },
        "Here a review of a held order costs 40 kr and a shipped fraud costs 400 kr. At 0.40 the 16 false alarms and one miss cost 1,040 kr, less than at any other threshold. At 0.50 the cost is 1,160 kr and at 0.70 it is 2,080 kr.",
        "A threshold of 0.5 is not a good idea when one type of wrong classification costs more than the other. The threshold can optimise a utility metric defined by the business. scikit-learn's TunedThresholdClassifierCV chooses the threshold that maximises a given metric under cross-validation, and the data used to tune it must not be the data that trained the classifier.",
        "The same rule holds when a model predicts a quantity. Mean absolute error (MAE) is the expected absolute error. Root mean squared error (RMSE) is the square root of the mean squared error, in the same units as the target."],
      claims: ["metrics-and-thresholds-cost", "metrics-and-thresholds-tuned", "metrics-and-thresholds-regression"],
    }),
  ],
  governance: { text: "A false alarm holds a genuine customer's order and a miss ships a fraud, so the threshold decides who bears each error. The NIST AI Risk Management Framework has the costs of AI errors examined and documented, and executive leadership take responsibility for decisions about AI risk.", claims: ["metrics-and-thresholds-owner"] },
  closing: {
    pitfalls: [
      "Reporting accuracy alone for a model whose positive class is rare.",
      "Shipping the default threshold of 0.5 without pricing the two errors.",
      "Tuning the threshold on the data that trained the model.",
    ],
    questions: [
      "What does a model that flags nothing score on accuracy, and on recall?",
      "What happens to false alarms and misses when the threshold is lowered?",
      "Who owns the threshold, and what does each kind of error cost?",
    ],
  },
});
