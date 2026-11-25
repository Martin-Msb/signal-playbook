import { CANVAS, defineGuide, isoGrid, line, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";
import type { MatrixEl } from "@signal-path/engine";

// The floor: the labelled table stands back left and the new orders back right, with the model between them
// at the front. Context rides in from the left, new rows and predictions use the two rails on the right.
// The tuning loop and the pretraining stack take the open floor in front of the model.
const G = isoGrid(200, 230, 30);
const NA = "not applicable";
const cols = ["basket", "channel", "days", "ret."], at = [12, 58, 116, 166];
const F1 = G.p(0.5, 0), F2 = G.p(9, -8);
const newRows = (last: [string, string, string], hot: boolean) => [
  { cells: ["640", "web", "9", last[0]], hot }, { cells: ["210", "app", "2", last[1]] }, { cells: ["980", "store", "15", last[2]] },
];
const attend: MatrixEl = { kind: "matrix", id: "attend", group: "attend", x: 472, y: 462, cell: [14, 9], gap: 3,
  values: [[0.9, 0.15, 0.2, 0.75, 0.1, 0.6], [0.1, 0.8, 0.7, 0.1, 0.55, 0.1], [0.45, 0.3, 0.35, 0.4, 0.3, 0.5]] };
/** The pretraining data: a stack of synthetic tables in front of the network. */
const stack = [0, 1, 2, 3, 4].map((i) => prism(`sh${i}`, 8.3, 5.1, 1.4, 1.4, 5, {
  hue: "sand", z: i * 7, group: "prior",
  ...(i === 4 ? { glyph: "table" } : {}),
  ...(i === 2 ? { title: "Synthetic tables", sub: "from causal graphs", at: "w" as const } : {}),
}));

export default defineGuide({
  id: "tabular-foundation-models", track: "ml", module: "Model families", slug: "tabular-foundation-models",
  title: "Tabular foundation models",
  summary: "A pretrained network reads your labelled rows as context and predicts new rows in one forward pass.",
  forLeads: "Inside the published ceilings, a tabular foundation model replaces the tuning campaign with a single call. The licence on the weights decides commercial use.",
  status: "draft", minutes: 8,
  counters: ["Fitting on your table", "Tuning runs", "Pretraining data", "Published row ceiling"],
  whatIf: { label: "What if a model were fitted to the table?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order values are illustrative",
    label: "A labelled orders table on the left, a model in the centre and new orders on the right. First boosted trees are fitted and tuned on the table. Then a network pretrained on synthetic tables takes the labelled table as context and predicts the new orders in one pass.",
    els: [
      slab("ctx-mat", -1.4, -1.6, 3.8, 3.2, undefined, { h: 4, group: "ctx" }),
      pill("ctx-l", [50, 284], "Context", { tone: "track", glyph: "layers", anchor: "start", group: "ctx" }),
      pill("size", [50, 322], "context size sets cost", { tone: "track", anchor: "start", group: "size" }),
      raise(table("orders", 0, 0, 214, cols, [["899", "web", "12", "yes"], ["349", "store", "3", "no"], ["1290", "app", "30", "no"], ["129", "web", "7", "yes"], ["450", "store", "21", "no"]], { at, rowH: 26, title: "Labelled orders", sub: "4,000 rows", always: true }), F1, 26),
      raise(table("new-q", 0, 0, 232, cols, newRows(["?", "?", "?"], false), { at, rowH: 26, title: "New orders", group: "q" }), F2, 26),
      raise(table("new-p", 0, 0, 232, cols, newRows(["0.82", "0.07", "0.41"], true), { at: [12, 64, 128, 170], rowH: 26, title: "New orders", group: "pred" }), F2, 26),

      line("fit", [F1, G.p(8, 0)], { tone: "ink", group: "classic" }),
      prism("trees", 8, -1, 2, 2, 46, { hue: "mint", glyph: "tree", title: "Boosted trees", sub: "fitted to this table", at: "n", group: "classic" }),
      line("tune", [G.p(10, 0.5), G.p(12.5, 0.5), G.p(12.5, 3.5), G.p(9, 3.5), G.p(9, 1)], { group: "classic" }),
      pill("tune-l", [470, 486], "tune, refit, validate", { tone: "track", group: "classic" }),

      line("ctx", [F1, G.p(8, 0)], { group: "ctx" }),
      prism("pfn", 8, -1, 2, 2, 46, { hue: "sky", glyph: "lock", title: "Pretrained network", sub: "weights frozen", at: "se", group: "pfn" }),
      ...stack,
      line("pre", [G.p(9, 5.1), G.p(9, 1)], { group: "prior" }),
      pill("pre-l", [330, 352], "pretrain once", { tone: "track", anchor: "end", group: "prior" }),
      line("nr", [G.p(8.5, -7), G.p(8.5, -1)], { group: "ctx" }),
      stop("s-nr", ...G.p(8.5, -7), undefined, undefined, { group: "ctx" }),
      line("out", [G.p(9.5, -1), G.p(9.5, -7)], { group: "out" }),
      stop("s-out", ...G.p(9.5, -7), undefined, undefined, { group: "out" }),
      attend,
      pill("attend-l", [460, 502], "new rows attend to labelled rows", { anchor: "start", group: "attend" }),
    ],
  },
  steps: [
    step({
      id: "ask", label: "Question", kind: "problem", title: "4,000 labelled orders, one question",
      caption: "Vinterhus wants to know which new orders are likely to come back. The standard route fits a model to this table, tunes it across many runs and validates each one.",
      show: ["classic", "out", "pred"], counters: ["required", "many", NA, NA],
      rides: [ride("fit", 0, 0.5, "fit"), ride("tune", 0, 0.5, "tuning run")],
      body: ["Vinterhus wants to know which new orders are likely to come back. The standard route fits a model to this table, tunes it across many runs and validates each one.",
        "All of the learning happens here, on this table, every time."],
      claims: ["boosted-trees-default"],
    }),
    step({
      id: "learn-once", label: "Pretraining", kind: "idea", title: "Pretraining happens once, on synthetic data",
      caption: "A prior-data fitted network is pretrained only on synthetic tables, each sampled from a prior over structural causal models. The weights hold a procedure for learning from a table, nothing about yours.",
      show: ["pfn", "prior", "q"], counters: ["required", "many", "synthetic only", NA],
      rides: [ride("pre", 0, 0.5, "task")],
      body: ["A prior-data fitted network is pretrained on synthetic tables only. Each table is sampled from a prior over structural causal models, and the task never changes: given labelled rows, predict the held-out rows.",
        { callout: { label: "Key idea", text: "The weights hold a procedure for learning from a table. They hold nothing about your table." } }],
      claims: ["tabpfn-synthetic-pretraining"],
    }),
    step({
      id: "context", label: "Context", kind: "mechanism", title: "The table becomes the context",
      caption: "At prediction time the labelled rows and the new rows enter the network together. Nothing is fitted and the weights stay frozen. The tuning loop is gone.",
      show: ["pfn", "prior", "ctx", "q"], counters: ["none", "0 by default", "synthetic only", "see step 5"],
      rides: [ride("ctx", 0, 0.5, "4,000 rows"), ride("nr", 0, 0.5, "new rows")],
      body: ["At prediction time the labelled rows and the new rows enter the network together. Nothing is fitted and the weights stay frozen.",
        { callout: { label: "What changed", text: "The arrow that meant fit now means context. The tuning loop is gone." } }],
      claims: ["pfn-in-context-forward-pass"],
    }),
    step({
      id: "one-pass", label: "Forward pass", kind: "mechanism", title: "One forward pass",
      caption: "Inside the network each new row attends to the labelled rows. The output is a probability per new row, an approximation of the Bayesian posterior predictive under the pretraining prior.",
      show: ["pfn", "prior", "ctx", "attend", "out", "pred"], counters: ["none", "0 by default", "synthetic only", "see step 5"],
      rides: [ride("out", 0, 0.5, "0.82")],
      body: ["Inside the network each new row attends to the labelled rows. The output is a probability per new row, an approximation of the Bayesian posterior predictive under the pretraining prior."],
      claims: ["pfn-in-context-forward-pass", "pfn-posterior-predictive"],
    }),
    step({
      id: "ceilings", label: "Ceilings", kind: "watch-out", title: "Table size sets cost and limits",
      caption: "Cost and memory follow the size of the table, and every release publishes a ceiling. Caching the labelled rows' representation cuts the cost of repeat predictions. Version 4 is an unreleased vendor preview.",
      show: ["pfn", "ctx", "attend", "out", "pred", "size"], counters: ["none", "0 by default", "synthetic only", "1,000,000 (v3.5)"],
      rides: [ride("ctx", 0, 0.5, "4,000 rows")],
      body: [
        { p: "Cost and memory follow the size of the table, and every release publishes a ceiling. Caching the representation of the labelled rows cuts the cost of repeat predictions." },
        { bars: {
          caption: "Training rows by release, log scale from 1,000 to 10,000,000.",
          scale: "log", min: 1_000, max: 10_000_000,
          rows: [
            { label: "v2", claim: "tabpfn-ceiling-v2" },
            { label: "2.5", claim: "tabpfn-ceiling-v2-5" },
            { label: "3", claim: "tabpfn-ceiling-v3" },
            { label: "3.5", claim: "tabpfn-ceiling-v3-5" },
            { label: "4", claim: "tabpfn-4-preview" },
          ],
        } },
        { p: "Version 4 is a vendor preview and is not released. Weights from 2.5 onward carry a non-commercial licence." },
      ],
      claims: ["tabpfn-context-cache", "tabpfn-weights-licence"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "When to use it",
      caption: "",
      show: ["pfn", "ctx", "attend", "out", "pred"], counters: ["none", "0 by default", "synthetic only", "1,000,000 (v3.5)"],
      rides: [ride("out", 0, 0.5, "0.82")],
      body: [
        { pair: {
          left: { label: "Reach for it", items: ["Tables inside the published ceiling", "A strong default baseline", "No time to tune"] },
          right: { label: "Think twice", items: ["Commercial use without a weights licence", "Tight latency or memory on modest hardware", "Only vendor tables as evidence"] },
        } },
        { p: "TabArena's 2025 launch results placed boosted trees among the strong contenders on practical datasets and foundation models strongest on smaller ones." },
      ],
      claims: ["tabarena-trees-and-foundation-models", "tabular-fm-hardware-cost", "tabpfn-weights-licence"],
    }),
  ],
  governance: { text: "Model weights from TabPFN-2.5 onward are released under non-commercial licences, so commercial use needs its own licence.", claims: ["tabpfn-weights-licence"] },
  closing: {
    pitfalls: [
      "Reading a vendor leaderboard as an independent result.",
      "Sending a table larger than the checkpoint's published ceiling.",
      "Shipping the open weights in a commercial product without a licence.",
    ],
    questions: [
      "Where does the learning happen in a prior-data fitted network?",
      "Why does the size of the labelled table drive cost at prediction time?",
      "Which checks decide between a tabular foundation model and boosted trees for a given table?",
    ],
  },
});
