import { CANVAS, defineGuide, isoGrid, line, note, pill, plot, plotPoint, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the data with the model drawn through it.
// The right one is the loss for every possible weight, and the current weight is a record on that curve.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0);

/** Orders: items in the order and minutes to pack it. */
const ORDERS: [number, number][] = [[1, 2.6], [2, 3.4], [3, 6.5], [4, 7.6], [5, 10.4], [6, 11.5], [7, 14.6], [8, 15.4]];
/** Mean squared error of the model minutes = w × items on those orders. */
const mse = (w: number) => 25.5 * w * w - 101.425 * w + 101.1325;

const DATA = raise(plot("data", 0, 0, 430, 280, [0, 9], [0, 18], { title: "Orders and the model", xt: [0, 3, 6, 9], yt: [0, 6, 12, 18], xLabel: "items", yLabel: "minutes to pack", always: true }), F1, 30);
const LOSS = raise(plot("loss", 0, 0, 430, 280, [0, 4.2], [0, 110], { title: "Loss for every weight", xt: [0, 1, 2, 3, 4], yt: [0, 50, 100], xLabel: "weight", yLabel: "mean squared error", group: "loss" }), F2, 30);

/** The model line for one weight, with the misses drawn from each order to the line. */
const model = (id: string, w: number, tone: "track" | "alert" = "track") => [
  ...ORDERS.map(([x, y], i) => series(`${id}-r${i}`, "data", "line", [[x, Math.min(18, w * x)], [x, y]], { tone: "alert", w: 2, dashed: true, group: id })),
  series(`${id}-l`, "data", "line", [[0, 0], [Math.min(9, 18 / w), Math.min(18, 9 * w)]], { tone, w: 4, group: id }),
  note(`${id}-eq`, DATA.x + 50, DATA.y + 46, `minutes = ${w.toFixed(2)} × items`, { strong: true, mono: true, tone, on: "data", group: id }),
];
/** A hidden marker on the loss curve, so a record can be sent to an exact weight. */
const at = (id: string, w: number) => stop(id, ...plotPoint(LOSS, w, mse(w)), undefined, undefined, { group: "anchor" });
const GOOD = [0.5, 1.259, 1.631, 1.814, 1.903, 1.989], HIGH = [0.5, 3.538, 0.378, 3.664, 0.247];

export default defineGuide({
  id: "loss-and-optimisation", track: "ml", module: "Foundations", slug: "loss-and-optimisation",
  title: "Loss and optimisation",
  summary: "Training is a search for the weights that make a model least wrong. A loss measures the error, and gradient descent walks downhill on it.",
  forLeads: "The loss is a choice: it decides which errors the model works hardest to avoid. Step size and batch size decide how long training takes.",
  status: "draft", minutes: 7,
  counters: ["Weight", "Loss", "Learning rate", "Steps taken"],
  whatIf: { label: "What if the learning rate were too high?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "Two charts. The left one plots orders by size and packing time, with the model's line through them. The right one plots the loss for every possible weight as a bowl-shaped curve. A record marks the current weight on the curve and moves downhill as the line on the left comes to fit the orders.",
    els: [
      DATA,
      series("orders", "data", "points", ORDERS, { hue: "sky", always: true }),
      ...model("m0", 0.5), ...model("m1", 1.26), ...model("m2", 1.99), ...model("mx", 0.25, "alert"),

      LOSS,
      series("curve", "loss", "line", Array.from({ length: 21 }, (_, i) => [i * 0.2, mse(i * 0.2)] as [number, number]), { tone: "ink", w: 3, smooth: true, group: "loss" }),
      rule("best", "loss", 1.989, { tone: "muted", label: "lowest loss", group: "loss" }),
      series("descent", "loss", "line", GOOD.map((w) => [w, mse(w)] as [number, number]), { w: 4, group: "path" }),
      series("bounce", "loss", "line", HIGH.map((w) => [w, mse(w)] as [number, number]), { tone: "alert", w: 4, group: "bounce" }),
      ...GOOD.map((w, i) => at(`g${i}`, w)), at("h01", 1.0), ...HIGH.map((w, i) => at(`b${i}`, w)),
      pill("never", plotPoint(LOSS, 1.989, 40), "never converges", { tone: "alert", on: "loss", group: "bounce" }),

      line("to-gd", [F1, G.p(7.1, 7.8)], { group: "gd" }),
      line("from-gd", [G.p(7.8, 7.1), F2], { group: "gd" }),
      prism("gd", 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "loop", title: "Gradient descent", sub: "moves the weight downhill", at: "n", group: "gd" }),
    ],
  },
  steps: [
    step({
      id: "wrong", label: "First guess", kind: "problem", title: "A model starts wrong",
      caption: "Vinterhus wants packing time from order size. A model with one weight draws a line through the orders. The first weight is a guess, and every prediction misses.",
      show: ["m0"], counters: ["0.50", "56.8", "not set", "0"],
      body: ["The model is one multiplication: minutes equals weight times items. With a weight of 0.50 the line lies far below the orders. The dashed lines are the misses.",
        "Loss is a numerical metric that describes how wrong a model's predictions are."],
      claims: ["loss-and-optimisation-loss"],
    }),
    step({
      id: "loss", label: "Loss", kind: "idea", title: "Loss is one number",
      caption: "Square each miss and take the average. That is the mean squared error, a single number for how wrong the model is. Every weight has its own loss, which draws a curve.",
      show: ["m0", "loss"], counters: ["0.50", "56.8", "not set", "0"],
      rides: [ride("curve", "g0", "g0", "loss 56.8")],
      body: ["Mean squared error is the average, across the examples, of the squared difference between the predicted and the actual values.",
        { callout: { label: "Key idea", text: "Training is a search along this curve for the weight with the lowest loss." } }],
      claims: ["loss-and-optimisation-mse", "loss-and-optimisation-loss"],
    }),
    step({
      id: "step", label: "One step", kind: "mechanism", title: "Step downhill",
      caption: "Gradient descent reads the slope of the loss at the current weight and moves the weight a small amount in the direction that reduces loss.",
      show: ["m1", "loss", "gd", "path"], counters: ["1.26", "13.9", "0.01", "1"],
      rides: [ride("descent", "g0", "g1", "w 0.50", { via: ["h01"], then: "w 1.26" })],
      body: ["The slope at a weight of 0.50 is steep and negative, so the weight moves up. One step takes it to 1.26 and the loss from 56.8 to 13.9."],
      claims: ["loss-and-optimisation-step", "loss-and-optimisation-descent"],
    }),
    step({
      id: "repeat", label: "Repeat", kind: "mechanism", title: "Repeat until the loss is lowest",
      caption: "Each new weight has a new slope, so the step is taken again. The weight settles where the loss is lowest, and the line fits the orders.",
      show: ["m2", "loss", "gd", "path"], counters: ["1.99", "0.28", "0.01", "10"],
      rides: [ride("descent", "g1", "g5", "w 1.26", { via: ["g4"], then: "w 1.99" })],
      body: ["Gradient descent iteratively finds the weights that produce the model with the lowest loss. The steps shrink as the slope flattens."],
      claims: ["loss-and-optimisation-descent"],
    }),
    step({
      id: "rate", label: "Learning rate", kind: "watch-out", title: "The learning rate sets the step",
      caption: "The learning rate scales every step. Too low, the model can take a long time to converge. Too high, each step jumps across the valley and the model never converges.",
      show: ["mx", "loss", "gd", "bounce"], counters: ["0.25", "77.6", "0.04", "4"],
      rides: [ride("bounce", "b0", "b4", "rate 0.04", { via: ["b1", "b2", "b3"], tone: "alert" })],
      body: ["With a learning rate of 0.04 the same starting weight overshoots the lowest point, lands higher on the far side and overshoots again. After four steps the loss is 77.6, worse than the first guess."],
      claims: ["loss-and-optimisation-rate"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Two settings to choose",
      caption: "",
      show: ["m2", "loss", "gd", "path"], counters: ["1.99", "0.28", "0.01", "10"],
      rides: [ride("descent", "g5", "g5", "w 1.99")],
      body: [{ pair: {
        left: { label: "Learning rate", items: ["Too low: slow to converge", "Too high: never converges"] },
        right: { label: "Batch size", items: ["One example: stochastic gradient descent", "Some examples: mini-batch"] },
      } },
        "Stochastic gradient descent uses a single example per iteration. Mini-batch stochastic gradient descent uses more than one example and fewer than all of them.",
        "Adam is a widely used optimiser based on adaptive estimates of lower-order moments of the gradient."],
      claims: ["loss-and-optimisation-rate", "loss-and-optimisation-batch", "loss-and-optimisation-adam"],
    }),
  ],
  governance: { text: "The loss decides which errors matter. Squared error penalises an outlier far more than absolute error, so choosing it is a decision about how outliers are treated.", claims: ["loss-and-optimisation-outliers"] },
  closing: {
    pitfalls: [
      "Raising the learning rate to save time until the loss stops falling.",
      "Choosing a loss without asking which errors matter.",
      "Comparing two runs that used different batch sizes as if only the model changed.",
    ],
    questions: [
      "What does one step of gradient descent change?",
      "What happens when the learning rate is too high?",
      "Why does squared error penalise an outlier more than absolute error?",
    ],
  },
});
