import { band, CANVAS, defineGuide, drum, isoGrid, line, note, pawn, plot, plotPoint, raise, ride, series, step, table } from "@signal-path/engine";

// Held-out orders with known outcomes stand in the middle. Two boards check a model against them.
// The left one plots the fraud model's scores against the share of orders that were fraud.
// The right one plots a delivery model's interval, and counts how many held-out orders land inside it.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Held-out orders grouped by fraud score: score, orders, orders that were fraud. */
const BINS: [number, number, number][] = [[0.1, 200, 8], [0.3, 100, 14], [0.5, 100, 27], [0.7, 50, 22], [0.9, 50, 31]];
const RAW = BINS.map(([s, n, f]) => [s, f / n] as [number, number]);
/** The same bins after the calibrator has remapped their scores. */
const CAL: [number, number][] = [[0.04, 0.05], [0.14, 0.13], [0.27, 0.28], [0.44, 0.43], [0.62, 0.62]];
const TOP = BINS[4], SEEN = TOP[2] / TOP[1];

/** Delivery model: predicted days for a distance, and the half width of its stated 90% interval. */
const days = (km: number) => 1 + 0.008 * km;
const half = (km: number) => 0.4 + 0.003 * km;
/** 20 held-out deliveries. f places one inside the stated interval, out places one that far outside it. */
const HELD = ([0.3, -0.5, { out: 0.35 }, 0.6, -0.2, 0.8, { out: -0.2 }, 0.1, -0.7, { out: 0.6 }, 0.4, -0.4, { out: 1.5 }, 0.7, -0.8, 0.2, { out: -0.5 }, -0.3, { out: 0.8 }, 0.5] as (number | { out: number })[])
  .map((v, i) => {
    const km = 30 + 38 * i;
    return typeof v === "number" ? { km, d: days(km) + v * half(km), miss: 0 } : { km, d: days(km) + Math.sign(v.out) * (half(km) + Math.abs(v.out)), miss: Math.abs(v.out) };
  });
/** Split conformal: the widening is the ceil((n + 1) × 0.9) th smallest miss. */
const QHAT = HELD.map((o) => o.miss).sort((a, b) => a - b)[Math.ceil((HELD.length + 1) * 0.9) - 1];
const INSIDE = HELD.filter((o) => o.miss === 0).length, COVERED = HELD.filter((o) => o.miss <= QHAT).length;
const pts = (keep: (miss: number) => boolean) => HELD.filter((o) => keep(o.miss)).map((o) => [o.km, o.d] as [number, number]);

const SCORES = raise(plot("scores", 0, 0, 430, 280, [0, 1], [0, 1], { title: "Fraud score against outcome", xt: [0, 0.5, 1], yt: [0, 0.5, 1], xLabel: "score", yLabel: "share that were fraud", always: true }), F1, 30);
const DELIV = raise(plot("deliv", 0, 0, 430, 280, [0, 800], [0, 12], { title: "Delivery days and the interval", xt: [0, 200, 400, 600, 800], yt: [0, 4, 8, 12], xLabel: "distance, km", yLabel: "days", group: "deliv" }), F2, 30);

type Tone = "track" | "alert" | "ink" | "muted";
const onScores = (id: string, x: number, y: number, text: string, group: string, extra: { tone?: Tone; anchor?: "start" | "end"; strong?: boolean } = {}) =>
  note(id, ...plotPoint(SCORES, x, y), text, { on: "scores", group, ...extra });
const onDeliv = (id: string, x: number, y: number, text: string, group: string, extra: { tone?: Tone; anchor?: "start" | "end"; strong?: boolean } = {}) =>
  note(id, ...plotPoint(DELIV, x, y), text, { on: "deliv", group, ...extra });

/** The held-out orders as the table the curve is drawn from. */
const bins = (id: string, hot: number[], after = false) =>
  raise(table(id, 0, 0, 380, ["score", "orders", "fraud", ...(after ? ["new score"] : ["share"])],
    BINS.map(([s, n, f], i) => ({ cells: [s.toFixed(2), String(n), String(f), after ? CAL[i][0].toFixed(2) : `${Math.round((f / n) * 100)}%`], hot: hot.includes(i), mute: hot.length > 0 && !hot.includes(i) && !after })),
    { at: [18, 110, 200, 280], rowH: 34, title: "500 held-out orders", columnHues: [undefined, undefined, "rose", after ? "sand" : undefined], group: id }), F2, 70);

/** An interval around the delivery line: the stated one, or the stated one widened by `extra` days. */
const interval = (id: string, extra: number, tone: Tone, w = 2.5) => {
  const xs = Array.from({ length: 17 }, (_, i) => i * 50);
  const edge = (side: 1 | -1) => xs.map((x) => [x, Math.max(0, days(x) + side * (half(x) + extra))] as [number, number]);
  return [series(`${id}-hi`, "deliv", "line", edge(1), { tone, w, dashed: true, group: id }), series(`${id}-lo`, "deliv", "line", edge(-1), { tone, w, dashed: true, group: id })];
};
/** One prediction drawn with its interval, and the half width beside it. */
const example = (km: number) => [
  series(`ex${km}`, "deliv", "line", [[km, days(km) - half(km)], [km, days(km) + half(km)]], { tone: "track", w: 5, group: "examples" }),
  onDeliv(`ex${km}-n`, km + 14, days(km) - half(km) - 0.5, `± ${half(km).toFixed(1)}`, "examples", { tone: "track", strong: true }),
];
const pct = (v: number) => `${Math.round(v * 100)}%`;

export default defineGuide({
  id: "uncertainty-and-calibration", track: "ml", module: "Selection and trust", slug: "uncertainty-and-calibration",
  title: "Uncertainty and calibration",
  summary: "A predicted probability is useful only if it matches observed frequencies. A calibration curve checks that, a calibrator repairs it, and a prediction interval states how far a number can be trusted.",
  forLeads: "A confidence figure is a claim that can be tested against outcomes. Ask for the calibration curve and the measured coverage, and for the rule that sends unsure cases to a person.",
  status: "draft", minutes: 7,
  counters: ["Score given", "Fraud observed", "Interval coverage", "Sent to a person"],
  whatIf: { label: "What if the scores were left uncalibrated?", step: 1, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, scores and deliveries are illustrative",
    label: "Held-out orders with known outcomes stand in the middle, between two charts. The left chart plots fraud score against the share of orders that were fraud. The model's curve lies below the diagonal, so every score overstates the fraud, and a calibrator moves it onto the diagonal: the 0.90 bin becomes 0.62. A table lists the five score bins. The right chart then replaces the table. It plots delivery days against distance with a dashed interval that widens with distance. Six of 20 held-out deliveries fall outside the stated 90% interval, and a wider conformal interval holds 19 of 20. At the end, scores near 0.5 and wide intervals are shaded and sent to a reviewer.",
    els: [
      SCORES,
      series("diag", "scores", "line", [[0, 0], [1, 1]], { tone: "muted", w: 2, dashed: true, group: "diag" }),
      onScores("diag-n", 0.8, 0.9, "calibrated", "diag", { tone: "muted", anchor: "end" }),

      series("gap", "scores", "line", [[TOP[0], TOP[0]], [TOP[0], SEEN]], { tone: "alert", w: 3, dashed: true, group: "one" }),
      series("said", "scores", "points", [[TOP[0], TOP[0]]], { hue: "ink", r: 7, group: "one" }),
      series("seen", "scores", "points", [[TOP[0], SEEN]], { hue: "rose", r: 7, group: "one" }),
      onScores("said-n", 0.86, 0.9, "score says 45 of 50", "one", { anchor: "end", strong: true }),
      onScores("seen-n", 0.86, SEEN, "31 of 50 were fraud", "one", { tone: "alert", anchor: "end", strong: true }),

      series("raw", "scores", "line", RAW, { tone: "track", w: 4, group: "raw" }),
      series("raw-p", "scores", "points", RAW, { hue: "track", r: 6, group: "raw" }),
      onScores("raw-n", 0.97, 0.3, "every score overstates", "raw", { tone: "alert", anchor: "end", strong: true }),
      series("raw-old", "scores", "line", RAW, { tone: "ink", w: 2.5, dashed: true, group: "raw-old" }),
      onScores("raw-old-n", 0.95, 0.5, "before", "raw-old", { anchor: "end" }),
      series("fix", "scores", "line", [RAW[4], CAL[4]], { tone: "muted", w: 2, dashed: true, group: "fix" }),
      series("cal", "scores", "line", CAL, { tone: "track", w: 4, group: "cal" }),
      series("cal-p", "scores", "points", CAL, { hue: "track", r: 6, group: "cal" }),
      onScores("cal-n", 0.3, 0.52, "after calibration", "cal-name", { tone: "track", anchor: "end", strong: true }),
      band("unsure-s", "scores", 0.3, 0.7, { group: "route" }),
      onScores("unsure-s-n", 0.5, 0.08, "near 0.5: review", "route", { tone: "track", strong: true }),

      bins("t-one", [4]), bins("t-all", []), bins("t-cal", [4], true),

      DELIV,
      series("mid", "deliv", "line", [[0, days(0)], [800, days(800)]], { tone: "track", w: 4, group: "deliv" }),
      ...interval("stated", 0, "track"), ...interval("stated-old", 0, "alert", 2), ...interval("wide", QHAT, "track", 3),
      onDeliv("stated-n", 30, 10.6, "dashed: stated 90% interval", "stated", { tone: "muted" }),
      ...[100, 400, 700].flatMap(example),
      series("in", "deliv", "points", pts((m) => m === 0), { hue: "sky", r: 5, group: "held" }),
      series("out", "deliv", "points", pts((m) => m > 0), { hue: "rose", r: 6, group: "held" }),
      onDeliv("held-a", 30, 10.9, `stated: ${INSIDE} of 20 inside`, "held", { tone: "alert", strong: true }),
      onDeliv("held-b", 30, 9.7, `widened: ${COVERED} of 20 inside`, "held", { tone: "track", strong: true }),
      band("unsure-d", "deliv", 500, 800, { group: "route" }),
      onDeliv("unsure-d-n", 790, 1, "wide: review", "route", { tone: "track", anchor: "end", strong: true }),
      onDeliv("wide-n", 30, 10.6, "conformal 90% interval", "route", { tone: "muted" }),

      line("to-scores", [G.p(7.1, 7.8), F1], { always: true }),
      line("to-deliv", [G.p(7.8, 7.1), F2], { always: true }),
      line("to-person", [G.p(7.8, 7.1), G.p(7.8, 3.5), G.p(11.3, 3.5)], { group: "route" }),
      drum("held-out", 7.8, 7.8, 0.8, 30, { hue: "track", glyph: "table", title: "Held-out orders", sub: "outcomes known", at: "n", always: true }),
      pawn("reviewer", 12, 3.5, "Reviewer", "takes unsure cases", { group: "route" }),
    ],
  },
  steps: [
    step({
      id: "score", label: "A score", kind: "problem", title: "A score is not yet a probability",
      caption: "The fraud model scored 50 held-out Vinterhus orders near 0.90. Read as a probability, 45 should be fraud. Only 31 were.",
      show: ["one", "t-one"], counters: ["0.90", pct(SEEN), "none", "none"],
      rides: [ride("to-scores", 0.15, 0.6, "50 orders", { then: "31 fraud" })],
      body: ["The model is the fraud classifier from metrics and thresholds. Its threshold was set from the cost of each error. That choice assumed nothing about whether a score of 0.90 means nine frauds in ten.",
        "Well calibrated classifiers are those whose predicted probability can be directly interpreted as a confidence level. Among the samples given a probability close to 0.8, approximately 80% actually belong to the positive class.",
        { callout: { label: "Key idea", text: "A probability is a claim about frequency. It is tested by counting outcomes on orders the model has not seen." } }],
      claims: ["uncertainty-and-calibration-calibrated"],
    }),
    step({
      id: "curve", label: "Curve", kind: "idea", title: "A calibration curve compares scores with outcomes",
      caption: "Group the held-out orders by score and plot the share that were fraud. A calibrated model sits on the diagonal. This one lies below it: every score overstates.",
      show: ["diag", "raw", "t-all"], counters: ["0.90", pct(SEEN), "none", "none"],
      rides: [ride("raw", 0, 1, "0.10: 4%", { via: [0.5], then: `0.90: ${pct(SEEN)}` })],
      body: ["Calibration curves, also called reliability diagrams, plot the frequency of the positive label against the predicted probability. The predictions are binned: the x-axis is the average predicted probability in each bin and the y-axis is the fraction of positives in that bin.",
        "Model families differ. In the scikit-learn comparison, logistic regression is more likely to return well calibrated predictions by itself, while Gaussian naive Bayes tends to push probabilities to 0 or 1."],
      claims: ["uncertainty-and-calibration-curve", "uncertainty-and-calibration-shapes"],
    }),
    step({
      id: "calibrate", label: "Calibrator", kind: "mechanism", title: "A calibrator remaps scores to observed frequencies",
      caption: "Platt scaling fits a sigmoid and isotonic regression fits a rising step function, both on held-out orders. The 0.90 bin now reads 0.62, and the curve meets the diagonal.",
      show: ["diag", "raw-old", "fix", "cal", "cal-name", "t-cal"], counters: [CAL[4][0].toFixed(2), pct(SEEN), "none", "none"],
      rides: [ride("fix", 0, 1, "0.90", { then: CAL[4][0].toFixed(2) })],
      body: ["The sigmoid method is based on Platt's logistic model, with two parameters determined by maximum likelihood. It is most effective for small sample sizes. Isotonic calibration is non-parametric and can correct any monotonic distortion. It is more prone to overfitting on small datasets, and performs as well as or better than the sigmoid method above about 1000 samples.",
        "The calibrator is fitted on data independent of the training data. Fitted on the classifier's training output, it is biased towards probabilities closer to 0 and 1 than it should be. scikit-learn's CalibratedClassifierCV uses cross-validation to keep the two apart.",
        "Calibration changes what a score means. It is generally not expected to change ranking metrics such as ROC-AUC, and the sigmoid method keeps the ranking exactly."],
      claims: ["uncertainty-and-calibration-platt", "uncertainty-and-calibration-isotonic", "uncertainty-and-calibration-heldout", "uncertainty-and-calibration-ranking"],
    }),
    step({
      id: "interval", label: "Interval", kind: "mechanism", title: "An interval states how far to trust a number",
      caption: "A second model predicts delivery days. Quantile regression fits a 5% and a 95% line around the prediction. The interval between them widens with distance.",
      show: ["diag", "cal", "cal-p", "deliv", "stated", "stated-n", "examples"], counters: [CAL[4][0].toFixed(2), pct(SEEN), "90% stated", "none"],
      rides: [ride("mid", 0.125, 0.875, "100 km", { via: [0.5], then: "700 km" })],
      body: ["Quantile regression estimates the median or other quantiles of the target conditional on the features, by minimising the pinball loss. It provides sensible prediction intervals even where the error variance is not constant but predictable, as with deliveries that vary more over long distances.",
        "The interval between a fitted 5% quantile and a fitted 95% quantile would be expected to cover approximately 90% of outcomes.",
        { callout: { label: "Key idea", text: "The width is the message. A promise of 2 days ± 0.7 and one of 7 days ± 2.5 call for different handling." } }],
      claims: ["uncertainty-and-calibration-quantile", "uncertainty-and-calibration-nominal"],
    }),
    step({
      id: "coverage", label: "Coverage", kind: "watch-out", title: "A stated interval can cover too little",
      caption: `Only ${INSIDE} of 20 held-out deliveries land inside the stated 90% interval. Conformal prediction widens it by the miss measured on those deliveries, and ${COVERED} land inside.`,
      show: ["diag", "cal", "cal-p", "deliv", "stated-old", "wide", "held"], counters: [CAL[4][0].toFixed(2), pct(SEEN), `${INSIDE} of 20, then ${COVERED}`, "none"],
      rides: [ride("to-deliv", 0.15, 0.6, "20 orders", { then: `${HELD.length - INSIDE} outside`, tone: "alert" })],
      body: ["Fitted quantiles may be inaccurate, so the stated coverage is checked the way a score is: against outcomes on held-out data.",
        "Conformal prediction starts from a fitted model and a small amount of calibration data unseen during training. It computes a score on each calibration example, takes a quantile of those scores, and forms prediction sets that contain the true value with a user-chosen probability, without distributional or model assumptions.",
        `Conformalized quantile regression combines the two methods: it grows or shrinks the distance between the fitted quantiles by a constant picked during the calibration step. Here that constant is ${QHAT.toFixed(1)} days.`,
        "The coverage is marginal. It is averaged over the calibration and test points, which are assumed to come from the same distribution, and it is not a promise for each individual order."],
      claims: ["uncertainty-and-calibration-nominal", "uncertainty-and-calibration-conformal", "uncertainty-and-calibration-cqr"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Low-confidence cases go to a person",
      caption: "",
      show: ["diag", "cal", "cal-p", "deliv", "wide", "route"], counters: [CAL[4][0].toFixed(2), pct(SEEN), `${COVERED} of 20`, "unsure cases"],
      rides: [ride("to-person", 0, 0.7, "score 0.44", { then: "review" })],
      body: [{ pair: {
        left: { label: "Decide automatically", items: ["Score near 0 or 1", "Narrow interval"] },
        right: { label: "Route to a person", items: ["Score near 0.5", "Wide interval"] },
      } },
        "A calibrated score can be read as a confidence level, so a score near 0.5 says the model cannot tell. Conformal prediction sets become larger when the model is uncertain or the input is intrinsically hard, so the size of the set is an indicator of the model's certainty.",
        "Both signals depend on the checks in the earlier stops. An uncalibrated score near 0.90 or an interval that covers too little sends unsure cases down the automatic path.",
        "The NIST AI Risk Management Framework has a system's knowledge limits, and how its output is overseen by humans, documented, and has processes for human oversight defined, assessed and documented."],
      claims: ["uncertainty-and-calibration-calibrated", "uncertainty-and-calibration-size", "uncertainty-and-calibration-oversight"],
    }),
  ],
  governance: { text: "Calibration and intervals are the control: they identify the cases a model is unsure of, and those are routed to a person. The NIST AI Risk Management Framework has a system's knowledge limits and its human oversight processes defined and documented.", claims: ["uncertainty-and-calibration-oversight", "uncertainty-and-calibration-size"] },
  closing: {
    pitfalls: [
      "Reading a classifier's score as a probability without a calibration curve.",
      "Fitting the calibrator on the data that trained the model.",
      "Reporting a 90% interval whose coverage was never measured on held-out data.",
    ],
    questions: [
      "Of the cases scored near 0.80, what share were positive?",
      "How many held-out outcomes fall inside the stated interval?",
      "Which scores and interval widths send a case to a person, and who set that rule?",
    ],
  },
});
