import { arrow, CANVAS, code, defineGuide, isoGrid, line, list, node, pill, prism, raise, ride, step, stop, table, treeOf } from "@signal-path/engine";
import type { El, Row } from "@signal-path/engine";

// The floor: two tables stand on posts at the back, customers on the left and orders on the right.
// The database engine stands where their two rails cross. A statement comes in from the front left,
// and a result leaves to the front right. The first stop shows the same data as one wide table.
const G = isoGrid(480, 130, 30);
const C = 8.5;
const ENGINE = G.p(C, C), CUST = G.p(-1.5, C), ORD = G.p(C, -1.5), WIDE = G.p(3.5, 3.5);
const hot = (cells: string[], on: boolean): Row => (on ? { cells, hot: true } : cells);

const CUSTOMERS = [["1", "a.k@…", "Oslo"], ["2", "m.l@…", "Tromsø"], ["3", "s.o@…", "Bergen"]];
const ORDERS = [["4468", "1", "store", "129"], ["4469", "2", "web", "349"], ["4470", "2", "web", "899"], ["4471", "1", "web", "1290"], ["4472", "2", "app", "1450"]];
const customers = (group: string, lit: number[]): El =>
  raise(table(`cust-${group}`, 0, 0, 214, ["id", "email", "city"], CUSTOMERS.map((r, i) => hot(r, lit.includes(i))), { at: [12, 54, 136], rowH: 24, title: "customers", sub: "primary key: id", group }), CUST, 30);
const orders = (group: string, lit: number[], sub: string): El =>
  raise(table(`ord-${group}`, 0, 0, 262, ["order", "customer", "channel", "amount"], ORDERS.map((r, i) => hot(r, lit.includes(i))), { at: [12, 68, 142, 206], rowH: 24, title: "orders", sub, group }), ORD, 30);
const engine = (group: string, title: string, sub: string): El =>
  prism(`engine-${group}`, C - 0.8, C - 0.8, 1.6, 1.6, 34, { hue: "track", glyph: "gear", title, sub, at: "n", group: `e-${group}` });

export default defineGuide({
  id: "the-relational-model-and-sql", track: "data", module: "Data and databases", slug: "the-relational-model-and-sql",
  title: "The relational model and SQL",
  summary: "Data is kept as tables of rows. Keys identify rows and link tables, a query states the result it wants across them, and the database engine decides how to produce it.",
  forLeads: "SQL is the one query language shared by databases, warehouses and lakehouse engines. Keys and constraints are the first quality controls, and the query is where access rules and audit logs attach.",
  status: "draft", minutes: 7,
  counters: ["Customer city stored", "Order without a customer", "Query", "Plan"],
  whatIf: { label: "What if customers stayed inside the orders table?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and customers are illustrative",
    label: "First, one wide orders table repeats each customer's email and city on every order, and an address change reaches only one row. Then the data stands as two tables, customers and orders, each with a primary key, joined by a foreign key from orders to customers. A database engine stands where the rails from the two tables cross. An order for a customer that does not exist is rejected. A SQL statement from Finance enters the engine, which builds a plan as a tree, reads both tables and returns two rows. At the last stop a grant, a column without a grant and an audit log are marked.",
    els: [
      // 1. one wide table, and an update that reaches one row of three
      raise(table("wide", 0, 0, 440, ["order", "channel", "amount", "email", "city"], [
        ["4468", "store", "129", "a.k@…", "Oslo"], ["4469", "web", "349", "m.l@…", "Bergen"], ["4470", "web", "899", "m.l@…", "Bergen"],
        ["4471", "web", "1290", "a.k@…", "Oslo"], { cells: ["4472", "app", "1450", "m.l@…", "Tromsø"], hot: true },
      ], { at: [12, 84, 170, 256, 346], rowH: 24, title: "orders", sub: "the customer repeats on every order", group: "wide" }), WIDE, 30),
      prism("support", 2.8, 13.4, 1.4, 1.4, 30, { glyph: "wrench", title: "Support", sub: "customer moved", at: "s", group: "wide" }),
      line("upd", [G.p(3.5, 13.4), WIDE], { group: "wide" }),
      stop("u-row", ...G.p(3.5, 6), undefined, undefined, { group: "wide" }),
      pill("stale", [800, 290], "one customer, two cities", { tone: "alert", to: [706, 150], group: "wide" }),

      // 2 to 6. two tables, the engine between them, and the rails to each
      customers("c2", [1]), customers("c3", []), customers("cq", [0, 1]),
      orders("o2", [], "primary key: order"), orders("o3", [], "foreign key: customer"), orders("oq", [1, 2, 3], "foreign key: customer"),
      engine("db", "Database engine", "checks every write"), engine("plan", "Database engine", "plans every query"), engine("any", "SQL engine", "PostgreSQL, BigQuery, Trino"),
      line("rc", [ENGINE, CUST], { group: "rails" }),
      line("ro", [ENGINE, ORD], { group: "rails" }),
      stop("s-eng", ...ENGINE, undefined, undefined, { group: "anchor" }),
      stop("s-cust", ...G.p(0.9, C), undefined, undefined, { group: "rails" }),
      stop("s-ord", ...G.p(C, 0.9), undefined, undefined, { group: "rails" }),
      stop("s-c2", ...G.p(3.4, C), undefined, undefined, { group: "anchor" }),
      stop("s-o2", ...G.p(C, 3.4), undefined, undefined, { group: "anchor" }),

      // 3. the foreign key, and an insert that breaks it
      arrow("fk", "M 646 50 L 292 50", { head: true, label: "orders.customer references customers.id", labelAt: [469, 40], labelAnchor: "middle", group: "fk" }),
      prism("checkout", C - 0.7, 13.4, 1.4, 1.4, 30, { glyph: "pen", title: "Checkout", sub: "inserts an order", at: "w", group: "ins" }),
      line("ins", [G.p(C, 13.4), ENGINE], { group: "ins" }),
      pill("reject", [800, 300], "no customer 9: error", { tone: "alert", group: "ins" }),

      // 4 to 6. the statement, its path through the engine, and the result
      raise(code("sql", 0, 0, 292, ["SELECT c.city, SUM(o.amount)", "FROM orders o", "JOIN customers c", "  ON o.customer = c.id", "WHERE o.channel = 'web'", "GROUP BY c.city"], { keywords: ["SELECT", "FROM", "JOIN", "ON", "WHERE", "GROUP", "BY", "SUM"], title: "Finance asks", sub: "web sales by city", group: "q" }), [166, 504], 16),
      line("qpath", [G.p(C, 13.5), ENGINE, G.p(13.5, C)], { group: "q" }),
      stop("q-in", ...G.p(C, 12.3), undefined, undefined, { group: "q" }),
      stop("q-out", ...G.p(12.3, C), undefined, undefined, { group: "q" }),
      raise(table("result", 0, 0, 180, ["city", "sum"], [["Tromsø", "1248"], ["Oslo", "1290"]], { at: [12, 108], rowH: 24, title: "Result", group: "q" }), [806, 500], 20),

      // 5. the plan the engine chose, with the join strategies it passed over
      ...treeOf("plan", [480, 92], { label: "Aggregate", sub: "sum by city", kids: [{ label: "Hash join", hot: true, kids: [{ label: "Scan", sub: "orders" }, { label: "Scan", sub: "customers" }] }] }, { dx: 130, dy: 54, group: "plan" }),
      node("alt-nl", 362, 146, "Nested loop", { shape: "box", mute: true, group: "plan" }),
      node("alt-mj", 598, 146, "Merge join", { shape: "box", mute: true, group: "plan" }),

      // 6. the controls that attach to the query
      raise(list("audit", 0, 0, 236, ["finance SELECT orders", "finance SELECT customers"], { title: "Audit log", sub: "per statement and table", mono: true, group: "gov" }), WIDE, 30),
      pill("grant", [480, 486], "GRANT SELECT", { glyph: "key", sub: "to finance", mono: true, group: "gov" }),
      pill("nogrant", [180, 16], "email: not granted", { glyph: "lock", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "wide", label: "One table", kind: "problem", title: "One wide table repeats the customer",
      caption: "Every order row carries the customer's email and city. When a customer moves, Support updates one row and the older rows still say Bergen.",
      show: ["wide"], counters: ["on every order", "possible", "none yet", "none yet"],
      rides: [ride("upd", 0, "u-row", "city = Tromsø")],
      body: ["A table that repeats a fact can disagree with itself. Web sales by city now depend on which row is read.",
        "Codd's 1970 paper presents the relational view as a sound basis for treating the derivability, redundancy and consistency of relations."],
      claims: ["the-relational-model-and-sql-relation"],
    }),
    step({
      id: "keys", label: "Keys", kind: "idea", title: "Each fact is stored once, under a key",
      caption: "Customers get their own table. A primary key identifies each row, so the new city is written in exactly one place.",
      show: ["c2", "o2", "e-db", "rails"], counters: ["once", "possible", "none yet", "none yet"],
      rides: [ride("rc", "s-eng", "s-cust", "city = Tromsø")],
      body: ["A relation is a set of tuples: a table of rows with no meaning in their order. A primary key is the column, or combination of columns, whose values uniquely identify each row.",
        "In PostgreSQL a primary key constraint requires the values to be both unique and not null.",
        { callout: { label: "Key idea", text: "Rows are found by their values, never by their position in a file." } }],
      claims: ["the-relational-model-and-sql-relation", "the-relational-model-and-sql-primary-key"],
    }),
    step({
      id: "reference", label: "Foreign key", kind: "mechanism", title: "A foreign key must match an existing row",
      caption: "Each order names its customer by key. Checkout sends an order for customer 9. No such row exists, so the database raises an error.",
      show: ["c3", "o3", "e-db", "rails", "fk", "ins"], counters: ["once", "rejected", "none yet", "none yet"],
      rides: [ride("ro", "s-eng", "s-ord", "4473, cust 9", { tone: "alert" })],
      body: ["A foreign key constraint specifies that the values in a column must match the values appearing in some row of another table. This maintains referential integrity between the two tables.",
        "A check constraint requires a column value to satisfy a Boolean expression, such as an amount above zero. When a write would violate a constraint, an error is raised."],
      claims: ["the-relational-model-and-sql-foreign-key", "the-relational-model-and-sql-constraints"],
    }),
    step({
      id: "query", label: "Query", kind: "idea", title: "A query states the result, not the route",
      caption: "Finance asks for web sales by city. The join pairs each order with its customer where the keys match. The statement names no file, index or loop.",
      show: ["cq", "oq", "e-plan", "rails", "fk", "q"], counters: ["once", "rejected", "states the result", "hidden"],
      rides: [ride("qpath", "q-in", "q-out", "SELECT …", { via: ["s-eng"], then: "2 rows" })],
      body: ["Join queries access several tables at once. They combine rows from one table with rows from a second, with an expression that specifies which rows are paired.",
        "Codd's requirement was that users be protected from having to know how the data is organised in the machine."],
      claims: ["the-relational-model-and-sql-join", "the-relational-model-and-sql-independence"],
    }),
    step({
      id: "plan", label: "Plan", kind: "mechanism", title: "The engine chooses how to run it",
      caption: "The planner weighs plans that return the same rows and picks the one it expects to run fastest, here a hash join. EXPLAIN shows the choice.",
      show: ["cq", "oq", "e-plan", "rails", "q", "plan"], counters: ["once", "rejected", "states the result", "hash join, chosen by the engine"],
      rides: [ride("ro", "s-ord", "s-o2", "3 web orders"), ride("rc", "s-cust", "s-c2", "3 customers")],
      body: ["A given SQL query can be executed in a wide variety of ways, each of which produces the same set of results. The PostgreSQL planner examines the possible plans and selects the one expected to run fastest.",
        "It has three join strategies: nested loop, merge join and hash join. A query plan is a tree of plan nodes with scan nodes at the bottom, and EXPLAIN prints it."],
      claims: ["the-relational-model-and-sql-planner", "the-relational-model-and-sql-strategies", "the-relational-model-and-sql-explain"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "SQL across engines, with controls on the query",
      caption: "",
      show: ["cq", "oq", "e-any", "rails", "fk", "q", "gov"], counters: ["once", "rejected", "granted and logged", "hash join, chosen by the engine"],
      rides: [ride("qpath", "q-in", "q-out", "finance", { via: ["s-eng"], then: "2 rows" })],
      body: [{ pair: {
        left: { label: "Same language", items: ["PostgreSQL", "BigQuery", "Trino and Spark SQL on lakehouse tables"] },
        right: { label: "Controls", items: ["GRANT per table and column", "Row security policies", "Audit log of statements"] },
      } },
        "The standard is ISO/IEC 9075, last revised as SQL:2023. The PostgreSQL documentation notes that no current database management system claims full conformance to Core SQL:2023, so dialects differ.",
        "Trino executes ANSI-compatible SQL and has connectors for Delta Lake, Hive, Hudi and Iceberg. Spark SQL uses an ANSI compliant dialect by default. Google describes GoogleSQL, the BigQuery dialect, as ANSI-compliant.",
        "In PostgreSQL the SELECT privilege covers a whole table or specific columns, and row security policies restrict which rows a query returns for each user. The pgAudit extension logs the statements that affect a relation."],
      claims: ["the-relational-model-and-sql-standard", "the-relational-model-and-sql-engines", "the-relational-model-and-sql-spark", "the-relational-model-and-sql-bigquery", "the-relational-model-and-sql-grant", "the-relational-model-and-sql-row-security", "the-relational-model-and-sql-audit"],
    }),
  ],
  governance: { text: "Primary key, foreign key and check constraints make the database reject a write that breaks a rule. Privileges are granted per table and per column, row security policies limit the rows each user's query returns, and audit logging records the statements that touch a table.", claims: ["the-relational-model-and-sql-constraints", "the-relational-model-and-sql-grant", "the-relational-model-and-sql-row-security", "the-relational-model-and-sql-audit"] },
  closing: {
    pitfalls: [
      "Repeating a fact in several tables and trusting every writer to update all the copies.",
      "Leaving out foreign keys, so orders can point at customers that do not exist.",
      "Assuming a statement runs unchanged on every engine. Dialects differ beyond the standard core.",
    ],
    questions: [
      "What does a primary key guarantee about the rows of a table?",
      "What happens when an order names a customer that is not in the customers table?",
      "Who decides whether the join runs as a hash join or a nested loop?",
    ],
  },
});
