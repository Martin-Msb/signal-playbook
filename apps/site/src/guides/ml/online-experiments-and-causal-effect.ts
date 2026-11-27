import { CANVAS, defineGuide, isoGrid, line, note, pawn, pill, plot, plotPoint, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";
import type { El, Hue, PlotEl } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the comparison: spend per customer in two groups, and the gap between them.
// First the groups come from the logs and chose themselves, then a random split makes them. The right board is the evidence
// behind the gap: the month before, the assignment, the difference with its interval, the guardrail, the effect by segment.
const G = isoGrid(480, 250, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);
const W = 430, H = 300;

/* ---------- the numbers, all illustrative ---------- */

const N = 10000, DAYS = 14, SD = 290;
/** Spend per customer in kr over 14 days. */
const LOGS = { none: 410, clicked: 620 }, BEFORE = { none: 400, clicked: 590 };
const PRE = { control: 448, treatment: 449 }, TEST = { control: 452, treatment: 464 };
const EFFECT = TEST.treatment - TEST.control;
/** Half width of the 95% interval for a difference of two means, after d of the 14 days. */
const half = (d: number) => 1.96 * SD * Math.sqrt(2 / (N * d / DAYS));
/** The difference in spend as it stood at the end of each day. */
const DIFF = [24, 16, -4, 3, 9, 11, 8, 7, 9, 9, 11, 12, 12, EFFECT];
const CLEAR = DIFF.findIndex((v, i) => DIFF.slice(i).every((u, j) => u - half(i + j + 1) > 0)) + 1;
const RETURNS = { control: 8.0, treatment: 9.6, limit: 9.0 };
/** Effect on spend by customer segment, with the share of customers in each. The shares weight the effects to the overall one. */
const SEGMENTS = [{ name: "new", share: 0.2, kr: 42 }, { name: "occasional", share: 0.3, kr: 17 }, { name: "regular", share: 0.35, kr: 2 }, { name: "bulk", share: 0.15, kr: -15 }];
const kr = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} kr`;

/* ---------- the boards ---------- */

const board = (id: string, floor: typeof F1, title: string, xr: [number, number], yr: [number, number], extra: Partial<PlotEl>) => raise(plot(id, 0, 0, W, H, xr, yr, { title, group: id, ...extra }), floor, 30);
const SPEND = { xt: [1, 2], yt: [0, 200, 400, 600], yLabel: "kr per customer" };
const P_LOGS = board("logs", F1, "From the logs, model live", [0.3, 2.7], [0, 820], { ...SPEND, xtl: ["did not click", "clicked"] });
const P_BEFORE = board("before", F2, "Same customers, month before", [0.3, 2.7], [0, 820], { ...SPEND, xtl: ["did not click", "clicked"] });
const P_AB = board("ab", F1, "Spend per customer, 14 days", [0.3, 2.7], [0, 820], { ...SPEND, xtl: ["control", "treatment"] });
const P_DIFF = board("diff", F2, "Treatment minus control", [0, 15], [-40, 80], { xt: [1, 7, 14], yt: [-40, 0, 40, 80], xLabel: "day of the test", yLabel: "kr per customer" });
const P_GUARD = board("guard", F2, "Guardrail: return rate", [0.3, 3.3], [0, 12.5], { xt: [1, 2], xtl: ["control", "treatment"], yt: [0, 4, 8, 12], yLabel: "% of orders returned" });
const P_UP = board("uplift", F2, "Effect by customer segment", [0.4, 4.6], [-30, 60], { xt: [1, 2, 3, 4], xtl: SEGMENTS.map((s) => s.name), yt: [-30, 0, 30, 60], yLabel: "kr per customer" });

/** Two bars with their values, and the gap between them stated above. */
const pair = (id: string, p: PlotEl, values: [number, number], hues: [Hue, Hue], gap: string, tone: "track" | "alert" | "ink", fmt = (v: number) => `${v} kr`, top = 750, gapX = 1.5): El[] => [
  series(`${id}-bars`, p.id, "bars", [[1, values[0]], [2, values[1]]], { hues, group: id }),
  ...values.map((v, i) => note(`${id}-v${i}`, ...plotPoint(p, i + 1, v + top * 0.035), fmt(v), { anchor: "middle", strong: true, on: p.id, group: id })),
  pill(`${id}-gap`, plotPoint(p, gapX, top), gap, { tone, on: p.id, group: id }),
];

const CUSTOMERS = [["c-10482", 37], ["c-10483", 81], ["c-10484", 12], ["c-10485", 64], ["c-10486", 50], ["c-10487", 29], ["c-10488", 93]] as const;

export default defineGuide({
  id: "online-experiments-and-causal-effect", track: "ml", module: "Production", slug: "online-experiments-and-causal-effect",
  title: "Online experiments and causal effect",
  summary: "Logs show which customers spent more, not what the model caused. A controlled experiment assigns customers to the model at random, so the difference between the two groups is the effect of the model.",
  forLeads: "A model earns its place by the difference it causes, measured against a control group. Agree the success metric, the guardrails and the sample size before the test starts, and decide on the result.",
  status: "draft", minutes: 7,
  counters: ["Assignment", "Customers compared", "Measured effect", "Guardrail"],
  whatIf: { label: "What if the logs were trusted?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customers, spend and rates are illustrative",
    label: "Two boards. The left one compares spend per customer in two groups as two bars, with the gap between them stated above. From the logs, customers who clicked a recommendation spend 210 kr more than those who did not, and the right board shows the same customers already spent 190 kr more the month before the model. Then a random split by customer id makes a control and a treatment group that spent the same before the test, and in the test the treatment group spends 12 kr more. The right board then shows that difference day by day inside an interval that narrows until it excludes zero, then the return rate rising past its guardrail limit in the treatment group, and last the effect by customer segment, positive for new customers and negative for bulk buyers.",
    els: [
      P_LOGS, ...pair("logs", P_LOGS, [LOGS.none, LOGS.clicked], ["sand", "violet"], `gap ${kr(LOGS.clicked - LOGS.none)}`, "alert"),
      P_BEFORE, ...pair("before", P_BEFORE, [BEFORE.none, BEFORE.clicked], ["sand", "violet"], `already ${kr(BEFORE.clicked - BEFORE.none)}`, "ink"),

      P_AB,
      ...pair("pre", P_AB, [PRE.control, PRE.treatment], ["sky", "track"], "before the test: no gap", "ink"),
      ...pair("test", P_AB, [TEST.control, TEST.treatment], ["sky", "track"], `effect ${kr(EFFECT)}`, "track"),

      raise(table("assign", 0, 0, 380, ["customer", "hash", "group"], CUSTOMERS.map(([c, h]) => ({ cells: [c, String(h), h < 50 ? "control" : "treatment"], hue: (h < 50 ? "sky" : "track") as Hue })),
        { at: [18, 150, 236], rowH: 31, mono: true, title: "Random assignment", foot: `hash under 50 is control, ${N.toLocaleString("en-GB")} in each group`, group: "assign" }), F2, 30),

      P_DIFF,
      series("zero", "diff", "rule", [], { at: 0, axis: "y", tone: "ink", w: 2, group: "diff" }),
      note("zero-n", ...plotPoint(P_DIFF, 14.7, -11), "no effect", { anchor: "end", strong: true, on: "diff", group: "diff" }),
      series("est", "diff", "line", DIFF.map((v, i) => [i + 1, v] as [number, number]), { w: 4, group: "diff" }),
      series("hi", "diff", "line", DIFF.map((v, i) => [i + 1, v + half(i + 1)] as [number, number]), { tone: "muted", w: 2, group: "interval" }),
      series("lo", "diff", "line", DIFF.map((v, i) => [i + 1, v - half(i + 1)] as [number, number]), { tone: "muted", w: 2, group: "interval" }),
      note("int-n", ...plotPoint(P_DIFF, 3.2, 44), "95% interval", { tone: "muted", strong: true, on: "diff", group: "interval" }),
      pill("int-end", plotPoint(P_DIFF, 9.6, 62), `${kr(EFFECT)}, ±${Math.round(half(DAYS))}`, { tone: "track", to: plotPoint(P_DIFF, 12.4, EFFECT + 3), on: "diff", group: "interval" }),

      P_GUARD,
      ...pair("guard", P_GUARD, [RETURNS.control, RETURNS.treatment], ["sky", "rose"], "limit passed", "alert", (v) => `${v.toFixed(1)}%`, 11.4, 1.2),
      rule("limit", "guard", RETURNS.limit, { axis: "y", tone: "alert", label: `limit ${RETURNS.limit.toFixed(1)}%`, group: "guard" }),

      P_UP,
      series("up-zero", "uplift", "rule", [], { at: 0, axis: "y", tone: "ink", w: 2, group: "uplift" }),
      ...SEGMENTS.flatMap((s, i) => [
        series(`up-l${i}`, "uplift", "line", [[i + 1, 0], [i + 1, s.kr]], { tone: s.kr < 0 ? "alert" : "track", w: 9, group: "uplift" }),
        series(`up-p${i}`, "uplift", "points", [[i + 1, s.kr]], { hue: s.kr < 0 ? "rose" : "track", r: 9, group: "uplift" }),
        note(`up-n${i}`, ...plotPoint(P_UP, i + 1, s.kr < 0 ? s.kr - 11 : s.kr + 7), kr(s.kr), { anchor: "middle", strong: true, tone: s.kr < 0 ? "alert" : "ink", on: "uplift", group: "uplift" }),
      ]),
      pill("up-skip", plotPoint(P_UP, 3.1, 44), "do not treat", { tone: "alert", to: plotPoint(P_UP, 3.9, -8), on: "uplift", group: "uplift" }),

      line("to-left", [G.p(7.1, 7.8), F1], { always: true }),
      line("to-right", [G.p(7.8, 7.1), F2], { always: true }),
      prism("model", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "net", title: "Recommender", sub: "live for everyone", at: "n", group: "live" }),
      prism("split", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "split", title: "Random split", sub: "by customer id", at: "n", group: "exp" }),
      pawn("review", 10.6, 2.6, "Ethics review", "consent checked", { group: "exp" }),
      pill("holdout", G.p(3.5, 12), "5% holdout", { sub: "keeps the old ranking", tone: "track", glyph: "lock", group: "holdout" }),
    ],
  },
  steps: [
    step({
      id: "logs", label: "Logs", kind: "problem", title: "Logs show who spent more, not why",
      caption: "Customers who clicked a recommendation spent 210 kr more than those who did not. The month before the model, the same customers already spent 190 kr more.",
      show: ["logs", "before", "live"], counters: ["self-selected", "6,000 and 14,000", "unknown", "none"],
      rides: [ride("to-left", 0.2, 0.62, "app logs"), ride("to-right", 0.2, 0.62, "last month")],
      body: ["The Vinterhus app shows every customer a new recommendation model. Its logs split customers by whether they clicked a recommendation, and the customers decided that themselves. Heavier buyers click more, so the gap mixes the model with the kind of customer.",
        "Patterns discovered by data mining are correlational, which makes it hard to separate useful, actionable patterns from the rest.",
        { callout: { label: "Key idea", text: "The value of the model is the difference it causes: what these customers spent with it, against what the same customers would have spent without it." } },
        "Nobody can be observed both ways at once. A customer either received the treatment or did not, so the comparison has to be made between groups."],
      claims: ["online-experiments-and-causal-effect-correlational", "online-experiments-and-causal-effect-counterfactual"],
    }),
    step({
      id: "randomise", label: "Randomise", kind: "idea", title: "Random assignment makes two like groups",
      caption: "A hash of each customer id decides control or treatment. Nothing about the customer can influence the split, so the two groups spent the same before the test.",
      show: ["ab", "pre", "assign", "exp"], counters: ["random", "10,000 and 10,000", "none yet", "none"],
      rides: [ride("to-right", 0.2, 0.62, "c-10483", { then: "treatment" }), ride("to-left", 0.2, 0.62, "10,000 each")],
      body: ["In the simplest controlled experiment, often called an A/B test, users are randomly exposed to one of two variants: Control (A) or Treatment (B). The key is random. No factor can influence the decision.",
        "Random assignment neutralises confounding variables by distributing them equally over all values. Heavy and light buyers land in both groups in the same proportion.",
        "A customer must receive a consistent experience throughout the experiment. One way is hash and partition: a hash function is applied to the customer identifier combined with the experiment identifier, which gives randomly distributed numbers as a function of that input.",
        "Before any customer is assigned, the experiment passes an ethics review that asks how customers were told and what the risk to them is."],
      claims: ["online-experiments-and-causal-effect-ab", "online-experiments-and-causal-effect-confounding", "online-experiments-and-causal-effect-hash", "online-experiments-and-causal-effect-consent", "online-experiments-and-causal-effect-waiver"],
    }),
    step({
      id: "effect", label: "Effect", kind: "mechanism", title: "The difference between the groups is the effect",
      caption: "Treatment sees the new model for 14 days and control keeps the old ranking. Treatment spends 12 kr more per customer. The model caused that difference.",
      show: ["ab", "test", "assign", "exp"], counters: ["random", "10,000 and 10,000", kr(EFFECT), "none"],
      rides: [ride("to-left", 0.2, 0.62, "14 days", { then: kr(EFFECT) })],
      body: ["If the experiment is designed and executed properly, the only thing consistently different between the two variants is the change itself, so any difference in the metric is the result of the assignment. That establishes causality.",
        "The metric is chosen before the test. Kohavi and colleagues call it the Overall Evaluation Criterion: a quantitative measure of the experiment's objective. A good one is not short-term focused, such as clicks, and includes factors that predict long-term goals.",
        { callout: { label: "What changed", text: `The logs suggested ${kr(LOGS.clicked - LOGS.none)}. The experiment measures ${kr(EFFECT)}. The rest of the gap was the customers, not the model.` } }],
      claims: ["online-experiments-and-causal-effect-causality", "online-experiments-and-causal-effect-oec"],
    }),
    step({
      id: "chance", label: "Chance", kind: "mechanism", title: "Sample size separates effect and chance",
      caption: "Two random groups never spend exactly the same. Early in the test the interval around the difference spans zero. It narrows as customers accumulate, and by day 14 it excludes zero.",
      show: ["ab", "test", "diff", "interval", "exp"], counters: ["random", "10,000 and 10,000", `${kr(EFFECT)}, ±${Math.round(half(DAYS))}`, "none"],
      rides: [ride("est", 0, 1, "day 1", { via: [0.3], then: "day 14" })],
      body: ["The null hypothesis is that the metric does not differ between the variants and that any observed difference is due to random fluctuations. If zero is inside the confidence interval for the difference, the null hypothesis is not rejected. Otherwise the treatment is concluded to have an effect.",
        "The confidence level is commonly set to 95%, which implies that 5% of the time a difference is concluded when there is none. The standard error of a mean is inversely proportional to the square root of the sample size, so a larger sample, which usually means a longer test, gives more power.",
        `Here the interval excludes zero from day ${CLEAR} onward. The running time was fixed at 14 days before the start.`,
        "An A/A test assigns users to two groups and exposes them to exactly the same experience. It measures the variability needed for power calculations and tests the experimentation system itself: at a 95% confidence level the null hypothesis should be rejected about 5% of the time.",
        "The power, the effect to detect and the variability give the minimum sample size, and from it the running time. Running underpowered experiments is a common mistake."],
      claims: ["online-experiments-and-causal-effect-null", "online-experiments-and-causal-effect-interval", "online-experiments-and-causal-effect-level", "online-experiments-and-causal-effect-aa", "online-experiments-and-causal-effect-sample"],
    }),
    step({
      id: "guardrail", label: "Guardrail", kind: "watch-out", title: "A gain can hide a harm",
      caption: "Return rate is a guardrail metric, one the test must not degrade. In treatment it rises from 8.0% to 9.6%, past the agreed limit, and the rollout pauses.",
      show: ["ab", "test", "guard", "exp"], counters: ["random", "10,000 and 10,000", `${kr(EFFECT)}, ±${Math.round(half(DAYS))}`, "limit passed"],
      rides: [ride("to-right", 0.2, 0.62, "returns", { then: "9.6%", tone: "alert" })],
      body: ["Guardrail metrics measure aspects of the product that should not degrade but will not necessarily improve. Microsoft's experimentation team recommends alerts on business-critical metrics, and automatic shutdown of A/B tests that significantly degrade the product or the user experience.",
        "A treatment can also start small. Kohavi and colleagues describe a ramp-up that begins with a small percentage of users in the treatment and increases it gradually, so that egregious problems are caught and the experiment aborted before many users are exposed.",
        "The split itself is checked too. A sample ratio mismatch typically invalidates the A/B test and makes its results untrustworthy, so it is tested for early, with an alert if one is detected."],
      claims: ["online-experiments-and-causal-effect-guardrail", "online-experiments-and-causal-effect-rampup", "online-experiments-and-causal-effect-srm"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The measured effect decides the rollout",
      caption: "",
      show: ["ab", "test", "uplift", "exp", "holdout"], counters: ["random", "10,000 and 10,000", `${kr(SEGMENTS[3].kr)} to ${kr(SEGMENTS[0].kr)}`, "limit passed"],
      body: [{ pair: {
        left: { label: "Ship to everyone", items: ["Keep a small holdout", "Measures the cumulative effect"] },
        right: { label: "Target by uplift", items: ["Model the effect per customer", "Treat only where it is positive"] },
      } },
        "A holdout keeps a small percentage of users on the original version as a baseline. It measures the cumulative impact of all changes over time by comparing the general population with the holdout group. In GrowthBook the holdout defaults to 5% of traffic.",
        "An uplift model predicts the difference between a customer's behaviour with the treatment and without it. Uplift modelling looks for the persuadables, who respond only if treated, and leaves out the customers with a strong negative response, known as sleeping dogs. Here those are the bulk buyers.",
        "CausalML is a Python package of uplift modelling and causal inference methods. It estimates the conditional average treatment effect from experimental or observational data. The finished experiment is such data: the same customers, with a random treatment.",
        "Controlled experiments have limits. They show which variant is better and by how much, but not why, and they measure the effect during the experimentation period, typically a few weeks."],
      claims: ["online-experiments-and-causal-effect-holdout", "online-experiments-and-causal-effect-holdout-default", "online-experiments-and-causal-effect-uplift", "online-experiments-and-causal-effect-types", "online-experiments-and-causal-effect-causalml", "online-experiments-and-causal-effect-limits"],
    }),
  ],
  governance: { text: "The Menlo Report on the ethics of information and communication technology research holds that participation as a research subject is voluntary and follows from informed consent. Where obtaining consent would make the research impossible, the researcher may seek a waiver from an ethical review board. The rollout decision rests on the measured result: Kohavi and colleagues report significant learning and return on investment when teams listen to their customers, not to the highest paid person's opinion.", claims: ["online-experiments-and-causal-effect-consent", "online-experiments-and-causal-effect-waiver", "online-experiments-and-causal-effect-hippo"] },
  closing: {
    pitfalls: [
      "Reading a gap between self-selected groups in the logs as the effect of the model.",
      "Running a test too small to detect the effect that matters.",
      "Shipping on the success metric while a guardrail metric degrades.",
    ],
    questions: [
      "Why does random assignment remove the difference between heavy and light buyers?",
      "What does it mean when the interval around the difference includes zero?",
      "Which metrics must not degrade, and who agreed their limits before the test?",
    ],
  },
});
