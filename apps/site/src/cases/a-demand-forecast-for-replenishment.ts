import { CANVAS, blocks, defineGuide, drum, isoGrid, line, list, note, pawn, plot, plotPoint, prism, raise, ride, rule, series, shade, step, table } from "@signal-path/engine";
import type { Pt } from "@signal-path/engine";

// The floor is a loop. Sales history runs down the main rail through the feature table and the model to the order
// and the stores. What the stores sell comes back along the front rail, past a monitor, to the model.
// The board above the rail is one product's weekly sales. The board in front of it changes with the stop.
const G = isoGrid(110, 115, 30);
const BOARD: Pt = [735, 285], SIDE: Pt = [135, 492];
type P2 = [number, number];

/** Weekly units of LAMP-0312 in store 12: a slow wave, a rise, a peak every fourth week (pay week) and noise. */
const NOISE = [2, -3, 4, -2, 3, -4, 1, 5, -2, 3, -5, 2, -1, 4, -3, 2, -2, 3, 1, -4, 2, 0, -3, 4, -2, 3, -1, -4, 2, 5, -3, 1, 3, -4, 5, -6, 2, 17, -3, 4];
const N = NOISE.length, EMPTY = 22;
const sum = (v: number[]) => v.reduce((a, b) => a + b, 0), mean = (v: number[]) => sum(v) / v.length;
/** What the fitted model predicts for a week: the wave, the rise and the pay week. */
const model = (t: number) => 58 + 10 * Math.sin((2 * Math.PI * (t - 8)) / 26) + 0.25 * t + (t % 4 === 0 ? 22 : 0);
const Y = NOISE.map((n, i) => (i + 1 === EMPTY ? 6 : Math.round(model(i + 1) + n)));
const weeks = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
/** The buyer's feel: one order level for six weeks, set from what the six weeks before sold. */
const feel = (t: number) => { const b = Math.floor((t - 1) / 6); return b === 0 ? 50 : Math.round(mean(Y.slice(6 * b - 6, 6 * b))); };
/** The rule: the average of the last four weeks. */
const avg4 = (t: number) => Math.round(mean(Y.slice(t - 5, t - 1)));
const TEST = weeks(33, 40);
const E_RULE = mean(TEST.map((t) => Math.abs(Y[t - 1] - avg4(t)))), E_MODEL = mean(TEST.map((t) => Math.abs(Y[t - 1] - model(t))));
/** The forecast: a middle value and a range that widens with the weeks ahead. */
const AHEAD = weeks(N + 1, N + 6), half = (t: number) => 13 + 2 * (t - N);
const lo = (t: number) => Math.round(model(t) - half(t)), hi = (t: number) => Math.round(model(t) + half(t));
const INSIDE = TEST.filter((t) => Math.abs(Y[t - 1] - model(t)) <= half(N + 1)).length;
const NEXT = N + 1, PROMO = N + 3, STOCK = 20, SOLD = 74, SOLD_PROMO = 140;
const RANGE = `${lo(NEXT)} to ${hi(NEXT)}`, ORDER = hi(NEXT) - STOCK;

const SALES = raise(plot("sales", 0, 0, 410, 216, [0, 47], [0, 150], { title: "Weekly sales of LAMP-0312, store 12", sub: "units", xt: [1, 10, 20, 30, 40], xtl: ["week 1", "10", "20", "30", "40"], yt: [0, 50, 100, 150], always: true }), BOARD, 30);
const on = (t: number, y: number) => plotPoint(SALES, t, y);

/** Loss by number of trees: training keeps falling, validation turns up after 60. */
const TREES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120], BEST = 60;
const lTrain = (n: number) => 3 + 29 * Math.exp(-n / 24), lVal = (n: number) => 8 + 24 * Math.exp(-n / 18) + (n > BEST ? 0.0022 * (n - BEST) ** 2 : 0);
const LOSS = raise(plot("loss", 0, 0, 240, 165, [0, 125], [0, 36], { title: "Loss by number of trees", xt: [0, 60, 120], yt: [0, 12, 24, 36], group: "loss" }), SIDE, 30);
/** The forecast for next week as a distribution over units. */
const SD = half(NEXT) / 1.2816, bell = (u: number) => Math.exp(-((u - model(NEXT)) ** 2) / (2 * SD * SD));
const BELIEF = raise(plot("belief", 0, 0, 240, 165, [40, 116], [0, 1.25], { title: "Belief about week 41", xt: [lo(NEXT), Math.round(model(NEXT)), hi(NEXT)], yt: [], grid: false, xLabel: "units", group: "belief" }), SIDE, 30);
const card = (id: string, title: string, items: Parameters<typeof list>[4]) => raise(list(id, 0, 0, 240, items, { title, group: id }), SIDE, 30);

export default defineGuide({
  id: "case-a-demand-forecast-for-replenishment", track: "case", module: "Use cases", slug: "a-demand-forecast-for-replenishment",
  title: "A demand forecast for replenishment",
  summary: "A weekly forecast for one product in one store is assembled from dated history, features, a boosted model and a range. It is then tested on weeks it never saw, used to place an order, and caught out by a promotion.",
  forLeads: "Ask three things of any forecast: which unseen weeks it was tested on, how wide its range is, and who hears when the world stops matching the training period. A buyer keeps the last word, on the record.",
  status: "draft", minutes: 12,
  counters: ["Order comes from", "Tested on", "Forecast", "Model refreshed"],
  whatIf: { label: "What if the order were a single number?", step: 1, from: 8 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Sales, prices, forecasts and errors are illustrative",
    label: "A chart of 40 weeks of sales of one lamp in one store, with a peak every fourth week. On the floor, sales history runs along a rail to a buyer who places orders for the stores. Later stops add a store of prices and promotions, a feature table, a boosted model, a forecast drawn as a widening range, and a return rail on which sold units pass a monitor on their way back to the model. A second board shows in turn a table of examples, loss curves, a distribution, candidate settings and the order.",
    els: [
      SALES,
      series("history", "sales", "line", Y.map((y, i) => [i + 1, y] as P2), { tone: "ink", w: 2.5, always: true }),
      drum("hist", 0, 0, 1, 30, { hue: "sky", glyph: "table", title: "Sales history", sub: "tills, by week", at: "n", always: true }),
      prism("order", 15.9, -0.6, 1.2, 1.2, 22, { hue: "sand", glyph: "doc", title: "Order", at: "n", always: true }),
      pawn("buyer", 16.5, 1.9, "Buyer", undefined, { always: true }),
      line("m4", [G.p(17.1, 0), G.p(21.4, 0)], { always: true }),
      prism("stores", 21.4, -0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "stack", title: "Stores", sub: "shelves", at: "e", always: true }),

      // Problem: the buyer orders by feel, then by a simple rule.
      line("glance", [G.p(1.2, 0), G.p(15.9, 0)], { tone: "muted", w: 3, group: "feel" }),
      series("felt", "sales", "line", weeks(1, N).flatMap((t) => [[t - 0.5, feel(t)], [t + 0.5, feel(t)]] as P2[]), { w: 3.5, label: "ordered", group: "feel" }),
      blocks("lamp", 6.5, 2.2, 7, 0.7, [26, 20, 13, 7, 2, 2, 2].map((h, i) => ({ h, hue: "track" as const, state: i > 3 ? "alert" as const : undefined })), { gap: 0.25, title: "LAMP-0312", sub: "empty by Friday", at: "se", group: "feel" }),
      blocks("rug", 5, 6.4, 7, 0.7, Array.from({ length: 7 }, () => ({ h: 30, hue: "paper" as const })), { gap: 0.25, title: "RUG-1108", sub: "14 weeks of stock", at: "s", group: "feel" }),
      line("r1", [G.p(1.2, 0), G.p(10.4, 0)], { tone: "muted", w: 3, group: "rule" }),
      prism("avg", 10.4, -0.6, 1.2, 1.2, 14, { hue: "paper", glyph: "scale", title: "Rule", sub: "four-week average", at: "n", group: "rule" }),
      series("avg4", "sales", "line", weeks(5, N).map((t) => [t, avg4(t)] as P2), { w: 3.5, label: "rule", group: "rule" }),
      raise(table("misses", 0, 0, 240, ["week", "ordered", "sold", "gap"], [16, 21, 40].map((t) => ({ cells: [String(t), String(avg4(t)), String(Y[t - 1]), (Y[t - 1] > avg4(t) ? "short " : "over ") + Math.abs(Y[t - 1] - avg4(t))], hot: t === 40 })), { at: [12, 60, 122, 164], title: "The rule against sales", mono: true, group: "rule" }), SIDE, 30),

      // Architecture.
      line("m1", [G.p(1.2, 0), G.p(4.9, 0)], { group: "data" }),
      drum("promo", 5.5, -6, 1, 26, { hue: "violet", glyph: "clock", title: "Promotions", sub: "prices, with dates", at: "n", group: "data" }),
      line("src", [G.p(5.5, -4.8), G.p(5.5, -0.6)], { group: "data" }),
      prism("feat", 4.9, -0.6, 1.2, 1.2, 20, { hue: "sky", glyph: "merge", title: "Feature table", at: "sw", group: "data" }),
      series("gap", "sales", "points", [[EMPTY, 6]], { r: 6, hot: [0], tone: "alert", group: "explore" }),
      note("gap-n", ...on(EMPTY + 1.4, 9), "week 22: empty shelf", { strong: true, tone: "alert", on: "sales", group: "explore" }),
      raise(table("price", 0, 0, 240, ["price", "valid from", "valid to"], [{ cells: ["55.00", "week 1", "week 8"], hot: true }, ["49.00", "week 9", "now"]], { at: [12, 82, 168], title: "Price of LAMP-0312", foot: "as known in week 5: 55.00", mono: true, group: "price" }), SIDE, 30),

      series("labels", "sales", "points", [38, 39, 40].map((t) => [t, Y[t - 1]] as P2), { hue: "sand", r: 5.5, group: "examples" }),
      note("labels-n", ...on(37.3, 122), "labels", { strong: true, anchor: "end", on: "sales", group: "examples" }),
      raise(table("examples", 0, 0, 240, ["week", "last wk", "pay wk", "promo", "sold"], [
        ...[38, 39, 40].map((t) => [String(t), String(Y[t - 2]), t % 4 === 0 ? "yes" : "no", "no", String(Y[t - 1])]),
        { cells: [String(NEXT), String(Y[N - 1]), "no", "no", "?"], hot: true },
      ], { at: [12, 52, 106, 154, 194], columnHues: [undefined, "sky", "sky", "sky", "sand"], title: "One example per week", mono: true, group: "examples" }), SIDE, 30),

      line("m2", [G.p(6.1, 0), G.p(10.4, 0)], { group: "model" }),
      prism("gbm", 10.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "tree", title: "Boosted model", sub: `${BEST} small trees`, at: "n", group: "model" }),
      series("fit", "sales", "line", weeks(1, N).map((t) => [t, model(t)] as P2), { w: 3, label: "model", group: "fit" }),
      LOSS,
      series("l-train", "loss", "line", TREES.map((n) => [n, lTrain(n)] as P2), { tone: "ink", w: 3, group: "loss" }),
      series("l-val", "loss", "line", TREES.map((n) => [n, lVal(n)] as P2), { w: 4, group: "loss" }),
      note("l-train-n", ...plotPoint(LOSS, 121, 6.4), "training", { strong: true, anchor: "end", on: "loss", group: "loss" }),
      note("l-val-n", ...plotPoint(LOSS, 121, 19.5), "validation", { strong: true, tone: "track", anchor: "end", on: "loss", group: "loss" }),
      rule("l-stop", "loss", BEST, { tone: "muted", label: "stop", group: "loss" }),

      line("m3", [G.p(11.6, 0), G.p(15.9, 0)], { group: "m3" }),
      series("fc", "sales", "line", [[N, Y[N - 1]], ...AHEAD.map((t) => [t, model(t)] as P2)], { w: 3.5, group: "range" }),
      series("fc-hi", "sales", "line", AHEAD.map((t) => [t, hi(t)] as P2), { w: 2, group: "range" }),
      series("fc-lo", "sales", "line", AHEAD.map((t) => [t, lo(t)] as P2), { w: 2, group: "range" }),
      ...AHEAD.map((t) => shade(`fc-${t}`, "sales", [t - 0.5, lo(t), t + 0.5, hi(t)], { group: "range" })),
      note("fc-n", ...on(46.6, 138), "range", { strong: true, tone: "track", anchor: "end", on: "sales", group: "range-n" }),
      BELIEF,
      series("bell", "belief", "area", weeks(40, 116).map((u) => [u, bell(u)] as P2), { group: "belief" }),
      rule("q10", "belief", lo(NEXT), { label: "10%", group: "belief" }),
      rule("q50", "belief", Math.round(model(NEXT)), { tone: "ink", label: "50%", group: "belief" }),
      rule("q90", "belief", hi(NEXT), { label: "90%", group: "belief" }),

      line("fb1", [G.p(22, 0.6), G.p(22, 4), G.p(14.1, 4)], { group: "loop" }),
      line("fb2", [G.p(12.9, 4), G.p(11, 4), G.p(11, 0.6)], { group: "loop" }),
      prism("mon", 12.9, 3.4, 1.2, 1.2, 16, { hue: "mint", glyph: "eye", title: "Monitor", sub: "sales against range", at: "sw", group: "mon" }),
      prism("mon-a", 12.9, 3.4, 1.2, 1.2, 16, { hue: "mint", glyph: "eye", title: "Monitor", sub: "drift", at: "sw", state: "alert", group: "mon-a" }),
      card("run", "Every Monday", ["check the new week's data", "retrain on every week so far", { t: "test against current model", hot: true }, "register version 41"]),
      series("act", "sales", "points", [[NEXT, SOLD]], { hue: "mint", r: 5.5, group: "actual" }),

      // Execution.
      shade("s-train", "sales", [0.5, 0, 24.5, 150], { tone: "muted", group: "split" }),
      shade("s-val", "sales", [24.5, 0, 32.5, 150], { tone: "ink", group: "split" }),
      shade("s-test", "sales", [32.5, 0, 40.5, 150], { group: "split" }),
      note("s-train-n", ...on(12.5, 136), "training", { strong: true, anchor: "middle", on: "sales", group: "split" }),
      note("s-val-n", ...on(28.5, 136), "validation", { strong: true, anchor: "middle", on: "sales", group: "split" }),
      note("s-test-n", ...on(36.5, 122), "test", { strong: true, tone: "track", anchor: "middle", on: "sales", group: "split" }),
      series("backtest", "sales", "line", TEST.map((t) => [t, model(t)] as P2), { w: 4, group: "split" }),
      raise(table("tune", 0, 0, 240, ["depth", "rate", "error"], [["2", "0.30", "7.9"], { cells: ["3", "0.10", "5.8"], hot: true }, ["6", "0.10", "7.1"]], { at: [12, 84, 164], title: "Settings, on validation weeks", foot: `test weeks, once: ${E_MODEL.toFixed(1)}`, mono: true, group: "tune" }), SIDE, 30),
      card("slip", "Order for week 41", [`forecast range ${RANGE}`, `range held ${INSIDE} of ${TEST.length} test weeks`, { t: `${STOCK} in stock: order ${ORDER}`, hot: true }]),
      series("act2", "sales", "points", [[NEXT, SOLD], [NEXT + 1, 83]], { hue: "mint", r: 5.5, group: "drift" }),
      series("act3", "sales", "points", [[PROMO, SOLD_PROMO]], { tone: "alert", r: 6, hot: [0], group: "drift" }),
      note("act3-n", ...on(PROMO - 1.6, SOLD_PROMO - 3), "week 43: promotion", { strong: true, tone: "alert", anchor: "end", on: "sales", group: "drift" }),
      card("alarm", "Week 43", [{ t: "first promotion: 20% off", hot: true, tone: "alert" }, { t: `sold ${SOLD_PROMO}, range ${lo(PROMO)} to ${hi(PROMO)}`, hot: true, tone: "alert" }, "buyer's override is recorded"]),
    ],
  },
  steps: [
    step({
      id: "feel", label: "By feel", kind: "problem", phase: "problem", title: "Buyers order stock by feel",
      caption: "The order follows sales weeks late. The lamp sells out before the weekend while demand rises, and rugs ordered after a good month fill the warehouse.",
      show: ["feel"], counters: ["the buyer's feel", "nothing", "none", "no model"],
      rides: [ride("glance", 0, 0.62, "last month"), ride("m4", 0, 0.5, "order 50", { then: "sold out", tone: "alert" })],
      body: ["A buyer sets one order level and keeps it until the shelf complains. Rising demand empties the bestseller. Falling demand leaves stock that is sold at a loss.",
        "Google's guidance treats the existing non-ML solution as the benchmark for deciding whether machine learning fits a problem."],
      claims: ["learning-from-examples-benchmark"],
    }),
    step({
      id: "rule", label: "A rule", kind: "problem", phase: "problem", title: "A simple rule is always late",
      caption: "Ordering the average of the last four weeks trails every rise and misses every pay week. It is one number, with no margin, and it is the baseline to beat.",
      show: ["rule", "m3"], counters: ["a four-week average", "nothing", "one number", "no model"],
      rides: [ride("r1", 0, 0.6, "4 weeks", { then: `avg ${avg4(40)}` }), ride("m3", 0, 0.45, `order ${avg4(40)}`), ride("m4", 0, 0.5, `sold ${Y[39]}`, { tone: "alert", then: "sold out" })],
      concepts: ["learning-from-examples"],
      body: ["A baseline is a model used as a reference point for judging a more complex one. A simple heuristic can get a product out of the door, and it sets the error a model has to beat.",
        "Point forecasts can be of almost no value without the prediction intervals that express their uncertainty.",
        { callout: { label: "The gap", text: "The rule knows last month. The order needs next week, and how wrong next week could be." } }],
      claims: ["learning-from-examples-baseline", "learning-from-examples-heuristic", "forecasting-novalue"],
    }),
    step({
      id: "history", label: "History", kind: "mechanism", phase: "architecture", title: "History is rebuilt as it was known",
      caption: "Prices and promotions keep the dates they applied. A point-in-time join gives each past week only what was known then. Plotted, week 22 is an empty shelf, not weak demand.",
      show: ["data", "explore", "price"], counters: ["dated history", "nothing", "none", "no model"],
      rides: [ride("m1", 0, 0.45, "40 weeks"), ride("src", 0, 0.5, "55.00")],
      concepts: ["time-and-history", "exploring-data", "serving-data-to-ml-and-ai"],
      body: ["A type 2 history adds a row for each change, with the dates the row was effective. The price a customer saw in week 5 can still be read after it changed in week 9.",
        "A point-in-time join reproduces feature state at a past time, so no future data leaks into training.",
        "Data is looked at graphically before analysis goes far. An outlier is investigated before it is removed: this one records a shelf with nothing to sell, so the week measures supply, not demand."],
      claims: ["time-and-history-type2", "serving-data-to-ml-and-ai-point-in-time-join", "serving-data-to-ml-and-ai-no-future-data", "exploring-data-look-first", "exploring-data-investigate"],
    }),
    step({
      id: "examples", label: "Examples", kind: "mechanism", phase: "architecture", title: "Each week becomes one example",
      caption: "Last week's sales, the pay week and the promotion flag are features. Units sold is the label. Week 41 has features and no label: that is the number to predict.",
      show: ["data", "examples"], counters: ["40 weekly examples", "nothing", "none", "no model"],
      rides: [ride("m1", 0, 0.45, `sold ${Y[N - 1]}`, { then: "label" }), ride("src", 0, 0.5, "promo: no", { then: "feature" })],
      concepts: ["features-labels-and-datasets", "feature-engineering", "learning-from-examples"],
      body: ["A labelled example is one row of features and a label. Features are the inputs, and the label is the answer the model is to predict. Predicting a number is regression.",
        "Lagged values of the series are standard features for forecasting with boosted trees. A transform used in training must be applied the same way to every later week.",
        "A feature that would not be available at prediction time is leakage. Next week's sales cannot be a feature of next week."],
      claims: ["features-labels-and-datasets-example", "learning-from-examples-example", "learning-from-examples-regression", "forecasting-lag-features", "feature-engineering-same-transform", "features-labels-and-datasets-leakage"],
    }),
    step({
      id: "boost", label: "Model", kind: "mechanism", phase: "architecture", title: "Each tree corrects the error left behind",
      caption: `A boosted model adds small trees, each fitted to reduce the loss that remains. Training loss keeps falling. Validation loss turns up after ${BEST} trees, so training stops there.`,
      show: ["data", "model", "fit", "loss"], counters: ["a boosted model", "validation weeks", "one number", "once"],
      rides: [ride("m2", 0, 0.42, "40 rows"), ride("l-val", 0, 0.42, "loss 32", { then: "loss 9" })],
      concepts: ["gradient-boosting", "loss-and-optimisation", "overfitting-and-generalisation"],
      body: ["Loss is a number that describes how wrong the predictions are. A boosted ensemble predicts with the sum of its trees, and each new tree is added to improve the objective using the gradient of the loss.",
        "Gradient boosted trees can overfit. When training loss keeps declining and validation loss rises, the model is memorising the training weeks. Early stopping ends training when the validation score stops improving."],
      claims: ["loss-and-optimisation-loss", "boosting-additive", "boosting-greedy-gradient", "gradient-boosting-can-overfit", "overfitting-and-generalisation-diverge", "gradient-boosting-early-stopping"],
    }),
    step({
      id: "range", label: "Range", kind: "mechanism", phase: "architecture", title: "The forecast is a range",
      caption: "Three quantile models give a low, a middle and a high value for each week ahead. The range widens with the horizon, and its width says how far the forecast can be trusted.",
      show: ["data", "model", "m3", "range", "range-n", "belief"], counters: ["a boosted model", "validation weeks", "a range, 10% to 90%", "once"],
      rides: [ride("m3", 0, 0.45, RANGE)],
      concepts: ["forecasting", "probabilistic-models", "uncertainty-and-calibration"],
      body: ["Quantile regression estimates chosen quantiles of the target by minimising the pinball loss, which gives an interval instead of a point. Prediction intervals usually lengthen as the horizon increases.",
        "The interval between a fitted 10% and 90% quantile is expected to hold about 80% of outcomes, but fitted quantiles can be inaccurate, so the coverage is checked on held-out weeks.",
        "Bayesian statistics gives probabilities to all possible values of an unknown quantity and updates them as data arrives. The quantile forecast answers in the same form, a distribution over next week's units, by a different route."],
      claims: ["uncertainty-and-calibration-quantile", "uncertainty-and-calibration-nominal", "forecasting-interval", "forecasting-widen", "probabilistic-models-prior", "probabilistic-models-posterior"],
    }),
    step({
      id: "pipeline", label: "Pipeline", kind: "mechanism", phase: "architecture", title: "The pipeline retrains weekly and is watched",
      caption: "Every Monday the pipeline checks the new data, retrains, tests the candidate against the current model and registers it. A monitor compares each week's sales with the range forecast for it.",
      show: ["data", "model", "m3", "range", "range-n", "loop", "mon", "run", "actual"], counters: ["a boosted model", "validation weeks", "a range, 10% to 90%", "weekly"],
      rides: [ride("fb1", 0, 0.83, `${SOLD} sold`, { then: "in range" }), ride("fb2", 0, 0.6, "new week", { then: "retrain" })],
      concepts: ["training-pipelines", "monitoring-and-drift"],
      body: ["Continuous training automates the pipeline: its steps are orchestrated, and data and model validation run inside it. A pipeline can be triggered on a schedule, on new data, or on degraded performance.",
        "Offline validation compares the candidate's metrics with the current model before promotion. A registry gives each model a version and the run that produced it.",
        "Models decay as data profiles evolve. Outcomes analysis compares model outputs with what actually happened."],
      claims: ["training-pipelines-automation", "training-pipelines-triggers", "training-pipelines-data-validation", "training-pipelines-model-validation", "training-pipelines-registry", "monitoring-and-drift-decay", "monitoring-and-drift-outcomes"],
    }),
    step({
      id: "backtest", label: "Unseen weeks", kind: "mechanism", phase: "execution", title: "The model is tested on unseen weeks",
      caption: `Weeks 1 to 24 train the model and weeks 25 to 32 choose its settings. Weeks 33 to 40 are forecast once, unseen. The error is ${E_MODEL.toFixed(1)} units against ${E_RULE.toFixed(1)} for the rule.`,
      show: ["data", "model", "m3", "split", "tune"], counters: ["a boosted model", "8 unseen weeks", "a range, 10% to 90%", "weekly"],
      rides: [ride("m2", 0, 0.42, "wk 1-24"), ride("m3", 0, 0.45, "wk 33-40", { then: `error ${E_MODEL.toFixed(1)}` })],
      concepts: ["training-validation-and-test-sets", "model-selection-and-tuning", "forecasting"],
      body: ["A time series model is evaluated on the future observations least like those it trained on. Any split that trains on later weeks and tests on earlier ones is inappropriate for time-ordered data.",
        "Hyperparameters are not learnt by the model. They are searched for the best validation score, and the chosen model is then judged on held-out samples the search never saw.",
        "Tuning against the test weeks would leak them into the model, and the score would stop reporting how it generalises."],
      claims: ["training-validation-and-test-sets-time", "forecasting-order", "forecasting-tscv", "training-validation-and-test-sets-validation", "model-selection-and-tuning-hyper", "model-selection-and-tuning-held-out", "training-validation-and-test-sets-tuning-leak", "learning-from-examples-baseline"],
    }),
    step({
      id: "order", label: "An order", kind: "mechanism", phase: "execution", title: "The order covers the top of the range",
      caption: `Week 41 is forecast at ${RANGE} lamps. The order brings the shelf to ${hi(NEXT)}, the high value, so a busy week is covered. The store sells ${SOLD}, inside the range.`,
      show: ["data", "model", "m3", "range", "range-n", "loop", "mon", "slip", "actual"], counters: ["the top of the range", "8 unseen weeks", `${RANGE} lamps`, "weekly"],
      rides: [ride("m3", 0, 0.45, RANGE), ride("m4", 0, 0.5, `order ${ORDER}`), ride("fb1", 0, 0.83, `${SOLD} sold`, { then: "in range" })],
      concepts: ["uncertainty-and-calibration", "forecasting"],
      body: ["A prediction interval gives the range in which the value is expected to lie with a stated probability. Ordering to its upper end turns that probability into a service level the business chose.",
        "The range earned its use on the test weeks: the share of outcomes inside it was close to the share its quantiles promise.",
        "The features for week 41 come from the same table that fed training, which keeps the values a model is served consistent with the values it learnt from."],
      claims: ["forecasting-interval", "uncertainty-and-calibration-nominal", "serving-data-to-ml-and-ai-skew", "feature-engineering-same-transform"],
    }),
    step({
      id: "drift", label: "A promotion", kind: "decision", phase: "execution", title: "A first promotion shows as drift",
      caption: "",
      show: ["data", "model", "m3", "range", "loop", "mon-a", "alarm", "drift"], counters: ["the buyer's override", "8 unseen weeks", "outside the range", "retrain triggered"],
      rides: [ride("fb1", 0, 0.83, `${SOLD_PROMO} sold`, { tone: "alert", then: "drift" }), ride("m4", 0, 0.5, "order 160", { then: "override" }), ride("fb2", 0, 0.6, "promo weeks", { then: "retrain" })],
      concepts: ["monitoring-and-drift", "training-pipelines"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Tests on later, unseen weeks", "A range checked against outcomes", "Overrides kept on record"] },
        right: { label: "Do not rely on", items: ["A score from shuffled weeks", "One number per product", "Last quarter's model"] },
      } },
        "Drift occurs when the process at prediction time differs from the one that generated the training data. Every training week had the promotion flag set to no, so the input itself has shifted.",
        "A retraining pipeline can be triggered by degraded performance or by a significant change in the data. NIST expects mechanisms to supersede or disengage a system whose outcomes are inconsistent with its intended use.",
        { callout: { label: "Who decides", text: "The monitor raises the alarm. The buyer sets the order, and the override becomes training data." } }],
      claims: ["monitoring-and-drift-constant", "monitoring-and-drift-covariate", "monitoring-and-drift-triggers", "monitoring-and-drift-nist", "forecasting-order", "forecasting-novalue", "uncertainty-and-calibration-oversight"],
    }),
  ],
  governance: { text: "A forecast is tested on weeks it has not seen. A buyer can override it, and each override is recorded.", claims: ["training-validation-and-test-sets-time", "monitoring-and-drift-nist", "uncertainty-and-calibration-oversight"] },
  closing: {
    pitfalls: [
      "Scoring the forecast on weeks shuffled in among its training weeks.",
      "Reading a week with an empty shelf as a week with no demand.",
      "Ordering to the middle of the range and calling the shortfall bad luck.",
    ],
    questions: [
      "Which weeks did the model never see before it was scored?",
      "Why is the order set from the high value and not the middle one?",
      "What did the monitor compare when it flagged week 43?",
    ],
  },
});
