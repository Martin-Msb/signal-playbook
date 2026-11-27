import { CANVAS, cells, defineGuide, isoGrid, note, pill, plot, plotPoint, raise, ride, series, step, table } from "@signal-path/engine";

// Two boards stand on the floor. The left one lines up 20 held-back orders by their actual packing time and draws
// what each tree predicts for them: one tree zigzags around the actual values, the average of a hundred runs close.
// The right one is the training side: the sample a tree is grown from, then the out-of-bag error of the forest as
// trees are added, then the importance scores. Every number is computed below from the same 100 illustrative orders.
const G = isoGrid(480, 295, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/* ---------- the orders ---------- */

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = <T>(a: T[], R: () => number): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const FEATURES = ["kg", "litres", "items", "fragile", "channel", "order no"];
const F = FEATURES.length, N_TRAIN = 80, TREES = 100, FRAGILE = 3, ORDER_NO = 5;
interface Order { x: number[]; y: number }
/** Packing minutes depend on weight, volume, items and fragility, plus noise. Channel and order number carry no signal. */
const ORDERS: Order[] = (() => {
  const R = rng(7), gauss = () => Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R());
  return shuffle(Array.from({ length: 100 }, (_, i) => 4468 + i), R).map((no) => {
    const kg = Math.round((1 + R() * 19) * 10) / 10, items = 1 + Math.floor(R() * 6), fragile = R() < 0.3 ? 1 : 0, channel = Math.floor(R() * 3);
    const litres = Math.round(kg * 4 + gauss() * 8);
    return { x: [kg, litres, items, fragile, channel, no], y: Math.round((4 + 0.6 * kg + 0.1 * litres + 1.5 * items + 4 * fragile + gauss() * 2.5) * 10) / 10 };
  });
})();
const TRAIN = ORDERS.slice(0, N_TRAIN), HELD = ORDERS.slice(N_TRAIN).sort((a, b) => a.y - b.y);

/* ---------- trees and forests ---------- */

interface Tree { v?: number; f?: number; t?: number; l?: Tree; r?: Tree }
/** A fully grown regression tree. Each split tries m features chosen at random and keeps the one that cuts squared error most. */
function grow(idx: number[], m: number, R: () => number, gain: number[]): Tree {
  const n = idx.length, mean = idx.reduce((s, i) => s + TRAIN[i].y, 0) / n, sse = idx.reduce((s, i) => s + (TRAIN[i].y - mean) ** 2, 0);
  if (n < 2 || sse < 1e-9) return { v: mean };
  let best: { e: number; f: number; t: number } | undefined;
  shuffle(FEATURES.map((_, f) => f), R).forEach((f, k) => {
    if (k >= m && best) return;
    const s = [...idx].sort((a, b) => TRAIN[a].x[f] - TRAIN[b].x[f]), ts = s.reduce((t, i) => t + TRAIN[i].y, 0), tq = s.reduce((t, i) => t + TRAIN[i].y ** 2, 0);
    let ls = 0, lq = 0;
    for (let i = 0; i < n - 1; i++) {
      const y = TRAIN[s[i]].y; ls += y; lq += y * y;
      if (TRAIN[s[i]].x[f] === TRAIN[s[i + 1]].x[f]) continue;
      const e = lq - ls * ls / (i + 1) + (tq - lq) - (ts - ls) ** 2 / (n - i - 1);
      if (!best || e < best.e) best = { e, f, t: (TRAIN[s[i]].x[f] + TRAIN[s[i + 1]].x[f]) / 2 };
    }
  });
  if (!best) return { v: mean };
  const { e, f, t } = best;
  gain[f] += sse - e;
  return { f, t, l: grow(idx.filter((i) => TRAIN[i].x[f] <= t), m, R, gain), r: grow(idx.filter((i) => TRAIN[i].x[f] > t), m, R, gain) };
}
const predict = (tree: Tree, x: number[]): number => { let t = tree; while (t.f !== undefined) t = x[t.f] <= t.t! ? t.l! : t.r!; return t.v!; };
interface Member { tree: Tree; drawn: number[]; importance: number[] }
/** A forest: every tree is grown on a bootstrap sample of the training orders. drawn counts how often each order was drawn. */
function forest(m: number): Member[] {
  const R = rng(11);
  return Array.from({ length: TREES }, () => {
    const idx = Array.from({ length: N_TRAIN }, () => Math.floor(R() * N_TRAIN)), gain = Array<number>(F).fill(0);
    const tree = grow(idx, m, R, gain), total = gain.reduce((a, b) => a + b, 0), drawn = Array<number>(N_TRAIN).fill(0);
    for (const i of idx) drawn[i]++;
    return { tree, drawn, importance: gain.map((v) => v / total) };
  });
}
const mse = (p: number[], set: Order[]) => set.reduce((s, o, i) => s + (p[i] - o.y) ** 2, 0) / set.length;
const mean = (fo: Member[], x: number[]) => fo.reduce((s, t) => s + predict(t.tree, x), 0) / fo.length;
/** Out-of-bag error after each tree is added: every order is predicted only by the trees whose sample left it out. */
function oobCurve(fo: Member[]): number[] {
  const sum = Array<number>(N_TRAIN).fill(0), cnt = Array<number>(N_TRAIN).fill(0);
  return fo.map((t) => {
    let s = 0, c = 0;
    TRAIN.forEach((o, i) => { if (!t.drawn[i]) { sum[i] += predict(t.tree, o.x); cnt[i]++; } if (cnt[i]) { s += (sum[i] / cnt[i] - o.y) ** 2; c++; } });
    return s / c;
  });
}
/** Mean correlation between the held-back errors of two trees, over the first 30 trees. */
function correlation(fo: Member[]): number {
  const E = fo.slice(0, 30).map((t) => { const e = HELD.map((o) => predict(t.tree, o.x) - o.y), m = e.reduce((a, b) => a + b, 0) / e.length; return e.map((v) => v - m); });
  let s = 0, c = 0;
  for (let a = 0; a < E.length; a++) for (let b = a + 1; b < E.length; b++) { const dot = (u: number[], v: number[]) => u.reduce((t, x, i) => t + x * v[i], 0); s += dot(E[a], E[b]) / Math.sqrt(dot(E[a], E[a]) * dot(E[b], E[b])); c++; }
  return s / c;
}
/** Permutation importance on the held-back orders: the rise in error when one feature is shuffled, as a share of all rises. */
function permutation(fo: Member[]): number[] {
  const R = rng(5), base = mse(HELD.map((o) => mean(fo, o.x)), HELD);
  const rise = FEATURES.map((_, f) => {
    let s = 0;
    for (let k = 0; k < 10; k++) { const col = shuffle(HELD.map((o) => o.x[f]), R); s += mse(HELD.map((o, i) => mean(fo, o.x.map((v, g) => (g === f ? col[i] : v)))), HELD) - base; }
    return Math.max(0, s / 10);
  });
  const total = rise.reduce((a, b) => a + b, 0);
  return rise.map((v) => v / total);
}

const n2 = (v: number) => v.toFixed(2);
const ONE = grow(TRAIN.map((_, i) => i), F, rng(3), Array<number>(F).fill(0));
const BAG = forest(F), RF = forest(2);
const P_ONE = HELD.map((o) => predict(ONE, o.x)), P_BAG = HELD.map((o) => mean(BAG, o.x)), P_RF = HELD.map((o) => mean(RF, o.x));
const P_TREE = (fo: Member[], k: number) => HELD.map((o) => predict(fo[k].tree, o.x));
const E_ONE = mse(P_ONE, HELD), E_BAG = mse(P_BAG, HELD), E_RF = mse(P_RF, HELD);
const E_THREE = [0, 1, 2].map((k) => mse(P_TREE(BAG, k), HELD));
const OOB_BAG = oobCurve(BAG), OOB_RF = oobCurve(RF);
const LEFT_OUT = BAG[1].drawn.filter((d) => d === 0).length;
const MDI = FEATURES.map((_, f) => RF.reduce((s, t) => s + t.importance[f], 0) / TREES), PERM = permutation(RF);
const C_BAG = correlation(BAG), C_RF = correlation(RF);

/* ---------- the boards ---------- */

const HELD_N = HELD.length, FIRST = 5;
const PRED = raise(plot("pred", 0, 0, 430, 345, [0.2, HELD_N + 0.8], [0, 45], { title: "Predictions for 20 held-back orders", xt: [1, 5, 10, 15, 20], yt: [0, 15, 30, 45], xLabel: "orders, by actual time", yLabel: "minutes to pack", always: true }), F1, 30);
const ERR = raise(plot("err", 0, 0, 430, 345, [0, 112], [0, 28], { title: "Out-of-bag error by number of trees", xt: [5, 25, 50, 75, 100], yt: [0, 7, 14, 21, 28], xLabel: "trees in the forest", yLabel: "mean squared error", group: "err" }), F2, 30);
const IMP = raise(plot("imp", 0, 0, 430, 345, [0.4, 6.6], [0, 0.6], { title: "Importance of each feature", xt: [1, 2, 3, 4, 5, 6], xtl: FEATURES, yt: [0, 0.2, 0.4, 0.6], yLabel: "share of importance", group: "imp" }), F2, 30);

const across = (p: number[]) => p.map((v, i) => [i + 1, v] as [number, number]);
/** What one model predicts for the held-back orders, as a line across them. */
const model = (id: string, p: number[], group: string, extra: Record<string, unknown> = {}) => series(id, "pred", "line", across(p), { group, ...extra });
/** The misses of one model: a red dash from each prediction to the actual value. */
const misses = (id: string, p: number[]) => HELD.map((o, i) => series(`${id}-m${i}`, "pred", "line", [[i + 1, p[i]], [i + 1, o.y]], { tone: "alert", w: 2, dashed: true, group: `${id}-miss` }));
const curve = (v: number[]) => v.map((e, i) => [i + 1, e] as [number, number]).slice(FIRST - 1);

const SAMPLE = [0, 1, 2, 3, 4, 5, 6, 7];
const order = (i: number) => [String(TRAIN[i].x[ORDER_NO]), TRAIN[i].x[0].toFixed(1), String(TRAIN[i].x[2]), TRAIN[i].y.toFixed(1)];

export default defineGuide({
  id: "bagging-and-random-forests", track: "ml", module: "Model families", slug: "bagging-and-random-forests",
  title: "Bagging and random forests",
  summary: "Bagging trains many deep trees, each on a resample of the training data, and averages their predictions. The trees miss in different directions, so much of their error cancels. A random forest also restricts the features each split may try.",
  forLeads: "A forest trades the readable rules of one tree for steadier predictions. Its built-in importance scores are a ranking computed on training data, not an explanation of a decision.",
  status: "draft", minutes: 7,
  counters: ["Trees", "Features per split", "Out-of-bag error", "Validation error"],
  whatIf: { label: "What if there were only one tree?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "Two boards. The left one lines up 20 held-back orders by actual packing time and draws the predictions for them. One fully grown tree zigzags far above and below the actual values. Three trees grown on three resamples of the training orders zigzag in different places. The average of 100 such trees runs close to the actual values. The right board first shows the training orders and how often a resample drew each one, then the out-of-bag error falling and levelling off as trees are added, lower for the forest that tries 2 of 6 features per split. Last it shows importance scores, where the order number outranks the fragile flag on the impurity-based score and falls to almost nothing when shuffled on held-back orders.",
    els: [
      PRED,
      ...misses("one", P_ONE), ...misses("bag", P_BAG), ...misses("rf", P_RF),
      model("one", P_ONE, "one", { tone: "ink", w: 3 }),
      ...[0, 1, 2].map((k) => model(`t${k + 1}`, P_TREE(BAG, k), "three", { tone: "ink", w: 2.5 })),
      ...[0, 1, 2].map((k) => model(`b${k + 1}`, P_TREE(BAG, k), "bag-trees", { tone: "muted", w: 1.5 })),
      ...[0, 1, 2].map((k) => model(`r${k + 1}`, P_TREE(RF, k), "rf-trees", { tone: "muted", w: 1.5 })),
      model("bag", P_BAG, "bag", { w: 4.5 }), model("rf", P_RF, "rf", { w: 4.5 }),
      series("actual", "pred", "points", across(HELD.map((o) => o.y)), { hue: "sky", r: 5, always: true }),
      series("k-actual", "pred", "points", [[13.2, 9.5]], { hue: "sky", r: 5, tone: "muted", label: "actual time", always: true }),
      note("k-one", ...plotPoint(PRED, 1, 39.5), "one tree", { strong: true, on: "pred", group: "one" }),
      note("k-three", ...plotPoint(PRED, 1, 39.5), "three trees, three samples", { strong: true, on: "pred", group: "three" }),
      note("k-bag", ...plotPoint(PRED, 1, 39.5), "average of 100 trees", { strong: true, tone: "track", on: "pred", group: "bag" }),
      note("k-rf", ...plotPoint(PRED, 1, 39.5), "average of 100 trees", { strong: true, tone: "track", on: "pred", group: "rf" }),

      raise(table("train", 0, 0, 380, ["order", "kg", "items", "minutes"], SAMPLE.map(order), { at: [18, 124, 200, 282], rowH: 34, mono: true, title: "Training orders", foot: `${N_TRAIN} orders, 6 features each`, group: "train" }), F2, 30),
      raise(table("sample", 0, 0, 380, ["order", "kg", "items", "drawn"], SAMPLE.map((i) => { const d = BAG[1].drawn[i]; return { cells: [...order(i).slice(0, 3), d ? `${d} time${d > 1 ? "s" : ""}` : "left out"], mute: d === 0, hot: d > 1 }; }), { at: [18, 124, 200, 282], rowH: 34, mono: true, title: "Sample for tree 2", foot: `${N_TRAIN} draws, ${LEFT_OUT} of ${N_TRAIN} orders left out`, group: "sample" }), F2, 30),

      ERR,
      series("e-bag", "err", "line", curve(OOB_BAG), { tone: "ink", w: 3, group: "e-bag" }),
      note("e-bag-n", ...plotPoint(ERR, 72, OOB_BAG[TREES - 1] + 2.2), "all 6 features", { strong: true, anchor: "end", on: "err", group: "e-bag" }),
      series("e-rf", "err", "line", curve(OOB_RF), { w: 4, group: "e-rf" }),
      note("e-rf-n", ...plotPoint(ERR, 72, OOB_RF[TREES - 1] - 3.4), "2 of 6 features", { strong: true, tone: "track", anchor: "end", on: "err", group: "e-rf" }),
      pill("set-n", plotPoint(ERR, 62, 25), "n_estimators = 100", { tone: "track", mono: true, on: "err", group: "settings" }),
      pill("set-m", plotPoint(ERR, 62, 21), "max_features = 2", { tone: "track", mono: true, on: "err", group: "settings" }),

      IMP,
      series("scores", "imp", "bars", FEATURES.flatMap((_, f) => [[f + 0.8, MDI[f]], [f + 1.2, PERM[f]]] as [number, number][]), { hues: FEATURES.flatMap(() => ["sky", "sand"] as const), hot: [FRAGILE * 2, FRAGILE * 2 + 1, ORDER_NO * 2, ORDER_NO * 2 + 1], group: "imp" }),
      series("k-mdi", "imp", "points", [[3.1, 0.55]], { hue: "sky", r: 6, tone: "muted", label: "impurity-based", group: "imp" }),
      series("k-perm", "imp", "points", [[3.1, 0.49]], { hue: "sand", r: 6, tone: "muted", label: "permutation, held-back", group: "imp" }),
      pill("rank", plotPoint(IMP, 5.1, 0.24), "outranks fragile", { tone: "alert", to: plotPoint(IMP, 5.8, MDI[ORDER_NO] + 0.012), on: "imp", group: "imp" }),

      raise(cells("features-all", 0, 0, 6, [78, 30], FEATURES, { title: "Features tried at one split", sub: "all 6", group: "features-all" }), G.p(7.75, 7.75), 20),
      raise(cells("features", 0, 0, 6, [78, 30], FEATURES.map((t, f) => (f === 1 || f === FRAGILE ? { t, hot: true } : { t, mute: true })), { title: "Features tried at one split", sub: "2 of 6, drawn at random", group: "features" }), G.p(7.75, 7.75), 20),
    ],
  },
  steps: [
    step({
      id: "one-tree", label: "One tree", kind: "problem", title: "One deep tree predicts unevenly",
      caption: "Operations predicts packing minutes with one fully grown tree. On 20 held-back orders it lands far above some and far below others.",
      show: ["one", "one-miss", "train", "features-all"], counters: ["1", "6 of 6", "none", n2(E_ONE)],
      rides: [ride("one", 0, 1, "one tree")],
      body: ["The tree was trained on 80 orders with six features: weight, volume, items, a fragile flag, the sales channel and the order number. Its mean squared error on the 20 held-back orders is " + n2(E_ONE) + ".",
        "Individual decision trees typically exhibit high variance and tend to overfit. A fully grown tree gives every training order its own leaf, so the noise in those orders becomes part of the model."],
      claims: ["bagging-and-random-forests-variance"],
    }),
    step({
      id: "resample", label: "Resample", kind: "idea", title: "Each tree trains on a resampled set",
      caption: "Draw 80 orders from the 80 with replacement. Some repeat and about a third are left out. Three samples grow three trees that miss in different places.",
      show: ["three", "sample", "features-all"], counters: ["3", "6 of 6", "none", `${n2(Math.min(...E_THREE))} to ${n2(Math.max(...E_THREE))}`],
      rides: [ride("t2", 0, 1, "tree 2")],
      body: ["A sample drawn with replacement is a bootstrap sample. Each tree is trained on the same number of examples as the original training set, and about one-third of the cases are left out of each sample.",
        "Bagging builds several instances of an estimator on random subsets of the training set and then aggregates their predictions. scikit-learn offers it for any estimator as BaggingClassifier and BaggingRegressor.",
        { callout: { label: "Key idea", text: "The resampling is there to make the trees differ. Each one is still a deep, overfitted tree." } },
        "Bagging works best with strong and complex models such as fully developed decision trees, and the trees of a random forest are trained without pruning."],
      claims: ["bagging-and-random-forests-bootstrap", "bagging-and-random-forests-same-size", "bagging-and-random-forests-left-out", "bagging-and-random-forests-bagging", "bagging-and-random-forests-deep"],
    }),
    step({
      id: "average", label: "Average", kind: "mechanism", title: "Averaging the trees cancels their errors",
      caption: "One tree is high where another is low, so the average of 100 lands closer. The out-of-bag error, scored on orders each tree left out, settles as trees are added.",
      show: ["bag-trees", "bag", "bag-miss", "err", "e-bag", "features-all"], counters: [String(TREES), "6 of 6", n2(OOB_BAG[TREES - 1]), n2(E_BAG)],
      rides: [ride("e-bag", 0, 1, `${FIRST} trees`, { then: `${TREES} trees` })],
      body: ["The randomness gives trees with somewhat decoupled prediction errors. By taking an average of those predictions, some errors can cancel out. The forest achieves a reduced variance, sometimes at the cost of a slight increase in bias.",
        "The out-of-bag estimate needs no separate test set. To score one training order, only the trees that did not see it during training are used. In scikit-learn it is switched on with oob_score=True and is available only with bootstrap sampling.",
        { callout: { label: "What changed", text: `Validation error fell from ${n2(E_ONE)} for the single tree to ${n2(E_BAG)} for the average of ${TREES}. No tree was made better.` } },
        "scikit-learn averages the predictions of the trees. For classification it averages their predicted probabilities, where the original publication let each tree vote for a single class."],
      claims: ["bagging-and-random-forests-cancel", "bagging-and-random-forests-average", "bagging-and-random-forests-oob", "bagging-and-random-forests-oob-how"],
    }),
    step({
      id: "features", label: "Random features", kind: "mechanism", title: "A random forest also varies the features",
      caption: `At each split a tree may try only 2 of the 6 features, chosen at random. The trees grow less alike, their errors overlap less, and here the out-of-bag error falls to ${n2(OOB_RF[TREES - 1])}.`,
      show: ["rf-trees", "rf", "rf-miss", "err", "e-bag", "e-rf", "features"], counters: [String(TREES), "2 of 6", n2(OOB_RF[TREES - 1]), n2(E_RF)],
      rides: [ride("e-rf", 0, 1, "")],
      body: ["In a random forest each tree is built from a bootstrap sample, and a random subset of the features is considered at each split. The size of the subset is the max_features parameter.",
        "Breiman showed that the forest error rate depends on the correlation between any two trees and on the strength of each tree. Increasing the correlation increases the error rate, and reducing the number of features tried reduces both the correlation and the strength.",
        { callout: { label: "What changed", text: `The mean correlation between the held-back errors of two trees fell from ${n2(C_BAG)} to ${n2(C_RF)}, and validation error from ${n2(E_BAG)} to ${n2(E_RF)}.` } },
        "The lower max_features is, the greater the reduction of variance, but also the greater the increase in bias. scikit-learn's default for regression considers all features, which is equivalent to bagged trees, and its default for classification is the square root of the number of features. A typical value in the literature is 0.3."],
      claims: ["bagging-and-random-forests-features", "bagging-and-random-forests-correlation", "bagging-and-random-forests-max-features"],
    }),
    step({
      id: "importance", label: "Importance", kind: "watch-out", title: "Importance scores are not explanations",
      caption: "Impurity-based scores favour features with many unique values. The order number carries no signal, yet it outranks the fragile flag. Shuffled on held-back orders, it scores near zero.",
      show: ["rf-trees", "rf", "rf-miss", "imp", "features"], counters: [String(TREES), "2 of 6", n2(OOB_RF[TREES - 1]), n2(E_RF)],
      body: ["A fitted forest stores feature_importances_, the mean decrease in impurity: the fraction of samples a feature's splits contribute to, combined with the decrease in impurity from splitting them, averaged over the trees. The values are positive and sum to 1.",
        "scikit-learn warns of two flaws. The scores are computed on statistics of the training set, so they do not necessarily show which features matter for predictions on held-out data, and they favour high cardinality features. In its own example a random numerical feature with as many unique values as records is ranked among the most important.",
        `Here the order number has ${N_TRAIN} unique values and scores ${n2(MDI[ORDER_NO])}. The fragile flag has two values and scores ${n2(MDI[FRAGILE])}, although fragile orders do take longer to pack.`,
        "Permutation importance shuffles the values of one feature and observes how far the model's score degrades, and it can be computed on unseen data. It shows how important the feature is for one particular model, not its intrinsic predictive value. The bars show each feature's share of the total rise in error.",
        "It has its own limit. When two features are correlated and one is permuted, the model still reaches the information through the other, so both report a lower importance. Weight and volume are such a pair here."],
      claims: ["bagging-and-random-forests-mdi", "bagging-and-random-forests-mdi-flaws", "bagging-and-random-forests-random-num", "bagging-and-random-forests-permutation", "bagging-and-random-forests-correlated"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Two settings to tune",
      caption: "",
      show: ["rf-trees", "rf", "rf-miss", "err", "e-bag", "e-rf", "features", "settings"], counters: [String(TREES), "2 of 6", n2(OOB_RF[TREES - 1]), n2(E_RF)],
      rides: [ride("e-rf", 1, 1, "")],
      body: [{ pair: {
        left: { label: "Number of trees", items: ["More is better, and slower", "Gains stop past a critical number"] },
        right: { label: "Features per split", items: ["Fewer cuts variance more", "Fewer also raises bias"] },
      } },
        "The main parameters to adjust are n_estimators and max_features. Results stop getting significantly better beyond a critical number of trees, which is where the out-of-bag curve goes flat. In scikit-learn n_estimators defaults to 100.",
        "Good results are often achieved with fully developed trees, but scikit-learn notes that these values are usually not optimal and that the best parameter values should always be cross-validated."],
      claims: ["bagging-and-random-forests-n-estimators", "bagging-and-random-forests-default-trees", "bagging-and-random-forests-max-features", "bagging-and-random-forests-deep"],
    }),
  ],
  governance: { text: "Impurity-based importance scores are computed on training data and favour high cardinality features, so a ranking from the forest is not an explanation on its own. Permutation importance on held-out data shows how much one particular model relies on a feature, not the feature's intrinsic predictive value.", claims: ["bagging-and-random-forests-mdi-flaws", "bagging-and-random-forests-permutation"] },
  closing: {
    pitfalls: [
      "Presenting feature_importances_ to a reviewer as the reason for a prediction.",
      "Leaving an identifier such as the order number among the features.",
      "Adding trees to fix a forest whose trees are too alike.",
    ],
    questions: [
      "Why does the average of many overfitted trees predict better than one of them?",
      "Which orders score a tree in the out-of-bag estimate?",
      "What does a lower max_features do to variance and to bias?",
    ],
  },
});
