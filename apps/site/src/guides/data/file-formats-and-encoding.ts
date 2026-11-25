import { blocks, CANVAS, cells, code, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: one file of four orders, drawn as blocks. One block is one value, coloured by field.
// Each stop rewrites the same four orders: as text, as text with names, as binary under a header,
// as binary with the schema outside, and regrouped by column above a footer.
// Checkout writes on the left, Finance reads on the right, and a record rides the rail in front of the file.
// The card on the left shows what is in the file. The card on the right shows what Finance knows about its shape.
const G = isoGrid(480, 150, 30);
const SIZE = 1.7, P = 2, RY = 11.2, RX = 12.4, W = 3 * P + SIZE;
const FIELDS: { k: string; hue: Hue }[] = [{ k: "order", hue: "sand" }, { k: "channel", hue: "mint" }, { k: "email", hue: "rose" }, { k: "amount", hue: "sky" }];
const TEXT = 24, NAME = 14, BIN = 10;
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
/** The file as a grid, one element per block so pills and records can sit close to it. byColumn swaps the two directions. */
const grid = (id: string, h: number, group: string, o: { paper?: boolean; z?: number; byColumn?: boolean } = {}): El[] => [0, 1, 2, 3].flatMap((r) => FIELDS.map((f, c) =>
  blocks(`${id}-${r}${c}`, (o.byColumn ? r : c) * P, (o.byColumn ? c : r) * P, 1, SIZE, [{ h, hue: o.paper ? "paper" as Hue : f.hue }], { z: o.z, group })));
const LEFT: Pt = [175, 185], RIGHT: Pt = [855, 150];
const schema = (id: string, title: string, sub: string, items: string[], group: string): El => raise(list(id, 0, 0, 200, items, { title, sub, mono: true, rowH: 24, group }), RIGHT, 30);

export default defineGuide({
  id: "file-formats-and-encoding", track: "data", module: "Data and databases", slug: "file-formats-and-encoding",
  title: "File formats and encoding",
  summary: "The same orders can be written as text or binary, row by row or column by column, with the schema in the file or held elsewhere. The choice sets the size of the file, the speed of reading it and how safely its shape can change.",
  forLeads: "A file format is a decision about who knows the shape of the data. Formats that carry their schema and checksums can be verified on arrival. A bare text file has to be validated by whoever reads it.",
  status: "draft", minutes: 7,
  counters: ["Written as", "Laid out", "Schema lives"],
  whatIf: { label: "What if the file carried no schema?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and schemas are illustrative",
    label: "Four orders with four fields are drawn as blocks on the floor, one block per value and one colour per field. Checkout writes the file and Finance reads it. As CSV the file holds values only and Finance guesses the types. As JSON every value has a name block beside it. As Avro a header block holds the schema and the values are low binary blocks. As Protobuf the values carry field numbers and the schema is a file held by both teams. As Parquet or ORC the values regroup into one chunk per column above a footer that holds the schema, and pages carry checksums.",
    els: [
      prism("co", -2.4, RY - 0.6, 1.2, 1.2, 30, { hue: "track", glyph: "pen", title: "Checkout", sub: "writes the file", at: "sw", always: true }),
      prism("fin", RX - 0.6, 0.2, 1.2, 1.2, 30, { glyph: "chart", title: "Finance", sub: "reads the file", at: "e", always: true }),
      line("rail", [G.p(-1.2, RY), G.p(RX, RY), G.p(RX, 1.4)], { always: true }),
      stop("s-w", ...G.p(-0.2, RY), undefined, undefined, { always: true }),
      stop("s-a", ...G.p(4.2, RY), undefined, undefined, { always: true }),
      stop("s-b", ...G.p(9, RY), undefined, undefined, { always: true }),
      stop("s-c", ...G.p(RX, 9), undefined, undefined, { always: true }),

      // 1. CSV: values only
      ...grid("csv", TEXT, "csv"),
      raise(code("f-csv", 0, 0, 216, ["4468,store,a.k@…,129", "4469,store,j.p@…,349", "4470,web,m.l@…,899"], { title: "orders.csv", sub: "text, one order per line", group: "csv" }), LEFT, 30),
      schema("k-csv", "Finance guesses", "no schema", ["field 1: number?", "field 2: text?", "field 4: 899, \"899\"?"], "csv"),

      // 2. JSON: a name block before every value
      ...grid("names", NAME, "json", { paper: true }),
      ...grid("json", TEXT, "json", { z: NAME }),
      pill("names-l", [480, 52], "A name under every value", { to: up(SIZE, SIZE / 2, NAME / 2), group: "json" }),
      raise(code("f-json", 0, 0, 200, ["{\"order\": 4470,", " \"channel\": \"web\",", " \"email\": \"m.l@…\",", " \"amount\": 899}"], { title: "orders.json", sub: "text, one record", group: "json" }), LEFT, 30),
      schema("k-json", "Finance reads", "from every record", ["order: number", "channel: string", "email: string", "amount: number"], "json"),

      // 3. Avro: a header with the schema, then binary values
      prism("hdr", 0, -2.2, 6.9, 1.5, 16, { hue: "track", glyph: "doc", title: "Header", sub: "schema, codec, sync marker", at: "n", group: "avro" }),
      ...grid("bin", BIN, "rowbin"),
      raise(cells("f-avro", 0, 0, 4, [58, 30], ["Obj1", { t: "schema", hot: true }, "codec", "sync"], { title: "orders.avro", sub: "header, then binary blocks", group: "avro" }), LEFT, 30),
      schema("k-avro", "Schema", "from the file header", ["order: int", "channel: string", "email: string", "amount: int"], "avro"),

      // 4. Protobuf: field numbers in the bytes, the schema in a file both sides hold
      blocks("new", 4 * P, 3 * P, 1, SIZE, [{ h: BIN, hue: "violet", hot: true }], { group: "pb" }),
      ...[1, 2, 3, 4, 5].map((n, i) => pill(`n-${n}`, up(i * P + SIZE / 2, -1.7, 4), String(n), { mono: true, group: "pb" })),
      pill("n-l", up(-0.4, -1.7, 4), "field number", { anchor: "end", group: "pb" }),
      raise(cells("f-pb", 0, 0, 4, [52, 28], ["1", "4470", "2", "web", "3", "m.l@…", "4", "899", { t: "5", hot: true }, { t: "gift", hot: true }], { title: "One message", sub: "field number, value", group: "pb" }), LEFT, 30),
      schema("k-pb", "order.proto", "Finance's copy", ["int32 order = 1", "string channel = 2", "string email = 3", "int32 amount = 4"], "pb"),
      pill("pb-co", [110, 440], "order.proto", { glyph: "doc", sub: "Checkout: fields 1 to 5", group: "pb" }),

      // 5. Parquet and ORC: one chunk per column, the schema in a footer
      ...grid("col", BIN, "col", { byColumn: true }),
      ...FIELDS.map((f, i) => pill(`c-${f.k}`, up(-1, i * P + SIZE / 2, 14), f.k, { anchor: "end", mono: true, group: "col" })),
      prism("ftr", 0, 4 * P + 0.3, W, 1.4, 16, { hue: "track", glyph: "doc", group: "col" }),
      pill("ftr-l", [120, 196], "Footer", { sub: "schema, chunk locations", to: up(0.3, 4 * P + 1, 16), group: "col" }),
      schema("k-col", "Schema", "from the file footer", ["order: int32", "channel: string", "email: string", "amount: int32"], "col"),
      pill("zip", [480, 52], "Compressed pages", { glyph: "layers", sub: "Snappy, Gzip, Zstandard", to: up(SIZE / 2, SIZE / 2, BIN), group: "codec" }),

      // 6. what makes the file verifiable
      pill("crc", [480, 52], "CRC32", { glyph: "check", sub: "checksum on each page", to: up(SIZE / 2, SIZE / 2, BIN), group: "gov" }),
      pill("val", [130, 110], "Schema in the file", { glyph: "shield", sub: "fields checked against it", group: "gov" }),
      blocks("mem", RX + 1.2, 3.4, 4, 0.8, [0, 1, 2, 3].map(() => ({ h: BIN, hue: "sky" as Hue })), { gap: 0.2, dir: "gy", title: "Arrow", sub: "columns in memory", at: "e", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "csv", label: "Text", kind: "problem", title: "A CSV file leaves its shape to the reader",
      caption: "Checkout exports orders as CSV: lines of text, values split by commas. Nothing in the file names or types the fields, so Finance guesses.",
      show: ["csv"], counters: ["text", "row by row", "nowhere"],
      rides: [ride("rail", "s-w", "s-c", "4470,web,899", { via: ["s-a"], then: "899 or \"899\"?" })],
      body: ["In CSV each record is on a separate line and fields are separated by commas. A header line is optional.",
        "RFC 4180 states that no formal specification exists, which allows a wide variety of interpretations of CSV files.",
        { callout: { label: "Key idea", text: "A file without a schema is an unvalidated input. Every reader decides for itself what the fields are." } }],
      claims: ["file-formats-and-encoding-csv", "file-formats-and-encoding-validation"],
    }),
    step({
      id: "json", label: "Names", kind: "idea", title: "JSON repeats the names in every record",
      caption: "JSON is still text, but each value travels with its name, so Finance no longer guesses the fields. Every record repeats every name, and the types stop at string, number, boolean and null.",
      show: ["json"], counters: ["text", "row by row", "in every record"],
      rides: [ride("rail", "s-w", "s-c", "\"amount\":899", { via: ["s-a"], then: "amount: number" })],
      body: ["JSON is a text format for the serialization of structured data. An object is an unordered collection of name/value pairs.",
        "JSON can represent four primitive types: strings, numbers, booleans and null. A date or a decimal amount has no type of its own."],
      claims: ["file-formats-and-encoding-json"],
    }),
    step({
      id: "avro", label: "Binary", kind: "mechanism", title: "Avro writes the schema once, then binary values",
      caption: "An Avro file starts with a header that holds the schema. The records follow as binary, without names or types. Finance reads the header, then the values.",
      show: ["avro", "rowbin"], counters: ["binary", "row by row", "in the file header"],
      rides: [ride("rail", "s-w", "s-c", "schema", { via: ["s-a"], then: "4470 web 899" })],
      body: ["Binary encoded Avro data does not include type information or field names. The serialized data is small, but a schema must always be used to read it correctly.",
        "The header of an Avro object container file consists of four magic bytes, file metadata including the schema, and a 16-byte sync marker. The metadata also names the compression codec used for the blocks.",
        "Avro implementations must support the null and deflate codecs. Snappy and Zstandard are optional."],
      claims: ["file-formats-and-encoding-avro-binary", "file-formats-and-encoding-avro-file", "file-formats-and-encoding-codecs"],
    }),
    step({
      id: "protobuf", label: "Outside", kind: "mechanism", title: "Protobuf keeps the schema outside the bytes",
      caption: "Each value carries a field number. Names and types sit in a .proto file that both teams hold. Checkout adds field 5, and Finance's older code ignores it.",
      show: ["rowbin", "pb"], counters: ["binary", "row by row", "in a .proto file"],
      rides: [ride("rail", "s-w", "s-c", "5: gift", { via: ["s-a", "s-b"], then: "5: ignored" })],
      body: ["A Protobuf message is a series of key-value pairs, each turned into a record of field number, wire type and payload. The name and declared type of a field can only be determined on the decoding end.",
        "A message cannot be fully interpreted without access to its .proto file.",
        { callout: { label: "Key idea", text: "Adding new fields is safe: old binaries ignore the new field when parsing. Changing the field number of an existing field is not safe." } },
        "Avro reaches the same result by comparing two schemas. A writer's field that the reader does not know is ignored, and a field the writer lacks takes the reader's default value when it has one."],
      claims: ["file-formats-and-encoding-proto-wire", "file-formats-and-encoding-proto-schema", "file-formats-and-encoding-proto-evolve", "file-formats-and-encoding-avro-resolution"],
    }),
    step({
      id: "columns", label: "Columns", kind: "mechanism", title: "Parquet and ORC write column by column",
      caption: "The same values regroup into one chunk per column, and the schema moves to a footer. A query for amounts reads one chunk. Pages are compressed with a codec such as Zstandard.",
      show: ["col", "codec"], counters: ["binary", "column by column", "in the file footer"],
      rides: [ride("rail", "s-a", "s-c", "amount", { via: ["s-b"], then: "4 amounts" })],
      body: ["Apache Parquet is a column-oriented data file format. ORC is a self-describing, type-aware columnar file format.",
        "Parquet writes its file metadata after the data, which allows writing in a single pass. The metadata holds the schema and the start of every column chunk, and readers read it first. The ORC footer holds the type schema, the number of rows and statistics about each column.",
        "Parquet codecs include Snappy, Gzip, LZ4 and Zstandard. ORC compression kinds include zlib, Snappy, LZ4 and Zstandard."],
      claims: ["file-formats-and-encoding-columnar", "file-formats-and-encoding-footer", "file-formats-and-encoding-codecs"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What each binary layout gives",
      caption: "",
      show: ["col", "gov"], counters: ["binary", "column by column", "in the file footer"],
      rides: [ride("rail", "s-b", "s-c", "4 amounts")],
      body: [{ pair: {
        left: { label: "Row-based", items: ["Avro: schema in the header", "Protobuf: schema in a .proto file"] },
        right: { label: "Columnar", items: ["Parquet, ORC: schema in the footer", "Parquet: CRC32 on pages", "Arrow: columns in memory"] },
      } },
        "Parquet pages of all kinds can be individually checksummed with the standard CRC32 algorithm. In an Avro file, block sizes, object counts and sync markers enable detection of corrupt blocks.",
        "The Arrow columnar format specifies a language-agnostic in-memory data structure, with data adjacency for sequential access and zero-copy access in shared memory.",
        "OWASP advises validating stored records and partner feeds when they cross a trust boundary, checking both the expected type and format and whether the value makes sense, with a schema validator to enforce field rules."],
      claims: ["file-formats-and-encoding-avro-file", "file-formats-and-encoding-proto-schema", "file-formats-and-encoding-footer", "file-formats-and-encoding-checksums", "file-formats-and-encoding-arrow", "file-formats-and-encoding-validation"],
    }),
  ],
  governance: { text: "A file that arrives without a schema is an unvalidated input: OWASP advises validating stored records and partner feeds at a trust boundary with a schema validator. Avro and Parquet files carry their schema, and Parquet pages can carry a CRC32 checksum, so a reader can verify what it received.", claims: ["file-formats-and-encoding-validation", "file-formats-and-encoding-avro-file", "file-formats-and-encoding-footer", "file-formats-and-encoding-checksums"] },
  closing: {
    pitfalls: [
      "Loading a CSV file and trusting the types a tool inferred from it.",
      "Reusing or renumbering a Protobuf field number that older readers still know.",
      "Choosing a columnar file for data that is written and read one record at a time.",
    ],
    questions: [
      "Where does the reader find the schema in CSV, JSON, Avro, Protobuf and Parquet?",
      "Why can Finance's older code still read a message that has a new field?",
      "What in a Parquet or Avro file lets a reader detect damage?",
    ],
  },
});
