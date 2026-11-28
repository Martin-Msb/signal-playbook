import { CANVAS, band, blocks, defineGuide, drum, isoGrid, line, list, note, pawn, pill, plot, prism, raise, ride, rule, series, slab, step, table, treeOf } from "@signal-path/engine";

// The floor: two lanes meet at the scoring model. The build lane runs from the repayment history through training
// and validation. The decision lane runs from the applicant through the model and the threshold to the instalment plan.
// A reviewer stands on a branch off the threshold. Evidence stands on two boards: one above the lanes, one beside them.
const G = isoGrid(170, 80, 30);
const TOP: [number, number] = [640, 176];
const LEFT: [number, number] = [130, 415];

const sig = (z: number): number => 1 / (1 + Math.exp(-z));
const curve = (from: number, to: number, n = 24): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => { const z = from + ((to - from) * i) / n; return [z, sig(z)] as [number, number]; });
const BASE = -3.2;   // log odds of the base rate, 0.04
const Z_4471 = -3.8; // probability 0.02
const Z_4480 = -1.5; // probability 0.18

// 20 applicants: the first `declined` are turned away.
const crowd = (id: string, declined: number, sub: string, alert = false) =>
  blocks(id, 20.93, -1.33, 5, 0.5, Array.from({ length: 20 }, (_, i) => ({ h: 8, hue: i < declined ? (alert ? "rose" as const : "sand" as const) : "sky" as const })),
    { gap: 0.2, title: `${declined} of 20 declined`, sub, at: "s", group: id });
const scorePlot = (id: string) =>
  raise(plot(id, 0, 0, 300, 130, [-6, -0.4], [0, 0.4], { title: "Weighted sum to probability of default", xt: [-6, -4, -2], yt: [0, 0.2, 0.4], group: id }), TOP, 20);
const effects = (id: string, order: string, rows: string[][], total: string) =>
  raise(table(id, 0, 0, 236, ["feature", "value", "effect"], [...rows, { cells: ["probability", "", total], hot: true }], { at: [12, 118, 176], title: `Application ${order}`, mono: true, group: id }), LEFT, 20);

const BUILT = ["train", "model"];
const LIVE = [...BUILT, "data", "gate", "val", "rev", "q3"];

export default defineGuide({
  id: "case-pay-later-credit-decided-fairly", track: "case", module: "Use cases", slug: "pay-later-credit-decided-fairly",
  title: "Pay-later credit decided fairly",
  summary: "A scoring model for instalment credit is assembled from labelled repayment history, a logistic regression, a calibrated threshold and independent validation. Then two applications and a new model version run through it.",
  forLeads: "The model is a table of weights. What makes it usable for credit is everything around it: a documented purpose, an owned threshold, validators who did not build it, and a person an applicant can ask for.",
  status: "draft", minutes: 12,
  counters: ["Decides", "Reasons stated", "Oversight", "Declined, of 20"],
  whatIf: { label: "What if the model were opaque?", step: 1, from: 8 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, weights, rates and thresholds are illustrative",
    label: "An applicant's request for instalment credit travels along a rail to a scoring model, through a threshold, to an instalment plan. A second rail brings repayment history through training and validation to the model. A reviewer stands on a branch off the threshold. Boards show the weights, the probability curve, calibration, approval rates by group and a benchmark tree.",
    els: [
      pawn("app", 16.4, -6, "Applicant", undefined, { always: true }),
      line("d1", [G.p(16.4, -5.2), G.p(16.4, -0.6)], { always: true }),
      line("d2", [G.p(16.4, 0.6), G.p(16.4, 10)], { always: true }),
      prism("plan", 15.8, 10, 1.2, 1.2, 20, { hue: "sand", glyph: "check", title: "Instalments", sub: "plan opened", at: "w", always: true }),
      drum("hist", 0, 0, 1, 30, { hue: "sky", glyph: "table", title: "Repayments", sub: "past orders", at: "w", always: true }),

      // Problem: a rulebook, then an opaque model.
      prism("rules", 15.8, -0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "lines", title: "Rulebook", sub: "three fixed rules", at: "e", group: "rules" }),
      raise(list("rulebook", 0, 0, 236, [{ t: "account under 1 year: decline", hot: true }, "order above 500: decline", "any late payment: decline"], { title: "Rulebook", group: "rules" }), LEFT, 20),
      crowd("q1", 8, "most would have repaid"),
      prism("opaque", 15.8, -0.6, 1.2, 1.2, 32, { hue: "ink", glyph: "net", title: "Boosted model", sub: "500 trees", at: "e", group: "opaque" }),
      raise(list("ans-bad", 0, 0, 236, [{ t: "probability of default 0.18", hot: true }, { t: "declined", hot: true, tone: "alert" }, { t: "reason: score too low", hot: true, tone: "alert" }], { title: "The model answers", group: "opaque" }), TOP, 20),
      crowd("q2", 2, "no reason to give", true),

      // Architecture.
      slab("site", 15.5, -0.9, 1.8, 1.8, "Scoring model", { hue: "paper", glyph: "net", group: "site" }),
      raise(list("entry", 0, 0, 236, [{ t: "purpose: pay-later to 2,000", hot: true }, { t: "tier: high risk, credit", hot: true }, "owner: Finance", "review: every year"], { title: "Model inventory entry", group: "entry" }), LEFT, 20),
      raise(list("risks", 0, 0, 236, ["a good customer declined", "one group declined more", "poisoned training data", { t: "each measured, each owned", hot: true }], { title: "Risk register", group: "risks" }), TOP, 20),

      line("b1", [G.p(1, 0), G.p(4.4, 0)], { group: "data" }),
      prism("train", 4.4, -0.6, 1.2, 1.2, 22, { hue: "violet", glyph: "gear", title: "Training", at: "s", group: "train" }),
      pill("owner", [20, 128], "owner: Finance", { glyph: "key", tone: "track", anchor: "start", sub: "writes restricted", group: "data" }),
      raise(table("labels", 0, 0, 236, ["order", "late", "label"], [["4468", "0", "repaid"], { cells: ["4469", "2", "defaulted"], hot: true }, ["4470", "0", "repaid"], { cells: ["4471", "0", "not yet due"], mute: true }],
        { at: [12, 84, 132], columnHues: [undefined, undefined, "sky"], title: "Label: 90 days overdue", mono: true, group: "labels" }), LEFT, 20),

      line("b2", [G.p(5.6, 0), G.p(15.8, 0)], { group: "model" }),
      prism("model", 15.8, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Scoring model", sub: "logistic regression", at: "e", group: "model" }),
      raise(table("weights", 0, 0, 236, ["feature", "weight"], [{ cells: ["start: base rate", "-3.2"], hot: true }, ["late payment, each", "+0.7"], ["account year, each", "-0.2"], ["order, per 1,000", "+0.3"]],
        { at: [12, 176], title: "Weights, in log odds", mono: true, group: "weights" }), LEFT, 20),

      scorePlot("fit"),
      series("fit-c", "fit", "line", curve(-6, -0.45), { tone: "ink", w: 3, group: "fit" }),
      rule("fit-base", "fit", sig(BASE), { axis: "y", label: "base 0.04", w: 2, group: "fit" }),
      series("fit-go", "fit", "line", curve(BASE, Z_4480, 12), { tone: "track", w: 5, group: "fit" }),

      prism("gate", 15.8, 4.8, 1.2, 1.2, 14, { hue: "mint", glyph: "scale", title: "Threshold 0.10", at: "e", group: "gate" }),
      raise(plot("cal", 0, 0, 300, 130, [0, 0.4], [0, 0.5], { title: "Predicted against observed default", xt: [0, 0.2, 0.4], yt: [0, 0.2, 0.4], group: "cal" }), TOP, 20),
      band("cal-band", "cal", 0.1, 0.4, { group: "cal" }),
      series("cal-diag", "cal", "line", [[0, 0], [0.4, 0.4]], { tone: "muted", w: 2, dashed: true, group: "cal" }),
      series("cal-c", "cal", "line", [[0.02, 0.02], [0.06, 0.07], [0.12, 0.11], [0.2, 0.21], [0.32, 0.3]], { tone: "track", w: 4, group: "cal" }),
      series("cal-p", "cal", "points", [[0.02, 0.02], [0.06, 0.07], [0.12, 0.11], [0.2, 0.21], [0.32, 0.3]], { hue: "track", r: 5, group: "cal" }),
      rule("cal-t", "cal", 0.1, { label: "threshold 0.10", w: 3, group: "cal" }),
      raise(list("costs", 0, 0, 236, ["wrong approval: the debt", "wrong decline: the sale", { t: "threshold 0.10, set by Finance", hot: true }], { title: "Cost of each error", group: "costs" }), LEFT, 20),
      crowd("q3", 2, "each with reasons"),

      prism("val", 10.1, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "eye", title: "Validators", at: "s", group: "val" }),
      line("rv", [G.p(15.8, 6), G.p(11.4, 6)], { w: 3, group: "rev" }),
      pawn("reviewer", 10.8, 6, "Reviewer", undefined, { group: "rev" }),
      raise(plot("fair", 0, 0, 300, 130, [0, 5], [0, 100], { title: "Approved, % by age group", xt: [1, 2, 3, 4], xtl: ["18-25", "26-40", "41-60", "over 60"], yt: [0, 50, 100], group: "fair" }), TOP, 20),
      series("fair-b", "fair", "bars", [[1, 86], [2, 91], [3, 92], [4, 90]], { hue: "track", hot: [0], label: "largest gap 6", labelAt: 0, group: "fair" }),
      raise(list("report", 0, 0, 236, [{ t: "rebuilt from run 42: same", hot: true }, "calibration holds", "approval gap by age: 6", "limit: orders to 2,000"], { title: "Validation report", group: "report" }), LEFT, 20),

      // Execution.
      scorePlot("ok"),
      series("ok-c", "ok", "line", curve(-6, -0.45), { tone: "ink", w: 3, group: "ok" }),
      rule("ok-t", "ok", 0.1, { axis: "y", label: "decline above 0.10", w: 3, group: "ok" }),
      series("ok-go", "ok", "line", curve(BASE, Z_4471, 8), { tone: "track", w: 5, group: "ok" }),
      effects("fx-1", "4471", [["late payments", "0", "0.0"], ["account years", "4", "-0.8"], ["order", "640", "+0.2"]], "0.02"),

      effects("fx-2", "4480", [{ cells: ["late payments", "2", "+1.4"], hot: true }, ["account years", "0.3", "-0.1"], ["order", "1,200", "+0.4"]], "0.18"),
      raise(list("reasons", 0, 0, 236, [{ t: "2 late payments this year", hot: true }, { t: "order of 1,200", hot: true }, "with no late payment: approved", "you may ask for a person"], { title: "Sent to the applicant", group: "reasons" }), TOP, 20),

      note("tree-title", TOP[0], 24, "Validators' benchmark tree", { anchor: "middle", strong: true, size: 15, group: "tree" }),
      ...treeOf("bt", [TOP[0], 48], { label: "late > 1", hot: true, kids: [
        { label: "years < 1", kids: [{ label: "0.02", sub: "of 610", hue: "sky" }, { label: "0.06", sub: "of 240", hue: "sky" }] },
        { label: "0.21", sub: "of 150", hue: "rose" },
      ] }, { dx: 96, dy: 68, group: "tree", mono: true }),
      raise(list("challenge", 0, 0, 236, [{ t: "rebuilt from run 57: same", hot: true }, "tree benchmark agrees", { t: "approval gap by age: 13", hot: true, tone: "alert" }, "version 2 held"], { title: "Challenge to version 2", group: "challenge" }), LEFT, 20),
    ],
  },
  steps: [
    step({
      id: "rulebook", label: "Rulebook", kind: "problem", phase: "problem", title: "A rulebook declines customers who would repay",
      caption: "Three fixed rules decide every instalment request. Order 4471, a sofa at 640.00, is declined because the account is ten months old. Eight of every 20 applicants are turned away.",
      show: ["rules", "q1"], counters: ["a fixed rulebook", "the rule that fired", "none", "8"],
      rides: [ride("d1", 0, 0.4, "4471", { then: "declined", tone: "alert" })],
      body: ["A rule looks at one field at a time and cannot weigh a new account against a clean payment record.",
        "The EU AI Act lists systems that evaluate the creditworthiness of natural persons among its high-risk uses, so whatever replaces the rulebook carries obligations before it decides anything."],
      claims: ["intended-use-and-risk-high-risk"],
    }),
    step({
      id: "opaque", label: "Opaque model", kind: "problem", phase: "problem", title: "An opaque model declines without a reason",
      caption: "A boosted model of 500 trees declines fewer applicants. It returns a score and nothing else, and a score is not a reason an applicant or a regulator can use.",
      show: ["opaque", "q2"], counters: ["an opaque model", "none", "none", "2"],
      rides: [ride("d1", 0, 0.4, "4480", { then: "0.18?", tone: "alert" })],
      concepts: ["interpretability"],
      body: ["The highest accuracy on large datasets is often reached by models that even experts struggle to interpret.",
        "United States credit regulation requires a statement of the principal reasons for an adverse action, and says that failing to reach a qualifying score is not a sufficient statement. The GDPR names automatic refusal of an online credit application as a decision that calls for an explanation and a way to challenge it.",
        { callout: { label: "The gap", text: "The decision has to be explained to the person it affects. A score alone explains nothing." } }],
      claims: ["interpretability-tension", "linear-and-logistic-regression-reasons", "interpretability-recital-71"],
    }),
    step({
      id: "purpose", label: "Purpose", kind: "idea", phase: "architecture", title: "Purpose and risk are written down first",
      caption: "Before any model is built it has an inventory entry: purpose, risk tier, owner and review date. The risks are listed, and each gets a measure and an owner.",
      show: ["site", "entry", "risks"], counters: ["nothing yet", "required", "an owner, a risk tier", "none yet"],
      rides: [ride("d1", 0, 0.52, "credit?", { then: "high risk" })],
      concepts: ["intended-use-and-risk", "ai-risk-management", "model-risk-management"],
      body: ["Intended purpose is the use a system is meant for, with its context and conditions. Credit scoring of people is a high-risk purpose under the EU AI Act, which requires a risk management system, technical documentation and human oversight for such systems.",
        "The NIST AI Risk Management Framework has four functions: Govern, Map, Measure and Manage. Map frames the risks, Measure selects metrics for them, and Manage allocates resources to them on a regular basis. The process is iterative across the system's life.",
        "A model inventory holds enough information about each model to understand its risks."],
      claims: ["intended-use-and-risk-purpose", "intended-use-and-risk-high-risk", "intended-use-and-risk-requirements", "intended-use-and-risk-inventory", "ai-risk-management-functions", "ai-risk-management-function-roles", "ai-risk-management-continuous", "model-risk-management-inventory"],
    }),
    step({
      id: "labels", label: "Labels", kind: "mechanism", phase: "architecture", title: "Repayment history supplies the labels",
      caption: "Each past order carries its outcome: repaid or defaulted. Finance owns the definition and the data. The outcome arrives months after the order, and writes are restricted because a flipped label is learned as truth.",
      show: ["site", "data", "train", "labels", "risks"], counters: ["nothing yet", "required", "risk tier, data owner", "none yet"],
      rides: [ride("b1", 0, 0.5, "edit", { tone: "alert", then: "refused" })],
      concepts: ["labels-and-ground-truth", "data-governance", "security-and-privacy-of-models"],
      body: ["Ground truth is what actually happened, and a model's quality is assessed against it. Labels for recent predictions often arrive after a delay: order 4471 has no outcome until its instalments fall due.",
        "A data owner is accountable for the data, understands who uses it and limits access to those authorised.",
        "In a label flipping attack an adversary supplies training examples with altered labels, and the model learns the wrong label. Access controls, sanitisation and provenance records on the training data mitigate poisoning."],
      claims: ["labels-and-ground-truth-truth", "labels-and-ground-truth-delay", "data-governance-owner", "security-and-privacy-of-models-label-flipping", "security-and-privacy-of-models-provenance", "security-and-privacy-of-models-sanitisation"],
    }),
    step({
      id: "model", label: "Model", kind: "mechanism", phase: "architecture", title: "A weighted sum becomes a probability of default",
      caption: "Logistic regression gives each feature one weight. The sum starts at the base rate of default, 0.04, and each feature moves it. A sigmoid turns the sum into a probability.",
      show: [...BUILT, "data", "weights", "fit"], counters: ["logistic regression", "one weight per feature", "risk tier, data owner", "none yet"],
      rides: [ride("b2", 0, 0.5, "4 weights"), ride("fit-go", 0, 1, "0.18")],
      concepts: ["linear-and-logistic-regression", "probabilistic-models"],
      body: ["The linear part of a logistic regression is the bias plus each weight times its feature value, also called the log odds. A sigmoid maps it to a probability between 0 and 1.",
        "Logistic regression is directly motivated by a probabilistic model, and each prediction reads as a probability. In Bayesian terms a prior states belief before data and is updated to a posterior as data arrives. Here the base rate plays the prior's part: an applicant with no history scores 0.04.",
        "A credit scorecard is built by binning the data and fitting a logistic regression."],
      claims: ["linear-and-logistic-regression-sigmoid", "linear-and-logistic-regression-weights", "linear-and-logistic-regression-debug", "linear-and-logistic-regression-scorecard", "probabilistic-models-prior", "probabilistic-models-posterior"],
    }),
    step({
      id: "threshold", label: "Threshold", kind: "mechanism", phase: "architecture", title: "A calibrated probability meets an owned threshold",
      caption: "Of applicants scored near 0.20, about one in five defaulted, so the probability can be read as stated. Finance weighs a lost debt against a lost sale and declines above 0.10.",
      show: [...BUILT, "data", "gate", "cal", "costs", "q3"], counters: ["probability against 0.10", "one weight per feature", "data owner, threshold owner", "2"],
      rides: [ride("cal-c", 0, 0.66, "0.18"), ride("d2", 0, 0.223, "0.18", { then: "declined" })],
      concepts: ["uncertainty-and-calibration", "metrics-and-thresholds"],
      body: ["A well calibrated classifier's predicted probability can be read as a confidence level: of the cases given about 0.8, about 80% are positive. A calibration curve plots the observed frequency against the predicted probability. Logistic regression tends to return well calibrated probabilities by itself.",
        "A classification threshold converts the probability into a class. A threshold of 0.5 is a poor choice when one kind of error costs more than the other, and the threshold can instead optimise a utility the business defines.",
        "The cost of errors is examined and documented, and leadership takes responsibility for the decision."],
      claims: ["uncertainty-and-calibration-calibrated", "uncertainty-and-calibration-curve", "uncertainty-and-calibration-shapes", "metrics-and-thresholds-threshold", "metrics-and-thresholds-cost", "metrics-and-thresholds-owner"],
    }),
    step({
      id: "validation", label: "Validation", kind: "mechanism", phase: "architecture", title: "Independent validators stand before release",
      caption: "Validators who did not build the model rebuild it from the tracked run, test calibration and compare approval rates across age groups. A reviewer takes declined applications on request.",
      show: [...LIVE, "data", "fair", "report"], counters: ["probability against 0.10", "one weight per feature", "validators, fairness check, reviewer", "2"],
      rides: [ride("b2", 0, 0.222, "v1", { then: "passed" }), ride("b2", 0.6, 0.77, "live")],
      concepts: ["model-risk-management", "fairness", "experiment-tracking-and-reproducibility"],
      body: ["Validation evaluates whether a model performs as expected, assesses its limitations and generally occurs before first use. Effective challenge is critical analysis by objective experts with enough independence and standing to effect change.",
        "A tracked run records parameters, code version, metrics and a fingerprint of the dataset, so the validators can produce the same model again.",
        "Demographic parity compares selection rates across groups. Fairness assessment evaluates metrics on each group and reports the largest difference. Meeting one fairness metric does not make a classifier fair."],
      claims: ["model-risk-management-validation", "model-risk-management-challenge", "model-risk-management-nist-independent", "experiment-tracking-and-reproducibility-run", "experiment-tracking-and-reproducibility-dataset", "fairness-parity", "fairness-disaggregated", "fairness-metricframe"],
    }),
    step({
      id: "approved", label: "An application", kind: "mechanism", phase: "execution", title: "A sofa on instalments is approved",
      caption: "Order 4471 has no late payments and a four-year account. The sum falls below the base rate, the probability is 0.02, and the plan opens. The same table states why.",
      show: [...LIVE, "ok", "fx-1"], counters: ["probability against 0.10", "each feature's effect", "validators, fairness check, reviewer", "2"],
      rides: [ride("d1", 0, 0.4, "4471"), ride("ok-go", 0, 1, "0.02"), ride("d2", 0, 0.787, "0.02", { via: [0.223], then: "approved" })],
      concepts: ["linear-and-logistic-regression", "interpretability"],
      body: ["Each effect is a weight times the applicant's value, so the explanation is the model's own arithmetic. An inherently interpretable model provides explanations that are faithful to what it computes.",
        "A coefficient describes the dependency between a feature and the target conditional on the other features. It measures association and does not show cause."],
      claims: ["linear-and-logistic-regression-weights", "interpretability-post-hoc", "linear-and-logistic-regression-conditional", "linear-and-logistic-regression-causal"],
    }),
    step({
      id: "declined", label: "A decline", kind: "watch-out", phase: "execution", title: "A declined applicant gets reasons and a person",
      caption: "Order 4480 scores 0.18 and is declined. The applicant receives the two features that weighed most and what would change the result, then asks for a review. The reviewer may reverse it.",
      show: [...LIVE, "reasons", "fx-2"], counters: ["probability against 0.10", "principal reasons, what would change it", "validators, fairness check, reviewer", "2, one under review"],
      rides: [ride("d1", 0, 0.4, "4480"), ride("d2", 0, 0.223, "0.18", { then: "declined", tone: "alert" }), ride("rv", 0, 0.5, "review?", { then: "reversed" })],
      concepts: ["interpretability", "intended-use-and-risk"],
      body: ["A person subject to a decision based on a high-risk AI system has the right to clear and meaningful explanations of the system's role and the main elements of the decision.",
        "A counterfactual explanation states the smallest change that would give the desired outcome. It helps a person understand the decision, contest it and know what to change.",
        "Human oversight means the people assigned can correctly interpret the output and decide to disregard, override or reverse it."],
      claims: ["interpretability-ai-act-86", "interpretability-counterfactual", "interpretability-aims", "decision-trees-oversight", "intended-use-and-risk-requirements"],
    }),
    step({
      id: "challenge", label: "Challenge", kind: "decision", phase: "execution", title: "Validators hold version 2",
      caption: "",
      show: [...LIVE, "tree", "challenge"], counters: ["version 1, unchanged", "principal reasons, what would change it", "validators hold version 2", "2"],
      rides: [ride("bt-l1", 0, 0.7, "", { shape: "dot" }), ride("b2", 0, 0.222, "v2", { then: "held", tone: "alert" })],
      concepts: ["model-risk-management", "decision-trees", "experiment-tracking-and-reproducibility", "fairness", "ai-risk-management"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Validators independent of the developers", "A run that can be rebuilt", "Group metrics before each release"] },
        right: { label: "Do not rely on", items: ["Developers approving their own model", "Accuracy alone", "Dropping the age column"] },
      } },
        "The validators fit a shallow decision tree to the same tracked data as a benchmark. A tree is a white box: each leaf predicts the fraction of its training samples that defaulted, and the path to it reads as rules. A simple model gives baseline behaviour against which another model is tested.",
        "Removing a sensitive attribute does not remove its effect, because other features encode it. Fairness is evaluated and the result documented.",
        "Risk management is a repeating cycle: each new version returns to validation."],
      claims: ["model-risk-management-challenge", "model-risk-management-roles", "decision-trees-white-box", "decision-trees-leaf", "decision-trees-path", "linear-and-logistic-regression-baseline", "experiment-tracking-and-reproducibility-registry", "fairness-proxy", "fairness-nist", "ai-risk-management-continuous"],
    }),
  ],
  governance: { text: "Credit scoring of people is a high-risk use. The model has an inventory entry, validation independent of its developers, human oversight and an explanation for the applicant.", claims: ["model-risk-management-eu-high-risk", "model-risk-management-inventory", "model-risk-management-nist-independent", "model-risk-management-eu-oversight", "interpretability-ai-act-86"] },
  closing: {
    pitfalls: [
      "Telling a declined applicant only that the score was too low.",
      "Letting the team that built the model sign off its release.",
      "Treating a dropped age column as proof of fairness.",
    ],
    questions: [
      "Who owns the threshold, and what did they weigh to set it?",
      "Why can the reasons for order 4480 be read straight from the weights?",
      "What must be recorded for the validators to rebuild the model?",
    ],
  },
});
