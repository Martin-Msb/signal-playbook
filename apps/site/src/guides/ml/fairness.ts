import { band, CANVAS, defineGuide, isoGrid, line, note, pawn, pill, plot, plotPoint, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";
import type { El, PlotEl } from "@signal-path/engine";

// Two boards stand on the floor. At first the left one holds all 200 scored orders behind one threshold.
// Then the boards become the two account groups, each with its own threshold line, and the lines move as the definition of fairness changes.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Orders per score bin of 0.05: genuine orders, then fraudulent ones. New accounts hold 80 genuine and 20 fraud, established accounts 90 and 10. */
const NEW = { genuine: [3, 5, 7, 9, 8, 7, 7, 7, 6, 5, 5, 3, 3, 2, 1, 1, 1, 0, 0, 0], fraud: [0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1] };
const EST = { genuine: [17, 15, 13, 12, 10, 7, 5, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0], fraud: [0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0] };
const ALL = { genuine: NEW.genuine.map((n, i) => n + EST.genuine[i]), fraud: NEW.fraud.map((n, i) => n + EST.fraud[i]) };
type Data = typeof NEW;

const mid = (bin: number) => bin * 0.05 + 0.025;
const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
const dots = (d: Data) => ({
  g: d.genuine.flatMap((n, bin) => Array.from({ length: n }, (_, i) => ({ bin, pt: [mid(bin), i + 0.5] as [number, number] }))),
  f: d.fraud.flatMap((n, bin) => Array.from({ length: n }, (_, i) => ({ bin, pt: [mid(bin), d.genuine[bin] + i + 0.5] as [number, number] }))),
});
/** Rates, in whole per cent, when every order scoring at or above threshold t is flagged. */
const rates = (d: Data, t: number) => {
  const k = Math.round(t * 20), fp = sum(d.genuine.slice(k)), tp = sum(d.fraud.slice(k)), pct = (a: number, b: number) => Math.round((100 * a) / b);
  return { flagged: pct(fp + tp, sum(d.genuine) + sum(d.fraud)), held: pct(fp, sum(d.genuine)), caught: pct(tp, sum(d.fraud)) };
};

const card = (id: string, title: string, top: number, floor: [number, number], group: string): PlotEl =>
  raise(plot(id, 0, 0, 430, 280, [0, 1], [0, top], { title, xt: [0, 0.5, 1], yt: [0, top / 2, top], group }), floor, 30);
const POOL = card("pool", "All 200 orders by fraud score", 24, F1, "pool");
const NEWP = card("new", "New accounts, 100 orders", 20, F1, "split");
const ESTP = card("est", "Established accounts, 100 orders", 20, F2, "split");

type Emph = "equal" | "harm" | "plain";
const TONE = { equal: "track", harm: "alert", plain: "ink" } as const;
const lastIn = (list: { bin: number }[], bin: number) => list.map((d) => d.bin).lastIndexOf(bin);

/** The orders of one board, with the errors emphasised: genuine orders at or above bin k and fraud below it. */
const orders = (id: string, p: PlotEl, d: Data, hot: (bin: number, fraud: boolean) => boolean, labels: [number, number]): El[] => {
  const { g, f } = dots(d), r = p.yr[1] > 20 ? 3.4 : 4.2;
  return [
    series(`${id}-g`, p.id, "points", g.map((o) => o.pt), { hue: "sky", r, tone: "muted", label: "genuine", labelAt: lastIn(g, labels[0]), hot: g.flatMap((o, i) => (hot(o.bin, false) ? [i] : [])), group: id }),
    series(`${id}-f`, p.id, "points", f.map((o) => o.pt), { hue: "rose", r, tone: "muted", label: "fraud", labelAt: lastIn(f, labels[1]), hot: f.flatMap((o, i) => (hot(o.bin, true) ? [i] : [])), group: id }),
  ];
};

/** One board behind one threshold, with its three rates. `emph` sets how each rate reads: equal across the groups, the harm, or plain. */
const cut = (id: string, p: PlotEl, d: Data, t: number, emph: [Emph, Emph, Emph], labels: [number, number]): El[] => {
  const k = Math.round(t * 20), o = rates(d, t), top = p.yr[1];
  const row = (i: number, text: string, e: Emph) => note(`${id}-r${i}`, ...plotPoint(p, 0.985, top * (0.83 - i * 0.105)), text, { tone: TONE[e], strong: e !== "plain", anchor: "end", on: p.id, group: id });
  return [
    band(`${id}-band`, p.id, t, 1, { group: id }),
    rule(`${id}-rule`, p.id, t, { label: `threshold ${t.toFixed(2)}`, w: 3.5, group: id }),
    ...orders(id, p, d, (bin, fraud) => (fraud ? bin < k : bin >= k), labels),
    row(0, `${o.flagged}% flagged`, emph[0]), row(1, `${o.held}% genuine held`, emph[1]), row(2, `${o.caught}% fraud caught`, emph[2]),
  ];
};

/** One board with the thresholds of both definitions drawn. The orders between the two lines get a different decision under each. */
const clash = (id: string, p: PlotEl, d: Data, odds: number, parity: number, labels: [number, number]): El[] => {
  const lo = Math.min(odds, parity), hi = Math.max(odds, parity), a = Math.round(lo * 20), b = Math.round(hi * 20);
  const n = sum(d.genuine.slice(a, b)) + sum(d.fraud.slice(a, b));
  const name = (t: number, text: string, tone: "track" | "ink") => note(`${id}-name-${text}`, ...plotPoint(p, t === lo ? t - 0.015 : t + 0.015, 18.4), `${text} ${t.toFixed(2)}`, { tone, strong: true, anchor: t === lo ? "end" : "start", on: p.id, group: id });
  return [
    band(`${id}-band`, p.id, lo, hi, { tone: "alert", group: id }),
    rule(`${id}-odds`, p.id, odds, { w: 3.5, group: id }),
    rule(`${id}-parity`, p.id, parity, { w: 3.5, tone: "ink", group: id }),
    ...orders(id, p, d, (bin) => bin >= a && bin < b, labels),
    name(odds, "odds", "track"), name(parity, "parity", "ink"),
    note(`${id}-n`, ...plotPoint(p, hi + 0.015, 15.6), `${n} orders differ`, { tone: "alert", strong: true, on: p.id, group: id }),
  ];
};

const pair = (id: string, tNew: number, tEst: number, emph: [Emph, Emph, Emph]): El[] => [...cut(`${id}-new`, NEWP, NEW, tNew, emph, [3, 13]).map((e) => ({ ...e, group: id })), ...cut(`${id}-est`, ESTP, EST, tEst, emph, [0, 10]).map((e) => ({ ...e, group: id }))];
const both = (a: number, b: number) => `${a}% and ${b}%`;
const R = (tNew: number, tEst: number) => { const n = rates(NEW, tNew), e = rates(EST, tEst); return [both(n.flagged, e.flagged), both(n.held, e.held)]; };
const ONE = rates(ALL, 0.5);

export default defineGuide({
  id: "fairness", track: "ml", module: "Selection and trust", slug: "fairness",
  title: "Fairness",
  summary: "A model can perform differently across groups of customers. Demographic parity and equalised odds measure that difference in ways that conflict, so choosing one is a policy decision that group metrics make measurable.",
  forLeads: "Which fairness definition a model must meet is decided by the owner of the outcome. The decision is recorded with the groups compared, the metric and the measured result.",
  status: "draft", minutes: 7,
  counters: ["Thresholds", "Flagged", "Genuine held", "Definition met"],
  whatIf: { label: "What if one threshold served both groups?", step: 1, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, scores and account groups are illustrative",
    label: "Two boards. At first the left one shows 200 orders as dots stacked by fraud score behind one threshold, and the right one is a table of the two account groups. Then each board shows one group: new accounts on the left, established accounts on the right, 100 orders each. Every board has a threshold line and three rates: orders flagged, genuine orders held and fraud caught. The lines move so that first the flag rates match, then the error rates match. Then both pairs of lines are drawn and the orders between them are marked. A fraud model stands in front and sends a threshold to each board.",
    els: [
      POOL, ...cut("one", POOL, ALL, 0.5, ["plain", "harm", "plain"], [3, 13]).map((e) => ({ ...e, group: "pool" })),
      raise(table("mix", 0, 0, 350, ["account", "orders", "fraud"], [["new", "100", "20"], ["established", "100", "10"]],
        { at: [18, 180, 266], rowH: 46, title: "Orders by account age", columnHues: [undefined, undefined, "rose"], group: "pool" }), F2, 100),

      NEWP, ESTP,
      ...pair("same", 0.5, 0.5, ["plain", "harm", "plain"]),
      ...pair("parity", 0.65, 0.35, ["equal", "harm", "plain"]),
      ...pair("odds", 0.6, 0.4, ["plain", "equal", "equal"]),
      ...clash("x-new", NEWP, NEW, 0.6, 0.65, [3, 13]).map((e) => ({ ...e, group: "clash" })),
      ...clash("x-est", ESTP, EST, 0.4, 0.35, [0, 10]).map((e) => ({ ...e, group: "clash" })),

      line("to-left", [G.p(7.1, 7.8), F1], { always: true }),
      line("to-right", [G.p(7.8, 7.1), F2], { always: true }),
      prism("model", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "net", title: "Fraud model", sub: "scores each order", at: "n", always: true }),
      pawn("finance", 12, 3.5, "Finance", "chooses the definition", { group: "owner" }),
      pill("record", G.p(3.2, 12.2), "Fairness assessment", { sub: "groups, metric, result", glyph: "doc", group: "owner" }),
    ],
  },
  steps: [
    step({
      id: "overall", label: "One number", kind: "problem", title: "One overall rate hides the groups",
      caption: "The fraud model flags 200 Vinterhus orders at one threshold. Overall, 12% of genuine orders are held. The figure does not say whose orders they are.",
      show: ["pool"], counters: ["0.50", `${ONE.flagged}%`, `${ONE.held}%`, "not measured"],
      rides: [ride("to-left", 0.15, 0.6, "200 orders", { then: "200 scores" })],
      body: ["The goal of a fairness assessment is to answer which groups of people may be disproportionately negatively impacted by an AI system, and in what ways.",
        "An overall rate cannot answer that. Disaggregated metrics are metrics evaluated on slices of data. Simply aggregating outcomes across high-level categories can be misleading when the data can be further disaggregated.",
        "Here the slices are account groups: orders from accounts opened recently, and orders from established accounts. Fraud is twice as common in the first group."],
      claims: ["fairness-assessment", "fairness-disaggregated"],
    }),
    step({
      id: "groups", label: "Group metrics", kind: "idea", title: "Group metrics show who bears the errors",
      caption: "Split by account age, the same threshold holds 20% of genuine orders from new accounts and 6% from established ones.",
      show: ["split", "same"], counters: ["0.50 and 0.50", ...R(0.5, 0.5), "none"],
      rides: [ride("to-left", 0.15, 0.6, "new", { then: "100 orders" }), ride("to-right", 0.15, 0.6, "established", { then: "100 orders" })],
      body: ["Fairlearn's MetricFrame evaluates a metric on each group and computes the differences and ratios between groups. By default it returns the largest difference and the smallest ratio.",
        "A fairness assessment identifies the types of harm, identifies the groups that might be harmed, quantifies the harms and compares them across the groups. A bias audit is the same measurement made a condition of use: New York City prohibits employers from using an automated employment decision tool unless it has had a bias audit within one year.",
        "Leaving a sensitive attribute out of the model does not remove it. In large feature spaces sensitive attributes are generally redundant given the other features, and a classifier finds a redundant encoding in them.",
        { callout: { label: "Key idea", text: "The model and the threshold are unchanged. Only the question changed: the same errors, counted per group." } }],
      claims: ["fairness-metricframe", "fairness-bias-audit", "fairness-proxy"],
    }),
    step({
      id: "parity", label: "Parity", kind: "mechanism", title: "Demographic parity equalises the flag rate",
      caption: "A threshold per group flags 18% of each. New accounts now have 6% of genuine orders held and established accounts 12%: the burden moved.",
      show: ["split", "parity"], counters: ["0.65 and 0.35", ...R(0.65, 0.35), "demographic parity"],
      rides: [ride("to-left", 0.15, 0.6, "t 0.50", { then: "t 0.65" }), ride("to-right", 0.15, 0.6, "t 0.50", { then: "t 0.35" })],
      body: ["In binary classification, demographic parity refers to equal selection rates across groups: the rate of positive decisions is the same in all of them. Here the selection rate is the share of orders flagged.",
        "Demographic parity looks only at the decisions, never at whether they were right. Achieving it does not automatically mean that the classifier is fair."],
      claims: ["fairness-parity"],
    }),
    step({
      id: "odds", label: "Equalised odds", kind: "mechanism", title: "Equalised odds equalises the error rates",
      caption: "Thresholds of 0.60 and 0.40 give both groups 10% of genuine orders held and 70% of fraud caught. The flag rates part: 22% and 16%.",
      show: ["split", "odds"], counters: ["0.60 and 0.40", ...R(0.6, 0.4), "equalised odds"],
      rides: [ride("to-left", 0.15, 0.6, "t 0.65", { then: "t 0.60" }), ride("to-right", 0.15, 0.6, "t 0.35", { then: "t 0.40" })],
      body: ["Equalised odds requires that the true positive rate and the false positive rate be equal across groups. Each group then experiences the same false negative rate and the same false positive rate.",
        "Equal opportunity is a relaxed version of equalised odds that considers only the positive labels.",
        "Equalised odds may be useful when the historical data holds no measurement or historical bias that needs to be taken into account, and true and false positives are considered roughly equally important."],
      claims: ["fairness-odds"],
    }),
    step({
      id: "conflict", label: "Conflict", kind: "watch-out", title: "Both definitions cannot hold at once",
      caption: "Fraud is twice as common among new accounts, so each definition needs its own thresholds. Six orders are held under one and shipped under the other.",
      show: ["split", "clash"], counters: ["two pairs", "equal or not", "equal or not", "never both"],
      body: ["When the outcome is binary, its rate differs between the groups and the score carries information about it, demographic parity and equalised odds cannot both hold. In the literature the two are called independence and separation.",
        "The result is general. Kleinberg, Mullainathan and Raghavan formalise three fairness conditions and prove that, except in highly constrained special cases, no method can satisfy all three simultaneously.",
        { callout: { label: "Key idea", text: "No better model removes the conflict. It follows from the groups having different fraud rates." } }],
      claims: ["fairness-conflict", "fairness-tradeoffs"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choosing the definition is a policy decision",
      caption: "",
      show: ["split", "odds", "owner"], counters: ["0.60 and 0.40", ...R(0.6, 0.4), "equalised odds, chosen"],
      rides: [ride("to-left", 0.15, 0.6, "equalised odds", { then: "t 0.60" }), ride("to-right", 0.15, 0.6, "equalised odds", { then: "t 0.40" })],
      body: [{ pair: {
        left: { label: "Demographic parity", items: ["Equal flag rates", "Error rates may differ"] },
        right: { label: "Equalised odds", items: ["Equal error rates", "Flag rates may differ"] },
      } },
        "Standards of fairness can be complex and difficult to define, because perceptions of fairness differ among cultures and may shift depending on application. The NIST AI Risk Management Framework has fairness and bias evaluated and the results documented.",
        "Mitigation acts before, during or after training. Pre-processing adjusts the feature space to be uncorrelated with the sensitive attribute, as Fairlearn's CorrelationRemover does. In-training methods work the constraint into the optimisation: Fairlearn's ExponentiatedGradient retrains the wrapped classifier on a sequence of re-weighted datasets. Post-processing adjusts a learned classifier.",
        "The thresholds per group drawn here are post-processing. Fairlearn's ThresholdOptimizer sets a separate threshold for each value of the sensitive feature and needs that feature at deployment time. Its documentation notes that different thresholds per group might be considered disparate treatment under US anti-discrimination law or direct discrimination under EU non-discrimination law, in contexts those laws cover."],
      claims: ["fairness-nist", "fairness-mitigation", "fairness-postprocessing"],
    }),
  ],
  governance: { text: "Article 21 of the EU Charter of Fundamental Rights prohibits discrimination on grounds such as sex, race, disability and age, and the EU AI Act has high-risk systems examine their data for biases that lead to discrimination prohibited under Union law. The NIST AI Risk Management Framework has fairness and bias evaluated and the results documented.", claims: ["fairness-charter", "fairness-ai-act", "fairness-nist"] },
  closing: {
    pitfalls: [
      "Reporting one overall error rate for a model that decides about different groups of people.",
      "Leaving the choice between fairness definitions to whoever tunes the model.",
      "Setting thresholds per group without checking whether the law allows the group to be used in the decision.",
    ],
    questions: [
      "Which rates does demographic parity compare, and which does equalised odds compare?",
      "Why can both not hold when fraud rates differ between the groups?",
      "Who chose the definition for this model, and where is the measured result recorded?",
    ],
  },
});
