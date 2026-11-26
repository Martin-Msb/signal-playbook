import { blocks, CANVAS, code, defineGuide, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt, Row } from "@signal-path/engine";

// The floor: the business as four entities on one zigzag rail, Customer, Order, Order line and Product, one colour each.
// The first stop shows the same business as one sheet: a card and its values as blocks, coloured by the entity each value belongs to.
// From the third stop each entity carries a card: first attributes and keys, then the same card in third normal form, then column types.
const G = isoGrid(340, 135, 30);
type Key = "cust" | "ord" | "line" | "prod";
const ENT: Record<Key, { at: [number, number]; hue: Hue; glyph: string; name: string; owner: string }> = {
  cust: { at: [0, 8], hue: "rose", glyph: "mail", name: "Customer", owner: "Support" },
  ord: { at: [8, 8], hue: "sand", glyph: "doc", name: "Order", owner: "Finance" },
  line: { at: [8, 0], hue: "sky", glyph: "lines", name: "Order line", owner: "Finance" },
  prod: { at: [16, 0], hue: "mint", glyph: "stack", name: "Product", owner: "Operations" },
};
const KEYS = Object.keys(ENT) as Key[];
const entity = (k: Key, group: string, sub?: string): El => {
  const e = ENT[k];
  return prism(`${k}-${group}`, e.at[0] - 0.8, e.at[1] - 0.8, 1.6, 1.6, 30, { hue: e.hue, glyph: e.glyph, title: e.name, sub, at: "s", group });
};
/** The card of one entity, standing on its block. */
const card = (k: Key, group: string, title: string, cols: [string, string], rows: Row[]): El =>
  raise(table(`${k}-card-${group}`, 0, 0, 170, cols, rows, { at: [10, 104], rowH: 22, title, mono: true, group }), G.p(...ENT[k].at), 105);
const gone = (cells: string[]): Row => ({ cells, strike: true });
const added = (cells: string[]): Row => ({ cells, hot: true });
const A: [string, string] = ["attribute", "key"], T: [string, string] = ["column", "type"];
const level = (group: string, text: string, sub: string): El => pill(`level-${group}`, [340, 62], text, { glyph: "layers", sub, group });

// 1. the sheet: three rows of six values, coloured by the entity the value is a fact about
const SHEET_HUES: Hue[] = ["sand", "rose", "rose", "mint", "mint", "sky"];
const sheetBlocks: El[] = [0, 1, 2].flatMap((r) => SHEET_HUES.map((hue, c) =>
  blocks(`v-${r}-${c}`, 7.2 + c * 1.3, 4.6 + r * 1.6, 1, 1.2, [r === 2 && c === 4 ? { h: 20, hot: true } : { h: 20, hue }], { group: "sheet" })));

export default defineGuide({
  id: "data-modelling", track: "data", module: "Modelling", slug: "data-modelling",
  title: "Data modelling",
  summary: "A data model names the entities of a business, the relationships between them and the keys that identify them. Normalisation then stores each fact once, under the key it describes.",
  forLeads: "The model is where the business agrees what a customer, an order and a product are. Each entity gets one definition and one accountable owner before any table is built.",
  status: "draft", minutes: 7,
  counters: ["Entities", "Model", "Product name stored", "Definitions owned"],
  whatIf: { label: "What if everything stayed in one sheet?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, customers, products and owners are illustrative",
    label: "First, one sales sheet holds a row per product sold and repeats the customer and the product name on every row, so one product ends up with two names. Then the business stands on the floor as three entities joined by a rail: Customer, Order and Product. A fourth entity, Order line, appears between Order and Product, and each entity carries a card of attributes and keys. The city attribute moves from Order to Customer and the name attribute from Order line to Product. The cards then show PostgreSQL table names and column types beside the statement that creates one table. At the last stop a glossary lists one definition and one owner per entity.",
    els: [
      // 1. one sheet, and a rename that reaches one row
      raise(table("sheet", 0, 0, 452, ["order", "email", "city", "product", "name", "qty"], [
        ["4468", "a.k@…", "Oslo", "SOFA-2210", "Nord sofa", "1"], ["4468", "a.k@…", "Oslo", "LAMP-0412", "Arc lamp", "2"],
        { cells: ["4469", "m.l@…", "Bergen", "SOFA-2210", "Sofa Nord", "1"], hot: true },
      ], { at: [12, 66, 132, 202, 300, 404], rowH: 24, title: "sales sheet", sub: "one row per product sold", group: "sheet" }), [480, 250], 30),
      ...sheetBlocks,
      prism("ops", 2.4, 11.4, 1.6, 1.6, 30, { glyph: "wrench", title: "Operations", sub: "renames the sofa", at: "n", group: "sheet" }),
      line("upd", [G.p(3.2, 12.2), G.p(11.6, 12.2)], { group: "sheet" }),
      stop("u-ops", ...G.p(6.6, 12.2), undefined, undefined, { group: "sheet" }),
      stop("u-row", ...G.p(11.6, 12.2), undefined, undefined, { group: "sheet" }),
      prism("fin", 17.4, 1.6, 1.6, 1.6, 30, { glyph: "chart", title: "Finance", sub: "reads two names", at: "s", group: "sheet" }),
      pill("two", [800, 330], "one product, two names", { tone: "alert", group: "sheet" }),

      // 2 to 6. the entities and the rail of relationships between them
      line("rel", [G.p(0, 8), G.p(8, 8), G.p(8, 0), G.p(16, 0)], { group: "model" }),
      ...KEYS.filter((k) => k !== "line").map((k) => entity(k, "ents")),
      entity("line", "four"),
      ...KEYS.map((k) => entity(k, "owned", `owner: ${ENT[k].owner}`)),
      stop("a1", ...G.p(2.6, 8), undefined, undefined, { group: "model" }),
      stop("a2", ...G.p(5.4, 8), undefined, undefined, { group: "model" }),
      stop("b1", ...G.p(8, 5), undefined, undefined, { group: "model" }),
      stop("b2", ...G.p(8, 2.8), undefined, undefined, { group: "model" }),
      stop("c1", ...G.p(10.8, 0), undefined, undefined, { group: "model" }),
      stop("c2", ...G.p(12.8, 0), undefined, undefined, { group: "model" }),
      pill("r-places", [176, 372], "one to many", { sub: "a customer places orders", group: "concept" }),
      pill("r-contains", [580, 208], "many to many", { sub: "an order contains products", group: "concept" }),
      level("c", "Conceptual model", "entities, relationships"),
      level("l", "Logical model", "attributes and keys"),
      level("n", "Logical model", "third normal form"),
      level("p", "Physical model", "PostgreSQL"),

      // 3. the logical model as first drawn: city sits on Order, name on Order line
      card("cust", "draft", "Customer", A, [["id", "PK"], ["email", ""]]),
      card("ord", "draft", "Order", A, [["order", "PK"], ["customer", "FK"], ["channel", ""], added(["city", ""])]),
      card("line", "draft", "Order line", A, [["order", "PK FK"], ["product", "PK FK"], ["qty", ""], added(["name", ""])]),
      card("prod", "draft", "Product", A, [["code", "PK"], ["price", ""]]),

      // 4. third normal form: each fact under the key it describes
      card("cust", "nf", "Customer", A, [["id", "PK"], ["email", ""], added(["city", ""])]),
      card("ord", "nf", "Order", A, [["order", "PK"], ["customer", "FK"], ["channel", ""], gone(["city", ""])]),
      card("line", "nf", "Order line", A, [["order", "PK FK"], ["product", "PK FK"], ["qty", ""], gone(["name", ""])]),
      card("prod", "nf", "Product", A, [["code", "PK"], ["price", ""], added(["name", ""])]),

      // 5 and 6. the physical model: table names and column types of one database
      card("cust", "phys", "customers", T, [["id", "bigint"], ["email", "text"], ["city", "text"]]),
      card("ord", "phys", "orders", T, [["order_id", "bigint"], ["customer_id", "bigint"], ["channel", "text"]]),
      card("line", "phys", "order_lines", T, [["order_id", "bigint"], ["product_code", "text"], ["qty", "int"]]),
      card("prod", "phys", "products", T, [["code", "text"], ["name", "text"], ["price", "numeric"]]),
      raise(code("ddl", 0, 0, 344, ["CREATE TABLE order_lines (", "  order_id bigint REFERENCES orders,", "  product_code text REFERENCES products,", "  qty int,", "  PRIMARY KEY (order_id, product_code));", "CREATE INDEX ON order_lines (product_code);"], { keywords: ["CREATE", "TABLE", "REFERENCES", "PRIMARY", "KEY", "INDEX", "ON"], title: "Generated DDL", group: "ddl" }), [580, 534], 14),

      // 6. one definition and one owner per entity
      raise(table("glossary", 0, 0, 356, ["term", "definition", "owner"], [["Customer", "holds an account", "Support"], ["Order", "a paid basket", "Finance"], ["Order line", "product in an order", "Finance"], ["Product", "an item on sale", "Operations"]], { at: [12, 102, 262], rowH: 22, title: "Glossary", sub: "one definition, one owner", group: "gov" }), [580, 534], 14),
    ],
  },
  steps: [
    step({
      id: "sheet", label: "One sheet", kind: "problem", title: "One sheet repeats facts until they disagree",
      caption: "Sales live in one sheet. Every row repeats the customer and the product. Operations renames the sofa on one row, and SOFA-2210 now has two names.",
      show: ["sheet"], counters: ["hidden in one sheet", "none", "on every row", "none"],
      rides: [ride("upd", "u-ops", "u-row", "Sofa Nord")],
      body: ["The colours show whose fact each value is: the order, the customer, the product, and the line that joins an order to a product. The sheet mixes four kinds of thing in one row.",
        "Kent's 1983 guide to the normal forms describes the same fault with a warehouse address repeated in every record for a part stored there. If the address changes, every such record must be updated, and because of the redundancy the data might become inconsistent."],
      claims: ["data-modelling-redundancy"],
    }),
    step({
      id: "entities", label: "Entities", kind: "idea", title: "A conceptual model names entities and relationships",
      caption: "The business records three things: customers, orders and products. A customer places orders, and an order contains products. No columns and no database yet.",
      show: ["model", "ents", "concept", "level-c"], counters: ["3 named", "conceptual", "not placed yet", "none"],
      rides: [ride("rel", "a1", "c2", "places", { via: ["b1"], then: "contains" })],
      body: ["A conceptual data model helps analyse the conceptual structure of an information system. It identifies the principal entities to be represented, their attributes and the relationships between them, and it is more abstract than a logical or physical data model.",
        { callout: { label: "Key idea", text: "An entity is a thing the business keeps facts about. A relationship says how many of one thing can belong to another." } }],
      claims: ["data-modelling-conceptual"],
    }),
    step({
      id: "keys", label: "Keys", kind: "mechanism", title: "The logical model adds attributes and keys",
      caption: "Each entity gets attributes and a primary key. Foreign keys carry the relationships. Order line holds one row per product on an order, keyed by both.",
      show: ["model", "ents", "four", "draft", "level-l"], counters: ["4 with keys", "logical", "on every order line", "none"],
      rides: [ride("rel", "a1", "a2", "id"), ride("rel", "b1", "b2", "order"), ride("rel", "c2", "c1", "code")],
      body: ["A logical data model is not specific to a database. It describes the things an organisation wants to collect data about and the relationships among them, with entities, attributes, relationships and unique identifiers. Entity identifiers migrate along the relationships, which is how a foreign key arrives in a table.",
        "A table can have more than one foreign key constraint, and this is how a many-to-many relationship is implemented. The PostgreSQL documentation uses the same case: one order contains many products through an order items table whose primary key spans both foreign keys.",
        "This first draft still places city on Order and name on Order line, as the sheet did."],
      claims: ["data-modelling-logical", "data-modelling-keys", "data-modelling-many-to-many"],
    }),
    step({
      id: "normalise", label: "Normalise", kind: "mechanism", title: "Third normal form stores each fact under its key",
      caption: "City is a fact about the customer, and name is a fact about the product. Each moves to the table whose key it describes and is stored once.",
      show: ["model", "ents", "four", "nf", "level-n"], counters: ["4 with keys", "logical, third normal form", "once, on Product", "none"],
      rides: [ride("rel", "a2", "a1", "city"), ride("rel", "c1", "c2", "name")],
      body: ["Second normal form is violated when a non-key field is a fact about a subset of a key. The key of Order line is order and product together, and name is a fact about the product alone.",
        "Third normal form is violated when a non-key field is a fact about another non-key field. On Order, city is a fact about the customer, which is itself a non-key field of the order.",
        { callout: { label: "Key idea", text: "A non-key field must provide a fact about the key, the whole key, and nothing but the key." } },
        "The normalisation rules are designed to prevent update anomalies and data inconsistencies."],
      claims: ["data-modelling-2nf", "data-modelling-3nf", "data-modelling-key-rule", "data-modelling-purpose"],
    }),
    step({
      id: "physical", label: "Physical", kind: "mechanism", title: "The physical model fits one database",
      caption: "The normalised entities become PostgreSQL tables with column types, constraints and an index. The DDL that creates them is generated from the model.",
      show: ["model", "ents", "four", "phys", "ddl", "level-p"], counters: ["4 tables", "physical", "once, in products", "none"],
      rides: [ride("rel", "a1", "c1", "id 1", { via: ["b1"], then: "4470" })],
      body: ["A physical data model is database-specific and represents relational data objects such as tables, columns, primary and foreign keys. In a modelling tool such as IBM InfoSphere Data Architect, a logical model is transformed into a physical one, storage objects, indexes and views are added as needed, and the DDL is generated.",
        "Normalisation has a cost that is settled here. The rules tend to penalise retrieval, because data that one unnormalised record held may have to be read from several normalised records."],
      claims: ["data-modelling-physical", "data-modelling-purpose"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Three model levels and one set of definitions",
      caption: "",
      show: ["model", "owned", "phys", "gov", "level-p"], counters: ["4 tables", "physical", "once, in products", "4 terms, 4 owners"],
      body: [{ pair: {
        left: { label: "Model levels", items: ["Conceptual: entities, relationships", "Logical: attributes, keys, third normal form", "Physical: tables, types, indexes"] },
        right: { label: "Assigned in the model", items: ["A glossary term per entity", "A data owner per entity"] },
      } },
        "In the UK government's data ownership model, a data owner is a senior individual who works with business requirements to define centralised data definitions for a subject area. Data stewards maintain the documentation, for example a business glossary. The model calls for an enterprise data model with data ownership agreed at the conceptual layer.",
        "A catalogue carries the definitions to the tables. In DataHub a glossary term is a word or phrase with a specific business definition, it can be attached to data assets, and it can have owners. In PostgreSQL, COMMENT stores one comment string on a table or a column."],
      claims: ["data-modelling-conceptual", "data-modelling-logical", "data-modelling-physical", "data-modelling-owner", "data-modelling-ownership-layer", "data-modelling-glossary", "data-modelling-comment"],
    }),
  ],
  governance: { text: "Each entity in the model has one glossary definition and one accountable data owner. The UK government's data ownership model agrees ownership at the conceptual data model layer, and a catalogue such as DataHub attaches the glossary terms to the tables built from the model.", claims: ["data-modelling-owner", "data-modelling-ownership-layer", "data-modelling-glossary"] },
  closing: {
    pitfalls: [
      "Starting from tables and column types, so the entities and their definitions are never agreed.",
      "Leaving a fact about one entity on another entity's table, where every copy must be updated together.",
      "Treating the glossary as documentation written afterwards, with no owner named for any term.",
    ],
    questions: [
      "What does the logical model add to the conceptual model, and the physical model to the logical one?",
      "Why does name belong on Product and not on Order line?",
      "Who decides what the term Customer means at Vinterhus?",
    ],
  },
});
