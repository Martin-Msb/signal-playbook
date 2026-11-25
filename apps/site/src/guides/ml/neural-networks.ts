import { CANVAS, defineGuide, isoGrid, layers, line, note, pill, plot, plotPoint, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";
import type { El, Pt } from "@signal-path/engine";

// Two boards stand on the floor. The left one is the model drawn as a network of units.
// The right one plots the orders with the function that network computes.
// Order 4471 rides the connections forwards, and the corrections ride them backwards.
// Between the boards the loss compares the two, and the error returns to the network along the left rail.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.4), F2 = G.p(7.4, 0), V = G.p(7.4, 7.4);

/** Training orders: items in the order and minutes to pack it. Above eight items an order ships on a pallet. */
const ORDERS: [number, number][] = [[1, 2.6], [2, 3.4], [3, 6.5], [4, 7.6], [5, 10.4], [6, 11.5], [7, 14.6], [8, 15.4], [10, 17.2], [12, 15.9], [14, 18.7], [16, 16.6]];
/** Orders kept out of training. */
const HELD: [number, number][] = [[2, 4.9], [5, 9.1], [9, 15.8], [12, 17.8], [14, 16.9], [16, 18.0]];

/** The least squares line through the training orders. */
const LINE = (x: number) => 1.0457 * x + 4.0317;
/** One input, two ReLU units, one output. */
interface W { w1: number; b1: number; w2: number; b2: number; v1: number; v2: number; c: number }
const relu = (z: number) => Math.max(0, z);
const net = (p: W) => (x: number) => p.v1 * relu(p.w1 * x + p.b1) + p.v2 * relu(p.w2 * x + p.b2) + p.c;
/** The weights as first set, after one step of gradient descent at a learning rate of 0.001, and after 10,000 steps. */
const P0: W = { w1: 0.6, b1: 0.2, w2: 0.5, b2: -6, v1: 0.9, v2: -0.8, c: 0.5 };
const P1: W = { w1: 0.71803, b1: 0.21307, w2: 0.46004, b2: -6.00269, v1: 0.98159, v2: -0.79516, c: 0.51452 };
const P2: W = { w1: 1.3253, b1: -0.0629, w2: 0.7525, b2: -6.4332, v1: 1.4675, v2: -2.5174, c: 0.341 };
/** The function of a network as a polyline: it only turns where a unit crosses zero. */
const curve = (p: W): [number, number][] =>
  [0, -p.b1 / p.w1, -p.b2 / p.w2, 17].filter((x) => x >= 0 && x <= 17).sort((a, b) => a - b).map((x) => [x, net(p)(x)]);

const DATA = raise(plot("data", 0, 0, 420, 280, [0, 17], [0, 24], { title: "Orders and the model", xt: [0, 4, 8, 12, 16], yt: [0, 8, 16, 24], xLabel: "items", yLabel: "minutes to pack", always: true }), F2, 30);
/** The misses of a model: a dashed line from each order to its prediction. */
const misses = (group: string, f: (x: number) => number): El[] =>
  ORDERS.map(([x, y], i) => series(`${group}-r${i}`, "data", "line", [[x, f(x)], [x, y]], { tone: "alert", w: 2, dashed: true, group }));

/* ---------- the network board ---------- */

const NET = { x: F1[0] - 210, y: F1[1] - 310, w: 420, h: 280 };
const S1 = [1, 1], S2 = [1, 2, 1], S3 = [1, 8, 8, 1];
/** Centre of a unit, as the layers element lays it out. */
const unit = (sizes: number[], i: number, j: number): Pt =>
  [Math.round((NET.x + 28 + (i * (NET.w - 56)) / (sizes.length - 1)) * 10) / 10, Math.round((NET.y + 18 + ((j + 0.5) * (NET.h - 48)) / sizes[i]) * 10) / 10];
const board = (id: string, group: string, sizes: number[], title: string, sub: string, labels: string[], hot?: [number, number][]) =>
  raise(layers(id, 0, 0, NET.w, NET.h, sizes, { title, sub, labels, hot, group }), F1, 30);
/** A route through the units of a board. The board hides the line, and the record rides it. */
const route = (id: string, on: string, group: string, pts: Pt[]) => line(id, pts, { w: 2, on, group });
/** The prediction for order 4471 beside the output unit, with the actual packing time under it. */
const verdict = (on: string, group: string, minutes: string): El[] => [
  note(`${group}-pred`, NET.x + NET.w - 12, NET.y + 81, `predicted ${minutes} min`, { anchor: "end", strong: true, on, group }),
  note(`${group}-act`, NET.x + NET.w - 12, NET.y + 195, "actual 17.2 min", { anchor: "end", tone: "muted", on, group }),
];
/** What each hidden unit does, written in the corner beside it. */
const corners = (on: string, group: string, top: string, bottom: string): El[] => [
  note(`${group}-u1`, NET.x + 178, NET.y + 51, top, { anchor: "end", on, group }),
  note(`${group}-u2`, NET.x + 178, NET.y + 225, bottom, { anchor: "end", on, group }),
];
const HIDDEN = ["items", "hidden layer", "minutes"], DEEP = ["items", "hidden layer 1", "hidden layer 2", "minutes"];
const twoRoutes = (suffix: string, on: string, group: string) => [
  route(`t${suffix}`, on, group, [unit(S2, 0, 0), unit(S2, 1, 0), unit(S2, 2, 0)]),
  route(`b${suffix}`, on, group, [unit(S2, 0, 0), unit(S2, 1, 1), unit(S2, 2, 0)]),
];
/** The units dropout keeps in this training step. */
const KEPT: [number, number][] = [[0, 0], [1, 0], [1, 2], [1, 3], [1, 6], [2, 1], [2, 3], [2, 4], [2, 7], [3, 0]];
const dot = { shape: "dot" } as const, back = { shape: "dot", tone: "alert" } as const;
/** The loss stands where the rails from the two boards meet. Its plate carries the value at each stop. */
const loss = (group: string, value: string) =>
  prism(`loss-${group}`, 6.7, 6.7, 1.4, 1.4, 30, { hue: "sand", glyph: "scale", title: `Training loss ${value}`, sub: "mean squared error", at: "n", group });

export default defineGuide({
  id: "neural-networks", track: "ml", module: "Model families", slug: "neural-networks",
  title: "Neural networks",
  summary: "A neural network stacks layers of weighted sums and non-linear functions. Backpropagation carries the error back through the layers, and training turns the hidden units into features.",
  forLeads: "A network learns features that would otherwise be engineered by hand. Nobody writes those features down, so validation and monitoring carry the assurance.",
  status: "draft", minutes: 8,
  counters: ["Hidden units", "Parameters", "Training loss", "Held-out loss"],
  whatIf: { label: "What if the hidden layer had no activation function?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, weights and losses are illustrative",
    label: "Two boards. The left one draws the model as a network of units: first a single weighted sum, then a network with one hidden layer, then a larger one. The right one plots packing time against order size with the function the model computes. Order 4471 rides the connections forwards, the corrections ride them backwards, and the line on the right bends until it fits the orders.",
    els: [
      DATA,
      series("orders", "data", "points", ORDERS, { hue: "sky", hot: [8], always: true }),
      line("to-loss", [F1, G.p(6.7, 7.4)], { group: "train" }),
      line("from-loss", [G.p(7.4, 6.7), F2], { group: "train" }),
      loss("lin", "5.15"), loss("fit0", "64.0"), loss("fit1", "42.8"), loss("fit2", "0.53"), loss("over", "0.00"),

      // Stop 1: one weighted sum
      board("n0", "lin", S1, "Linear model", "2 parameters", ["items", "minutes"], [[0, 0], [1, 0]]),
      route("p0", "n0", "lin", [unit(S1, 0, 0), unit(S1, 1, 0)]),
      ...verdict("n0", "lin", "14.5"),
      ...misses("lin", LINE),
      series("lin-l", "data", "line", [[0, LINE(0)], [17, LINE(17)]], { w: 4, group: "lin" }),
      note("lin-eq", DATA.x + 50, DATA.y + 46, "minutes = 1.05 × items + 4.03", { strong: true, mono: true, tone: "track", on: "data", group: "lin" }),

      // Stops 2 and 3: a hidden layer with its first weights
      board("n1", "raw", S2, "Neural network", "7 parameters", HIDDEN, [[0, 0], [1, 0], [2, 0]]),
      ...twoRoutes("1", "n1", "raw"),
      ...corners("n1", "fwd", "ReLU keeps 6.2", "ReLU returns 0"),
      ...verdict("n1", "fwd", "6.1"),
      ...misses("fit0", net(P0)),
      series("fit0-l", "data", "line", curve(P0), { w: 4, group: "fit0" }),
      rule("fit0-t", "data", -P0.b2 / P0.w2, { tone: "muted", label: "unit 2 switches on", group: "fit0" }),

      note("back-n", NET.x + NET.w / 2, NET.y + 30, "every weight gets its own correction", { anchor: "middle", tone: "alert", strong: true, on: "n1", group: "back" }),
      ...misses("fit1", net(P1)),
      series("fit1-a", "data", "line", curve(P0), { tone: "muted", w: 3, dashed: true, group: "fit1" }),
      series("fit1-l", "data", "line", curve(P1), { w: 4, group: "fit1" }),
      note("fit1-n0", ...plotPoint(DATA, 13.3, 4.6), "first weights", { tone: "muted", on: "data", group: "fit1" }),
      note("fit1-n1", ...plotPoint(DATA, 9.4, 12.6), "after one step", { tone: "track", strong: true, anchor: "end", on: "data", group: "fit1" }),

      line("back", [G.p(6.7, 7.4), F1], { tone: "alert", group: "bp" }),
      stop("bp", ...G.p(3.3, 7.4), "Backpropagation", "a gradient for every weight", { at: "sw", group: "bp" }),
      pill("torch", [V[0], V[1] + 29], "loss.backward()", { mono: true, sub: "PyTorch", group: "bp" }),

      // Stop 4: the same network after 10,000 steps
      board("n1t", "trained", S2, "Neural network", "7 parameters", HIDDEN, [[0, 0], [1, 0], [1, 1], [2, 0]]),
      ...twoRoutes("2", "n1t", "trained"),
      ...corners("n1t", "trained", "unit 1 grows with every item", "unit 2 is on above 8 items"),
      ...verdict("n1t", "trained", "16.9"),
      series("fit2-l", "data", "line", curve(P2), { w: 4, group: "fit2" }),
      rule("fit2-t", "data", -P2.b2 / P2.w2, { tone: "muted", label: "unit 2 switches on", group: "fit2" }),

      // Stop 5: a larger network, thinned by dropout
      board("n2", "wide", S3, "Larger network", "97 parameters", DEEP, KEPT),
      pill("drop", [NET.x + 12, NET.y + 12], "Dropout", { anchor: "start", to: unit(S3, 1, 1), on: "n2", group: "wide" }),
      series("over-l", "data", "line", ORDERS, { tone: "alert", w: 3.5, group: "over" }),
      note("over-n", ...plotPoint(DATA, 9.6, 21.4), "without dropout", { tone: "alert", strong: true, on: "data", group: "over" }),
      series("held", "data", "points", HELD, { hue: "sand", group: "held" }),
      note("held-n", ...plotPoint(DATA, 10.6, 9.4), "held-out orders", { tone: "muted", to: plotPoint(DATA, 9.25, 15.2), on: "data", group: "held" }),

      // Stop 6: the network in use, behind its controls
      board("n2f", "full", S3, "Larger network", "97 parameters", DEEP),
      series("gen-l", "data", "line", curve(P2), { w: 4, group: "full" }),
      line("life", [F1, V, F2], { group: "assure" }),
      prism("val", 3.3, 6.7, 1.4, 1.4, 30, { hue: "mint", glyph: "check", title: "Validation", sub: "held-out orders", at: "sw", group: "assure" }),
      prism("mon", 6.7, 3.3, 1.4, 1.4, 30, { hue: "mint", glyph: "eye", title: "Monitoring", sub: "orders in production", at: "se", group: "assure" }),
    ],
  },
  steps: [
    step({
      id: "line", label: "Straight line", kind: "problem", title: "A weighted sum draws a straight line",
      caption: "Vinterhus packs orders above eight items on a pallet, so packing time levels off. A linear model is one weighted sum. Its capacity is limited to linear functions, and its best line misses.",
      show: ["lin", "train"], counters: ["0", "2", "5.15", "not measured"],
      rides: [ride("p0", 0, 0.5, "10 items", { ...dot, then: "10 × 1.05 + 4.03" })],
      body: ["The model is the one from linear regression: minutes equals a weight times items, plus a bias. Fitted to these twelve orders it gives 1.05 and 4.03, with a mean squared error of 5.15.",
        "Linear models can be fit efficiently and reliably. Their defect is that the model capacity is limited to linear functions.",
        "Order 4471 has 10 items and took 17.2 minutes to pack. The line predicts 14.5."],
      claims: ["neural-networks-linear-limit"],
    }),
    step({
      id: "hidden", label: "Hidden layer", kind: "idea", title: "A hidden layer bends the line",
      caption: "Each hidden unit takes a weighted sum of its inputs, then applies an activation function. ReLU returns 0 for a negative sum, which bends the line. With untrained weights the bend is misplaced.",
      show: ["raw", "fwd", "fit0", "train"], counters: ["2", "7", "64.0", "not measured"],
      rides: [ride("t1", 0, 0.36, "10 items", { ...dot, then: "sum 6.2" }), ride("b1", 0, 0.36, "10 items", { ...dot, then: "sum -1.0" })],
      body: ["Layers between the input layer and the output layer are called hidden layers. The value of each neuron in one is the sum of each of its inputs times a weight, plus a bias.",
        "An activation function is a non-linear transform of that value before it is passed to the next layer. Sigmoid, tanh and ReLU are the common ones, and the rectified linear unit is the default recommendation in modern networks.",
        { callout: { label: "Key idea", text: "Without the activation function the layers collapse. Linear calculations performed on the output of linear calculations are also linear." } },
        "For order 4471 the first unit's sum is 6.2 and passes unchanged. The second unit's sum is -1.0, so ReLU returns 0 and the unit stays unlit.",
        "This network has 7 parameters: a weight and a bias for each hidden unit, then two weights and a bias for the output."],
      claims: ["neural-networks-hidden-layer", "neural-networks-activation", "neural-networks-relu", "neural-networks-relu-default", "neural-networks-still-linear", "neural-networks-parameters"],
    }),
    step({
      id: "backward", label: "Backpropagation", kind: "mechanism", title: "Backpropagation sends the error backwards",
      caption: "The forward pass ends in a loss of 64.0. Backpropagation lets that information flow backwards through the layers to compute the gradient for every weight. Gradient descent then moves each weight a small step.",
      show: ["raw", "back", "fit1", "train", "bp"], counters: ["2", "7", "42.8", "not measured"],
      rides: [
        ride("t1", 1, 0.25, "error", { ...back, via: [0.5], then: "+0.118" }), ride("b1", 1, 0.25, "error", { ...back, via: [0.5], then: "-0.040" }),
        ride("t1", 1, 0.75, "error", { ...back, then: "+0.082" }), ride("b1", 1, 0.75, "error", { ...back, then: "+0.005" }),
      ],
      body: ["Forward propagation carries the input up through the hidden units to the output, and during training on to a scalar cost. The back-propagation algorithm lets the information from the cost flow backward through the network to compute the gradient.",
        { callout: { label: "Division of labour", text: "Back-propagation refers only to the method for computing the gradient. Another algorithm, such as stochastic gradient descent, performs the learning with that gradient." } },
        "In PyTorch, loss.backward() backpropagates the prediction loss and deposits the gradient of the loss with respect to each parameter. optimizer.step() then adjusts the parameters. The engine underneath is torch.autograd, which computes gradients automatically for any computational graph.",
        "At a learning rate of 0.001 the first step changes the four weights by +0.118, -0.040, +0.082 and +0.005, and the loss falls from 64.0 to 42.8."],
      claims: ["neural-networks-forward", "neural-networks-backprop", "neural-networks-backprop-scope", "neural-networks-pytorch-loop", "neural-networks-pytorch-autograd"],
    }),
    step({
      id: "features", label: "Learned features", kind: "mechanism", title: "The hidden units become features",
      caption: "After 10,000 steps the loss is 0.53. One unit grows with every item. The other switches on only above eight items, where the pallet starts. Nobody wrote that rule: the weight adjustments produced it.",
      show: ["trained", "fit2", "train", "bp"], counters: ["2", "7", "0.53", "not measured"],
      rides: [ride("t2", 0, 0.36, "10 items", { ...dot, then: "sum 13.2" }), ride("b2", 0, 0.36, "10 items", { ...dot, then: "sum 1.1" })],
      body: ["Back-propagation repeatedly adjusts the weights so as to minimise the difference between the actual output and the desired output. As a result, hidden units that are not part of the input or output come to represent important features of the task domain.",
        "The training examples say what the output layer must produce. They do not say what a hidden layer should do, which is why the layers are called hidden.",
        { callout: { label: "What changed", text: "Engineering features by hand was the dominant approach until deep learning. The strategy of deep learning is to learn them." } },
        "The output layer is still a linear regression model, applied to the hidden units in place of the raw input.",
        "For order 4471 the units now give 13.2 and 1.1, and the prediction is 16.9 minutes against an actual 17.2."],
      claims: ["neural-networks-learned-features", "neural-networks-hidden-unspecified", "neural-networks-learn-features", "neural-networks-output-linear"],
    }),
    step({
      id: "overfit", label: "Overfitting", kind: "watch-out", title: "A larger network fits the noise",
      caption: "With 97 parameters the network can pass through every training order and miss held-out ones. Dropout randomly drops units at each training step. Batch normalisation normalises each layer's inputs for every mini-batch.",
      show: ["wide", "over", "held", "train", "bp"], counters: ["16", "97", "0.00", "2.17"],
      body: ["Networks with a large number of parameters are very powerful, and overfitting is a serious problem in them. Here the training loss reaches 0.00 while the loss on six held-out orders is 2.17.",
        "Dropout randomly drops units, along with their connections, during training, which prevents units from co-adapting too much. At test time a single unthinned network is used.",
        "Batch normalisation normalises layer inputs for each training mini-batch. Its authors state that it allows much higher learning rates and less careful initialisation, and that it also acts as a regulariser.",
        "In PyTorch these are nn.Dropout and nn.BatchNorm1d. Both behave differently in training and in evaluation, which is why the PyTorch tutorial sets the model's mode before each loop.",
        "Depth has its own failures. Gradients for the layers nearest the input can become very small, and those layers then train very slowly or not at all. ReLU can help prevent vanishing gradients, and batch normalisation can help prevent exploding ones."],
      claims: ["neural-networks-overfitting", "neural-networks-dropout", "neural-networks-batchnorm", "neural-networks-pytorch-modes", "neural-networks-gradients"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Linear model or neural network",
      caption: "",
      show: ["full", "held", "assure"], counters: ["16", "97", "0.53", "0.62"],
      rides: [ride("life", 0, 0.5, "model", { via: [0.15], then: "validated" })],
      body: [{ pair: {
        left: { label: "Linear model", items: ["Fits efficiently and reliably", "Limited to linear functions"] },
        right: { label: "Neural network", items: ["Learns its own features", "Opaque: validate, then monitor"] },
      } },
        "Linear models can be fit efficiently and reliably, and their capacity is limited to linear functions. A network's hidden units come to represent features of the task.",
        "The NIST AI Risk Management Framework states that it is difficult to determine whether an opaque system is accurate, secure or fair, and to do so over time, and that explainable systems can be debugged and monitored more easily.",
        "Its MEASURE function includes that the model is explained, validated and documented, and that the system's behaviour is monitored when in production.",
        "Here the regularised network is checked on six held-out orders before it is used: training loss 0.53, held-out loss 0.62."],
      claims: ["neural-networks-linear-limit", "neural-networks-learned-features", "neural-networks-opaque-assurance", "neural-networks-validate-monitor"],
    }),
  ],
  governance: {
    text: "The training data never say what a hidden layer should do, so a network's features are found by training and written down by nobody. The NIST AI Risk Management Framework states that inscrutable systems complicate risk measurement and that it is difficult to determine whether an opaque system is accurate, secure or fair, which moves the burden to validation before use and monitoring in production.",
    claims: ["neural-networks-hidden-unspecified", "neural-networks-opacity", "neural-networks-opaque-assurance", "neural-networks-validate-monitor"],
  },
  closing: {
    pitfalls: [
      "Reading a low training loss as proof that the network works on new orders.",
      "Adding layers and units before measuring the loss on held-out orders.",
      "Evaluating a PyTorch model that is still in training mode, with dropout switched on.",
    ],
    questions: [
      "What does a network compute if its activation functions are removed?",
      "What does backpropagation compute, and which algorithm uses the result?",
      "Why does a network carry a heavier validation and monitoring burden than a linear model?",
    ],
  },
});
