import { blocks, CANVAS, cells, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// The floor: one small table drawn as blocks, one block per value, coloured by column.
// First the blocks lie row by row. Then they regroup into column chunks, two row groups side by side.
// A query engine asks the file metadata where the chunks are and reads along the scan rail.
const G = isoGrid(600, 100, 30);
const SIZE = 1, GAP = 0.15, RAIL = 9.4;
const COLS: { k: string; gy: number; hue: Hue }[] = [
  { k: "order", gy: 0, hue: "sand" }, { k: "channel", gy: 2.4, hue: "mint" }, { k: "email", gy: 4.8, hue: "rose" }, { k: "amount", gy: 7.2, hue: "sky" },
];
const RG = [0, 4.3];
type State = "idle" | "read" | "rest" | "skip";
const H: Record<State, number> = { idle: 16, read: 30, rest: 6, skip: 16 };
/** One column chunk of one row group: three values. */
const chunk = (c: (typeof COLS)[number], rg: 0 | 1, state: State, group: string): El =>
  blocks(`${c.k}${rg}-${group}`, RG[rg], c.gy, 3, SIZE, [0, 1, 2].map(() => ({ h: H[state], hue: c.hue, state: state === "skip" ? "closed" as const : undefined })), { gap: GAP, group });
/** The whole column file in one state: which columns are read, and whether row group 1 is skipped. */
const file = (group: string, read: string[], skipFirst = false): El[] => COLS.flatMap((c) => ([0, 1] as const).map((rg) =>
  chunk(c, rg, rg === 0 && skipFirst ? "skip" : read.length === 0 ? "idle" : read.includes(c.k) ? "read" : "rest", group)));
const ROWS = [["4468", "store", "a.k@…", "129"], ["4469", "store", "j.p@…", "349"], ["4470", "web", "m.l@…", "899"], ["4471", "web", "s.o@…", "1290"], ["4472", "web", "t.r@…", "1450"], ["4473", "app", "k.d@…", "2100"]];
const above = (gx: number, gy: number, dy: number): [number, number] => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

export default defineGuide({
  id: "columnar-storage", track: "data", module: "Analytical systems", slug: "columnar-storage",
  title: "Columnar storage",
  summary: "An analytical query uses a few columns of many rows. A columnar file keeps each column together, so the reader fetches only those columns and skips what statistics rule out.",
  forLeads: "Columnar files are why analytical storage is cheap to scan. The same layout that speeds up queries also lets a sensitive column be encrypted on its own.",
  status: "draft", minutes: 7,
  counters: ["Layout", "Values read", "Stored as", "Row groups read"],
  whatIf: { label: "What if the file were stored row by row?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders are illustrative",
    label: "A table of six orders with four columns is drawn as blocks on the floor, one block per value and one colour per column. Row by row, a query that needs two columns reads every block. Regrouped into column chunks in two row groups, the query engine asks the file metadata for chunk locations, reads only two columns, and skips a row group that the statistics rule out.",
    els: [
      raise(table("orders", 0, 0, 250, ["order", "channel", "email", "amount"], ROWS, { at: [12, 66, 130, 196], rowH: 24, title: "orders", sub: "6 rows, 4 columns", always: true }), [130, 290], 30),
      prism("engine", RAIL - 0.6, 11.6, 1.2, 1.2, 30, { hue: "track", glyph: "search", title: "Query engine", sub: "amount by channel", at: "s", group: "q1" }),
      prism("engine2", RAIL - 0.6, 11.6, 1.2, 1.2, 30, { hue: "track", glyph: "search", title: "Query engine", sub: "amount by channel, over 1000", at: "s", group: "stats" }),
      line("scan", [G.p(RAIL, 11.6), G.p(RAIL, -0.6)], { group: "col" }),
      line("scan0", [G.p(RAIL, 11.6), G.p(RAIL, 7.4)], { group: "rowfile" }),
      stop("s-engine", ...G.p(RAIL, 11.6), undefined, undefined, { group: "anchor" }),
      stop("s-file", ...G.p(RAIL, 7.4), undefined, undefined, { group: "rowfile" }),

      blocks("rowfile", 0, 0, 4, SIZE, ROWS.flatMap(() => COLS.map((c) => ({ h: 26, hue: c.hue }))), { gap: GAP, group: "rowfile" }),
      pill("rowfile-l", above(2.2, 8.7, 0), "one order after another", { group: "rowfile" }),

      ...file("idle", []), ...file("cols", ["channel", "amount"]), ...file("skip", ["channel", "amount"], true),
      ...COLS.map((c) => pill(`l-${c.k}`, above(-1.2, c.gy + 0.5, 15), c.k, { anchor: "end", mono: true, group: c.k === "email" ? "plain" : "col" })),
      pill("key", above(-1.2, 5.3, 15), "email, own key", { glyph: "lock", anchor: "end", group: "key" }),
      pill("rg1", above(1.65, 0.5, 78), "row group 1", { group: "rg" }),
      pill("rg2", above(5.95, 0.5, 78), "row group 2", { group: "rg" }),

      prism("meta", RAIL - 0.5, 8.7, 1, 1, 22, { hue: "paper", glyph: "map", title: "File metadata", sub: "where each chunk starts", at: "se", group: "col" }),
      ...COLS.map((c) => stop(`s-${c.k}`, ...G.p(RAIL, c.gy + 0.5), undefined, undefined, { group: "col" })),
      stop("s-meta", ...G.p(RAIL, 9.2), undefined, undefined, { group: "anchor" }),

      raise(cells("enc", 0, 0, 3, [70, 30], ["store ×2", "web ×3", "app ×1"], { title: "channel, as stored", group: "enc" }), G.p(4.6, -3.25), 30),

      raise(list("stats", 0, 0, 250, [{ t: "group 1   129 to 899", strike: true }, { t: "group 2   1290 to 2100", hot: true }], { title: "amount, from the metadata", mono: true, group: "stats" }), [230, 470], 30),
    ],
  },
  steps: [
    step({
      id: "rows", label: "Row by row", kind: "problem", title: "The query reads what it does not need",
      caption: "Finance asks for the average order amount by channel. The file stores one order after another, so the engine reads all four values of every order to use two.",
      show: ["rowfile", "q1"], counters: ["row by row", "24 of 24", "plain values", "the whole file"],
      rides: [ride("scan0", 0, 1, "channel, amount")],
      body: ["The table has six orders and four columns. Stored row by row, the channel and the amount of each order sit between values the query never uses.",
        "Apache Parquet is a column-oriented data file format designed for efficient data storage and retrieval."],
      claims: ["columnar-storage-definition"],
    }),
    step({
      id: "columns", label: "Columns", kind: "idea", title: "Keep each column together",
      caption: "A columnar file regroups the same values. A row group holds one column chunk for each column, and every chunk is a run of values of one kind.",
      show: ["idle", "col", "plain", "rg", "q1"], counters: ["column by column", "none yet", "plain values", "none yet"],
      body: ["A row group consists of a column chunk for each column in the dataset, and column chunks are divided into pages.",
        { callout: { label: "Key idea", text: "The values a query needs now sit next to each other, and the values it does not need sit somewhere else." } }],
      claims: ["columnar-storage-layout", "columnar-storage-definition"],
    }),
    step({
      id: "project", label: "Read two", kind: "mechanism", title: "Read only the columns the query names",
      caption: "The engine reads the file metadata first. It holds the start of every column chunk, so the engine goes straight to channel and amount and never touches the rest.",
      show: ["cols", "col", "plain", "rg", "q1"], counters: ["column by column", "12 of 24", "plain values", "2 of 2"],
      rides: [ride("scan", "s-engine", "s-channel", "2 columns", { via: ["s-meta", "s-amount"], then: "2 chunks" })],
      body: ["Column chunks are contiguous in the file. The file metadata contains the start locations of all column chunks, and a reader first reads the metadata to find the chunks it is interested in."],
      claims: ["columnar-storage-locations"],
    }),
    step({
      id: "encode", label: "Encode", kind: "mechanism", title: "Similar values pack small",
      caption: "Values in one column resemble each other. Parquet stores repeats as a dictionary entry and a run length, then compresses each page.",
      show: ["cols", "col", "plain", "enc", "q1"], counters: ["column by column", "12 of 24", "dictionary and run lengths", "2 of 2"],
      rides: [ride("scan", "s-meta", "s-channel", "2 chunks", { via: ["s-amount"] })],
      body: ["Parquet defines dictionary encoding and a hybrid of bit-packing and run-length encoding that stores repeated values more efficiently.",
        "The data inside pages can then be compressed, with codecs that include Snappy, Gzip and Zstandard."],
      claims: ["columnar-storage-encodings", "columnar-storage-compression"],
    }),
    step({
      id: "skip", label: "Skip", kind: "mechanism", title: "Statistics rule out whole row groups",
      caption: "The metadata keeps the lower and upper bound of each column in each row group. For amounts over 1000, row group 1 tops out at 899, so the engine skips it.",
      show: ["skip", "col", "plain", "rg", "stats"], counters: ["column by column", "6 of 24", "dictionary and run lengths", "1 of 2"],
      rides: [ride("scan", "s-engine", "s-channel", "over 1000", { via: ["s-meta", "s-amount"], then: "group 2" })],
      body: ["Parquet stores statistics, including lower and upper bound values, per row group and per page. Its column index gives direct access to pages based on their min and max values."],
      claims: ["columnar-storage-statistics"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What a columnar file gives",
      caption: "",
      show: ["skip", "col", "rg", "stats", "key"], counters: ["column by column", "6 of 24", "dictionary and run lengths", "1 of 2"],
      rides: [ride("scan", "s-meta", "s-channel", "group 2", { via: ["s-amount"] })],
      body: [{ pair: {
        left: { label: "Faster scans", items: ["Only the named columns are read", "Statistics skip row groups and pages", "Encoded, compressed pages"] },
        right: { label: "Finer control", items: ["A sensitive column encrypted with its own key", "The same layout in memory with Arrow"] },
      } },
        "The Arrow columnar format specifies a language-agnostic in-memory data structure, so data can stay columnar from the file into the engine."],
      claims: ["columnar-storage-locations", "columnar-storage-statistics", "columnar-storage-encryption", "columnar-storage-arrow"],
    }),
  ],
  governance: { text: "Parquet modular encryption allows different keys for different columns and for the footer, so a sensitive column such as email can be protected on its own.", claims: ["columnar-storage-encryption"] },
  closing: {
    pitfalls: [
      "Selecting every column out of habit, which reads every chunk.",
      "Expecting statistics to help a filter on a column whose values are spread evenly across all row groups.",
      "Treating encryption of the whole file as the only option for a sensitive column.",
    ],
    questions: [
      "What does a row group contain?",
      "How does the engine find the chunks it needs without reading the whole file?",
      "Why does a filter on amount skip row group 1?",
    ],
  },
});
