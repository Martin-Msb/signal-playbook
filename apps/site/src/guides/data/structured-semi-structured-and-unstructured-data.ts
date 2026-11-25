import { blocks, CANVAS, code, defineGuide, doc, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// The floor: one rail runs from the sources to three bays in front of it. A block is one field of one record and its colour is the field's name.
// The table bay is a full grid, the JSON bay has rows of different length, and the file bay holds undivided slabs.
// Extraction sets fields beside a file. One board at the back shows the data of the current stop.
const G = isoGrid(140, 95, 30);
const SIZE = 1, GAP = 0.3, PITCH = SIZE + GAP, H = 18, FRONT = 1.3;
const AT = { a: 4.2, b: 10.65, c: 16.8, x: 21.6, end: 23.3 };
const BOARD: [number, number] = [722, 222];
const FIELD: Record<string, Hue> = { order: "sky", channel: "mint", amount: "sand", gift: "violet", reason: "rose", vector: "track" };
const row = (id: string, gx: number, r: number, fields: string[], group?: string): El =>
  blocks(id, gx, FRONT + r * PITCH, fields.length, SIZE, fields.map((f) => ({ h: H, hue: FIELD[f] })), { gap: GAP, group, always: !group });
const file = (id: string, r: number, w: number, glyph: string): El =>
  prism(id, 15.3, FRONT + r * 1.65, w, 1.2, H, { hue: "paper", glyph, group: "files" });
const found = (id: string, r: number, fields: string[]): El =>
  blocks(id, 18.8, FRONT + 0.1 + r * 1.65, fields.length, 0.8, fields.map((f) => ({ h: H, hue: FIELD[f] })), { gap: 0.2, group: "found" });
const plate = (id: string, gx: number, text: string, sub: string, glyph: string, group?: string): El =>
  pill(id, G.p(gx, 7.1), text, { sub, glyph, group, always: !group });
const board = <T extends Parameters<typeof raise>[0]>(el: T): T => raise(el, BOARD, 30);

export default defineGuide({
  id: "structured-semi-structured-and-unstructured-data", track: "data", module: "Data and databases", slug: "structured-semi-structured-and-unstructured-data",
  title: "Structured, semi-structured and unstructured data",
  summary: "A table fixes its shape before any row arrives. JSON carries the shape inside each record. Text, images and audio have no shape until something extracts it.",
  forLeads: "Most of what customers tell a company arrives as text and recordings, outside the tables. Using it needs extraction, and governing it needs content scanning, because no column name says what a file holds.",
  status: "draft", minutes: 7,
  counters: ["Shape is fixed", "Field names live in", "A new field needs", "Stored as"],
  whatIf: { label: "What if everything had to fit the table?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, messages and scan results are illustrative",
    label: "One rail runs from the sources past three bays. In the table bay every row has the same three fields. In the JSON bay each record has its own set of fields. In the file bay an email, a photo and a call recording are undivided slabs. Extraction then sets an order number, a reason and an embedding beside the email, and a content scan finds personal data in the files. A board shows the data at each stop.",
    els: [
      prism("src", -1.6, -0.7, 1.4, 1.4, 30, { hue: "sky", glyph: "stack", title: "Sources", sub: "checkout, app, inbox", at: "n", always: true }),
      line("main", [G.p(-0.2, 0), G.p(AT.end, 0)], { always: true }),
      line("end", [G.p(AT.end, -0.55), G.p(AT.end, 0.55)], { tone: "ink", w: 7, always: true }),
      stop("s-a", ...G.p(AT.a, 0), undefined, undefined, { always: true }),
      stop("s-b", ...G.p(AT.b, 0), undefined, undefined, { always: true }),
      stop("s-c", ...G.p(AT.c, 0), undefined, undefined, { always: true }),
      stop("s-x", ...G.p(AT.x, 0), undefined, undefined, { group: "found" }),
      stop("s-end", ...G.p(AT.end - 0.6, 0), undefined, undefined, { group: "found" }),

      // the table: every row has the same fields
      ...[0, 1, 2, 3].map((r) => row(`t-${r}`, 2.4, r, ["order", "channel", "amount"])),
      plate("t-l", AT.a, "Table", "every row, same columns", "table"),
      pawn("sup", 9.2, 12.6, "Support", "Why was 4471 returned?", { group: "ask" }),
      pill("t-no", G.p(8.3, -2.6), "no column for it", { tone: "alert", to: G.p(AT.a + 0.5, -0.4), group: "ask" }),

      // JSON: each record brings its own fields
      row("j-0", 8.2, 0, ["order", "channel", "amount"], "json"),
      row("j-1", 8.2, 1, ["order", "channel", "amount", "gift"], "json"),
      row("j-2", 8.2, 2, ["order", "amount"], "more"),
      row("j-3", 8.2, 3, ["order", "channel", "gift"], "more"),
      plate("j-l", AT.b, "JSON", "each record, own fields", "code", "json"),

      // files: no fields at all, until extraction sets some beside them
      file("f-0", 0, 3, "mail"), file("f-1", 1, 2.2, "eye"), file("f-2", 2, 3, "play"),
      plate("f-l", 17.6, "Files", "email, photo, call", "file", "files"),
      prism("ex", AT.x - 0.7, -0.7, 1.4, 1.4, 30, { hue: "track", glyph: "funnel", title: "Extract", sub: "text, then fields", at: "n", group: "found" }),
      found("x-0", 0, ["order", "reason", "vector"]), found("x-2", 2, ["order", "vector"]),
      pill("scan", [840, 508], "Content scan", { glyph: "search", sub: "reads every file", to: G.p(18.4, 2.4, H), group: "gov" }),

      // the board: the data of the current stop
      board(table("b-table", 0, 0, 236, ["order", "channel", "amount"], [["4469", "web", "129"], ["4470", "store", "349"], { cells: ["4471", "app", "899"], hot: true }],
        { at: [14, 84, 164], rowH: 26, title: "orders", sub: "columns set in advance", mono: true, group: "b-table" })),
      board(code("b-json", 0, 0, 236, ['{"order": 4471,', ' "channel": "app",', ' "amount": 899,', ' "gift": {"wrap": true}}'],
        { keywords: ['"order":', '"channel":', '"amount":', '"gift":', '{"wrap":'], hot: [3], title: "App event", sub: "names travel with values", group: "b-json" })),
      board(table("b-var", 0, 0, 250, ["order", "payload"], [{ cells: ["4471", '{"gift":{…},…}'], hot: true }, ["4472", '{"amount":129}']],
        { at: [14, 78], rowH: 26, title: "app_events", sub: "payload is VARIANT", foot: "payload:gift.wrap is true", mono: true, group: "b-var" })),
      board(doc("b-mail", 0, 0, 236, 124, "email.eml", ["My sofa arrived torn.", "Order 4471, from the app.", "Call me on 070 555 01 42."], { group: "b-mail" })),
      board(table("b-rows", 0, 0, 250, ["file", "order", "reason"], [{ cells: ["email.eml", "4471", "torn"], hot: true }, ["call.mp3", "4471", "refund"]],
        { at: [14, 116, 178], rowH: 26, title: "Extracted", sub: "plus one embedding each", mono: true, group: "b-rows" })),
      board(table("b-scan", 0, 0, 250, ["file", "found"], [{ cells: ["email.eml", "phone number"], hot: true }, ["call.mp3", "person name"]],
        { at: [14, 116], rowH: 26, title: "Scan result", sub: "personal data in content", group: "b-scan" })),
    ],
  },
  steps: [
    step({
      id: "table", label: "The table", kind: "problem", title: "A table fixes its columns in advance",
      caption: "Support asks why order 4471 was returned. The orders table has three columns, set before any row was loaded. The reason arrived as an email, and no column takes it.",
      show: ["b-table", "ask"], counters: ["before loading", "the table schema", "a schema change", "rows"],
      rides: [ride("main", 0, "s-a", "sofa torn…", { tone: "alert" })],
      body: ["In a relational table the number and order of the columns is fixed, and each column has a name and a data type. Only the number of rows varies. The data type constrains the values a column accepts.",
        "Structured data requires a fixed schema that is defined before the data can be loaded and queried."],
      claims: ["structured-semi-structured-and-unstructured-data-table", "structured-semi-structured-and-unstructured-data-schema-first"],
    }),
    step({
      id: "json", label: "JSON", kind: "idea", title: "JSON carries its shape in each record",
      caption: "An app event names every value it holds, so order 4471 can bring a gift field that the record before it lacks. No schema is declared first.",
      show: ["json", "b-json"], counters: ["per record", "each record", "nothing declared", "JSON text"],
      rides: [ride("main", 0, "s-b", '{"gift":{…}}', { via: ["s-a"] })],
      body: ["A JSON object is an unordered collection of name/value pairs. Values can be objects and arrays, so a record can nest, and the values of one array need not share a type.",
        "Semi-structured data contains tags or other mark-up that identify the entities within it. Entities of the same class may have different attributes, and new attributes can be added at any time.",
        "XML works the same way with markup, which encodes a description of the document's logical structure. Logs are often semi-structured too: OpenTelemetry describes key/value logs and JSON blobs whose field names vary between messages as semistructured, because no stable schema is guaranteed.",
        { callout: { label: "Key idea", text: "The names that a table keeps once, in its schema, are repeated inside every semi-structured record." } }],
      claims: ["structured-semi-structured-and-unstructured-data-json", "structured-semi-structured-and-unstructured-data-semi", "structured-semi-structured-and-unstructured-data-schema-first",
        "structured-semi-structured-and-unstructured-data-xml", "structured-semi-structured-and-unstructured-data-logs"],
    }),
    step({
      id: "variant", label: "Variant", kind: "mechanism", title: "A VARIANT column stores records of any shape",
      caption: "The warehouse keeps each event whole in one VARIANT column, beside ordinary columns. Order 4472 arrives with different fields and loads unchanged. A query reaches a field by its path.",
      show: ["json", "more", "b-var"], counters: ["per record", "each record", "nothing declared", "a VARIANT column"],
      rides: [ride("main", 0, "s-b", '{"order":4472}', { via: ["s-a"] })],
      body: ["In Snowflake a VARIANT can hold a value of any other data type, including an ARRAY or an OBJECT, and semi-structured data can be imported from JSON, Avro, ORC, Parquet and XML.",
        "Databricks recommends VARIANT over JSON strings. In its SQL a colon selects a top-level field and a dot selects a nested one, as in `payload:gift.wrap`.",
        "Apache Parquet defines a Variant binary encoding for semi-structured data, with two binary values per Variant: the value and the metadata. PostgreSQL's jsonb stores JSON in a decomposed binary format that is faster to process because nothing is reparsed.",
        { callout: { label: "Watch out", text: "PostgreSQL's documentation still recommends a somewhat fixed structure for JSON documents. The structure is typically unenforced, but a predictable one makes summarising queries easier to write." } }],
      claims: ["structured-semi-structured-and-unstructured-data-variant", "structured-semi-structured-and-unstructured-data-path", "structured-semi-structured-and-unstructured-data-parquet-variant",
        "structured-semi-structured-and-unstructured-data-jsonb", "structured-semi-structured-and-unstructured-data-semi"],
    }),
    step({
      id: "files", label: "Files", kind: "mechanism", title: "Text, images and audio have no fields",
      caption: "The email, a photo of the sofa and a call recording land as files. Nothing in them marks where the order number or the reason is.",
      show: ["json", "more", "files", "b-mail"], counters: ["nowhere", "nowhere", "nothing declared", "files"],
      rides: [ride("main", 0, "s-c", "email.eml", { via: ["s-b"] })],
      body: ["Unstructured data is information that does not fit into a predefined data model or schema. It is typically text-heavy and also encompasses images, video and audio.",
        "The same holds for logs written as free text: they follow no consistent structure and need parsing before a machine can read them."],
      claims: ["structured-semi-structured-and-unstructured-data-unstructured", "structured-semi-structured-and-unstructured-data-logs"],
    }),
    step({
      id: "extract", label: "Extraction", kind: "mechanism", title: "Extraction gives a file its shape",
      caption: "Text extraction pulls the words out of the email. Order 4471 and its reason become a row Support can query, and an embedding places the text near similar complaints.",
      show: ["json", "more", "files", "found", "b-rows", "ask"], counters: ["at extraction", "the extracted rows", "another extraction", "files and rows"],
      rides: [ride("main", "s-c", "s-end", "email.eml", { via: ["s-x"], then: "4471 torn" })],
      body: ["Apache Tika detects and extracts metadata and text from over a thousand file types, including single email messages, and can run OCR on images through Tesseract. A speech recognition model such as Whisper turns a recording into text.",
        "An embedding is a vector of floating point numbers, and the distance between two vectors measures their relatedness. pgvector stores such vectors in Postgres with the rest of the data and searches them by nearest neighbour.",
        { callout: { label: "Key idea", text: "The file stays as it was. The shape lives in what extraction produced, so a different question means another extraction." } }],
      claims: ["structured-semi-structured-and-unstructured-data-tika", "structured-semi-structured-and-unstructured-data-speech", "structured-semi-structured-and-unstructured-data-embedding",
        "structured-semi-structured-and-unstructured-data-pgvector"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "How much shape to fix in advance",
      caption: "",
      show: ["json", "more", "files", "found", "gov", "b-scan"], counters: ["at extraction", "the extracted rows", "another extraction", "files and rows"],
      rides: [ride("main", 0, "s-c", "scan", { via: ["s-b"] })],
      body: [{ pair: {
        left: { label: "Fix it", items: ["Fields are known and stable", "Types are checked on load"] },
        right: { label: "Leave it open", items: ["Fields differ per record", "Content is text or media", "Files are scanned for personal data"] },
      } },
        "A column that holds personal data can be labelled once, where it is defined. A file has no such place: a phone number in an email or a name in a recording is found only by reading the content.",
        "Google Cloud Sensitive Data Protection reports every instance that matches a chosen infoType and calls inspection especially useful for unstructured data. Microsoft Purview sensitive information types match patterns such as regular expressions and keyword lists, and its named entity types detect person names and addresses. Amazon Macie analyses objects in S3 with machine learning and pattern matching."],
      claims: ["structured-semi-structured-and-unstructured-data-table", "structured-semi-structured-and-unstructured-data-semi", "structured-semi-structured-and-unstructured-data-unstructured",
        "structured-semi-structured-and-unstructured-data-inspect", "structured-semi-structured-and-unstructured-data-patterns", "structured-semi-structured-and-unstructured-data-macie"],
    }),
  ],
  governance: { text: "Personal data in emails, documents and recordings carries no column name, so classification has to scan content. Microsoft Purview matches patterns such as regular expressions and keywords, and Amazon Macie uses machine learning and pattern matching on stored objects.",
    claims: ["structured-semi-structured-and-unstructured-data-inspect", "structured-semi-structured-and-unstructured-data-patterns", "structured-semi-structured-and-unstructured-data-macie"] },
  closing: {
    pitfalls: [
      "Treating a JSON column as schema-free. Queries still depend on field names that nothing enforces.",
      "Flattening every JSON field into columns on arrival, so each new field becomes a schema change.",
      "Classifying only tables and columns while emails, documents and recordings go unscanned.",
    ],
    questions: [
      "Where are the field names kept in a table, and where in a JSON record?",
      "What has to run before a query can use the reason given in an email?",
      "Which of your file stores hold customer messages, and what scans them?",
    ],
  },
});
