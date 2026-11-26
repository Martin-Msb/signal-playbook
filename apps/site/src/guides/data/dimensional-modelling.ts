import { blocks, CANVAS, code, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor: the sales table lies in the centre, one row of blocks per order line and one block per column.
// The height of the last block in a row is the amount. Context columns stand in the row at first, then move out
// along the rails to three dimension tables, leaving a low key behind: the star. A second fact table, returns,
// later stands at the back and shares the product and date dimensions. Each block is its own element.
const G = isoGrid(480, 338, 30);
const SIZE = 1.1, PITCH = 1.3, HALF = SIZE / 2, ARM = 8;
const COLS: { k: string; hue: Hue }[] = [{ k: "product", hue: "sand" }, { k: "customer", hue: "rose" }, { k: "date", hue: "violet" }, { k: "order", hue: "paper" }, { k: "amount", hue: "sky" }];
const cx = (f: number) => (f - 2) * PITCH - HALF, cy = (k: number) => (k - 1) * PITCH - HALF;
const one = (id: string, gx: number, gy: number, group: string, item: { h: number; hue?: Hue; hot?: boolean }): El => blocks(id, gx, gy, 1, SIZE, [item], { group });
/** The context columns of the three rows: tall while they hold values, low once they hold only a key. */
const context = (group: string, h: number): El[] =>
  [0, 1, 2].flatMap((k) => [0, 1, 2].map((f) => one(`${group}-${k}-${f}`, cx(f), cy(k), group, { h, hue: COLS[f].hue })));
/** The amount column: one block per row, as tall as the amount. */
const amounts = (group: string, hs: number[], hot?: number): El[] =>
  hs.map((h, k) => one(`${group}-${k}`, cx(4), cy(k), group, k === hot ? { h, hot: true } : { h, hue: "sky" }));
/** One member of a dimension table. Each member is its own block, so a record can rest on the rail beside the table. */
const member = (dimId: string, i: number, gx: number, gy: number, hue: Hue, hot = false): El =>
  one(`${dimId}-${i}${hot ? "h" : ""}`, gx, gy, `${dimId}-${i}${hot ? "h" : ""}`, hot ? { h: 22, hot: true } : { h: 22, hue });
const TL: Pt = [116, 188], TR: Pt = [838, 188];
const rows = (id: string, title: string, sub: string, r: [string, string, string][], hot: number, foot: string): El =>
  raise(table(id, 0, 0, 224, ["order", "product", "amount"], r.map((cells, i) => ({ cells, hot: i === hot })), { at: [12, 70, 168], rowH: 24, title, sub, mono: true, foot, group: id }), TL, 30);
const product = (id: string, sub: string, at: Pt): El =>
  raise(table(id, 0, 0, 220, ["key", "code", "category"], [["17", "SOFA-2210", "Sofas"], ["18", "LAMP-0418", "Lamps"], ["19", "RUG-1034", "Rugs"]],
    { at: [12, 50, 144], rowH: 24, title: "dim_product", sub, mono: true, group: id }), at, 30);
const P = ["p-0", "p-1", "p-2"], D = ["d-0", "d-1", "d-2"], C = ["c-0", "c-1", "c-2"];

export default defineGuide({
  id: "dimensional-modelling", track: "data", module: "Modelling", slug: "dimensional-modelling",
  title: "Dimensional modelling",
  summary: "An analytical model declares what one row of a fact table is, keeps the measurements there and moves their context to dimension tables. A question then filters and groups by dimension and sums facts that are safe to add.",
  forLeads: "Two reports disagree when their tables count different things or describe a product differently. A declared grain and shared dimensions remove both causes before any dashboard is built.",
  status: "draft", minutes: 7,
  counters: ["Grain", "Tables", "Revenue reported", "Definitions of product"],
  whatIf: { label: "What if the grain were never declared?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, keys and amounts are illustrative",
    label: "The sales table lies in the centre of the floor as rows of blocks, one row per order line, and the last block of each row is as tall as its amount. At first the order amount stands on two rows of the same order and Finance receives a total that is too high. Once the grain is declared each row carries its own line amount. Then the product, customer and date blocks shrink to keys and three dimension tables stand at the ends of rails around the fact table, forming a star. A category travels from the product dimension to the facts and a sum travels on to Finance. A returns fact table then stands at the back, joined to the same product and date dimensions. At the last stop a Data Vault card and a wide table card stand beside the star.",
    els: [
      // the centre table: the order column and the path to Finance never change
      ...[0, 1, 2].map((k) => one(`ord-${k}`, cx(3), cy(k), "ord", { h: 12, hue: "paper" })),
      line("a-fin", [G.p(3.7, 0), G.p(8.6, 0)], { always: true }),
      stop("s-out", ...G.p(4.5, 0), undefined, undefined, { always: true }),
      stop("s-fin", ...G.p(6.2, 0), undefined, undefined, { always: true }),
      prism("fin", 8.6, -0.7, 1.4, 1.4, 30, { glyph: "chart", title: "Finance", sub: "revenue", at: "e", always: true }),

      // 1 and 2. one table holding values and context together, loaded from the orders database
      ...context("wide", 18),
      ...amounts("amt-mixed", [40, 40, 11], 1),
      ...amounts("amt-line", [31, 10, 11]),
      prism("src", -ARM - 1.2, -0.7, 1.4, 1.4, 30, { hue: "paper", glyph: "table", title: "Orders database", sub: "orders and lines", at: "sw", group: "src" }),
      line("a-src", [G.p(-ARM + 0.2, 0), G.p(-3.7, 0)], { group: "src" }),
      stop("s-src", ...G.p(-7, 0), undefined, undefined, { group: "src" }),
      stop("s-load", ...G.p(-5.4, 0), undefined, undefined, { group: "src" }),
      pill("t-mixed", [480, 456], "Orders report", { sub: "orders and lines mixed", glyph: "table", group: "mixed" }),
      pill("t-grain", [480, 456], "Order lines", { sub: "grain: one order line", glyph: "table", tone: "track", group: "grain" }),
      rows("c-mixed", "orders_report", "two grains", [["4470", "SOFA-2210", "1290"], ["4470", "LAMP-0418", "1290"], ["4471", "RUG-1034", "349"]], 1, "sum 2929"),
      rows("c-grain", "order_lines", "one grain", [["4470", "SOFA-2210", "990"], ["4470", "LAMP-0418", "300"], ["4471", "RUG-1034", "349"]], -1, "sum 1639"),
      raise(list("c-truth", 0, 0, 216, [{ t: "report: 2929 kr", tone: "alert" }, "orders: 1639 kr"], { title: "November revenue", sub: "two answers", mono: true, group: "mixed" }), TR, 30),
      raise(list("c-decl", 0, 0, 216, ["one row per order line", "amount: line amount"], { title: "Grain", sub: "declared first", group: "grain" }), TR, 30),

      // 3 to 6. the star: keys stay in the fact table, context stands in three dimension tables
      ...context("keys", 5),
      ...amounts("amt-sofa", [31, 10, 11], 0),
      ...amounts("amt-lamp", [31, 10, 11], 1),
      pill("t-fact", [480, 456], "Sales facts", { sub: "one row per order line", glyph: "table", tone: "track", group: "star" }),
      line("a-prod", [G.p(-3.7, 0), G.p(-ARM + 1.1, 0)], { group: "star" }),
      stop("s-far", ...G.p(-6.3, 0), undefined, undefined, { group: "star" }),
      stop("s-p", ...G.p(-4.95, 0), undefined, undefined, { group: "star" }),
      line("a-date", [G.p(0, -2.4), G.p(0, -ARM + 1.1)], { group: "star" }),
      stop("s-din", ...G.p(0, -3.2), undefined, undefined, { group: "star" }),
      stop("s-d", ...G.p(0, -5.2), undefined, undefined, { group: "star" }),
      line("a-cust", [G.p(0, 2.4), G.p(0, ARM - 1.1)], { group: "star" }),
      stop("s-cin", ...G.p(0, 3.2), undefined, undefined, { group: "star" }),
      stop("s-c", ...G.p(0, 5.2), undefined, undefined, { group: "star" }),
      ...[0, 1, 2].flatMap((i) => [member("p", i, -ARM - HALF, cy(i), "sand"), member("d", i, cy(i), -ARM - HALF, "violet"), member("c", i, cy(i), ARM - HALF, "rose")]),
      member("p", 0, -ARM - HALF, cy(0), "sand", true), member("p", 1, -ARM - HALF, cy(1), "sand", true),
      pill("p-l", [158, 268], "Product", { sub: "dimension", anchor: "end", group: "dims" }),
      pill("d-l", [802, 268], "Date", { sub: "dimension", anchor: "start", group: "dims" }),
      pill("p-conf", [158, 268], "Product", { sub: "conformed", glyph: "check", tone: "track", anchor: "end", group: "conf" }),
      pill("d-conf", [802, 268], "Date", { sub: "conformed", glyph: "check", tone: "track", anchor: "start", group: "conf" }),
      pill("c-l", [156, 436], "Customer", { sub: "dimension", anchor: "end", group: "star" }),

      // 3. what the two kinds of table hold
      raise(table("c-fact", 0, 0, 236, ["product", "cust", "date", "amount"], [["17", "52", "20261124", "990"], ["18", "52", "20261124", "300"], ["19", "61", "20261124", "349"]],
        { at: [12, 68, 106, 180], rowH: 24, title: "fact_sales", sub: "keys and a measure", mono: true, group: "c-fact" }), [122, 188], 30),
      product("c-prod", "context", TR),

      // 4. a question against the star
      raise(code("c-sql", 0, 0, 232, ["SELECT category, SUM(amount)", "FROM fact_sales", "JOIN dim_product", "  USING (product_key)", "GROUP BY category"],
        { title: "Revenue by category", keywords: ["SELECT", "SUM", "FROM", "JOIN", "USING", "GROUP", "BY"], group: "c-sql" }), [122, 188], 30),
      raise(table("c-res", 0, 0, 216, ["category", "revenue"], [{ cells: ["Sofas", "990"], hot: true }, ["Lamps", "300"], ["Rugs", "349"]],
        { at: [12, 130], rowH: 24, title: "Result", sub: "sums to 1639", mono: true, group: "c-res" }), TR, 30),

      // 5 and 6. a second fact table at its own grain, on the same dimensions
      ...[0, 1].flatMap((k) => [one(`ret-${k}-p`, -ARM - PITCH - HALF, -ARM + (k - 0.5) * PITCH - HALF, "ret", { h: 5, hue: "sand" }),
        one(`ret-${k}-d`, -ARM - HALF, -ARM + (k - 0.5) * PITCH - HALF, "ret", { h: 5, hue: "violet" }),
        one(`ret-${k}-a`, -ARM + PITCH - HALF, -ARM + (k - 0.5) * PITCH - HALF, "ret", k === 1 ? { h: 10, hot: true } : { h: 6, hue: "sky" })]),
      pill("t-ret", [381, 56], "Returns facts", { sub: "one row per return", glyph: "table", tone: "track", anchor: "end", group: "ret" }),
      line("l-rp", [G.p(-ARM, -ARM + 1.6), G.p(-ARM, -2.4)], { group: "ret" }),
      stop("s-r", ...G.p(-ARM, -4.5), undefined, undefined, { group: "ret" }),
      stop("s-rp", ...G.p(-ARM, -3.2), undefined, undefined, { group: "ret" }),
      line("l-rd", [G.p(-ARM + 2.3, -ARM), G.p(-2.4, -ARM)], { group: "ret" }),
      product("c-one", "one definition", TL),
      raise(table("c-across", 0, 0, 228, ["category", "sold", "returned"], [["Sofas", "990", "0"], { cells: ["Lamps", "300", "300"], hot: true }, ["Rugs", "349", "0"]],
        { at: [12, 100, 152], rowH: 24, title: "One report", sub: "two fact tables", mono: true, group: "c-across" }), TR, 30),

      // 6. the neighbouring shapes
      raise(list("c-vault", 0, 0, 216, ["hub: business keys", "link: relationships", "satellite: context"], { title: "Data Vault", sub: "upstream", group: "c-vault" }), TL, 30),
      raise(table("c-obt", 0, 0, 224, ["order", "category", "amount"], [["4470", "Sofas", "990"], ["4470", "Lamps", "300"], ["4471", "Rugs", "349"]],
        { at: [12, 76, 168], rowH: 24, title: "Wide table", sub: "the star, joined", mono: true, group: "c-obt" }), TR, 30),
    ],
  },
  steps: [
    step({
      id: "mixed", label: "Two grains", kind: "problem", title: "A table at two grains counts an order twice",
      caption: "The report table has one row per order line and repeats the order amount on each. Summing the column counts order 4470 twice.",
      show: ["ord", "wide", "amt-mixed", "mixed", "c-mixed", "src"], counters: ["mixed", "1 report table", "2929 kr", "per report"],
      rides: [ride("a-src", "s-src", "s-load", "4470: 1290"), ride("a-fin", "s-out", "s-fin", "2929 kr", { tone: "alert" })],
      body: ["The table was built by joining orders to their lines. When an orders table is joined to its order items, each order total is repeated once per item, and a sum over the joined rows counts it more than once.",
        "Kimball describes the same fault in a fact table: rows that stand for different measurement events are not comparable, and without a constraint in the query the values are double counted. End-user tools should not be relied on to repair it."],
      claims: ["dimensional-modelling-fanout", "dimensional-modelling-mixed-grain"],
    }),
    step({
      id: "grain", label: "Grain", kind: "idea", title: "The grain states what one row is",
      caption: "The grain is declared first: one row per order line. Every amount is now a line amount, and the column sums to the true total.",
      show: ["ord", "wide", "amt-line", "grain", "c-grain", "src"], counters: ["one order line", "1 table", "1639 kr", "per report"],
      rides: [ride("a-src", "s-src", "s-load", "line: 990"), ride("a-fin", "s-out", "s-fin", "1639 kr")],
      body: ["The grain establishes exactly what a single fact table row represents. It is declared before dimensions or facts are chosen, because every candidate dimension or fact must be consistent with it.",
        "Atomic grain is the lowest level at which a business process captures data. Only facts consistent with the declared grain are allowed in the table, which is why the order amount gives way to the line amount.",
        { callout: { label: "Key idea", text: "Different grains must not be mixed in the same fact table." } }],
      claims: ["dimensional-modelling-grain", "dimensional-modelling-facts", "dimensional-modelling-mixed-grain"],
    }),
    step({
      id: "split", label: "Facts, context", kind: "idea", title: "Facts stay and context moves to dimensions",
      caption: "The fact table keeps the measurement and one key per dimension. Product, customer and date each get a table. Together they form a star schema.",
      show: ["ord", "keys", "amt-line", "star", "dims", ...P, ...D, ...C, "c-fact", "c-prod"], counters: ["one order line", "1 fact, 3 dimensions", "1639 kr", "1"],
      rides: [ride("a-prod", 0, "s-p", "SOFA-2210"), ride("a-date", "s-din", "s-d", "24 Nov"), ride("a-cust", "s-cin", "s-c", "m.l@…")],
      body: ["Facts are the measurements that result from a business process event and are almost always numeric. Dimensions provide the who, what, where, when, why and how around the event, and their tables hold the descriptive attributes used to filter and group the facts.",
        "A dimensional model built in a relational database is a star schema: fact tables linked to dimension tables through primary and foreign keys. The fact table forms the centre of the star and the dimension tables form its points.",
        "In Microsoft's guidance for Fabric Warehouse the dimension key in a fact row refers to a surrogate key, a single-column identifier generated and stored in the dimension table. The date key is the exception that carries meaning, an integer in YYYYMMDD form. A sales order number stays in the fact table as an attribute."],
      claims: ["dimensional-modelling-facts", "dimensional-modelling-dimensions", "dimensional-modelling-star", "dimensional-modelling-keys"],
    }),
    step({
      id: "query", label: "A question", kind: "mechanism", title: "Dimensions filter and group, facts are summed",
      caption: "Finance asks for revenue by category. The product dimension supplies the groups, the keys find the fact rows, and the amounts add up.",
      show: ["ord", "keys", "amt-sofa", "star", "dims", "p-0h", "p-1", "p-2", ...D, ...C, "c-sql", "c-res"], counters: ["one order line", "1 fact, 3 dimensions", "1639 kr", "1"],
      rides: [ride("a-prod", "s-far", "s-p", "Sofas"), ride("a-fin", "s-out", "s-fin", "Sofas 990")],
      body: ["Analytic queries summarise measures with sum, count, average and other functions, within the context of dimension filters and groupings. In Power BI terms, dimension tables enable filtering and grouping and fact tables enable summarisation.",
        "The line amount is an additive measure: it can be summed across any dimension. A balance is semi-additive, because it cannot be summed across time. A ratio or a unit price is non-additive, so the model stores its additive components and computes the ratio after summing.",
        { callout: { label: "Key idea", text: "Each fact row is one measured event, so any grouping of rows adds up to the same total." } }],
      claims: ["dimensional-modelling-summarise", "dimensional-modelling-additive", "dimensional-modelling-facts"],
    }),
    step({
      id: "conformed", label: "Conformed", kind: "mechanism", title: "A conformed dimension serves several fact tables",
      caption: "Returns get a fact table at their own grain. Both stars share the product and date dimensions, so sold and returned line up by category.",
      show: ["ord", "keys", "amt-lamp", "star", "conf", "p-0", "p-1h", "p-2", ...D, ...C, "ret", "c-one", "c-across"], counters: ["one per fact table", "2 facts, 3 dimensions", "1639 kr", "1, conformed"],
      rides: [ride("a-prod", "s-far", "s-p", "Lamps"), ride("l-rp", "s-rp", "s-r", "Lamps")],
      body: ["Dimension tables conform when attributes in separate dimension tables have the same column names and domain contents. Information from separate fact tables can then be combined in a single report, which Kimball calls drilling across.",
        "Conformed dimensions relate to many fact tables, so they are shared by several stars in one model. A date dimension is the common case.",
        "Kimball calls dimension tables the soul of the data warehouse, since they hold the entry points and descriptive labels for analysis, and notes that a disproportionate amount of effort goes into their data governance and development."],
      claims: ["dimensional-modelling-conformed", "dimensional-modelling-shared", "dimensional-modelling-dimension-care", "dimensional-modelling-mixed-grain"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What the model settles",
      caption: "",
      show: ["ord", "keys", "amt-line", "star", "conf", ...P, ...D, ...C, "ret", "c-vault", "c-obt"], counters: ["one per fact table", "2 facts, 3 dimensions", "1639 kr", "1, conformed"],
      rides: [ride("a-fin", "s-out", "s-fin", "1639 kr")],
      body: [{ pair: {
        left: { label: "Shape", items: ["Star schema: facts and shared dimensions", "Wide table: the star joined in advance"] },
        right: { label: "Hold steady", items: ["Grain, declared per table", "One definition per dimension"] },
      } },
        "A wide table, also called One Big Table, joins the fact table against all of its dimension tables. The dbt project's guide builds one when a BI tool has no semantic layer that supports relationships between tables. The grain of the wide table is still the grain of its fact table.",
        "Google's BigQuery guidance notes that star schemas are typically optimised schemas for analytics, and that performance might not be significantly different after further denormalisation.",
        "Data Vault sits upstream of the star. Linstedt defines it as a detail oriented, historical tracking and uniquely linked set of normalised tables, built for the data warehouse and not to be confused with a data mart. Hubs carry a unique list of business keys, links record relationships between hubs, and satellites hold descriptive context. Databricks places it in the Silver layer, with dimensional data marts built from it in the Gold layer."],
      claims: ["dimensional-modelling-obt", "dimensional-modelling-denormalise", "dimensional-modelling-vault", "dimensional-modelling-vault-layer", "dimensional-modelling-conformed"],
    }),
  ],
  governance: { text: "Conformed dimensions keep one definition of customer or product across reports. Kimball has them defined once with the business's data governance representatives and reused across fact tables, so figures from separate fact tables combine in one report.", claims: ["dimensional-modelling-conformed"] },
  closing: {
    pitfalls: [
      "Designing a fact table around one report. Its grain then follows the report and breaks at the next question.",
      "Joining a header amount onto line rows and summing it, which counts each order once per line.",
      "Letting each team keep its own product or customer table, so two reports group the same sales differently.",
    ],
    questions: [
      "What does one row of the sales fact table represent, and where is that written down?",
      "Which columns of the orders report became facts, which became keys and which moved to a dimension?",
      "Why can sold and returned amounts appear in one report by category?",
    ],
  },
});
