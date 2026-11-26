import { CANVAS, blocks, defineGuide, isoGrid, line, pill, prism, ride, slab, step, stop } from "@signal-path/engine";

// Finance follows one query past three analytical storage designs. The blue blocks are the same illustrative order files.
const G = isoGrid(480, 280, 27);
const queryLine = [G.p(-8, 6), G.p(12, 6)];
const stops = { warehouse: G.p(-4, 6), lake: G.p(3, 6), lakehouse: G.p(10, 6) };
const fileItems = [0, 1, 2, 3].map((i) => ({ h: 20 + i * 3, hue: "sky" as const }));

export default defineGuide({
  id: "warehouses-lakes-and-lakehouses", track: "data", module: "Storage", slug: "warehouses-lakes-and-lakehouses",
  title: "Warehouses, lakes and lakehouses",
  summary: "A warehouse manages storage and compute as one product, a lake keeps open files on object storage, and a lakehouse adds warehouse-style tables to those files.",
  forLeads: "Choose which responsibilities the platform owns and which stay with your team. Open table formats let multiple engines work with shared data, while central access rules and audit records keep that data governed.",
  status: "draft", minutes: 7,
  counters: ["Data layout", "Compute", "Table rules", "Independent copies"],
  whatIf: { label: "What if each engine kept its own copy?", step: 2, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and query movement are illustrative",
    label: "A Finance query rides a rail past three storage architectures. At the warehouse stop, the platform holds managed tables and compute. At the lake stop, open order files rest on object storage and a separate engine reads them. At the lakehouse stop, table metadata and transaction rules sit over those same files, so several engines can work with the table. The final view shows one shared table with access and audit controls instead of a separate unmanaged copy for every engine.",
    els: [
      line("query", queryLine, { always: true }),
      stop("q-start", ...G.p(-7, 6), undefined, undefined, { always: true }),
      stop("q-wh", ...stops.warehouse, undefined, undefined, { always: true }),
      stop("q-lake", ...stops.lake, undefined, undefined, { always: true }),
      stop("q-lh", ...stops.lakehouse, undefined, undefined, { always: true }),

      prism("warehouse", -11, -2, 2.6, 2.4, 42, { hue: "track", glyph: "database", title: "Warehouse", sub: "managed tables", at: "s", group: "warehouse" }),
      pill("query-label", [100, 55], "Finance query", { glyph: "chart", tone: "track", always: true }),

      slab("lake-floor", -1.4, -1.1, 3.6, 2.5, undefined, { hue: "sky", group: "lake" }),
      blocks("lake-files", -0.8, -0.7, 4, 0.75, fileItems, { gap: 0.2, z: 10, group: "lake" }),
      pill("lake-name", [460, 120], "Data lake", { glyph: "stack", tone: "track", group: "lake" }),
      pill("lake-format", [460, 160], "Parquet files", { mono: true, group: "lake" }),
      prism("lake-engine", 4, -0.5, 1.5, 1.3, 30, { hue: "track", glyph: "search", title: "Trino", sub: "separate engine", at: "s", group: "lake" }),

      slab("lh-floor", 6.6, -1.1, 3.6, 2.5, undefined, { hue: "sky", group: "lakehouse" }),
      blocks("lh-files", 7.2, -0.7, 4, 0.75, fileItems, { gap: 0.2, z: 10, group: "lakehouse" }),
      pill("lh-meta", [770, 190], "Iceberg table metadata", { glyph: "table", tone: "track", group: "lakehouse" }),
      pill("lh-name", [760, 270], "Lakehouse", { glyph: "layers", tone: "track", group: "lakehouse" }),
      pill("engine-a", [790, 92], "Spark", { glyph: "search", sub: "reads the table", tone: "track", group: "engines" }),
      pill("engine-b", [790, 138], "Trino", { glyph: "search", sub: "same table", tone: "track", group: "engines" }),
      pill("access", [790, 28], "Shared access policy", { glyph: "key", group: "governance" }),
      pill("audit", [790, 62], "Audited reads", { glyph: "eye", group: "governance" }),

      // A separate copy per engine is the counterfactual, drawn at the same floor points as the shared lakehouse files.
      blocks("copy-a", 6.1, -0.7, 4, 0.75, fileItems.map((b) => ({ ...b, hue: "sand" as const })), { gap: 0.2, z: 10, group: "copies" }),
      blocks("copy-b", 8.2, -0.7, 4, 0.75, fileItems.map((b) => ({ ...b, hue: "rose" as const })), { gap: 0.2, z: 10, group: "copies" }),
      pill("copies-label", [780, 200], "Two unmanaged copies", { tone: "alert", group: "copies" }),
    ],
  },
  steps: [
    step({
      id: "choose", label: "The query", kind: "problem", title: "Finance needs a place to query orders",
      caption: "Finance asks for revenue by channel. The order files exist, but the analytical system must decide how they are stored and made queryable.",
      show: [], counters: ["files", "none", "none", "0"],
      rides: [ride("query", "q-start", "q-wh", "revenue query")],
      body: ["Vinterhus already has columnar files and understands how storage and compute can be separate. Now Finance needs a platform that makes those files useful for recurring analysis."],
      claims: ["warehouses-lakes-and-lakehouses-problem"],
    }),
    step({
      id: "warehouse", label: "Warehouse", kind: "idea", title: "A warehouse manages storage and compute together",
      caption: "The warehouse stores managed tables and provides the compute that runs Finance's query. Snowflake is one cloud warehouse example.",
      show: ["warehouse"], counters: ["managed tables", "warehouse service", "managed schema", "0"],
      rides: [ride("query", "q-start", "q-wh", "revenue query")],
      body: ["Snowflake documents a central repository for persisted data and independent virtual warehouses as compute clusters. Its service manages storage organisation, file structure, compression and metadata for Snowflake tables.",
        "Other cloud data warehouses package these responsibilities differently. The common choice is a managed analytic product whose tables and query compute are operated together."],
      claims: ["warehouses-lakes-and-lakehouses-warehouse"],
    }),
    step({
      id: "lake", label: "Lake", kind: "mechanism", title: "A lake keeps files on object storage",
      caption: "Parquet order files sit in object storage. Trino supplies query compute separately and reads the files without moving them into a warehouse's private table storage.",
      show: ["lake"], counters: ["open files", "separate engine", "file schema", "0"],
      rides: [ride("query", "q-start", "q-lake", "revenue query")],
      body: ["A data lake holds diverse data formats in a scalable store. In a lake architecture, the files can remain on cloud object storage while different analytics engines read them.",
        "Parquet is a columnar file format commonly used for analytic data. Trino is one example of an engine that can query files in object storage."],
      claims: ["warehouses-lakes-and-lakehouses-lake", "warehouses-lakes-and-lakehouses-parquet"],
    }),
    step({
      id: "lakehouse", label: "Lakehouse", kind: "mechanism", title: "A table format adds table rules to the files",
      caption: "Apache Iceberg tracks the Parquet files as one table. Metadata defines its schema and snapshots; commits expose complete table changes atomically.",
      show: ["lakehouse", "engines"], counters: ["open files", "multiple engines", "schema and snapshots", "0"],
      rides: [ride("query", "q-start", "q-lh", "revenue query")],
      body: ["Apache Iceberg is an open table format for analytic datasets. It manages a collection of files as a table, recording schema, partitioning and snapshots in metadata. Changes become visible when metadata is atomically replaced.",
        "Apache Iceberg tables can be used by compute engines including Spark and Trino. Delta Lake and Apache Hudi are other open table-format projects used to build lakehouse architectures."],
      claims: ["warehouses-lakes-and-lakehouses-iceberg", "warehouses-lakes-and-lakehouses-formats"],
    }),
    step({
      id: "govern", label: "Govern", kind: "watch-out", title: "Shared files need shared controls",
      caption: "Multiple engines can use the same table, but each one still needs authorised access and an audit trail. A table format does not grant either by itself.",
      show: ["lakehouse", "engines", "governance"], counters: ["one shared set", "multiple engines", "schema and snapshots", "0"],
      rides: [ride("query", "q-start", "q-lh", "authorised query")],
      body: ["AWS recommends centralised authorisation and auditing in a modern data architecture because access policies spread across data stores can become complex and error-prone.",
        "An open format gives compatible engines a shared table representation. The organisation must still configure identity, permissions, encryption, retention and audit logging for its storage and engines."],
      claims: ["warehouses-lakes-and-lakehouses-governance", "warehouses-lakes-and-lakehouses-iceberg"],
    }),
    step({
      id: "decide", label: "Choose", kind: "decision", title: "Choose by the responsibility you need",
      caption: "",
      show: ["warehouse", "lakehouse", "engines", "governance"], counters: ["one governed set", "right-sized compute", "table rules", "0"],
      rides: [ride("query", "q-start", "q-lh", "revenue query")],
      body: [{ pair: {
        left: { label: "Cloud warehouse", items: ["Managed tables and query compute", "Fast managed analytics", "Service owns more of the operation"] },
        right: { label: "Lakehouse", items: ["Open files on object storage", "Table metadata and transactions", "Multiple engines share governed data"] },
      } },
        "A lake is the file-based storage layer. A lakehouse is useful when those files also need table semantics for concurrent readers, writes and SQL engines."],
      claims: ["warehouses-lakes-and-lakehouses-warehouse", "warehouses-lakes-and-lakehouses-lake", "warehouses-lakes-and-lakehouses-iceberg", "warehouses-lakes-and-lakehouses-governance"],
    }),
  ],
  governance: { text: "Open table formats allow compatible engines to work with shared tables, while access still requires central authorisation and auditing across data stores. Govern the shared data once and give each engine only the access it needs.", claims: ["warehouses-lakes-and-lakehouses-iceberg", "warehouses-lakes-and-lakehouses-governance"] },
  closing: {
    pitfalls: [
      "Assuming every warehouse stores tables in the same way.",
      "Treating a data lake as a database with transactions by default.",
      "Confusing an open table format with built-in identity and access control.",
    ],
    questions: [
      "Which parts of a cloud warehouse are operated for you?",
      "What does a lakehouse table format add to the underlying files?",
      "How do all engines that read a shared table inherit the same access and audit policy?",
    ],
  },
});
