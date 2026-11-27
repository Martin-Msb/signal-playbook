import { blocks, CANVAS, defineGuide, isoGrid, line, list, pill, plot, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// The floor: 36 past orders drawn as blocks, earliest at the top left and latest at the bottom right.
// The blocks stand in six chunks of six. Each stop recolours the chunks: which rows the model learns from,
// which rows tune it and which rows judge it. The model is a record on the rail beside the rows.
// It fits on the training rows and rides to the rows that score it. The chart keeps the score for each set.
const G = isoGrid(336, 98, 30);
const SIZE = 1.2, GAP = 0.2, PITCH = 3.0, RAIL = 6.9;
type Role = "train" | "val" | "test" | "fold";
const LOOK: Record<Role, { hue: Hue; h: number }> = { train: { hue: "track", h: 14 }, val: { hue: "sky", h: 30 }, test: { hue: "sand", h: 30 }, fold: { hue: "track", h: 14 } };
interface Chunk { role: Role; title?: string; glyph?: string; alert?: number[]; tone?: "alert"; at?: [number, number] }
/** One stop's layout: six chunks of six orders, each with a role. */
const layout = (group: string, chunks: Chunk[]): El[] => chunks.flatMap((c, i) => [
  blocks(`${group}-c${i}`, i * PITCH, 0, 2, SIZE, [0, 1, 2, 3, 4, 5].map((k) => ({ ...LOOK[c.role], state: c.alert?.includes(k) ? "alert" as const : undefined })), { gap: GAP, group }),
  ...(c.title ? [pill(`${group}-p${i}`, c.at ?? behind(i, LOOK[c.role].h), c.title, { glyph: c.glyph, tone: c.tone, anchor: c.at ? "middle" : i === 5 ? "end" : "middle", group })] : []),
]);
/** Where a chunk's name sits: on the open floor behind its back edge. */
const behind = (i: number, h: number): [number, number] => { const [x, y] = G.p(i * PITCH + 1.3, -1.5); return [i === 5 ? 952 : x, y - h - (i === 5 ? 38 : 26)]; };
const T: Chunk = { role: "train" };
/** Rail position beside the middle of chunk i. */
const beside = (i: number) => G.p(i * PITCH + 1.3, RAIL);

const BOARD: [number, number] = [812, 194];
const SETS = (group: string) => raise(plot(`sets-${group}`, 0, 0, 280, 144, [0.4, 3.6], [0, 1], { title: "Accuracy by set", xt: [1, 2, 3], xtl: ["training", "validation", "test"], yt: [0, 0.5, 1], group }), BOARD, 20);
const bar = (group: string, x: number, v: number, hue: Hue, tone?: "alert"): El =>
  series(`bar-${group}-${x}`, `sets-${group}`, "bars", [[x, v]], { hue: tone ? undefined : hue, tone, label: v.toFixed(2), group });
const FOLDS = [0.84, 0.8, 0.83, 0.79, 0.84];
const CARD: [number, number] = [190, 508];

export default defineGuide({
  id: "training-validation-and-test-sets", track: "ml", module: "Foundations", slug: "training-validation-and-test-sets",
  title: "Training, validation and test sets",
  summary: "A model is judged only on data it did not learn from. The training set fits it, the validation set tunes it and the test set gives the final score, and the way the rows are split decides whether that score can be trusted.",
  forLeads: "A score is only as good as the split behind it. Ask which rows the model was judged on, who could see them, and whether the same customer or a later date sits on both sides.",
  status: "draft", minutes: 7,
  counters: ["Training rows", "Validation rows", "Test rows", "Score"],
  whatIf: { label: "What if the model were scored on its training rows?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and scores are illustrative",
    label: "Thirty-six past orders stand as blocks on the floor in date order. A model rides a rail beside them and a chart records its score. First every block is training data and the score is near perfect. Then the latest six are held out as a test set and the score drops. A validation set takes over the tuning while the test set stays sealed. Cross-validation lets five folds take turns as the validation set. A customer with orders on both sides of the split leaks and inflates the test score. Splitting by date and by customer gives a score that can be trusted.",
    els: [
      prism("model", -2.3, RAIL - 0.6, 1.2, 1.2, 30, { hue: "track", glyph: "net", title: "Model", sub: "predicts returns", at: "n", always: true }),
      line("rail", [G.p(-1.1, RAIL), G.p(17.9, RAIL)], { always: true }),
      stop("s-model", ...G.p(-1.1, RAIL), undefined, undefined, { group: "anchor" }),
      ...[0, 1, 2, 3, 4, 5].map((i) => stop(`s${i}`, ...beside(i), undefined, undefined, { group: "anchor" })),

      ...layout("all", [T, { role: "train", title: "all 36 orders fit the model" }, T, T, T, T]),
      ...layout("hold", [T, { role: "train", title: "training set" }, T, T, T, { role: "test", title: "test set" }]),
      ...layout("three", [T, { role: "train", title: "training set" }, T, T, { role: "val", title: "validation set" }, { role: "test", title: "sealed test set", glyph: "lock" }]),
      ...layout("kfold", [
        { role: "fold", title: "fold 1" }, { role: "fold", title: "fold 2" }, { role: "val", title: "fold 3 validates" }, { role: "fold", title: "fold 4" }, { role: "fold", title: "fold 5" },
        { role: "test", title: "sealed test set", glyph: "lock", at: G.p(18.3, 3.6) }]),
      ...layout("leak", [T, { role: "train", title: "same customer, 2 orders", alert: [1, 4], tone: "alert" }, T, T, { role: "val", title: "validation set" }, { role: "test", title: "same customer, 1 order", alert: [2], tone: "alert" }]),
      ...layout("final", [T, { role: "train", title: "training set" }, T, T, { role: "val", title: "validation set" }, { role: "test", title: "test set, used once", glyph: "lock" }]),
      pill("t0", G.p(-1.6, -2.6), "earliest orders", { glyph: "clock", group: "final" }),
      pill("t1", G.p(18.3, 3.6), "latest orders", { glyph: "clock", group: "final" }),

      SETS("s1"), bar("s1", 1, 0.99, "track"),
      SETS("s2"), bar("s2", 1, 0.99, "track"), bar("s2", 3, 0.8, "sand"),
      SETS("s3"), bar("s3", 1, 0.93, "track"), bar("s3", 2, 0.84, "sky"),
      raise(plot("cv", 0, 0, 280, 144, [0.4, 5.6], [0, 1], { title: "Accuracy by fold", xt: [1, 2, 3, 4, 5], yt: [0, 0.5, 1], group: "kfold" }), BOARD, 20),
      series("cv-bars", "cv", "bars", FOLDS.map((v, i) => [i + 1, v] as [number, number]), { hue: "sky", group: "kfold" }),
      rule("cv-mean", "cv", 0.82, { axis: "y", label: "mean 0.82", group: "kfold" }),
      SETS("s5"), bar("s5", 1, 0.93, "track"), bar("s5", 2, 0.84, "sky"), bar("s5", 3, 0.93, "sand", "alert"),
      SETS("s6"), bar("s6", 1, 0.93, "track"), bar("s6", 2, 0.82, "sky"), bar("s6", 3, 0.79, "sand"),

      raise(table("orders", 0, 0, 280, ["order", "amount", "returned"], [["4468", "129", "no"], ["4469", "349", "yes"], ["4470", "899", "no"]], { at: [14, 104, 190], rowH: 26, title: "Past orders", sub: "one block each, label known", mono: true, group: "orders" }), CARD, 22),
      raise(list("tune", 0, 0, 280, [{ t: "depth 2    0.78" }, { t: "depth 4    0.84", hot: true }, { t: "depth 8    0.81" }], { title: "Settings tried", sub: "scored on the validation set", mono: true, group: "tune" }), CARD, 22),
      raise(list("tune-cv", 0, 0, 280, [{ t: "depth 2    0.77" }, { t: "depth 4    0.82", hot: true }, { t: "depth 8    0.80" }], { title: "Settings tried", sub: "mean of five folds", mono: true, group: "kfold" }), CARD, 22),
      raise(table("leaked", 0, 0, 280, ["order", "customer", "set"], [{ cells: ["4470", "a.k@…", "training"], hue: "rose" }, { cells: ["4481", "a.k@…", "training"], hue: "rose" }, { cells: ["4502", "a.k@…", "test"], hue: "rose" }], { at: [14, 84, 170], rowH: 26, title: "One customer, both sides", mono: true, tone: "alert", group: "leak" }), CARD, 22),
      raise(list("rules", 0, 0, 280, [{ t: "By time: test on the latest orders" }, { t: "By group: one customer, one side" }, { t: "Fit preprocessing on training only" }], { title: "Split rules", group: "final" }), CARD, 22),
    ],
  },
  steps: [
    step({
      id: "seen", label: "Seen rows", kind: "problem", title: "A score on seen rows proves nothing",
      caption: "Vinterhus fits a model on 36 past orders to predict returns, then scores it on the same orders. A model that repeats labels it has seen scores near perfect.",
      show: ["all", "s1", "orders"], counters: ["36", "0", "0", "0.99 on seen rows"],
      rides: [ride("rail", "s-model", "s2", "fit", { then: "score 0.99" })],
      body: ["Learning the parameters of a prediction function and testing it on the same data is a methodological mistake. A model that just repeats the labels of the samples it has seen has a perfect score and fails to predict anything useful on unseen data.",
        "That situation is called overfitting. The score of 0.99 says how well the model remembers these 36 orders, and nothing about the next order."],
      claims: ["training-validation-and-test-sets-same-data"],
    }),
    step({
      id: "holdout", label: "Hold out", kind: "idea", title: "Hold out rows the model never sees",
      caption: "Six orders are set aside as a test set before fitting. The model learns from the other 30 and is scored on the six. The score drops to what new orders would get.",
      show: ["hold", "s2", "orders"], counters: ["30", "0", "6", "0.80 on test"],
      rides: [ride("rail", "s-model", "s5", "fit on 30", { via: ["s2"], then: "test 0.80" })],
      body: ["It is common practice in a supervised machine learning experiment to hold out part of the available data as a test set. A model is tested against a different set of examples than those used to train it.",
        "In scikit-learn, train_test_split splits arrays into random train and test subsets.",
        { callout: { label: "Key idea", text: "The score on held-out rows, not the score on training rows, estimates how the model does on new orders." } }],
      claims: ["training-validation-and-test-sets-holdout", "training-validation-and-test-sets-different-examples", "training-validation-and-test-sets-random-split"],
    }),
    step({
      id: "validation", label: "Validation", kind: "mechanism", title: "A validation set takes the tuning",
      caption: "Settings tuned against the test set leak knowledge of it into the model. A third set, the validation set, scores each setting. The test set stays sealed for the final evaluation.",
      show: ["three", "s3", "tune"], counters: ["24", "6", "6", "0.84 on validation"],
      rides: [ride("rail", "s-model", "s4", "depth 4", { via: ["s1"], then: "val 0.84" })],
      body: ["When settings such as hyperparameters are evaluated on the test set, they can be tweaked until the estimator performs optimally. Knowledge about the test set leaks into the model and the metric no longer reports generalisation performance.",
        "With a validation set, training proceeds on the training set, evaluation is done on the validation set, and when the experiment seems successful the final evaluation is done on the test set."],
      claims: ["training-validation-and-test-sets-tuning-leak", "training-validation-and-test-sets-validation"],
    }),
    step({
      id: "kfold", label: "Folds", kind: "mechanism", title: "Folds take turns as the validation set",
      caption: "Three fixed sets leave few rows for learning. In k-fold cross-validation the remaining rows are split into k folds. Each fold validates a model trained on the others, and the scores are averaged.",
      show: ["kfold"], counters: ["24 per round", "6 per round", "6", "0.82 mean of 5"],
      rides: [ride("rail", "s0", "s4", "5 rounds", { via: ["s1", "s2", "s3"], then: "mean 0.82" })],
      body: ["Partitioning the data into three sets drastically reduces the number of samples that can be used for learning, and the results can depend on a particular random choice of the training and validation sets.",
        "In k-fold cross-validation a model is trained using k minus 1 of the folds and validated on the remaining fold, for each of the k folds. The reported measure is the average of the values computed in the loop. A test set is still held out for final evaluation.",
        "StratifiedKFold returns folds in which each set contains approximately the same percentage of samples of each target class as the complete set."],
      claims: ["training-validation-and-test-sets-three-sets-cost", "training-validation-and-test-sets-kfold", "training-validation-and-test-sets-stratified"],
    }),
    step({
      id: "leakage", label: "Leakage", kind: "watch-out", title: "Leakage inflates the score",
      caption: "A random split puts one customer's orders on both sides. The model recognises the customer in the test set, and the score reports that instead of skill on new customers.",
      show: ["leak", "s5"], counters: ["24", "6", "6", "0.93 leaked"],
      rides: [ride("rail", "s1", "s5", "knows a.k@…", { via: ["s3"], then: "test 0.93", tone: "alert" })],
      body: ["Data leakage occurs when information that would not be available at prediction time is used when building the model. It results in overly optimistic performance estimates and poorer performance on novel data.",
        "A common cause is not keeping the test and train subsets separate. Preprocessing leaks too: a transformation such as a normalisation must be learnt from the training data only, and fit is never called on the test data.",
        "Groups of dependent samples break the assumption that rows are independent, and rows that are close in time are correlated."],
      claims: ["training-validation-and-test-sets-leakage", "training-validation-and-test-sets-fit-train-only", "training-validation-and-test-sets-groups", "training-validation-and-test-sets-time"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The split decides what the score means",
      caption: "",
      show: ["final", "s6"], counters: ["24", "6", "6", "0.79 on test"],
      rides: [ride("rail", "s4", "s5", "final model", { then: "test 0.79" })],
      body: [{ pair: {
        left: { label: "Split to match use", items: ["Time-based: test on later rows", "Group: one customer, one side", "Random: independent rows only"] },
        right: { label: "Protect the test set", items: ["Split before preprocessing", "Keep it for the final evaluation"] },
      } },
        "GroupKFold ensures that the same group is not represented in both testing and training sets. TimeSeriesSplit trains on earlier folds and tests on the fold that follows, so the model is evaluated on future observations.",
        "Test and validation sets wear out with repeated use. The more the same data is used to make decisions about the model, the less confidence there is that it will predict well on new data."],
      claims: ["training-validation-and-test-sets-groups", "training-validation-and-test-sets-time", "training-validation-and-test-sets-split-first", "training-validation-and-test-sets-wear-out", "training-validation-and-test-sets-validation"],
    }),
  ],
  governance: { text: "Data leakage is a widespread problem that has led to severe reproducibility failures. Reusing a holdout set adaptively can overfit to it, so the reusable holdout method allows access to the set only through a differentially private algorithm.", claims: ["training-validation-and-test-sets-widespread", "training-validation-and-test-sets-holdout-reuse"] },
  closing: {
    pitfalls: [
      "Fitting a scaler or selecting features on all rows before splitting.",
      "Splitting at random when a customer has several rows or the rows are ordered in time.",
      "Returning to the test set after each change until the score looks right.",
    ],
    questions: [
      "Which set chooses the settings, and which gives the final score?",
      "Why does k-fold cross-validation still keep a test set apart?",
      "What would a time-based split of these orders look like?",
    ],
  },
});
