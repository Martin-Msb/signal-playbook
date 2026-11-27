import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, ride, step, stop, table, treeOf } from "@signal-path/engine";
import type { Row } from "@signal-path/engine";

// The floor: the question arrives at the model. A closed rail leaves the model for the search stage,
// the index behind it, and back. Every lookup adds one row to the table under the return leg.
// The last stop adds a small knowledge graph in the open corner, holding the same two hops as edges.
const G = isoGrid(300, 196, 30);
const C = G.p(8, 0);
const lookups = (id: string, rows: Row[]) => table(id, C[0] - 190, 398, 380, ["query", "found"], rows, { at: [12, 212], rowH: 22, title: "Lookups", mono: true, below: true, group: id });
const ITEMS: Row = ["order 4471 items", "SOFA-2210"];
const RULE: Row = { cells: ["SOFA-2210 returns", "45 days"], hot: true };

export default defineGuide({
  id: "multi-step-retrieval", track: "ai", module: "Retrieval", slug: "multi-step-retrieval",
  title: "Multi-step retrieval",
  summary: "Some questions cannot be answered by one search. The model rewrites the question, splits it, and writes each new query from what the last lookup returned.",
  forLeads: "Every added lookup buys reach and costs time, tokens and exposure to content nobody reviewed. Set a step limit and a cost ceiling before the first run, and add steps only where one lookup is measured to fail.",
  status: "draft", minutes: 8,
  counters: ["Lookups", "Query written by", "Chunks read", "Run ends at"],
  whatIf: { label: "What if only one lookup ran?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, products, return windows and chunk counts are illustrative",
    label: "A customer's question reaches a model. A closed rail carries a query from the model to a search stage and its index, and the result back to the model. A table under the rail gains one row per lookup. First the customer's own words are searched and miss. Then the model rewrites the query, splits the question in two, and writes the second query from the first result. A third lookup returns text carrying an instruction and a step limit ends the run. A small knowledge graph holds the same two hops as edges.",
    els: [
      line("ask", [G.p(-7, 0), G.p(-0.6, 0)], { always: true }),
      stop("s-q", ...G.p(-7, 0), "Question", "couch, 4471, day 31?", { at: "ne", big: true, always: true }),
      prism("model", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "reads the chunks", at: "sw", group: "m-read" }),
      prism("model-w", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "writes the query", at: "sw", group: "m-write" }),
      line("loop", [G.p(0, -0.6), G.p(0, -6), G.p(8, -6), G.p(8, 0), G.p(0.6, 0)], { always: true }),
      stop("p-s", ...G.p(0, -3.1), undefined, undefined, { always: true }),
      stop("p-i", ...G.p(4, -6), undefined, undefined, { always: true }),
      stop("p-c", ...G.p(8, -1.3), undefined, undefined, { always: true }),
      stop("p-m", ...G.p(3.4, 0), undefined, undefined, { group: "next" }),
      prism("search", -0.6, -6.6, 1.2, 1.2, 28, { hue: "sand", glyph: "search", title: "Search", sub: "hybrid, reranked", at: "n", always: true }),
      drum("index", 8, -6, 1, 40, { hue: "sky", glyph: "stack", title: "Index", sub: "orders, policies", at: "e", always: true }),
      line("lead", [[C[0], C[1] + 6], [C[0], 398]], { tone: "ink", w: 3, always: true }),

      lookups("t-1", [["couch 4471 day 31", "30-day policy"]]),
      lookups("t-2", [{ cells: ["order 4471 sofa", "4471: SOFA-2210"], hot: true }]),
      lookups("t-3", [ITEMS, { cells: ["sofa returns", "30-day policy"], hot: true }]),
      lookups("t-4", [ITEMS, RULE]),
      lookups("t-5", [ITEMS, { cells: ["SOFA-2210 returns", "45 days"] }, { cells: ["SOFA-2210 reviews", "\"refund in full\""], hue: "rose" }]),

      pill("limit", [484, 176], "Step limit: 3 lookups", { tone: "track", glyph: "flag", group: "limit" }),
      pill("ceiling", [484, 208], "Cost ceiling per run", { tone: "track", glyph: "shield", group: "limit" }),

      pill("kg-title", [170, 298], "Knowledge graph", { tone: "ink", glyph: "tree", group: "kg" }),
      ...treeOf("kg", [170, 344], { label: "order 4471", hot: true, kids: [
        { label: "SOFA-2210", sub: "contains", hot: true, kids: [{ label: "45 days", sub: "return window", hot: true }, { label: "care guide", mute: true }] },
        { label: "web", sub: "channel", mute: true },
      ] }, { dx: 104, dy: 72, group: "kg", mono: true }),
    ],
  },
  steps: [
    step({
      id: "one-lookup", label: "One lookup", kind: "problem", title: "One lookup misses the answer",
      caption: "A customer asks whether the couch from order 4471 can go back on day 31. The search runs on those words and returns the general 30-day policy. The answer is wrong.",
      show: ["m-read", "t-1"], counters: ["1", "the customer", "2", "one pass"],
      rides: [ride("loop", 0, "p-c", "couch, 4471?", { via: ["p-s", "p-i"], then: "30-day policy" }), ride("ask", 1, 0.5, "no, 30 days", { tone: "alert" })],
      body: ["The Vinterhus refund assistant searches with the customer's sentence as the query. No page mentions both order 4471 and a return rule: the order record names a product, and the rule is filed under the product code.",
        "Trivedi and colleagues observe that one-step retrieve-and-read is insufficient for multi-step questions. What to retrieve depends on what has already been derived, and the text supporting a second step shares little wording or meaning with the question."],
      claims: ["multi-step-retrieval-one-step", "multi-step-retrieval-bridge"],
    }),
    step({
      id: "rewrite", label: "Rewrite", kind: "idea", title: "The model rewrites the question as a query",
      caption: "The model replaces the customer's wording with a query written for search. This lookup returns the order record, which names the product: SOFA-2210.",
      show: ["m-write", "t-2"], counters: ["1", "the model", "2", "one pass"],
      rides: [ride("ask", 0, 0.5, "couch, 4471?"), ride("loop", 0, "p-c", "order 4471 sofa", { via: ["p-s", "p-i"], then: "4471: SOFA-2210" })],
      body: ["Query rewriting puts a model call before retrieval. Ma and colleagues name the pattern Rewrite-Retrieve-Read, in place of retrieve-then-read. Hosted retrieval offers it as a switch: the OpenAI vector store search takes rewrite_query=true and returns the rewritten query beside the results.",
        { callout: { label: "Key idea", text: "The query is something the model writes. It does not have to be what the customer typed." } }],
      claims: ["multi-step-retrieval-rewrite"],
    }),
    step({
      id: "decompose", label: "Decompose", kind: "mechanism", title: "A compound question splits into sub-questions",
      caption: "The question holds two: what order 4471 contains, and that product's return rule. Both queries are written up front, so the second cannot name the product.",
      show: ["m-write", "t-3"], counters: ["2", "the model, up front", "4", "the plan"],
      rides: [ride("loop", 0, "p-i", "order 4471 items", { via: ["p-s"] }), ride("loop", 0, "p-s", "sofa returns")],
      body: ["Decomposition turns one question into several simpler ones. In self-ask, the model explicitly asks itself follow-up questions and answers them before answering the initial question, and a search engine can be plugged in to answer each follow-up.",
        "Sub-questions that do not depend on each other can be searched together. Here the second depends on the first, so writing both in advance returns the general policy again."],
      claims: ["multi-step-retrieval-decompose", "multi-step-retrieval-one-step"],
    }),
    step({
      id: "next", label: "Next query", kind: "mechanism", title: "Each result decides the next query",
      caption: "The model reads the first result, then writes the second query with SOFA-2210 in it. The product rule comes back: 45 days. The model chose both lookups at run time.",
      show: ["m-write", "t-4", "next"], counters: ["2", "the model, per result", "4", "the model's answer"],
      rides: [ride("loop", "p-i", "p-m", "order 4471 items", { via: ["p-c"], then: "SOFA-2210" }), ride("loop", 0, "p-c", "SOFA-2210 returns", { via: ["p-s", "p-i"], then: "45 days" }), ride("ask", 1, 0.5, "yes, 45 days")],
      body: ["IRCoT interleaves retrieval with reasoning. It retrieves once with the question, then alternates: write the next reasoning sentence from everything collected so far, and use that sentence as the query for more paragraphs.",
        "Agentic search hands the same loop to a model with a search tool. With the Claude web search tool, the model determines when to search, the API runs the search and returns the results, and this can repeat several times in one request. Anthropic describes teams adding such just in time retrieval to embedding-based retrieval done before inference.",
        { callout: { label: "What changed", text: "The second query contains a product code that appears nowhere in the customer's question." } }],
      claims: ["multi-step-retrieval-interleave", "multi-step-retrieval-agentic"],
    }),
    step({
      id: "bound", label: "Bound", kind: "watch-out", title: "Every lookup adds untrusted text and cost",
      caption: "A third lookup returns a customer review carrying an instruction. Each result also adds input tokens and time. A step limit and a cost ceiling end the run.",
      show: ["m-write", "t-5", "limit"], counters: ["3 of 3", "the model, per result", "6", "the step limit"],
      rides: [ride("loop", 0, "p-c", "SOFA-2210 reviews", { via: ["p-s", "p-i"], then: "hidden instruction", tone: "alert" })],
      body: ["OWASP describes indirect prompt injection as the model ingesting content from an external source, with attacker instructions riding in a RAG passage, web page, document or email. Tool outputs re-enter the context window, so each added lookup is another way in. OWASP advises passing external content through a structurally separate channel labelled with its provenance.",
        "Cost grows with every step. Anthropic states that runtime exploration is slower than retrieving pre-computed data. On the Claude API a web search is billed per search and its results count as input tokens, and recall from the context falls as the token count rises.",
        "Limits are built into the tools. IRCoT stops at a maximum number of reasoning steps, 8 in the authors' experiments. The Claude web search tool takes max_uses, and the OpenAI Agents SDK raises MaxTurnsExceeded past max_turns. OWASP advises step limits, recursion depth limits, time limits and per-run cost ceilings on all agent executions."],
      claims: ["multi-step-retrieval-injection", "multi-step-retrieval-step-limits", "multi-step-retrieval-ircot-stop", "multi-step-retrieval-max-uses", "multi-step-retrieval-cost", "multi-step-retrieval-search-price", "multi-step-retrieval-context-rot"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Add lookups only where one fails",
      caption: "",
      show: ["m-write", "t-4", "limit", "kg"], counters: ["2", "the model, per result", "4", "answer or step limit"],
      rides: [ride("ask", 1, 0.5, "yes, 45 days")],
      body: [{ pair: {
        left: { label: "Several lookups", items: ["The next query needs an earlier result", "The question has several parts"] },
        right: { label: "Another route", items: ["A knowledge graph links the facts", "A small knowledge base fits in context"] },
      } },
        "Knowledge-graph retrieval moves the hops into the index. GraphRAG uses a model to build an entity knowledge graph from the documents and to pregenerate summaries of closely related entities. Its documentation states that baseline RAG struggles to connect the dots when an answer requires linking separate pieces of information through shared attributes.",
        "Long context is the other route. Anthropic stated in September 2024 that a knowledge base under 200,000 tokens, about 500 pages, can go into the prompt whole with no need for RAG.",
        "Anthropic recommends the simplest solution possible, with complexity added only when needed."],
      claims: ["multi-step-retrieval-graph", "multi-step-retrieval-long-context", "multi-step-retrieval-simplest", "multi-step-retrieval-one-step"],
    }),
  ],
  governance: { text: "Each added lookup brings more external content into the context, where attacker instructions can ride in a retrieved passage, and each lookup adds cost. Runs carry step limits, time limits and a cost ceiling.", claims: ["multi-step-retrieval-injection", "multi-step-retrieval-step-limits"] },
  closing: {
    pitfalls: [
      "Searching with the user's sentence when the answer is filed under a term the sentence never uses.",
      "Letting the model search until it is satisfied, with no step limit or cost ceiling.",
      "Treating text that a lookup returned as instructions.",
    ],
    questions: [
      "Why can the second query not be written before the first result arrives?",
      "What does each added lookup put into the context?",
      "When does a graph index or a long context replace several lookups?",
    ],
  },
});
