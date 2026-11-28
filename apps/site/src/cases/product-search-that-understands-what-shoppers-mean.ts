import { CANVAS, blocks, cells, defineGuide, doc, drum, isoGrid, line, list, pawn, pill, plot, plotPoint, prism, raise, ride, series, step, table } from "@signal-path/engine";
import type { Cell, Hue, ListEl, TableEl } from "@signal-path/engine";

// The floor: the shopper's query runs down the main rail to the results page. The keyword index and the embedding
// model stand behind the rail, each on its own branch, and both are fed from the product table at the back.
// The fuse and rerank blocks join the rail later. The card at the back right shows what a part holds or returns,
// and the board at the front left is the vector space, then the measurements.
const G = isoGrid(120, 165, 30);
const BACK = G.p(17.1, -6.73);  // the card above the results end of the rail
const FRONT = G.p(12.37, 10.97);  // the board in front of the rail

const card = (id: string, title: string, cols: string[], at: number[], rows: TableEl["rows"], extra: Partial<TableEl> = {}) =>
  raise(table(id, 0, 0, 232, cols, rows, { at, title, group: id, ...extra }), BACK, 30);
const strip = (id: string, title: string, sub: string, items: Cell[]) =>
  raise(cells(id, 0, 0, items.length, [42, 32], items, { title, sub, gap: 1, group: id }), BACK, 30);
const notes = (id: string, title: string, items: ListEl["items"]) =>
  raise(list(id, 0, 0, 232, items, { title, group: id }), BACK, 30);

type P = [number, number];
const MAP = raise(plot("map", 0, 0, 300, 190, [0, 10], [0, 10], {
  title: "Product vectors", sub: "1,024 dimensions shown as 2", xt: [], yt: [], xLabel: "component 1", yLabel: "component 2", grid: false, group: "map",
}), FRONT, 18);
const Q: P = [5.6, 6.4], ASK: P = [6.4, 7.3], NORA: P = [6.5, 5.5], VEGA: P = [6.2, 3.9];
const cloud = (id: string, pts: P[], hue: Hue, label?: string) => series(id, "map", "points", pts, { hue, label, labelAt: 0, group: "map" });
const named = (id: string, at: P, label: string) => series(id, "map", "points", [at], { hue: "track", r: 6, label, group: "map" });
const near = (id: string, to: P) => series(id, "map", "line", [Q, to], { tone: "track", w: 2, group: "q" });
const on = (p: P, dx: number, dy: number): P => [Math.round(plotPoint(MAP, ...p)[0] + dx), Math.round(plotPoint(MAP, ...p)[1] + dy)];

const bars = (id: string, title: string, xtl: string[], yr: P, yt: number[], values: number[], hot: number[]) => [
  raise(plot(id, 0, 0, 300, 190, [0.4, values.length + 0.6], yr, { title, xt: values.map((_, i) => i + 1), xtl, yt, group: id }), FRONT, 18),
  series(`${id}-bars`, id, "bars", values.map((v, i) => [i + 1, v] as P), { hue: "track", hot, group: id }),
];

const BUILT = ["prep", "vec", "vq", "hyb", "clicks"];

export default defineGuide({
  id: "case-product-search-that-understands-what-shoppers-mean", track: "case", module: "Use cases", slug: "product-search-that-understands-what-shoppers-mean",
  title: "Product search that understands what shoppers mean",
  summary: "A keyword search is extended piece by piece: prepared product records, an embedding model, a vector index, rank fusion and a reranker, with clicks feeding the evaluation. Then two queries run through it.",
  forLeads: "Meaning and exact words fail on different queries, so the search keeps both indexes. What makes a ranking change safe to ship is a labelled evaluation set and a randomised experiment.",
  status: "draft", minutes: 12,
  counters: ["Indexed by", "Small flat query finds", "Order set by", "Change judged by"],
  whatIf: { label: "What if search matched words alone?", step: 0, from: 7 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Products, queries, ranks, vector sizes and rates are illustrative",
    label: "A shopper's query travels along a rail to a results page. A keyword index and an embedding model with a vector index stand behind the rail, both fed from the product table. Later stops add rank fusion, a reranker and a click log. A chart shows product vectors with the query among them, then recall and experiment results.",
    els: [
      pawn("shopper", 0, 0, "Shopper", "sofa for a small flat", { group: "ask1" }),
      pawn("shopper2", 0, 0, "Shopper", "SOFA-2210", { group: "ask2" }),
      line("m", [G.p(1.5, 0), G.p(20, 0)], { always: true }),
      prism("page", 20, -0.6, 1.2, 1.2, 18, { hue: "sand", glyph: "lines", title: "Results page", at: "e", always: true }),
      drum("kw", 3, -5.5, 1, 30, { hue: "sky", glyph: "search", title: "Keyword index", sub: "title words", at: "n", always: true }),
      line("kq", [G.p(3, 0), G.p(3, -4.5)], { always: true }),
      drum("cat", 5.25, -12.6, 1, 34, { hue: "sand", glyph: "table", title: "Product table", at: "e", always: true }),
      line("feed", [G.p(5.25, -11.6), G.p(5.25, -5.5), G.p(4, -5.5)], { always: true }),

      // Problem: twenty searches, four of them without a click, and the product that should have been found.
      blocks("searches", 4, 1.6, 10, 0.62, Array.from({ length: 20 }, (_, i) => (i % 5 === 3 ? { h: 12, state: "alert" as const } : { h: 12, hue: "paper" as const })), { gap: 0.3, title: "20 searches", sub: "4 end without a click", at: "sw", group: "noclick" }),
      card("ix-miss", "Keyword index", ["term", "titles"], [12, 112], [["couch", "31"], ["loveseat", "7"], { cells: ["sofa", "none"], hue: "rose" }, { cells: ["flat", "none"], hue: "rose" }], { mono: true }),
      raise(doc("rec", 0, 0, 216, 104, "SOFA-2210", ["Nora loveseat, 140 cm", "Two seats, narrow arms", "Photo: in a studio flat"], { group: "rec" }), BACK, 30),

      // Architecture.
      prism("prep", 4.65, -10.5, 1.2, 1.2, 16, { hue: "mint", glyph: "funnel", title: "Prepare", at: "n", group: "prep" }),
      card("recs", "Product records", ["code", "fields", "shown"], [12, 92, 182], [["SOFA-2210", "text, photo", "yes"], ["SOFA-2290", "text, photo", "yes"], { cells: ["SOFA-2305", "unreleased", "no"], strike: true }], { mono: true }),

      line("fv", [G.p(5.25, -5.5), G.p(6.3, -5.5)], { group: "vec" }),
      prism("model", 6.3, -6.1, 1.2, 1.2, 24, { hue: "violet", glyph: "net", title: "Pretrained model", at: "e", group: "vec" }),
      line("mv", [G.p(7.5, -5.5), G.p(12, -5.5)], { group: "vec" }),
      drum("vx", 13, -5.5, 1, 30, { hue: "violet", glyph: "map", title: "Vector index", at: "se", group: "vec" }),
      strip("vecs", "One vector", "1,024 numbers", ["0.12", "-0.48", "0.91", "..."]),

      MAP,
      cloud("tables", [[1.6, 7.6], [2.9, 8.6], [1.2, 6.4]], "sky", "tables"),
      cloud("lamps", [[1.5, 3.2], [2.9, 1.7], [1.2, 1.9], [3.1, 3.1]], "sand", "lamps"),
      cloud("rugs", [[8.3, 2.3], [9.3, 1.6], [7.4, 1.5]], "mint", "rugs"),
      cloud("seats", [[9.0, 8.8], [9.1, 6.6], [5.2, 9.0]], "track"),
      named("ask", ASK, "Ask couch"), named("nora", NORA, "Nora loveseat"), named("vega", VEGA, "Vega daybed"),
      near("n-ask", ASK), near("n-nora", NORA), near("n-vega", VEGA),
      series("query", "map", "points", [Q], { r: 8, hot: [0], group: "q" }),
      pill("q-name", on(Q, -14, -14), "the query", { anchor: "end", on: "map", group: "q" }),

      line("vq", [G.p(6.9, 0), G.p(6.9, -4.9)], { group: "vq" }),
      line("vr", [G.p(13, -4.5), G.p(13, 0)], { group: "vq" }),
      strip("toks", "Query tokens", "5 in, 1 vector out", ["sofa", "for", "a", "small", "flat"]),

      prism("fuse", 12.4, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "merge", title: "Fuse", sub: "by rank", at: "s", group: "hyb" }),
      prism("rerank", 14.6, -0.6, 1.2, 1.2, 24, { hue: "track", glyph: "sort", title: "Reranker", at: "s", group: "hyb" }),
      card("fused", "Rank in each list", ["product", "words", "vectors", "fused"], [12, 92, 132, 184], [{ cells: ["SOFA-2210", "2", "1", "1"], hot: true }, ["SOFA-2290", "1", "3", "2"], ["SOFA-2214", "none", "2", "3"]], { mono: true }),

      line("cl", [G.p(20, -0.6), G.p(20, -4.4)], { w: 3, group: "clicks" }),
      drum("log", 20, -5.4, 1, 22, { hue: "paper", glyph: "pointer", title: "Click log", at: "s", group: "clicks" }),
      notes("eval-set", "Evaluation set", ["500 past queries", { t: "labels: clicked products", hot: true }, "scored on every change"]),
      ...bars("recall", "Recall at 10 on 500 queries", ["words", "vectors", "both"], [0, 1], [0, 0.5, 1], [0.55, 0.7, 0.82], [2]),

      // Execution.
      card("ranked", "Top 3 for the query", ["product", "vectors", "reranked"], [12, 112, 166], [["Ask couch", "1", "3"], { cells: ["Nora loveseat", "2", "1"], hot: true }, ["Vega daybed", "3", "2"]]),
      strip("toks2", "Code tokens", "5 pieces", ["SO", "FA", "-", "22", "10"]),
      raise(table("code-ranks", 0, 0, 300, ["product", "words", "vectors", "fused"], [{ cells: ["SOFA-2210", "1, exact", "4", "1"], hot: true }, ["SOFA-2290", "none", "1", "2"], ["SOFA-2214", "none", "2", "3"]], { at: [12, 104, 186, 248], title: "Rank for the query SOFA-2210", mono: true, group: "code-ranks" }), FRONT, 50),
      notes("exp-plan", "The experiment", ["shoppers split at random", { t: "B: fusion and reranker", hot: true }, "guardrail: order value"]),
      ...bars("exp", "Searches without a click, %", ["A: words only", "B: hybrid"], [0, 25], [0, 10, 20], [20, 13], [1]),
    ],
  },
  steps: [
    step({
      id: "empty", label: "No results", kind: "problem", phase: "problem", title: "No product title contains the shopper's words",
      caption: "The keyword index lists, for each term, the products whose titles contain it. No title contains sofa or flat, so the results page comes back empty.",
      show: ["ask1", "ix-miss"], counters: ["title words", "nothing", "term scores", "opinion"],
      rides: [ride("m", 0, 0.081, "query"), ride("kq", 0.1, 0.62, "query", { then: "0 titles", tone: "alert" }), ride("m", 0.081, 0.895, "0 found", { tone: "alert" })],
      concepts: ["keyword-search"],
      body: ["An inverted index can list, for a term, the documents that contain it. Its dictionary holds every term used in the indexed fields, with the documents for each.",
        "Vinterhus titles its seating as couches and loveseats. The shopper's words are reasonable and absent from the dictionary."],
      claims: ["keyword-search-inverted", "keyword-search-postings"],
    }),
    step({
      id: "noclick", label: "No click", kind: "problem", phase: "problem", title: "A fifth of searches end without a click",
      caption: "The loveseat that fits is in the catalogue. Its text says two seats and 140 cm, and the shopper typed neither. Four searches in twenty end this way.",
      show: ["ask1", "noclick", "rec"], counters: ["title words", "nothing", "term scores", "opinion"],
      rides: [ride("m", 0, 0.895, "query", { via: [0.081], then: "no click", tone: "alert" })],
      body: ["Keyword retrieval matches terms lexically. A product described in other words than the query is invisible to it, however well it fits.",
        { callout: { label: "The gap", text: "The match has to be made on meaning. The index holds only words." } }],
      claims: ["dense-sparse"],
    }),
    step({
      id: "prepare", label: "Records", kind: "mechanism", phase: "architecture", title: "Each product becomes one labelled record",
      caption: "Title, description and photo become one record per product, labelled with whether a shopper may see it. An unreleased sofa is held back, and catalogue changes flow through.",
      show: ["ask1", "prep", "recs"], counters: ["title words", "nothing", "term scores", "opinion"],
      rides: [ride("feed", 0.02, 0.571, "SOFA-2210", { then: "record" })],
      concepts: ["preparing-knowledge", "serving-data-to-ml-and-ai"],
      body: ["Metadata attached to a record can be used as a filter at query time. OWASP advises applying access control at the level of the indexed unit and enforcing scoping inside the index query.",
        "A search index can be created from a source table, with the platform calculating the embeddings. When the source changes, an indexer moves the update through vectorisation and indexing.",
        "A product is short enough to be one record. Longer documents would be split into chunks first."],
      claims: ["preparing-knowledge-metadata", "preparing-knowledge-access", "serving-data-to-ml-and-ai-index-from-table", "serving-data-to-ml-and-ai-source-changes-flow", "preparing-knowledge-why-chunk"],
    }),
    step({
      id: "embed", label: "Vectors", kind: "mechanism", phase: "architecture", title: "A pretrained model places text and photos in one space",
      caption: "The embedding model learned from broad data and is used as it is. Each record becomes one vector of 1,024 numbers. The map keeps the two directions of greatest variance.",
      show: ["ask1", "prep", "vec", "map", "vecs"], counters: ["words and vectors", "nothing", "term scores", "opinion"],
      rides: [ride("feed", 0.02, 0.571, "SOFA-2210", { then: "record" }), ride("mv", 0.1, 0.656, "vector")],
      concepts: ["multimodal-models", "representation-and-transfer-learning", "dimensionality-reduction"],
      body: ["CLIP learns a shared embedding space by training an image encoder and a text encoder so that matching image and text pairs have similar embeddings.",
        "A network pretrained on a very large dataset can serve as a fixed feature extractor for another task. Items that are close in an embedding are more closely related than distant ones. Vinterhus labels no training data.",
        "Principal components analysis finds the directions of greatest variance and represents each point by its coordinates along them. Two dimensions may not be enough to represent the structure of the data, so the map is for inspection."],
      claims: ["multimodal-models-shared-space", "representation-and-transfer-learning-pretrain", "representation-and-transfer-learning-embedding", "dimensionality-reduction-directions", "dimensionality-reduction-two-dims"],
    }),
    step({
      id: "query", label: "Query vector", kind: "mechanism", phase: "architecture", title: "The query becomes a vector among the products",
      caption: "The model reads the query as tokens and returns one vector. The index finds the nearest product vectors by cosine similarity, approximately, without comparing them all.",
      show: ["ask1", "prep", "vec", "vq", "map", "q", "toks"], counters: ["words and vectors", "nearby seating", "distance", "opinion"],
      rides: [ride("m", 0, 0.292, "query"), ride("vq", 0.1, 0.6, "5 tokens"), ride("mv", 0.1, 0.656, "vector"), ride("vr", 0.1, 0.42, "top 3")],
      concepts: ["tokens", "embeddings", "vector-search"],
      body: ["Text given to a model is encoded into a series of tokens. Inside the model each token is converted to a vector by learned embeddings.",
        "Semantic search embeds the corpus into a vector space, embeds the query into the same space and finds the closest embeddings. Similar items are expected to lie close together.",
        "An approximate index trades some recall for speed. An HNSW index is a multilayer graph searched from its upper layer."],
      claims: ["tokens-encoded", "embeddings-vectors", "embeddings-cosine", "embeddings-geometry", "vector-search-embed", "vector-search-approximate", "vector-search-hnsw"],
    }),
    step({
      id: "fuse", label: "Fuse, rerank", kind: "mechanism", phase: "architecture", title: "Two rankings are fused, then reranked",
      caption: "Each index returns its own ranking. Reciprocal rank fusion scores a product by its rank in each list. A reranker then rescores the best candidates against the query.",
      show: ["ask1", "prep", "vec", "vq", "hyb", "map", "q", "fused"], counters: ["words and vectors", "nearby seating", "fusion, then reranker", "opinion"],
      rides: [ride("kq", 0.9, 0.45, "list 1"), ride("vr", 0.1, 0.42, "list 2"), ride("m", 0.622, 0.895, "fused", { then: "top 10" })],
      concepts: ["hybrid-search-and-reranking"],
      body: ["Sparse retrieval matches terms lexically, and dense retrieval searches nearest neighbours over learned vectors. The two fail on different queries.",
        "Reciprocal rank fusion scores a document as the sum over rankings of 1 / (k + rank), with k fixed at 60 in the original paper. It needs ranks only, so scores from the two indexes are never compared."],
      claims: ["dense-sparse", "rrf-formula", "rerank-stage"],
    }),
    step({
      id: "measure", label: "Evaluation", kind: "mechanism", phase: "architecture", title: "Clicks supply the labels that measure retrieval",
      caption: "Recall at 10 needs to know which products are relevant to each query. Clicked products provide those labels, and every ranking change is scored on the same 500 queries.",
      show: ["ask1", ...BUILT, "recall", "eval-set"], counters: ["words and vectors", "nearby seating", "fusion, then reranker", "recall at 10"],
      rides: [ride("m", 0.622, 0.895, "top 10"), ride("cl", 0.05, 0.5, "click", { then: "label" })],
      concepts: ["evaluating-retrieval"],
      body: ["Precision and recall at k need relevance labels for each query. Recall at k is the fraction of the relevant documents that appear in the first k results.",
        "Search quality metrics computed against labels are the tool for a parameter sweep over search algorithm and top k. Test sets and metrics are documented, as the NIST AI Risk Management Framework asks."],
      claims: ["evaluating-retrieval-labels", "evaluating-retrieval-recall-at-k", "evaluating-retrieval-tuning", "evaluating-retrieval-nist-measure"],
    }),
    step({
      id: "vague", label: "A vague query", kind: "mechanism", phase: "execution", title: "A vague query finds the loveseat by meaning",
      caption: "Sofa for a small flat matches no title. Its vector lands beside the seating, and the reranker moves the 140 cm loveseat above the corner couch.",
      show: ["ask1", ...BUILT, "map", "q", "ranked"], counters: ["words and vectors", "Nora loveseat", "fusion, then reranker", "recall at 10"],
      rides: [ride("m", 0, 0.081, "query"), ride("kq", 0.1, 0.62, "query", { then: "0 titles", tone: "alert" }), ride("m", 0.081, 0.292, "query"), ride("vq", 0.1, 0.6, "query", { then: "vector" }), ride("vr", 0.1, 0.42, "top 3"), ride("m", 0.622, 0.895, "top 3", { then: "loveseat" })],
      concepts: ["vector-search", "embeddings", "hybrid-search-and-reranking"],
      body: ["The query is embedded into the same space as the products, and the closest embeddings are returned. The keyword ranking is empty, so fusion passes on the vector ranking alone.",
        "The reranker rescores each candidate against the query. Nearness in the vector space put a large couch first, and the rescoring corrects the order."],
      claims: ["vector-search-embed", "embeddings-geometry", "rerank-stage"],
    }),
    step({
      id: "code", label: "A product code", kind: "watch-out", phase: "execution", title: "A product code is found by its exact term",
      caption: "The tokeniser breaks SOFA-2210 into pieces, and its vector lands among other sofas. The keyword index holds the code as one term and puts the product first.",
      show: ["ask2", ...BUILT, "toks2", "code-ranks"], counters: ["words and vectors", "Nora loveseat", "fusion, then reranker", "recall at 10"],
      rides: [ride("m", 0, 0.081, "code"), ride("kq", 0.1, 0.62, "SOFA-2210", { then: "1 exact" }), ride("m", 0.081, 0.292, "code"), ride("vq", 0.1, 0.6, "5 pieces"), ride("vr", 0.1, 0.42, "similar"), ride("m", 0.622, 0.895, "2 rankings", { then: "SOFA-2210" })],
      concepts: ["tokens", "keyword-search", "hybrid-search-and-reranking"],
      body: ["Rare and unknown words are encoded as sequences of subword units. Smaller tokens let a model handle strings it has never seen, and the pieces of a product code carry little meaning.",
        "BM25 finds an exact string such as an error code that an embedding model can miss. Its score rises when a term is rare across the index, and a product code occurs once.",
        { callout: { label: "Why keywords stay", text: "Meaning finds what the shopper described. Exact terms find what the shopper named." } }],
      claims: ["tokens-subword-units", "tokens-definition", "bm25-exact-strings", "keyword-search-tfidf"],
    }),
    step({
      id: "ship", label: "Ship", kind: "decision", phase: "execution", title: "What decides a ranking change",
      caption: "",
      show: ["ask1", ...BUILT, "exp", "exp-plan"], counters: ["words and vectors", "Nora loveseat", "fusion, then reranker", "an experiment"],
      rides: [ride("m", 0, 0.47, "variant A", { via: [0.081] }), ride("m", 0, 0.895, "variant B", { via: [0.081, 0.292] }), ride("cl", 0.05, 0.5, "click")],
      concepts: ["online-experiments-and-causal-effect", "evaluating-retrieval"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Recall on labelled queries", "A randomised experiment", "Guardrail metrics"] },
        right: { label: "Do not rely on", items: ["A few favourite queries", "Clicks compared across weeks", "The loudest opinion"] },
      } },
        "In an A/B test users are randomly exposed to one of two variants. Random assignment makes the change the only consistent difference, so a difference in the measure is caused by it. Patterns found in logs are correlational.",
        "Guardrail metrics measure what should not degrade. Systems are tested before deployment and regularly while in operation."],
      claims: ["online-experiments-and-causal-effect-ab", "online-experiments-and-causal-effect-causality", "online-experiments-and-causal-effect-correlational", "online-experiments-and-causal-effect-guardrail", "online-experiments-and-causal-effect-hippo", "evaluating-retrieval-nist-monitor"],
    }),
  ],
  governance: { text: "The index holds only what a shopper may see: visibility labels travel with each record and are enforced inside the index. Ranking changes ship through a randomised experiment.", claims: ["preparing-knowledge-access", "vector-search-access", "online-experiments-and-causal-effect-causality"] },
  closing: {
    pitfalls: [
      "Replacing the keyword index with vectors and losing product codes.",
      "Filtering unreleased products after retrieval, not inside the index.",
      "Shipping a ranking change because a few test queries look better.",
    ],
    questions: [
      "Why does the small flat query return nothing from the keyword index?",
      "What does the reranker see that the vector index does not?",
      "Which products should never reach either index?",
    ],
  },
});
