import { CANVAS, defineGuide, isoGrid, line, pill, plot, plotPoint, raise, ride, series, step, stop, table } from "@signal-path/engine";

const G = isoGrid(480, 270, 30);
const MAP = raise(plot("map", 0, 0, 420, 300, [0, 10], [0, 10], {
  title: "A learned vector space", xt: [0, 5, 10], yt: [0, 5, 10],
  xLabel: "dimension 1", yLabel: "dimension 2", always: true,
}), G.p(7.8, 1.5), 30);
const VECTOR = (id: string, word: string, x: number, y: number, group: string) =>
  series(id, "map", "points", [[x, y]], { label: word, group });
const WORDS = [
  VECTOR("refund", "refund", 2, 8, "space"), VECTOR("return", "return", 3.2, 7.1, "space"),
  VECTOR("exchange", "exchange", 4.4, 6.1, "space"), VECTOR("sofa", "sofa", 8.1, 2, "space"),
  VECTOR("cushion", "cushion", 7.1, 3.1, "space"), VECTOR("lamp", "lamp", 8, 4.2, "space"),
];
const QUERY = series("query", "map", "line", [[0.5, 9], [2, 8]], { tone: "track", w: 3, group: "query" });
const NEAR = series("near", "map", "line", [[2, 8], [3.2, 7.1], [4.4, 6.1]], { tone: "muted", w: 2, dashed: true, group: "near" });
const POSITION = series("position", "map", "line", [[3.2, 7.1], [4.8, 8.8]], { tone: "sand", w: 3, group: "position" });
const DEST = stop("target", ...plotPoint(MAP, 2, 8), undefined, undefined, { group: "query" });
const FLOW = line("flow", [[65, 485], [275, 485]], { always: true });
const FLOW_START = stop("flow-start", 65, 485, undefined, undefined, { always: true });
const FLOW_MID = stop("flow-mid", 170, 485, undefined, undefined, { always: true });
const FLOW_END = stop("flow-end", 275, 485, undefined, undefined, { always: true });

export default defineGuide({
  id: "embeddings", track: "ai", module: "Foundations", slug: "embeddings",
  title: "Embeddings",
  summary: "A model turns each token into a learned vector. Training arranges vectors so that useful relationships can be measured in their shared space.",
  forLeads: "Embeddings turn text into model inputs and make semantic search possible. The geometry is learned, task-specific and not a human-readable map.",
  status: "draft", minutes: 7,
  counters: ["Token", "Representation", "Position", "Use"],
  whatIf: { label: "What if similar words had unrelated vectors?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The two-dimensional map and its coordinates are illustrative",
    label: "Token labels enter a learned embedding table and become vectors. Their plotted positions are a two-dimensional sketch of a much larger learned space. Nearby vectors can support similarity search, while positional information helps a transformer represent word order.",
    els: [
      MAP, ...WORDS,
      FLOW, FLOW_START, FLOW_MID, FLOW_END,
      raise(table("lookup", 0, 0, 230, ["token", "vector"], [["refund", "learned"], ["return", "learned"], ["sofa", "learned"]], {
        at: [12, 88], rowH: 27, title: "Embedding table", sub: "token lookup", group: "lookup",
      }), G.p(-8, 1.5), 30),
      line("lookup-rail", [G.p(-2, 1.5), G.p(2, 1.5)], { group: "lookup" }),
      stop("lookup-in", ...G.p(-2, 1.5), undefined, undefined, { group: "lookup" }),
      stop("lookup-out", ...G.p(2, 1.5), undefined, undefined, { group: "lookup" }),
      QUERY, DEST,
      NEAR,
      POSITION,
      pill("pos-label", [760, 470], "position added to token vector", { tone: "sand", group: "position" }),
    ],
  },
  steps: [
    step({
      id: "symbols", label: "Symbols", kind: "problem", title: "Token IDs are only labels",
      caption: "The refund assistant reads the tokens “refund” and “return”. Their token IDs distinguish the symbols, but the numbers alone do not say how the words relate.",
      show: ["lookup"], counters: ["refund", "token ID", "not added", "unrelated symbols"],
      rides: [ride("flow", "flow-start", "flow-mid", "refund")],
      body: ["Tokenisation, covered in Tokens, gives the model discrete symbols. A separate learned table supplies a vector for each token."],
      claims: ["embeddings-lookup"],
    }),
    step({
      id: "lookup", label: "Lookup", kind: "idea", title: "A lookup returns a vector",
      caption: "The embedding table maps each token to a learned list of numbers. A point on this chart sketches that vector with two coordinates; real embeddings have many dimensions.",
      show: ["lookup", "space"], counters: ["refund", "learned vector", "not added", "coordinates"],
      rides: [ride("flow", "flow-mid", "flow-end", "vector")],
      body: ["A neural embedding layer is a lookup table with one vector per entry. The chart shows only two illustrative dimensions."],
      claims: ["embeddings-lookup", "embeddings-vectors"],
    }),
    step({
      id: "geometry", label: "Geometry", kind: "mechanism", title: "Training gives the space structure",
      caption: "Training on language usage can place related words near each other. Refund, return and exchange sit close in this illustrative map; the coordinates are not universal definitions.",
      show: ["space", "near"], counters: ["return", "learned vector", "not added", "nearby vectors"],
      rides: [ride("flow", "flow-start", "flow-end", "related usage")],
      body: ["Word vector research found that learned representations can capture syntactic and semantic regularities. Mikolov and colleagues report that accuracy depends on vector dimensionality and the amount of training data."],
      claims: ["embeddings-geometry"],
    }),
    step({
      id: "order", label: "Position", kind: "mechanism", title: "Position adds information about order",
      caption: "A transformer needs order as well as token identity. In the original Transformer, positional encodings are added to input embeddings before attention.",
      show: ["space", "position"], counters: ["return", "token vector", "position added", "ordered input"],
      rides: [ride("flow", "flow-start", "flow-end", "position")],
      body: ["Positional information shares the embedding's dimensions and is added before the Transformer processes the sequence. Attention and the transformer explains how later layers use the sequence."],
      claims: ["embeddings-position"],
    }),
    step({
      id: "search", label: "Similarity", kind: "watch-out", title: "Cosine similarity ranks the candidates",
      caption: "A search model encodes a query and documents, then ranks them by cosine similarity. An approximate index retrieves nearby candidates faster, but can miss some high-similarity vectors.",
      show: ["space", "query"], counters: ["refund query", "query vector", "position-aware", "ranked candidates"],
      rides: [ride("flow", "flow-start", "flow-end", "refund query")],
      body: ["Sentence Transformers uses cosine similarity by default for semantic search and recommends matching query and document encoding for asymmetric search. Approximate nearest-neighbour indexes trade exactness for search speed."],
      claims: ["embeddings-cosine", "embeddings-search"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Keep vectors governed",
      caption: "",
      show: ["space", "query", "position"], counters: ["customer text", "derived vector", "position-aware", "governed data"],
      rides: [ride("flow", "flow-start", "flow-end", "refund query")],
      body: [{ pair: {
        left: { label: "Use", items: ["A model matched to the search task", "Cosine similarity for comparable vectors", "A vector index"] },
        right: { label: "Check", items: ["Whether vectors retain personal data", "Access and retention in the vector store", "Deletion of source and derived records"] },
      } }],
      claims: ["embeddings-cosine", "embeddings-personal-data"],
    }),
  ],
  governance: { text: "The GDPR defines personal data as any information relating to an identifiable person and grants erasure on specified grounds. Assess whether vectors derived from customer text meet that definition, and apply access, retention and erasure controls to them as to the source text.", claims: ["embeddings-personal-data"] },
  closing: {
    pitfalls: [
      "Reading a two-dimensional sketch as the model's actual space.",
      "Assuming nearby vectors mean the statements are interchangeable or true.",
      "Deleting source text while leaving its governed vector in an index.",
    ],
    questions: [
      "What does the embedding table return for a token?",
      "Why does a transformer add positional information?",
      "What control must follow a vector derived from personal text?",
    ],
  },
});
