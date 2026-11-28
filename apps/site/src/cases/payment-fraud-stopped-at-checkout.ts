import { CANVAS, band, defineGuide, drum, isoGrid, line, list, note, pawn, plot, plotPoint, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";
import type { El, Pt, TreeEl } from "@signal-path/engine";

// The floor: a payment runs down the main rail from the customer through checkout and the scorer to the bank.
// Behind the rail a loop turns payment events into live features. In front of it the bank's chargebacks
// become labels, and a nightly batch trains the model that is deployed back into the scorer.
// The large board on the right is the decision: the rules, then the scores and the threshold.
const G = isoGrid(110, 112, 30);
const BIG: Pt = [814, 304];   // the board beside the bank
const SET: Pt = [111, 398];   // the training set, in front of the main rail
const SIDE: Pt = [850, 510];  // a small card in the front right corner

/** 60 held-out payments per score bin of 0.05: 52 genuine, and 8 fraudulent ones in the bins listed. */
const GENUINE = [12, 9, 7, 6, 4, 3, 3, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const FRAUD = [6, 9, 11, 13, 15, 16, 18, 19];
const mid = (bin: number) => bin * 0.05 + 0.025;
const G_DOTS = GENUINE.flatMap((n, bin) => Array.from({ length: n }, (_, i) => ({ bin, pt: [mid(bin), i + 0.5] as [number, number] })));
const F_DOTS = FRAUD.map((bin) => ({ bin, pt: [mid(bin), GENUINE[bin] + 0.5] as [number, number] }));

const SCORES = raise(plot("scores", 0, 0, 276, 246, [0, 1], [0, 13], { title: "60 held-out payments by score", xt: [0, 0.5, 1], yt: [0], group: "scores" }), BIG, 24);

/** The scored payments with one threshold drawn through them. Errors are emphasised: genuine payments blocked, and fraud passed. */
const cut = (id: string, t: number): El[] => {
  const k = Math.round(t * 20);
  const tp = F_DOTS.filter((d) => d.bin >= k).length, fp = G_DOTS.filter((d) => d.bin >= k).length;
  const at = (x: number, y: number) => plotPoint(SCORES, x, y);
  return [
    band(`${id}-band`, "scores", t, 1, { group: id }),
    rule(`${id}-rule`, "scores", t, { label: `threshold ${t.toFixed(2)}`, w: 3.5, group: id }),
    series(`${id}-g`, "scores", "points", G_DOTS.map((d) => d.pt), { hue: "sky", r: 3.8, tone: "muted", label: "genuine", labelAt: 11, hot: G_DOTS.flatMap((d, i) => (d.bin >= k ? [i] : [])), group: id }),
    series(`${id}-f`, "scores", "points", F_DOTS.map((d) => d.pt), { hue: "rose", r: 3.8, tone: "muted", label: "fraud", labelAt: 0, hot: F_DOTS.flatMap((d, i) => (d.bin < k ? [i] : [])), group: id }),
    note(`${id}-tp`, ...at(0.99, 10.6), `${tp} of 8 frauds blocked`, { tone: "track", strong: true, anchor: "end", on: "scores", group: id }),
    note(`${id}-fp`, ...at(0.99, 9.1), `${fp} genuine blocked`, { tone: "alert", anchor: "end", on: "scores", group: id }),
  ];
};

const trainingSet = (id: string, cols: string[], rows: string[][]) =>
  raise(table(id, 0, 0, 214, cols, rows.map((cells, i) => (i === 2 ? { cells, hot: true } : cells)),
    { at: [8, 62, 114, 167], title: "Training set", mono: true, columnHues: [undefined, undefined, undefined, "rose"], group: id }), SET, 26);

const MONTH = raise(plot("month", 0, 0, 276, 246, [0.4, 6.6], [0, 60], { title: "Each month", xt: [1, 2, 3, 4, 5, 6], xtl: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"], yt: [0], group: "month" }), BIG, 24);
const MODELS = raise(plot("models", 0, 0, 276, 246, [0.4, 4.6], [0, 8], { title: "Frauds caught on held-out rows", xt: [1, 2, 3, 4], xtl: ["logistic", "tree", "forest", "boosted"], yt: [0, 4, 8], yLabel: "of 8", group: "models" }), BIG, 24);
const WHY = raise(plot("why", 0, 0, 276, 246, [0.4, 4.6], [0, 1], { title: "Why order 4472 scored 0.91", xt: [1, 2, 3, 4], xtl: ["base", "pay_1h", "new_dev", "amount"], yt: [0, 0.5, 1], group: "why" }), BIG, 24);
const DRIFT = raise(plot("drift", 0, 0, 276, 246, [1, 12], [0, 1], { title: "Share of fraud caught", xt: [1, 4, 8, 12], yt: [0, 0.5, 1], xLabel: "week", group: "drift" }), BIG, 24);
const ODD = raise(plot("odd", 0, 0, 200, 140, [0, 24], [0, 800], { title: "This card, last 90 days", xt: [0, 12, 24], yt: [0, 400, 800], xLabel: "hour", yLabel: "amount", group: "odd" }), SIDE, 22);
const TREE: TreeEl = { kind: "tree", id: "tree", x: 0, y: 0, w: 200, h: 140, title: "One tree", sub: "of 300", split: "pay_1h > 3", leaves: ["0.03", "0.58"], group: "tree" };
const RUN = [0.07, 0.38, 0.83, 0.91];

export default defineGuide({
  id: "case-payment-fraud-stopped-at-checkout", track: "case", module: "Use cases", slug: "payment-fraud-stopped-at-checkout",
  title: "Payment fraud stopped at checkout",
  summary: "A fraud scorer is assembled piece by piece: chargebacks as labels, live features from a stream, boosted trees, and a threshold. Then a good payment, a stolen card and a stricter threshold run through it.",
  forLeads: "The model produces a score. The threshold that turns the score into a block is a business decision: each setting trades fraud losses against customers turned away, and someone has to own that trade.",
  status: "draft", minutes: 12,
  counters: ["Decides", "Learns from", "Threshold", "Fraud caught, genuine blocked"],
  whatIf: { label: "What if the rules still decided?", step: 0, from: 6 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts, scores and counts are illustrative",
    label: "A payment travels along a rail from the customer through checkout and a scorer to the bank. Behind the rail, payment events loop through a stream processor and an online store back to the scorer. In front, chargebacks from the bank reach a payment history, and a training job sends a model to the scorer. A board on the right shows the rules, then the scored payments with a threshold, the reasons for one score, and the share of fraud caught over time.",
    els: [
      pawn("cust", 0, 0, "Customer", undefined, { always: true }),
      line("m1", [G.p(1.5, 0), G.p(9.4, 0)], { always: true }),
      prism("checkout", 3.4, -0.6, 1.2, 1.2, 14, { hue: "sand", glyph: "globe", title: "Checkout", at: "n", always: true }),
      line("m2", [G.p(10.6, 0), G.p(18, 0)], { always: true }),
      prism("bank", 18, -0.6, 1.2, 1.2, 22, { hue: "sand", glyph: "check", title: "Bank", at: "n", always: true }),

      // Problem: fixed rules decide, and the losses grow.
      prism("rules", 9.4, -0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "lines", title: "Rules", sub: "fixed, by hand", at: "n", group: "rules" }),
      raise(list("b-rules", 0, 0, 276, [{ t: "amount over 500: block", hot: true }, "new country: block", "order at night: block", { t: "12 more, added by hand", mute: true }], { title: "Rules at checkout", rowH: 34, group: "rules-b" }), BIG, 24),
      MONTH,
      series("m-loss", "month", "bars", [[1, 18], [2, 21], [3, 26], [4, 31], [5, 38], [6, 46]], { hue: "rose", group: "month" }),
      series("m-line", "month", "line", [[1, 6], [2, 8], [3, 12], [4, 17], [5, 23], [6, 30]], { tone: "ink", w: 3.5, group: "month" }),
      note("m-k1", ...plotPoint(MONTH, 0.6, 54), "bars: fraud losses", { tone: "alert", strong: true, on: "month", group: "month" }),
      note("m-k2", ...plotPoint(MONTH, 0.6, 47), "line: genuine payments blocked", { strong: true, on: "month", group: "month" }),

      // Architecture: labels and the training set.
      line("cb", [G.p(18.6, 0.6), G.p(18.6, 4.6)], { group: "labels" }),
      drum("hist", 18.6, 5.5, 0.9, 30, { hue: "sky", glyph: "table", title: "Payment history", at: "sw", group: "labels" }),
      trainingSet("set-1", ["order", "amount", "device", "fraud"], [["4468", "640.00", "old", "0"], ["4469", "49.00", "old", "0"], ["4470", "89.00", "new", "1"], ["4466", "212.00", "new", "0"]]),
      trainingSet("set-2", ["amount", "pay_1h", "new_dev", "fraud"], [["640.00", "1", "no", "0"], ["49.00", "1", "no", "0"], ["89.00", "6", "yes", "1"], ["212.00", "2", "yes", "0"]]),

      // Architecture: live features from the event stream, and the log that feeds training.
      line("ev", [G.p(4, -0.6), G.p(4, -6), G.p(6.2, -6)], { group: "stream" }),
      prism("sp", 6.2, -6.6, 1.2, 1.2, 22, { hue: "mint", glyph: "chevrons", title: "Stream processor", sub: "1 hour window", at: "n", group: "stream" }),
      line("agg", [G.p(7.4, -6), G.p(9.1, -6)], { group: "stream" }),
      drum("online", 10, -6, 0.9, 30, { hue: "mint", glyph: "key", title: "Online store", at: "n", group: "stream" }),
      line("feat", [G.p(10, -5.1), G.p(10, -0.6)], { group: "stream" }),
      line("dep", [G.p(17.7, 5.5), G.p(10, 5.5), G.p(10, 0.6)], { group: "stream" }),
      raise(table("paths", 0, 0, 276, ["column", "kept by", "fresh within"], [["amount", "request", "now"], { cells: ["pay_1h", "stream", "seconds"], hot: true }, ["new_dev", "stream", "seconds"], ["fraud", "batch", "weeks"]],
        { at: [12, 104, 178], title: "Three paces", mono: true, rowH: 34, group: "paths" }), BIG, 24),

      // Architecture: training, the candidates and the deployed model.
      prism("train", 11.6, 4.9, 1.2, 1.2, 18, { hue: "violet", glyph: "gear", title: "Training", sub: "nightly batch", at: "sw", group: "train" }),
      MODELS,
      series("mod-bars", "models", "bars", [[1, 4], [2, 3], [3, 5], [4, 6]], { hue: "violet", hot: [3], group: "models" }),
      raise(TREE, SIDE, 22),
      prism("model", 9.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Fraud model", at: "n", group: "model" }),
      SCORES,
      ...cut("sc50", 0.5), ...cut("sc30", 0.3),
      series("o4471", "scores", "points", [[0.325, 5.4]], { r: 5, hot: [0], label: "4471", group: "o4471" }),

      // Execution: the reasons for one score, the card's own history, the analyst and the weeks after launch.
      WHY,
      series("why-bars", "why", "bars", RUN.map((v, i) => [i + 1, v] as [number, number]), { hue: "rose", group: "why" }),
      rule("why-rule", "why", 0.5, { axis: "y", tone: "ink", group: "why" }),
      note("why-t", ...plotPoint(WHY, 0.5, 0.54), "threshold 0.50", { strong: true, on: "why", group: "why" }),
      ...["0.07", "+0.31", "+0.45", "+0.08"].map((t, i) => note(`why-v${i}`, ...plotPoint(WHY, i + 1, RUN[i] + 0.03), t, { anchor: "middle", mono: true, strong: true, on: "why", group: "why" })),
      ODD,
      series("odd-usual", "odd", "points", [[9, 420], [10, 560], [11, 260], [12, 610], [13, 380], [14, 520], [16, 300], [17, 450], [19, 340], [18, 640]], { hue: "sky", r: 4, tone: "muted", label: "usual", group: "odd" }),
      series("odd-now", "odd", "points", [[3, 89]], { hue: "rose", r: 4, tone: "alert", hot: [0], label: "4472", group: "odd" }),
      line("ap", [G.p(13, 0), G.p(13, 1.9)], { w: 3, group: "analyst" }),
      pawn("analyst", 13, 2.4, "Fraud analyst", undefined, { group: "analyst" }),
      DRIFT,
      band("d-band", "drift", 5, 8, { tone: "alert", label: "fraudsters adapt", group: "drift" }),
      series("d-v1", "drift", "line", [[1, 0.75], [2, 0.76], [3, 0.74], [4, 0.73], [5, 0.68], [6, 0.6], [7, 0.52], [8, 0.47]], { tone: "ink", w: 3.5, group: "drift" }),
      series("d-v2", "drift", "line", [[8, 0.47], [9, 0.68], [10, 0.75], [11, 0.77], [12, 0.76]], { w: 4, group: "drift" }),
      note("d-k1", ...plotPoint(DRIFT, 1.3, 0.84), "model v1", { strong: true, on: "drift", group: "drift" }),
      note("d-k2", ...plotPoint(DRIFT, 9.3, 0.52), "model v2", { tone: "track", strong: true, on: "drift", group: "drift" }),
    ],
  },
  steps: [
    step({
      id: "rules", label: "Rules", kind: "problem", phase: "problem", title: "Fixed rules block good customers and pass fraud",
      caption: "Checkout applies rules written by hand. A sofa order of 640 is blocked for its amount. A stolen card spending 89 passes.",
      show: ["rules", "rules-b"], counters: ["fixed rules", "nothing", "none", "4 of 8, 6 of 52"],
      rides: [ride("m1", 0, 0.66, "4468: 640", { then: "blocked", tone: "alert" }), ride("m2", 0.05, 0.72, "4470: 89", { then: "paid", tone: "alert" })],
      body: ["Each rule is a fixed boundary on one field. In the terms of classification, a genuine payment that is blocked is a false positive, and a fraudulent payment that passes is a false negative.",
        { callout: { label: "The gap", text: "A rule looks at one field of one payment. Fraud shows in how a card behaves across payments." } }],
      claims: ["metrics-and-thresholds-threshold"],
    }),
    step({
      id: "losses", label: "Losses", kind: "problem", phase: "problem", title: "Each new rule turns away more good customers",
      caption: "Fraud losses rise every month. Fraud is confirmed weeks later, when the bank returns a chargeback, and each rule added in response blocks more genuine payments.",
      show: ["rules", "month"], counters: ["more rules", "nothing", "none", "4 of 8, 9 of 52"],
      rides: [ride("m1", 0, 0.66, "4475: 520", { then: "blocked", tone: "alert" }), ride("m-line", 0, 0.7, "blocked")],
      body: ["Ground-truth labels for live predictions often arrive after a delay. Here the delay is the time a cardholder takes to dispute a payment.",
        "By the time a rule is written for a pattern, the pattern has moved on."],
      claims: ["labels-and-ground-truth-delay"],
    }),
    step({
      id: "labels", label: "Labels", kind: "mechanism", phase: "architecture", title: "Chargebacks label past payments",
      caption: "Each past payment is one row: its features and a label. The label is the chargeback, the record of what happened. It arrives weeks after the payment.",
      show: ["rules", "rules-b", "labels", "set-1"], counters: ["more rules", "chargebacks", "none", "4 of 8, 9 of 52"],
      rides: [ride("cb", 0, 0.55, "chargeback", { then: "fraud = 1" })],
      concepts: ["labels-and-ground-truth", "features-labels-and-datasets"],
      body: ["A labelled example is one row of features and a label, and labelled examples are what training uses. The label is the answer portion of the example.",
        "Ground truth is the thing that actually happened, and model quality is assessed against it. It is not always completely truthful: records may be incorrect."],
      claims: ["features-labels-and-datasets-example", "features-labels-and-datasets-label", "labels-and-ground-truth-truth", "labels-and-ground-truth-delay"],
    }),
    step({
      id: "features", label: "Features", kind: "mechanism", phase: "architecture", title: "A stream keeps each card's last hour current",
      caption: "Every payment is an event. A stream processor counts them per card over one hour and writes the latest count to an online store. Checkout logs the features it used.",
      show: ["rules", "labels", "set-2", "stream", "paths"], counters: ["more rules", "chargebacks, 3 features", "none", "4 of 8, 9 of 52"],
      rides: [ride("ev", 0, 0.42, "paid 13:58"), ride("feat", 0, 0.43, "pay_1h 1"), ride("dep", 1, 0.25, "features", { then: "logged" })],
      concepts: ["stream-processing", "batch-streaming-and-request-processing", "features-in-production"],
      body: ["A stream is in general infinite, so counts on it are scoped by windows. The window operator is stateful: its state holds the pending count for each card.",
        "An online store keeps only the latest feature values for each key and serves them at low latency. Saving the features used at serving time and training from that log is the best way to train like you serve.",
        "The checkout call is a request, and a serving system cares about request latency. The nightly batch that assembles the training set processes a bounded input and cares about throughput."],
      claims: ["stream-processing-windows", "stream-processing-state", "features-in-production-online-latest", "features-in-production-log-features", "batch-streaming-and-request-processing-serving", "batch-streaming-and-request-processing-bounded"],
    }),
    step({
      id: "model", label: "Model", kind: "mechanism", phase: "architecture", title: "Boosted trees are chosen over a logistic baseline",
      caption: "A nightly batch trains four candidates on the labelled rows. Logistic regression sets the baseline. A forest averages many trees. Boosting adds trees that each correct the last.",
      show: ["rules", "labels", "set-2", "stream", "train", "models", "tree"], counters: ["rules, model trained", "chargebacks, 3 features", "none", "4 of 8, 9 of 52"],
      rides: [ride("dep", 0, 0.8, "labelled rows", { via: [0.43], then: "model v1" })],
      concepts: ["linear-and-logistic-regression", "decision-trees", "bagging-and-random-forests", "gradient-boosting"],
      body: ["A simple model provides baseline metrics against which more complex models are tested. Logistic regression passes a weighted sum of the features through a sigmoid, which yields a probability.",
        "A decision tree is a hierarchy of conditions with a prediction in each leaf. A single tree is unstable: small variations in the data can produce a completely different tree, which ensembles mitigate.",
        "A random forest builds each tree on a bootstrap sample and averages their predictions. A boosted ensemble predicts with the sum of its trees, and each new tree is added to improve the objective given the current prediction. Gradient-boosted trees are the long-standing default for tabular prediction."],
      claims: ["linear-and-logistic-regression-baseline", "linear-and-logistic-regression-sigmoid", "decision-trees-nodes", "decision-trees-unstable", "bagging-and-random-forests-bootstrap", "bagging-and-random-forests-average", "boosting-additive", "boosting-greedy-gradient", "boosted-trees-default"],
    }),
    step({
      id: "threshold", label: "Threshold", kind: "mechanism", phase: "architecture", title: "A threshold turns the score into a decision",
      caption: "The model is deployed behind checkout and scores every payment. Payments at or above 0.50 are blocked: six of eight frauds, and three of 52 genuine payments.",
      show: ["model", "labels", "set-2", "stream", "train", "scores", "sc50"], counters: ["model score", "chargebacks, 3 features", "0.50", "6 of 8, 3 of 52"],
      rides: [ride("dep", 0.5, 0.84, "model v1", { then: "v1 live" })],
      concepts: ["model-deployment", "metrics-and-thresholds"],
      body: ["Online inference is a synchronous request to a model deployed to an endpoint. A new version can first run in shadow: it receives a copy of the requests, and only the production responses are returned to the caller.",
        "A classification threshold is the probability chosen to convert a model's output into a class. A threshold of 0.5 is not a good idea when one kind of error costs more than the other, and the threshold can be chosen to optimise a utility metric that the business defines."],
      claims: ["model-deployment-batch-online", "model-deployment-shadow", "metrics-and-thresholds-threshold", "metrics-and-thresholds-cost"],
    }),
    step({
      id: "good", label: "A good payment", kind: "mechanism", phase: "execution", title: "A sofa payment passes in 40 milliseconds",
      caption: "Order 4471 is for 640. The model reads the card's latest features from the online store, scores the payment 0.34, below the threshold, and the bank authorises it.",
      show: ["model", "labels", "set-2", "stream", "train", "scores", "sc50", "o4471"], counters: ["model score", "chargebacks, 3 features", "0.50", "6 of 8, 3 of 52"],
      rides: [ride("m1", 0, 0.66, "4471: 640"), ride("feat", 0, 0.43, "pay_1h 1"), ride("m2", 0, 0.72, "score 0.34", { then: "approved" })],
      concepts: ["features-in-production", "batch-streaming-and-request-processing", "model-deployment"],
      body: ["At prediction time the serving path retrieves the latest feature values from the online store and hands them to the model. Online inference is used when a request needs a timely answer.",
        "A user-facing serving system cares about request latency: how long it takes to return a response to a request.",
        { callout: { label: "The difference", text: "The rule saw an amount over 500. The model sees the same amount on a card behaving as it always does." } }],
      claims: ["features-in-production-online-latest", "model-deployment-batch-online", "batch-streaming-and-request-processing-serving"],
    }),
    step({
      id: "stolen", label: "A stolen card", kind: "watch-out", phase: "execution", title: "A stolen card is stopped with its reasons",
      caption: "Order 4472 is the card's sixth payment in an hour, from a new device. It scores 0.91 and is blocked, with each feature's contribution recorded. An outlier detector flags it without labels.",
      show: ["model", "labels", "set-2", "stream", "train", "why", "odd"], counters: ["model score", "chargebacks, 3 features", "0.50", "6 of 8, 3 of 52"],
      rides: [ride("m1", 0, 0.66, "4472: 89", { tone: "alert" }), ride("ev", 0, 0.42, "6th in 1 h", { tone: "alert" }), ride("feat", 0, 0.43, "pay_1h 6", { tone: "alert" }), ride("m2", 0, 0.26, "score 0.91", { then: "blocked", tone: "alert" })],
      concepts: ["interpretability", "clustering-and-anomaly-detection"],
      body: ["SHAP assigns each feature an importance value for one prediction. The values sum to the difference between the baseline output and the output being explained: 0.07, then 0.31, 0.45 and 0.08, gives 0.91.",
        "Outlier detection looks for observations that are far from the others and needs no labels. An isolation forest isolates an observation with random splits, and anomalies take noticeably fewer splits to isolate.",
        { callout: { label: "Two detectors", text: "The model knows the fraud that chargebacks have confirmed. The outlier detector flags behaviour that is merely unlike this card." } }],
      claims: ["interpretability-shap", "interpretability-shap-sum", "clustering-and-anomaly-detection-outlier", "clustering-and-anomaly-detection-isolation"],
    }),
    step({
      id: "stricter", label: "A stricter setting", kind: "mechanism", phase: "execution", title: "A lower threshold catches more fraud and blocks more customers",
      caption: "At 0.30 all eight frauds are caught and eleven genuine payments are blocked. Order 4471 is one. The customer is told why, appeals, and an analyst clears it.",
      show: ["model", "labels", "set-2", "stream", "train", "scores", "sc30", "o4471", "analyst"], counters: ["model score", "chargebacks, 3 features", "0.30", "8 of 8, 11 of 52"],
      rides: [ride("m1", 0, 0.66, "4471: 640"), ride("m2", 0, 0.26, "score 0.34", { then: "blocked", tone: "alert" }), ride("m2", 0.26, 0.72, "appeal", { then: "cleared" })],
      concepts: ["metrics-and-thresholds", "interpretability"],
      body: ["Moving the threshold changes the number of positives, true and false together: precision and recall often pull against each other. The setting follows from the cost of each error, and leadership takes responsibility for that decision.",
        "An explanation gives a person grounds to contest an adverse decision. Human review of an automated decision has to be meaningful, carried out by someone with the authority and competence to change it."],
      claims: ["metrics-and-thresholds-trade", "metrics-and-thresholds-cost", "metrics-and-thresholds-owner", "interpretability-aims", "clustering-and-anomaly-detection-meaningful"],
    }),
    step({
      id: "operate", label: "Operate", kind: "decision", phase: "execution", title: "What keeps it catching fraud",
      caption: "",
      show: ["model", "labels", "set-2", "stream", "train", "drift", "analyst"], counters: ["model score, v2", "chargebacks and appeals", "0.50", "6 of 8, 3 of 52"],
      rides: [ride("m2", 0, 0.72, "score 0.41", { then: "missed", tone: "alert" }), ride("cb", 0, 0.55, "chargeback", { then: "fraud = 1" }), ride("dep", 0, 0.84, "model v2"), ride("d-v2", 0, 0.62, "0.75")],
      concepts: ["monitoring-and-drift", "security-and-privacy-of-models", "labels-and-ground-truth"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Chargebacks fed back as labels", "Score drift watched daily", "Retraining, then a shadow run"] },
        right: { label: "Do not rely on", items: ["Accuracy when fraud is rare", "A threshold set once", "Unguarded training data"] },
      } },
        "An evasion attack changes a sample just enough to change the model's prediction. As fraudsters adapt, the process that produces fraud from the inputs changes, which is concept drift.",
        "Real-time ground truth is not typically available, so proxies stand in: the distribution of the model's own predictions can be monitored. Retraining can be triggered by degraded performance or by a significant change in the data.",
        "Labels are an attack surface. Label flipping poisons training with altered labels, and access controls and provenance protect the training data. Where one class is rare, a model that never predicts it still scores high on accuracy."],
      claims: ["security-and-privacy-of-models-evasion", "monitoring-and-drift-concept", "monitoring-and-drift-proxy", "monitoring-and-drift-triggers", "security-and-privacy-of-models-label-flipping", "security-and-privacy-of-models-provenance", "metrics-and-thresholds-imbalance", "labels-and-ground-truth-delay"],
    }),
  ],
  governance: { text: "A blocked customer is told the reason and can contest it before a person with the authority to reverse it. The contribution of each feature is recorded with every block, and the model is monitored in production as fraudsters adapt.", claims: ["interpretability-gdpr-22", "clustering-and-anomaly-detection-meaningful", "interpretability-shap", "monitoring-and-drift-nist-production"] },
  closing: {
    pitfalls: [
      "Judging the model by accuracy when almost every payment is genuine.",
      "Computing a feature one way for training and another way at checkout.",
      "Leaving the threshold where it was set while fraud changes around it.",
    ],
    questions: [
      "Who bears the cost of each kind of error at the current threshold?",
      "How long after a payment is its label known, and what is watched until then?",
      "What can a blocked customer be told, and who can reverse the block?",
    ],
  },
});
