import { CANVAS, defineGuide, isoGrid, line, note, plot, plotPoint, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the orders with the model's line and its predicted range.
// The right one is the belief about the weight: a probability for every possible weight.
// The belief starts as a wide prior, and each batch of orders moves it and narrows it. A record marks its peak.
const G = isoGrid(480, 295, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Orders at the new warehouse: items in the order and minutes to pack it. The first two arrive first. */
const FIRST: [number, number][] = [[2, 1.6], [4, 4.4]];
const LATER: [number, number][] = [[1, 1.9], [3, 5.1], [5, 7.0], [6, 9.6], [7, 10.1], [8, 12.4]];
const ALL = [...FIRST, ...LATER];
/** Spread of packing time around the line, in minutes. Taken as known. */
const NOISE = 1.5;

type Belief = { m: number; s: number };
/** Bayes' rule for the model minutes = w × items with a normal prior on w: the posterior is normal too. */
function update(prior: Belief, orders: [number, number][]): Belief {
  const sxx = orders.reduce((t, [x]) => t + x * x, 0), sxy = orders.reduce((t, [x, y]) => t + x * y, 0);
  const precision = 1 / prior.s ** 2 + sxx / NOISE ** 2;
  return { m: (prior.m / prior.s ** 2 + sxy / NOISE ** 2) / precision, s: Math.sqrt(1 / precision) };
}
const PRIOR: Belief = { m: 2, s: 0.5 }, STUBBORN: Belief = { m: 3, s: 0.1 };
const POST2 = update(PRIOR, FIRST), POST8 = update(POST2, LATER), FORCED = update(STUBBORN, ALL);
/** The weight with the lowest squared error on the first two orders: one number, no belief. */
const POINT = FIRST.reduce((t, [x, y]) => t + x * y, 0) / FIRST.reduce((t, [x]) => t + x * x, 0);

const n2 = (v: number) => v.toFixed(2);
const pdf = (b: Belief, w: number) => Math.exp(-0.5 * ((w - b.m) / b.s) ** 2) / (b.s * Math.sqrt(2 * Math.PI));
const peak = (b: Belief): [number, number] => [b.m, pdf(b, b.m)];

const DATA = raise(plot("data", 0, 0, 430, 345, [0, 9], [0, 20], { title: "Orders and the prediction", xt: [0, 3, 6, 9], yt: [0, 5, 10, 15, 20], xLabel: "items", yLabel: "minutes to pack", always: true }), F1, 30);
const BELIEF = raise(plot("belief", 0, 0, 430, 345, [0.5, 3.5], [0, 6.4], { title: "Belief about the weight", xt: [0.5, 1, 1.5, 2, 2.5, 3, 3.5], yt: [0, 2, 4, 6], xLabel: "minutes per item", yLabel: "probability density", always: true }), F2, 30);

type Tone = "track" | "alert" | "ink" | "muted";
/** The belief drawn as a curve over every possible weight. */
const curve = (id: string, b: Belief, extra: { tone?: Tone; dashed?: boolean; w?: number } = {}) =>
  series(id, "belief", "line", Array.from({ length: 121 }, (_, i) => [0.5 + i * 0.025, pdf(b, 0.5 + i * 0.025)] as [number, number]), { w: 4, ...extra, group: id });
/** A name beside a curve, in the curve's group. */
const name = (group: string, w: number, d: number, text: string, tone: Tone, anchor: "start" | "end" = "start") =>
  note(`${group}-n`, ...plotPoint(BELIEF, w, d), text, { strong: true, tone, anchor, on: "belief", group });
/** The line for the most probable weight, with the range that holds 95 in 100 predicted packing times. */
const fan = (id: string, b: Belief, tone: Tone = "track") => {
  const xs = Array.from({ length: 37 }, (_, i) => i * 0.25);
  const half = (x: number) => 1.96 * Math.sqrt(x * x * b.s ** 2 + NOISE ** 2);
  const edge = (side: 1 | -1) => xs.map((x) => [x, b.m * x + side * half(x)] as [number, number]).filter(([, y]) => y >= 0 && y <= 20);
  return [
    ...(b.s > 0 ? [series(`${id}-hi`, "data", "line", edge(1), { tone, w: 2, dashed: true, group: id }), series(`${id}-lo`, "data", "line", edge(-1), { tone, w: 2, dashed: true, group: id })] : []),
    series(`${id}-l`, "data", "line", [[0, 0], [Math.min(9, 20 / b.m), Math.min(20, 9 * b.m)]], { tone, w: 4, group: id }),
    note(`${id}-eq`, DATA.x + 62, DATA.y + 50, b.s > 0 ? `weight ${n2(b.m)} ± ${n2(b.s)}` : `weight ${n2(b.m)}`, { strong: true, mono: true, tone, on: "data", group: id }),
  ];
};
/** A hidden marker at the peak of a belief, so a record can be sent there. */
const at = (id: string, b: Belief) => stop(id, ...plotPoint(BELIEF, ...peak(b)), undefined, undefined, { group: "anchor" });
const facts = (orders: number, b: Belief, prior: string) => [String(orders), n2(b.m), `± ${n2(b.s)}`, prior];

export default defineGuide({
  id: "probabilistic-models", track: "ml", module: "Model families", slug: "probabilistic-models",
  title: "Probabilistic models",
  summary: "A probabilistic model states its belief as a distribution over possible values. Bayes' rule updates a prior belief into a posterior as data arrives.",
  forLeads: "A probabilistic model reports how sure it is, and that depends on a prior someone chose. Ask what the prior was, why, and how the result moves under a different one.",
  status: "draft", minutes: 7,
  counters: ["Orders used", "Most probable weight", "Spread of belief", "Prior"],
  whatIf: { label: "What if the prior were confident and wrong?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and priors are illustrative",
    label: "Two charts. The left one plots orders by size and packing time, with the model's line and a dashed range around it. The right one plots the belief about the weight as a curve over every possible weight. The belief starts as a wide prior centred on 2 minutes per item. Two orders move it to 1.34 and narrow it, and six more tighten it around 1.50 while the dashed range closes in. A confident prior at 3 holds the belief away from the orders. The prior is filed in the model record.",
    els: [
      DATA,
      series("o2", "data", "points", FIRST, { hue: "sky", r: 6, group: "o2" }),
      series("o2m", "data", "points", FIRST, { hue: "sky", r: 6, tone: "muted", group: "o2m" }),
      series("o8", "data", "points", LATER, { hue: "sky", r: 6, group: "o8" }),
      ...fan("ls", { m: POINT, s: 0 }, "ink"), ...fan("pr", PRIOR), ...fan("p2", POST2), ...fan("p8", POST8), ...fan("pb", FORCED, "alert"),
      note("range-n", ...plotPoint(DATA, 8.8, 1.2), "dashed: 95 in 100 predictions", { tone: "muted", anchor: "end", on: "data", group: "range" }),

      BELIEF,
      rule("point", "belief", POINT, { tone: "ink", group: "point" }), note("point-n", ...plotPoint(BELIEF, POINT + 0.08, 3.4), "one weight, no spread", { strong: true, on: "belief", group: "point" }),
      curve("prior", PRIOR), name("prior", 2.42, 0.95, "prior", "track"),
      curve("prior-old", PRIOR, { tone: "ink", dashed: true, w: 3 }), name("prior-old", 2.42, 0.95, "prior", "ink"),
      curve("post2", POST2), name("post2", 1.62, 1.65, "after 2 orders", "track"),
      curve("post2-old", POST2, { tone: "ink", dashed: true, w: 3 }),
      curve("post8", POST8), name("post8", 1.72, 3.3, "after 8 orders", "track"),
      curve("post8-old", POST8, { tone: "ink", dashed: true, w: 3 }), name("post8-old", 1.36, 3.3, "with wide prior", "ink", "end"),
      curve("bad-prior", STUBBORN, { tone: "alert", dashed: true, w: 3 }), name("bad-prior", 3.14, 3.3, "prior", "alert"),
      curve("bad-post", FORCED, { tone: "alert" }), name("bad-post", 2.46, 4.4, "after 8", "alert"),
      series("path1", "belief", "line", [peak(PRIOR), peak(POST2)], { tone: "muted", w: 2, dashed: true, group: "path1" }),
      series("path2", "belief", "line", [peak(POST2), peak(POST8)], { tone: "muted", w: 2, dashed: true, group: "path2" }),
      series("bad-path", "belief", "line", [peak(STUBBORN), peak(FORCED)], { tone: "alert", w: 2, dashed: true, group: "bad-path" }),
      at("a0", PRIOR), at("a2", POST2), at("a8", POST8), at("b0", STUBBORN), at("b8", FORCED),

      line("to-gate", [F2, G.p(7.8, 6.3)], { group: "gate" }),
      prism("gate", 7.1, 6.3, 1.4, 1.4, 30, { hue: "track", glyph: "doc", title: "Model record", sub: "prior and its reason", at: "w", group: "gate" }),
    ],
  },
  steps: [
    step({
      id: "point", label: "One number", kind: "problem", title: "A fitted weight is one number",
      caption: `A new Vinterhus warehouse has packed two orders. Minimising the loss returns one weight, ${n2(POINT)} minutes per item. Nothing in that number says how far to trust it.`,
      show: ["o2", "ls", "point"], counters: ["2", n2(POINT), "not stated", "none"],
      rides: [ride("ls-l", 0, 0.8, "2 orders", { then: `w ${n2(POINT)}` })],
      body: ["The model is the one from loss and optimisation: minutes equals weight times items. Two orders are enough to compute a weight, and the result looks as exact as one computed from two thousand.",
        "Bayesian statistics is an approach for learning from evidence as it accumulates. It uses Bayes' theorem to formally combine prior information with current information on a quantity of interest."],
      claims: ["probabilistic-models-learning"],
    }),
    step({
      id: "prior", label: "Prior", kind: "idea", title: "A prior states belief before the data",
      caption: "Give every possible weight a probability before counting an order. The old warehouse packed at 2 minutes per item, so belief centres there and stays wide.",
      show: ["o2m", "pr", "range", "prior"], counters: facts(0, PRIOR, "2.00 ± 0.50"),
      rides: [ride("prior", 0.2, 0.5, "belief", { then: "w 2.00" })],
      body: ["Before data are obtained, probabilities are given to all the possible values of an unknown quantity of interest. Taken together, these probabilities constitute the prior distribution for that quantity.",
        "Here the prior is a normal distribution with mean 2.00 and standard deviation 0.50. On the left it becomes a prediction with a wide range: the model has seen nothing from this warehouse yet.",
        { callout: { label: "Key idea", text: "The model's answer is the whole curve. Its peak is the most probable weight and its width is the doubt." } }],
      claims: ["probabilistic-models-prior"],
    }),
    step({
      id: "update", label: "Bayes' rule", kind: "mechanism", title: "Bayes' rule updates the prior",
      caption: "Two orders arrive. Bayes' rule combines the prior with the data. The updated belief, the posterior, moves towards the orders and narrows.",
      show: ["o2", "p2", "range", "prior-old", "post2", "path1"], counters: facts(2, POST2, "2.00 ± 0.50"),
      rides: [ride("path1", "a0", "a2", "w 2.00", { then: `w ${n2(POST2.m)}` })],
      body: ["After data become available, the prior distribution is updated according to Bayes' theorem. The updated distribution is called the posterior distribution.",
        `The posterior sits between the prior at 2.00 and the fitted weight of ${n2(POINT)}. Two orders are little evidence, so the prior still counts for much.`,
        "Naive Bayes applies the same rule to classes. It uses Bayes' theorem with the naive assumption of conditional independence between every pair of features given the value of the class variable."],
      claims: ["probabilistic-models-posterior", "probabilistic-models-naive-bayes"],
    }),
    step({
      id: "repeat", label: "More data", kind: "mechanism", title: "Each posterior is the next prior",
      caption: `Six more orders arrive and the update repeats. Belief tightens around ${n2(POST8.m)}, the predicted range narrows, and the original prior matters less.`,
      show: ["o2", "o8", "p8", "range", "prior-old", "post2-old", "post8", "path2"], counters: facts(8, POST8, "2.00 ± 0.50"),
      rides: [ride("path2", "a2", "a8", `w ${n2(POST2.m)}`, { then: `w ${n2(POST8.m)}` })],
      body: ["The approach can be used iteratively as knowledge accumulates: today's posterior probabilities become tomorrow's prior probabilities. As more information is collected, the influence of the original prior distribution is usually less.",
        "This is a Bayesian linear model. To obtain a fully probabilistic model, Bayesian regression assumes the output is Gaussian distributed around the linear prediction. In scikit-learn, BayesianRidge gives the coefficients a spherical Gaussian prior.",
        "A Gaussian process extends the idea from a weight to a whole function. Its prediction is probabilistic, so empirical confidence intervals can be computed."],
      claims: ["probabilistic-models-iterate", "probabilistic-models-bayes-linear", "probabilistic-models-gp"],
    }),
    step({
      id: "stubborn", label: "Wrong prior", kind: "watch-out", title: "A prior is an assumption",
      caption: `A confident prior at 3 minutes per item holds the belief at ${n2(FORCED.m)} after the same eight orders. The line sits above every order it has seen.`,
      show: ["o2", "o8", "pb", "range", "post8-old", "bad-prior", "bad-post", "bad-path"], counters: facts(8, FORCED, "3.00 ± 0.10"),
      rides: [ride("bad-path", "b0", "b8", "w 3.00", { then: `w ${n2(FORCED.m)}`, tone: "alert" })],
      body: [`The orders are the same. Only the prior changed, from 2.00 ± 0.50 to 3.00 ± 0.10, and the most probable weight moved from ${n2(POST8.m)} to ${n2(FORCED.m)}. The narrow curve also reports more certainty than the wide prior gave.`,
        "FDA guidance on Bayesian statistics in medical device trials recommends sensitivity analysis to check the robustness of models to different choices of prior distributions.",
        "A stated probability is not always a reliable one. Naive Bayes is known as a decent classifier but a bad estimator, so its probability outputs are not to be taken too seriously."],
      claims: ["probabilistic-models-sensitivity", "probabilistic-models-nb-estimator"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Record the prior with the model",
      caption: "",
      show: ["o2", "o8", "p8", "range", "prior-old", "post8", "path2", "gate"], counters: facts(8, POST8, "2.00 ± 0.50"),
      rides: [ride("path2", "a8", "a8", `w ${n2(POST8.m)}`), ride("to-gate", 0, 0.55, "2.00 ± 0.50")],
      body: [{ pair: {
        left: { label: "Naive Bayes", items: ["Classes from Bayes' rule", "Weak probability estimates"] },
        right: { label: "Gaussian process", items: ["Predictions with intervals", "Kernel sets the prior"] },
      } },
        "Naive Bayes classifiers require a small amount of training data and can be extremely fast compared to more sophisticated methods.",
        "For Gaussian process regression the prior of the process needs to be specified, and its covariance is specified by passing a kernel object. Gaussian processes lose efficiency in high dimensional spaces, namely when the number of features exceeds a few dozens.",
        "The same FDA guidance recommends indicating all prior information used and the assumptions made, and being prepared to justify the choices of prior information. The prior travels with the model into its record."],
      claims: ["probabilistic-models-naive-bayes", "probabilistic-models-nb-estimator", "probabilistic-models-nb-practice", "probabilistic-models-gp", "probabilistic-models-gp-prior", "probabilistic-models-document"],
    }),
  ],
  governance: { text: "A prior is an assumption, so it is recorded like any other design decision. FDA guidance on Bayesian statistics in medical device trials recommends indicating all prior information and assumptions, being prepared to justify them, and checking robustness to different priors.", claims: ["probabilistic-models-document", "probabilistic-models-sensitivity"] },
  closing: {
    pitfalls: [
      "Reporting the most probable value and dropping the spread around it.",
      "Choosing a narrow prior without writing down where it came from.",
      "Reading a classifier's probability output as a measured chance.",
    ],
    questions: [
      "What does the width of the posterior say that a single fitted weight does not?",
      "Why does the prior matter less after eight orders than after two?",
      "Which prior was used, who chose it, and how does the result move under another?",
    ],
  },
});
