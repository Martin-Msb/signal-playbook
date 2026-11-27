import { CANVAS, defineGuide, isoGrid, line, note, plot, plotPoint, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the orders with the model's curve drawn through them.
// The right one is the error of every model, from the simplest to the most complex, on the orders it trained on
// and on the orders held back. The current model is a record on the validation curve.
const G = isoGrid(480, 295, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Orders: weight in kilograms and minutes to pack. The model trains on the first set, the second is held back. */
const TRAIN: [number, number][] = [[1, 7.5], [2, 12.1], [3, 13.8], [4, 17.7], [5, 15.7], [6, 17.8], [7, 20], [8, 20.4]];
const HELD: [number, number][] = [[1.5, 9.9], [2.5, 14.3], [3.5, 16.5], [4.5, 17.9], [5.5, 17.8], [6.5, 18], [7.5, 17.8]];

/** Least squares fit of a polynomial of one degree to the training orders. */
const u = (x: number) => (x - 4.5) / 3.5;
function fit(degree: number): (x: number) => number {
  const n = degree + 1, A = Array.from({ length: n }, () => Array<number>(n + 1).fill(0));
  for (const [x, y] of TRAIN) for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += u(x) ** (i + j); A[i][n] += y * u(x) ** i; }
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
  }
  const w = A.map((r, i) => r[n] / r[i]);
  return (x) => w.reduce((s, c, i) => s + c * u(x) ** i, 0);
}
const mse = (f: (x: number) => number, pts: [number, number][]) => pts.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / pts.length;
const DEGREES = [1, 2, 3, 4, 5, 6, 7];
const MODELS = DEGREES.map(fit);
const E_TRAIN = MODELS.map((f) => mse(f, TRAIN)), E_HELD = MODELS.map((f) => mse(f, HELD));
const n2 = (v: number) => v.toFixed(2);
/** Counter values for the model of one degree. */
const facts = (d: number, measured = true) => [String(d), n2(E_TRAIN[d - 1]), measured ? n2(E_HELD[d - 1]) : "not measured", measured ? n2(E_HELD[d - 1] - E_TRAIN[d - 1]) : "unknown"];

const DATA = raise(plot("data", 0, 0, 430, 345, [0, 9], [4, 24], { title: "Orders and the model", xt: [0, 3, 6, 9], yt: [4, 9, 14, 19, 24], xLabel: "order weight, kg", yLabel: "minutes to pack", always: true }), F1, 30);
const ERR = raise(plot("err", 0, 0, 430, 345, [-0.3, 8.8], [-0.8, 7], { title: "Error of every model", xt: DEGREES, yt: [0, 2, 4, 6], xLabel: "polynomial degree", yLabel: "mean squared error", group: "err" }), F2, 30);

/** The curve of one model, with its misses on the held-back orders and on the training orders. */
const model = (id: string, d: number, tone: "track" | "alert" = "track") => {
  const f = MODELS[d - 1];
  return [
    ...HELD.map(([x, y], i) => series(`${id}-v${i}`, "data", "line", [[x, f(x)], [x, y]], { tone: "alert", w: 2, dashed: true, group: `${id}-miss` })),
    ...TRAIN.map(([x, y], i) => series(`${id}-t${i}`, "data", "line", [[x, f(x)], [x, y]], { tone: "alert", w: 2, dashed: true, group: `${id}-own` })),
    series(`${id}-l`, "data", "line", Array.from({ length: 71 }, (_, i) => [1 + i * 0.1, f(1 + i * 0.1)] as [number, number]), { tone, w: 4, group: id }),
  ];
};
/** A hidden marker on the validation curve, so a record can be sent to an exact model. */
const at = (d: number) => stop(`d${d}`, ...plotPoint(ERR, d, E_HELD[d - 1]), undefined, undefined, { group: "anchor" });
/** The gap at one degree: a dashed line from the training error up to the validation error. */
const gap = (d: number, tone: "alert" | "muted", side: 1 | -1) => [
  series(`gap${d}`, "err", "line", [[d, E_TRAIN[d - 1]], [d, E_HELD[d - 1]]], { tone, w: 3, dashed: true, group: `gap${d}` }),
  note(`gap${d}-n`, ...plotPoint(ERR, d + side * 0.15, (E_TRAIN[d - 1] + E_HELD[d - 1]) / 2 - 0.1), `gap ${n2(E_HELD[d - 1] - E_TRAIN[d - 1])}`, { strong: true, mono: true, tone, anchor: side > 0 ? "start" : "end", on: "err", group: `gap${d}` }),
];

export default defineGuide({
  id: "overfitting-and-generalisation", track: "ml", module: "Foundations", slug: "overfitting-and-generalisation",
  title: "Overfitting and generalisation",
  summary: "A model can match its training data exactly and still predict new data badly. The gap between training error and validation error shows when it has memorised.",
  forLeads: "Training error is not evidence that a model works. Ask for the error on data the model never saw, and for the gap between the two.",
  status: "draft", minutes: 7,
  counters: ["Polynomial degree", "Training error", "Validation error", "Gap"],
  whatIf: { label: "What if the model were too simple?", step: 3, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "Two charts. The left one plots orders by weight and packing time, with the model's curve through them. A complex model bends through every training order and misses the orders held back. The right one plots training error and validation error for models of rising complexity. Training error falls to zero while validation error falls, then rises. A record marks the current model on the validation curve and settles where validation error is lowest.",
    els: [
      DATA,
      series("train", "data", "points", TRAIN, { hue: "sky", r: 6, always: true }),
      series("held", "data", "points", HELD, { hue: "sand", r: 6, group: "held" }),
      series("k-train", "data", "points", [[5.4, 9]], { hue: "sky", r: 6, tone: "muted", label: "training order", always: true }),
      series("k-held", "data", "points", [[5.4, 7]], { hue: "sand", r: 6, tone: "muted", label: "held-back order", group: "held" }),
      ...model("f7", 7, "alert"), ...model("f1", 1), ...model("f3", 3),

      ERR,
      series("e-train", "err", "line", DEGREES.map((d, i) => [d, E_TRAIN[i]] as [number, number]), { tone: "ink", w: 3, group: "err" }),
      note("e-train-n", ...plotPoint(ERR, 3.25, -0.5), "training error", { strong: true, on: "err", group: "err" }),
      series("e-held", "err", "line", DEGREES.map((d, i) => [d, E_HELD[i]] as [number, number]), { w: 4, group: "val" }),
      note("e-held-n", ...plotPoint(ERR, 5.9, 3.6), "validation error", { strong: true, tone: "track", anchor: "end", on: "err", group: "val" }),
      ...gap(7, "alert", 1), ...gap(1, "muted", -1),
      rule("best", "err", 3, { tone: "muted", label: "lowest validation error", group: "best" }),
      ...DEGREES.map(at),

      line("to-gate", [F2, G.p(7.8, 6.3)], { group: "gate" }),
      prism("gate", 7.1, 6.3, 1.4, 1.4, 30, { hue: "track", glyph: "shield", title: "Release review", sub: "needs validation evidence", at: "w", group: "gate" }),
    ],
  },
  steps: [
    step({
      id: "perfect", label: "Perfect fit", kind: "problem", title: "Training error alone looks perfect",
      caption: "Vinterhus predicts packing time from order weight. Each added degree of complexity lowers training error. At degree 7 the curve bends through all eight training orders and the error is zero.",
      show: ["f7", "err"], counters: facts(7, false),
      rides: [ride("e-train", 0, 1, "degree 1", { via: [1 / 3], then: "error 0.00" })],
      body: ["The model is a polynomial of degree 7. With eight coefficients it can pass through eight orders exactly, so the mean squared error on those orders is zero.",
        "Complex models typically outperform simple models on the training set. That is why training error cannot settle the question."],
      claims: ["overfitting-and-generalisation-complexity"],
    }),
    step({
      id: "held", label: "New orders", kind: "idea", title: "Held-back orders expose memorising",
      caption: "Seven orders were kept out of training. The curve swings between memorised points and misses the lightest by five minutes. A model that matches its training set and fails on new data is overfitting.",
      show: ["f7", "held", "f7-miss", "err"], counters: facts(7),
      rides: [ride("f7-v0", 0, 1, "predicted", { then: "5 min off" })],
      body: ["Overfitting means creating a model that matches, or memorises, the training set so closely that it fails to make correct predictions on new data. Generalisation is the opposite: a model that generalises well makes good predictions on new data.",
        "A memorising model is also a privacy risk. A membership inference attack takes a data record and black-box access to a model and determines whether the record was in the model's training dataset. Overfitting is sufficient to allow that attack.",
        { callout: { label: "Key idea", text: "Validation error is the same measurement as training error, taken on orders the model never saw." } }],
      claims: ["overfitting-and-generalisation-overfit", "overfitting-and-generalisation-generalise", "overfitting-and-generalisation-membership", "overfitting-and-generalisation-leak"],
    }),
    step({
      id: "gap", label: "The gap", kind: "mechanism", title: "The gap between the two errors is the signal",
      caption: "Plot validation error beside training error for every model. Training error keeps falling. Validation error falls, then turns up. Where the two curves diverge, the model has started to memorise.",
      show: ["f7", "held", "f7-miss", "err", "val", "gap7"], counters: facts(7),
      rides: [ride("e-held", "d1", "d7", "degree 1", { via: ["d3"], then: "degree 7" })],
      body: ["When the loss curves for the training set and the validation set behave similarly at first and then diverge, with loss falling or holding steady on the training set and rising on the validation set, this suggests overfitting.",
        "scikit-learn states the same reading for scores: a high training score with a low validation score means the estimator is overfitting.",
        "Plotting both errors against a setting of the model is a validation curve. A learning curve instead shows the validation and training score for varying numbers of training samples. It shows how much more training data helps and whether the estimator suffers more from a variance error or a bias error."],
      claims: ["overfitting-and-generalisation-diverge", "overfitting-and-generalisation-scores", "overfitting-and-generalisation-learning-curve"],
    }),
    step({
      id: "simple", label: "Too simple", kind: "watch-out", title: "A model that is too simple misses everywhere",
      caption: "A straight line cannot follow the bend in the orders. Both errors are high and the gap is small. This is underfitting: high bias where the complex model had high variance.",
      show: ["f1", "held", "f1-miss", "f1-own", "err", "val", "gap1"], counters: facts(1),
      rides: [ride("e-held", "d7", "d1", "degree 7", { via: ["d3"], then: "degree 1" })],
      body: ["An underfit model does not even make good predictions on the training data. When training and validation scores are both low, the estimator is underfitting.",
        "Generalisation error can be decomposed into bias, variance and noise. Bias is an estimator's average error for different training sets. Variance indicates how sensitive it is to varying training sets. Noise is a property of the data.",
        "In scikit-learn's polynomial example the simplest estimator gives only a poor fit because it is too simple, which is high bias. The most complex one approximates the training data perfectly and is very sensitive to varying training data, which is high variance."],
      claims: ["overfitting-and-generalisation-underfit", "overfitting-and-generalisation-scores", "overfitting-and-generalisation-bias-variance", "overfitting-and-generalisation-poly"],
    }),
    step({
      id: "fit", label: "Hold back", kind: "mechanism", title: "Complexity is held where validation error is lowest",
      caption: "Degree 3 follows the bend and ignores the noise. Regularisation and early stopping hold a model near this point: one penalises complexity, the other ends training when validation error starts to rise.",
      show: ["f3", "held", "f3-miss", "err", "val", "best"], counters: facts(3),
      rides: [ride("e-held", "d1", "d3", "degree 1", { via: ["d2"], then: "degree 3" })],
      body: ["Penalising complex models is one form of regularisation. L2 regularisation encourages weights toward 0 without pushing them all the way to zero. Raising the regularisation rate strengthens that influence and reduces the chances of overfitting.",
        "Early stopping means ending training before the model fully converges, for example when the loss curve for the validation set starts to increase. It is a quick, but rarely optimal, form of regularisation.",
        { callout: { label: "What changed", text: "Training error rose from 0.00 to 0.78 and validation error fell from 6.20 to 1.11. The model is worse on the orders it saw and better on the orders it will meet." } }],
      claims: ["overfitting-and-generalisation-regularise", "overfitting-and-generalisation-early"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Two errors, read together",
      caption: "",
      show: ["f3", "held", "f3-miss", "err", "val", "best", "gate"], counters: facts(3),
      rides: [ride("e-held", "d3", "d3", "degree 3"), ride("to-gate", 0, 0.55, "val 1.11")],
      body: [{ pair: {
        left: { label: "Both errors high", items: ["Underfitting, high bias", "The model is too simple"] },
        right: { label: "Low training, high validation", items: ["Overfitting, high variance", "Regularise, stop early, add data"] },
      } },
        "In scikit-learn's learning curve example, where the training score is much greater than the validation score, adding more training samples will most likely increase generalisation.",
        "The NIST AI Risk Management Framework asks that the AI system to be deployed is demonstrated to be valid and reliable, and that limitations of its generalisability beyond the conditions under which it was developed are documented. The validation error is that evidence, so it travels with the model to the release review."],
      claims: ["overfitting-and-generalisation-scores", "overfitting-and-generalisation-poly", "overfitting-and-generalisation-more-data", "overfitting-and-generalisation-nist"],
    }),
  ],
  governance: { text: "The NIST AI Risk Management Framework asks that a system to be deployed is demonstrated to be valid and reliable, with the limits of its generalisability documented. Overfitting is sufficient for a membership inference attack, which determines whether a given record was in the training data.", claims: ["overfitting-and-generalisation-nist", "overfitting-and-generalisation-leak", "overfitting-and-generalisation-membership"] },
  closing: {
    pitfalls: [
      "Reporting training error as evidence that a model works.",
      "Adding complexity because training error is still falling.",
      "Treating an overfit model as only an accuracy problem when it was trained on personal data.",
    ],
    questions: [
      "What does a zero training error say about predictions on new orders?",
      "What do the two error curves do when a model starts to overfit?",
      "Which pattern of the two errors shows underfitting?",
    ],
  },
});
