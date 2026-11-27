import { CANVAS, defineGuide, isoGrid, line, pawn, plot, plotPoint, prism, raise, ride, series, step, stop, table } from "@signal-path/engine";

// Two boards stand on the floor. The left one is order 4471 as a weighted sum: one row per feature, its weight and what it adds.
// The right one plots the outcome against that sum. For minutes the model is a straight line, and the record
// climbs it one product at a time. For returns the same sum is bent by the sigmoid into a probability.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/* ---------- the orders and the fits ---------- */

/** Orders: items, weight in kilograms, gift wrap. The first is order 4471. */
const X: number[][] = [[4, 12, 1], [1, 2, 0], [2, 3, 1], [3, 9, 0], [5, 6, 0], [6, 14, 1], [2, 11, 0], [7, 8, 1], [8, 16, 0], [1, 7, 1], [5, 18, 0], [3, 4, 1], [6, 5, 0], [9, 10, 1]];
/** Volume in litres moves with weight: about three litres per kilogram. */
const VOLUME = X.map(([, kg], i) => 3 * kg + [1, -2, 2, -1, 0, 2, -2, 1, -1, 2, 0, -2, 1, -1][i]);
const RAW = [0.5, -0.7, 0.9, -0.4, 1.0, -0.8, 0.6, -1.0, 0.4, 0.7, -0.5, -0.9, 0.8, -0.6];
const TRUE = [1.5, 1.2, 0.6, 2.0];

function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
/** Least squares with a bias. alpha above zero is ridge regression: a penalty on the size of the weights, the bias left free. */
function fit(rows: number[][], y: number[], alpha = 0): number[] {
  const D = rows.map((r) => [1, ...r]), n = D[0].length;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => D.reduce((s, r) => s + r[i] * r[j], 0) + (i === j && i > 0 ? alpha : 0)));
  return solve(A, Array.from({ length: n }, (_, i) => D.reduce((s, r, k) => s + r[i] * y[k], 0)));
}
const predict = (w: number[], r: number[]) => r.reduce((s, v, i) => s + w[i + 1] * v, w[0]);
const dot = (w: number[], r: number[]) => predict(w, r);

/** Packing minutes: the weighted sum plus a miss per order that no feature explains, so least squares recovers the weights exactly. */
const NOISE = (() => { const w = fit(X, RAW); return RAW.map((e, i) => e - predict(w, X[i])); })();
const MINUTES = X.map((r, i) => dot(TRUE, r) + NOISE[i]);
const W = fit(X, MINUTES).map((v) => Math.round(v * 1000) / 1000);
/** The model from Loss and optimisation: one weight on items, no bias. */
const W1 = X.reduce((s, r, i) => s + r[0] * MINUTES[i], 0) / X.reduce((s, r) => s + r[0] * r[0], 0);
/** The same orders with volume added as a fourth feature, fitted plainly and with ridge. */
const X4 = X.map((r, i) => [r[0], r[1], VOLUME[i], r[2]]);
const W4 = fit(X4, MINUTES);
/** Ridge on standardised features, so the penalty treats every feature alike. Weights are returned in the original units. */
const ALPHA = 1;
const W4R = (() => {
  const cols = X4[0].map((_, j) => X4.map((r) => r[j])), mean = cols.map((c) => c.reduce((s, v) => s + v, 0) / c.length);
  const sd = cols.map((c, j) => Math.sqrt(c.reduce((s, v) => s + (v - mean[j]) ** 2, 0) / c.length));
  const w = fit(X4.map((r) => r.map((v, j) => (v - mean[j]) / sd[j])), MINUTES, ALPHA);
  return [w[0], ...w.slice(1).map((v, j) => v / sd[j])];
})();

const miss = (pred: number[]) => pred.reduce((s, p, i) => s + Math.abs(p - MINUTES[i]), 0) / pred.length;
const P1 = X.map((r) => W1 * r[0]), P3 = X.map((r) => predict(W, r)), P4 = X4.map((r) => predict(W4, r));
const f1 = (v: number) => v.toFixed(1), f2 = (v: number) => v.toFixed(2);
const signed = (v: number, f = f2) => (v < 0 ? "−" : "") + f(Math.abs(v));

/** Returns: the same three features with their own weights. The sum is the log odds. */
const WR = [-2.2, 0.7, 0.1, -0.6];
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const Z = dot(WR, X[0]), P = sigmoid(Z);
const KEPT = [-4.1, -3.5, -3.0, -2.4, -1.9, -1.3, -0.8, -0.2, 0.7, 2.3], RETURNED = [-1.6, -0.5, 0.3, 0.9, 1.5, 1.9, 2.7, 3.2, 3.8, 4.3];

/* ---------- the boards ---------- */

const COLS = ["feature", "value", "weight", "adds"], AT = [16, 170, 250, 340];
const card = (id: string, title: string, rows: Parameters<typeof table>[5], extra: Record<string, unknown> = {}) =>
  raise(table(id, 0, 0, 430, COLS, rows, { at: AT, rowH: 40, title, group: id, ...extra }), F1, 30);
const [o] = X;

const LIN = raise(plot("lin", 0, 0, 430, 300, [0, 25], [0, 25], { title: "Packing time against the model", xt: [0, 5, 10, 15, 20, 25], yt: [0, 5, 10, 15, 20, 25], xLabel: "predicted minutes", yLabel: "actual minutes", group: "lin" }), F2, 30);
const LOG = raise(plot("log", 0, 0, 430, 300, [-5, 5], [-0.18, 1.18], { title: "Returns against the weighted sum", xt: [-4, -2, 0, 2, 4], yt: [0, 0.5, 1], xLabel: "weighted sum z, the log odds", yLabel: "probability of a return", group: "log" }), F2, 30);

/** One fit on the left chart: every order at its prediction, with order 4471 marked. */
const cloud = (id: string, pred: number[]) => [
  series(`${id}-pts`, "lin", "points", pred.slice(1).map((p, i) => [p, MINUTES[i + 1]] as [number, number]), { hue: "sky", r: 6, group: id }),
  series(`${id}-mark`, "lin", "points", [[pred[0], MINUTES[0]]], { r: 7, hot: [0], group: id }),
  series(`${id}-name`, "lin", "points", [[pred[0], MINUTES[0]]], { r: 7, hot: [0], label: "4471", group: `${id}-name` }),
];
const at = (id: string, pl: typeof LIN, x: number, y: number) => stop(id, ...plotPoint(pl, x, y), undefined, undefined, { group: "anchor" });
/** Running totals of the weighted sum for order 4471: bias, then one product at a time. */
const partial = (w: number[]) => o.reduce((acc, v, i) => [...acc, acc[i] + w[i + 1] * v], [w[0]]);
const SUM = partial(W), SUMZ = partial(WR);

const DESK: [number, number] = [7.9, 7.9];

export default defineGuide({
  id: "linear-and-logistic-regression", track: "ml", module: "Model families", slug: "linear-and-logistic-regression",
  title: "Linear and logistic regression",
  summary: "A linear model multiplies each feature by a weight and adds the products. The sum is the prediction, or the log odds that a sigmoid turns into a probability, and every weight can be read.",
  forLeads: "A linear model is the baseline a more complex model has to beat, and the one whose reasons can be read from its weights. Ask what the baseline scored before approving anything more complex.",
  status: "draft", minutes: 7,
  counters: ["Features used", "Output", "Order 4471", "Mean miss"],
  whatIf: { label: "What if two features moved together?", step: 3, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and weights are illustrative",
    label: "Two boards. The left one lists the features of order 4471 with a weight for each and the amount each adds, summed at the bottom. The right one plots actual packing minutes against the model's prediction. With one weight the orders scatter far from the line. With a weight per feature they sit on it, and a record climbs the line one product at a time to 15.5 minutes. Operations reads the reason from the rows. For returns the chart changes to an S-shaped curve that turns the same kind of sum into a probability, and a more complex model stands beside it as a challenger.",
    els: [
      /* the order as a weighted sum */
      card("t1", "Order 4471, one weight", [
        ["items", String(o[0]), f2(W1), f1(W1 * o[0])],
        { cells: ["weight, kg", String(o[1]), "not used", ""], mute: true },
        { cells: ["gift wrap", String(o[2]), "not used", ""], mute: true },
        { cells: ["prediction", "", "", `${f1(P1[0])} min`], hot: true },
      ], { rowH: 54 }),
      card("t3", "Order 4471, a weight per feature", [
        ["bias", "", f1(W[0]), f1(W[0])],
        ["items", String(o[0]), f1(W[1]), f1(W[1] * o[0])],
        ["weight, kg", String(o[1]), f1(W[2]), f1(W[2] * o[1])],
        ["gift wrap", String(o[2]), f1(W[3]), f1(W[3] * o[2])],
        { cells: ["sum", "", "", `${f1(P3[0])} min`], hot: true },
      ], { rowH: 46 }),
      card("t4", "Order 4471, volume added", [
        ["bias", "", f2(W4[0]), f2(W4[0])],
        ["items", String(o[0]), f2(W4[1]), f2(W4[1] * o[0])],
        { cells: ["weight, kg", String(o[1]), signed(W4[2]), signed(W4[2] * o[1])], hue: "rose" },
        { cells: ["volume, l", String(VOLUME[0]), signed(W4[3]), signed(W4[3] * VOLUME[0])], hue: "rose" },
        ["gift wrap", String(o[2]), f2(W4[4]), f2(W4[4] * o[2])],
        { cells: ["sum", "", "", `${f1(P4[0])} min`], hot: true },
      ], { rowH: 40, foot: `Ridge, alpha ${ALPHA}: kg ${signed(W4R[2])}, volume ${signed(W4R[3])}` }),
      card("t5", "Order 4471, will it be returned", [
        ["bias", "", signed(WR[0], f1), signed(WR[0], f1)],
        ["items", String(o[0]), f1(WR[1]), `+${f1(WR[1] * o[0])}`],
        ["weight, kg", String(o[1]), f1(WR[2]), `+${f1(WR[2] * o[1])}`],
        ["gift wrap", String(o[2]), signed(WR[3], f1), signed(WR[3] * o[2], f1)],
        ["sum z", "", "", f1(Z)],
        { cells: ["sigmoid(z)", "", "", f2(P)], hot: true },
      ], { rowH: 40 }),

      /* minutes against the model */
      LIN,
      series("diag", "lin", "line", [[0, 0], [25, 25]], { tone: "ink", w: 3, group: "lin" }),
      ...cloud("c1", P1), ...cloud("c3", P3), ...cloud("c4", P4),
      series("off", "lin", "line", [[P1[0], P1[0]], [P1[0], MINUTES[0]]], { tone: "alert", w: 3, dashed: true, group: "c1" }),
      ...X.slice(1).map((_, i) => series(`off${i}`, "lin", "line", [[P1[i + 1], P1[i + 1]], [P1[i + 1], MINUTES[i + 1]]], { tone: "alert", w: 2, dashed: true, group: "c1" })),
      series("climb", "lin", "line", [[SUM[0], SUM[0]], [SUM[3], SUM[3]]], { w: 5, group: "climb" }),
      at("a1", LIN, SUM[1], SUM[1]), at("a2", LIN, SUM[2], SUM[2]),

      /* returns against the sum */
      LOG,
      series("kept", "log", "points", KEPT.map((z) => [z, 0] as [number, number]), { hue: "sky", r: 6, label: "kept", labelAt: 9, group: "log" }),
      series("returned", "log", "points", RETURNED.map((z) => [z, 1] as [number, number]), { hue: "sand", r: 6, label: "returned", labelAt: 0, group: "log" }),
      series("zx", "log", "line", [[Z, -0.18], [Z, P]], { tone: "muted", w: 2, dashed: true, group: "log" }),
      series("zy", "log", "line", [[-5, P], [Z, P]], { tone: "muted", w: 2, dashed: true, group: "log" }),
      series("curve", "log", "line", Array.from({ length: 51 }, (_, i) => [-5 + i * 0.2, sigmoid(-5 + i * 0.2)] as [number, number]), { w: 4, smooth: true, label: "sigmoid", labelAt: 19, group: "log" }),
      ...SUMZ.map((z, i) => at(`z${i}`, LOG, z, sigmoid(z))),

      /* the reader and the challenger */
      line("read", [F1, G.p(6.9, 7.8)], { group: "read" }),
      line("read-x", [F1, G.p(6.9, 7.8)], { tone: "alert", group: "read-x" }),
      pawn("ops-ask", ...DESK, "Operations", "minutes for 4471?", { group: "ops-ask" }),
      pawn("ops", ...DESK, "Operations", undefined, { group: "ops" }),
      pawn("ops-why", ...DESK, "Operations", "why 15.5 minutes?", { group: "ops-why" }),
      pawn("ops-x", ...DESK, "Operations", "weight saves time?", { group: "ops-x" }),
      pawn("sup-why", ...DESK, "Support", `why ${f2(P)}?`, { group: "sup-why" }),
      pawn("sup", ...DESK, "Support", undefined, { group: "sup" }),
      line("to-ch", [F2, G.p(11.9, 0)], { group: "ch" }),
      prism("ch", 11.9, -0.7, 1.4, 1.4, 30, { hue: "violet", glyph: "tree", title: "Gradient boosting", sub: "has to beat the baseline", at: "s", group: "ch" }),
    ],
  },
  steps: [
    step({
      id: "one", label: "One weight", kind: "problem", title: "One weight uses one feature",
      caption: "Operations predicts packing minutes from items alone. Order 4471 is heavy and gift wrapped, and the model cannot see either. Its prediction is minutes short, and most orders sit far from the line.",
      show: ["t1", "lin", "c1", "ops-ask"], counters: ["1", "minutes", `${f1(P1[0])} min`, `${f1(miss(P1))} min`],
      rides: [ride("off", 0, 1, `4471: ${f1(P1[0])} min`, { then: `took ${f1(MINUTES[0])} min`, tone: "alert" })],
      body: ["This is the model from Loss and optimisation: minutes equals one weight times items. The chart plots each order's actual minutes against the model's prediction, so a perfect model puts every order on the diagonal.",
        "Linear regression finds the relationship between features and a label. Nothing limits it to one feature."],
      claims: ["linear-and-logistic-regression-relationship"],
    }),
    step({
      id: "sum", label: "Weighted sum", kind: "idea", title: "Each feature gets a weight, and the products are added",
      caption: "Every feature is multiplied by its own weight. The products and a bias add up to the prediction. Training finds the weights, and the orders close in on the line.",
      show: ["t3", "lin", "c3", "climb", "ops"], counters: ["3", "minutes", `${f1(P3[0])} min`, `${f1(miss(P3))} min`],
      rides: [ride("climb", 0, 1, `bias ${f1(SUM[0])}`, { via: ["a1", "a2"], then: `${f1(SUM[3])} min` })],
      body: ["A model can rely on multiple features, each having a separate weight: the prediction is the bias plus weight times value for every feature. scikit-learn describes linear models as methods in which the target value is expected to be a linear combination of the features, and stores the weights in coef_ and the bias in intercept_.",
        "Its LinearRegression fits the coefficients that minimise the residual sum of squares between the observed targets and the predictions.",
        { callout: { label: "What changed", text: `The record climbs the line one product at a time: ${f1(SUM[0])} for the bias, ${f1(SUM[1])} with items, ${f1(SUM[2])} with weight, ${f1(SUM[3])} with gift wrap.` } }],
      claims: ["linear-and-logistic-regression-weights", "linear-and-logistic-regression-combination", "linear-and-logistic-regression-least-squares"],
    }),
    step({
      id: "read", label: "Read it", kind: "mechanism", title: "The rows are the explanation",
      caption: "Each weight is minutes per unit of its feature, with the other features held constant. Operations reads why order 4471 gets 15.5 minutes from the rows: its 12 kilograms add 7.2.",
      show: ["t3", "lin", "c3", "c3-name", "read", "ops-why"], counters: ["3", "minutes", `${f1(P3[0])} min`, `${f1(miss(P3))} min`],
      rides: [ride("read", 0, 0.8, "12 kg", { via: [0.4], then: `adds ${f1(W[2] * o[1])} min` })],
      body: ["Coefficients in a linear model with several features represent the dependency between a given feature and the target, conditional on the other features.",
        "Google's Rules of Machine Learning give a second reason to start here: starting with an interpretable model makes debugging easier, because each prediction of linear, logistic or Poisson regression is interpretable as a probability or an expected value.",
        "Weights carry the units of their features, so their sizes cannot be compared directly. Coefficients must be scaled to the same unit of measure to retrieve feature importance.",
        "A weight is a statistical association. Interpreting causality is difficult when there are confounding effects."],
      claims: ["linear-and-logistic-regression-conditional", "linear-and-logistic-regression-debug", "linear-and-logistic-regression-scale", "linear-and-logistic-regression-causal"],
    }),
    step({
      id: "together", label: "Twin features", kind: "watch-out", title: "Correlated features make weights unreadable",
      caption: "Volume is added, and it moves with weight. The predictions barely change, but the two weights now offset each other and one turns negative. Ridge and Lasso penalise the weights to steady them.",
      show: ["t4", "lin", "c4", "c4-name", "read-x", "ops-x"], counters: ["4", "minutes", `${f1(P4[0])} min`, `${f1(miss(P4))} min`],
      rides: [ride("read-x", 0, 0.8, "12 kg", { via: [0.4], then: `adds ${signed(W4[2] * o[1], f1)}?`, tone: "alert" })],
      body: ["Correlated features induce instabilities in the coefficients of linear models, and their effects cannot be well teased apart. The model still predicts well, so the error does not reveal the problem.",
        "Regularised linear models are the standard answer. Ridge regression imposes a penalty on the size of the coefficients, and a larger penalty makes them more robust to collinearity. The Lasso estimates sparse coefficients: it is able to set coefficients exactly to zero, which reduces the number of features the solution depends on.",
        { callout: { label: "What changed", text: `Plain least squares gives weight ${signed(W4[2])} and volume ${signed(W4[3])} minutes per unit. Ridge on standardised features with alpha ${ALPHA} gives ${signed(W4R[2])} and ${signed(W4R[3])}, both positive.` } }],
      claims: ["linear-and-logistic-regression-correlated", "linear-and-logistic-regression-ridge", "linear-and-logistic-regression-lasso"],
    }),
    step({
      id: "logistic", label: "Probability", kind: "mechanism", title: "A sigmoid turns the sum into a probability",
      caption: "Support asks whether order 4471 will be returned. Logistic regression adds weighted features the same way, then passes the sum through the sigmoid. The output is a probability between 0 and 1.",
      show: ["t5", "log", "read", "sup-why"], counters: ["3", "probability", f2(P), "not measured"],
      rides: [ride("curve", "z0", "z3", `z ${signed(SUMZ[0], f1)}`, { via: ["z1", "z2"], then: `p ${f2(P)}` }), ride("read", 0, 0.8, "gift wrap", { via: [0.4], then: `z ${signed(WR[3], f1)}` })],
      body: ["The linear component of a logistic regression model is z, the bias plus weight times value for every feature. z is also called the log odds. It is passed to the sigmoid function, which yields a probability between 0 and 1.",
        "Logistic regression is trained by the same process as linear regression, with Log Loss as the loss function instead of squared loss, and regularisation is critical to prevent overfitting. scikit-learn applies regularisation to LogisticRegression by default.",
        "Logistic regression is a special case of the generalised linear model. Generalised linear models link the prediction to a linear combination of the inputs through an inverse link function and replace squared loss with the unit deviance of a chosen distribution. For counts, scikit-learn suggests a Poisson distribution with a log link.",
        "Credit scorecards are built on the same model. MathWorks documents its workflow: bin the data, fit a logistic regression model, then review the scorecard points, which by default come directly from the weight of evidence values and the model coefficients."],
      claims: ["linear-and-logistic-regression-sigmoid", "linear-and-logistic-regression-log-loss", "linear-and-logistic-regression-default", "linear-and-logistic-regression-glm", "linear-and-logistic-regression-poisson", "linear-and-logistic-regression-scorecard"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The linear model is the baseline",
      caption: "",
      show: ["t5", "log", "sup", "ch"], counters: ["3", "probability", f2(P), "not measured"],
      rides: [ride("curve", "z3", "z3", `p ${f2(P)}`), ride("to-ch", 0.1, 0.45, "baseline", { then: "beat this" })],
      body: [{ pair: {
        left: { label: "Keep the linear model", items: ["Reasons are read from the weights", "It sets the baseline metrics"] },
        right: { label: "Move to a complex model", items: ["Only when it beats the baseline", "Decisions must still be explained"] },
      } },
        "A simple model provides baseline metrics and a baseline behaviour that can be used to test more complex models. Starting simple helps to determine whether a complex model is even justified.",
        "A support vector machine is a further linear family: it constructs a hyperplane, and a good separation is achieved by the hyperplane with the largest distance to the nearest training points of any class. Different kernel functions can be specified for its decision function.",
        "For high-stakes decisions, Rudin argues that explaining black box models is likely to perpetuate bad practices, and that the way forward is to design models that are inherently interpretable. In United States credit law, Regulation B requires a statement of specific reasons for adverse action and treats a statement that the applicant failed to achieve a qualifying score as insufficient."],
      claims: ["linear-and-logistic-regression-baseline", "linear-and-logistic-regression-justified", "linear-and-logistic-regression-svm", "linear-and-logistic-regression-kernels", "linear-and-logistic-regression-inherent", "linear-and-logistic-regression-reasons"],
    }),
  ],
  governance: { text: "A linear model is interpretable by construction: the weights and the products they form are the whole decision. For high-stakes decisions, Rudin argues for designing models that are inherently interpretable. Regulation B requires creditors in the United States to state the specific principal reasons for adverse action.", claims: ["linear-and-logistic-regression-weights", "linear-and-logistic-regression-inherent", "linear-and-logistic-regression-reasons"] },
  closing: {
    pitfalls: [
      "Ranking features by the size of raw weights when the features have different units.",
      "Reading the weights of two correlated features as two separate effects.",
      "Approving a complex model without the score of a linear baseline on the same data.",
    ],
    questions: [
      "What does one weight say about its feature when the other features are held constant?",
      "What does the sigmoid do to the weighted sum?",
      "What must a more complex model show before it replaces the linear one?",
    ],
  },
});
