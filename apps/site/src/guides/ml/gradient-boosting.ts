import { CANVAS, defineGuide, isoGrid, node, note, pill, plot, plotPoint, ride, rule, series, step, stop, treeOf } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// Three charts and the model itself. The left chart is the data with the current prediction drawn through it as a
// step function, and the misses as dashed lines. The top right chart is what is left over, the residuals, with the
// next small tree drawn through them. The bottom right chart is the error after every tree. Under the data the model
// is written out as what it is: the mean plus half of each tree. Every number is computed below from the same products.
const G = isoGrid(480, 300, 30);

/* ---------- the products ---------- */

/** Products: price and return rate. Cheap products average 0.10, mid-priced 0.50 and expensive 0.90. */
const TRAIN: [number, number][] = [[40, 0.17], [90, 0.02], [130, 0.15], [180, 0.06], [220, 0.61], [270, 0.38], [330, 0.63], [380, 0.38], [420, 0.96], [470, 0.8], [530, 0.99], [580, 0.85]];
/** Products held back from training. */
const HELD: [number, number][] = [[60, 0.19], [110, 0.04], [160, 0.13], [240, 0.42], [300, 0.58], [360, 0.55], [440, 0.84], [500, 0.97], [560, 0.83]];
const RATE = 0.5, N = 255, X_MAX = 620;

/* ---------- boosting ---------- */

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
interface Stump { t: number; l: number; r: number }
/** The one-split tree that cuts squared error on the residuals most. Each leaf predicts the mean residual on its side. */
function stump(res: number[]): Stump {
  let best: (Stump & { gain: number }) | undefined;
  for (let i = 0; i < TRAIN.length - 1; i++) {
    const l = mean(res.slice(0, i + 1)), r = mean(res.slice(i + 1)), gain = (i + 1) * l * l + (TRAIN.length - i - 1) * r * r;
    if (!best || gain >= best.gain - 1e-9) best = { gain, t: (TRAIN[i][0] + TRAIN[i + 1][0]) / 2, l, r };
  }
  return best!;
}
const F0 = mean(TRAIN.map((p) => p[1]));
const TREES: Stump[] = [];
/** The prediction after n trees: the mean plus a fraction of every tree so far. */
const predict = (x: number, n: number) => TREES.slice(0, n).reduce((s, t) => s + RATE * (x <= t.t ? t.l : t.r), F0);
for (let n = 0; n < N; n++) TREES.push(stump(TRAIN.map(([x, y]) => y - predict(x, n))));
const mae = (set: [number, number][], n: number) => mean(set.map(([x, y]) => Math.abs(y - predict(x, n))));
const COUNTS = Array.from({ length: N + 1 }, (_, n) => n);
const E_TRAIN = COUNTS.map((n) => mae(TRAIN, n)), E_HELD = COUNTS.map((n) => mae(HELD, n));
/** The number of trees with the lowest validation error. */
const BEST = COUNTS.reduce((b, n) => (E_HELD[n] < E_HELD[b] ? n : b), 0);
const n2 = (v: number) => v.toFixed(2), signed = (v: number) => (v < 0 ? "-" : "+") + Math.abs(v).toFixed(2);
const facts = (shown: number, n: number, measured = false) => [String(shown), n2(E_TRAIN[n]), measured ? n2(E_HELD[n]) : "not measured", n ? String(RATE) : "not set"];

/* ---------- the charts ---------- */

const BANDS = { xt: [100, 200, 300, 400, 500], xtl: ["cheap", "200", "mid-priced", "400", "expensive"] };
const DATA = plot("data", 30, 40, 430, 290, [0, X_MAX], [0, 1.08], { title: "Products and the prediction", ...BANDS, yt: [0, 0.25, 0.5, 0.75, 1], xLabel: "price", yLabel: "return rate", always: true });
const RES = plot("res", 500, 40, 430, 200, [0, X_MAX], [-0.62, 0.62], { title: "What is left: the residuals", ...BANDS, yt: [-0.5, 0, 0.5], xLabel: "price", yLabel: "actual minus predicted", group: "res" });
/** Trees are counted on a doubling scale, so the first few trees and the last hundred both show. */
const X = (n: number) => Math.log2(n + 1);
const TICKS = [0, 1, 3, 7, 15, 31, 63, 127, 255];
const ERR = plot("err", 500, 290, 430, 210, [-0.3, 9], [-0.07, 0.4], { title: "Error after every tree", xt: TICKS.map(X), xtl: TICKS.map(String), yt: [0, 0.1, 0.2, 0.3], xLabel: "trees, doubling scale", yLabel: "mean absolute error", always: true });

/** A step function as a line: flat between split points, vertical at each split. */
function steps(f: (x: number) => number, cuts: number[]): [number, number][] {
  const ts = [...new Set(cuts)].sort((a, b) => a - b), out: [number, number][] = [[0, f(0)]];
  for (const t of ts) out.push([t, f(t)], [t, f(t + 1e-6)]);
  out.push([X_MAX, f(X_MAX)]);
  return out;
}
/** The prediction after n trees on the data chart, with its misses on the training products. */
const model = (id: string, n: number, tone: "track" | "alert" = "track"): El[] => [
  ...TRAIN.map(([x, y], i) => series(`${id}-r${i}`, "data", "line", [[x, predict(x, n)], [x, y]], { tone: "alert", w: 2, dashed: true, group: `${id}-own` })),
  ...HELD.map(([x, y], i) => series(`${id}-v${i}`, "data", "line", [[x, predict(x, n)], [x, y]], { tone: "alert", w: 2, dashed: true, group: `${id}-miss` })),
  series(`${id}-l`, "data", "line", steps((x) => predict(x, n), TREES.slice(0, n).map((t) => t.t)), { tone, w: 4, group: id }),
];
/** The residuals after n trees on the residual chart. */
const left = (id: string, n: number): El => series(id, "res", "points", TRAIN.map(([x, y]) => [x, y - predict(x, n)] as [number, number]), { hue: "sky", r: 5, group: id });
/** Tree k drawn through the residuals it was fitted to: in full, and at the fraction that is added. */
const fitted = (k: number, where: [number, number], half: [number, number]): El[] => {
  const t = TREES[k - 1], f = (s: number) => steps((x) => s * (x <= t.t ? t.l : t.r), [t.t]);
  return [
    series(`t${k}-f`, "res", "line", f(1), { tone: "ink", w: 4, group: `t${k}-f` }),
    note(`t${k}-fn`, ...plotPoint(RES, where[0], where[1]), `tree ${k}`, { strong: true, on: "res", group: `t${k}-f` }),
    series(`t${k}-h`, "res", "line", f(RATE), { w: 4, group: `t${k}-h` }),
    note(`t${k}-hn`, ...plotPoint(RES, half[0], half[1]), "half is added", { strong: true, tone: "track", on: "res", group: `t${k}-h` }),
  ];
};
/** Tree k in the model row: its split and its two leaf values. */
const chip = (k: number, x: number): El[] => {
  const t = TREES[k - 1];
  return [
    ...treeOf(`c${k}`, [x, 398], { label: `price ≤ ${t.t}`, kids: [{ label: signed(t.l), hue: "sky" }, { label: signed(t.r), hue: "sky" }] }, { dx: 76, dy: 56, mono: true, group: `c${k}` }),
    note(`c${k}-t`, x, 373, `tree ${k}`, { anchor: "middle", tone: "muted", group: `c${k}` }),
    note(`c${k}-x`, x - 84, 403, "+ ½ ×", { anchor: "middle", strong: true, size: 15, tone: "track", group: `plus${k}` }),
  ];
};
/** Hidden markers on the error curves, so a record can be sent to an exact number of trees. */
const onTrain = (n: number) => stop(`a${n}`, ...plotPoint(ERR, X(n), E_TRAIN[n]), undefined, undefined, { group: "anchor" });
const onHeld = (n: number) => stop(`v${n}`, ...plotPoint(ERR, X(n), E_HELD[n]), undefined, undefined, { group: "anchor" });
const curve = (e: number[], to: number) => COUNTS.slice(0, to + 1).map((n) => [X(n), e[n]] as [number, number]);

export default defineGuide({
  id: "gradient-boosting", track: "ml", module: "Model families", slug: "gradient-boosting",
  title: "Gradient boosting",
  summary: "A boosted model is a sum of small trees. Each new tree is fitted to what the trees before it still get wrong.",
  forLeads: "Boosted trees remain the workhorse for tabular prediction. Their accuracy comes from many small corrections, and so does their appetite for tuning.",
  status: "draft", minutes: 7,
  counters: ["Trees", "Training error", "Validation error", "Learning rate"],
  whatIf: { label: "What if it stopped at the mean?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Return rates are illustrative",
    label: "Three charts. The first plots products by price and return rate, with the prediction drawn through them as a step function that starts flat at the mean and gains a step with each tree. Dashed lines mark the misses. The second plots those misses, the residuals, with the next small tree drawn through them in full and at half size. The third plots mean absolute error against the number of trees: training error keeps falling, while validation error falls, then turns up. Under the first chart the model is written as the mean plus half of each tree.",
    els: [
      DATA,
      series("train", "data", "points", TRAIN, { hue: "sky", r: 5.5, always: true }),
      series("held", "data", "points", HELD, { hue: "sand", r: 5.5, group: "held" }),
      series("k-train", "data", "points", [[415, 0.26]], { hue: "sky", r: 5.5, tone: "muted", label: "product", always: true }),
      series("k-held", "data", "points", [[415, 0.13]], { hue: "sand", r: 5.5, tone: "muted", label: "held-back product", group: "held" }),
      ...model("f0", 0), ...model("f1", 1), ...model("f2", 2), ...model("fb", BEST), ...model("fn", N, "alert"),
      series("mv1", "data", "line", [[555, predict(555, 0)], [555, predict(555, 1)]], { tone: "muted", w: 2, group: "mv1" }),
      series("mv2", "data", "line", [[100, predict(100, 1)], [100, predict(100, 2)]], { tone: "muted", w: 2, group: "mv2" }),

      RES,
      left("r0", 0), left("r1", 1), left("rb", BEST), left("rn", N),
      ...fitted(1, [20, 0.28], [20, -0.05]), ...fitted(2, [420, -0.22], [20, -0.08]),
      note("rn-n", ...plotPoint(RES, 310, 0.3), "nothing left to fit", { strong: true, tone: "alert", anchor: "middle", on: "res", group: "rn" }),
      note("rb-n", ...plotPoint(RES, 310, 0.3), "the noise is left alone", { strong: true, tone: "track", anchor: "middle", on: "res", group: "rb" }),

      ERR,
      series("e0", "err", "points", [[X(0), E_TRAIN[0]]], { r: 6, hot: [0], group: "e0" }),
      series("e1", "err", "line", curve(E_TRAIN, 1), { tone: "ink", w: 3, group: "e1" }),
      series("e2", "err", "line", curve(E_TRAIN, 2), { tone: "ink", w: 3, group: "e2" }),
      series("e-train", "err", "line", curve(E_TRAIN, N), { tone: "ink", w: 3, group: "e-all" }),
      note("e-train-n", ...plotPoint(ERR, X(45), 0.005), "training error", { strong: true, anchor: "middle", on: "err", group: "e-all" }),
      series("e-held", "err", "line", curve(E_HELD, N), { w: 4, group: "e-all" }),
      note("e-held-n", ...plotPoint(ERR, X(110), 0.135), "validation error", { strong: true, tone: "track", anchor: "end", on: "err", group: "e-all" }),
      rule("stop", "err", X(BEST), { tone: "muted", label: "early stopping", group: "stop" }),
      onTrain(0), onTrain(1), onTrain(2), onHeld(2), onHeld(BEST), onHeld(N),

      note("sum-t", 30, 366, "The model so far", { strong: true, size: 15, always: true }),
      node("c0", 62, 398, n2(F0), { shape: "box", mono: true, sub: "mean", always: true }),
      ...chip(1, 200), ...chip(2, 382),
      pill("more-n", [150, 482], `+ ½ × ${N - 2} more trees`, { tone: "alert", anchor: "start", group: "more-n" }),
      pill("more-b", [150, 482], `+ ½ × ${BEST - 2} more trees, then stop`, { anchor: "start", group: "more-b" }),
    ],
  },
  steps: [
    step({
      id: "blunt", label: "Baseline", kind: "problem", title: "The mean as a baseline",
      caption: `Vinterhus wants a product's return rate from its price. The simplest model predicts the mean, ${n2(F0)}, for every product. It is right for mid-priced products on average and badly wrong for the rest.`,
      show: ["f0", "f0-own", "e0"], counters: facts(0, 0),
      rides: [ride("f0-l", 0, 1, "mean", { then: n2(F0) })],
      body: ["Vinterhus wants a product's return rate from its price. The simplest model predicts the mean, 0.50, for every product. It is right for mid-priced products on average and badly wrong for cheap and expensive ones. The dashed lines are the misses.",
        "A single shallow tree would do better, but not by enough."],
      claims: ["boosted-trees-default"],
    }),
    step({
      id: "wrong", label: "Residuals", kind: "idea", title: "Fit the next tree to the residuals",
      caption: "Boosting trains a small tree on the errors of the current prediction, the dashed lines: about -0.40, 0.00 and +0.40. For squared error, the gradient it follows is the residual.",
      show: ["f0", "f0-own", "e0", "res", "r0", "t1-f", "c1"], counters: facts(0, 0),
      rides: [ride("f0-r8", 0, 1, n2(F0), { then: signed(TRAIN[8][1] - F0) })],
      body: ["Boosting does not train a second model on the original target. It trains a small tree on the errors of the current prediction: about -0.40 for cheap products, 0.00 for mid-priced and +0.40 for expensive.",
        "The second chart plots those errors on their own. The best single split of them is at a price of 400, and each leaf predicts the mean error on its side.",
        { callout: { label: "Key idea", text: "Each tree has one job: correct the model so far. For squared error, the gradient it follows is the residual." } }],
      claims: ["boosting-greedy-gradient"],
    }),
    step({
      id: "half", label: "Shrinkage", kind: "mechanism", title: "Add a fraction of the correction",
      caption: `Tree 1 gives ${signed(TREES[0].r)} for expensive products and ${signed(TREES[0].l)} for the rest. Only half is added: expensive moves to ${n2(predict(500, 1))}, the rest to ${n2(predict(100, 1))}. That half is the learning rate.`,
      show: ["f1", "f1-own", "mv1", "res", "r0", "t1-f", "t1-h", "c1", "plus1", "e1"], counters: facts(1, 1),
      rides: [ride("mv1", 0, 1, n2(predict(500, 0)), { then: n2(predict(500, 1)) }), ride("e1", "a0", "a1", n2(E_TRAIN[0]), { then: n2(E_TRAIN[1]) })],
      body: ["Tree 1 separates expensive products from the rest, with +0.40 for expensive and -0.20 for the others. Only half of that is added, so the prediction for expensive products moves to 0.70 and for the others to 0.40.",
        "The fraction is the learning rate. Scaling each tree down limits its influence and leaves room for the trees that follow."],
      claims: ["boosting-shrinkage", "boosting-additive"],
    }),
    step({
      id: "repeat", label: "Repeat", kind: "mechanism", title: "Repeat on what is left",
      caption: `The errors now average -0.30, +0.10 and +0.20. Tree 2 separates cheap products from the rest, and half its output is added. Mean absolute error falls from ${n2(E_TRAIN[0])} to ${n2(E_TRAIN[1])} to ${n2(E_TRAIN[2])}.`,
      show: ["f2", "f2-own", "mv2", "res", "r1", "t2-f", "t2-h", "c1", "plus1", "c2", "plus2", "e2"], counters: facts(2, 2),
      rides: [ride("mv2", 0, 1, n2(predict(100, 1)), { then: n2(predict(100, 2)) }), ride("e2", "a1", "a2", n2(E_TRAIN[1]), { then: n2(E_TRAIN[2]) })],
      body: [`The errors now average -0.30 for cheap products, +0.10 for mid-priced and +0.20 for expensive. Tree 2 separates cheap products from the rest, and half of its output is added. The mean absolute error has gone from ${n2(E_TRAIN[0])} to ${n2(E_TRAIN[1])} to ${n2(E_TRAIN[2])}.`,
        "LightGBM is a gradient boosting framework that uses tree based learning algorithms. CatBoost is a machine learning method based on gradient boosting over decision trees. XGBoost is the system the mechanism here is taken from.",
        { callout: { label: "What changed", text: "The prediction is a sum: the mean, plus half of tree 1, plus half of tree 2." } }],
      claims: ["boosting-additive", "boosting-greedy-gradient", "gradient-boosting-lightgbm", "gradient-boosting-catboost"],
    }),
    step({
      id: "noise", label: "Overfitting", kind: "watch-out", title: "More trees fit the noise",
      caption: `Nothing in the loop says stop. After ${N} trees it bends to nearly every training product, noise included, and validation error has turned up. Shrinkage slows this, and column subsampling helps prevent it.`,
      show: ["fn", "held", "fn-miss", "res", "rn", "c1", "plus1", "c2", "plus2", "more-n", "e-all"], counters: facts(N, N, true),
      rides: [ride("e-held", "v2", `v${N}`, "2 trees", { via: [`v${BEST}`], then: `${N} trees` })],
      body: ["Nothing in the loop tells it to stop. Given enough trees it reproduces the training table exactly, noise included. Shrinkage slows this down, and giving each tree only a subset of the columns helps prevent it.",
        `Unlike random forests, gradient boosted trees can overfit. Here the training error falls from ${n2(E_TRAIN[2])} to ${n2(E_TRAIN[N])} while the error on the held-back products falls to ${n2(E_HELD[BEST])} at ${BEST} trees and climbs back to ${n2(E_HELD[N])}. Google's worked example shows the same shape: training loss gradually decreases as trees are added, while validation loss decreases only until about 40 trees and then increases.`,
        "The number of trees, their depth and the learning rate are choices, and tuning them is where the effort goes."],
      claims: ["boosting-shrinkage", "boosting-subsampling", "gradient-boosting-can-overfit", "gradient-boosting-validation-turns"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "When to use boosted trees",
      caption: "",
      show: ["fb", "held", "fb-miss", "res", "rb", "c1", "plus1", "c2", "plus2", "more-b", "e-all", "stop"], counters: facts(BEST, BEST, true),
      rides: [ride("e-held", `v${N}`, `v${BEST}`, `${N} trees`, { then: `${BEST} trees` })],
      body: [{ pair: {
        left: { label: "Boosted trees", items: ["Tables of any size", "Fast prediction on ordinary hardware", "A team that can run tuning"] },
        right: { label: "Consider instead", items: ["A tabular foundation model on smaller tables", "An ensemble across model types when accuracy pays"] },
      } },
        `With a validation set, XGBoost can use early stopping to find the optimal number of boosting rounds: the model trains until the validation score stops improving. Here that is ${BEST} trees.`,
        "TabArena's 2025 launch results placed boosted trees among the strong contenders on practical datasets and foundation models strongest on smaller ones."],
      claims: ["tabarena-trees-and-foundation-models", "boosted-trees-default", "gradient-boosting-early-stopping"],
    }),
  ],
  governance: { text: "Where a prediction must be defensible, XGBoost can enforce monotonicity constraints on chosen features, so the model cannot learn a relationship that runs the wrong way.", claims: ["gradient-boosting-monotonic"] },
  closing: {
    pitfalls: [
      "Choosing the number of trees on the training data.",
      "A high learning rate with many trees.",
      "Comparing a tuned model with an untuned one.",
    ],
    questions: [
      "What is each new tree fitted to?",
      "What does the learning rate change?",
      "Why does the training error keep falling while the model gets worse on new data?",
    ],
  },
});
