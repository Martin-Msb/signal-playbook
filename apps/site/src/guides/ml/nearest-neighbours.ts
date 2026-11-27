import { CANVAS, band, defineGuide, isoGrid, line, pill, plot, prism, raise, ride, series, shade, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Tone } from "@signal-path/engine";

// A board on the left holds every stored example: past refund requests by days since delivery and amount, coloured by outcome.
// The new request is a point among them, and each stop changes which examples count as its neighbours.
// The board on the right lists those neighbours and their vote. The record on the rail carries the prediction out.
const G = isoGrid(480, 240, 30);
const F1 = G.p(0, 7.8), F2 = G.p(7.8, 0), CORNER = G.p(7.8, 7.8);

type P = [number, number];
/** Past refund requests: days since delivery and amount. */
const APPROVED: P[] = [[4, 150], [7, 260], [10, 360], [14, 200], [18, 120], [24, 280], [26, 170], [28, 230], [40, 50], [44, 45], [48, 58], [53, 48], [57, 60], [45, 155]];
const REFUSED: P[] = [[22, 360], [34, 225], [35, 330], [36, 145], [46, 300], [50, 130], [51, 215], [58, 340]];
const Q: P = [41, 180];
/** A neighbour: where it is, its order number, its outcome, and its distance on scaled and on raw features. */
type N = { at: P; order: string; out: "approved" | "refused"; who: string; scaled?: string; raw?: string };
const ODD: N = { at: [45, 155], order: "4481", out: "approved", who: "a.lind@…", scaled: "0.34", raw: "25.3" };
const N2: N = { at: [36, 145], order: "4474", out: "refused", who: "m.berg@…", scaled: "0.46", raw: "35.4" };
const N3: N = { at: [34, 225], order: "4486", out: "refused", who: "j.holm@…", scaled: "0.61" };
const N4: N = { at: [51, 215], order: "4470", out: "refused", who: "s.dahl@…", scaled: "0.70", raw: "36.4" };
const N5: N = { at: [50, 130], order: "4488", out: "refused", who: "e.strand@…", scaled: "0.73" };
const R2: N = { at: [26, 170], order: "4477", out: "approved", who: "", raw: "18.0" };
const R4: N = { at: [14, 200], order: "4483", out: "approved", who: "", raw: "33.6" };
const SCALED = [ODD, N2, N3, N4, N5], RAW = [R2, ODD, R4, N2, N4];
const hueOf = (n: N): Hue => (n.out === "approved" ? "sky" : "sand");

const REQ = raise(plot("req", 0, 0, 430, 280, [0, 60], [0, 400], { title: "Stored refund requests", xt: [0, 15, 30, 45, 60], yt: [0, 80, 160, 240, 320, 400], xLabel: "days since delivery", yLabel: "amount", always: true }), F1, 30);

/** Lines from the new request to its neighbours, and the neighbours drawn emphasised. */
const reach = (id: string, ns: N[], tone: Tone = "track"): El[] => [
  ...ns.map((n, i) => series(`${id}-l${i}`, "req", "line", [Q, n.at], { tone, w: 3, group: id })),
  series(`${id}-p`, "req", "points", ns.map((n) => n.at), { hues: ns.map(hueOf), r: 7, tone, hot: ns.map((_, i) => i), group: id }),
];
/** The board on the right: the neighbours behind one prediction. */
const board = (id: string, sub: string, ns: N[], col: "scaled" | "raw" | "who", foot: string, tone?: Tone): El =>
  raise(table(id, 0, 0, 400, ["order", col === "who" ? "customer" : "distance", "outcome"], ns.map((n) => ({ cells: [n.order, n[col] ?? "", n.out], hue: hueOf(n) })),
    { at: [16, 126, 270], rowH: 34, title: "Neighbours of order 4496", sub, mono: true, foot, tone, group: id }), F2, 30);
const model = (id: string, sub: string, alert = false): El =>
  prism(id, 7.1, 7.1, 1.4, 1.4, 30, { hue: "track", glyph: "search", title: "k-NN", sub, at: "n", state: alert ? "alert" : "open", group: id });

export default defineGuide({
  id: "nearest-neighbours", track: "ml", module: "Model families", slug: "nearest-neighbours",
  title: "Nearest neighbours",
  summary: "A nearest neighbours model keeps its training examples and predicts from the few that lie closest to a new one. Which examples are closest depends on the distance, so the distance and the number of neighbours are the model.",
  forLeads: "Nothing is learned in advance, so every decision can be traced to named past cases. That makes the model easy to question, costly to query at scale, and a store of the records it was built from.",
  status: "draft", minutes: 7,
  counters: ["k", "Distance", "Distances measured", "Prediction"],
  whatIf: { label: "What if the features were not scaled?", step: 3, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Requests, customers and the regions of the index are illustrative",
    label: "A chart of 22 past refund requests by days since delivery and amount, coloured by whether Support approved or refused them, with new order 4496 among them. A line reaches from the new order to its single nearest request, then to its five nearest, and a board lists those neighbours and their vote. On unscaled features the lines reach sideways to requests with a similar amount and the vote flips. An index then fences off the region around the order so fewer distances are measured. At the last stop the board shows the customer behind each neighbour.",
    els: [
      REQ,
      shade("cell", "req", [30, 80, 60, 400], { tone: "track", group: "index" }),
      series("cut-a", "req", "line", [[30, 0], [30, 400]], { tone: "ink", w: 2, group: "index" }),
      series("cut-b", "req", "line", [[30, 80], [60, 80]], { tone: "ink", w: 2, group: "index" }),
      series("cut-c", "req", "line", [[0, 215], [30, 215]], { tone: "ink", w: 2, group: "index" }),
      band("amount", "req", 138, 222, { axis: "y", tone: "alert", group: "raw" }),

      series("approved", "req", "points", APPROVED, { hue: "sky", r: 6, tone: "muted", label: "approved", labelAt: 1, always: true }),
      series("refused", "req", "points", REFUSED, { hue: "sand", r: 6, tone: "muted", label: "refused", labelAt: 2, always: true }),
      ...reach("k1", [ODD]), ...reach("k5", SCALED), ...reach("raw", RAW, "alert"),
      series("mark", "req", "points", [Q], { r: 8, hot: [0], label: "4496", always: true }),

      line("rail", [F1, CORNER, F2], { always: true }),
      stop("s-in", ...G.p(3.4, 7.8), undefined, undefined, { always: true }),
      stop("s-mid", ...CORNER, undefined, undefined, { group: "anchor" }),
      stop("s-out", ...G.p(7.8, 3.4), undefined, undefined, { always: true }),
      model("m0", "no k chosen"), model("m1", "k = 1, scaled"), model("m5", "k = 5, scaled"), model("mr", "k = 5, raw units", true), model("mi", "k = 5, KD tree"),

      raise(table("t-ask", 0, 0, 400, ["field", "value"], [["order", "4496"], ["days since delivery", "41"], ["amount", "180"], ["outcome", "?"]], { at: [16, 270], rowH: 34, title: "Next refund request", sub: "no outcome yet", group: "t-ask" }), F2, 30),
      board("t-k1", "the single closest", [ODD], "scaled", "1 of 1 approved"),
      board("t-k5", "the five closest", SCALED, "scaled", "4 of 5 refused"),
      board("t-raw", "closest in raw units", RAW, "raw", "3 of 5 approved", "alert"),
      board("t-who", "five stored records", SCALED, "who", "4 of 5 refused"),
      pill("personal", [822, 402], "five real customers", { glyph: "lock", group: "t-who" }),
    ],
  },
  steps: [
    step({
      id: "new", label: "New request", kind: "problem", title: "A new request has no outcome",
      caption: "Vinterhus keeps 22 past refund requests with their outcomes, on scaled features. Order 4496 arrives: 41 days after delivery, amount 180. No rule has been trained.",
      show: ["m0", "t-ask"], counters: ["not set", "not set", "0", "none"],
      rides: [ride("rail", "s-in", "s-in", "4496")],
      body: ["The 22 requests are the training data. Feature engineering has already put days since delivery and amount on a common scale. The chart keeps the original units on its axes so the requests stay readable.",
        "Neighbours-based methods are called non-generalising: they do not build a general model, they simply remember all of their training data."],
      claims: ["nearest-neighbours-remember"],
    }),
    step({
      id: "one", label: "Nearest", kind: "idea", title: "The closest example lends its outcome",
      caption: "The model measures the distance from order 4496 to every stored request. With k = 1 the closest answers: order 4481, approved, a lone approval among refusals.",
      show: ["k1", "m1", "t-k1"], counters: ["1", "Euclidean, scaled", "22 of 22", "approve"],
      rides: [ride("rail", "s-in", "s-out", "4496", { via: ["s-mid"], then: "approve" })],
      body: ["The principle of nearest neighbours is to find a predefined number of training samples closest in distance to the new point and predict the label from these.",
        { callout: { label: "Key idea", text: "No training step produces weights or rules. The stored examples and the distance between them are the whole model." } }],
      claims: ["nearest-neighbours-principle", "nearest-neighbours-remember"],
    }),
    step({
      id: "vote", label: "k votes", kind: "mechanism", title: "The k closest examples vote",
      caption: "With k = 5 the five closest requests vote and the majority wins: four refused, one approved. A larger k suppresses noise but makes the boundary between outcomes less distinct.",
      show: ["k5", "m5", "t-k5"], counters: ["5", "Euclidean, scaled", "22 of 22", "refuse"],
      rides: [ride("rail", "s-in", "s-out", "4496", { via: ["s-mid"], then: "refuse" })],
      body: ["In k-nearest neighbours classification a query point is assigned the class with the most representatives among its nearest neighbours. The best k is highly data-dependent.",
        "scikit-learn's KNeighborsClassifier uses 5 neighbours by default and weights them equally. Setting weights to distance gives closer neighbours a greater influence than those further away."],
      claims: ["nearest-neighbours-vote", "nearest-neighbours-k", "nearest-neighbours-weights"],
    }),
    step({
      id: "units", label: "Distance", kind: "watch-out", title: "The distance decides who is near",
      caption: "On unscaled features amount spans hundreds and days span tens, so amount dominates the distance. The neighbours become requests of similar amount, and the vote flips to approve.",
      show: ["raw", "mr", "t-raw"], counters: ["5", "Euclidean, raw", "22 of 22", "approve"],
      rides: [ride("rail", "s-in", "s-out", "4496", { via: ["s-mid"], then: "approve", tone: "alert" })],
      body: ["scikit-learn shows the effect on a dataset where one feature varies between 0 and 1,000 and another between 1 and 10: distances are mostly decided by the first, and the second is comparatively ignored. After standardisation both shape the neighbourhood more or less equally.",
        "The metric is a second choice. The distance can be any metric measure, and standard Euclidean distance is the most common. scikit-learn's default is the Minkowski metric with p = 2, which is Euclidean distance, and p = 1 gives Manhattan distance.",
        { callout: { label: "What changed", text: "Not one stored example moved. Only the distance changed, and two of the five neighbours and the prediction changed with it." } }],
      claims: ["nearest-neighbours-scale", "nearest-neighbours-metric"],
    }),
    step({
      id: "search", label: "Search", kind: "mechanism", title: "An index measures fewer distances",
      caption: "Brute force measures all 22 distances for every prediction. A KD tree files the requests into nested regions and searches around order 4496. Approximate search trades precision for speed.",
      show: ["k5", "index", "mi", "t-k5"], counters: ["5", "Euclidean, scaled", "8 of 22", "refuse"],
      rides: [ride("rail", "s-in", "s-out", "4496", { via: ["s-mid"], then: "refuse" })],
      body: ["Brute-force query time grows with the number of samples times the number of dimensions. A KD tree recursively partitions the parameter space along the data axes into nested regions into which the points are filed. It is very fast in low dimensions and becomes inefficient as the dimension grows very large.",
        "Approximate similarity search takes over for large collections of high-dimensional vectors. Faiss is a library for efficient similarity search of dense vectors that can trade precision for speed, and HNSW is a fully graph-based method for approximate k-nearest neighbour search. Vector search uses the same indexes."],
      claims: ["nearest-neighbours-brute", "nearest-neighbours-approximate"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choose k and the distance",
      caption: "",
      show: ["k5", "index", "mi", "t-who"], counters: ["5", "Euclidean, scaled", "8 of 22", "refuse"],
      rides: [ride("rail", "s-in", "s-out", "4496", { via: ["s-mid"], then: "refuse" })],
      body: [{ pair: {
        left: { label: "k", items: ["Small: follows single examples", "Large: suppresses noise, blurs boundaries"] },
        right: { label: "Distance", items: ["Scale the features first", "Euclidean or Manhattan", "Neighbours are stored records"] },
      } },
        "The kneighbors method of a fitted scikit-learn model returns the indices of and distances to the neighbours of each point. Each index is a row of the training data, here one customer's refund request.",
        "Machine learning models leak information about the individual records they were trained on. A model that stores those records and answers from five of them leaves little to infer."],
      claims: ["nearest-neighbours-k", "nearest-neighbours-scale", "nearest-neighbours-metric", "nearest-neighbours-indices", "nearest-neighbours-leak"],
    }),
  ],
  governance: { text: "A nearest neighbours model learns by storing its training samples, and each prediction is computed from a few of them, returned by index. Protect the model and its neighbour lists as the personal records they contain.", claims: ["nearest-neighbours-remember", "nearest-neighbours-indices", "nearest-neighbours-leak"] },
  closing: {
    pitfalls: [
      "Measuring distance on unscaled features, so the widest column decides.",
      "Setting k to 1 and letting one unusual example decide a case.",
      "Sharing the model or its neighbour lists more widely than the training data.",
    ],
    questions: [
      "What does a nearest neighbours model store after training?",
      "Why can scaling a feature change a prediction when no example changes?",
      "What does a prediction reveal about the records it was computed from?",
    ],
  },
});
