import { blocks, CANVAS, defineGuide, doc, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { BlocksEl, Pt, TableEl } from "@signal-path/engine";

// The floor: a V of rail. The query comes down the left arm past twelve chunks to the inverted index at the
// foot, and the result goes up the right arm, through the permission filter, to the refund assistant.
// Three cards stand above the rail: one chunk as written, the index, and the chunks the query matched.
const G = isoGrid(480, 450, 30);
const IN = 12.5, OUT = 13.7;
const Q = "SOFA-2210 returns";
const DOC = G.p(-9.4, 0), IDX = G.p(0, 0), FIL = G.p(0, -6.3), RES = G.p(0, -8.7), END = G.p(0, -10.9);

/** Twelve chunks beside the left arm. Each variant lights the chunks that are read. */
const HITS = [1, 2, 3, 5, 7, 9];
const chunks = (group: string, item: (n: number) => BlocksEl["items"][number]) =>
  blocks(`chunks-${group}`, -11.4, 0.7, 12, 0.62, Array.from({ length: 12 }, (_, i) => item(i + 1)), { gap: 0.13, title: "12 chunks", at: "sw", group });

const index = (id: string, group: string, weights: boolean, hot: boolean) => raise(table(id, 0, 0, 290,
  weights ? ["term", "in chunks", "weight", "chunks"] : ["term", "in chunks", "chunks"],
  [
    ["policy", "1", "1"], ["refund", "2", "7 11"],
    { cells: ["returns", "5", "1 2 5 7 9"], hot },
    { cells: ["sofa-2210", "3", "2 3 5"], hot },
    ["spec", "1", "3"],
  ].map((r) => {
    const cells = Array.isArray(r) ? r : r.cells;
    const w = cells[0] === "returns" ? "0.86" : cells[0] === "sofa-2210" ? "1.31" : "";
    const out = weights ? [cells[0], cells[1], w, cells[2]] : cells;
    return Array.isArray(r) ? out : { cells: out, hot: r.hot };
  }),
  { at: weights ? [12, 92, 158, 210] : [12, 106, 190], rowH: 22, mono: true, title: "Inverted index", sub: "one row per term", group }), IDX, 115);

const results = (id: string, group: string, title: string, rows: TableEl["rows"]) => raise(table(id, 0, 0, 226,
  ["chunk", "sofa-2210", "returns", "BM25"], rows, { at: [12, 54, 128, 184], rowH: 21, mono: true, title, group }), RES, 96);
const found = (id: string, group: string, title: string) => results(id, group, title,
  [["1", "0", "2", ""], ["2", "2", "2", ""], ["3", "1", "0", ""], ["5", "1", "1", ""], ["7", "0", "1", ""], ["9", "0", "1", ""]]);
const RANKED: string[][] = [["2", "2", "2", "1.36"], ["5", "1", "1", "0.99"], ["3", "1", "0", "0.60"], ["1", "0", "2", "0.54"], ["7", "0", "1", "0.39"], ["9", "0", "1", "0.39"]];

export default defineGuide({
  id: "keyword-search", track: "ai", module: "Retrieval", slug: "keyword-search",
  title: "Keyword search",
  summary: "An inverted index lists, for each term, the chunks that contain it. A query reads one list per term, BM25 ranks the candidates by how rare and how frequent the terms are, and a permission filter decides which of them the caller may see.",
  forLeads: "Keyword search is the retrieval method that finds exact product codes, names and error strings. Access control belongs in the query path: a filter on every query, per document.",
  status: "draft", minutes: 7,
  counters: ["Lookup", "Chunks read", "Order", "Permission check"],
  whatIf: { label: "What if there were no index?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Chunks, counts, weights and scores are illustrative",
    label: "A query travels down a rail past twelve chunks to an inverted index, a table with one row per term that names the chunks containing it. Without the index all twelve chunks are read. With it, two rows name six candidate chunks. A second table ranks the six by BM25 score, and a permission filter on the way to the refund assistant removes one chunk that only Finance may read.",
    els: [
      line("io", [G.p(-IN, 0), IDX, G.p(0, -OUT)], { always: true }),
      stop("s-q", ...G.p(-IN, 0), "Query", undefined, { at: "w", big: true, always: true }),
      pill("query", [16, 18], Q, { glyph: "search", sub: "typed by Support", anchor: "start", always: true }),
      stop("s-doc", ...DOC, undefined, undefined, { always: true }),
      stop("s-idx", ...IDX, undefined, undefined, { big: true, always: true }),
      stop("s-f", ...FIL, undefined, undefined, { always: true }),
      stop("s-r", ...RES, undefined, undefined, { always: true }),
      stop("s-end", ...END, undefined, undefined, { always: true }),
      prism("bot", -0.6, -OUT - 0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Assistant", at: "s", always: true }),

      raise(doc("chunk", 0, 0, 176, 132, "Chunk 2", ["SOFA-2210 returns", "A SOFA-2210 goes", "back in 14 days.", "Returns need the", "order number."], { mono: true, always: true }), DOC, 94),

      chunks("scan", () => ({ h: 14, hue: "sand", hot: true })),
      chunks("idle", () => ({ h: 14, hue: "sand" })),
      chunks("hit", (n) => (HITS.includes(n) ? { h: 14, hue: "sand", hot: true } : { h: 14, hue: "paper" })),
      chunks("perm", (n) => (n === 5 ? { h: 14, state: "closed", label: "5" } : HITS.includes(n) ? { h: 14, hue: "sand", hot: true } : { h: 14, hue: "paper" })),

      index("idx", "idx", false, false),
      index("idx-q", "idx-q", false, true),
      index("idx-w", "idx-w", true, true),

      found("r-scan", "scan", "Found by reading all 12"),
      pill("none", [480, 275], "No index", { tone: "alert", sub: "every chunk is read", group: "scan" }),
      found("r-found", "found", "6 candidates, unranked"),
      results("r-rank", "rank", "Ranked, best first", RANKED.map((cells, i) => (i === 0 ? { cells, hot: true } : cells))),
      results("r-perm", "perm", "Ranked, for Support", RANKED.map((cells, i) => (i === 1 ? { cells, strike: true } : i === 0 ? { cells, hot: true } : cells))),

      prism("filter", -0.6, -6.9, 1.2, 1.2, 26, { hue: "track", glyph: "lock", title: "Permission filter", sub: "on every query", at: "s", group: "perm" }),
      pill("label", [770, 456], "Chunk 5: Finance only", { glyph: "lock", sub: "access label on the chunk", group: "perm" }),
    ],
  },
  steps: [
    step({
      id: "scan", label: "Scan", kind: "problem", title: "Without an index every chunk is read",
      caption: "Support's refund assistant searches for SOFA-2210 returns. Each chunk lists its own terms, so finding the six that match means reading all twelve, for every query.",
      show: ["scan"], counters: ["scan", "all 12", "none", "none"],
      rides: [ride("io", "s-q", "s-idx", Q, { then: "12 chunks read" })],
      body: ["The natural relationship is that a document lists its terms. Answering which documents contain a term from that direction means opening each one.",
        "Lucene's index stores terms and statistics about those terms in order to make term-based search more efficient."],
      claims: ["keyword-search-inverted"],
    }),
    step({
      id: "invert", label: "Invert", kind: "idea", title: "An inverted index lists the chunks for each term",
      caption: "An analyser splits each chunk into terms. The index keeps a dictionary of every term and, for each one, the list of chunks that contain it.",
      show: ["idle", "idx"], counters: ["inverted index", "not yet", "none", "none"],
      rides: [ride("io", "s-doc", "s-idx", "chunk 2", { then: "terms" })],
      body: ["Lucene's index belongs to the family known as inverted indexes because it can list, for a term, the documents that contain it. Each list is the term's postings. With each document the postings carry the term's frequency there, and can carry the positions at which it occurred.",
        "Text becomes terms through analysis. Tokenization breaks the input into tokens, and further steps can include stemming, stop word filtering, text normalisation and synonym expansion.",
        { callout: { label: "Key idea", text: "The work of reading every chunk is done once, when the chunk is indexed, and not again for each query." } },
        "Elasticsearch is based on the Lucene Java libraries, and a Lucene segment is similar to an inverted index."],
      claims: ["keyword-search-inverted", "keyword-search-postings", "keyword-search-analysis", "keyword-search-lucene-based"],
    }),
    step({
      id: "lookup", label: "Look up", kind: "mechanism", title: "A query reads one list per term",
      caption: "The query becomes two terms. Their two rows name six candidate chunks, with the count of each term in each chunk. The other six chunks are never opened.",
      show: ["hit", "idx-q", "found"], counters: ["2 rows of the index", "6 of 12", "none", "none"],
      rides: [ride("io", "s-q", "s-idx", Q, { then: "2 terms" })],
      body: ["The query goes through analysis too. Lucene's guidance is to start with the same analyser for indexing and search, otherwise searches would not find what they are supposed to.",
        "For each term the index also returns the number of documents that contain it at least once. That number is what ranking uses to tell a rare term from a common one."],
      claims: ["keyword-search-postings", "keyword-search-analysis", "keyword-search-docfreq"],
    }),
    step({
      id: "rank", label: "Rank", kind: "mechanism", title: "BM25 ranks by rarity and frequency",
      caption: "A term found in fewer chunks weighs more. Each further occurrence in a chunk adds less, up to a ceiling. The weights of the query's terms sum to the chunk's score.",
      show: ["hit", "idx-w", "rank"], counters: ["2 rows of the index", "6 of 12", "BM25 score", "none"],
      rides: [ride("io", "s-idx", "s-end", "6 candidates", { then: "ranked" })],
      body: ["BM25 uses term frequency and inverse document frequency to score each pair of document and query. The score goes up when a term is rare across the index and common within the document.",
        "Any one term's contribution cannot exceed a saturation point, however often it occurs. Chunk 3 holds the rarer term once and outranks chunk 1, which holds the common term twice.",
        "Term frequency is normalised by document length relative to the average length. Setting b to 1 applies the normalisation in full and 0 switches it off. In Lucene 10.0.0 the defaults are k1 = 1.2 and b = 0.75, and Elasticsearch documents BM25 as its default similarity with the same values.",
        { callout: { label: "Key idea", text: "Rarity is a property of the term across the index. Frequency is a property of the term in one chunk. The score multiplies the two and adds up over the query's terms." } }],
      claims: ["keyword-search-tfidf", "keyword-search-saturation", "keyword-search-length", "keyword-search-params"],
    }),
    step({
      id: "filter", label: "Filter", kind: "mechanism", title: "Permission filters apply per chunk at query time",
      caption: "Chunk 5 carries a Finance-only label. A filter on that label removes it from Support's results. It still counts in the statistics behind every score.",
      show: ["perm", "idx-w"], counters: ["2 rows of the index", "6 of 12", "BM25 score", "per chunk, every query"],
      rides: [ride("io", "s-idx", "s-end", "2 5 3", { via: ["s-f"], then: "2 3 1" })],
      body: ["In the security filter pattern of Foundry IQ (Azure AI Search), each document carries a field of group or user identities and a filter on that field includes or excludes it. Authorisation holds only if the filter is applied to every query, and the application must authenticate users, obtain trusted identities and prevent bypasses.",
        "In Elasticsearch, document level security attaches a query to a role. Documents that do not match the role query are never returned.",
        { callout: { label: "Watch out", text: "Both vendors state that these filters do not change the statistics used for scoring. Document frequency includes documents the caller cannot see, so a score can shift when a hidden document is added or deleted." } }],
      claims: ["keyword-search-security-filter", "keyword-search-dls", "keyword-search-filter-stats"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Where keyword search fits",
      caption: "",
      show: ["perm", "idx-w"], counters: ["2 rows of the index", "6 of 12", "BM25 score", "per chunk, every query"],
      rides: [ride("io", "s-idx", "s-end", "2 3 1", { via: ["s-f"] })],
      body: [{ pair: {
        left: { label: "Finds", items: ["Exact codes, names and error strings", "Rare terms"] },
        right: { label: "Needs", items: ["The query to share a term with the chunk", "A permission filter on every query"] },
      } },
        "Sparse retrieval such as BM25 matches terms lexically. A question worded as refund does not match a chunk that only says returns unless analysis adds the synonym. Dense retrieval searches nearest neighbours over learned vectors instead."],
      claims: ["bm25-exact-strings", "dense-sparse", "keyword-search-analysis", "keyword-search-security-filter"],
    }),
  ],
  governance: { text: "Permissions are enforced when the query runs, document by document: a filter on each chunk's access label, applied to every query, removes what the caller may not read. The filter does not change the statistics used for scoring.", claims: ["keyword-search-security-filter", "keyword-search-dls", "keyword-search-filter-stats"] },
  closing: {
    pitfalls: [
      "Analysing the query differently from the indexed text, so terms that should match do not.",
      "Applying the permission filter in some query paths and not in others.",
      "Comparing scores, or applying one score threshold, across users whose filters differ.",
    ],
    questions: [
      "What does one row of an inverted index hold?",
      "Why does a rare term add more to a score than a common one?",
      "Why can a chunk's score change when a document the caller cannot read is deleted?",
    ],
  },
});
