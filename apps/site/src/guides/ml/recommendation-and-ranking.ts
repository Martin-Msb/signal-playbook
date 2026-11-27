import { blocks, CANVAS, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { BlocksEl, ListEl, Pt, Row } from "@signal-path/engine";

// The floor: one loop. The interaction log stands on the left, the feed rail runs back through retrieval,
// turns and comes forward through the ranker to the list shown to the customer on the right.
// The return rail closes the loop along the front. The catalogue lies inside the loop as a field of blocks.
const G = isoGrid(110, 300, 30);
const A = G.p(0, 0), B = G.p(0, -10), C = G.p(13, -10), D = G.p(13, 0);
const RET = G.p(0, -7), RANK = G.p(6.5, -10);
const K = "recommendation-and-ranking-";

const shown = (id: string, title: string, items: ListEl["items"], group: string, extra = {}) =>
  raise(list(id, 0, 0, 172, items, { title, numbered: true, rowH: 24, mono: true, group, ...extra }), C, 84);
const DOT = "●";
const matrix = (id: string, title: string, rows: Row[], group: string, extra = {}) =>
  raise(table(id, 0, 0, 204, ["", "sofa", "rug", "lamp", "vase"], rows, { at: [12, 54, 90, 124, 162], rowH: 22, title, group, ...extra }), A, 56);
const catalogue = (id: string, title: string, sub: string, items: BlocksEl["items"], group: string) =>
  blocks(id, 2.4, -6.6, 6, 1.1, items, { gap: 0.3, title, sub, at: "s", group });
const flat = (hot: number[], h = 10): BlocksEl["items"] => Array.from({ length: 12 }, (_, i) => ({ h: hot.includes(i) ? h + 8 : h, hue: hot.includes(i) ? "track" as const : "paper" as const, hot: hot.includes(i) }));

export default defineGuide({
  id: "recommendation-and-ranking", track: "ml", module: "Other learning problems", slug: "recommendation-and-ranking",
  title: "Recommendation and ranking",
  summary: "A ranking model orders products for one customer from past interactions, and the list it shows becomes the data it learns from next.",
  forLeads: "A recommender is a loop, not a model. What it shows decides what it can learn, so exposure, objectives and disclosure are design decisions with owners.",
  status: "draft", minutes: 8,
  counters: ["Catalogue", "Candidates", "Shown to Ana", "Learns from"],
  whatIf: { label: "What if the page ranked by sales alone?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customers, products and counts are illustrative",
    label: "An interaction log feeds a rail that runs through retrieval and a ranker to the list shown to a customer. A return rail carries her clicks back to the log, closing a loop around the catalogue, whose blocks show how exposure narrows.",
    els: [
      line("feed", [A, B, C], { always: true }),
      line("back", [C, D, A], { group: "loop" }),
      drum("log", 0, 0, 0.9, 26, { hue: "sand", glyph: "stack", title: "Interaction log", at: "sw", always: true }),
      stop("s-ret", ...RET, undefined, undefined, { always: true }),
      stop("s-rank", ...RANK, undefined, undefined, { always: true }),
      stop("s-list", ...C, undefined, undefined, { big: true, always: true }),
      stop("s-d", ...D, undefined, undefined, { group: "loop" }),

      prism("sales", -0.7, -7.7, 1.4, 1.4, 30, { hue: "paper", glyph: "sort", title: "Sort by sales", at: "n", group: "sales" }),
      prism("cf", -0.7, -7.7, 1.4, 1.4, 30, { hue: "mint", glyph: "net", title: "Collaborative filter", at: "n", group: "cf" }),
      prism("ret", -0.7, -7.7, 1.4, 1.4, 30, { hue: "mint", glyph: "funnel", title: "Two-tower retrieval", sub: "12,000 to 300", at: "n", group: "ret" }),
      prism("rank", 5.8, -10.7, 1.4, 1.4, 38, { hue: "violet", glyph: "sort", title: "Ranker", sub: "300 to 4", at: "n", group: "rank" }),
      prism("rank-div", 5.8, -10.7, 1.4, 1.4, 38, { hue: "violet", glyph: "split", title: "Ranker", sub: "then diversity re-rank", at: "n", group: "rank-div" }),

      pawn("ana-0", 14.7, -10, "Ana", "bought a sofa", { side: "w", group: "ana-0" }),
      pawn("ana", 14.7, -10, "Ana", undefined, { group: "ana" }),
      pawn("ana-c", 14.7, -10, "Ana", "clicks rank 1", { side: "w", group: "ana-c" }),

      matrix("mx", "Interactions", [{ cells: ["Ana", DOT, "", DOT, ""], hot: true }, ["Ben", DOT, DOT, DOT, ""], ["Cai", DOT, DOT, "", ""], ["Dee", "", "", "", DOT]], "mx"),
      matrix("mx2", "Interactions, later", [["Ana", DOT, DOT, DOT, ""], ["Ben", DOT, DOT, DOT, ""], ["Cai", DOT, DOT, DOT, ""], ["Dee", "", DOT, "", DOT]], "mx2", { columnHues: [undefined, undefined, "rose", undefined, undefined] }),

      shown("l-pop", "Best sellers", ["LAMP-1180", { t: "SOFA-2210", tone: "alert" }, "RUG-3301", "MUG-0412"], "l-pop"),
      shown("l-cf", "For Ana", [{ t: "RUG-3301", hot: true }, "VASE-0907", "LAMP-1180", "THROW-5120"], "l-cf"),
      shown("l-rank", "Ranked for Ana", [{ t: "RUG-3301  0.62", hot: true }, "THROW-5120 0.41", "RUG-3350  0.33", "RUG-3312  0.21"], "l-rank"),
      shown("l-div", "Re-ranked for Ana", ["RUG-3301", "THROW-5120", { t: "SHELF-7702", hot: true }, "RUG-3350"], "l-div"),

      catalogue("cat", "Catalogue", "12,000 products", flat([1, 4, 6, 9]), "cat"),
      catalogue("cat-all", "Catalogue", "12,000 products", flat([]), "cat-all"),
      catalogue("cat-cand", "Catalogue", "300 candidates lit", flat([2, 3, 7, 8, 10], 10), "cat-cand"),
      catalogue("cat-narrow", "Times shown", "three products dominate", Array.from({ length: 12 }, (_, i) => [2, 3, 8].includes(i) ? { h: 46 - (i % 3) * 8, state: "alert" as const } : { h: 4, state: "closed" as const }), "cat-narrow"),
      catalogue("cat-wide", "Times shown", "exposure spread", Array.from({ length: 12 }, (_, i) => ({ h: [14, 18, 26, 30, 12, 16, 20, 14, 24, 18, 12, 16][i], hue: "track" as const })), "cat-wide"),

      pill("n-loop", [40, 462], "only shown items earn clicks", { tone: "alert", anchor: "start", to: G.p(5, 0), group: "loop-n" }),
      pill("c-pos", [40, 462], "position logged with each click", { tone: "track", glyph: "scale", anchor: "start", to: G.p(5, 0), group: "ctl" }),
      pill("c-dsa", [C[0] + 50, C[1] + 100], "main parameters stated", { tone: "track", glyph: "eye", anchor: "middle", group: "ctl" }),
    ],
  },
  steps: [
    step({
      id: "same", label: "Best sellers", kind: "problem", title: "Every customer sees the same best sellers",
      caption: "Ana bought SOFA-2210 yesterday. The home page orders products by total sales, so it offers her the sofa again.",
      show: ["sales", "ana-0", "l-pop", "cat"], counters: ["12,000", "none", "4 best sellers", "sales totals"],
      rides: [ride("feed", 0.06, 0.8, "all sales", { via: ["s-ret"], then: "same top 4" })],
      body: ["A list ordered by total sales ignores who is looking. Ana's purchase is already in the interaction log, and nothing reads it.",
        "A purchase or a view is implicit feedback: the system infers interest from behaviour. Explicit feedback is a rating the customer gives."],
      claims: [K + "feedback"],
    }),
    step({
      id: "collaborative", label: "Collaborative", kind: "idea", title: "Collaborative filtering learns from who bought what",
      caption: "Customers who bought the sofa also bought RUG-3301. The model learns an embedding for each customer and each product from the interaction matrix, with no hand-built features.",
      show: ["cf", "ana", "mx", "l-cf", "cat-all"], counters: ["12,000", "none", "4 for Ana", "interactions"],
      rides: [ride("feed", 0.06, 0.8, "Ana", { via: ["s-ret"], then: "RUG-3301" })],
      body: ["Collaborative filtering uses similarities between users and items at the same time. Its training data is a feedback matrix: one row per customer, one column per product.",
        { callout: { label: "Key idea", text: "Nobody describes the rug. Its position in the embedding space comes from the customers who interacted with it." } },
        "With implicit feedback, every product a customer interacted with is a positive example and the rest are treated as implicit negatives."],
      claims: [K + "collaborative", K + "feedback"],
    }),
    step({
      id: "retrieve", label: "Retrieve", kind: "mechanism", title: "Two-tower retrieval narrows the catalogue",
      caption: "A query tower embeds Ana and a candidate tower embeds each product. An approximate nearest neighbour index returns the 300 products with the highest affinity scores.",
      show: ["ret", "ana", "mx", "cat-cand"], counters: ["12,000", "300", "not yet", "interactions"],
      rides: [ride("feed", 0.06, 0.48, "Ana", { via: ["s-ret"], then: "300 items" })],
      body: ["Retrieval has to be cheap because it faces the whole catalogue. A two-tower model computes a query embedding and a candidate embedding of equal size and multiplies them into an affinity score.",
        "At serving, the candidate side is most often an approximate nearest neighbours index. Retrieval selects hundreds of candidates and leaves the final order to the next stage."],
      claims: [K + "two-tower", K + "stages"],
    }),
    step({
      id: "rank", label: "Rank", kind: "mechanism", title: "A learned ranker orders the candidates",
      caption: "A learning-to-rank model such as LambdaMART trains on graded relevance labels grouped by query. It scores the 300 candidates and the top four reach the page.",
      show: ["ret", "rank", "ana", "mx", "l-rank", "cat-cand"], counters: ["12,000", "300", "4 ranked", "interactions"],
      rides: [ride("feed", 0.48, 0.83, "300 items", { via: ["s-rank"], then: "top 4" })],
      body: ["LambdaMART is the boosted tree version of LambdaRank, which is based on RankNet. LightGBM offers it as the lambdarank objective, with integer labels where a larger number means higher relevance.",
        { callout: { label: "Objective", text: "The scoring function decides the order. A ranker optimised for clicks may promote click-bait." } }],
      claims: [K + "learning-to-rank", K + "stages", K + "objective"],
    }),
    step({
      id: "loop", label: "Feedback loop", kind: "watch-out", title: "The ranker trains on clicks its own lists produced",
      caption: "Higher positions are clicked more, and each click returns to the log as training data. Retraining favours what was already shown, and what customers see narrows.",
      show: ["ret", "rank", "loop", "loop-n", "ana-c", "mx2", "l-rank", "cat-narrow"], counters: ["12,000", "300", "4 ranked", "its own lists"],
      rides: [ride("back", 0.07, 0.86, "click, rank 1", { via: ["s-d"], then: "training row" })],
      body: ["Items lower on the screen are less likely to be clicked than items higher up, so a click measures position as well as preference.",
        "A change to the ranking changes the data the model will see in future. In simulations, training on data from users already exposed to recommendations homogenises user behaviour without increasing utility."],
      claims: [K + "loop", K + "position"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The loop needs controls and disclosure",
      caption: "",
      show: ["ret", "rank-div", "loop", "ctl", "ana", "mx", "l-div", "cat-wide"], counters: ["12,000", "300", "4 re-ranked", "clicks and position"],
      rides: [ride("feed", 0.48, 0.83, "300 items", { via: ["s-rank"], then: "top 4" }), ride("back", 0.07, 0.86, "click, rank 3", { via: ["s-d"] })],
      body: [{ pair: {
        left: { label: "In the system", items: ["Train with a positional feature", "Re-rank for diversity", "Review what the objective rewards"] },
        right: { label: "To the user", items: ["State the main ranking parameters", "Let users change them", "Offer an option without profiling"] },
      } },
        "Train with the position as a feature and give every candidate the same default position at serving. Re-ranking then applies further criteria, because items closest to the query embedding tend to be very similar to each other.",
        "Under the EU Digital Services Act, online platforms set out the main parameters of their recommender systems in their terms and conditions. Very large platforms also provide an option that is not based on profiling."],
      claims: [K + "position", K + "diversity", K + "objective", K + "dsa-27", K + "dsa-38"],
    }),
  ],
  governance: {
    text: "A ranking model trained on data from its own recommendations homogenises what users see. The EU Digital Services Act requires online platforms to state the main parameters of their recommender systems, and very large platforms to offer an option not based on profiling.",
    claims: [K + "loop", K + "dsa-27", K + "dsa-38"],
  },
  closing: {
    pitfalls: [
      "Reading a click as preference when position explains much of it.",
      "Judging a new ranker only on logs the old ranker produced.",
      "Optimising clicks alone and calling the result relevance.",
    ],
    questions: [
      "Which products has the system never shown, and how would it learn about them?",
      "What does the ranking objective reward besides relevance?",
      "Where are the main ranking parameters stated for users?",
    ],
  },
});
