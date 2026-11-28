import { CANVAS, blocks, cells, defineGuide, drum, isoGrid, layers, line, list, note, pawn, plot, prism, raise, ride, rule, series, shade, step, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: a page view runs down the main rail from the shopper through the vector index, the ranking model and the bandit
// to the product page. Training arrives from the back: views and purchases, and the catalogue through pretrained encoders,
// feed the model that fills the index. Fresh features reach the ranking model from the front.
// The board on the left shows what the part added at each stop works on. The board on the right is the strip on the page.
const G = isoGrid(100, 112, 30);
const LEFT: Pt = [138, 504];  // the working board, front left
const RIGHT: Pt = [866, 392]; // the strip on the page, above the product page

/** Position on the main rail of a floor point, as a fraction of the rail. */
const M0 = 1.2, M1 = 22.3;
const at = (gx: number) => Math.round(((gx - M0) / (M1 - M0)) * 1000) / 1000;
const IN = at(3.7), INDEX = at(6.5), FOUND = at(9.2), RANK = at(12.5), RANKED = at(15.1), BANDIT = at(17.7), OUT = at(20.3);

const strip = (id: string, title: string, items: Parameters<typeof list>[4], extra: Partial<ReturnType<typeof list>> = {}) =>
  raise(list(id, 0, 0, 180, items, { title, mono: true, numbered: true, group: id, ...extra }), RIGHT, 20);

/* ---------- the catalogue, before the system ---------- */

const SHOWN = [7, 21, 28, 44], MATCH = [12, 25, 37];
const catalogue = (id: string, sub: string, matches: boolean) =>
  blocks(id, 3, -8.6, 10, 0.55, Array.from({ length: 50 }, (_, i) => ({
    h: SHOWN.includes(i) ? 16 : matches && MATCH.includes(i) ? 16 : 6,
    hue: (SHOWN.includes(i) ? "track" : matches && MATCH.includes(i) ? "rose" : "paper") as Hue,
  })), { gap: 0.3, title: "Catalogue", sub, at: "e", group: id });

/* ---------- the map of product vectors ---------- */

type P = [number, number];
const KINDS: { hue: Hue; pts: P[] }[] = [
  { hue: "sand", pts: [[1.3, 7.2], [2.0, 6.6], [1.1, 5.9], [2.3, 7.5]] },            // sofas
  { hue: "rose", pts: [[3.6, 5.6], [4.5, 5.8], [3.9, 4.8], [4.8, 5.0]] },            // cushions and throws
  { hue: "mint", pts: [[1.9, 5.0], [2.7, 4.7]] },                                    // rugs
  { hue: "sky", pts: [[1.2, 3.0], [1.1, 1.2], [2.7, 1.0]] },                         // lamps
  { hue: "paper", pts: [[7.4, 8.2], [8.1, 7.2], [7.3, 6.5], [8.8, 8.4]] },           // bath
  { hue: "violet", pts: [[6.8, 2.2], [7.8, 1.4], [8.6, 2.7], [7.5, 3.0], [9.0, 1.5]] }, // kitchen
];
const SOFA: P = [2.9, 6.5], NEAR: P[] = [[3.6, 5.6], [4.5, 5.8], [2.7, 4.7], [3.9, 4.8]];
const LAMP: P = [2.0, 1.9], NEWLAMP: P = [3.3, 2.2];
const MAP = raise(plot("map", 0, 0, 260, 184, [0, 10], [0, 10], { title: "Product vectors", sub: "2 of 64 dimensions", xt: [], yt: [], grid: false, group: "map" }), LEFT, 20);
const mapEls: El[] = [
  MAP,
  rule("cut-x", "map", 5.4, { tone: "muted", w: 1.5, group: "map" }),
  rule("cut-y", "map", 4.3, { axis: "y", tone: "muted", w: 1.5, group: "map" }),
  series("items", "map", "points", KINDS.flatMap((k) => k.pts), { hues: KINDS.flatMap((k) => k.pts.map(() => k.hue)), r: 4.5, group: "map" }),
  shade("probe", "map", [0, 4.3, 5.4, 10], { label: "cell searched", group: "nn" }),
  ...NEAR.map((to, i) => series(`nn-${i}`, "map", "line", [SOFA, to], { w: 2, group: "nn" })),
  series("q-sofa", "map", "points", [SOFA], { r: 5, hot: [0], label: "SOFA-2210", group: "nn" }),
  shade("probe-new", "map", [0, 0, 5.4, 4.3], { label: "", group: "newp" }),
  series("nl", "map", "line", [LAMP, NEWLAMP], { w: 2, group: "newp" }),
  series("q-lamp", "map", "points", [LAMP], { hue: "sky", r: 5, hot: [0], group: "newp" }),
  series("new", "map", "points", [NEWLAMP], { r: 5, hot: [0], label: "LAMP-0977", group: "newp" }),
];

/* ---------- the two towers ---------- */

const NET = raise(layers("net", 0, 0, 260, 196, [4, 4, 4, 1], {
  title: "Two towers, one score", labels: ["ids", "hidden", "vector", "score"],
  connections: [0, 1].flatMap((l) => [[0, 1], [2, 3]].flatMap((t) => t.flatMap((a) => t.map((b) => [l, a, l + 1, b] as [number, number, number, number])))).concat([0, 1, 2, 3].map((a) => [2, a, 3, 0] as [number, number, number, number])),
  hot: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [2, 0], [2, 1], [0, 3], [1, 2], [1, 3], [2, 2], [2, 3], [3, 0]],
  group: "net",
}), LEFT, 20);

/* ---------- the experiment ---------- */

const DIFF = [1.0, 2.8, 1.4, 2.5, 1.7, 2.3, 1.8, 2.2, 1.9, 2.1, 2.0, 2.1, 2.0, 2.0];
const half = (day: number) => 3 / Math.sqrt(day);
const EXP = raise(plot("exp", 0, 0, 260, 184, [1, 14], [-2, 6], { title: "Treatment minus control", xt: [1, 7, 14], yt: [-2, 0, 2, 4, 6], xLabel: "day", yLabel: "orders per 1,000 visits", group: "exp" }), LEFT, 20);

export default defineGuide({
  id: "case-recommendations-on-the-product-page", track: "case", module: "Use cases", slug: "recommendations-on-the-product-page",
  title: "Recommendations on the product page",
  summary: "A recommender is assembled part by part: a network that learns vectors from views and purchases, pretrained encoders for the catalogue, a vector index, a ranking model on fresh features and a bandit that explores. Then a sofa, a new lamp and a release decision run through it.",
  forLeads: "The model that learns the vectors is one part of five. What decides whether the strip earns its place is the evidence around it: an experiment with a control, a bounded share of exploration, and a log of what each recommendation rested on.",
  status: "draft", minutes: 12,
  counters: ["Chosen by", "Considered", "New products", "Tested"],
  whatIf: { label: "What if the system never explored?", step: 5, from: 6 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Products, counts, scores and results are illustrative",
    label: "A shopper's page view travels along a rail to the product page. Later stops add a model trained on views and purchases, pretrained encoders that read the catalogue, a vector index, a ranking model fed by an online feature store, a bandit, and an experiment split with a control group. A board on the left shows the network, the map of product vectors, the ranking and the experiment result. A board on the right shows the four items on the page.",
    els: [
      pawn("shopper", 0, 0, "Shopper", undefined, { always: true }),
      line("m", [G.p(M0, 0), G.p(M1, 0)], { always: true }),
      prism("page", 22.3, -0.6, 1.2, 1.2, 22, { hue: "paper", glyph: "doc", title: "Product page", at: "sw", always: true }),

      // Problem: one list for everyone, and a catalogue that stays unseen.
      prism("best", 11.9, -0.6, 1.2, 1.2, 22, { hue: "paper", glyph: "sort", title: "Bestsellers", sub: "same for all", at: "n", group: "old" }),
      catalogue("cat1", "40,000 products, 4 shown", false),
      catalogue("cat2", "matches never shown", true),
      strip("s-best", "On every page", ["MUG-0420", "TOWEL-0101", "PAN-2004", "CANDLE-0033"]),
      raise(table("bought", 0, 0, 228, ["item", "orders"], [["CUSH-1140", "312"], ["RUG-3301", "198"], ["THROW-0718", "121"]], { at: [12, 150], title: "Bought with SOFA-2210", mono: true, foot: "none is on the sofa page", group: "bought" }), LEFT, 20),

      // Architecture: training.
      drum("events", 6.5, -11.1, 1, 20, { hue: "sand", glyph: "eye", title: "Views and purchases", at: "e", group: "train" }),
      line("tr1", [G.p(6.5, -10.1), G.p(6.5, -6.1)], { group: "train" }),
      prism("model", 5.9, -6.1, 1.2, 1.2, 30, { hue: "track", glyph: "net", title: "Model", sub: "two towers", at: "n", group: "train" }),
      NET,
      note("net-a", NET.x + 14, NET.y + 16, "shopper tower", { size: 11, tone: "muted", strong: true, on: "net", group: "net" }),
      note("net-b", NET.x + 14, NET.y + 97, "product tower", { size: 11, tone: "muted", strong: true, on: "net", group: "net" }),

      drum("catalogue", 14.9, -5.5, 1, 24, { hue: "paper", glyph: "file", title: "Catalogue", sub: "photos, text", at: "n", group: "enc" }),
      line("enc", [G.p(13.9, -5.5), G.p(7.1, -5.5)], { group: "enc" }),
      prism("encoders", 11.1, -6.1, 1.2, 1.2, 20, { hue: "sky", glyph: "layers", title: "Encoders", sub: "pretrained, frozen", at: "s", group: "enc" }),
      raise(list("tower", 0, 0, 244, ["photo: image network", "text: Transformer", { t: "both pretrained, frozen", mute: true }, { t: "new layers on top: trained", hot: true }], { title: "Product tower", group: "tower" }), LEFT, 20),

      // Architecture: serving.
      line("tr2", [G.p(6.5, -4.9), G.p(6.5, -1)], { group: "idx" }),
      drum("index", 6.5, 0, 1, 30, { hue: "violet", glyph: "search", title: "Vector index", at: "sw", group: "idx" }),
      ...mapEls,

      prism("ranker", 11.9, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "sort", title: "Ranking model", at: "n", group: "rank" }),
      drum("feats", 12.5, 5.5, 1, 24, { hue: "sky", glyph: "table", title: "Online features", sub: "stock, price, clicks", at: "se", group: "rank" }),
      line("feat", [G.p(12.5, 4.5), G.p(12.5, 0.6)], { group: "rank" }),
      raise(table("ranked", 0, 0, 244, ["item", "in stock", "score"], [
        { cells: ["CUSH-1140", "38", "0.91"], hot: true }, ["RUG-3301", "12", "0.84"], ["THROW-0718", "51", "0.77"], ["LAMP-0312", "9", "0.52"], { cells: ["SOFA-2231", "0", "out"], strike: true },
      ], { at: [12, 112, 188], title: "200 candidates, scored", mono: true, group: "ranked" }), LEFT, 20),

      prism("bandit", 17.1, -0.6, 1.2, 1.2, 20, { hue: "sand", glyph: "split", title: "Bandit", sub: "explores 1 view in 20", at: "sw", group: "bandit" }),
      raise(cells("share", 0, 0, 5, [40, 26], Array.from({ length: 20 }, (_, i) => (i === 13 ? { t: "new", hot: true } : { t: "rank" })), { title: "Slot 4 over 20 page views", group: "share" }), LEFT, 20),
      strip("s-expl", "On the sofa page", ["CUSH-1140", "RUG-3301", "THROW-0718", { t: "ranked or new", hot: true }]),

      // Execution.
      strip("s-sofa", "On the sofa page", [{ t: "CUSH-1140", hot: true }, { t: "RUG-3301", hot: true }, { t: "THROW-0718", hot: true }, "LAMP-0312"]),
      raise(table("log", 0, 0, 244, ["item", "source", "score"], [["CUSH-1140", "ranked", "0.91"], ["RUG-3301", "ranked", "0.84"], ["THROW-0718", "ranked", "0.77"], ["LAMP-0312", "ranked", "0.52"]], { at: [12, 112, 188], title: "Logged with the page view", mono: true, foot: "with the features used", group: "log" }), LEFT, 20),
      strip("s-lamp", "On the lamp page", ["SHADE-0440", "TABLE-1502", "BULB-0091", { t: "LAMP-0977 new", hot: true }]),

      prism("split", 2.6, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "split", title: "Split", sub: "by shopper id", at: "sw", group: "exp" }),
      line("ctl", [G.p(3.2, -0.6), G.p(3.2, -5)], { w: 3, group: "exp" }),
      prism("control", 2.6, -6.2, 1.2, 1.2, 18, { hue: "paper", glyph: "sort", title: "Control", at: "n", group: "exp" }),
      EXP,
      rule("zero", "exp", 0, { axis: "y", tone: "ink", w: 2, group: "exp" }),
      series("hi", "exp", "line", DIFF.map((v, i) => [i + 1, Math.round((v + half(i + 1)) * 100) / 100] as P), { tone: "muted", w: 2, group: "exp" }),
      series("lo", "exp", "line", DIFF.map((v, i) => [i + 1, Math.round((v - half(i + 1)) * 100) / 100] as P), { tone: "muted", w: 2, group: "exp" }),
      series("est", "exp", "line", DIFF.map((v, i) => [i + 1, v] as P), { w: 4, group: "exp" }),
      raise(list("release", 0, 0, 180, [{ t: "canary on 5%", hot: true }, "A/B test for 14 days", "every serve logged"], { title: "Before release", group: "release" }), RIGHT, 20),
    ],
  },
  steps: [
    step({
      id: "same", label: "One list", kind: "problem", phase: "problem", title: "Every shopper sees the same four bestsellers",
      caption: "A shopper opens the page for a sofa. The strip under it holds the four best-selling products of the shop, whatever the page and whoever is looking.",
      show: ["old", "cat1", "s-best"], counters: ["sales rank", "4 bestsellers", "never shown", "no"],
      rides: [ride("m", 0, FOUND, "SOFA-2210"), ride("m", RANKED, at(19), "4 bestsellers")],
      body: ["A list ordered by sales needs no model and no data about the shopper. It also carries no information about the page it sits on.",
        "A recommender is usually built in stages: candidate generation reduces a huge corpus to a small subset, and a second model scores and ranks that subset."],
      claims: ["recommendation-and-ranking-stages"],
    }),
    step({
      id: "unseen", label: "Unseen", kind: "problem", phase: "problem", title: "The orders already show what goes with a sofa",
      caption: "Shoppers who bought the sofa also bought a cushion, a rug and a throw. None of the three is a bestseller, so none reaches the sofa page.",
      show: ["old", "cat2", "bought", "s-best"], counters: ["sales rank", "4 of 40,000", "never shown", "no"],
      rides: [ride("m", 0, FOUND, "SOFA-2210"), ride("m", RANKED, at(19), "the same 4")],
      body: ["A view or a purchase is implicit feedback: the system infers interest from behaviour without asking for a rating.",
        { callout: { label: "The gap", text: "The evidence of what belongs together sits in the order history. The page does not read it." } }],
      claims: ["recommendation-and-ranking-feedback"],
    }),
    step({
      id: "train", label: "Training", kind: "mechanism", phase: "architecture", title: "A network learns a vector for each shopper and product",
      caption: "Each view and purchase is a positive example. Two towers map a shopper and a product to vectors of equal size, and their product is the score.",
      show: ["old", "s-best", "train", "net"], counters: ["sales rank", "4 of 40,000", "no vector yet", "no"],
      rides: [ride("tr1", 0, 0.5, "views")],
      concepts: ["neural-networks", "embeddings"],
      body: ["An embedding layer is a lookup table that stores one vector for each entry. Here the entries are shopper and product identifiers.",
        "Back-propagation repeatedly adjusts the weights so that the output moves towards the desired output. The hidden units come to represent features of the task that nobody specified.",
        "Collaborative filtering learns such embeddings from the feedback matrix alone, without hand-engineered features."],
      claims: ["embeddings-lookup", "neural-networks-learned-features", "neural-networks-backprop", "recommendation-and-ranking-two-tower", "recommendation-and-ranking-collaborative", "recommendation-and-ranking-feedback"],
    }),
    step({
      id: "encoders", label: "Encoders", kind: "mechanism", phase: "architecture", title: "Pretrained encoders read the photo and the description",
      caption: "An image network and a Transformer, pretrained elsewhere and frozen, turn each product's photo and text into features. Only the new layers on top are trained.",
      show: ["old", "s-best", "train", "enc", "tower"], counters: ["sales rank", "4 of 40,000", "vector from photo and text", "no"],
      rides: [ride("tr1", 0, 0.5, "views"), ride("enc", 0, 0.706, "photo", { then: "features" })],
      concepts: ["architectures-for-images-sequences-and-text", "representation-and-transfer-learning"],
      body: ["Convolutional networks are specialised for grid-like data such as images. A Transformer relates the positions of a sequence through attention, and a Vision Transformer treats image patches the way a language model treats tokens.",
        "Transfer learning takes features learned on one problem and uses them on a new, similar one. The usual workflow freezes the pretrained layers, adds new trainable layers and trains only those.",
        "A product with no views and no purchases still has a photo and a description, so it still gets a vector."],
      claims: ["architectures-for-images-sequences-and-text-grid", "architectures-for-images-sequences-and-text-attention", "architectures-for-images-sequences-and-text-patches", "representation-and-transfer-learning-definition", "representation-and-transfer-learning-freeze", "representation-and-transfer-learning-pretrain"],
    }),
    step({
      id: "space", label: "One space", kind: "mechanism", phase: "architecture", title: "Products that go together lie close in one space",
      caption: "The vectors fill an index. The viewed sofa is the query. The index searches the nearest cell and returns 200 neighbours. The map is a projection for people to read.",
      show: ["train", "enc", "idx", "map", "nn"], counters: ["nearest vectors", "200 of 40,000", "vector from photo and text", "no"],
      rides: [ride("tr2", 0, 0.55, "vectors"), ride("m", 0, IN, "SOFA-2210"), ride("m", INDEX, FOUND, "200 near")],
      concepts: ["nearest-neighbours", "vector-search", "dimensionality-reduction"],
      body: ["Items that are close in an embedding are more closely related than distant ones. A nearest neighbour query returns the stored points closest to the query, with their distances.",
        "Comparing the query with every vector is exact and slow. An inverted file index divides the vectors into lists and searches only the lists closest to the query, trading some recall for speed.",
        "Dimensionality reduction makes high-dimensional data visible. On a t-SNE map, cluster sizes and the distances between well-separated clusters may mean nothing, so the map is for inspection and the search runs on the full vectors."],
      claims: ["representation-and-transfer-learning-embedding", "nearest-neighbours-indices", "nearest-neighbours-approximate", "vector-search-embed", "vector-search-exact", "vector-search-ivf", "vector-search-approximate", "dimensionality-reduction-purpose", "dimensionality-reduction-sizes"],
    }),
    step({
      id: "rank", label: "Ranking", kind: "mechanism", phase: "architecture", title: "A ranking model orders the candidates on fresh features",
      caption: "The model scores the 200 candidates with features read at request time: stock, price, recent clicks. An item that sold out an hour ago drops off the list.",
      show: ["train", "enc", "idx", "rank", "ranked"], counters: ["ranking model", "200, scored", "scored last", "no"],
      rides: [ride("m", INDEX, FOUND, "200 near"), ride("feat", 0, 0.45, "stock 38"), ride("m", RANK, RANKED, "top 4")],
      concepts: ["recommendation-and-ranking", "features-in-production"],
      body: ["Retrieval selects hundreds of candidates and ranking selects the best handful. Re-ranking then applies further constraints, such as variety among the items shown.",
        "An online store holds only the latest value of each feature for each key and serves it at low latency. The offline store builds the training set from the same registered definitions.",
        "A difference between how features are computed in training and in serving is training-serving skew. Logging the features used at serving time and training on that log removes one cause of it.",
        "The scoring function decides what the system promotes: one that optimises for clicks alone may recommend click-bait."],
      claims: ["recommendation-and-ranking-stages", "recommendation-and-ranking-diversity", "recommendation-and-ranking-objective", "features-in-production-online-latest", "features-in-production-store", "features-in-production-skew", "features-in-production-log-features"],
    }),
    step({
      id: "explore", label: "Exploring", kind: "mechanism", phase: "architecture", title: "A bandit spends a small share of views on exploring",
      caption: "A ranker trained on past clicks keeps showing what was clicked before. In one page view of twenty, the last slot goes to an item it has not tried.",
      show: ["train", "enc", "idx", "rank", "bandit", "share", "s-expl"], counters: ["ranking model and bandit", "200, scored", "1 view in 20", "no"],
      rides: [ride("m", RANK, RANKED, "top 4"), ride("m", BANDIT, OUT, "new item")],
      concepts: ["reinforcement-learning-and-bandits"],
      body: ["Greedy selection always exploits current knowledge and spends no time sampling apparently inferior actions to see if they are better. An ε-greedy method behaves greedily most of the time and, with a small probability ε, picks at random.",
        "Reward is lower in the short run during exploration and higher in the long run, because the better actions it discovers can then be exploited many times.",
        "A recommender trained on data from shoppers already exposed to its own recommendations is in a feedback loop. Exploration is what puts new evidence into that data."],
      claims: ["reinforcement-learning-and-bandits-greedy", "reinforcement-learning-and-bandits-epsilon", "reinforcement-learning-and-bandits-explore-cost", "reinforcement-learning-and-bandits-dilemma", "recommendation-and-ranking-loop"],
    }),
    step({
      id: "sofa", label: "A sofa", kind: "mechanism", phase: "execution", title: "The sofa page shows what goes with the sofa",
      caption: "A shopper opens SOFA-2210. The index returns 200 neighbours, the ranking model puts a cushion, a rug and a throw first, and each item is logged with its features.",
      show: ["train", "enc", "idx", "rank", "bandit", "log", "s-sofa"], counters: ["ranking model and bandit", "200, scored", "1 view in 20", "no"],
      rides: [ride("m", 0, IN, "SOFA-2210"), ride("m", INDEX, FOUND, "200 near"), ride("feat", 0, 0.45, "stock 38"), ride("m", RANK, OUT, "top 4", { via: [RANKED], then: "CUSH-1140" })],
      concepts: ["vector-search", "recommendation-and-ranking", "features-in-production"],
      body: ["At search time the query is embedded into the same vector space as the corpus and the closest embeddings are returned.",
        "Saving the set of features used at serving time, and piping it to a log, is the most reliable way to train on what was served. The same log shows afterwards what a recommendation rested on.",
        "Items lower on the screen are clicked less than items higher up, whatever their merit, so the position of each item is recorded with the click."],
      claims: ["vector-search-embed", "recommendation-and-ranking-stages", "features-in-production-log-features", "recommendation-and-ranking-position"],
    }),
    step({
      id: "new", label: "A new lamp", kind: "mechanism", phase: "execution", title: "A new lamp is shown before it has any history",
      caption: "LAMP-0977 arrived yesterday. Its photo and description place it among the lamps. The ranking model scores it low, and exploration gives it the last slot.",
      show: ["train", "enc", "idx", "rank", "bandit", "map", "newp", "s-lamp"], counters: ["ranking model and bandit", "200, scored", "shown by exploration", "no"],
      rides: [ride("enc", 0, 0.706, "LAMP-0977"), ride("tr2", 0, 0.55, "vector"), ride("m", RANK, RANKED, "low score"), ride("m", BANDIT, OUT, "LAMP-0977", { then: "shown" })],
      concepts: ["embeddings", "representation-and-transfer-learning", "reinforcement-learning-and-bandits"],
      body: ["Transferred features can be better than random ones even when the original task was distant. The encoders were never trained on this lamp, and their features still place it near similar products.",
        "An agent has to exploit what it knows to obtain reward and explore to choose better in future. Neither can be pursued exclusively.",
        "Random exploration makes no attempt to avoid harmful choices. Here it is bounded: one slot, a small share of views, and only items that passed retrieval.",
        { callout: { label: "What changed", text: "Each showing of the lamp produces the clicks and orders that the ranking model had none of." } }],
      claims: ["representation-and-transfer-learning-distance", "representation-and-transfer-learning-embedding", "embeddings-lookup", "reinforcement-learning-and-bandits-dilemma", "reinforcement-learning-and-bandits-safe-exploration", "reinforcement-learning-and-bandits-bounded"],
    }),
    step({
      id: "release", label: "Release", kind: "decision", phase: "execution", title: "What decides the release",
      caption: "",
      show: ["train", "enc", "idx", "rank", "bandit", "exp", "release"], counters: ["ranking model and bandit", "200, scored", "1 view in 20", "canary, then A/B test"],
      rides: [ride("m", 0, at(9.2), "treated"), ride("ctl", 0, 0.5, "control"), ride("est", 0, 0.8, "+2.0")],
      concepts: ["model-deployment", "online-experiments-and-causal-effect"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["A canary on a small share", "A randomised A/B test", "An interval that excludes zero"] },
        right: { label: "Do not rely on", items: ["Offline scores alone", "Clicks as the only measure", "A before and after comparison"] },
      } },
        "A canary is a partial and time-limited deployment: a small part of the service receives the new model and its error rate is compared with the rest. A canary too far from the control is rolled back.",
        "In an A/B test shoppers are randomly exposed to control or treatment. A hash of the shopper identifier and the experiment identifier keeps each shopper in one variant throughout.",
        "Random assignment distributes confounding variables equally, so a difference in the evaluation criterion is the result of the change. If zero lies inside the confidence interval of the effect, no effect is concluded.",
        "A good evaluation criterion is not short-term focused, such as clicks, and includes factors that predict long-term goals."],
      claims: ["model-deployment-canary", "model-deployment-online-validation", "online-experiments-and-causal-effect-ab", "online-experiments-and-causal-effect-hash", "online-experiments-and-causal-effect-confounding", "online-experiments-and-causal-effect-causality", "online-experiments-and-causal-effect-interval", "online-experiments-and-causal-effect-oec", "recommendation-and-ranking-objective"],
    }),
  ],
  governance: { text: "A new model is validated on live traffic, in a canary or an A/B test, before it serves every shopper. Features are logged at serving time, and online platforms must set out the main parameters of their recommender systems in plain language.", claims: ["model-deployment-online-validation", "features-in-production-log-features", "recommendation-and-ranking-dsa-27"] },
  closing: {
    pitfalls: [
      "Releasing on offline scores without a control group.",
      "Ranking greedily on past clicks, so new products never earn any.",
      "Computing a feature one way for training and another way for serving.",
    ],
    questions: [
      "Which part gives a product with no history a place in the space?",
      "Why does the ranking model alone never show the new lamp?",
      "What does the log need to hold to explain one recommendation?",
    ],
  },
});
