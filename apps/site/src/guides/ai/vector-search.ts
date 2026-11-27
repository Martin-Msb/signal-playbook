import { CANVAS, defineGuide, isoGrid, line, list, pill, plot, plotPoint, prism, raise, ride, rule, series, shade, step, stop } from "@signal-path/engine";
import type { Hue, ListEl } from "@signal-path/engine";

// One map of passage vectors stands on the right. The query is a point on it, and each stop changes
// which vectors the search compares it with: all of them, one list, two lists, then a permission filter.
// The board on the left is what the search returns. The rail feeds text through the embedding model.
const G = isoGrid(480, 270, 30);
const MAP = raise(plot("map", 0, 0, 470, 340, [0, 10], [0, 10], {
  title: "Passage vectors", sub: "two of many dimensions", xt: [], yt: [], grid: false, always: true,
}), G.p(9, 1.6), 30);

type P = [number, number];
const Q: P = [5.7, 5.7];
const SOFA: P = [6.5, 4.4], LEDGER: P = [7.1, 6.8], POLICY: P = [7.6, 8.0], TIMING: P = [6.1, 8.8];
/** The other passages, list by list. The flag marks the ones only Finance may read. */
const REST: { at: P; list: 1 | 2 | 3 | 4; finance?: boolean }[] = [
  { at: [1.2, 9.0], list: 1 }, { at: [2.6, 7.6], list: 1 }, { at: [0.9, 6.0], list: 1, finance: true }, { at: [3.4, 8.8], list: 1 },
  { at: [5.3, 9.3], list: 2 }, { at: [9.4, 6.3], list: 2, finance: true },
  { at: [1.4, 3.9], list: 3 }, { at: [3.4, 2.4], list: 3, finance: true }, { at: [3.0, 3.9], list: 3 },
  { at: [5.9, 1.5], list: 4 }, { at: [7.0, 1.2], list: 4, finance: true }, { at: [9.3, 1.6], list: 4 },
];
const IN_LIST: Record<number, P[]> = {
  1: REST.filter((r) => r.list === 1).map((r) => r.at),
  2: [LEDGER, POLICY, TIMING, ...REST.filter((r) => r.list === 2).map((r) => r.at)],
  3: REST.filter((r) => r.list === 3).map((r) => r.at),
  4: [SOFA, ...REST.filter((r) => r.list === 4).map((r) => r.at)],
};
/** Thin lines from the query to every vector of a list: the comparisons a scan makes. */
const scan = (id: string, n: number, group: string, dashed = false) =>
  IN_LIST[n].map((to, i) => series(`${id}-${n}-${i}`, "map", "line", [Q, to], { tone: dashed ? "muted" : "track", w: 2, dashed, group }));
const key = (id: string, at: P, label: string, group: string, hue: Hue | null = "sky", alert = !hue) =>
  series(id, "map", "points", [at], { label, hue: hue ?? undefined, r: 6, tone: alert ? "alert" : "track", group });
const at = (p: P, dx: number, dy: number): [number, number] => [plotPoint(MAP, ...p)[0] + dx, plotPoint(MAP, ...p)[1] + dy];

const board = (id: string, items: ListEl["items"], group: string) =>
  raise(list(id, 0, 0, 200, items, { title: "Top 3 returned", numbered: true, rowH: 26, group }), G.p(2.4, 12.6), 34);
const IN = G.p(-11, 1.6), OUT = G.p(-1, 1.6);

export default defineGuide({
  id: "vector-search", track: "ai", module: "Retrieval", slug: "vector-search",
  title: "Vector search",
  summary: "Passages and questions become vectors in one space. An index finds the nearest vectors without comparing them all, and gives up a little recall to do it.",
  forLeads: "Vector search is approximate by design. Recall, speed and memory are tuned against each other, and permissions must be enforced inside the search, not after it.",
  status: "draft", minutes: 7,
  counters: ["Vectors compared", "Lists probed", "True top 3 found", "Results returned"],
  whatIf: { label: "What if only one list were probed?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The two-dimensional map, the 16 passages and the four lists are illustrative",
    label: "A chart of sixteen passage vectors with a query point among them. Exact search draws a comparison to every vector. An index divides the chart into four lists and scans only the list nearest the query, missing the true nearest passage just across a boundary until a second list is probed. A permission filter then removes a Finance passage from the results.",
    els: [
      MAP,
      shade("l1", "map", [0, 5, 5, 10], { tone: "muted", label: "list 1", group: "lists" }),
      shade("l2", "map", [5, 5, 10, 10], { tone: "muted", label: "list 2", group: "lists" }),
      shade("l3", "map", [0, 0, 5, 5], { tone: "muted", label: "list 3", group: "lists" }),
      shade("l4", "map", [5, 0, 10, 5], { tone: "muted", label: "list 4", group: "lists" }),
      rule("cut-x", "map", 5, { tone: "ink", w: 2, group: "lists" }),
      rule("cut-y", "map", 5, { axis: "y", tone: "ink", w: 2, group: "lists" }),
      shade("p1", "map", [5, 5, 10, 10], { tone: "track", group: "probe1" }),
      shade("p2", "map", [5, 0, 10, 5], { tone: "track", group: "probe2" }),

      ...[1, 2, 3, 4].flatMap((n) => scan("all", n, "exact", true)),
      ...scan("s", 2, "probe1"), ...scan("s", 4, "probe2"),
      series("missed", "map", "line", [Q, SOFA], { tone: "alert", w: 3, dashed: true, group: "miss" }),

      series("rest", "map", "points", REST.map((r) => r.at), { hue: "sky", group: "open" }),
      series("rest-acl", "map", "points", REST.map((r) => r.at), { hues: REST.map((r) => (r.finance ? "sand" : "sky")), group: "acl" }),
      key("sofa", SOFA, "sofa returns", "found"), key("sofa-miss", SOFA, "sofa returns", "miss", null),
      key("ledger", LEDGER, "refund ledger", "open"), key("ledger-acl", LEDGER, "refund ledger", "acl", "sand", true),
      key("policy", POLICY, "returns policy", "names"), key("timing", TIMING, "refund timing", "names"),
      series("query", "map", "points", [Q], { r: 8, hot: [0], always: true }),
      pill("q-name", at(Q, -16, -15), "query", { anchor: "end", on: "map", always: true }),
      pill("not-scanned", at(SOFA, 40, 14), "nearest, not scanned", { tone: "alert", on: "map", group: "miss" }),
      pill("legend", at([0.2, 1.3], 0, 0), "sand: Finance only", { glyph: "lock", anchor: "start", on: "map", group: "acl" }),

      line("rail", [IN, OUT], { always: true }),
      stop("s-passages", ...IN, "Passages", "policy chunks", { at: "sw", big: true, group: "ingest" }),
      stop("s-question", ...IN, "Question", "day 31 return?", { at: "sw", big: true, group: "ask" }),
      stop("s-model", ...G.p(-6, 1.6), undefined, undefined, { always: true }),
      stop("s-out", ...OUT, undefined, undefined, { always: true }),
      prism("model", -6.7, 0.9, 1.4, 1.4, 30, { hue: "violet", glyph: "net", title: "Embedding model", at: "n", always: true }),

      board("r-exact", [{ t: "sofa returns", hot: true }, "refund ledger", "returns policy"], "r-exact"),
      board("r-one", ["refund ledger", "returns policy", "refund timing"], "r-one"),
      board("r-miss", ["refund ledger", "returns policy", { t: "refund timing", tone: "alert" }], "r-miss"),
      board("r-filter", [{ t: "sofa returns", hot: true }, { t: "refund ledger", strike: true }, "returns policy"], "r-filter"),
      board("r-final", [{ t: "sofa returns", hot: true }, "returns policy", "refund timing"], "r-final"),
      pill("gone", [300, 432], "sofa returns missing", { tone: "alert", anchor: "start", group: "r-miss" }),
      pill("inside", [300, 432], "filtered in the index", { glyph: "lock", anchor: "start", group: "r-final" }),
      pill("short", [300, 432], "2 of 3 returned", { tone: "alert", anchor: "start", group: "r-filter" }),
    ],
  },
  steps: [
    step({
      id: "exact", label: "Exact", kind: "problem", title: "Exact search compares every vector",
      caption: "An embedding model maps each policy passage to one vector. The refund assistant embeds a question the same way, and exact search compares it with all 16 vectors.",
      show: ["open", "found", "names", "exact", "ingest", "r-exact"], counters: ["16 of 16", "no index", "3 of 3", "3"],
      rides: [ride("rail", "s-passages", "s-out", "passage", { via: ["s-model"], then: "1 vector" })],
      body: ["Preparing knowledge cut the Vinterhus policies into passages. A text embedding model places every passage, and later every question, in the same vector space, and search returns the closest embeddings.",
        "Exact nearest neighbour search has perfect recall. It compares the query with every stored vector, so each added passage is one more comparison."],
      claims: ["vector-search-embed", "vector-search-exact"],
    }),
    step({
      id: "lists", label: "Index", kind: "idea", title: "An index divides the vectors into lists",
      caption: "An IVF index groups the vectors into lists and searches only the lists closest to the query. One list is scanned here: 5 comparisons, not 16.",
      show: ["open", "found", "names", "lists", "probe1", "ask", "r-one"], counters: ["5 of 16", "1 of 4", "not checked", "3"],
      rides: [ride("rail", "s-question", "s-out", "day 31 return?", { via: ["s-model"], then: "query vector" })],
      body: ["In pgvector an IVFFlat index divides vectors into lists and searches a subset of them. Faiss describes the same structure as cells and inverted lists, with nprobe lists selected at query time.",
        { callout: { label: "Key idea", text: "The index decides which vectors are never compared. That is where the speed comes from." } }],
      claims: ["vector-search-ivf"],
    }),
    step({
      id: "miss", label: "Recall", kind: "watch-out", title: "The nearest vector can sit in another list",
      caption: "The sofa returns passage is the true nearest, but it lies in list 4, which was not scanned. An approximate index trades some recall for speed.",
      show: ["open", "miss", "names", "lists", "probe1", "ask", "r-miss"], counters: ["5 of 16", "1 of 4", "2 of 3", "3"],
      rides: [ride("rail", "s-question", "s-out", "day 31 return?", { via: ["s-model"], then: "probes = 1" })],
      body: ["The index still returns three passages, but only two of them belong to the true top three. pgvector states the trade plainly: an approximate index gives up some recall for speed.",
        "Every approximate nearest neighbour method has parameters that set the trade between recall and speed."],
      claims: ["vector-search-approximate"],
    }),
    step({
      id: "probes", label: "Probes", kind: "mechanism", title: "More probes buy recall with speed",
      caption: "Probing two lists finds the missed passage at a cost of 9 comparisons. Probing every list is exact search again. HNSW graph indexes offer the same dial.",
      show: ["open", "found", "names", "lists", "probe1", "probe2", "ask", "r-exact"], counters: ["9 of 16", "2 of 4", "3 of 3", "3"],
      rides: [ride("rail", "s-question", "s-out", "day 31 return?", { via: ["s-model"], then: "probes = 2" })],
      body: ["pgvector probes one list by default. A higher value gives better recall at the cost of speed, and probes equal to the number of lists is exact search.",
        "An HNSW index is a multilayer graph, and search starts from its upper layer. In pgvector it has a better speed-recall trade-off than IVFFlat but builds more slowly and uses more memory, and hnsw.ef_search is its recall dial.",
        "Quantisation shrinks the index: pgvector indexes vectors at half precision or as binary codes re-ranked by the original vectors, and Faiss product quantisation stores each sub-vector in a few bits."],
      claims: ["vector-search-probes", "vector-search-hnsw", "vector-search-quantisation"],
    }),
    step({
      id: "filter", label: "Permissions", kind: "watch-out", title: "A filter after the scan returns fewer results",
      caption: "Support may not read Finance passages. With an approximate index, pgvector applies the filter after the scan, so the ledger is removed and two results remain.",
      show: ["acl", "found", "names", "lists", "probe1", "probe2", "ask", "r-filter"], counters: ["9 of 16", "2 of 4", "3 of 3", "2"],
      rides: [ride("rail", "s-question", "s-out", "day 31 return?", { via: ["s-model"], then: "role: support" })],
      body: ["pgvector's own example: if a condition matches 10% of rows, an HNSW scan with the default candidate list of 40 leaves about 4 rows. Iterative index scans automatically scan more of the index when needed, and pgvector suggests partial indexing or partitioning for filtered columns.",
        "Vector databases such as Qdrant keep tenants in one collection and filter on a tenant field inside the search, so each tenant sees only its own data."],
      claims: ["vector-search-filter", "vector-search-tenant", "vector-search-access"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Tune recall and filter inside the index",
      caption: "",
      show: ["acl", "found", "names", "lists", "probe1", "probe2", "ask", "r-final"], counters: ["9 of 16", "2 of 4", "3 permitted", "3"],
      rides: [ride("rail", "s-question", "s-out", "day 31 return?", { via: ["s-model"], then: "3 permitted" })],
      body: [{ pair: {
        left: { label: "Exact search", items: ["Perfect recall", "Every vector compared"] },
        right: { label: "Approximate index", items: ["Some recall traded for speed", "Probes or ef_search set the trade", "Permission filter in the index"] },
      } }],
      claims: ["vector-search-exact", "vector-search-approximate", "vector-search-probes", "vector-search-access"],
    }),
  ],
  governance: { text: "Enforce permissions and tenant isolation inside the vector store, so a search can return only what the caller may read. OWASP recommends permission-aware vector stores and strict partitioning, because misaligned access controls expose embeddings that contain sensitive information.", claims: ["vector-search-access", "vector-search-tenant"] },
  closing: {
    pitfalls: [
      "Assuming an indexed search returns the same results as an exact one.",
      "Tuning for speed without measuring recall against exact search.",
      "Filtering by permission after retrieval, or leaving it to the model.",
    ],
    questions: [
      "Why can an index miss the true nearest vector?",
      "What does raising the number of probes cost?",
      "Where must a permission filter run for a search to return enough permitted results?",
    ],
  },
});
