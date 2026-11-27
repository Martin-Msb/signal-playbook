import { CANVAS, defineGuide, isoGrid, line, note, pawn, plot, plotPoint, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";

// Two boards stand on the floor. The left one is order 4480, refused pay by invoice by a boosted model, as a table that
// each method fills in differently. The right one is the chart that method draws: the fall in score when a column is
// shuffled, the path from the average risk to this order's risk, and this order's risk as its amount changes.
// Every number is computed below from the same 600 illustrative orders.
const G = isoGrid(480, 250, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/* ---------- the orders ---------- */

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = <T>(a: T[], R: () => number): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const FEATURES = ["amount", "past orders", "account age", "late payments"];
const AMOUNT = 0, ORDERS = 1, AGE = 2, LATE = 3, F = FEATURES.length;
const N_TRAIN = 400, THRESHOLD = 0.5;
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
interface Order { x: number[]; y: number }
/**
 * Whether an invoice went unpaid. A large amount is risky for a new customer and matters little for an established one.
 * Account age in months moves with past orders and carries no signal of its own.
 */
const ORDERS_ALL: Order[] = (() => {
  const R = rng(8), gauss = () => Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R());
  return Array.from({ length: 600 }, () => {
    const amount = Math.round((200 + R() ** 1.4 * 8800) / 100) * 100, orders = Math.floor(R() ** 1.8 * 16);
    const age = Math.max(0, Math.round(2 + orders * 3 + gauss() * 3)), late = R() < 0.15 ? 1 + Math.floor(R() * 2) : 0;
    const z = -3.0 + 0.0007 * amount * (orders < 3 ? 1 : 0.2) - 0.12 * orders + 1.3 * late;
    return { x: [amount, orders, age, late], y: R() < sigmoid(z) ? 1 : 0 };
  });
})();
const TRAIN = ORDERS_ALL.slice(0, N_TRAIN), HELD = ORDERS_ALL.slice(N_TRAIN);
/** Order 4480: a new customer with a large basket. */
const X = [6400, 1, 3, 0];

/* ---------- the boosted model ---------- */

interface Tree { v?: number; f?: number; t?: number; l?: Tree; r?: Tree }
const TREES = 120, RATE = 0.1, DEPTH = 2, MIN_LEAF = 20;
/** One small regression tree fitted to the gradient g of the log loss, with Newton leaf values from the curvature h. */
function grow(idx: number[], g: number[], h: number[], depth: number): Tree {
  const sg = idx.reduce((s, i) => s + g[i], 0), sh = idx.reduce((s, i) => s + h[i], 0), n = idx.length;
  const leaf = { v: sg / (sh + 1) };
  if (depth === 0 || n < 2 * MIN_LEAF) return leaf;
  let best: { gain: number; f: number; t: number } | undefined;
  for (let f = 0; f < F; f++) {
    const s = [...idx].sort((a, b) => TRAIN[a].x[f] - TRAIN[b].x[f]);
    let lg = 0, lh = 0;
    for (let i = 0; i < n - 1; i++) {
      lg += g[s[i]]; lh += h[s[i]];
      if (TRAIN[s[i]].x[f] === TRAIN[s[i + 1]].x[f] || i + 1 < MIN_LEAF || n - i - 1 < MIN_LEAF) continue;
      const gain = lg * lg / (lh + 1) + (sg - lg) ** 2 / (sh - lh + 1);
      if (!best || gain > best.gain) best = { gain, f, t: (TRAIN[s[i]].x[f] + TRAIN[s[i + 1]].x[f]) / 2 };
    }
  }
  if (!best || best.gain <= sg * sg / (sh + 1) + 1e-9) return leaf;
  const { f, t } = best;
  return { f, t, l: grow(idx.filter((i) => TRAIN[i].x[f] <= t), g, h, depth - 1), r: grow(idx.filter((i) => TRAIN[i].x[f] > t), g, h, depth - 1) };
}
const leafOf = (tree: Tree, x: number[]): number => { let t = tree; while (t.f !== undefined) t = x[t.f] <= t.t! ? t.l! : t.r!; return t.v!; };
/** Gradient boosting on the log loss: each tree is fitted to what the trees before it still get wrong. */
const MODEL = (() => {
  const rate = TRAIN.reduce((s, o) => s + o.y, 0) / N_TRAIN, f0 = Math.log(rate / (1 - rate)), z = TRAIN.map(() => f0), all = TRAIN.map((_, i) => i), trees: Tree[] = [];
  for (let k = 0; k < TREES; k++) {
    const p = z.map(sigmoid), tree = grow(all, TRAIN.map((o, i) => o.y - p[i]), p.map((v) => v * (1 - v)), DEPTH);
    trees.push(tree);
    TRAIN.forEach((o, i) => { z[i] += RATE * leafOf(tree, o.x); });
  }
  return { f0, trees };
})();
/** The model's risk that the invoice goes unpaid. */
const risk = (x: number[]) => sigmoid(MODEL.trees.reduce((s, t) => s + RATE * leafOf(t, x), MODEL.f0));

/** Area under the ROC curve: the share of unpaid and paid pairs the scores put in the right order. */
function auc(scores: number[], set: Order[]): number {
  let wins = 0, pairs = 0;
  set.forEach((a, i) => { if (a.y) set.forEach((b, j) => { if (!b.y) { pairs++; wins += scores[i] > scores[j] ? 1 : scores[i] === scores[j] ? 0.5 : 0; } }); });
  return wins / pairs;
}
const AUC = auc(HELD.map((o) => risk(o.x)), HELD);

/* ---------- the explanations ---------- */

/** Permutation importance on the held-back orders: the mean fall in AUC over 10 shuffles of the named columns. */
function permutation(cols: number[]): number {
  const R = rng(5);
  let s = 0;
  for (let k = 0; k < 10; k++) { const from = shuffle(HELD.map((_, i) => i), R); s += AUC - auc(HELD.map((o, i) => risk(o.x.map((v, f) => (cols.includes(f) ? HELD[from[i]].x[f] : v)))), HELD); }
  return s / 10;
}
const PERM = FEATURES.map((_, f) => permutation([f])), PERM_TENURE = permutation([ORDERS, AGE]);
const RANKING = FEATURES.map((_, f) => f).sort((a, b) => PERM[b] - PERM[a]), TOP = RANKING[0];

/** Shapley values of one prediction, exact over all 16 coalitions. A feature outside the coalition takes its value from each of 100 training orders in turn. */
const BACKGROUND = TRAIN.slice(0, 100);
const VALUE = Array.from({ length: 1 << F }, (_, mask) => BACKGROUND.reduce((s, b) => s + risk(X.map((v, f) => (mask >> f & 1 ? v : b.x[f]))), 0) / BACKGROUND.length);
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const SHAP = FEATURES.map((_, f) => VALUE.reduce((s, v, mask) => {
  if (mask >> f & 1) return s;
  const size = [0, 1, 2, 3].filter((g) => mask >> g & 1).length;
  return s + fact(size) * fact(F - size - 1) / fact(F) * (VALUE[mask | 1 << f] - v);
}, 0));
const BASE = VALUE[0], RISK = risk(X);
/** Running totals from the average risk to this order's risk, one feature at a time. */
const LEVEL = SHAP.reduce((acc, v, i) => [...acc, acc[i] + v], [BASE]);

/** Risk as amount varies and the other features stay as they are: one line per order, and their average over the held-back orders. */
const GRID = Array.from({ length: 45 }, (_, i) => 200 + i * 200);
const along = (x: number[]) => GRID.map((a) => [a / 1000, risk([a, x[1], x[2], x[3]])] as [number, number]);
const ICE = along(X);
const PD = GRID.map((a) => [a / 1000, HELD.reduce((s, o) => s + risk([a, o.x[1], o.x[2], o.x[3]]), 0) / HELD.length] as [number, number]);
const OTHERS = [...HELD.filter((o) => o.x[ORDERS] < 3).slice(0, 3), ...HELD.filter((o) => o.x[ORDERS] >= 3).slice(0, 5)].map((o) => along(o.x));

/** Counterfactuals: the nearest value of one feature, the rest unchanged, at which the risk falls below the threshold. */
const FLIP_AMOUNT = (() => { for (let a = X[AMOUNT]; a >= 200; a -= 100) if (risk([a, X[1], X[2], X[3]]) < THRESHOLD) return a; return undefined; })();
const FLIP_ORDERS = (() => { for (let n = X[ORDERS] + 1; n <= 15; n++) if (risk([X[0], n, X[2], X[3]]) < THRESHOLD) return n; return undefined; })();
const FLIP_AGE = (() => { for (let n = X[AGE] + 1; n <= 60; n++) if (risk([X[0], X[1], n, X[3]]) < THRESHOLD) return n; return undefined; })();

/** The interpretable challenger: logistic regression on the same four features, fitted by gradient descent on standardised columns. */
const LOGIT = (() => {
  const mean = FEATURES.map((_, f) => TRAIN.reduce((s, o) => s + o.x[f], 0) / N_TRAIN), sd = FEATURES.map((_, f) => Math.sqrt(TRAIN.reduce((s, o) => s + (o.x[f] - mean[f]) ** 2, 0) / N_TRAIN));
  const S = TRAIN.map((o) => o.x.map((v, f) => (v - mean[f]) / sd[f])), w = Array<number>(F).fill(0);
  let b = 0;
  for (let it = 0; it < 3000; it++) {
    const e = S.map((r, i) => sigmoid(r.reduce((s, v, f) => s + w[f] * v, b)) - TRAIN[i].y);
    b -= 0.5 * e.reduce((s, v) => s + v, 0) / N_TRAIN;
    for (let f = 0; f < F; f++) w[f] -= 0.5 * e.reduce((s, v, i) => s + v * S[i][f], 0) / N_TRAIN;
  }
  const weights = w.map((v, f) => v / sd[f]);
  return { bias: b - weights.reduce((s, v, f) => s + v * mean[f], 0), weights };
})();
const zOf = (x: number[]) => x.reduce((s, v, f) => s + LOGIT.weights[f] * v, LOGIT.bias);
const Z = zOf(X), RISK_LOGIT = sigmoid(Z), AUC_LOGIT = auc(HELD.map((o) => zOf(o.x)), HELD);

const n2 = (v: number) => v.toFixed(2), n1 = (v: number) => v.toFixed(1);
const signed = (v: number, f = n2) => (v < 0 ? "−" : "+") + f(Math.abs(v));
const kr = (v: number) => `${v.toLocaleString("en-GB")} kr`;
const VALUES = [kr(X[AMOUNT]), String(X[ORDERS]), `${X[AGE]} months`, String(X[LATE])];
const RIVALS = [...(FLIP_ORDERS === undefined ? [] : [`${FLIP_ORDERS} past orders`]), ...(FLIP_AGE === undefined ? [] : [`an account ${FLIP_AGE} months old`])];
const verdict = (p: number) => (p >= THRESHOLD ? "refused" : "accepted");

/* ---------- the boards ---------- */

const W = 430, H = 310;
const card = (id: string, title: string, cols: string[], at: number[], rows: Parameters<typeof table>[5], extra: Record<string, unknown> = {}) =>
  raise(table(id, 0, 0, W, cols, rows, { at, rowH: 44, title, group: id, ...extra }), F1, 30);
const CASE_AT = [16, 170, 300];

/** Held-back orders in order of risk, each marked paid or unpaid. */
const RANKED = HELD.map((o) => ({ y: o.y, p: risk(o.x) })).sort((a, b) => a.p - b.p);
const RANK_X = RANKED.filter((o) => o.p < RISK).length + 0.5;
const SCORES = raise(plot("scores", 0, 0, W, H, [-4, 206], [0, 1], { title: "Risk for 200 held-back orders", xt: [1, 50, 100, 150, 200], yt: [0, 0.25, 0.5, 0.75, 1], xLabel: "orders, by risk", yLabel: "risk of non-payment", group: "scores" }), F2, 30);
const IMP_MAX = Math.max(0.05, Math.ceil(Math.max(...PERM) * 20) / 20);
const IMP = raise(plot("imp", 0, 0, W, H, [0.4, 4.6], [0, IMP_MAX], { title: "Fall in AUC when one column is shuffled", xt: [1, 2, 3, 4], xtl: FEATURES, yt: [0, IMP_MAX / 2, IMP_MAX], yLabel: "fall in AUC", group: "imp" }), F2, 30);
const PATH = raise(plot("path", 0, 0, W, H, [-0.6, 4.6], [0, 1], { title: "Order 4480, average risk to its own", xt: [0, 1, 2, 3, 4], xtl: ["average", "amount", "orders", "age", "late"], yt: [0, 0.25, 0.5, 0.75, 1], yLabel: "risk of non-payment", group: "path" }), F2, 30);
const AMT = raise(plot("amt", 0, 0, W, H, [0, 9.2], [-0.13, 1.04], { title: "Risk as the amount changes", xt: [0, 2, 4, 6, 8], yt: [0, 0.25, 0.5, 0.75, 1], xLabel: "order amount, thousand kr", yLabel: "risk of non-payment", group: "amt" }), F2, 30);
const BOTH = raise(plot("both", 0, 0, W, H, [0.3, 2.7], [0, 1], { title: "AUC on 200 held-back orders", xt: [1, 2], xtl: ["boosted trees", "logistic regression"], yt: [0, 0.5, 1], yLabel: "AUC", group: "both" }), F2, 30);

/** The path as a staircase: a level per feature, joined by the move that feature makes. */
const STAIRS = LEVEL.flatMap((v, i) => [[i - 0.38, v], [i + 0.38, v]] as [number, number][]);
const flipAt = FLIP_AMOUNT ?? 200, iceAt = (a: number) => risk([a, X[1], X[2], X[3]]);

const DESK: [number, number] = [7.9, 7.9];
const ASK: [number, number][] = [F1, G.p(6.9, 7.8)];

export default defineGuide({
  id: "interpretability", track: "ml", module: "Selection and trust", slug: "interpretability",
  title: "Interpretability",
  summary: "An explanation attributes a model's predictions to its features. Permutation importance and partial dependence describe the whole model, SHAP values and counterfactuals describe one decision, and each of them misleads in a known way.",
  forLeads: "A person refused by an automated decision can ask for the reasons, and the law expects an answer they can understand. Decide who checks an explanation method against its known limits before its output reaches a customer or a regulator.",
  status: "draft", minutes: 8,
  counters: ["Model", "Method", "Explains", "Order 4480"],
  whatIf: { label: "What if the customer got the ranking?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts and risks are illustrative",
    label: "Two boards. The left one lists the four features of order 4480, which a boosted model refused pay by invoice at a risk above 0.50. At first the column of reasons is empty. The right board shows the fall in score when each column of held-back orders is shuffled, with amount ranked first. Then it shows a staircase from the average risk to this order's risk, one move per feature, and the left board fills in those moves. Next a line shows this order's risk falling as its amount is lowered until it crosses the threshold. The lines of other orders and their average are added: the average stays low while this order's line climbs. Last, a logistic regression lists its weights as the reasons, beside the score of each model.",
    els: [
      /* order 4480, as each method reads it */
      card("case", "Order 4480, pay by invoice", ["feature", "value", "adds"], CASE_AT, [
        ...FEATURES.map((f, i) => [f, VALUES[i], "?"]),
        { cells: ["risk", n2(RISK), verdict(RISK)], hot: true },
      ], { rowH: 46, foot: `${TREES} trees, refused at ${n2(THRESHOLD)} or above` }),
      card("mix", "Held-back orders, amount shuffled", ["amount", "past orders", "age", "late"], [16, 130, 260, 345], (() => {
        const from = shuffle(HELD.map((_, i) => i), rng(5));
        return [0, 1, 2, 3, 4, 5].map((i) => [kr(HELD[from[i]].x[AMOUNT]), String(HELD[i].x[ORDERS]), String(HELD[i].x[AGE]), String(HELD[i].x[LATE])]);
      })(), { rowH: 38, columnHues: ["sand", undefined, undefined, undefined], foot: `AUC ${n2(AUC)} falls to ${n2(AUC - PERM[AMOUNT])}` }),
      card("shap", "Order 4480, SHAP values", ["feature", "value", "adds"], CASE_AT, [
        ["average risk", "", n2(BASE)],
        ...FEATURES.map((f, i) => ({ cells: [f, VALUES[i], signed(SHAP[i])], hue: i === AMOUNT ? "track" as const : undefined })),
        { cells: ["risk", "", n2(RISK)], hot: true },
      ], { rowH: 40 }),
      card("flip", "Order 4480, what would change it", ["feature", "now", "accepted at"], CASE_AT, [
        { cells: ["amount", VALUES[AMOUNT], FLIP_AMOUNT === undefined ? "no value" : kr(FLIP_AMOUNT)], hot: true },
        { cells: ["past orders", VALUES[ORDERS], FLIP_ORDERS === undefined ? "no value" : String(FLIP_ORDERS)], mute: FLIP_ORDERS === undefined },
        { cells: ["account age", VALUES[AGE], FLIP_AGE === undefined ? "no value" : `${FLIP_AGE} months`], mute: FLIP_AGE === undefined },
        { cells: ["late payments", VALUES[LATE], "no value"], mute: true },
      ], { rowH: 50, foot: "one feature changed, the rest held" }),
      card("limits", "Known ways of misleading", ["method", "misleads when"], [16, 196], [
        ["permutation importance", "features move together"],
        ["SHAP", "read as cause and effect"],
        { cells: ["partial dependence", "orders differ from the average"], hue: "rose" },
        ["counterfactual", "several changes would flip it"],
      ], { rowH: 50 }),
      card("logit", "Order 4480, logistic regression", ["feature", "value", "adds to log odds"], CASE_AT, [
        ["bias", "", signed(LOGIT.bias)],
        ...FEATURES.map((f, i) => [f, VALUES[i], signed(LOGIT.weights[i] * X[i])]),
        { cells: ["risk", n2(RISK_LOGIT), verdict(RISK_LOGIT)], hot: true },
      ], { rowH: 40 }),

      /* stop 1: the model sorts orders well and says nothing more */
      SCORES,
      rule("s-rule", "scores", THRESHOLD, { axis: "y", w: 3, group: "scores" }),
      note("s-name", ...plotPoint(SCORES, 8, THRESHOLD + 0.045), `refused at ${n2(THRESHOLD)} or above`, { strong: true, tone: "track", on: "scores", group: "scores" }),
      series("s-paid", "scores", "points", RANKED.flatMap((o, i) => (o.y ? [] : [[i + 1, o.p] as [number, number]])), { hue: "sky", r: 3.5, group: "scores" }),
      series("s-unpaid", "scores", "points", RANKED.flatMap((o, i) => (o.y ? [[i + 1, o.p] as [number, number]] : [])), { hue: "sand", r: 3.5, group: "scores" }),
      series("s-k1", "scores", "points", [[14, 0.8]], { hue: "sky", r: 5, tone: "muted", label: "paid", group: "scores" }),
      series("s-k2", "scores", "points", [[14, 0.71]], { hue: "sand", r: 5, tone: "muted", label: "went unpaid", group: "scores" }),
      series("s-4480", "scores", "points", [[RANK_X, RISK]], { r: 8, hot: [0], label: "4480", group: "scores" }),

      /* stop 2: the whole model */
      IMP,
      series("drops", "imp", "bars", PERM.map((v, f) => [f + 1, Math.max(0, v)] as [number, number]), { hot: [TOP], group: "imp" }),
      ...PERM.map((v, f) => note(`drop${f}`, ...plotPoint(IMP, f + 1, Math.max(0, v) + IMP_MAX * 0.045), n2(v), { anchor: "middle", strong: true, tone: f === TOP ? "track" : "ink", on: "imp", group: "imp" })),

      /* stop 3: one prediction */
      PATH,
      rule("p-rule", "path", THRESHOLD, { axis: "y", label: "threshold", w: 2.5, group: "path" }),
      series("stairs", "path", "line", STAIRS, { w: 4.5, group: "path" }),
      ...LEVEL.map((v, i) => stop(`lv${i}`, ...plotPoint(PATH, i, v), undefined, undefined, { group: "anchor" })),
      note("mv-base", ...plotPoint(PATH, 0, 0.05), n2(BASE), { anchor: "middle", strong: true, on: "path", group: "path" }),
      ...SHAP.map((v, i) => note(`mv${i}`, ...plotPoint(PATH, i + 1, 0.05), signed(v), { anchor: "middle", strong: true, tone: i === AMOUNT ? "track" : "ink", on: "path", group: "path" })),

      /* stops 4 and 5: this order's line, then every order's line and the average */
      AMT,
      rule("a-rule", "amt", THRESHOLD, { axis: "y", label: "threshold", w: 2.5, group: "amt" }),
      ...OTHERS.map((pts, i) => series(`o${i}`, "amt", "line", pts, { tone: "muted", w: 1.5, group: "others" })),
      series("pd", "amt", "line", PD, { tone: "ink", w: 4, group: "others" }),
      note("pd-name", ...plotPoint(AMT, 8.95, PD[PD.length - 1][1] - 0.075), "average of 200", { anchor: "end", strong: true, on: "amt", group: "others" }),
      series("ice", "amt", "line", ICE, { w: 4.5, group: "amt" }),
      note("ice-name", ...plotPoint(AMT, 8.95, ICE[ICE.length - 1][1] - 0.14), "order 4480", { anchor: "end", strong: true, tone: "track", on: "amt", group: "amt" }),
      stop("now", ...plotPoint(AMT, X[AMOUNT] / 1000, RISK), undefined, undefined, { group: "anchor" }),
      stop("flipped", ...plotPoint(AMT, flipAt / 1000, iceAt(flipAt)), undefined, undefined, { group: "anchor" }),
      series("drop-line", "amt", "line", [[flipAt / 1000, -0.13], [flipAt / 1000, iceAt(flipAt)]], { tone: "muted", w: 2, dashed: true, group: "flip-mark" }),

      /* stop 6: the two models side by side */
      BOTH,
      series("aucs", "both", "bars", [[1, AUC], [2, AUC_LOGIT]], { hues: ["sky", "track"], group: "both" }),
      note("auc1", ...plotPoint(BOTH, 1, AUC + 0.04), n2(AUC), { anchor: "middle", strong: true, on: "both", group: "both" }),
      note("auc2", ...plotPoint(BOTH, 2, AUC_LOGIT + 0.04), n2(AUC_LOGIT), { anchor: "middle", strong: true, tone: "track", on: "both", group: "both" }),

      /* who is asking */
      line("ask", ASK, { group: "ask" }),
      line("ask-x", ASK, { tone: "alert", group: "ask-x" }),
      pawn("c-why", ...DESK, "Customer", "why refused?", { group: "c-why" }),
      pawn("c", ...DESK, "Customer", undefined, { group: "c" }),
      pawn("c-do", ...DESK, "Customer", "what would change it?", { group: "c-do" }),
      pawn("fin", ...DESK, "Finance", "what does it rely on?", { hue: "violet", group: "fin" }),
      pawn("fin-x", ...DESK, "Finance", "does amount matter?", { hue: "violet", group: "fin-x" }),
    ],
  },
  steps: [
    step({
      id: "refused", label: "No reasons", kind: "problem", title: "A boosted model gives no reasons",
      caption: `Finance refuses pay by invoice when the model's risk reaches ${n2(THRESHOLD)}. Order 4480 scores ${n2(RISK)}. The model is ${TREES} small trees, and no row says why.`,
      show: ["case", "scores", "ask-x", "c-why"], counters: [`${TREES} trees`, "none", "nothing", `${verdict(RISK)}, ${n2(RISK)}`],
      rides: [ride("ask-x", 0.85, 0.4, "why refused?", { then: "no reasons", tone: "alert" })],
      body: [`Finance offers pay by invoice on web orders. A gradient boosted model of ${TREES} trees, each two splits deep, scores the risk that the invoice goes unpaid from four features. It was trained on ${N_TRAIN} past orders, and on ${HELD.length} held-back orders its AUC is ${n2(AUC)}.`,
        "In a linear model the rows of the weighted sum are the explanation. A boosted model has no such rows. Lundberg and Lee describe the tension: the highest accuracy for large modern datasets is often achieved by complex models that even experts struggle to interpret, such as ensemble or deep learning models.",
        "The customer is entitled to ask. The GDPR gives a person the right not to be subject to a decision based solely on automated processing that produces legal effects or similarly significantly affects them, and its recital 71 gives the automatic refusal of an online credit application as an example."],
      claims: ["interpretability-tension", "interpretability-gdpr-22", "interpretability-recital-71"],
    }),
    step({
      id: "global", label: "Whole model", kind: "idea", title: "Permutation importance ranks features for the whole model",
      caption: `Shuffle one column of held-back orders and score the model again. The further the score falls, the more the model relies on that feature. Here ${FEATURES[RANKING[0]]} and ${FEATURES[RANKING[1]]} lead.`,
      show: ["mix", "imp", "ask", "fin"], counters: [`${TREES} trees`, "permutation importance", "the whole model", `${verdict(RISK)}, ${n2(RISK)}`],
      body: ["Permutation feature importance measures the contribution of each feature to a fitted model's statistical performance on a given tabular dataset. It randomly shuffles the values of a single feature and observes the resulting degradation of the model's score. Breaking the relationship between the feature and the target shows how much the model relies on that feature.",
        "Computed on a held-out set, it highlights which features contribute the most to the generalisation power of the model. In scikit-learn the function is permutation_importance.",
        { callout: { label: "What changed", text: `Shuffling amount cuts the AUC from ${n2(AUC)} to ${n2(AUC - PERM[AMOUNT])}. Shuffling past orders costs ${n2(PERM[ORDERS])}, account age ${n2(PERM[AGE])} and late payments ${n2(PERM[LATE])}. Each figure is the mean of 10 shuffles.` } },
        "The score describes one model. Permutation importance does not reflect the intrinsic predictive value of a feature, and features of low importance for a bad model could be very important for a good one, so the model's predictive power is evaluated on held-out data first.",
        "A ranking is a global explanation. It says what the model relies on across all orders and nothing about why order 4480 was refused."],
      claims: ["interpretability-permutation", "interpretability-held-out", "interpretability-particular-model"],
    }),
    step({
      id: "local", label: "One order", kind: "mechanism", title: "SHAP splits one prediction among its features",
      caption: `Start from the average risk, ${n2(BASE)}. Each feature of order 4480 moves it up or down, and the moves add up to ${n2(RISK)} exactly. Amount adds ${n2(SHAP[AMOUNT])}.`,
      show: ["shap", "path", "ask", "c"], counters: [`${TREES} trees`, "SHAP", "one order", `${verdict(RISK)}, ${n2(RISK)}`],
      rides: [ride("stairs", "lv0", "lv4", `average ${n2(BASE)}`, { via: ["lv1", "lv2", "lv3"], then: `risk ${n2(RISK)}` })],
      body: ["SHAP assigns each feature an importance value for a particular prediction. SHAP values attribute to each feature the change in the expected model prediction when conditioning on that feature. They explain how to get from the base value, which would be predicted if no features were known, to the current output.",
        "Lundberg and Lee show that SHAP values are the unique additive feature importance measure with three properties: local accuracy, missingness and consistency. Local accuracy requires the explanation to match the output of the model for the input being explained, which is why the rows add up.",
        { callout: { label: "What changed", text: `Average risk ${n2(BASE)}. Amount ${signed(SHAP[AMOUNT])}, past orders ${signed(SHAP[ORDERS])}, account age ${signed(SHAP[AGE])}, late payments ${signed(SHAP[LATE])}. Sum ${n2(RISK)}. The values are computed exactly over all 16 combinations of the four features, with 100 training orders as the background.` } },
        "The shap library draws this as a waterfall plot. SHAP values of all the input features always sum to the difference between the baseline, expected model output and the output for the prediction being explained. Its bar plot takes the mean absolute value of each feature over all rows, which turns local values into a global ranking."],
      claims: ["interpretability-shap", "interpretability-shap-unique", "interpretability-shap-sum"],
    }),
    step({
      id: "counterfactual", label: "Counterfactual", kind: "mechanism", title: "A counterfactual states the change that flips the decision",
      caption: `Hold the other features and lower the amount. At ${kr(flipAt)} the risk falls below ${n2(THRESHOLD)} and the order is accepted. The customer can act on that, or contest it.`,
      show: ["flip", "amt", "flip-mark", "ask", "c-do"], counters: [`${TREES} trees`, "counterfactual", "one order", `accepted at ${kr(flipAt)}`],
      rides: [ride("ice", "now", "flipped", `${kr(X[AMOUNT])}: refused`, { then: `${kr(flipAt)}: accepted` })],
      body: ["Wachter, Mittelstadt and Russell give the form: you were denied a loan because your annual income was £30,000, and if your income had been £45,000 you would have been offered a loan. A counterfactual describes the smallest change to the world that can be made to obtain a desirable outcome.",
        "They propose three aims for an explanation: to help the person understand why a decision was reached, to provide grounds to contest an adverse decision, and to show what could be changed to receive a desired result in future. None of the three depends on explaining the internal logic of the system.",
        "The line is the individual conditional expectation of order 4480: the model's prediction for this one order as amount varies and its other features stay fixed.",
        "The Court of Justice of the European Union observed in 2025 that, for profiling such as credit scoring, it could be sufficiently transparent and intelligible to inform the person of the extent to which a variation in the personal data taken into account would have led to a different result."],
      claims: ["interpretability-counterfactual", "interpretability-aims", "interpretability-ice", "interpretability-variation"],
    }),
    step({
      id: "limits", label: "Limits", kind: "watch-out", title: "Each method misleads in a known way",
      caption: "Partial dependence averages every order's line. The average stays under the threshold, although amount decided order 4480. Correlated features, causal readings and rival counterfactuals distort the other three.",
      show: ["limits", "amt", "others", "ask-x", "fin-x"], counters: [`${TREES} trees`, "partial dependence", "the whole model", `${verdict(RISK)}, ${n2(RISK)}`],
      rides: [ride("pd", 0, 0.5, "average", { then: `under ${n2(THRESHOLD)}`, tone: "alert" })],
      body: ["A partial dependence plot shows the dependence between the target response and a feature, marginalising over the values of all other features. It is the average of the individual conditional expectation lines. It shows the average effect well, and it can obscure a heterogeneous relationship created by interactions.",
        { callout: { label: "What changed", text: `Across the whole range of amount the average risk moves from ${n2(PD[0][1])} to ${n2(PD[PD.length - 1][1])}. The line of order 4480, a customer with one past order, moves from ${n2(ICE[0][1])} to ${n2(ICE[ICE.length - 1][1])}.` } },
        "Partial dependence and individual conditional expectation both assume that the feature of interest is independent of the others. The assumption is often violated in practice, and with correlated features the method creates absurd data points, such as an account three months old with fifteen past orders.",
        `Permutation importance has the same weakness. When two features are correlated and one is permuted, the model still has access to it through the other, so both report a lower importance though they might be important. Here past orders costs ${n2(PERM[ORDERS])} and account age ${n2(PERM[AGE])} when shuffled alone, and ${n2(PERM_TENURE)} when shuffled together. scikit-learn suggests clustering correlated features and keeping one from each cluster.`,
        "SHAP estimation methods may assume feature independence to simplify the computation. The shap documentation warns that making correlations transparent does not make them causal. Slack and co-authors show that explanation techniques relying on input perturbations, such as LIME and SHAP, are not reliable: a scaffolded classifier can keep its bias while its explanations look innocuous.",
        `Multiple counterfactuals are possible, and the smallest change is not always the most helpful one: relevance depends on factors such as whether the variable can be changed. ${RIVALS.length ? `Here order 4480 would also be accepted with ${RIVALS.join(" or ")}, which the customer cannot produce today.` : "Here no other single change would flip the decision."}`],
      claims: ["interpretability-partial-dependence", "interpretability-ice", "interpretability-independence", "interpretability-correlated", "interpretability-shap-assumption", "interpretability-not-causal", "interpretability-fooled", "interpretability-several"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Two ways to meet the duty to explain",
      caption: "",
      show: ["logit", "both", "ask", "c"], counters: ["logistic regression", "its own weights", "one order", `${verdict(RISK_LOGIT)}, ${n2(RISK_LOGIT)}`],
      rides: [ride("ask", 0.4, 0.78, "reasons", { then: "can contest" })],
      body: [{ pair: {
        left: { label: "Explain the boosted model", items: ["Attributions approximate the model", "Check each against its limits"] },
        right: { label: "Use an interpretable model", items: ["Its weights are the reasons", "Often as accurate on tabular data"] },
      } },
        "Rudin separates the two. Explainable machine learning creates a second, post hoc model to explain a black box, and such an explanation cannot have perfect fidelity: if it were completely faithful to what the original model computes, it would equal the original model. Inherently interpretable models provide their own explanations, which are faithful to what the model actually computes.",
        `She calls the trade-off between accuracy and interpretability a myth. For structured data with meaningful features there is often no significant difference in performance between more complex classifiers and much simpler ones after preprocessing. Here the boosted trees reach an AUC of ${n2(AUC)} and logistic regression ${n2(AUC_LOGIT)} on the same held-back orders, and the simpler model gives order 4480 a risk of ${n2(RISK_LOGIT)}.`,
        "Under Articles 13, 14 and 15 of the GDPR the person is entitled to meaningful information about the logic involved in such a decision. The Court of Justice reads this as a right to an explanation of the procedure and principles actually applied, in a concise, transparent, intelligible and easily accessible form. Communicating a complex mathematical formula, such as an algorithm, does not satisfy it.",
        "Where a solely automated decision rests on a contract or on consent, the controller must at least provide the right to obtain human intervention, to express a point of view and to contest the decision.",
        "Article 86 of the EU AI Act gives a person affected by a decision based on the output of a listed high-risk system the right to obtain clear and meaningful explanations of the role of the system in the decision-making procedure and the main elements of the decision. Systems that evaluate the creditworthiness of natural persons are on that list. The regulation was amended in July 2026: Article 86 is unchanged, and the requirements for the listed high-risk systems apply from 2 December 2027."],
      claims: ["interpretability-post-hoc", "interpretability-myth", "interpretability-logic", "interpretability-court", "interpretability-gdpr-22", "interpretability-ai-act-86", "interpretability-ai-act-dates"],
    }),
  ],
  governance: { text: "Under the GDPR a person subject to a solely automated decision with legal or similarly significant effects is entitled to meaningful information about the logic involved, which the Court of Justice of the European Union reads as a right to an explanation of the procedure and principles actually applied. Article 86 of the EU AI Act adds a right to clear and meaningful explanations of decisions based on the output of listed high-risk systems.", claims: ["interpretability-gdpr-22", "interpretability-logic", "interpretability-court", "interpretability-ai-act-86"] },
  closing: {
    pitfalls: [
      "Answering one customer's question with a global importance ranking.",
      "Reading a SHAP value or a partial dependence curve as cause and effect.",
      "Trusting an importance score for one of two correlated features.",
    ],
    questions: [
      "Which methods describe the whole model, and which describe one decision?",
      "What do the SHAP values of one prediction add up to?",
      "Why can the average curve stay flat while one order's line crosses the threshold?",
    ],
  },
});
