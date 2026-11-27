import { band, CANVAS, defineGuide, isoGrid, line, note, plot, plotPoint, prism, raise, ride, rule, series, step } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the space of settings, one point per candidate the search tried.
// The right one is the best score the search has found so far, and what that winner scores on orders the search never saw.
// The record rides the best-so-far line. The gap between the two lines is the search overfitting its validation data.
const G = isoGrid(480, 295, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Illustrative score surface. x is the learning rate on a log axis (0.4 is 0.01, 2 is 0.1, 3.6 is 1), y is tree depth. */
const truth = (x: number, y: number) => 0.845 - 0.05 * Math.min(1, Math.abs(x - 1.2) / 1.3) ** 1.2 - 0.002 * Math.abs(y - 5);
interface Candidate { x: number; y: number; cv: number }
/** A seeded search: a grid of nine, nine random candidates, then candidates drawn near the best seen so far. Cross-validated scores carry noise. */
function search(seed: number): { grid: Candidate[]; all: Candidate[] } {
  let s = seed;
  const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const noise = () => (r() + r() + r() + r() - 2) * 0.026;
  const grid = [0.4, 2, 3.6].flatMap((x) => [3, 6, 9].map((y) => ({ x, y, cv: truth(x, y) + noise() })));
  const all = Array.from({ length: 9 }, () => ({ x: 0.2 + r() * 3.6, y: 2.4 + r() * 7.2 })).map((c) => ({ ...c, cv: truth(c.x, c.y) + noise() }));
  while (all.length < 60) {
    const b = all.reduce((a, c) => (c.cv > a.cv ? c : a));
    const x = Math.min(3.8, Math.max(0.2, b.x + (r() - 0.5) * 1.2)), y = Math.min(9.6, Math.max(2.4, b.y + (r() - 0.5) * 4));
    all.push({ x, y, cv: truth(x, y) + noise() });
  }
  return { grid, all };
}
const { grid: GRID, all: ALL } = search(109287);
const DEFAULT = GRID[4];
const best = (cs: Candidate[], n: number) => cs.slice(0, n).reduce((a, c) => (c.cv > a.cv ? c : a));
const n2 = (v: number) => v.toFixed(2);
const xy = (cs: Candidate[]) => cs.map((c) => [c.x, c.y] as [number, number]);
/** The best value so far after each candidate, drawn as stairs. */
const stairs = (cs: Candidate[], n: number, value: (c: Candidate) => number) => {
  const pts: [number, number][] = [];
  for (let i = 1; i <= n; i++) {
    const v = value(best(cs, i));
    if (pts.length && pts[pts.length - 1][1] !== v) pts.push([i, pts[pts.length - 1][1]]);
    pts.push([i, v]);
  }
  return pts;
};
const fresh = (c: Candidate) => truth(c.x, c.y);
const W9 = best(ALL, 9), W30 = best(ALL, 30), W60 = best(ALL, 60), WG = best(GRID, 9);
const NESTED = [0.84, 0.83, 0.85, 0.84, 0.84];
const NEST = NESTED.reduce((a, b) => a + b, 0) / NESTED.length;

const board = { xLabel: "learning rate, log scale", yLabel: "tree depth", xt: [0.4, 2, 3.6], xtl: ["0.01", "0.1", "1"], yt: [2, 4, 6, 8, 10] };
const SPACE = raise(plot("space", 0, 0, 430, 345, [0, 4], [1.2, 11.6], { title: "Settings tried", ...board, group: "space" }), F1, 30);
const FOLDS = raise(plot("folds", 0, 0, 430, 345, [0.3, 5.7], [0.76, 0.9], { title: "Nested cross-validation", sub: "one bar per held-back outer fold", xt: [1, 2, 3, 4, 5], xtl: ["fold 1", "fold 2", "fold 3", "fold 4", "fold 5"], yt: [0.76, 0.8, 0.84, 0.88], yLabel: "score of the winner found without that fold", group: "folds" }), F1, 30);
const FAMS = raise(plot("fams", 0, 0, 430, 345, [0.3, 4.7], [0.76, 0.9], { title: "Families under one protocol", sub: "nested estimate of each tuned family", xt: [1, 2, 3, 4], xtl: ["logistic", "boosting", "foundation", "ensemble"], yt: [0.76, 0.8, 0.84, 0.88], yLabel: "nested score", group: "fams" }), F1, 30);
const BEST = raise(plot("best", 0, 0, 430, 345, [0, 64], [0.77, 0.9], { title: "Best score found so far", xt: [1, 9, 30, 60], yt: [0.78, 0.8, 0.82, 0.84, 0.86, 0.88, 0.9], xLabel: "candidates tried", yLabel: "score", always: true }), F2, 30);

/** The winner after n candidates, ringed on the left board. */
const winner = (id: string, c: Candidate) => series(id, "space", "points", [[c.x, c.y]], { tone: "track", r: 9, label: "winner", group: id });
/** The search's best-so-far line after n candidates. */
const climb = (id: string, n: number) => series(id, "best", "line", stairs(ALL, n, (c) => c.cv), { w: 4, group: id });

export default defineGuide({
  id: "model-selection-and-tuning", track: "ml", module: "Selection and trust", slug: "model-selection-and-tuning",
  title: "Model selection and tuning",
  summary: "Model families and hyperparameters are compared by search under cross-validation. The search itself can overfit the validation data, so its own best score is not the estimate to report.",
  forLeads: "Ask how the winning model was chosen, how many candidates were tried, and for a score from data the search never touched. Give independent benchmarks more weight than a vendor's own.",
  status: "draft", minutes: 7,
  counters: ["Candidates tried", "Search method", "Best validation score", "Score on unseen orders"],
  whatIf: { label: "What if the search ran only nine candidates?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Scores and candidates are illustrative",
    label: "Two charts. The left one is the space of settings for a gradient boosting model, learning rate against tree depth, with one point for each candidate a search tried. A grid of nine misses the band of learning rates where the score peaks. Random and Bayesian search land inside it. The right one plots the best cross-validated score found so far against the number of candidates tried. It keeps climbing, while the score of the same winner on orders the search never saw stays flat. Nested cross-validation gives an estimate at the lower line. The choice and its evidence go to a model record.",
    els: [
      SPACE,
      band("peak", "space", 0.85, 1.55, { tone: "muted", label: "score peaks here", group: "peak" }),
      series("default", "space", "points", [[DEFAULT.x, DEFAULT.y]], { hue: "sand", r: 8, label: "default", group: "default" }),
      series("grid", "space", "points", xy(GRID), { hue: "sand", r: 7, group: "grid" }),
      series("k-grid", "space", "points", [[2.55, 10.9]], { hue: "sand", r: 6, tone: "muted", label: "grid", group: "grid" }),
      series("rand", "space", "points", xy(ALL.slice(0, 9)), { hue: "sky", r: 7, group: "rand" }),
      series("k-rand", "space", "points", [[3.2, 10.9]], { hue: "sky", r: 6, tone: "muted", label: "search", group: "rand" }),
      series("bayes", "space", "points", xy(ALL.slice(9, 30)), { hue: "sky", r: 5, group: "bayes" }),
      series("long", "space", "points", xy(ALL.slice(30)), { hue: "sky", r: 5, group: "long" }),
      winner("win-g", WG), winner("win-30", W30), winner("win-60", W60),

      FOLDS,
      series("fold-bars", "folds", "bars", NESTED.map((v, i) => [i + 1, v] as [number, number]), { hue: "track", group: "folds" }),
      rule("fold-mean", "folds", NEST, { axis: "y", tone: "muted", label: `mean ${n2(NEST)}`, group: "folds" }),

      FAMS,
      series("fam-bars", "fams", "bars", [[1, 0.79], [2, 0.84], [3, 0.85], [4, 0.86]], { hues: ["sand", "track", "violet", "mint"], group: "fams" }),

      BEST,
      series("one", "best", "points", [[1, DEFAULT.cv]], { hue: "sand", r: 8, label: `default ${n2(DEFAULT.cv)}`, group: "default" }),
      series("g-climb", "best", "line", stairs(GRID, 9, (c) => c.cv), { tone: "ink", w: 3, group: "grid" }),
      note("g-n", ...plotPoint(BEST, 11, WG.cv - 0.006), `grid ${n2(WG.cv)}`, { strong: true, on: "best", group: "g-n" }),
      climb("c9", 9), climb("c30", 30), climb("c60", 60),
      note("c-n", ...plotPoint(BEST, 31, 0.874), "best validation score", { strong: true, tone: "track", anchor: "end", on: "best", group: "c-n" }),
      series("unseen", "best", "line", stairs(ALL, 60, fresh), { tone: "alert", w: 3, group: "unseen" }),
      note("unseen-n", ...plotPoint(BEST, 62, 0.802), "same winner, unseen orders", { strong: true, tone: "alert", anchor: "end", on: "best", group: "unseen" }),
      series("gap", "best", "line", [[62, fresh(W60)], [62, W60.cv]], { tone: "alert", w: 3, dashed: true, group: "gap" }),
      note("gap-n", ...plotPoint(BEST, 61, 0.894), `gap ${n2(W60.cv - fresh(W60))}`, { strong: true, mono: true, tone: "alert", anchor: "end", on: "best", group: "gap" }),
      rule("nest", "best", NEST, { axis: "y", tone: "muted", group: "nest" }),
      note("nest-n", ...plotPoint(BEST, 62, 0.818), `nested estimate ${n2(NEST)}`, { strong: true, anchor: "end", on: "best", group: "nest" }),
      series("drop", "best", "line", [[55, W60.cv], [55, NEST]], { w: 3, dashed: true, group: "drop" }),

      line("to-record", [F2, G.p(7.8, 6.3)], { group: "record" }),
      prism("record", 7.1, 6.3, 1.4, 1.4, 30, { hue: "track", glyph: "shield", title: "Model record", sub: "choice, seeds, evidence", at: "w", group: "record" }),
    ],
  },
  steps: [
    step({
      id: "default", label: "Defaults", kind: "problem", title: "Hyperparameters are set before training",
      caption: "Vinterhus predicts returns with gradient boosting. Learning rate and tree depth are not learnt from the orders. One default setting gives one score, with nothing to compare it to.",
      show: ["space", "default"], counters: ["1", "none", n2(DEFAULT.cv), "not measured"],
      body: ["Hyperparameters are parameters that are not directly learnt within estimators. They are passed in before fitting, so the training run cannot correct a poor choice.",
        "scikit-learn states that it is possible and recommended to search the hyperparameter space for the best cross-validation score."],
      claims: ["model-selection-and-tuning-hyper"],
    }),
    step({
      id: "grid", label: "Grid", kind: "idea", title: "A search scores candidates by cross-validation",
      caption: "Each candidate setting is trained and scored across the folds. A grid of nine tries only three learning rates, and the best region falls between them.",
      show: ["space", "peak", "grid", "win-g"], counters: ["9", "grid", n2(WG.cv), "not measured"],
      rides: [ride("g-climb", 0, 1, "1 tried", { then: `best ${n2(WG.cv)}` })],
      body: ["A search consists of an estimator, a parameter space, a method for searching or sampling candidates, a cross-validation scheme and a score function.",
        "Grid search exhaustively considers all combinations of the values it is given. Three values of each of two settings cost nine candidates and test each setting at only three points.",
        { callout: { label: "Key idea", text: "The cross-validated score is the yardstick. The search method only decides which candidates get measured." } }],
      claims: ["model-selection-and-tuning-search", "model-selection-and-tuning-grid-random"],
    }),
    step({
      id: "smarter", label: "Smarter search", kind: "mechanism", title: "Random and Bayesian search spend the budget better",
      caption: "Random search samples nine different learning rates. Bayesian search then uses the scores so far to choose each next candidate. The best score climbs.",
      show: ["space", "peak", "rand", "bayes", "win-30", "grid", "g-n", "c30", "c-n"], counters: ["30", "random, then Bayesian", n2(W30.cv), "not measured"],
      rides: [ride("c30", 0, 1, `random ${n2(W9.cv)}`, { then: `best ${n2(W30.cv)}` })],
      body: ["Randomised search samples a given number of candidates from distributions over the parameter space. Its budget can be chosen independently of the number of parameters, and adding parameters that do not influence performance does not decrease efficiency.",
        "Bergstra and Bengio show that randomly chosen trials are more efficient than trials on a grid, because for most data sets only a few of the hyperparameters really matter.",
        "Bayesian optimisation models the learning algorithm's generalisation performance as a sample from a Gaussian process. The posterior makes efficient use of the information gathered by previous experiments when choosing what parameters to try next.",
        "AutoML frameworks run this loop across model families. The AutoGluon-Tabular authors state that existing frameworks primarily focus on model and hyperparameter selection, while theirs ensembles multiple models and stacks them in multiple layers."],
      claims: ["model-selection-and-tuning-grid-random", "model-selection-and-tuning-random-efficient", "model-selection-and-tuning-bayesian", "model-selection-and-tuning-automl"],
    }),
    step({
      id: "overfit", label: "Search overfits", kind: "watch-out", title: "The search overfits the validation data",
      caption: `Sixty candidates all meet the same folds, and the luckiest wins. Its validation score reads ${n2(W60.cv)}. On orders the search never saw it scores ${n2(fresh(W60))}.`,
      show: ["space", "peak", "rand", "bayes", "long", "win-60", "c60", "c-n", "unseen", "gap"], counters: ["60", "random, then Bayesian", n2(W60.cv), n2(fresh(W60))],
      rides: [ride("c60", 0.5, 1, `best ${n2(W30.cv)}`, { then: `best ${n2(W60.cv)}` })],
      body: ["A cross-validated score is an estimate with variance. Cawley and Talbot demonstrate that a non-negligible variance in the model selection criterion introduces the potential for over-fitting in model selection as well as in training the model.",
        "They show that the effects are often of comparable magnitude to differences in performance between learning algorithms, and that the finding applies to any model selection practice that optimises a criterion evaluated over a finite sample of data.",
        "scikit-learn states the consequence: choosing the parameters that maximise non-nested cross-validation biases the model to the dataset, yielding an overly optimistic score.",
        { callout: { label: "What changed", text: "Thirty more candidates raised the best validation score and left the score on unseen orders where it was." } }],
      claims: ["model-selection-and-tuning-selection-overfit", "model-selection-and-tuning-optimistic"],
    }),
    step({
      id: "nested", label: "Nested", kind: "mechanism", title: "Nested cross-validation scores the whole search",
      caption: `An outer loop holds one fold back, reruns the search on the rest, and scores that winner on the held fold. The mean, ${n2(NEST)}, is the honest estimate.`,
      show: ["folds", "c60", "c-n", "unseen", "nest", "drop"], counters: ["60 per outer fold", "nested, 5 outer folds", n2(W60.cv), n2(NEST)],
      rides: [ride("drop", 0, 1, `search ${n2(W60.cv)}`, { then: `nested ${n2(NEST)}` })],
      body: ["Nested cross-validation estimates the generalisation error of the underlying model and its hyperparameter search. The inner loop selects hyperparameters over the validation set. The outer loop estimates generalisation error by averaging test set scores over several dataset splits.",
        "The lighter form is a single split: a development set that is fed to the search, and an evaluation set of held-out samples not seen during the search.",
        "Every seed belongs in the record. scikit-learn's guidance for reproducible results across executions is to remove every use of the default random state. With an integer seed, repeated calls to fit or split yield the same results."],
      claims: ["model-selection-and-tuning-nested", "model-selection-and-tuning-held-out", "model-selection-and-tuning-seed"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The choice is recorded with its evidence",
      caption: "",
      show: ["fams", "c60", "c-n", "unseen", "nest", "record"], counters: ["60 per outer fold", "nested, 5 outer folds", n2(W60.cv), n2(NEST)],
      rides: [ride("to-record", 0, 0.55, "seed 7", { then: `nested ${n2(NEST)}` })],
      body: [{ pair: {
        left: { label: "Report", items: ["Nested or held-out score", "Seeds, search space, budget", "One protocol for every family"] },
        right: { label: "Discount", items: ["The search's own best score", "Vendor-only benchmarks"] },
      } },
        "Families are compared the way settings are: each one tuned under the same protocol, then scored on data its search never saw. An ensemble of the tuned models is a candidate too.",
        "TabArena is a continuously maintained benchmark with a public leaderboard, reproducible code and maintenance protocols. Its launch paper, as revised on 3 November 2025, reports that gradient-boosted trees are still strong contenders on practical tabular datasets, that foundation models excel on smaller datasets, and that ensembles across models advance the state of the art.",
        "The same paper observes that some deep learning models are overrepresented in cross-model ensembles due to validation set overfitting. The search overfits at benchmark scale too.",
        "The NIST AI Risk Management Framework asks that test sets, metrics and details about the tools used in evaluation are documented, and that experts who were not front-line developers, or independent assessors, are involved in regular assessments."],
      claims: ["model-selection-and-tuning-tabarena-living", "model-selection-and-tuning-tabarena-results", "model-selection-and-tuning-nist-document", "model-selection-and-tuning-nist-independent", "model-selection-and-tuning-optimistic"],
    }),
  ],
  governance: { text: "The NIST AI Risk Management Framework asks that test sets, metrics and evaluation tools are documented, and that independent assessors or experts who were not front-line developers take part in assessments. An integer seed makes repeated fits and splits yield the same results, so the search can be rerun.", claims: ["model-selection-and-tuning-nist-document", "model-selection-and-tuning-nist-independent", "model-selection-and-tuning-seed"] },
  closing: {
    pitfalls: [
      "Reporting the search's own best validation score as the expected performance.",
      "Tuning one family for longer than the others and then comparing them.",
      "Leaving seeds, search space and the reason for the choice out of the model record.",
    ],
    questions: [
      "Why does the best validation score keep rising as more candidates are tried?",
      "What does the outer loop of nested cross-validation hold back, and from what?",
      "Which evidence about a model family comes from someone who does not sell it?",
    ],
  },
});
