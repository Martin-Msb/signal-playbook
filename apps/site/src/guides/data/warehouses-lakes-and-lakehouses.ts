import { CANVAS, blocks, defineGuide, isoGrid, line, list, pawn, pill, prism, raise, ride, slab, step, stop } from "@signal-path/engine";
import type { El, Hue } from "@signal-path/engine";

// The floor: three platforms side by side, each built from the same parts in the same rows.
// Back row: order files as blocks. Middle row: the table layer. Front row: compute engines.
// The slab is the boundary. The warehouse slab runs under all three rows. The lake and lakehouse slab is object storage,
// which holds only files and, in the lakehouse, the table metadata. Their engines stand outside it on the open floor.
const G = isoGrid(350, 70, 30), Z = 10;
const WH = 2.2, LAKE = 8.6, LH = 15;
const BACK = 2.5, EDGE = 4.2, REST = 5.6, FRONT = 7.6, FORK = 4.9;

const files = (id: string, c: number, hue: Hue, group: string): El =>
  blocks(id, c - 1.8, 0.4, 4, 0.7, Array.from({ length: 8 }, () => ({ h: 18, hue })), { gap: 0.2, z: Z, group });
const tableLayer = (id: string, c: number, group: string, closed = false): El =>
  prism(id, c - 0.6, 2.8, 1.2, 1, 14, { hue: closed ? undefined : "sand", glyph: closed ? undefined : "table", state: closed ? "closed" : undefined, z: Z, group });
const engine = (id: string, gx: number, gy: number, title: string, sub: string, group: string, z = 0): El =>
  prism(id, gx, gy, 1.6, 1.6, 30, { hue: "track", glyph: "search", title, sub, at: "s", z, group });
const runs = (id: string, sub: string, items: Parameters<typeof list>[4]): El =>
  raise(list(id, 0, 0, 214, items, { title: "Who runs it", sub, mono: true, group: id }), [128, 514], 26);

export default defineGuide({
  id: "warehouses-lakes-and-lakehouses", track: "data", module: "Storage", slug: "warehouses-lakes-and-lakehouses",
  title: "Warehouses, lakes and lakehouses",
  summary: "A warehouse manages storage and compute as one product, a lake keeps open files on object storage, and a lakehouse adds warehouse-style tables to those files.",
  forLeads: "Choose which parts the platform runs and which stay with your team. Open table formats let several engines work on one shared copy, and central access rules and audit records keep that copy governed.",
  status: "draft", minutes: 7,
  counters: ["Files", "Table layer", "Compute"],
  whatIf: { label: "What if the files had no table layer?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, files and engines are illustrative",
    label: "Three platforms stand side by side, each built from the same parts: order files as blocks at the back, a table layer in the middle and compute engines at the front. First there are only Parquet files on an object storage plate, and Finance asks a question nothing can answer. The warehouse appears on the left as one green slab that carries its own files, its tables and its compute, and rows ride out to the engine. The lake in the middle is the storage plate with the files alone: the table slot is empty, and an engine standing outside the plate receives raw files. The lakehouse on the right is the same plate and the same files with a table layer added, and two engines outside the plate receive the same table. Access and audit controls are then marked on that table layer. A card lists who runs the files, the tables and the compute at each stop.",
    els: [
      // the files Vinterhus already has: Parquet on object storage. This plate becomes the lake.
      slab("lake-plate", LAKE - 2.2, 0, 4.4, EDGE, undefined, { hue: "sky", group: "files" }),
      files("lake-files", LAKE, "sky", "files"),
      pill("store-name", [600, 104], "Object storage", { glyph: "stack", sub: "Parquet files", group: "store-name" }),
      pawn("fin", LAKE, 8.4, "Finance", "Revenue by channel?", { side: "w", group: "ask" }),
      runs("own1", "today", ["files    Vinterhus", { t: "tables   none", mute: true }, { t: "compute  none", mute: true }]),

      // the warehouse: one slab under every row
      slab("wh-slab", -0.4, -0.4, 5.2, 10, undefined, { group: "wh" }),
      files("wh-files", WH, "violet", "wh"),
      tableLayer("wh-table", WH, "wh"),
      engine("wh-engine", WH - 0.8, FRONT, "Virtual warehouse", "compute", "wh", Z),
      line("wh-rail", [G.p(WH, BACK, Z), G.p(WH, FRONT, Z)], { group: "wh" }),
      stop("wh-a", ...G.p(WH, BACK, Z), undefined, undefined, { group: "wh" }),
      stop("wh-b", ...G.p(WH, REST, Z), undefined, undefined, { group: "wh" }),
      pill("wh-name", [350, 12], "Cloud warehouse", { glyph: "database", tone: "track", group: "wh" }),
      pill("wh-format", [150, 62], "Its own format", { sub: "rewritten on load", to: G.p(0.75, 1.65, Z + 18), group: "wh-n" }),
      pill("wh-tables", [96, 122], "Managed tables", { glyph: "table", to: G.p(WH - 0.5, 3.6, Z + 14), group: "wh-n" }),
      runs("own2", "warehouse", [{ t: "files    the service", hot: true }, { t: "tables   the service", hot: true }, { t: "compute  the service", hot: true }]),

      // the lake: the files alone, and an engine outside the plate
      tableLayer("lake-slot", LAKE, "lake", true),
      engine("lake-engine", LAKE - 0.8, FRONT, "Trino", "separate engine", "lake"),
      line("lake-rail", [G.p(LAKE, BACK, Z), G.p(LAKE, EDGE, Z), G.p(LAKE, EDGE), G.p(LAKE, FRONT)], { group: "lake" }),
      stop("lake-a", ...G.p(LAKE, BACK, Z), undefined, undefined, { group: "lake" }),
      stop("lake-b", ...G.p(LAKE, REST), undefined, undefined, { group: "lake" }),
      pill("lake-name", [600, 104], "Data lake", { glyph: "stack", tone: "track", sub: "object storage", group: "lake" }),
      pill("lake-none", [720, 150], "No table layer", { tone: "alert", glyph: "x", to: G.p(LAKE + 0.5, 3, Z + 12), group: "lake-n" }),
      runs("own3", "lake", ["files    Vinterhus", { t: "tables   none", mute: true }, { t: "compute  Trino", hot: true }]),

      // the lakehouse: the same plate and files, with a table layer on the storage and two engines outside it
      slab("lh-plate", LH - 2.2, 0, 4.4, EDGE, undefined, { hue: "sky", group: "lh" }),
      files("lh-files", LH, "sky", "lh"),
      tableLayer("lh-table", LH, "lh"),
      prism("lh-trino", LH - 0.8, FRONT + 0.4, 1.6, 1.6, 30, { hue: "track", glyph: "search", title: "Trino", at: "s", group: "lh" }),
      prism("lh-spark", LH + 4.8, FORK - 0.8, 1.6, 1.6, 30, { hue: "track", glyph: "search", title: "Spark", at: "e", group: "lh" }),
      line("lh-a", [G.p(LH, BACK, Z), G.p(LH, EDGE, Z), G.p(LH, EDGE), G.p(LH, FRONT + 0.4)], { group: "lh" }),
      line("lh-b", [G.p(LH, BACK, Z), G.p(LH, EDGE, Z), G.p(LH, EDGE), G.p(LH, FORK), G.p(LH + 4.8, FORK)], { group: "lh" }),
      stop("lh-0", ...G.p(LH, BACK, Z), undefined, undefined, { group: "lh" }),
      stop("lh-1", ...G.p(LH, REST + 0.4), undefined, undefined, { group: "lh" }),
      stop("lh-2", ...G.p(LH + 2.6, FORK), undefined, undefined, { group: "lh" }),
      pill("lh-name", [730, 188], "Lakehouse", { glyph: "layers", tone: "track", sub: "object storage", group: "lh" }),
      pill("lh-meta", [858, 110], "Iceberg metadata", { glyph: "table", sub: "on the same storage", to: G.p(LH + 0.5, 3, Z + 14), group: "lh-n" }),
      runs("own4", "lakehouse", ["files    Vinterhus", { t: "tables   Iceberg", hot: true }, { t: "compute  Spark, Trino", hot: true }]),

      // the controls sit on the shared table layer
      pill("gov-key", [858, 110], "Access check", { glyph: "key", sub: "before credentials", to: G.p(LH + 0.5, 3, Z + 14), group: "gov" }),
      pill("gov-log", [858, 52], "Audit log", { glyph: "eye", sub: "every read", group: "gov" }),
      runs("own5", "lakehouse", ["files    Vinterhus", "tables   Iceberg", "compute  Spark, Trino", { t: "access   one policy", hot: true }]),
    ],
  },
  steps: [
    step({
      id: "files", label: "Files", kind: "problem", title: "Order files alone answer no query",
      caption: "Vinterhus keeps its orders as Parquet files on object storage. Finance asks for revenue by channel. Nothing here runs a query or says which files are the table.",
      show: ["files", "store-name", "ask", "own1"], counters: ["Parquet, open", "none", "none"],
      body: ["The orders are already columnar Parquet files, and they already sit on object storage apart from any compute. What is missing is a platform: something to run the query and something to say which files make up the orders table.",
        "Three platform designs fill those gaps. Each is built from the same parts, files, a table layer and compute, and they differ in which parts one product owns."],
      claims: ["warehouses-lakes-and-lakehouses-parquet", "warehouses-lakes-and-lakehouses-lake"],
    }),
    step({
      id: "warehouse", label: "Warehouse", kind: "idea", title: "A warehouse manages storage and compute as one product",
      caption: "Loading the orders into Snowflake rewrites them in its own columnar format. Files, tables and compute sit inside one service, and Finance receives rows.",
      show: ["files", "store-name", "wh", "wh-n", "own2"], counters: ["warehouse format", "built in", "built in"],
      rides: [ride("wh-rail", "wh-a", "wh-b", "rows")],
      body: ["When data is loaded into a Snowflake table, Snowflake reorganises it into its internally optimised, compressed, columnar format. It manages all aspects of how the data is stored, including organisation, file size, structure, compression, metadata and statistics. Virtual warehouses, its compute clusters, process the SQL.",
        "Cloud data warehouses such as Snowflake and Amazon Redshift commonly sit downstream of a lake, with data loaded from the lake into the warehouse. The authors of the lakehouse paper, who work at Databricks, count the cost: double storage for the copied data, and proprietary formats that raise the cost of migrating to another system."],
      claims: ["warehouses-lakes-and-lakehouses-warehouse", "warehouses-lakes-and-lakehouses-two-tier"],
    }),
    step({
      id: "lake", label: "Lake", kind: "mechanism", title: "A lake is open files on object storage",
      caption: "The Parquet files stay where they are. Trino, a separate engine, reads them directly. No table layer stands between, so a change spanning several files is not atomic.",
      show: ["files", "wh", "lake", "lake-n", "own3"], counters: ["Parquet, open", "none", "Trino, outside"],
      rides: [ride("lake-rail", "lake-a", "lake-b", "8 files")],
      body: ["Object storage systems are commonly used to create data lakes, and the objects are files in formats such as Parquet. Trino accesses those files directly on object storage.",
        "AWS puts the limit plainly: data lakes are not databases, and object storage does not provide ACID processing semantics. On a plain object store interface, even updating a table that spans several files is not atomic."],
      claims: ["warehouses-lakes-and-lakehouses-lake", "warehouses-lakes-and-lakehouses-parquet", "warehouses-lakes-and-lakehouses-lake-limits"],
    }),
    step({
      id: "lakehouse", label: "Lakehouse", kind: "mechanism", title: "A lakehouse adds tables to the open files",
      caption: "Apache Iceberg metadata tracks the same Parquet files as one table with snapshots, and each commit swaps in atomically. Spark and Trino both receive that table.",
      show: ["files", "wh", "lake", "lh", "lh-n", "own4"], counters: ["Parquet, open", "Iceberg", "Spark and Trino"],
      rides: [ride("lh-a", "lh-0", "lh-1", "1 table"), ride("lh-b", "lh-0", "lh-2", "1 table")],
      body: ["A lakehouse is a data management system on low-cost, directly accessible storage that also provides the management features of an analytical database, such as ACID transactions and data versioning. Its key part is a transactional metadata layer over the object store that defines which objects belong to a table version.",
        "Apache Iceberg is one such layer. Table state is kept in metadata files, a snapshot is the state of the table at some time, and every change writes a new metadata file that replaces the old one in an atomic swap. Iceberg adds tables to engines including Spark and Trino.",
        "Apache Hudi and Delta Lake are the other common open table formats.",
        { callout: { label: "Key idea", text: "The files do not move and do not change format. The lakehouse is the lake plus a table layer." } }],
      claims: ["warehouses-lakes-and-lakehouses-lakehouse", "warehouses-lakes-and-lakehouses-iceberg", "warehouses-lakes-and-lakehouses-formats"],
    }),
    step({
      id: "govern", label: "Govern", kind: "watch-out", title: "Shared files need shared controls",
      caption: "Several engines now reach one copy. The table layer can check each engine before granting storage credentials and log every read, so policy lives in one place.",
      show: ["files", "wh", "lake", "lh", "gov", "own5"], counters: ["Parquet, one copy", "Iceberg, with access checks", "Spark and Trino"],
      rides: [ride("lh-a", "lh-0", "lh-1", "checked"), ride("lh-b", "lh-0", "lh-2", "checked")],
      body: ["AWS recommends centralised authorisation and auditing, because configuring access policies in the data lake and across all the data stores can be overly complex and error prone.",
        "The lakehouse paper names the metadata layer as a natural place for those controls: it can check whether a client may access a table before granting it credentials to read the raw data from the object store, and it can log all accesses."],
      claims: ["warehouses-lakes-and-lakehouses-governance", "warehouses-lakes-and-lakehouses-controls"],
    }),
    step({
      id: "decide", label: "Choose", kind: "decision", title: "Choose who runs each part",
      caption: "",
      show: ["files", "wh", "lake", "lh", "gov", "own5"], counters: ["one governed copy", "Iceberg, with access checks", "any compatible engine"],
      rides: [ride("wh-rail", "wh-a", "wh-b", "rows"), ride("lake-rail", "lake-a", "lake-b", "8 files"), ride("lh-a", "lh-0", "lh-1", "1 table")],
      body: [{ pair: {
        left: { label: "Cloud warehouse", items: ["One service runs every part", "Data held in its own format"] },
        right: { label: "Lakehouse", items: ["Open files on your storage", "Table layer shared by engines", "Access governed once"] },
      } },
        "A lake on its own is the storage half of either design. It becomes a lakehouse when a table format is added, and it feeds a warehouse when its data is loaded into one."],
      claims: ["warehouses-lakes-and-lakehouses-warehouse", "warehouses-lakes-and-lakehouses-lakehouse", "warehouses-lakes-and-lakehouses-two-tier", "warehouses-lakes-and-lakehouses-governance"],
    }),
  ],
  governance: { text: "Iceberg is an open standard that several engines read, where commercial warehouses hold data in proprietary formats that raise the cost of leaving. One shared copy with central authorisation and auditing replaces a second, loaded copy.", claims: ["warehouses-lakes-and-lakehouses-iceberg", "warehouses-lakes-and-lakehouses-two-tier", "warehouses-lakes-and-lakehouses-governance"] },
  closing: {
    pitfalls: [
      "Treating a data lake as a database with transactions by default.",
      "Loading the same data into a warehouse and a lake, then governing only one of the copies.",
      "Confusing an open table format with built-in identity and access control.",
    ],
    questions: [
      "Which parts of a cloud warehouse are run for you, and in which format is the data held?",
      "What does a lakehouse table format add to the files, and what does it leave unchanged?",
      "How do all engines that read a shared table inherit the same access and audit policy?",
    ],
  },
});
