import { CANVAS, defineGuide, isoGrid, line, node, note, pawn, pill, plot, prism, raise, ride, series, step, stop, table } from "@signal-path/engine";
import type { El, Pt } from "@signal-path/engine";

// A board on the left and a tree on the right. The board is the training data: past refund requests by days since
// delivery and amount, coloured by outcome. Each split draws a line on the board and grows a node on the tree.
// A request is a record that walks down the tree, and the path it takes is the rule a reviewer reads.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8);

/** Past refund requests: days since delivery and amount. CART with Gini on these 21 points gives the splits drawn below. */
const APPROVED: [number, number][] = [[4, 150], [7, 260], [10, 360], [14, 200], [18, 120], [24, 280], [26, 170], [28, 230], [40, 60], [44, 45], [48, 58], [53, 48], [57, 60]];
const REFUSED: [number, number][] = [[22, 360], [32, 240], [35, 330], [38, 150], [45, 280], [50, 100], [54, 220], [58, 340]];

const REQ = raise(plot("req", 0, 0, 430, 280, [0, 60], [0, 400], { title: "Refund requests", xt: [0, 15, 30, 45, 60], yt: [0, 80, 160, 240, 320, 400], xLabel: "days since delivery", yLabel: "amount", always: true }), F1, 30);

/* ---------- the tree ---------- */

const T = {
  root: [712, 56], l: [592, 150], r: [832, 150],
  ll: [532, 262], lr: [652, 262], rl: [772, 262], rr: [892, 262],
  lrl: [592, 366], lrr: [712, 366],
} satisfies Record<string, Pt>;
type Extra = Record<string, unknown>;
const cond = (id: string, at: Pt, text: string, extra: Extra = {}): El => node(id, at[0], at[1], text, { shape: "box", mono: true, ...extra });
const leaf = (id: string, at: Pt, outcome: "approve" | "refuse", share: string, extra: Extra = {}): El =>
  node(id, at[0], at[1], outcome, { shape: "box", mono: true, sub: share, hue: outcome === "approve" ? "sky" : "sand", ...extra });
/** The branch from a node to one of its children, with the answer that leads down it. */
const branch = (id: string, from: Pt, to: Pt, extra: Extra = {}, answer = true): El[] => {
  const a: Pt = [from[0], from[1] + 15], b: Pt = [to[0], to[1] - 15], yes = to[0] < from[0], f = from === T.root ? 0.35 : 0.25;
  const mid: Pt = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  return [
    line(id, [a, b], { tone: "ink", w: 3, ...extra }),
    ...(answer ? [note(`${id}-a`, mid[0] + (yes ? -9 : 9), Math.round(mid[1] + 4), yes ? "yes" : "no", { tone: "muted", anchor: yes ? "end" : "start", group: extra.group as string })] : []),
  ];
};
/** A route that follows the branches exactly: out of the first node, then behind each node after it. The short steps keep the corners sharp. */
const route = (...via: Pt[]): Pt[] => via.flatMap((p, i) => (i === 0 ? [[p[0], p[1] + 15] as Pt] : [[p[0], p[1] - 15], [p[0], p[1] - 14], [p[0], p[1] + 14], [p[0], p[1] + 15]] as Pt[]));
/** Where a record rests on the branch into a leaf: just above the leaf. */
const above = (from: Pt, to: Pt): Pt => { const y = to[1] - 44, t = (y - from[1] - 15) / (to[1] - 30 - from[1]); return [Math.round(from[0] + (to[0] - from[0]) * t), y]; };

const SUPPORT: [number, number] = [12.43, 4.1];

export default defineGuide({
  id: "decision-trees", track: "ml", module: "Model families", slug: "decision-trees",
  title: "Decision trees",
  summary: "A decision tree splits the training data one feature at a time until each group holds similar outcomes. A prediction follows one path of conditions from the root to a leaf, and that path reads as a rule.",
  forLeads: "A small tree is a model people can read, which makes single decisions reviewable. Depth and leaf size are the settings that keep it small and stop it memorising individual cases.",
  status: "draft", minutes: 7,
  counters: ["Depth", "Leaves", "Gini impurity", "Smallest leaf"],
  whatIf: { label: "What if the tree had no limits?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Requests are illustrative",
    label: "A chart of 21 past refund requests by days since delivery and amount, coloured by whether Support approved or refused them. Beside it a decision tree grows one condition at a time: days up to 30, then amount up to 80. Each condition draws a straight line across the chart. Order 4471 walks from the root through two conditions to a leaf that says refuse. An unlimited tree adds two more conditions to isolate one odd refusal, and limits on depth and leaf size cut that branch back.",
    els: [
      REQ,
      series("approved", "req", "points", APPROVED, { hue: "sky", r: 6, tone: "muted", label: "approved", labelAt: 1, always: true }),
      series("refused", "req", "points", REFUSED, { hue: "sand", r: 6, tone: "muted", label: "refused", labelAt: 4, always: true }),
      series("mark", "req", "points", [[41, 180]], { r: 7, hot: [0], label: "4471", always: true }),
      series("cx", "req", "line", [[0, 180], [41, 180]], { tone: "muted", w: 2, dashed: true, group: "ask" }),
      series("cy", "req", "line", [[41, 0], [41, 180]], { tone: "muted", w: 2, dashed: true, group: "ask" }),

      series("days", "req", "line", [[0, 0], [60, 0]], { w: 4, group: "days" }),
      series("s1", "req", "line", [[30, 0], [30, 400]], { w: 4, group: "s1" }),
      series("s2", "req", "line", [[30, 80], [60, 80]], { w: 4, group: "s2" }),
      series("o1", "req", "line", [[0, 320], [30, 320]], { tone: "alert", w: 3, group: "over" }),
      series("o2", "req", "line", [[16, 320], [16, 400]], { tone: "alert", w: 3, group: "over" }),
      series("mark2", "req", "points", [[26, 342]], { r: 7, hot: [0], tone: "alert", group: "over" }),

      raise(table("ask", 0, 0, 300, ["field", "value"], [["order", "4471"], ["days since delivery", "41"], ["amount", "180"], ["decision", "?"]], { at: [16, 216], rowH: 36, title: "Next refund request", group: "ask" }), [712, 357], 30),

      note("tree-title", 486, 37, "Decision tree", { strong: true, size: 15, group: "tree" }),
      cond("n", T.root, "days ≤ 30", { group: "tree" }),
      ...branch("b-l", T.root, T.l, { group: "d1" }), ...branch("b-r", T.root, T.r, { group: "d1" }),
      leaf("n-l", T.l, "approve", "8 of 9", { group: "lleaf" }),
      leaf("n-r", T.r, "refuse", "7 of 12", { group: "rleaf" }),

      cond("c-r", T.r, "amount ≤ 80", { group: "d2" }),
      ...branch("b-rl", T.r, T.rl, { group: "d2" }), ...branch("b-rr", T.r, T.rr, { group: "d2" }),
      leaf("n-rl", T.rl, "approve", "5 of 5", { group: "d2" }),
      leaf("n-rr", T.rr, "refuse", "7 of 7", { group: "d2" }),

      cond("c-l", T.l, "amount ≤ 320", { tone: "alert", group: "deep" }),
      ...branch("b-ll", T.l, T.ll, { tone: "alert", group: "deep" }), ...branch("b-lr", T.l, T.lr, { tone: "alert", group: "deep" }),
      leaf("n-ll", T.ll, "approve", "7 of 7", { group: "deep" }),
      cond("c-lr", T.lr, "days ≤ 16", { tone: "alert", group: "deep" }),
      ...branch("b-lrl", T.lr, T.lrl, { tone: "alert", group: "deep" }), ...branch("b-lrr", T.lr, T.lrr, { tone: "alert", group: "deep" }),
      leaf("n-lrl", T.lrl, "approve", "1 of 1", { tone: "alert", group: "deep" }),
      leaf("n-lrr", T.lrr, "refuse", "1 of 1", { tone: "alert", group: "deep" }),
      pill("one", [766, 350], "built on 1 request", { tone: "alert", anchor: "start", group: "deep" }),

      ...branch("g-ll", T.l, T.ll, { state: "closed", group: "cut" }, false), ...branch("g-lr", T.l, T.lr, { state: "closed", group: "cut" }, false),
      ...branch("g-lrl", T.lr, T.lrl, { state: "closed", group: "cut" }, false), ...branch("g-lrr", T.lr, T.lrr, { state: "closed", group: "cut" }, false),
      leaf("g-n-ll", T.ll, "approve", "7 of 7", { mute: true, hue: undefined, group: "cut" }),
      cond("g-c-lr", T.lr, "days ≤ 16", { mute: true, group: "cut" }),
      leaf("g-n-lrl", T.lrl, "approve", "1 of 1", { mute: true, hue: undefined, group: "cut" }),
      leaf("g-n-lrr", T.lrr, "refuse", "1 of 1", { mute: true, hue: undefined, group: "cut" }),
      pill("min-leaf", [592, 191], "min_samples_leaf = 5", { tone: "track", mono: true, group: "cut" }),
      pill("max-depth", [652, 296], "max_depth = 2", { tone: "track", mono: true, group: "cut" }),

      line("walk", [...route(T.root, T.r), above(T.r, T.rr)], { w: 5, group: "walk" }),
      cond("h-n", T.root, "days ≤ 30", { hot: true, on: "n", group: "walk" }),
      cond("h-r", T.r, "amount ≤ 80", { hot: true, on: "c-r", group: "walk" }),
      line("stray", [...route(T.root, T.l, T.lr), above(T.lr, T.lrr)], { tone: "alert", w: 5, group: "stray" }),
      stop("at-r", ...T.r, undefined, undefined, { group: "anchor" }),
      stop("at-l", ...T.l, undefined, undefined, { group: "anchor" }),
      stop("at-lr", ...T.lr, undefined, undefined, { group: "anchor" }),

      line("feed", [F1, G.p(7.1, 7.8)], { group: "cart" }),
      prism("cart", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "split", title: "CART", sub: "best split, then repeat", at: "e", group: "cart" }),
      pawn("sup-ask", ...SUPPORT, "Support", "approve or refuse?", { group: "sup-ask" }),
      pawn("sup", ...SUPPORT, "Support", undefined, { group: "sup" }),
      pawn("sup-read", ...SUPPORT, "Support", "over 30 days and over 80", { group: "sup-read" }),
    ],
  },
  steps: [
    step({
      id: "by-hand", label: "By hand", kind: "problem", title: "Refund requests are decided by hand",
      caption: "Support has approved or refused 21 refund requests. Order 4471 is next: 41 days after delivery, amount 180. No written rule says which outcome it gets.",
      show: ["ask", "sup-ask"], counters: ["0", "1", "0.47", "21 requests"],
      rides: [ride("cx", 0, 1, "")],
      body: ["The 21 requests are the training data. Each has two features, the days since delivery and the amount, and the outcome Support recorded.",
        "A decision tree is a supervised learning method for classification and regression. Its goal is a model that predicts a target value by learning simple decision rules inferred from the data features."],
      claims: ["decision-trees-rules"],
    }),
    step({
      id: "split", label: "One split", kind: "idea", title: "A split asks one question of one feature",
      caption: "CART tries every feature and threshold and keeps the split that leaves the two groups least mixed. Here it is days ≤ 30: one group is mostly approved.",
      show: ["days", "s1", "tree", "d1", "lleaf", "rleaf", "cart", "sup"], counters: ["1", "2", "0.36", "9 requests"],
      rides: [ride("days", 0, 0.5, "days ≤ 30", { via: [16 / 60, 23 / 60] })],
      body: ["Each non-leaf node of a tree holds a condition and each leaf holds a prediction. The most common condition compares a single feature with a threshold, so on the chart a split is a straight line across one axis.",
        "CART builds binary trees from the feature and threshold that yield the largest information gain at each node, and scikit-learn uses an optimised version of it. Its default splitter searches all features and all thresholds, the midpoints between sorted distinct values.",
        { callout: { label: "Key idea", text: "A candidate split is scored by the impurity of the two groups it makes, weighted by their size. Gini impurity falls here from 0.47 to 0.36." } }],
      claims: ["decision-trees-nodes", "decision-trees-one-feature", "decision-trees-cart", "decision-trees-search", "decision-trees-impurity"],
    }),
    step({
      id: "again", label: "Split again", kind: "mechanism", title: "Each group is split again",
      caption: "The same search runs inside each group. The late requests divide on amount ≤ 80 into two pure groups. A group that is not split becomes a leaf and predicts its most common outcome.",
      show: ["s1", "s2", "tree", "d1", "lleaf", "d2", "cart", "sup"], counters: ["2", "3", "0.08", "5 requests"],
      rides: [ride("s1", 0, 0.2, "amount ≤ 80")],
      body: ["Training is a greedy divide and conquer: select the best condition, then repeat recursively and independently on both child nodes. When no satisfying condition is found, the node becomes a leaf.",
        "The result is a recursive partition of the feature space that groups samples with the same labels together. In scikit-learn a leaf's class probability is the fraction of its training samples in that class, and the prediction is the class with the highest probability.",
        { callout: { label: "What changed", text: "Only the early group is still mixed, with 8 approved and 1 refused. Weighted over the three leaves, Gini impurity is 0.08." } }],
      claims: ["decision-trees-recursive", "decision-trees-partition", "decision-trees-leaf"],
    }),
    step({
      id: "follow", label: "Follow rules", kind: "mechanism", title: "A prediction is a path of rules",
      caption: "Order 4471 starts at the root and answers each condition. No to days ≤ 30, no to amount ≤ 80: refuse. A reviewer can read the same path.",
      show: ["s1", "s2", "tree", "d1", "lleaf", "d2", "walk", "cart", "sup-read"], counters: ["2", "3", "0.08", "5 requests"],
      rides: [ride("walk", 0, 1, "4471", { via: ["at-r"], shape: "pill" })],
      body: ["Inference routes an example from the root to a leaf according to the conditions. The value of the leaf is the prediction, and the visited nodes are the inference path.",
        "This makes a tree a white box model: the explanation for a prediction is boolean logic. scikit-learn's export_text prints the rules of a fitted tree as text, and decision_path returns the path of each sample.",
        "Article 86 of the EU AI Act covers decisions taken on the basis of the output of a high-risk AI system listed in Annex III, with one exception, that have legal or similarly significant effects which the person considers adverse to their health, safety or fundamental rights. That person has the right to obtain from the deployer clear and meaningful explanations of the role of the AI system in the decision-making procedure and the main elements of the decision taken."],
      claims: ["decision-trees-path", "decision-trees-white-box", "decision-trees-export", "decision-trees-explanation"],
    }),
    step({
      id: "overgrown", label: "Overgrown", kind: "watch-out", title: "An unlimited tree fits single requests",
      caption: "Left alone, the tree splits until every leaf is pure. One odd refusal gets its own leaf, and order 4472 is refused because of it. This is overfitting.",
      show: ["s1", "s2", "over", "tree", "d1", "deep", "d2", "stray", "cart", "sup"], counters: ["3", "5", "0.00", "1 request"],
      rides: [ride("stray", 0, 1, "4472", { via: ["at-l", "at-lr"], shape: "pill", tone: "alert" })],
      body: ["scikit-learn sets no depth limit by default: nodes are expanded until all leaves are pure or hold fewer than min_samples_split samples, which gives fully grown and unpruned trees.",
        "Such a tree can classify separable training examples perfectly. If the data contains noise, it overfits and shows poor test accuracy. Here one refusal on day 22 has become a rule, and a Gini impurity of 0.00 on the training data hides the problem.",
        "Order 4472 arrives 26 days after delivery with an amount of 342. It lands in the corner the tree fenced off around that one refusal, so it is refused although every other request inside 30 days was approved."],
      claims: ["decision-trees-defaults", "decision-trees-overfit", "decision-trees-noise"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Two limits to set",
      caption: "",
      show: ["s1", "s2", "tree", "d1", "lleaf", "d2", "cut", "walk", "cart", "sup-read"], counters: ["2", "3", "0.08", "5 requests"],
      rides: [ride("walk", 0, 1, "4471", { via: ["at-r"], shape: "pill" })],
      body: [{ pair: {
        left: { label: "Maximum depth", items: ["Caps the distance from root to leaf", "Deeper trees give more complex rules"] },
        right: { label: "Minimum leaf size", items: ["Every leaf rests on several examples", "Too small overfits, too large stops learning"] },
      } },
        "The tree here was grown with max_depth = 2 and min_samples_leaf = 5. The leaf minimum rejects the split of the nine early requests, because every way of dividing nine leaves fewer than five on one side. The depth limit would stop that branch one level later in any case.",
        "scikit-learn's practical tips suggest max_depth = 3 as an initial depth and min_samples_leaf = 5 as an initial value. A tree can also be pruned after training: a branch is removed when that improves quality on a validation dataset.",
        "Trees can be unstable. Small variations in the data might produce a completely different tree, a problem that is mitigated by using trees within an ensemble."],
      claims: ["decision-trees-max-depth", "decision-trees-min-leaf", "decision-trees-depth-fit", "decision-trees-start", "decision-trees-pruning", "decision-trees-unstable"],
    }),
  ],
  governance: { text: "A tree is a white box model: the conditions on one inference path explain one decision in boolean logic, so a reviewer can check a contested refusal rule by rule. The EU AI Act states that people assigned to oversee a high-risk AI system are to be enabled, as appropriate and proportionate, to interpret its output correctly and to override or reverse it.", claims: ["decision-trees-white-box", "decision-trees-path", "decision-trees-oversight"] },
  closing: {
    pitfalls: [
      "Shipping the fully grown tree that the default settings produce.",
      "Reading a rule as policy when its leaf rests on one or two examples.",
      "Treating the tree's structure as stable when a few changed examples can rearrange it.",
    ],
    questions: [
      "What does CART compare when it chooses a split?",
      "How does a tree arrive at the prediction for a new example?",
      "Which two limits stop a tree from growing a leaf for a single example?",
    ],
  },
});
