import { CANVAS, code, defineGuide, isoGrid, line, note, pill, raise, ride, step, stop } from "@signal-path/engine";
import type { TreeEl } from "@signal-path/engine";

// The floor: three lanes, one per order, on a return-rate scale from 0 to 1. Each lane carries its actual
// rate as a ring and its prediction as a record. The stretch still to cover is red, and its size stands at the lane end.
const G = isoGrid(330, 128, 30);
const L = 11, GY = { A: 0, B: 3.8, C: 7.6 } as const;
type K = keyof typeof GY;
const at = (k: K, v: number) => G.p(L * v, GY[k]);
const lane = (k: K, actual: number) => [
  line(`l${k}`, [at(k, 0), at(k, 1)], { always: true }),
  stop(`s${k}`, ...at(k, 0), `Order ${k}`, undefined, { at: "nw", always: true }),
  stop(`t${k}`, ...at(k, actual), `actual ${actual.toFixed(2)}`, undefined, { at: "sw", big: true, mono: true, always: true }),
];
/** The residual: the lane between prediction and actual turns red, and its size stands at the lane end. */
const gap = (group: string, k: K, from: number, to: number, text: string) => [
  ...(from === to ? [] : [line(`${group}-${k}`, [at(k, from), at(k, to)], { tone: "alert", group })]),
  pill(`${group}-${k}l`, [at(k, 1)[0] + 24, at(k, 1)[1] - (k === "A" ? 22 : 15)], text, { tone: from === to ? "ink" : "alert", mono: true, anchor: "start", group, ...(k === "A" ? { sub: "residual" } : {}) }),
];
const tree = (id: string, floor: [number, number], title: string, leaves: [string, string]): TreeEl =>
  raise({ kind: "tree", id, x: 0, y: 0, w: 144, h: 118, title, leaves, group: id }, floor, 26);
const R = (k: K, from: number, to: number, a: string, b?: string) => ride(`l${k}`, from, to, a, b ? { then: b } : {});
const TICKS = [0, 0.25, 0.5, 0.75, 1];

export default defineGuide({
  id: "gradient-boosting", track: "ml", module: "Model families", slug: "gradient-boosting",
  title: "Gradient boosting",
  summary: "A boosted model is a sum of small trees. Each new tree is fitted to what the trees before it still get wrong.",
  forLeads: "Boosted trees remain the workhorse for tabular prediction. Their accuracy comes from many small corrections, and so does their appetite for tuning.",
  status: "draft", minutes: 7,
  counters: ["Trees", "Mean absolute error", "Learning rate"],
  whatIf: { label: "What if it stopped at the mean?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Return rates are illustrative",
    label: "Three orders sit on a return-rate scale from 0 to 1, each with its actual rate marked. The prediction for each order starts at the mean and moves toward its actual rate as half of each new tree's correction is added.",
    els: [
      ...TICKS.map((v, i) => line(`g${i}`, [G.p(L * v, -2.5), G.p(L * v, 8.4)], { tone: "muted", w: 1.5, always: true })),
      ...TICKS.map((v, i) => note(`ax${i}`, G.p(L * v, -2.5)[0] + 6, G.p(L * v, -2.5)[1] - 8, String(v), { mono: true, tone: "muted", always: true })),
      note("ax-l", G.p(L, -2.5)[0] + 44, G.p(L, -2.5)[1] - 8, "return rate", { tone: "muted", always: true }),
      ...lane("A", 0.9), ...lane("B", 0.1), ...lane("C", 0.5),
      ...gap("r0", "A", 0.5, 0.9, "+0.40"), ...gap("r0", "B", 0.1, 0.5, "-0.40"), ...gap("r0", "C", 0.5, 0.5, "0.00"),
      ...gap("r1", "A", 0.7, 0.9, "+0.20"), ...gap("r1", "B", 0.1, 0.4, "-0.30"), ...gap("r1", "C", 0.4, 0.5, "+0.10"),
      ...gap("r2", "A", 0.775, 0.9, "+0.13"), ...gap("r2", "B", 0.1, 0.25, "-0.15"), ...gap("r2", "C", 0.475, 0.5, "+0.03"),
      tree("t1", [872, 204], "Tree 1", ["A", "B, C"]),
      tree("t2", [872, 396], "Tree 2", ["B", "A, C"]),
      raise(code("sum", 0, 0, 344, ["prediction = mean + \u00bd tree 1 + \u00bd tree 2"], { keywords: ["mean", "tree"], group: "sum" }), [740, 512], 24),
      pill("noise", [24, 456], "enough trees reach every actual value exactly, noise included", { tone: "alert", anchor: "start", group: "noise" }),
    ],
  },
  steps: [
    step({
      id: "blunt", label: "Baseline", kind: "problem", title: "The mean as a baseline",
      caption: "Vinterhus wants the return rate for three order types. The simplest model predicts the mean, 0.50, for all of them. It is right for C and badly wrong for A and B.",
      show: ["r0"], counters: ["0", "0.27", "not set"],
      rides: [R("A", 0, 0.5, "0.50"), R("B", 0, 0.5, "0.50"), R("C", 0, 0.5, "0.50")],
      body: ["Vinterhus wants the return rate for three order types. The simplest model predicts the mean, 0.50, for all of them. It is right for C and badly wrong for A and B.",
        "A single shallow tree would do better, but not by enough."],
      claims: ["boosted-trees-default"],
    }),
    step({
      id: "wrong", label: "Residuals", kind: "idea", title: "Fit the next tree to the residuals",
      caption: "Boosting trains a small tree on the errors of the current prediction: +0.40, -0.40 and 0.00. For squared error, the gradient it follows is the residual.",
      show: ["r0", "t1"], counters: ["1", "0.27", "not set"],
      rides: [R("A", 0.5, 0.5, "0.50"), R("B", 0.5, 0.5, "0.50"), R("C", 0.5, 0.5, "0.50")],
      body: ["Boosting does not train a second model on the original target. It trains a small tree on the errors of the current prediction: +0.40, -0.40 and 0.00.",
        { callout: { label: "Key idea", text: "Each tree has one job: correct the model so far. For squared error, the gradient it follows is the residual." } }],
      claims: ["boosting-greedy-gradient"],
    }),
    step({
      id: "half", label: "Shrinkage", kind: "mechanism", title: "Add a fraction of the correction",
      caption: "Tree 1 gives +0.40 for A and -0.20 for B and C. Only half is added: A moves to 0.70, B and C to 0.40. That half is the learning rate.",
      show: ["r1", "t1"], counters: ["1", "0.20", "0.5"],
      rides: [R("A", 0.5, 0.7, "0.50", "0.70"), R("B", 0.5, 0.4, "0.50", "0.40"), R("C", 0.5, 0.4, "0.50", "0.40")],
      body: ["Tree 1 separates A from B and C, with +0.40 for A and -0.20 for the other two. Only half of that is added, so A moves to 0.70 and B and C to 0.40.",
        "The fraction is the learning rate. Scaling each tree down limits its influence and leaves room for the trees that follow."],
      claims: ["boosting-shrinkage", "boosting-additive"],
    }),
    step({
      id: "repeat", label: "Repeat", kind: "mechanism", title: "Repeat on what is left",
      caption: "The errors are now +0.20, -0.30 and +0.10. Tree 2 separates B from A and C, and half its output is added. Mean absolute error falls from 0.27 to 0.20 to 0.10.",
      show: ["r2", "t1", "t2", "sum"], counters: ["2", "0.10", "0.5"],
      rides: [R("A", 0.7, 0.775, "0.70", "0.78"), R("B", 0.4, 0.25, "0.40", "0.25"), R("C", 0.4, 0.475, "0.40", "0.48")],
      body: ["The errors are now +0.20, -0.30 and +0.10. Tree 2 separates B from A and C, and half of its output is added. The mean absolute error has gone from 0.27 to 0.20 to 0.10.",
        { callout: { label: "What changed", text: "The prediction is a sum: the mean, plus half of tree 1, plus half of tree 2." } }],
      claims: ["boosting-additive", "boosting-greedy-gradient"],
    }),
    step({
      id: "noise", label: "Overfitting", kind: "watch-out", title: "More trees fit the noise",
      caption: "Nothing in the loop says stop. Given enough trees it reproduces the training table exactly, noise included. Shrinkage slows this, and giving each tree a subset of columns helps prevent it.",
      show: ["r2", "t1", "t2", "sum", "noise"], counters: ["2", "0.10", "0.5"],
      rides: [R("A", 0.775, 0.775, "0.78"), R("B", 0.25, 0.25, "0.25"), R("C", 0.475, 0.475, "0.48")],
      body: ["Nothing in the loop tells it to stop. Given enough trees it reproduces the training table exactly, noise included. Shrinkage slows this down, and giving each tree only a subset of the columns helps prevent it.",
        "The number of trees, their depth and the learning rate are choices, and tuning them is where the effort goes."],
      claims: ["boosting-shrinkage", "boosting-subsampling"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "When to use boosted trees",
      caption: "",
      show: ["r2", "t1", "t2", "sum"], counters: ["2", "0.10", "0.5"],
      rides: [R("A", 0.775, 0.775, "0.78"), R("B", 0.25, 0.25, "0.25"), R("C", 0.475, 0.475, "0.48")],
      body: [{ pair: {
        left: { label: "Boosted trees", items: ["Tables of any size", "Fast prediction on ordinary hardware", "A team that can run tuning"] },
        right: { label: "Consider instead", items: ["A tabular foundation model on smaller tables", "An ensemble across model types when accuracy pays"] },
      } },
        "TabArena's 2025 launch results placed boosted trees among the strong contenders on practical datasets and foundation models strongest on smaller ones."],
      claims: ["tabarena-trees-and-foundation-models", "boosted-trees-default"],
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
