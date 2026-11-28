import { CANVAS, blocks, defineGuide, drum, isoGrid, line, note, pill, plot, plotPoint, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";
import type { El, Hue, PlotEl, Pt } from "@signal-path/engine";

// The floor: member records run down the main rail from the loyalty data to the campaign, which sends offers to the
// members standing at the end. The architecture stops set parts on that rail: minimisation, the model, the calibrator.
// The pretrained network stands on a branch behind the rail. One board at the back right carries the chart of the stop,
// one at the front left carries the table of the stop.
const G = isoGrid(150, 140, 30);
const BACK: Pt = [790, 262];   // floor point of the chart board
const FRONT: Pt = [130, 505];  // floor point of the table board

/** Points on the main rail (grid 1 to 15.4), as fractions: the open rail after minimisation, the model, the open rail after the calibrator. */
const R = { clean: 0.326, model: 0.514, risk: 0.854 };

const board = (id: string, title: string, xr: [number, number], yr: [number, number], extra: Partial<PlotEl>) =>
  raise(plot(id, 0, 0, 300, 200, xr, yr, { title, group: id, ...extra }), BACK, 30);
const P_ASK = board("ask", "Members who left in a year", [0.3, 2.7], [0, 20], { xt: [1, 2], xtl: ["offer", "no offer"], yt: [0, 10, 20], yLabel: "% who left" });
const P_EXPLORE = board("explore", "Days since last order", [0.3, 5.7], [0, 40], { xt: [1, 2, 3, 4, 5], xtl: ["0", "30", "60", "90", "120+"], yt: [0, 20, 40], yLabel: "% who left" });
const P_LOSS = board("loss", "Loss as trees are added", [0, 200], [0.2, 0.48], { xt: [0, 60, 200], yt: [0.2, 0.3, 0.4], xLabel: "trees", yLabel: "loss" });
const P_RUNS = board("runs", "Validation loss by tuning run", [0, 42], [0.25, 0.33], { xt: [1, 20, 40], yt: [0.25, 0.29, 0.33], xLabel: "run", yLabel: "loss" });
const P_CAL = board("cal", "Score against share who left", [0, 1], [0, 1], { xt: [0, 0.5, 1], yt: [0, 0.5, 1], xLabel: "score" });
const P_EFFECT = board("effect", "Top fifth: left in 90 days", [0.3, 2.7], [0, 50], { xt: [1, 2], xtl: ["offered", "held out"], yt: [0, 20, 40], yLabel: "% who left" });

/** Validation loss of 40 tuning runs of the boosted trees. Run 41 in the log is the best of them, drawn at 31. */
const TUNING = Array.from({ length: 40 }, (_, i) => [i + 1, i === 30 ? 0.268 : Math.round((0.274 + 0.03 * Math.abs(Math.sin((i + 1) * 2.3)) * (1 - i / 90)) * 1000) / 1000] as [number, number]);

const TOKENS = ["tok 7f3a", "tok 2c9e", "tok b41d", "tok 9d1c", "tok e05b"];
const PAST = [["14", "9", "no"], ["2", "140", "yes"], ["6", "31", "no"], ["1", "95", "yes"], ["9", "12", "no"]];
const SETS: [string, Hue | undefined][] = [["train", undefined], ["train", undefined], ["train", undefined], ["valid.", "sand"], ["test", "violet"]];
const sheet = (id: string, title: string, cols: string[], at: number[], rows: Parameters<typeof table>[5], extra: Parameters<typeof table>[6] = {}) =>
  raise(table(id, 0, 0, 240, cols, rows, { at, rowH: 25, title, mono: true, group: id, ...extra }), FRONT, 30);

/** The members at the end of the rail, 50 standing for 80,000. */
const TOP = [2, 7, 11, 16, 23, 28, 31, 39, 44, 47], HELD = [16, 39];
const members = (id: string, hue: (i: number) => Hue): El =>
  blocks(id, 20.2, -2.75, 5, 0.42, Array.from({ length: 50 }, (_, i) => ({ h: 8, hue: hue(i) })), { gap: 0.13, group: id });
const membersPlate = (id: string, sub: string): El => pill(`${id}-p`, [945, 338], "Loyalty members", { sub, anchor: "end", group: id });

export default defineGuide({
  id: "case-customers-at-risk-of-leaving-reached-in-time", track: "case", module: "Use cases", slug: "customers-at-risk-of-leaving-reached-in-time",
  title: "Customers at risk of leaving, reached in time",
  summary: "A risk model for loyalty members is assembled from a table of past behaviour: split, fitted, compared with a pretrained network, calibrated, and wired to a campaign with a random holdout. Then three members run through it.",
  forLeads: "A score that ranks members is half of the answer. The other half is the holdout, which shows whether the offer changes what members do.",
  status: "draft", minutes: 12,
  counters: ["Offer goes to", "Risk score", "Models judged on", "Effect of the offer"],
  whatIf: { label: "What if everyone still got the offer?", step: 0, from: 7 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Members, scores, losses and rates are illustrative",
    label: "Member records travel along a rail from the loyalty data to a campaign that sends offers to members. Later stops add minimisation, a boosted tree model, a pretrained network on a branch, and a calibrator. A chart board and a table board show the evidence at each stop.",
    els: [
      drum("store", 0, 0, 1, 34, { hue: "sky", glyph: "table", title: "Loyalty data", sub: "80,000 members", at: "n", always: true }),
      line("m1", [G.p(1, 0), G.p(15.4, 0)], { always: true }),
      line("out", [G.p(16.6, 0), G.p(20, 0)], { always: true }),

      // Problem: the campaign sends everyone the offer.
      prism("camp-all", 15.4, -0.6, 1.2, 1.2, 24, { hue: "sand", glyph: "mail", title: "Campaign", sub: "offer to everyone", at: "sw", group: "all" }),
      members("mem-all", () => "track"), membersPlate("mem-all", "all get the offer"),
      P_ASK,
      series("ask-bar", "ask", "bars", [[1, 10]], { hue: "track", group: "ask" }),
      note("ask-v", ...plotPoint(P_ASK, 1, 11), "10%", { anchor: "middle", strong: true, on: "ask", group: "ask" }),
      note("ask-q", ...plotPoint(P_ASK, 2, 5), "no such group", { anchor: "middle", strong: true, tone: "alert", on: "ask", group: "ask" }),

      // Architecture: the table of examples, with identifiers minimised on the way.
      prism("min", 2.4, -0.6, 1.2, 1.2, 16, { hue: "mint", glyph: "shield", title: "Minimise", sub: "no email, no postcode", at: "sw", group: "min" }),
      sheet("past", "Past members", ["member", "orders", "days", "left"], [12, 98, 150, 198], PAST.map((r, i) => [TOKENS[i], ...r]), { sub: "8,000 rows", columnHues: [undefined, undefined, undefined, "rose"] }),
      sheet("split", "Past members, split", ["member", "days", "left", "set"], [12, 98, 138, 182], PAST.map((r, i) => ({ cells: [TOKENS[i], r[1], r[2], SETS[i][0]], hue: SETS[i][1] })), { foot: "4,800 / 1,600 / 1,600 rows" }),
      P_EXPLORE,
      series("ex-bars", "explore", "bars", [[1, 3], [2, 5], [3, 9], [4, 19], [5, 36]], { hues: ["paper", "paper", "paper", "rose", "rose"], group: "explore" }),
      pill("ex-miss", plotPoint(P_EXPLORE, 2.3, 31), "app visits: 12% missing", { on: "explore", group: "explore" }),

      // The boosted trees, the baseline they must beat, and the pretrained network.
      prism("gbm", 7.8, -0.6, 1.2, 1.2, 34, { hue: "track", glyph: "tree", title: "Boosted trees", at: "sw", group: "gbm" }),
      P_LOSS,
      rule("base", "loss", 0.31, { axis: "y", tone: "muted", group: "loss" }),
      note("base-n", ...plotPoint(P_LOSS, 197, 0.288), "logistic baseline", { anchor: "end", strong: true, tone: "muted", on: "loss", group: "loss" }),
      series("tr", "loss", "line", [[0, 0.45], [20, 0.36], [40, 0.31], [60, 0.275], [100, 0.24], [150, 0.218], [200, 0.207]], { tone: "ink", smooth: true, group: "loss" }),
      note("tr-n", ...plotPoint(P_LOSS, 150, 0.228), "training", { anchor: "middle", strong: true, on: "loss", group: "loss" }),
      series("va", "loss", "line", [[0, 0.455], [20, 0.37], [40, 0.32], [60, 0.29], [100, 0.305], [150, 0.335], [200, 0.36]], { tone: "track", smooth: true, w: 4, group: "loss" }),
      note("va-n", ...plotPoint(P_LOSS, 150, 0.352), "validation", { anchor: "middle", strong: true, tone: "track", on: "loss", group: "loss" }),
      rule("stop", "loss", 60, { tone: "track", label: "stop", group: "loss" }),

      line("tf", [G.p(4.6, 0), G.p(4.6, -4.4)], { group: "tfm" }),
      prism("pfn", 4, -5.6, 1.2, 1.2, 34, { hue: "sky", glyph: "lock", title: "Pretrained network", sub: "no fitting", at: "n", group: "tfm" }),
      P_RUNS,
      rule("r-base", "runs", 0.31, { axis: "y", tone: "muted", label: "logistic", group: "runs" }),
      rule("r-pfn", "runs", 0.27, { axis: "y", tone: "ink", group: "runs" }),
      note("r-pfn-n", ...plotPoint(P_RUNS, 1.5, 0.2605), "pretrained, untuned", { strong: true, on: "runs", group: "runs" }),
      note("r-best", ...plotPoint(P_RUNS, 31, 0.2565), "run 41", { anchor: "middle", strong: true, tone: "track", on: "runs", group: "runs" }),
      series("r-pts", "runs", "points", TUNING, { hue: "track", r: 4, hot: [30], group: "runs" }),
      sheet("log", "Tracked runs", ["run", "model", "data", "loss"], [12, 50, 146, 186], [["07", "logistic", "v3", "0.310"], { cells: ["41", "boosted", "v3", "0.268"], hot: true }, ["42", "pretrained", "v3", "0.270"]], { foot: "run 41 on test, once: 0.274" }),

      // Calibration and the campaign that keeps a random holdout.
      prism("calib", 10, -0.6, 1.2, 1.2, 22, { hue: "violet", glyph: "scale", title: "Calibrator", at: "sw", group: "cal-b" }),
      prism("camp-top", 15.4, -0.6, 1.2, 1.2, 24, { hue: "sand", glyph: "split", title: "Campaign", sub: "random holdout", at: "sw", group: "top" }),
      members("mem-top", (i) => (HELD.includes(i) ? "sand" : TOP.includes(i) ? "track" : "paper")), membersPlate("mem-top", "top fifth, some held out"),
      P_CAL,
      series("diag", "cal", "line", [[0, 0], [1, 1]], { tone: "muted", dashed: true, w: 2, group: "cal" }),
      series("raw", "cal", "line", [[0.05, 0.03], [0.2, 0.09], [0.4, 0.2], [0.6, 0.33], [0.8, 0.5], [0.95, 0.62]], { tone: "ink", smooth: true, group: "cal" }),
      note("raw-n", ...plotPoint(P_CAL, 0.8, 0.36), "raw", { strong: true, on: "cal", group: "cal" }),
      series("fix", "cal", "line", [[0.03, 0.03], [0.1, 0.1], [0.2, 0.21], [0.35, 0.34], [0.5, 0.5], [0.62, 0.62]], { tone: "track", w: 4, label: "calibrated", group: "cal" }),
      rule("cut", "cal", 0.3, { tone: "track", label: "top fifth", group: "cut" }),

      // Execution.
      sheet("scored", "Scored members", ["member", "risk", "action"], [12, 98, 148], [{ cells: ["tok 7f3a", "0.52", "offer"], hot: true }, ["tok 2c9e", "0.04", "none"], ["tok b41d", "0.47", "held out"]]),
      sheet("scored-h", "Scored members", ["member", "risk", "action"], [12, 98, 148], [["tok 7f3a", "0.52", "offer"], ["tok 2c9e", "0.04", "none"], { cells: ["tok b41d", "0.47", "held out"], hot: true }]),
      P_EFFECT,
      series("ef-bars", "effect", "bars", [[1, 21], [2, 28]], { hues: ["track", "sand"], group: "effect" }),
      note("ef-a", ...plotPoint(P_EFFECT, 1, 23), "21%", { anchor: "middle", strong: true, on: "effect", group: "effect" }),
      note("ef-b", ...plotPoint(P_EFFECT, 2, 30), "28%", { anchor: "middle", strong: true, on: "effect", group: "effect" }),
      pill("ef-gap", plotPoint(P_EFFECT, 1.5, 48), "7 in 100 kept", { tone: "track", on: "effect", group: "effect" }),
      sheet("fair", "Leavers reached, by age", ["age band", "reached"], [12, 150], [["under 35", "61%"], ["35 to 59", "63%"], { cells: ["60 and over", "44%"], hot: true }], { foot: "gap 19 points, recorded" }),
    ],
  },
  steps: [
    step({
      id: "everyone", label: "Everyone", kind: "problem", phase: "problem", title: "Every member gets the retention offer",
      caption: "Vinterhus has 80,000 loyalty members, and a tenth stop buying each year. The campaign sends all of them the same offer, because nothing says who is about to leave.",
      show: ["all", "mem-all"], counters: ["all 80,000 members", "none", "nothing", "unknown"],
      rides: [ride("m1", 0, R.risk, "80,000"), ride("out", 0, 0.6, "offer")],
      body: ["The blanket campaign is the solution without machine learning. It is the benchmark that decides whether a model is worth building for this problem.",
        "Nine offers in ten go to members who were not going to leave."],
      claims: ["learning-from-examples-benchmark"],
    }),
    step({
      id: "blind", label: "No comparison", kind: "problem", phase: "problem", title: "Nothing shows what the offer changes",
      caption: "Members who took the offer and stayed might have stayed anyway. Every member was offered, so no group exists to compare them with.",
      show: ["all", "mem-all", "ask"], counters: ["all 80,000 members", "none", "nothing", "no comparison group"],
      rides: [ride("out", 0, 0.6, "offer", { then: "stayed?" })],
      body: ["The causal effect of a treatment on a person is the difference between the outcome with it and the outcome without it. Both cannot be observed for the same person.",
        { callout: { label: "The gap", text: "Two things are missing: who is likely to leave, and whether the offer changes that." } }],
      claims: ["online-experiments-and-causal-effect-counterfactual"],
    }),
    step({
      id: "table", label: "Examples", kind: "mechanism", phase: "architecture", title: "Past members become a table of examples",
      caption: "Each row is one member a year ago. Orders and days since the last order are features, and whether the member left is the label. Identifiers become tokens. Email and postcode stay behind.",
      show: ["all", "mem-all", "min", "past"], counters: ["all 80,000 members", "8,000 examples, no model", "nothing", "no comparison group"],
      rides: [ride("m1", 0, R.clean, "c-10482", { then: "tok 7f3a" })],
      concepts: ["learning-from-examples", "features-labels-and-datasets", "sensitive-data-handling"],
      body: ["A supervised model learns from data with the correct answers. A labelled example is one row of features with its label, the value the model is to predict.",
        "The GDPR limits personal data to what is necessary for the purpose and names pseudonymisation as a measure for data minimisation. Pseudonymised data that can still be attributed to a person remains personal data.",
        "A postal code can stand in for income, race or ethnicity, so it is not offered to the model as a feature."],
      claims: ["learning-from-examples-supervised", "features-labels-and-datasets-example", "features-labels-and-datasets-proxy", "sensitive-data-handling-purpose", "sensitive-data-handling-design", "sensitive-data-handling-pseudonymised"],
    }),
    step({
      id: "split", label: "Explore, split", kind: "mechanism", phase: "architecture", title: "The table is explored and then split",
      caption: "Members idle for 90 days or more left most often, and some app data is missing. The rows are split into training, validation and test sets before any model is fitted.",
      show: ["all", "mem-all", "min", "split", "explore"], counters: ["all 80,000 members", "8,000 examples, no model", "1,600 validation members", "no comparison group"],
      rides: [ride("m1", 0, R.clean, "8,000 rows", { then: "3 sets" })],
      concepts: ["exploring-data", "training-validation-and-test-sets"],
      body: ["Data is looked at graphically before analysis goes far. A histogram shows the centre, spread and skew of one column. Missing values for many examples can mean a group is under-represented, which is checked before the gaps are treated as random.",
        "Training proceeds on the training set and candidates are evaluated on the validation set. The test set is held out for the final evaluation. Splitting first, before any preprocessing, avoids leakage."],
      claims: ["exploring-data-look-first", "exploring-data-histogram", "exploring-data-gaps", "training-validation-and-test-sets-validation", "training-validation-and-test-sets-holdout", "training-validation-and-test-sets-split-first"],
    }),
    step({
      id: "fit", label: "Boosted trees", kind: "mechanism", phase: "architecture", title: "Boosted trees are fitted and stopped early",
      caption: "Training loss keeps falling as trees are added. Validation loss turns upward after 60 trees, so fitting stops there. A logistic regression is the baseline to beat.",
      show: ["all", "mem-all", "min", "split", "gbm", "loss"], counters: ["all 80,000 members", "boosted trees, raw", "1,600 validation members", "no comparison group"],
      rides: [ride("m1", 0, R.clean, "4,800 rows"), ride("va", 0, 0.42, "loss", { then: "0.29" })],
      concepts: ["gradient-boosting", "overfitting-and-generalisation", "linear-and-logistic-regression"],
      body: ["Gradient boosted trees can overfit. Training loss that keeps declining while validation loss rises suggests overfitting, and early stopping ends training when the validation score stops improving.",
        "A logistic regression passes a weighted sum of the features through a sigmoid to give a probability. A simple model provides baseline metrics against which a more complex model is tested.",
        "Gradient-boosted trees are the long-standing default for tabular prediction."],
      claims: ["gradient-boosting-can-overfit", "gradient-boosting-early-stopping", "overfitting-and-generalisation-diverge", "overfitting-and-generalisation-early", "linear-and-logistic-regression-sigmoid", "linear-and-logistic-regression-baseline", "boosted-trees-default"],
    }),
    step({
      id: "compare", label: "Compare", kind: "mechanism", phase: "architecture", title: "Two model families are compared on held-out members",
      caption: "A pretrained network reads the training rows as context, with no fitting. Forty tracked tuning runs bring the boosted trees level. The test set is opened once, for the chosen run.",
      show: ["all", "mem-all", "min", "gbm", "tfm", "runs", "log"], counters: ["all 80,000 members", "boosted trees, run 41", "test members, once", "no comparison group"],
      rides: [ride("tf", 0, 0.45, "4,800 rows", { then: "context" })],
      concepts: ["tabular-foundation-models", "model-selection-and-tuning", "experiment-tracking-and-reproducibility"],
      body: ["A prior-data fitted network predicts in one forward pass that takes the labelled rows and the new rows as context. An independent benchmark found boosted trees still strong and foundation models strongest on smaller datasets.",
        "The best of many tuning runs is an optimistic score, because the search itself can overfit the validation data. The chosen model is evaluated on samples the search never saw.",
        "Each run records its parameters, code version, metrics and a fingerprint of its dataset, and the registry records which run produced the registered model.",
        { callout: { label: "The choice", text: "The scores are level. The reason for choosing the boosted trees, serving cost and the licence on pretrained weights, is recorded with run 41." } }],
      claims: ["pfn-in-context-forward-pass", "tabarena-trees-and-foundation-models", "tabular-fm-hardware-cost", "model-selection-and-tuning-hyper", "model-selection-and-tuning-selection-overfit", "model-selection-and-tuning-held-out", "experiment-tracking-and-reproducibility-run", "experiment-tracking-and-reproducibility-dataset", "experiment-tracking-and-reproducibility-registry"],
    }),
    step({
      id: "calibrate", label: "Calibrate", kind: "mechanism", phase: "architecture", title: "Scores are calibrated and a holdout is set aside",
      caption: "Raw scores overstate the risk. A calibrator fitted on validation members maps them to observed frequencies. Of the top fifth by risk, one in five is held back at random.",
      show: ["min", "gbm", "cal-b", "top", "mem-top", "cal", "cut", "log"], counters: ["top fifth, less a holdout", "calibrated", "test members, once", "holdout planned"],
      rides: [ride("m1", R.model, R.risk, "raw 0.82", { then: "risk 0.52" }), ride("fix", 0, 0.8, "risk")],
      concepts: ["uncertainty-and-calibration", "online-experiments-and-causal-effect"],
      body: ["Among members given a calibrated risk close to 0.5, about half leave. A calibration curve plots the observed frequency against the predicted probability, and the calibrator is fitted on data independent of the training data.",
        "Random assignment distributes every other influence equally over the two groups, so a later difference between them is caused by the offer. A holdout is a small share kept on the original experience as the baseline."],
      claims: ["uncertainty-and-calibration-calibrated", "uncertainty-and-calibration-curve", "uncertainty-and-calibration-heldout", "online-experiments-and-causal-effect-ab", "online-experiments-and-causal-effect-confounding", "online-experiments-and-causal-effect-holdout"],
    }),
    step({
      id: "member", label: "A member", kind: "mechanism", phase: "execution", title: "A member at risk gets the offer",
      caption: "Member c-10482 becomes a token, scores 0.82 raw and 0.52 calibrated, and lands in the top fifth. A member at 0.04 gets nothing.",
      show: ["min", "gbm", "cal-b", "top", "mem-top", "cal", "cut", "scored"], counters: ["top fifth, less a holdout", "calibrated", "test members, once", "holdout running"],
      rides: [ride("m1", 0, R.risk, "c-10482", { via: [R.clean], then: "risk 0.52" }), ride("out", 0, 0.6, "offer"), ride("fix", 0, 0.8, "0.52")],
      concepts: ["learning-from-examples", "uncertainty-and-calibration", "sensitive-data-handling"],
      body: ["A trained model makes predictions, called inferences, on unlabelled examples. These members have no label yet: whether they leave is what the model estimates.",
        "The model sees the token and the behaviour columns. Only the data necessary for the purpose is processed by default."],
      claims: ["learning-from-examples-inference", "uncertainty-and-calibration-calibrated", "sensitive-data-handling-design"],
    }),
    step({
      id: "holdout", label: "The holdout", kind: "mechanism", phase: "execution", title: "The holdout shows what the offer caused",
      caption: "A member at 0.47 is drawn into the holdout and gets no offer. After 90 days, 21% of offered members have left and 28% of the holdout. The offer kept 7 in 100.",
      show: ["min", "gbm", "cal-b", "top", "mem-top", "effect", "scored-h"], counters: ["top fifth, less a holdout", "calibrated", "test members, once", "7 in 100 kept"],
      rides: [ride("m1", R.clean, R.risk, "tok b41d", { then: "held out" })],
      concepts: ["online-experiments-and-causal-effect"],
      body: ["The only consistent difference between the two groups is the offer, so the difference in who left is its effect. The difference is reported with a confidence interval: if zero lies inside it, no effect is concluded.",
        "Uplift modelling goes one step further and predicts the difference the offer makes for each member, to find those who stay only if contacted."],
      claims: ["online-experiments-and-causal-effect-causality", "online-experiments-and-causal-effect-interval", "online-experiments-and-causal-effect-uplift", "online-experiments-and-causal-effect-types"],
    }),
    step({
      id: "operate", label: "Operate", kind: "decision", phase: "execution", title: "What keeps it fair and measured",
      caption: "",
      show: ["min", "gbm", "cal-b", "top", "mem-top", "effect", "fair"], counters: ["top fifth, less a holdout", "calibrated", "test members, once", "7 in 100 kept"],
      rides: [ride("m1", 0, R.risk, "tok 9d1c", { via: [R.clean], then: "risk 0.31" }), ride("out", 0, 0.6, "offer")],
      concepts: ["fairness", "experiment-tracking-and-reproducibility", "sensitive-data-handling"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Reach measured by group", "The holdout's measured effect", "Scores traced to runs"] },
        right: { label: "Do not rely on", items: ["Dropping a column as fairness", "Members who stayed as proof", "Validation scores after reuse"] },
      } },
        "Disaggregated metrics are evaluated on slices of the data. Equal opportunity compares the true positive rate across groups: here, the share of leavers the offer reached in each age band. Age band is not a feature. It is kept apart and used for this measurement.",
        "Removing a sensitive attribute does not remove it from the model: other features can encode it. Fairness is evaluated and the result documented.",
        "The registry records which run produced a model, and provenance of training data supports accountability. Validation sets wear out with repeated use."],
      claims: ["fairness-disaggregated", "fairness-odds", "fairness-proxy", "fairness-nist", "experiment-tracking-and-reproducibility-registry", "experiment-tracking-and-reproducibility-provenance", "training-validation-and-test-sets-wear-out", "sensitive-data-handling-purpose"],
    }),
  ],
  governance: { text: "Scores decide who gets an offer, so the model's reach is measured for each customer group and the result is documented. Personal data used for scoring is limited to what the purpose needs.", claims: ["fairness-nist", "fairness-disaggregated", "sensitive-data-handling-purpose"] },
  closing: {
    pitfalls: [
      "Reading a high score as proof that the offer works on that member.",
      "Tuning against the test set until it stops being a test.",
      "Treating a dropped column as a fairness assessment.",
    ],
    questions: [
      "Which rows may the calibrator be fitted on, and why not the training rows?",
      "What does the holdout measure that the validation loss cannot?",
      "Who decides what to do about the gap between age bands?",
    ],
  },
});
