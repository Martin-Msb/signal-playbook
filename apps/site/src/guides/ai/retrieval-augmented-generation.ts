import { CANVAS, defineGuide, doc, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step } from "@signal-path/engine";
import type { ListEl } from "@signal-path/engine";

// The floor: three arms meet at the application. The Support agent is front left, the index back left
// and the model back right. Policy documents feed the index from the far left. What the retriever returned
// stands on a card between the index and the model, what the model was given stands on a card behind the model,
// and the answer stands front right.
const G = isoGrid(470, 330, 30);
const K = "retrieval-augmented-generation-";
const found = (id: string, title: string, items: ListEl["items"]) => raise(list(id, 0, 0, 190, items, { title, numbered: true, rowH: 24, group: id }), G.p(-5, -4.5), 20);
const context = (id: string, items: ListEl["items"]) => raise(list(id, 0, 0, 196, items, { title: "In the context", rowH: 24, group: id }), G.p(-2.5, -10), 16);
const answer = (id: string, title: string, lines: string[], extra = {}) => raise(doc(id, 0, 0, 236, 106, title, lines, { group: id, ...extra }), G.p(9, 1), 24);

export default defineGuide({
  id: "retrieval-augmented-generation", track: "ai", module: "Retrieval", slug: "retrieval-augmented-generation",
  title: "Retrieval-augmented generation",
  summary: "The application fetches the relevant passages when the question arrives and places them in the context, so the model answers from documents it can cite.",
  forLeads: "Retrieval puts current and private documents in front of the model without retraining it. It also makes the index a data access path, so it needs the same permissions and logging as the documents behind it.",
  status: "draft", minutes: 7,
  counters: ["Passages in context", "Sources cited", "Policy read", "Search scoped to"],
  whatIf: { label: "What if nothing was retrieved?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Policies, versions and day counts are illustrative",
    label: "A Support agent's question reaches an application. The application searches an index of policy documents, places the passages it gets back in the model's context with the question, and the model's answer cites a passage. A new policy version enters the index and the next answer cites it. A filter on the user's groups keeps a Finance passage out of the results. Last, the model asks for the search itself as a tool call.",
    els: [
      pawn("agent", 0, 8, "Support agent", undefined, { always: true }),
      line("ask", [G.p(0, 7), G.p(0, 0.7)], { always: true }),
      prism("app", -0.7, -0.7, 1.4, 1.4, 34, { hue: "track", glyph: "code", title: "Application", at: "s", always: true }),
      line("llm", [G.p(0, -0.7), G.p(0, -9.4)], { always: true }),
      prism("model", -0.6, -10.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", at: "s", always: true }),
      drum("index", -7, 0, 1, 40, { hue: "sky", glyph: "search", title: "Index", sub: "passages", at: "n", always: true }),
      prism("docs", -7.6, 5.4, 1.2, 1.2, 22, { hue: "sand", glyph: "file", title: "Policy documents", at: "s", always: true }),

      line("ret", [G.p(-0.7, 0), G.p(-6, 0)], { group: "ret" }),
      line("ingest", [G.p(-7, 5.4), G.p(-7, 1)], { group: "ingest" }),

      found("top-7", "Top passages", [{ t: "sofa returns, v7", hot: true }, { t: "returns policy", hot: true }]),
      found("top-8", "Top passages", [{ t: "sofa returns, v8", hot: true }, "returns policy"]),
      found("top-f", "Nearest passages", [{ t: "supplier terms", strike: true, tone: "alert" }, "sofa returns, v8", "returns policy"]),

      context("ctx-0", ["question"]),
      context("ctx-7", ["question", { t: "[1] sofa returns, v7", hot: true }, { t: "[2] returns policy", hot: true }]),
      context("ctx-8", ["question", { t: "[1] sofa returns, v8", hot: true }, "[2] returns policy"]),

      answer("ans-0", "Answer, no source", ["No. Returns close", "after 30 days."], { tone: "alert" }),
      answer("ans-7", "Answer", ["Yes. Sofas go back", "within 45 days. [1]", "[1] sofa returns, v7"]),
      answer("ans-8", "Answer", ["Yes. Sofas go back", "within 60 days. [1]", "[1] sofa returns, v8"]),

      pill("gate", [348, 332], "Filter: user's groups", { tone: "track", glyph: "shield", anchor: "end", group: "gate" }),
      pill("tool", [940, 272], "Search offered as a tool", { tone: "track", glyph: "wrench", anchor: "end", group: "tool" }),
    ],
  },
  steps: [
    step({
      id: "unread", label: "Unread", kind: "problem", title: "The model has not read the returns policy",
      caption: "Support asks whether a SOFA-2210 can go back on day 31. The policy sits in a document store the model never saw, so the answer has no source.",
      show: ["ctx-0", "ans-0"], counters: ["0", "0", "none", "no search"],
      rides: [ride("ask", 0, 0.5, "day 31?"), ride("llm", 1, 0.5, "30 days", { tone: "alert" })],
      body: ["A language model stores what it knows in its parameters. Lewis et al., who named retrieval-augmented generation in 2020, describe the limits: the ability to access and precisely manipulate that knowledge is limited, and providing provenance for decisions and updating world knowledge were open research problems.",
        "The Vinterhus returns policy is private and changes over time. Both properties put it out of reach of a model that answers from its parameters alone."],
      claims: [K + "parametric-limits"],
    }),
    step({
      id: "fetch", label: "Fetch", kind: "idea", title: "Passages are fetched at question time",
      caption: "The application searches an index of Vinterhus documents with the question. The retriever returns the top passages, each with its source.",
      show: ["ret", "top-7", "ctx-0"], counters: ["2 fetched", "0", "version 7", "whole index"],
      rides: [ride("ask", 0, 0.5, "day 31?"), ride("ret", 0, 0.5, "query", { via: [0.95], then: "2 passages" })],
      body: ["Retrieval-augmented generation joins two memories: a generation model and a document index reached through a retriever. For each query the retriever finds the top-K documents.",
        { callout: { label: "Key idea", text: "The knowledge stays in documents. The model borrows the relevant passages for one answer." } }],
      claims: [K + "definition"],
    }),
    step({
      id: "augment", label: "Augment", kind: "mechanism", title: "The passages enter the context with the question",
      caption: "The model generates from what it was just given. Its answer carries a citation that points to the passage it drew on.",
      show: ["ret", "top-7", "ctx-7", "ans-7"], counters: ["2", "1", "version 7", "whole index"],
      rides: [ride("llm", 0, 0.5, "question + 2", { via: [0.95], then: "answer [1]" })],
      body: ["The generator conditions on the retrieved passages. In the Claude API a retrieved passage is sent as a search result block with a source, a title and content, and with citations enabled each citation in the answer carries that source and title.",
        "Anthropic states that these citations are guaranteed to be valid pointers into the documents provided, because the API extracts the cited text itself. OpenAI's file search returns file citations with the answer.",
        { callout: { label: "What changed", text: "The answer now names the passage it rests on, so Support can open it and check." } }],
      claims: [K + "definition", K + "search-results", K + "citations", K + "file-search"],
    }),
    step({
      id: "update", label: "Update", kind: "mechanism", title: "Updating the index updates the answer",
      caption: "Operations publishes version 8 of the sofa policy. Once it is indexed, the next answer cites it. No model was retrained.",
      show: ["ret", "ingest", "top-8", "ctx-8", "ans-8"], counters: ["2", "1", "version 8", "whole index"],
      rides: [ride("ingest", 0, 0.45, "policy v8"), ride("ret", 1, 0.5, "v8 passage"), ride("llm", 0, 0.5, "question + 2", { via: [0.95], then: "answer [1]" })],
      body: ["The index can be swapped or edited to update what the system knows without any retraining. A model that answers from its parameters alone needs further training to change its behaviour as the world changes.",
        "The memory is raw text, so people can read it and write it. Editing the document index edits what the model can say."],
      claims: [K + "index-update", K + "readable-memory"],
    }),
    step({
      id: "permission", label: "Permission", kind: "watch-out", title: "The user's permissions limit what is retrieved",
      caption: "The nearest passage can be one this user may not read. A filter on the user's groups runs inside the index query, so Finance's supplier terms never reach the context.",
      show: ["ret", "ingest", "top-f", "ctx-8", "ans-8", "gate"], counters: ["2", "1", "version 8", "user's groups"],
      rides: [ride("ret", 0, 0.5, "query", { via: [0.95], then: "2 of 3" })],
      body: ["Similarity search ranks by closeness, not by entitlement. OWASP advises enforcing the scope inside the index query, not as a filter after retrieval, validating it on the server, and applying access control to each chunk, because a mostly public document can contain a confidential paragraph.",
        "The security filter pattern in Azure AI Search is one implementation: each indexed document carries a field of group or user identities, and a filter on the query returns only what the request issuer may read. The application authenticates the user and applies the filter to every query."],
      claims: [K + "scope-in-query", K + "security-filter"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Retrieve on every question or offer search as a tool",
      caption: "",
      show: ["ret", "ingest", "top-8", "ctx-8", "ans-8", "gate", "tool"], counters: ["2", "1", "version 8", "user's groups"],
      rides: [ride("llm", 1, 0.5, "search call"), ride("ret", 0, 0.5, "query", { via: [0.95], then: "2 passages" })],
      body: [{ pair: {
        left: { label: "Always retrieve", items: ["Search before every call", "Passages pre-fetched", "One fixed pipeline"] },
        right: { label: "Search as a tool", items: ["The model decides when", "Results return as tool output", "Hosted file search"] },
      } }],
      claims: [K + "search-results", K + "file-search"],
    }),
  ],
  governance: { text: "An answer traces to its sources through citations, and the user's permissions are enforced inside the index query, on identities the application has authenticated. OWASP advises immutable logs of each retrieval: the scope, the query and the returned IDs.", claims: [K + "citations", K + "scope-in-query", K + "security-filter", K + "retrieval-log"] },
  closing: {
    pitfalls: [
      "Filtering restricted passages after the search has already returned them.",
      "Reading a citation as proof that the answer is right, without opening the passage.",
      "Updating a policy document and leaving the old version in the index.",
    ],
    questions: [
      "What changes when a document is updated, the model or the index?",
      "Where is the user's permission enforced?",
      "What does a citation let a reader check?",
    ],
  },
});
