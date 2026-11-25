import { CANVAS, code, defineGuide, drum, isoGrid, line, list, node, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: the shop app on the left and a trunk rail that runs past five stores, one branch each.
// The relational database is there from the start. Each stop opens one more store, sends one question down its branch,
// and stands the shape that store keeps on the board at the top right. The card at the bottom left lists the questions.
const G = isoGrid(440, 70, 30);
const TRUNK = 9, STORE = 4.6, START = -2.2;
const BOARD: Pt = [796, 232], ASK: Pt = [150, 508];
const STORES: { k: string; gx: number; hue: Hue; glyph: string; title: string; sub: string }[] = [
  { k: "rel", gx: 1.5, hue: "paper", glyph: "table", title: "Relational", sub: "tables and SQL" },
  { k: "kv", gx: 5.25, hue: "sand", glyph: "key", title: "Key-value", sub: "Valkey" },
  { k: "doc", gx: 9, hue: "mint", glyph: "doc", title: "Document", sub: "MongoDB" },
  { k: "wide", gx: 12.75, hue: "violet", glyph: "sort", title: "Wide-column", sub: "Cassandra" },
  { k: "graph", gx: 16.5, hue: "sky", glyph: "net", title: "Graph", sub: "Neo4j" },
];
/** One store: its drum, its branch off the trunk, the corner and the place where a record rests. */
const store = (s: (typeof STORES)[number]): El[] => [
  drum(s.k, s.gx, STORE, 1.05, 38, { hue: s.hue, glyph: s.glyph, title: s.title, sub: s.sub, at: "n", group: s.k }),
  line(`r-${s.k}`, [G.p(START, TRUNK), G.p(s.gx, TRUNK), G.p(s.gx, STORE + 1.05)], { group: `r-${s.k}` }),
  stop(`c-${s.k}`, ...G.p(s.gx, TRUNK), undefined, undefined, { group: `r-${s.k}` }),
  stop(`at-${s.k}`, ...G.p(s.gx, 7.75), undefined, undefined, { group: "anchor" }),
];
const ASKS = ["order 4471, complete", "basket by its key", "one customer's orders", "bought with SOFA-2210"];
/** The questions of the shop app, with the one this stop sends drawn hot and the ones not yet asked muted. */
const asks = (id: string, hot: number, upTo: number): El =>
  raise(list(id, 0, 0, 236, ASKS.map((t, i) => ({ t, hot: i === hot, mute: i > upTo })), { title: "The shop app asks", rowH: 27, group: id }), ASK, 26);

// The graph of the fifth stop, drawn flat where the board stands: one product, the two orders that contain it, and what else they contain.
const N = { sofa: [672, 58], o1: [794, 58], lamp: [900, 58], o2: [672, 192], rug: [900, 192] } satisfies Record<string, Pt>;
const gnode = (id: string, at: Pt, label: string, hue: Hue, hot = false): El => node(id, at[0], at[1], label, { shape: "box", mono: true, hue, hot, group: "b-graph" });
const edge = (id: string, a: Pt, b: Pt): El => line(id, [a, b], { tone: "ink", w: 3, group: "b-graph" });

export default defineGuide({
  id: "non-relational-data-models", track: "data", module: "Data and databases", slug: "non-relational-data-models",
  title: "Non-relational data models",
  summary: "Key-value, document, wide-column and graph stores each keep data in the shape one kind of question needs. Tables answer the same questions through joins at query time.",
  forLeads: "A non-relational store is chosen for one access pattern, not as a replacement for the relational database. A flexible schema means the team, not the database, decides where each record is checked.",
  status: "draft", minutes: 7,
  counters: ["Store", "Access pattern", "One read touches", "Joins at read time"],
  whatIf: { label: "What if everything stayed in tables?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, keys and queries are illustrative",
    label: "The shop app stands on the left of a rail that runs past five stores. First there is only the relational database, and showing order 4471 joins four tables. Then one store opens at each stop: a key-value store that returns a basket for its key, a document store that holds the whole order as one document, a wide-column store that keeps one customer's orders sorted in a partition, and a graph store where a question follows relationships from a product to orders to other products. A board on the right shows the shape of the data in the store of the stop, and a card on the left lists the questions the app asks. At the last stop a schema check sits on the rail before the stores, and an analytical table keeps the order in a variant column.",
    els: [
      prism("app", START - 1.8, TRUNK - 0.9, 1.8, 1.8, 36, { hue: "track", glyph: "globe", title: "Shop app", at: "n", always: true }),
      ...STORES.flatMap(store),

      // the questions
      asks("ask-rel", 0, 0), asks("ask-kv", 1, 1), asks("ask-doc", 0, 1), asks("ask-wide", 2, 2), asks("ask-graph", 3, 3), asks("ask-all", -1, 3),

      // the board: what each store keeps
      raise(table("b-rel", 0, 0, 250, ["table", "rows read"], [["orders", "1"], ["order_lines", "2"], ["products", "2"], ["customers", "1"]], { at: [14, 160], rowH: 25, title: "Order 4471", sub: "4 tables, 3 joins", group: "b-rel" }), BOARD, 26),
      raise(table("b-kv", 0, 0, 270, ["key", "value"], [{ cells: ["cart:4471", "2 items, 1290"], hot: true }, ["cart:4472", "1 item, 1450"], ["cart:4473", "3 items, 2100"]], { at: [14, 122], rowH: 25, title: "Baskets", sub: "one value per key", group: "b-kv" }), BOARD, 26),
      raise(code("b-doc", 0, 0, 290, ["{ _id: 4471, channel: \"web\",", "  email: \"s.o@…\",", "  lines: [", "    { code: \"SOFA-2210\", qty: 1 },", "    { code: \"LAMP-0417\", qty: 2 } ],", "  amount: 1290 }"], { keywords: ["lines:"], hot: [2, 3, 4], title: "Order 4471", sub: "one document", group: "b-doc" }), BOARD, 26),
      raise(table("b-wide", 0, 0, 290, ["email", "order", "amount"], [{ cells: ["s.o@…", "4490", "349"], hot: true }, { cells: ["s.o@…", "4482", "129"], hot: true }, { cells: ["s.o@…", "4471", "1290"], hot: true }, { cells: ["t.r@…", "4472", "1450"], mute: true }], { at: [14, 120, 204], rowH: 25, title: "orders_by_customer", mono: true, foot: "partition key email, sorted by order", group: "b-wide" }), BOARD, 26),
      pill("g-rel", [800, 100], "relationship", { sub: "order contains product", to: [672, 122], group: "b-graph" }),
      edge("e1", N.sofa, N.o1), edge("e2", N.o1, N.lamp), edge("e3", N.o2, N.rug),
      line("walk", [N.sofa, N.o2, N.rug], { w: 5, group: "b-graph" }),
      stop("w-o2", ...N.o2, undefined, undefined, { group: "anchor" }),
      gnode("n-sofa", N.sofa, "SOFA-2210", "sky", true), gnode("n-o1", N.o1, "4471", "sand"), gnode("n-o2", N.o2, "4472", "sand"),
      gnode("n-lamp", N.lamp, "LAMP-0417", "sky"), gnode("n-rug", N.rug, "RUG-1032", "sky"),

      // 6. the control and the analytical copy
      raise(code("b-gov", 0, 0, 290, ["\"required\": [\"email\", \"lines\"],", "\"properties\": {", "  \"amount\": { \"type\": \"number\" } }"], { keywords: ["\"required\":", "\"type\":"], title: "Order contract", sub: "JSON Schema", group: "gov" }), BOARD, 26),
      stop("s-check", ...G.p(-0.6, TRUNK), "schema check", "before any write", { at: "sw", group: "gov" }),
      line("r-wh", [G.p(START, TRUNK), G.p(18.6, TRUNK)], { group: "gov" }),
      prism("wh", 18.6, TRUNK - 0.6, 1.2, 1.2, 24, { hue: "paper", glyph: "chart", title: "Analytical table", sub: "order in a variant column", at: "e", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "tables", label: "Tables", kind: "problem", title: "One order is spread over four tables",
      caption: "The shop app shows order 4471. Its lines, products and customer sit in separate tables, so every page view joins them again at query time.",
      show: ["rel", "r-rel", "ask-rel", "b-rel"], counters: ["relational", "any question, by joining", "4 tables", "3"],
      rides: [ride("r-rel", 0, "at-rel", "order 4471", { via: ["c-rel"], then: "3 joins" })],
      body: ["With a relational schema an application often needs to join data from several tables to get what it shows. A join is computed at query time by matching primary and foreign keys of the rows in the connected tables.",
        "The tables stay. The stores that follow are added beside them, each for one question the shop app asks often."],
      claims: ["non-relational-data-models-joins"],
    }),
    step({
      id: "key-value", label: "Key-value", kind: "idea", title: "A key-value store answers one key",
      caption: "The basket is stored under the key cart:4471. One GET returns its value, in Valkey in constant time. Nothing is joined.",
      show: ["rel", "r-rel", "kv", "r-kv", "ask-kv", "b-kv"], counters: ["key-value", "get by key", "1 key", "none"],
      rides: [ride("r-kv", 0, "at-kv", "GET cart:4471", { via: ["c-kv"], then: "2 items" })],
      body: ["Valkey is an in-memory data structure store. Its GET command returns the value of a key, or nil if the key does not exist, with time complexity O(1). The documentation suggests key names of the form object-type:id.",
        "A key can carry a time to live. When it elapses the key is destroyed, which suits a basket nobody came back to.",
        "Amazon DynamoDB supports both key-value and document data models. An item is read directly by its primary key, and there is no JOIN operator."],
      claims: ["non-relational-data-models-get", "non-relational-data-models-ttl", "non-relational-data-models-dynamodb"],
    }),
    step({
      id: "document", label: "Document", kind: "mechanism", title: "A document keeps the whole order together",
      caption: "In MongoDB the order is one document. Its lines are an array of embedded documents, so data that is read together is stored together and one query returns it.",
      show: ["rel", "r-rel", "kv", "r-kv", "doc", "r-doc", "ask-doc", "b-doc"], counters: ["document", "one whole order", "1 document", "none"],
      rides: [ride("r-doc", 0, "at-doc", "_id 4471", { via: ["c-doc"], then: "1 document" })],
      body: ["MongoDB stores records as BSON documents made of field and value pairs. A value can be another document, an array, or an array of documents, and every document has a unique _id that acts as its primary key.",
        { callout: { label: "Key idea", text: "Data that is accessed together should be stored together. Embedding avoids joins across collections." } },
        "Documents in one collection are not required to have the same fields or data types. That freedom is what the last stop has to answer for."],
      claims: ["non-relational-data-models-document", "non-relational-data-models-together", "non-relational-data-models-flexible"],
    }),
    step({
      id: "wide-column", label: "Wide-column", kind: "mechanism", title: "A wide-column table is sorted for one query",
      caption: "Cassandra groups rows by partition key, here the customer email, and sorts them by clustering key. One customer's order history is one partition, read in order.",
      show: ["rel", "r-rel", "kv", "r-kv", "doc", "r-doc", "wide", "r-wide", "ask-wide", "b-wide"], counters: ["wide-column", "one customer's orders, sorted", "1 partition", "none, not supported"],
      rides: [ride("r-wide", 0, "at-wide", "email s.o@…", { via: ["c-wide"], then: "3 rows" })],
      body: ["Cassandra implements a partitioned wide-column storage model. The first field of the primary key gives the partition key, and the remaining fields are clustering keys that sort the data within a partition, which makes reading adjacent rows efficient.",
        "Data modelling in Cassandra starts from the queries. Joins are not supported, so every column a query needs sits in one table, and the same data is duplicated across tables, one per query. Cassandra has no referential integrity across those tables."],
      claims: ["non-relational-data-models-wide", "non-relational-data-models-query-first"],
    }),
    step({
      id: "graph", label: "Graph", kind: "mechanism", title: "A graph stores the relationships themselves",
      caption: "Orders and products are nodes, and each purchase is a relationship. Finding what else buyers of SOFA-2210 chose is a traversal that follows relationships from node to node.",
      show: ["rel", "r-rel", "kv", "r-kv", "doc", "r-doc", "wide", "r-wide", "graph", "r-graph", "ask-graph", "b-graph"], counters: ["graph", "follow relationships", "connected nodes", "none, a traversal"],
      rides: [ride("r-graph", 0, "at-graph", "SOFA-2210", { via: ["c-graph"], then: "2 products" }), ride("walk", 0, 0.68, "SOFA-2210", { via: ["w-o2"], then: "also bought", shape: "pill" })],
      body: ["Neo4j uses a property graph model. Nodes describe entities, a relationship connects a source node to a target node, and both carry properties as key-value pairs. Traversing means visiting nodes by following relationships.",
        "In tables a many-to-many relationship needs a join table that holds the foreign keys of both sides. Neo4j states that a graph keeps relationships in the database structure, so connected nodes are reached directly, and that this helps join-heavy queries.",
        "Graph queries have their own ISO standard language, GQL, published in April 2024."],
      claims: ["non-relational-data-models-graph", "non-relational-data-models-graph-joins", "non-relational-data-models-gql"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Each model fits one access pattern",
      caption: "",
      show: ["rel", "r-rel", "kv", "r-kv", "doc", "r-doc", "wide", "r-wide", "graph", "r-graph", "ask-all", "gov"], counters: ["four beside the tables", "one per store", "what that pattern needs", "none"],
      rides: [ride("r-doc", 0, "at-doc", "order 4474", { via: ["s-check"], then: "valid" })],
      body: [{ pair: {
        left: { label: "Pick by pattern", items: ["Key-value: one key", "Document: one whole record", "Wide-column: one sorted partition", "Graph: connected records"] },
        right: { label: "Also decide", items: ["Who validates each write", "JSON Schema as the contract", "Variant columns for analytics"] },
      } },
        "A flexible schema accepts what it is given. A DynamoDB table is schemaless apart from its primary key, and PostgreSQL notes that the structure of JSON documents is typically unenforced while recommending a somewhat fixed one.",
        "The check therefore moves. MongoDB schema validation adds rules for fields, such as allowed data types and value ranges, and then rejects an insert or update that would produce an invalid document. JSON Schema is a declarative language for the structure and constraints of JSON data, and a validator checks documents against it.",
        "Analytical tables take the same data without flattening it first. A Snowflake VARIANT column stores values of any type, including objects and arrays, and the Apache Parquet Variant encoding represents semi-structured data such as JSON."],
      claims: ["non-relational-data-models-schemaless", "non-relational-data-models-unenforced", "non-relational-data-models-flexible", "non-relational-data-models-json-schema", "non-relational-data-models-variant"],
    }),
  ],
  governance: { text: "With a flexible schema the database stops rejecting records of the wrong shape: MongoDB documents in one collection need not share fields or types, and a DynamoDB table is schemaless apart from its key. Structure is then enforced by validation rules the team adds and by a JSON Schema that applications check before they write.", claims: ["non-relational-data-models-flexible", "non-relational-data-models-schemaless", "non-relational-data-models-json-schema"] },
  closing: {
    pitfalls: [
      "Choosing a store before listing the queries it has to answer.",
      "Expecting a wide-column table to serve a query it was not designed for. Each query has its own table.",
      "Treating a flexible schema as no schema. The structure still exists, in every application that reads the data.",
    ],
    questions: [
      "Why does reading order 4471 from a document store need no join?",
      "What decides the order of rows inside a Cassandra partition?",
      "Where is a record checked when the database accepts any shape?",
    ],
  },
});
