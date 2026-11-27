import { CANVAS, defineGuide, isoGrid, line, note, pawn, plot, plotPoint, prism, raise, ride, series, step, stop, table } from "@signal-path/engine";

// Two boards stand on the floor. The left one plots packed orders by size and packing time, with the current model
// drawn through them: a fixed rule, then a fitted line, then a curve that memorises. The right one holds what the
// model is given at each stop: the recorded decision, the labelled examples, a new order, and a second task.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Packed orders: number, items in the order and minutes to pack it. */
const EXAMPLES: [string, number, number][] = [["4468", 1, 3.0], ["4469", 2, 5.4], ["4470", 3, 6.6], ["4471", 4, 9.6], ["4472", 6, 12.4], ["4473", 7, 15.2], ["4474", 8, 16.0], ["4475", 10, 20.6]];
const XY = EXAMPLES.map(([, x, y]) => [x, y] as [number, number]);
/** Least squares line through the examples. */
const fit = (x: number) => 1.3 + 1.912 * x;
/** The degree seven polynomial that passes through all eight examples. */
const memo = (x: number) => XY.reduce((s, [xi, yi], i) => s + yi * XY.reduce((m, [xj], j) => (j === i ? m : (m * (x - xj)) / (xi - xj)), 1), 0);
const CURVE = Array.from({ length: 37 }, (_, i) => [1 + i * 0.25, memo(1 + i * 0.25)] as [number, number]);
/** Order 4480: nine items, 18.2 minutes once packed. */
const NEW_X = 9, NEW_Y = 18.2;

const DATA = raise(plot("data", 0, 0, 430, 280, [0, 11], [0, 24], { title: "Packed orders", xt: [0, 2, 4, 6, 8, 10], yt: [0, 6, 12, 18, 24], xLabel: "items", yLabel: "minutes to pack", always: true }), F1, 30);
const TASK = raise(plot("task", 0, 0, 430, 280, [0, 400], [0, 10], { title: "Returned or kept", xt: [0, 100, 200, 300, 400], yt: [0, 2, 4, 6, 8, 10], xLabel: "amount", yLabel: "days to deliver", group: "classify" }), F2, 30);

/** Past orders for the second task: amount and days to deliver. */
const KEPT: [number, number][] = [[40, 2], [70, 5], [95, 1.5], [120, 6.2], [150, 3.2], [185, 1.2], [215, 4], [250, 2.2], [290, 1.4], [330, 2]];
const RETURNED: [number, number][] = [[150, 8.2], [200, 7.2], [235, 9], [270, 5.6], [305, 7.6], [335, 4.6], [365, 6.4], [375, 3.6]];

const examples = (id: string, hot?: number) => raise(table(id, 0, 0, 380, ["order", "items", "minutes"],
  EXAMPLES.map(([o, x, y], i) => ({ cells: [o, String(x), y.toFixed(1)], hot: i === hot })),
  { at: [16, 140, 250], rowH: 30, title: "Labelled examples", sub: "feature: items, label: minutes", columnHues: [undefined, "sky", "mint"], mono: true, group: id }), F2, 30);
const card = (id: string, title: string, rows: string[][]) => raise(table(id, 0, 0, 340, ["field", "value"], rows, { at: [16, 190], rowH: 40, title, group: id }), F2, 30);
const OPS: [number, number] = [12.43, 4.1];

export default defineGuide({
  id: "learning-from-examples", track: "ml", module: "Foundations", slug: "learning-from-examples",
  title: "Learning from examples",
  summary: "A model is a function fitted to examples that carry the answer, so that it predicts well for examples it has never seen. Predicting a number is regression, and predicting a category is classification.",
  forLeads: "Start with a rule and measure it: the rule is the baseline a model has to beat. Decide and record whether the decision should be automated, and what the model is for, before anyone trains one.",
  status: "draft", minutes: 7,
  counters: ["Model", "Examples used", "Average miss", "Order 4480"],
  whatIf: { label: "What if the model memorised the examples?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "Two boards. The left one plots eight packed orders by number of items and minutes to pack. A flat rule of 10 minutes misses most of them. Training fits a line through the orders, and the line estimates 18.5 minutes for a new order of nine items. A curve that passes through every order estimates 10.4 minutes for the same order, which took 18.2. The right board shows in turn the recorded intended use, the labelled examples, the new order, and a second chart where a line separates returned orders from kept ones.",
    els: [
      DATA,
      series("orders", "data", "points", XY, { hue: "sky", r: 6, always: true }),

      ...XY.map(([x, y], i) => series(`rule-r${i}`, "data", "line", [[x, 10], [x, y]], { tone: "alert", w: 2, dashed: true, group: "rule" })),
      series("rule-l", "data", "line", [[0, 10], [11, 10]], { tone: "ink", w: 4, group: "rule" }),
      note("rule-eq", DATA.x + 50, DATA.y + 46, "minutes = 10", { strong: true, mono: true, on: "data", group: "rule" }),
      series("cx", "data", "line", [[3, 0], [3, 6.6]], { tone: "muted", w: 2, dashed: true, group: "one" }),
      series("one", "data", "points", [[3, 6.6]], { r: 7, hot: [0], group: "one" }),

      ...XY.map(([x, y], i) => series(`fit-r${i}`, "data", "line", [[x, fit(x)], [x, y]], { tone: "alert", w: 2, dashed: true, group: "fit" })),
      series("fit-l", "data", "line", [[0, fit(0)], [11, fit(11)]], { w: 4, group: "fit" }),
      note("fit-eq", DATA.x + 50, DATA.y + 46, "minutes = 1.91 × items + 1.30", { strong: true, mono: true, tone: "track", on: "data", group: "fit" }),
      stop("fit-0", ...plotPoint(DATA, 0, fit(0)), undefined, undefined, { group: "anchor" }),
      stop("fit-9", ...plotPoint(DATA, NEW_X, fit(NEW_X)), undefined, undefined, { group: "anchor" }),
      series("nx", "data", "line", [[NEW_X, 0], [NEW_X, fit(NEW_X)]], { tone: "muted", w: 2, dashed: true, group: "ask" }),

      series("ghost", "data", "line", [[0, fit(0)], [11, fit(11)]], { tone: "muted", w: 2, dashed: true, group: "memo" }),
      series("memo-l", "data", "line", CURVE, { tone: "alert", w: 4, group: "memo" }),
      note("memo-eq", DATA.x + 50, DATA.y + 46, "through every example", { strong: true, tone: "alert", on: "data", group: "memo" }),
      stop("memo-0", ...plotPoint(DATA, 1, memo(1)), undefined, undefined, { group: "anchor" }),
      stop("memo-8", ...plotPoint(DATA, 8, memo(8)), undefined, undefined, { group: "anchor" }),
      stop("memo-9", ...plotPoint(DATA, NEW_X, memo(NEW_X)), undefined, undefined, { group: "anchor" }),
      series("packed", "data", "points", [[NEW_X, NEW_Y]], { r: 7, hot: [0], label: "4480", group: "packed" }),

      card("record", "Decided and recorded", [["Automate", "the estimate only"], ["Intended use", "plan packing shifts"], ["Not for", "rating staff"], ["Baseline", "10 min an order"]]),
      examples("ex-one", 2), examples("ex-all"),
      card("new", "New order", [["order", "4480"], ["items", "9"], ["minutes", "?"]]),
      card("test", "Order 4480, packed", [["items", "9"], ["line estimate", "18.5"], ["curve estimate", "10.4"], ["minutes", "18.2"]]),

      TASK,
      series("kept", "task", "points", KEPT, { hue: "sky", r: 6, tone: "muted", label: "kept", labelAt: 0, group: "classify" }),
      series("returned", "task", "points", RETURNED, { hue: "sand", r: 6, tone: "muted", label: "returned", labelAt: 2, group: "classify" }),
      series("edge", "task", "line", [[130, 8.25], [400, 1.5]], { w: 4, group: "classify" }),
      series("tx", "task", "line", [[120, 0], [120, 3.6]], { tone: "muted", w: 2, dashed: true, group: "classify" }),
      series("t-new", "task", "points", [[120, 3.6]], { r: 7, hot: [0], group: "classify" }),

      line("in", [F2, G.p(7.8, 7.1)], { group: "train" }),
      line("out", [G.p(7.1, 7.8), F1], { group: "train" }),
      prism("train", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "loop", title: "Training", sub: "fits a function", at: "n", group: "train" }),
      pawn("ops-rule", ...OPS, "Operations", "10 minutes an order", { group: "ops-rule" }),
      pawn("ops-timed", ...OPS, "Operations", "8 orders, timed", { group: "ops-timed" }),
      pawn("ops", ...OPS, "Operations", undefined, { group: "ops" }),
      pawn("ops-ask", ...OPS, "Operations", "9 items: how long?", { group: "ops-ask" }),
      pawn("ops-took", ...OPS, "Operations", "it took 18.2 min", { group: "ops-took" }),
      pawn("ops-back", ...OPS, "Operations", "returned or kept?", { group: "ops-back" }),
    ],
  },
  steps: [
    step({
      id: "rule", label: "One rule", kind: "problem", title: "A fixed rule misses most orders",
      caption: "Operations estimates packing at 10 minutes an order, and misses small and large orders. Whether to automate the estimate, and its intended use, is recorded first. The rule stays as the baseline.",
      show: ["rule", "record", "ops-rule"], counters: ["fixed rule", "none", "5.0 min", "not placed"],
      rides: [ride("rule-l", 0, 1, "10 min", { via: [0.5] })],
      body: ["The dashed lines are the misses: the gap between the rule's 10 minutes and the time each order took. Across the eight orders the average miss is 5.0 minutes.",
        "The rule is a rule-based baseline. A baseline is a model used as a reference point for comparing how well another model is performing. A non-ML solution is the benchmark that shows whether machine learning is a good use case for the problem, and where none exists the first step is to solve the problem manually with a heuristic.",
        "Google's Rules of Machine Learning open with the same advice: do not be afraid to launch a product without machine learning, and if it is not absolutely required, do not use it until there is data. A simple heuristic gets a product out of the door and a complex one is unmaintainable.",
        { callout: { label: "Before any model", text: "The NIST AI Risk Management Framework has the intended purposes and the settings in which an AI system will be deployed understood and documented. That context informs an initial go/no-go decision about whether to design, develop or deploy the system at all." } }],
      claims: ["learning-from-examples-baseline", "learning-from-examples-benchmark", "learning-from-examples-no-ml-first", "learning-from-examples-heuristic", "learning-from-examples-intended-use", "learning-from-examples-go-no-go"],
    }),
    step({
      id: "examples", label: "Examples", kind: "idea", title: "Past orders are examples with answers",
      caption: "Each packed order is an example. Its features describe it, and its label is the answer. Learning from labelled examples is supervised learning.",
      show: ["rule", "one", "ex-one", "ops-timed"], counters: ["fixed rule", "8 labelled", "5.0 min", "not placed"],
      rides: [ride("cx", 0, 1, "3 items", { then: "6.6 min" })],
      body: ["A dataset is made up of examples that contain features and a label. Features are the values a supervised model uses to predict the label, and the label is the answer. Order 4470 has one feature, 3 items, and the label 6.6 minutes.",
        "Supervised learning models make predictions after seeing lots of data with the correct answers and discovering the connections in the data that produce those answers.",
        "Two other kinds of learning work without labelled answers. An unsupervised learning model aims to identify meaningful patterns in a dataset, for example by clustering similar data into groups. Clustering differs from classification because the categories are not defined by the practitioner.",
        "Reinforcement learning models make predictions by getting rewards or penalties based on actions performed within an environment. The system generates a policy that defines the best strategy for getting the most rewards."],
      claims: ["learning-from-examples-example", "learning-from-examples-supervised", "learning-from-examples-unsupervised", "learning-from-examples-reinforcement"],
    }),
    step({
      id: "train", label: "Training", kind: "mechanism", title: "Training fits a function to the examples",
      caption: "Training searches for the line that predicts the eight examples best on average. That fitted function is the model: items go in, minutes come out.",
      show: ["fit", "ex-all", "train", "ops"], counters: ["fitted line", "8 labelled", "0.4 min", "not placed"],
      rides: [ride("in", 0.15, 0.5, "8 examples"), ride("out", 0.2, 0.6, "model")],
      body: ["Machine learning is the process of training a piece of software, called a model, to make useful predictions. In supervised learning the model is the collection of numbers that define the mathematical relationship from input feature patterns to output label values.",
        "Here the model is two numbers: 1.91 minutes for each item and 1.30 minutes for every order. To train a model, it is given a dataset with labelled examples. It compares its predicted value with each label's actual value and arrives at a solution that makes the best predictions, on average, for each of the examples.",
        { callout: { label: "Key idea", text: "Nobody wrote this rule. The numbers came from the examples, and the average miss fell from 5.0 minutes to 0.4." } }],
      claims: ["learning-from-examples-ml", "learning-from-examples-model", "learning-from-examples-training"],
    }),
    step({
      id: "predict", label: "New order", kind: "mechanism", title: "The model predicts an order it never saw",
      caption: "Order 4480 has 9 items and no label. The model returns 18.5 minutes. Predicting a number is regression, and predicting well on new data is generalisation.",
      show: ["fit", "ask", "new", "train", "ops-ask"], counters: ["fitted line", "8 labelled", "0.4 min", "18.5 min"],
      rides: [ride("fit-l", "fit-0", "fit-9", "9 items", { then: "18.5 min" })],
      body: ["A trained model makes predictions, called inferences, on unlabelled examples. No example had 9 items. The model answers from the relationship it learned, not from a stored order.",
        "A regression model predicts a numeric value. Generalisation is a model's ability to make correct predictions on new, previously unseen data. The model learns the relationship between the features and the label so that it can make the best predictions on unseen data."],
      claims: ["learning-from-examples-inference", "learning-from-examples-regression", "learning-from-examples-generalisation", "learning-from-examples-unseen"],
    }),
    step({
      id: "memorise", label: "Memorising", kind: "watch-out", title: "A model can memorise its examples",
      caption: "This curve passes through all eight examples, then estimates 10.4 minutes for order 4480. Packing took 18.2. That is overfitting. Test a model on examples it did not train on.",
      show: ["memo", "packed", "test", "train", "ops-took"], counters: ["memorising curve", "8 labelled", "0.0 min", "10.4, took 18.2"],
      rides: [ride("memo-l", "memo-0", "memo-9", "9 items", { via: ["memo-8"], then: "10.4 min", tone: "alert" })],
      body: ["Overfitting means creating a model that matches, or memorises, the training set so closely that it fails to make correct predictions on new data. An overfit model makes excellent predictions on the training set but poor predictions on new data.",
        "The curve has an average miss of 0.0 minutes on the eight examples and misses order 4480 by 7.8 minutes. The fitted line, dashed here, misses it by 0.3.",
        "A model should be tested against a different set of examples than those used to train it. Traditionally those examples come from splitting the original dataset, which keeps a test set for evaluating the trained model. In evaluation the model is given only the features, and its predictions are compared with the labels' true values."],
      claims: ["learning-from-examples-overfitting", "learning-from-examples-test", "learning-from-examples-evaluate"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The target sets the task",
      caption: "",
      show: ["fit", "packed", "classify", "train", "ops-back"], counters: ["fitted line", "8 labelled", "0.4 min", "18.5, took 18.2"],
      rides: [ride("tx", 0, 1, "4480", { then: "kept" })],
      body: [{ pair: {
        left: { label: "Regression", items: ["Predicts a number", "Minutes to pack"] },
        right: { label: "Classification", items: ["Predicts a category", "Returned or kept"] },
      } },
        "A regression model predicts a numeric value. Classification models predict the likelihood that something belongs to a category.",
        "The right board is a second supervised task on past orders. The features are the amount and the days to deliver, and the label is a category: returned or kept. Training fits a line that separates the two, and order 4480 falls on the kept side."],
      claims: ["learning-from-examples-regression", "learning-from-examples-classification"],
    }),
  ],
  governance: { text: "Whether a decision should be automated at all is settled before a model is trained. The NIST AI Risk Management Framework has the intended purposes of an AI system understood and documented, and uses that context for an initial go/no-go decision about whether to design, develop or deploy it.", claims: ["learning-from-examples-intended-use", "learning-from-examples-go-no-go"] },
  closing: {
    pitfalls: [
      "Training a model before measuring what a simple rule achieves.",
      "Judging a model by its error on the examples it was trained on.",
      "Building a model whose intended use nobody wrote down.",
    ],
    questions: [
      "What do the features and the label of an example each hold?",
      "Why is a model tested on examples it did not train on?",
      "What separates a regression task from a classification task?",
    ],
  },
});
