import { CANVAS, code, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, step, table } from "@signal-path/engine";
import type { El, Row } from "@signal-path/engine";

// The floor: one pipe runs from the policy files (front left) through the parser and the splitter to the index (back right).
// The file being prepared stands on a card behind the pipe. What the pipeline has produced lies in front of it:
// first blind cuts, then parsed elements, then chunks by section, then chunks with context and tags.
// Support asks the index one question at the far end, and what comes back depends on what was put in.
const G = isoGrid(440, 235, 30);
const AT = { src: 10.2, parse: 4.6, split: -1.6, index: -7.8 };
const PIPE = { from: 9.2, to: -6.8 };
const at = (gy: number) => (PIPE.from - gy) / (PIPE.from - PIPE.to);
const BEFORE = { parse: at(AT.parse + 2.6), split: at(AT.split + 3.3), index: at(AT.index + 3.3) };

const TEXT = "Returns policy 2026 Sofas 30 days from delivery Mattresses 100 nights from delivery Fees SOFA-2210 349 kr BED-1180 0 kr";
const CUT = 30;
const BLIND: Row[] = Array.from({ length: Math.ceil(TEXT.length / CUT) }, (_, i) => [String(i + 1), TEXT.slice(i * CUT, (i + 1) * CUT)]);

const out = (id: string, title: string, sub: string, cols: string[], offsets: number[], rows: Row[]): El =>
  table(id, 418, 344, 520, cols, rows, { at: offsets, rowH: 22, title, sub, mono: true, group: id });
const TAGS = ["text", "source", "date", "access"], TAG_AT = [12, 292, 388, 452];
const tagged = (text: string, access = "public"): string[] => [text, "returns.pdf", "2026-03", access];
const PREPARED: Row[] = [
  tagged("2026 policy. Sofas: 30 days"),
  tagged("2026 policy. Mattresses: 100 nights"),
  { cells: tagged("2026 policy. Fees: SOFA-2210 349 kr", "support"), hot: true },
];
const PLANTED = ["2026 policy. Fees: SOFA-2210 0 kr", "upload.pdf", "2026-11", "public"];
const file = (id: string, title: string, lines: string[], hot?: number[]) =>
  raise(code(id, 0, 0, 236, lines, { title, keywords: [], hot, group: id }), G.p(-4.6, 5), 24);
const stage = (id: string, gy: number, hue: "sand" | "track", glyph: string, title: string, sub: string, side: "s" | "e" = "s") =>
  prism(id, -0.65, gy - 0.65, 1.3, 1.3, 30, { hue, glyph, title, sub, at: side, group: id });

export default defineGuide({
  id: "preparing-knowledge", track: "ai", module: "Retrieval", slug: "preparing-knowledge",
  title: "Preparing knowledge",
  summary: "Before anything can be retrieved, each document is parsed, split into chunks and tagged. Those three choices decide which questions the index can answer and who may see the answer.",
  forLeads: "Retrieval quality is set when documents are prepared, long before a question arrives. The same step decides whether access labels, sources and deletions reach the index.",
  status: "draft", minutes: 7,
  counters: ["Parsed as", "Chunks", "Each chunk carries", "Question finds"],
  whatIf: { label: "What if the file were cut at a fixed size?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Policy text, fees and file names are illustrative",
    label: "A returns policy travels along a pipe from the policy files through a parser and a splitter into an index, and Support asks the index for the return fee of one sofa. Cut blindly every 30 characters, the product code is split across two chunks and the question finds nothing. Parsed by layout and split by section, the fee table stays whole. Each chunk then gains a line of context and tags for source, date and access. A planted file adds a false chunk that the question retrieves, and deleting that file removes its chunk.",
    els: [
      line("pipe", [G.p(0, PIPE.from), G.p(0, PIPE.to)], { always: true }),
      drum("files", 0, AT.src, 1, 40, { hue: "sky", glyph: "file", title: "Policy files", sub: "PDF, DOCX, HTML", at: "s", group: "files" }),
      drum("files-open", 0, AT.src, 1, 40, { hue: "sky", glyph: "file", title: "Policy files", sub: "open to uploads", at: "s", state: "alert", group: "files-open" }),
      drum("index", 0, AT.index, 1, 40, { hue: "violet", glyph: "search", title: "Index", sub: "chunks, embedded", at: "n", always: true }),

      stage("parse-text", AT.parse, "sand", "lines", "Parser", "plain text only"),
      stage("parse-layout", AT.parse, "track", "table", "Parser", "reads the layout"),
      stage("split-fixed", AT.split, "sand", "split", "Splitter", "every 30 characters", "e"),
      stage("split-section", AT.split, "track", "split", "Splitter", "at each heading", "e"),

      line("ask", [G.p(5.6, AT.index), G.p(1, AT.index)], { always: true }),
      pawn("support", 6.4, AT.index, "Support", undefined, { always: true }),
      pill("filter", [738, 22], "access checked", { tone: "track", glyph: "shield", anchor: "start", group: "filter" }),

      file("doc", "returns.pdf", ["Returns policy 2026", "Sofas", "30 days from delivery", "Mattresses", "100 nights from delivery", "Fees", "SOFA-2210    349 kr", "BED-1180       0 kr"]),
      file("doc-planted", "upload.pdf", ["Returns policy 2026", "Fees", "SOFA-2210      0 kr"], [2]),

      out("blind", "Chunks in the index", "cut every 30 characters", ["chunk", "text"], [12, 84],
        BLIND.map((r, i) => (i >= 2 ? { cells: r as string[], hot: true } : r))),
      out("elements", "Parsed elements", "what the layout shows", ["element", "text"], [12, 110], [
        ["Title", "Returns policy 2026"], ["Heading", "Sofas"], ["Text", "30 days from delivery"],
        ["Heading", "Mattresses"], ["Text", "100 nights from delivery"], { cells: ["Table", "Fees: product, fee, 2 rows"], hot: true },
      ]),
      out("sections", "Chunks in the index", "one per section", ["chunk", "text"], [12, 84], [
        ["1", "Sofas: 30 days from delivery"], ["2", "Mattresses: 100 nights from delivery"],
        { cells: ["3", "Fees: SOFA-2210 349 kr, BED-1180 0 kr"], hot: true },
      ]),
      out("tags", "Chunks in the index", "context added, tags attached", TAGS, TAG_AT, PREPARED),
      out("poisoned", "Chunks in the index", "one chunk from a planted file", TAGS, TAG_AT,
        [PREPARED[0], PREPARED[1], tagged("2026 policy. Fees: SOFA-2210 349 kr", "support"), { cells: PLANTED, hue: "rose" }]),
      out("removed", "Chunks in the index", "the planted file is deleted", TAGS, TAG_AT, [...PREPARED, { cells: PLANTED, strike: true, mute: true }]),
    ],
  },
  steps: [
    step({
      id: "blind", label: "Blind cut", kind: "problem", title: "A blind cut hides the answer",
      caption: "Vinterhus reads its returns policy as plain text and cuts it every 30 characters. One cut falls inside SOFA-2210, so no chunk holds the product code with its fee.",
      show: ["files", "parse-text", "split-fixed", "doc", "blind"], counters: ["plain text", "4, fixed size", "text only", "nothing"],
      rides: [ride("pipe", 0, BEFORE.index, "returns.pdf", { via: [BEFORE.parse, BEFORE.split], then: "4 chunks" }), ride("ask", 0, 0.55, "fee SOFA-2210?", { then: "not found", tone: "alert" })],
      body: ["Retrieval returns chunks, never documents. A document is partitioned into chunks, each chunk is converted to an embedding, and the index keeps a mapping from every chunk to its original document.",
        "Chunking keeps content under the input limits of embedding and chat models. It also helps when a long page covering many topics is poorly represented by a single vector.",
        "Plain text extraction drops the layout. The fee table arrives as a run of words, and a fixed cut pays no attention to where a heading, a sentence or a table row ends."],
      claims: ["preparing-knowledge-why-chunk", "preparing-knowledge-choices"],
    }),
    step({
      id: "parse", label: "Parse", kind: "idea", title: "Parsing recovers the structure",
      caption: "A layout-aware parser reads the page as elements: a title, headings, paragraphs and a table. The fee table is one element with its rows intact.",
      show: ["files", "parse-layout", "split-fixed", "doc", "elements"], counters: ["layout elements", "none yet", "text only", "nothing yet"],
      rides: [ride("pipe", 0, BEFORE.split, "returns.pdf", { via: [BEFORE.parse], then: "6 elements" })],
      body: ["Layout-aware parsing analyses a document, detects its structure and writes it out as Markdown or as typed elements. The Document Layout skill in Azure AI Search calls a layout model for this, and also extracts images with their position on the page.",
        "The open-source Unstructured library partitions a file into document elements such as titles, text and tables, and chunks those elements instead of raw text.",
        { callout: { label: "Key idea", text: "A splitter can only respect boundaries the parser has found." } }],
      claims: ["preparing-knowledge-layout", "preparing-knowledge-elements"],
    }),
    step({
      id: "split", label: "Split", kind: "mechanism", title: "Chunks follow the structure",
      caption: "The splitter starts a new chunk at each heading and never divides the table. Each chunk now holds one section of the policy.",
      show: ["files", "parse-layout", "split-section", "doc", "sections"], counters: ["layout elements", "3, by section", "text only", "the fee table"],
      rides: [ride("pipe", BEFORE.split, BEFORE.index, "6 elements", { then: "3 chunks" }), ride("ask", 0, 0.55, "fee SOFA-2210?", { then: "349 kr" })],
      body: ["Common chunking strategies are fixed-size chunks with some overlap, variable-sized chunks cut at sentence ends or headings, and semantic chunks that keep related sentences together. Hierarchical chunking retrieves small child chunks and replaces them with their broader parent.",
        "Small chunks embed more precisely, and large chunks carry more context. Microsoft suggests starting at 512 tokens with 25 percent overlap, and the default in Amazon Bedrock Knowledge Bases is about 300 tokens cut at sentence boundaries.",
        "Structure-aware splitters keep a table as its own chunk and never put text from two sections into one chunk."],
      claims: ["preparing-knowledge-strategies", "preparing-knowledge-sizes", "preparing-knowledge-size-trade", "preparing-knowledge-elements", "preparing-knowledge-choices"],
    }),
    step({
      id: "tag", label: "Enrich, tag", kind: "mechanism", title: "Each chunk carries context and tags",
      caption: "A chunk alone does not say which policy it came from. A line of context is added to its text, and source, date and access label are attached as metadata.",
      show: ["files", "parse-layout", "split-section", "doc", "tags", "filter"], counters: ["layout elements", "3, by section", "context, source, date, access", "349 kr, with its source"],
      rides: [ride("pipe", BEFORE.split, BEFORE.index, "3 chunks", { then: "3 tagged" }), ride("ask", 0, 0.55, "fee SOFA-2210?", { then: "349 kr" })],
      body: ["Chunks are embedded one by one, so a chunk such as \"The company's revenue grew by 3% over the previous quarter\" does not say which company or which quarter. Contextual Retrieval prepends a short explanatory context, written by a model from the whole document, to each chunk before it is embedded. Anthropic reports 35% fewer failed retrievals in its own tests.",
        "Document-level metadata is applied to every chunk of the file, and metadata fields can be used to filter what a query returns.",
        "The fee table is for Support only, although the rest of the policy is public. OWASP advises access control at the chunk level, enforced inside the index query."],
      claims: ["preparing-knowledge-context-loss", "preparing-knowledge-contextual", "preparing-knowledge-metadata", "preparing-knowledge-access"],
    }),
    step({
      id: "planted", label: "Planted file", kind: "watch-out", title: "A planted file becomes a trusted chunk",
      caption: "Someone uploads a file that copies the policy and changes one fee. It is parsed, split and tagged like any other, and the question retrieves it.",
      show: ["files-open", "parse-layout", "split-section", "doc-planted", "poisoned", "filter"], counters: ["layout elements", "4, one planted", "context, source, date, access", "0 kr, from the planted file"],
      rides: [ride("pipe", 0, BEFORE.index, "upload.pdf", { via: [BEFORE.parse, BEFORE.split], then: "1 chunk", tone: "alert" }), ride("ask", 0, 0.55, "fee SOFA-2210?", { then: "0 kr", tone: "alert" })],
      body: ["An attacker who can write to the corpus can craft content whose embedding lands close to a target question. That content is retrieved and passed to the model as trusted context. The PoisonedRAG paper reports a 90% attack success rate with five malicious texts per question in a knowledge base of millions.",
        "OWASP advises normalising content at extraction by stripping zero-width characters, white-on-white text and look-alike characters, and reviewing externally sourced content before it enters a sensitive index.",
        { callout: { label: "What changed", text: "The pipeline worked as designed. Only the source tag tells the planted chunk from the real one." } }],
      claims: ["preparing-knowledge-poison", "preparing-knowledge-normalise", "preparing-knowledge-provenance"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The index holds only what its sources still hold",
      caption: "",
      show: ["files", "parse-layout", "split-section", "doc-planted", "removed", "filter"], counters: ["layout elements", "3, planted one removed", "context, source, date, access", "349 kr, with its source"],
      rides: [ride("pipe", 0, BEFORE.index, "delete upload", { then: "1 removed" }), ride("ask", 0, 0.55, "fee SOFA-2210?", { then: "349 kr" })],
      body: [{ pair: {
        left: { label: "Stays in the index", items: ["A known source", "A current date", "An access label"] },
        right: { label: "Leaves the index", items: ["Chunks of a deleted file", "A compromised batch", "Superseded versions"] },
      } },
        "Provenance recorded for every embedding lets a compromised batch be found and invalidated. When a source document is deleted, its embeddings are deleted within a bounded time, and a reconciliation audit confirms it.",
        "Amazon Bedrock Knowledge Bases syncs incrementally: a deleted document is removed from the vector store, and a changed one is parsed, chunked, embedded and indexed again."],
      claims: ["preparing-knowledge-provenance", "preparing-knowledge-deletion", "preparing-knowledge-resync"],
    }),
  ],
  governance: { text: "Access control is applied to each chunk and enforced inside the index query. Provenance is tracked for every embedding so a compromised batch can be invalidated, and embeddings are deleted when their source document is deleted.", claims: ["preparing-knowledge-access", "preparing-knowledge-provenance", "preparing-knowledge-deletion"] },
  closing: {
    pitfalls: [
      "Tuning the model or the prompt when the answer was never in a single chunk.",
      "Extracting plain text from files whose meaning sits in tables and headings.",
      "Deleting a document at the source and leaving its chunks in the index.",
    ],
    questions: [
      "Why did no chunk answer the fee question after the blind cut?",
      "What does a chunk need to carry besides its text?",
      "How would you find every chunk that came from one compromised upload?",
    ],
  },
});
