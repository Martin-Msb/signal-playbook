import { blocks, CANVAS, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt, Row } from "@signal-path/engine";

// The floor holds two tables that the platform serves, drawn as blocks, one block per row.
// At the back lies the feature table customer_returns: three rows of one customer, placed along their event times,
// each as tall as its value. A thin time rail runs in front of it. A marker starts at the order time and rides to the row a join takes.
// At the front lies the knowledge the refund assistant reads: source text as chunks, and one embedding per chunk in a vector index.
// When the source changes, the chunk blocks change first and the embedding blocks follow only when a sync runs.
const G = isoGrid(290, 70, 30);
const S = 1.2, Z = 10;
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

// the feature table: event days of November along gx
const day = (d: number) => 2 + (d - 9) * 0.5;
const TIME = 2.4, MID = 0.6;
const ROWS_F = [{ d: 9, v: 1 }, { d: 20, v: 2 }, { d: 25, v: 3 }];
const feat = (i: number, group: string, o: { hue?: Hue; hot?: boolean; state?: "closed" | "alert" } = {}): El =>
  blocks(`f${i}-${group}`, day(ROWS_F[i].d), 0, 1, S, [{ h: ROWS_F[i].v * 14, hue: "sky", ...o }], { z: Z, group });
const MODEL = 21.0, ONLINE = 16.0;

// the documents: source, chunks, embeddings, assistant along gx
const DOC = 8, CH = 4.8, EM = 12.7, C = 1, ASK = { from: 19.7, to: 16.5 }, BOT = 20.4;
const row3 = (id: string, gx: number, group: string, items: { hue?: Hue; hot?: boolean; state?: "closed" | "alert" }[], title: string, sub: string, z = 0): El =>
  blocks(id, gx, DOC - C / 2, 3, C, items.map((it) => ({ h: 22, ...it })), { gap: 0.2, z, title, sub, at: "s", group });

const TOP: Pt = [800, 196], LEFT: Pt = [156, 530];
const features = (id: string, sub: string, rows: Row[], extra: Record<string, unknown> = {}): El =>
  raise(table(id, 0, 0, 300, ["customer", "event time", "returns_90d"], rows, { at: [12, 96, 190], rowH: 24, title: "customer_returns", sub, mono: true, group: id, ...extra }), TOP, 26);
const values = (id: string, title: string, sub: string, rows: Row[], extra: Record<string, unknown> = {}): El =>
  raise(table(id, 0, 0, 270, ["read by", "as of", "returns_90d"], rows, { at: [12, 92, 170], rowH: 24, title, sub, mono: true, group: id, ...extra }), LEFT, 22);
const source = (id: string, sub: string, rows: Row[]): El =>
  raise(table(id, 0, 0, 282, ["document", "chunk"], rows, { at: [12, 128], rowH: 24, title: "Source text", sub, mono: true, group: id }), LEFT, 22);
const index = (id: string, sub: string, rows: Row[], extra: Record<string, unknown> = {}): El =>
  raise(table(id, 0, 0, 296, ["chunk", "embedded", "access"], rows, { at: [12, 150, 226], rowH: 24, title: "Vector index", sub, mono: true, group: id, ...extra }), TOP, 26);

export default defineGuide({
  id: "serving-data-to-ml-and-ai", track: "data", module: "Serving", slug: "serving-data-to-ml-and-ai",
  title: "Serving data to ML and AI",
  summary: "A model needs the same feature value in training as it was served. An AI assistant needs embeddings that change and disappear when their source does.",
  forLeads: "Features and embeddings are derived copies of governed tables. They need the same freshness, access rules and deletion handling as the tables they come from.",
  status: "draft", minutes: 7,
  counters: ["Training reads", "Serving reads", "Vector index", "Source changes"],
  whatIf: { label: "What if training joined the latest row?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customers, orders, dates and texts are illustrative",
    label: "Two served tables lie on a floor as blocks. At the back the feature table customer_returns holds three rows for one customer, on 9, 20 and 25 November, each as tall as its value of 1, 2 and 3. Order 4471 was placed on 14 November. Joined on the customer alone it takes the latest row, 3, while the model was served 1. A point-in-time join rides back from the order time to the row of 9 November, so training and serving both read 1. The latest row is then loaded into an online store for the returns model. At the front, source text becomes three chunks and three embeddings in a vector index that the refund assistant queries. When the policy is edited and a ticket is deleted, the index still holds the old embeddings until a sync updates one and removes the other.",
    els: [
      // the feature table and its time rail
      slab("ft", 1.5, -0.4, 10.2, 2, undefined, { hue: "paper", always: true }),
      pill("ft-name", up(1.2, 0.4, 24), "Feature table", { sub: "one row per change", anchor: "end", always: true }),
      line("time", [G.p(1.6, TIME), G.p(13.7, TIME)], { tone: "ink", w: 3, always: true }),
      ...ROWS_F.map((r) => stop(`t${r.d}`, ...G.p(day(r.d) + S / 2, TIME), `${r.d} Nov`, undefined, { mono: true, at: "sw", always: true })),
      stop("t14", ...G.p(day(14) + S / 2, TIME), "14 Nov", "4471 placed", { mono: true, at: "sw", big: true, group: "o4471" }),
      line("cut", [G.p(day(14) + S / 2, -0.9), G.p(day(14) + S / 2, TIME)], { tone: "ink", w: 2, state: "planned", group: "o4471" }),
      stop("t30", ...G.p(day(30) + S / 2, TIME), "30 Nov", "4502 placed", { mono: true, at: "sw", big: true, group: "o4502" }),
      ...ROWS_F.map((r, i) => pill(`v${i}`, up(day(r.d) + S / 2, MID, r.v * 14 + 64), String(r.v), { mono: true, always: true })),
      feat(0, "plain"), feat(1, "plain"), feat(2, "plain"),
      feat(2, "wrong", { state: "alert" }),
      feat(0, "asof", { hot: true }), feat(1, "asof", { state: "closed" }), feat(2, "asof", { state: "closed" }),
      feat(2, "latest", { hot: true }),

      // serving the latest row
      line("serve", [G.p(11.9, MID), G.p(MODEL - 0.55, MID)], { always: true }),
      stop("s-latest", ...G.p(12.0, MID), undefined, undefined, { always: true }),
      stop("s-in", ...G.p(13.2, MID), undefined, undefined, { always: true }),
      stop("s-out", ...G.p(18.4, MID), undefined, undefined, { always: true }),
      drum("online", ONLINE, MID, 0.9, 32, { hue: "sky", glyph: "table", title: "Online store", sub: "latest row", at: "n", group: "online" }),
      prism("model", MODEL - 0.55, MID - 0.55, 1.1, 1.1, 30, { hue: "paper", glyph: "net", title: "Returns model", at: "s", always: true }),

      // the documents, their chunks and the vector index
      line("docs", [G.p(3.2, DOC), G.p(EM - 0.3, DOC)], { always: true }),
      line("ask", [G.p(ASK.from, DOC), G.p(ASK.to, DOC)], { always: true }),
      drum("texts", 3.2, DOC, 0.9, 32, { hue: "sky", glyph: "doc", title: "Documents", sub: "policies, tickets", at: "sw", always: true }),
      stop("d-out", ...G.p(4.35, DOC), undefined, undefined, { always: true }),
      stop("d-mid", ...G.p(10.5, DOC), undefined, undefined, { always: true }),
      slab("ix", EM - 0.3, DOC - 1, 4, 2, undefined, { hue: "violet", always: true }),
      pill("ix-name", [398, 458], "Vector index", { sub: "inside the platform", always: true }),
      prism("bot", BOT - 0.6, DOC - 0.6, 1.2, 1.2, 30, { hue: "paper", glyph: "mail", title: "Refund assistant", at: "e", always: true }),
      row3("ch-a", CH, "ch1", [{ hue: "sand" }, { hue: "sand" }, { hue: "mint" }], "Chunks", ""),
      row3("ch-b", CH, "ch2", [{ hot: true }, { hue: "sand" }, { state: "closed" }], "Chunks", ""),
      row3("em-a", EM, "em1", [{ hue: "violet" }, { hue: "violet" }, { hue: "violet" }], "", "", Z),
      row3("em-b", EM, "em2", [{ state: "alert" }, { hue: "violet" }, { state: "alert" }], "", "", Z),
      row3("em-c", EM, "em3", [{ hot: true }, { hue: "violet" }, { state: "closed" }], "", "", Z),

      // what the tables hold
      features("ft-wrong", "joined on customer", [["c-118", "9 Nov", "1"], ["c-118", "20 Nov", "2"], { cells: ["c-118", "25 Nov", "3"], hot: true }], { tone: "alert" }),
      features("ft-asof", "as of 14 Nov", [{ cells: ["c-118", "9 Nov", "1"], hot: true }, { cells: ["c-118", "20 Nov", "2"], strike: true, mute: true }, { cells: ["c-118", "25 Nov", "3"], strike: true, mute: true }]),
      features("ft-latest", "history kept", [["c-118", "9 Nov", "1"], ["c-118", "20 Nov", "2"], { cells: ["c-118", "25 Nov", "3"], hot: true }]),
      values("val-wrong", "Order 4471", "values differ", [["serving", "14 Nov", "1"], { cells: ["training", "today", "3"], hot: true }], { tone: "alert" }),
      values("val-asof", "Order 4471", "values match", [["serving", "14 Nov", "1"], { cells: ["training", "14 Nov", "1"], hot: true }]),
      values("val-latest", "Order 4502", "values match", [{ cells: ["serving", "30 Nov", "3"], hot: true }, ["training", "30 Nov", "3"]]),
      source("src-a", "three chunks", [["returns policy", "Sofas: 30 days"], ["returns policy", "Fees: 349 kr"], ["ticket 4471", "s.o@… sofa torn"]]),
      source("src-b", "edited on 30 Nov", [{ cells: ["returns policy", "Sofas: 14 days"], hot: true }, ["returns policy", "Fees: 349 kr"], { cells: ["ticket 4471", "s.o@… sofa torn"], strike: true, mute: true }]),
      index("ix-a", "in step with the source", [["Sofas: 30 days", "1 Nov", "public"], ["Fees: 349 kr", "1 Nov", "support"], ["s.o@… sofa torn", "16 Nov", "support"]]),
      index("ix-b", "1 stale, 1 orphaned", [{ cells: ["Sofas: 30 days", "1 Nov", "public"], hot: true }, ["Fees: 349 kr", "1 Nov", "support"], { cells: ["s.o@… sofa torn", "16 Nov", "support"], hot: true }], { tone: "alert" }),
      index("ix-c", "synced on 30 Nov", [{ cells: ["Sofas: 14 days", "30 Nov", "public"], hot: true }, ["Fees: 349 kr", "1 Nov", "support"], { cells: ["s.o@… sofa torn", "16 Nov", "support"], strike: true, mute: true }]),

      // 6. the controls
      pill("gov-sync", [24, 34], "Sync on change", { glyph: "loop", sub: "edits and deletes", anchor: "start", group: "gov" }),
      pill("gov-access", [24, 92], "Access filter", { glyph: "lock", sub: "checked in the query", anchor: "start", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "mismatch", label: "Mismatch", kind: "problem", title: "Training reads a value the model never saw",
      caption: "Order 4471 was placed on 14 November and scored with returns_90d = 1. The training join matches on customer alone and takes the latest row: 3.",
      show: ["o4471", "f0-plain", "f1-plain", "f2-wrong", "ft-wrong", "val-wrong"], counters: ["latest row: 3", "1", "not built", "untracked"],
      rides: [ride("time", "t14", "t25", "4471 joins", { via: ["t20"], then: "takes 3", tone: "alert", shape: "pill" })],
      body: ["Vinterhus scores every order with a returns model. One input is returns_90d, the number of orders the customer returned in the last 90 days. The feature table gains a row each time that number changes.",
        "The value of 25 November includes returns made after order 4471 was placed. Google's Rules of Machine Learning define training-serving skew as a difference between performance during training and performance during serving. One of its listed causes is a change in the data between when you train and when you serve.",
        { callout: { label: "Key idea", text: "A feature table is a history. A join has to say which moment of that history it wants." } }],
      claims: ["serving-data-to-ml-and-ai-skew"],
    }),
    step({
      id: "time", label: "Time join", kind: "idea", title: "A point-in-time join takes only rows known then",
      caption: "The join scans back from the order time and stops at the row of 9 November. Later rows are out of reach. Training and serving both read 1.",
      show: ["o4471", "f0-asof", "f1-asof", "f2-asof", "ft-asof", "val-asof"], counters: ["as of 14 Nov: 1", "1", "not built", "untracked"],
      rides: [ride("time", "t14", "t9", "as of 14 Nov", { then: "takes 1", shape: "pill" })],
      body: ["Feast, an open-source feature store, describes a point-in-time join as reproducing the state of features at a specific point in the past. For each training row it scans backward in time from that row's timestamp, up to the TTL set on the feature view.",
        "Feast states the purpose directly: point-in-time correct feature sets ensure that no future data leaks into model training.",
        "Event time alone can still let a late value through. By default the join constrains only the feature's event timestamp, so a value that was backfilled or corrected afterwards can be returned. Filtering on the created timestamp keeps such values out.",
        { callout: { label: "Key idea", text: "Each training row gets the newest feature row at or before its own timestamp, never a later one." } }],
      claims: ["serving-data-to-ml-and-ai-point-in-time-join", "serving-data-to-ml-and-ai-scan-back", "serving-data-to-ml-and-ai-no-future-data"],
    }),
    step({
      id: "serve", label: "Serve", kind: "mechanism", title: "One feature table feeds training and serving",
      caption: "The full history stays in the table for training. Its latest row per customer is loaded into an online store. Order 4502 is served 3 and will train on 3.",
      show: ["o4502", "f0-plain", "f1-plain", "f2-latest", "online", "ft-latest", "val-latest"], counters: ["as of each order", "latest row: 3", "not built", "untracked"],
      rides: [ride("serve", "s-latest", "s-in", "latest row", { then: "3" }), ride("serve", "s-in", "s-out", "4502", { then: "4502: 3" }), ride("time", "t30", "t25", "as of 30 Nov", { then: "takes 3", shape: "pill" })],
      body: ["Feast separates an offline store, which manages historical feature extraction for batch scoring and model training, from an online store, which powers low-latency feature serving for real-time production systems. Historical retrieval produces the training dataset, and online retrieval makes the latest feature values available at prediction time.",
        "The online store holds only the latest feature values for each entity key and no history. Values are loaded into it through materialisation, and Feast describes this as a push model for online serving.",
        "The online value is only as fresh as the pipeline behind it. Feast does not orchestrate workflows and relies on upstream data pipelines to produce feature values, so the incremental jobs of the platform set how current a served feature is."],
      claims: ["serving-data-to-ml-and-ai-offline-online-stores", "serving-data-to-ml-and-ai-historical-and-online-retrieval", "serving-data-to-ml-and-ai-online-latest", "serving-data-to-ml-and-ai-online-serving-push", "serving-data-to-ml-and-ai-pipeline-keeps-features-current"],
    }),
    step({
      id: "embed", label: "Embed", kind: "mechanism", title: "Documents become chunks and embeddings",
      caption: "The refund assistant reads text. An embedding pipeline splits each document into chunks and stores one vector per chunk in a vector index beside the tables.",
      show: ["f0-plain", "f1-plain", "f2-plain", "online", "ch1", "em1", "src-a", "ix-a"], counters: ["as of each order", "latest row: 3", "3 embeddings", "untracked"],
      rides: [ride("docs", "d-out", "d-mid", "3 texts", { then: "3 vectors" }), ride("ask", 0, 0.56, "sofa returns?", { then: "30 days" })],
      body: ["Unless documents are small, chunking is necessary to meet the token input limits of embedding models. Azure AI Search runs chunking and embedding as skills of one indexer pipeline that writes the chunked and vectorised content into a search index.",
        "The index can live inside the data platform. pgvector adds vector similarity search to Postgres and stores vectors with the rest of the data. Databricks AI Search, formerly Databricks Vector Search, creates an index from a source Delta table and can calculate the embeddings with a model the owner specifies.",
        { callout: { label: "Key idea", text: "An embedding is a derived column. It is computed from a row of text and is only correct while that row is unchanged." } }],
      claims: ["serving-data-to-ml-and-ai-chunk-and-embed", "serving-data-to-ml-and-ai-vectors-with-data", "serving-data-to-ml-and-ai-index-from-table"],
    }),
    step({
      id: "stale", label: "Stale index", kind: "watch-out", title: "The source changes and the index does not",
      caption: "The policy now says 14 days, and ticket 4471 is erased at the customer's request. No sync runs. The assistant still answers 30 days and the ticket's embedding remains.",
      show: ["f0-plain", "f1-plain", "f2-plain", "online", "ch2", "em2", "src-b", "ix-b"], counters: ["as of each order", "latest row: 3", "1 stale, 1 orphaned", "missed"],
      rides: [ride("docs", "d-out", "d-mid", "edit, delete", { then: "not synced", tone: "alert" }), ride("ask", 0, 0.56, "sofa returns?", { then: "30 days", tone: "alert" })],
      body: ["An index is a copy, and a copy changes only when something writes to it. A Databricks Delta Sync index in triggered mode is updated when a sync is started through the SDK or the REST API. A Direct Vector Access index is updated only by its owner's own calls.",
        "A deleted source row leaves its vector behind unless the delete is carried through. In Qdrant a point is a record of a vector and an optional payload, and points are removed by a delete operation, which can select them with a filter.",
        { callout: { label: "What changed", text: "Nothing failed. The index answers from the text it was built from, which is no longer the text in the source." } }],
      claims: ["serving-data-to-ml-and-ai-sync-modes", "serving-data-to-ml-and-ai-vector-record-updates"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Derived data follows its source",
      caption: "",
      show: ["f0-plain", "f1-plain", "f2-plain", "online", "ch2", "em3", "src-b", "ix-c", "gov"], counters: ["as of each order", "latest row: 3", "synced", "followed"],
      rides: [ride("docs", "d-out", "d-mid", "edit, delete", { then: "synced" }), ride("ask", 0, 0.56, "sofa returns?", { then: "14 days" })],
      body: [{ pair: {
        left: { label: "Keep in step", items: ["Training value and served value", "Online store and feature table", "Embeddings and source text"] },
        right: { label: "Carry through", items: ["Access rules into retrieval", "Deletions into features and vectors"] },
      } },
        "A Delta Sync index syncs with its source table automatically and updates the index incrementally. Continuous mode keeps it in sync with seconds of latency. In Azure AI Search, an indexer on a schedule moves source changes through chunking, vectorisation and indexing.",
        "Access rules travel with the rows. Qdrant applies conditions on payload and point id when searching or retrieving points, so an access label stored with each chunk can be enforced in the query. Databricks AI Search indexes appear in Unity Catalog and are governed by it.",
        "Erasure has to reach the copies. Under specified conditions the EU GDPR requires a controller to communicate an erasure to the recipients of the data and to take reasonable steps concerning copies or replications. An erasure that stops at the source table leaves the ticket's text in the chunks and vectors built from it."],
      claims: ["serving-data-to-ml-and-ai-sync-modes", "serving-data-to-ml-and-ai-source-changes-flow", "serving-data-to-ml-and-ai-vector-filtering", "serving-data-to-ml-and-ai-index-governed", "serving-data-to-ml-and-ai-erasure-recipients", "serving-data-to-ml-and-ai-point-in-time-join"],
    }),
  ],
  governance: { text: "Access rules and deletions follow the data into its derived copies. A vector index can filter on labels stored with each chunk and can be governed in the platform catalogue. The EU GDPR requires controllers to communicate erasures to recipients and to take reasonable steps concerning copies or replications.", claims: ["serving-data-to-ml-and-ai-vector-filtering", "serving-data-to-ml-and-ai-index-governed", "serving-data-to-ml-and-ai-erasure-recipients"] },
  closing: {
    pitfalls: [
      "Joining training rows to the latest feature row instead of the row known at each order's time.",
      "Editing or deleting a document without syncing the chunks and embeddings built from it.",
      "Assuming an embedding hides personal data or enforces access by itself.",
    ],
    questions: [
      "Which row of the feature table could order 4471 have known about, and why not the later ones?",
      "Why does the online store hold one row per customer while the feature table holds three?",
      "Which derived records have to change when ticket 4471 is erased at its source?",
    ],
  },
});
