import { CANVAS, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop } from "@signal-path/engine";
import type { ListEl, Pt } from "@signal-path/engine";

// The floor: the question leaves on two rails, dense along the back and BM25 along the front.
// They meet at the fusion stop, then one rail runs on through the reranker to the model.
// The four rankings hang as a row of boards above their stops.
const G = isoGrid(170, 330, 30);
const R = "SOFA-2210 returns";
const board = (id: string, floor: Pt, title: string, items: ListEl["items"], group: string, extra = {}) => {
  const el = list(id, 0, 0, 178, items, { title, numbered: true, rowH: 24, group, ...extra });
  return raise(el, floor, floor[1] - 34 - 104);
};
const D = G.p(0, -2), B = G.p(8, 0), F = G.p(9, -5), RR = G.p(9, -11);

export default defineGuide({
  id: "hybrid-search-and-reranking", track: "ai", module: "Retrieval", slug: "hybrid-search-and-reranking",
  title: "Hybrid search and reranking",
  summary: "Two retrievers that fail in different ways, one rule that merges their rankings, and a second stage that decides what the model reads.",
  forLeads: "Most retrieval failures are fixed before the model is involved. Hybrid search with a reranker is the baseline to beat before paying for anything more elaborate.",
  status: "draft", minutes: 8,
  counters: ["Finds the product code", "Finds the paraphrase", "Candidates", "Chunks sent to model"],
  whatIf: { label: "What if only dense retrieval ran?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    label: "A question splits onto a dense line and a BM25 line. Their ranked lists merge at a fusion stop that adds reciprocal ranks, a reranker reorders the merged list, and the top two chunks reach the model.",
    els: [
      line("d0", [G.p(0, 0), G.p(0, -5), G.p(9, -5), G.p(9, -15)], { group: "only" }),
      line("dense", [G.p(0, 0), G.p(0, -5), G.p(9, -5)], { group: "two" }),
      line("bm25", [G.p(0, 0), G.p(9, 0), G.p(9, -5)], { group: "bm25" }),
      line("main", [G.p(9, -5), G.p(9, -15)], { group: "fuse" }),
      stop("s-q", ...G.p(0, 0), "Question", "SOFA-2210, day 31?", { at: "sw", big: true, always: true }),
      stop("s-d", ...D, undefined, undefined, { always: true }),
      stop("s-b", ...B, undefined, undefined, { group: "bm25" }),
      stop("s-f", ...F, undefined, undefined, { big: true, group: "fuse" }),
      stop("s-r", ...RR, undefined, undefined, { group: "rer" }),
      stop("p-m0", ...G.p(9, -12.4), undefined, undefined, { group: "only" }),
      stop("p-m", ...G.p(9, -12.4), undefined, undefined, { group: "fuse" }),
      prism("llm", 8.4, -15.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", at: "s", always: true }),

      board("dense-cut", D, "Dense, by meaning", [{ t: "returns policy", hot: true }, { t: "refund timing", hot: true }, R, "sofa care guide"], "only", { cut: 2 }),
      board("dense-l", D, "Dense, by meaning", ["returns policy", "refund timing", { t: R, hot: true }, "sofa care guide"], "two"),
      board("bm25-l", B, "BM25, by exact term", ["SOFA-2210 spec", { t: R, hot: true }, "SOFA-2210 assembly", "sofa care guide"], "bm25"),
      board("fused", F, "Fused by rank", [{ t: R, hot: true }, "sofa care guide", "returns policy", "SOFA-2210 spec"], "fuse"),
      board("rer", RR, "Reranked", [{ t: R, hot: true }, { t: "returns policy", hot: true }, { t: "sofa care guide", strike: true }, { t: "SOFA-2210 spec", strike: true }], "rer", { cut: 2 }),
      pill("cut-l", [D[0] + 96, 78], "top 2 reach the model", { tone: "alert", anchor: "start", group: "only" }),
      pill("rrf", [F[0] - 8, F[1] + 16], "1/63 + 1/62 = 0.0320", { tone: "track", mono: true, anchor: "start", group: "rrf" }),
      pill("cost1", [B[0] - 8, B[1] + 16], "a second index", { tone: "alert", anchor: "start", group: "cost" }),
      pill("cost2", [RR[0] + 8, RR[1] + 16], "one more model call", { tone: "alert", anchor: "end", group: "cost" }),
    ],
  },
  steps: [
    step({
      id: "miss", label: "Miss", kind: "problem", title: "Dense retrieval ranked the right chunk third",
      caption: "A customer asks whether a SOFA-2210 can go back on day 31. Only the top two chunks reach the model, so it answers from the general policy and gets the product rule wrong.",
      show: ["only"], counters: ["missed", "yes", "4", "2"],
      rides: [ride("d0", 0, "p-m0", "query", { via: ["s-d"], then: "top 2" })],
      body: ["A customer asks the Vinterhus assistant whether a SOFA-2210 can go back on day 31. Dense retrieval ranks the general returns policy first and the page about this exact product third.",
        "Only two chunks reach the model. It answers from the general policy and gets the product rule wrong."],
      claims: ["bm25-exact-strings"],
    }),
    step({
      id: "two", label: "Two retrievers", kind: "idea", title: "Dense and sparse retrieval fail differently",
      caption: "Dense retrieval searches nearest neighbours over learned vectors, so it finds paraphrases. BM25 matches terms, so it finds the exact string SOFA-2210.",
      show: ["two", "bm25"], counters: ["yes, by BM25", "yes, by dense", "8", "not yet"],
      rides: [ride("dense", 0, "s-d", "query"), ride("bm25", 0, "s-b", "query")],
      body: ["Dense retrieval searches nearest neighbours over learned vectors, so it finds paraphrases. Sparse retrieval such as BM25 matches terms, so it finds the exact string SOFA-2210.",
        { callout: { label: "Key idea", text: "The chunk both retrievers agree on is the one the first retriever undersold." } }],
      claims: ["dense-sparse", "bm25-exact-strings"],
    }),
    step({
      id: "fuse", label: "Fuse", kind: "mechanism", title: "Fusion merges ranks, not scores",
      caption: "Reciprocal rank fusion gives each document the sum of 1 / (60 + rank) across the lists. The SOFA-2210 returns page is third and second: 1/63 + 1/62 = 0.0320, the highest total.",
      show: ["two", "bm25", "fuse", "rrf"], counters: ["yes", "yes", "6 unique", "not yet"],
      rides: [ride("dense", "s-d", 0.82, "rank 3"), ride("bm25", "s-b", 0.9, "rank 2")],
      body: ["Reciprocal rank fusion gives each document the sum of 1 / (60 + rank) across the lists. The SOFA-2210 returns page is third and second: 1/63 + 1/62 = 0.0320, the highest total.",
        "Ranks are comparable across retrievers. Their raw scores are not."],
      claims: ["rrf-formula"],
    }),
    step({
      id: "rerank", label: "Rerank", kind: "mechanism", title: "A reranker scores question and chunk together",
      caption: "The fused list is a candidate set. A reranker scores each candidate against the question and reorders them. The product page and the general policy reach the model. The care guide does not.",
      show: ["two", "bm25", "fuse", "rer"], counters: ["yes", "yes", "4 reranked", "2"],
      rides: [ride("main", "s-f", "p-m", R, { via: ["s-r"], then: "2 chunks" })],
      body: ["The fused list is a candidate set. A reranker scores each candidate against the question and reorders them, and only the top two go to the model.",
        { callout: { label: "What changed", text: "The product page and the general policy both reach the model. The care guide does not." } }],
      claims: ["rerank-stage"],
    }),
    step({
      id: "cost", label: "Cost", kind: "watch-out", title: "Each stage adds latency and cost",
      caption: "The most quoted vendor benchmark, run on its own datasets, reports 49% fewer retrieval failures from contextual embeddings and contextual BM25, and 67% with reranking. Measure on your own questions first.",
      show: ["two", "bm25", "fuse", "rer", "cost"], counters: ["yes", "yes", "4 reranked", "2"],
      rides: [ride("main", "s-f", "p-m", "2 chunks", { via: ["s-r"] })],
      body: ["Two indexes to keep in step and one more model call per question. The vendor benchmark most often quoted reports 49% fewer failed retrievals from contextual embeddings with contextual BM25, and 67% with reranking added, measured at retrieval on the vendor's own datasets.",
        "Measure retrieval on your own questions before adding a stage."],
      claims: ["contextual-retrieval-numbers", "rag-complexity-earned"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Start with the baseline",
      caption: "",
      show: ["two", "bm25", "fuse", "rer"], counters: ["yes", "yes", "4 reranked", "2"],
      rides: [ride("main", "s-f", "p-m", "2 chunks", { via: ["s-r"] })],
      body: [{ pair: {
        left: { label: "Baseline", items: ["Dense and BM25 in parallel", "Rank fusion", "A reranker over the top candidates"] },
        right: { label: "Add only with evidence", items: ["Query rewriting", "Agentic, multi-step retrieval", "A graph index"] },
      } }],
      claims: ["rag-complexity-earned", "rrf-formula", "rerank-stage"],
    }),
  ],
  governance: { text: "Retrieval is judged by a measured failure rate, not by impression. Anthropic reports its benchmark as the share of top-20 retrievals that fail.", claims: ["contextual-retrieval-numbers"] },
  closing: {
    pitfalls: [
      "Adding the scores of two retrievers as if they shared a scale.",
      "Judging retrieval by the final answer, with no retrieval metric of its own.",
      "Quoting a vendor benchmark as the expected gain on your corpus.",
    ],
    questions: [
      "Which kind of query does each retriever miss?",
      "Why does fusion use ranks?",
      "What does the reranker see that the first stage did not?",
    ],
  },
});
