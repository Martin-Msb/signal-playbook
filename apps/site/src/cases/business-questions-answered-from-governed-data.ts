import { CANVAS, blocks, code, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, table } from "@signal-path/engine";
import type { Hue } from "@signal-path/engine";

// The floor: the manager's question runs down the main rail to the assistant, on to the semantic layer and into the warehouse.
// The catalog stands behind the assistant. The warehouse is a star: a fact table with three dimensions around it.
// The access policy sits on the last stretch of rail, inside the warehouse boundary.
const G = isoGrid(88, 100, 26);
const TOP: [number, number] = [742, 236];   // the board above the main rail
const LEFT: [number, number] = [141, 420];  // the board in the front left corner

const top = (id: string, title: string, items: Parameters<typeof list>[4], extra: Record<string, unknown> = {}) =>
  raise(list(id, 0, 0, 216, items, { title, group: id, ...extra }), TOP, 20);
const left = (id: string, title: string, items: Parameters<typeof list>[4], extra: Record<string, unknown> = {}) =>
  raise(list(id, 0, 0, 216, items, { title, group: id, ...extra }), LEFT, 30);
const query = (id: string, lines: string[]) =>
  raise(code(id, 0, 0, 250, lines, { title: "Metric query", sub: "fits the schema", group: id }), LEFT, 30);
const fact = (id: string, hues: (i: number) => Hue, hot = 0) =>
  blocks(id, 23, -1.3, 4, 0.56, Array.from({ length: 16 }, (_, i) => ({ h: i < hot ? 14 : 9, hue: hues(i), hot: i < hot })), { gap: 0.12, title: "fact_sales", at: "s", group: id });

export default defineGuide({
  id: "case-business-questions-answered-from-governed-data", track: "case", module: "Use cases", slug: "business-questions-answered-from-governed-data",
  title: "Business questions answered from governed data",
  summary: "A sales question is answered by a model that never writes SQL on raw tables. It finds a governed metric, returns a metric query, and the warehouse runs it with the manager's own permissions.",
  forLeads: "The model chooses the metric and the filters. The definition belongs to Finance and access belongs to the warehouse, so a wrong or forbidden answer has nowhere to come from.",
  status: "draft", minutes: 12,
  counters: ["Query against", "Runs as", "Answer shows", "Time to answer"],
  whatIf: { label: "What if the model wrote SQL on raw tables?", step: 1, from: 6 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Stores, orders, figures and metric names are illustrative",
    label: "A store manager's question travels along a rail to an assistant, on to a semantic layer and into a warehouse drawn as a fact table with three dimensions. A catalog stands behind the assistant. Later stops add an access policy on the rail into the warehouse.",
    els: [
      pawn("mgr", 0, 0, "Store manager", undefined, { always: true }),
      line("m1", [G.p(1.5, 0), G.p(7.6, 0)], { always: true }),

      // Problem: an analyst writes the SQL by hand, then a model writes it against raw tables.
      prism("desk", 7.6, -0.65, 1.3, 1.3, 26, { hue: "paper", glyph: "user", title: "Analyst", sub: "by hand", at: "n", group: "desk" }),
      blocks("queue", 2.4, 2.3, 6, 0.62, Array.from({ length: 18 }, (_, i) => ({ h: 7, hue: i < 3 ? "track" as const : "paper" as const })), { gap: 0.3, title: "Questions waiting", sub: "3 days each", at: "s", group: "desk" }),
      line("direct", [G.p(8.9, 0), G.p(22.2, 0)], { group: "raw" }),
      drum("raw", 23.8, 0, 1.5, 34, { hue: "sky", glyph: "table", title: "Warehouse", sub: "raw tables", at: "e", group: "raw" }),
      prism("bare", 7.6, -0.65, 1.3, 1.3, 32, { hue: "track", glyph: "net", title: "Model", sub: "writes SQL", at: "n", group: "bare" }),
      raise(code("sql-bad", 0, 0, 262, ["SELECT SUM(o.total)", "FROM orders o", "JOIN order_items i", "  ON i.order_no = o.order_no", "WHERE o.store = 'Oslo'"], { keywords: ["SELECT", "SUM", "FROM", "JOIN", "ON", "WHERE"], hot: [0, 2], title: "The model writes", group: "sql-bad" }), TOP, 20),
      raise(table("fan", 0, 0, 250, ["order", "item", "total"], [["4471", "LAMP-0312", "49.00"], { cells: ["4480", "SOFA-2210", "739.00"], hot: true }, { cells: ["4480", "RUG-0718", "739.00"], hot: true }], { at: [12, 68, 176], title: "Joined rows", foot: "739.00 is summed twice", mono: true, tone: "alert", group: "fan" }), LEFT, 30),

      // Architecture.
      prism("asst", 7.6, -0.65, 1.3, 1.3, 32, { hue: "track", glyph: "net", title: "Assistant", sub: "model", at: "n", group: "asst" }),
      line("m2", [G.p(8.9, 0), G.p(14.4, 0)], { group: "sem" }),
      prism("sem", 14.4, -0.65, 1.3, 1.3, 24, { hue: "violet", glyph: "layers", title: "Semantic layer", sub: "40 metrics", at: "sw", group: "sem" }),
      line("m3", [G.p(15.7, 0), G.p(22.9, 0)], { group: "sem" }),

      prism("d-store", 23.65, -4.85, 1.3, 1.3, 14, { hue: "sky", glyph: "map", title: "dim_store", at: "n", group: "star" }),
      prism("d-date", 23.65, 3.9, 1.3, 1.3, 14, { hue: "sky", glyph: "clock", title: "dim_date", at: "w", group: "star" }),
      prism("d-prod", 26.8, -0.65, 1.3, 1.3, 14, { hue: "sky", glyph: "stack", title: "dim_product", at: "e", group: "star" }),
      line("k-store", [G.p(24.3, -3.55), G.p(24.3, -1.4)], { tone: "muted", w: 3, group: "star" }),
      line("k-date", [G.p(24.3, 1.4), G.p(24.3, 3.9)], { tone: "muted", w: 3, group: "star" }),
      line("k-prod", [G.p(25.7, 0), G.p(26.8, 0)], { tone: "muted", w: 3, group: "star" }),
      fact("fact", () => "sand"),
      fact("fact-oslo", (i) => (i < 4 ? "track" : "paper"), 4),
      top("def", "net_sales", [{ t: "sum(amount) less returns", hot: true }, "by store, week, product", "owner Finance, certified"], { mono: true }),
      raise(table("grain", 0, 0, 250, ["order", "product", "amount"], [["4471", "LAMP-0312", "49.00"], ["4480", "SOFA-2210", "640.00"], ["4480", "RUG-0718", "99.00"]], { at: [12, 68, 176], title: "fact_sales", sub: "one row per order line", mono: true, group: "grain" }), LEFT, 30),

      line("cat", [G.p(8.25, -6), G.p(8.25, -0.65)], { group: "cat" }),
      drum("catalog", 8.25, -7, 1, 30, { hue: "sand", glyph: "search", title: "Catalog", sub: "names and owners", at: "n", group: "cat" }),
      top("found", "Catalog search: sales", [{ t: "net_sales, Finance", hot: true }, "gross_sales, Finance", { t: "orders_count, Operations", mute: true }], { numbered: true, cut: 1, cutLabel: "loaded" }),
      left("ctx", "Context window", ["instructions", { t: "1 of 40 definitions", hot: true }, "the manager's question"]),

      top("rules", "Instructions", ["use listed metrics only", { t: "return a metric query", hot: true }, "ask when unclear"]),
      query("mq-sales", ["{ \"metric\": \"net_sales\",", "  \"group_by\": [\"store\"],", "  \"week\": \"2026-W47\" }"]),

      prism("acl", 20.4, -0.65, 1.3, 1.3, 14, { hue: "mint", glyph: "shield", title: "Access policy", at: "sw", group: "acl" }),
      prism("acl-deny", 20.4, -0.65, 1.3, 1.3, 14, { hue: "mint", glyph: "shield", title: "Access denied", at: "sw", state: "alert", group: "acl-deny" }),
      pill("runas", [240, 505], "runs as manager, Oslo", { glyph: "key", tone: "track", anchor: "start", group: "runas" }),
      raise(table("plan", 0, 0, 250, ["plan node", "on"], [["Aggregate", "sum(amount)"], ["Hash join", "store_key"], { cells: ["Scan fact_sales", "store = Oslo"], hot: true }, ["Scan dim_store", "all rows"]], { at: [12, 142], rowH: 22, title: "Query plan", mono: true, group: "plan" }), TOP, 20),
      left("policy", "Role store_manager", [{ t: "rows: own store", hot: true }, "column cost: no access", "every query logged"]),

      // Execution.
      top("answer", "Answer", [{ t: "Net sales, Oslo: 268,900", hot: true }, "week 47, returns removed", "net_sales, owner Finance"]),
      top("denied", "Warehouse reply", [{ t: "cost: access denied", hot: true, tone: "alert" }, "role store_manager", "no figure is returned"]),
      query("mq-margin", ["{ \"metric\": \"gross_margin\",", "  \"product\": \"SOFA-2210\",", "  \"week\": \"2026-W47\" }"]),
      top("two", "Catalog search: sales", [{ t: "net_sales, Finance", hot: true }, { t: "gross_sales, Finance", hot: true }, { t: "region north: no match", mute: true }], { numbered: true }),
      left("ask", "The assistant asks", [{ t: "Net or gross sales?", hot: true }, { t: "Which stores are north?", hot: true }, { t: "no query was run", mute: true }]),
      top("ops", "Run on every change", [{ t: "120 graded questions", hot: true }, "metric and filters checked", "refusals stay refused"]),
      raise(table("evalset", 0, 0, 250, ["question", "expected"], [["net sales Oslo", "net_sales"], ["sofa margin", "denied"], ["sales north", "asks back"]], { at: [12, 150], title: "Evaluation set", sub: "3 of 120", group: "evalset" }), LEFT, 30),
    ],
  },
  steps: [
    step({
      id: "wait", label: "Queue", kind: "problem", phase: "problem", title: "A sales question waits three days",
      caption: "A store manager asks for last week's net sales in Oslo. An analyst writes the SQL by hand. Such requests fill most of the analysts' week.",
      show: ["desk", "raw"], counters: ["raw tables, by hand", "the analyst", "a figure", "3 days"],
      rides: [ride("m1", 0, 0.45, "net sales?")],
      body: ["The question is an ordinary analytic query: a measure summed within filters and groupings. The analyst knows which tables hold it, how they join, and which returns to remove.",
        "That knowledge lives in the analyst's head and in each hand-written query."],
      claims: ["dimensional-modelling-summarise", "the-relational-model-and-sql-join"],
    }),
    step({
      id: "raw", label: "Model alone", kind: "watch-out", phase: "problem", title: "A model writing SQL on raw tables double counts",
      caption: "The model joins orders to order items and sums the order total. Each total repeats once per item. The figure is fluent, plausible and wrong.",
      show: ["bare", "raw", "sql-bad", "fan"], counters: ["raw tables", "a service account", "a wrong figure", "seconds, and wrong"],
      rides: [ride("m1", 0, 0.45, "net sales?"), ride("direct", 0, 0.5, "SQL", { then: "412,300", tone: "alert" })],
      concepts: ["hallucination-and-model-limits", "the-relational-model-and-sql"],
      body: ["When orders are joined to order items on the order number, each order total is repeated once per item, and a sum over the joined rows counts it more than once.",
        "NIST uses the term confabulation for a generative system that confidently presents false content, and describes it as a natural result of statistical prediction. The risk is that a reader believes the confident answer and acts on it.",
        { callout: { label: "The gap", text: "The SQL is valid and the engine runs it. Nothing in the raw tables says what net sales means." } }],
      claims: ["dimensional-modelling-fanout", "hallucination-and-model-limits-confabulation", "hallucination-and-model-limits-statistical", "hallucination-and-model-limits-risk", "the-relational-model-and-sql-join"],
    }),
    step({
      id: "model", label: "Definition", kind: "idea", phase: "architecture", title: "Net sales is defined once, on a star schema",
      caption: "Sales become a fact table at one declared grain, joined by key to store, date and product. The semantic layer holds one definition of net sales.",
      show: ["asst", "sem", "star", "fact", "def", "grain"], counters: ["one definition", "not yet set", "a figure", "seconds"],
      rides: [ride("m3", 0, 0.34, "net_sales")],
      concepts: ["dimensional-modelling", "analytics-and-the-semantic-layer", "the-relational-model-and-sql"],
      body: ["The grain states exactly what one fact table row represents: here, one order line. Facts consistent with that grain can be summed, and dimension tables supply the attributes used to filter and group.",
        "A fact table links to its dimensions through primary and foreign keys. A foreign key requires each value to match a row of the other table.",
        "In a semantic layer a metric is a function over simple measures and constraints, and dimensions add context to it. Some tools let named experts certify a semantic model as a trusted source."],
      claims: ["dimensional-modelling-grain", "dimensional-modelling-facts", "dimensional-modelling-dimensions", "dimensional-modelling-star", "the-relational-model-and-sql-foreign-key", "analytics-and-the-semantic-layer-metrics", "analytics-and-the-semantic-layer-certification"],
    }),
    step({
      id: "lookup", label: "Lookup", kind: "mechanism", phase: "architecture", title: "The model looks up the metric before it answers",
      caption: "The catalog lists forty governed metrics with their owners. The model searches it, picks net_sales, then loads that one definition. Nothing else enters the context.",
      show: ["asst", "sem", "star", "fact", "cat", "found", "ctx"], counters: ["one definition", "not yet set", "a figure", "seconds"],
      rides: [ride("cat", 0, 0.5, "sales?", { then: "net_sales" }), ride("m2", 0.92, 0.5, "definition")],
      concepts: ["catalogs-and-metadata", "multi-step-retrieval", "context-engineering"],
      body: ["A catalog lets people and tools find, understand and trust data assets. Glossary terms attach business meaning to assets, and a browse privilege exposes metadata without granting access to the data underneath.",
        "The lookup takes two steps, and the second depends on the first. Anthropic describes just-in-time strategies in which the model uses tools to load data into context at runtime.",
        "Recall falls as a context window fills, so one definition is loaded and thirty-nine stay out. OWASP advises step limits on every such loop."],
      claims: ["catalogs-and-metadata-discovery", "catalogs-and-metadata-glossary", "catalogs-and-metadata-browse", "multi-step-retrieval-one-step", "multi-step-retrieval-agentic", "multi-step-retrieval-step-limits", "jit-retrieval", "context-rot"],
    }),
    step({
      id: "query", label: "Metric query", kind: "mechanism", phase: "architecture", title: "The model returns a metric query, never SQL",
      caption: "Instructions tell the model to use listed metrics only. A schema constrains its reply to a metric, dimensions and filters. The semantic layer holds the definition and join keys.",
      show: ["asst", "sem", "star", "fact", "cat", "rules", "mq-sales"], counters: ["a governed metric", "not yet set", "a figure", "seconds"],
      rides: [ride("m2", 0, 0.5, "query"), ride("m3", 0, 0.34, "SQL")],
      concepts: ["prompting", "structured-output", "analytics-and-the-semantic-layer"],
      body: ["Instructions from the developer rank ahead of the user's message, and being specific about the output wanted improves results.",
        "Structured output constrains the reply to a JSON Schema. An enum keyword admits only the listed values, so a metric name outside the list cannot be returned. The model can still choose a wrong value inside the schema.",
        "A semantic model stores the join keys and the dimensions, so a correctly defined metric can be used by any downstream integration."],
      claims: ["prompting-instructions", "prompting-roles", "structured-output-definition", "structured-output-keywords", "structured-output-values", "analytics-and-the-semantic-layer-dbt"],
    }),
    step({
      id: "access", label: "Access", kind: "mechanism", phase: "architecture", title: "The warehouse runs the query as the manager",
      caption: "The engine plans two scans, a join and an aggregation. A row policy filters the fact table to the manager's own store, and the cost column stays closed.",
      show: ["asst", "sem", "star", "fact-oslo", "cat", "acl", "runas", "plan", "policy"], counters: ["a governed metric", "the manager", "a figure", "seconds"],
      rides: [ride("m2", 0, 0.5, "query"), ride("m3", 0, 0.34, "SQL", { then: "as Oslo" })],
      concepts: ["access-control-and-data-protection", "query-execution", "the-relational-model-and-sql"],
      body: ["A query plan is a tree: scan nodes at the bottom return rows, and join and aggregation nodes sit above them. A hash join loads one relation into a hash table and probes it with the rows of the other.",
        "A row-level access policy acts as a filter, like a WHERE clause, for the users it names. Column-level control checks at query time whether the user may read a tagged column.",
        "Least privilege allows only the access a task needs. Audit records establish who ran what, and when."],
      claims: ["query-execution-plan-tree", "query-execution-hash-join", "access-control-and-data-protection-row-policies", "access-control-and-data-protection-policy-tags", "access-control-and-data-protection-governance", "the-relational-model-and-sql-row-security", "the-relational-model-and-sql-audit"],
    }),
    step({
      id: "sales", label: "A question", kind: "mechanism", phase: "execution", title: "Net sales for Oslo arrive with their definition",
      caption: "The question becomes a metric query for net_sales in week 47. The warehouse returns 268,900 for Oslo. The answer names the definition and its owner.",
      show: ["asst", "sem", "star", "fact-oslo", "cat", "acl", "runas", "answer", "mq-sales"], counters: ["a governed metric", "the manager", "figure and definition", "seconds"],
      rides: [ride("m1", 0, 0.45, "net sales?"), ride("cat", 0, 0.5, "net_sales"), ride("m2", 0, 0.5, "query"), ride("m3", 0, 0.34, "SQL", { then: "268,900" })],
      concepts: ["analytics-and-the-semantic-layer", "structured-output", "query-execution", "hallucination-and-model-limits"],
      body: ["The figure is computed by the engine from the fact table. The model chose the metric and the filters and did no arithmetic.",
        "Restricting a model to supplied material is a documented way to reduce invented answers, and naming the source makes a reply auditable. These techniques reduce such errors and do not eliminate them.",
        "Row-level security defined on a semantic model stays in effect for reports built on it."],
      claims: ["hallucination-and-model-limits-grounding", "hallucination-and-model-limits-citations", "hallucination-and-model-limits-not-eliminated", "analytics-and-the-semantic-layer-rls", "dimensional-modelling-summarise"],
    }),
    step({
      id: "denied", label: "No access", kind: "watch-out", phase: "execution", title: "The warehouse refuses a column the manager may not read",
      caption: "The manager asks for the margin on a sofa. The model returns a valid metric query. The warehouse checks the cost column at query time and denies it.",
      show: ["asst", "sem", "star", "fact", "cat", "acl-deny", "runas", "denied", "mq-margin"], counters: ["a governed metric", "the manager", "a refusal", "seconds"],
      rides: [ride("m1", 0, 0.45, "sofa margin?"), ride("m2", 0, 0.5, "query"), ride("m3", 0, 0.34, "SQL", { then: "denied", tone: "alert" })],
      concepts: ["access-control-and-data-protection", "prompting", "structured-output"],
      body: ["Column-level access control checks at query time whether the user has access. Without the permission the column data is not available to that user.",
        "OWASP states that a system prompt is not a security control and that controls are enforced independently of the model. It advises treating the model as any other user and validating what it sends to backend functions.",
        { callout: { label: "What held", text: "The model was never asked whether the manager may see cost. The warehouse decided." } }],
      claims: ["access-control-and-data-protection-policy-tags", "prompting-boundary", "structured-output-zero-trust", "the-relational-model-and-sql-grant"],
    }),
    step({
      id: "unclear", label: "Unclear", kind: "mechanism", phase: "execution", title: "An ambiguous question is asked back",
      caption: "Sales in the north matches two metrics and no defined region. The instructions permit the model to say so. It asks which is meant and runs nothing.",
      show: ["asst", "sem", "star", "fact", "cat", "acl", "runas", "two", "ask"], counters: ["nothing yet", "the manager", "a question back", "one more turn"],
      rides: [ride("cat", 0, 0.5, "sales?", { then: "2 metrics" }), ride("m1", 0.92, 0.45, "which sales?")],
      concepts: ["hallucination-and-model-limits", "catalogs-and-metadata", "prompting"],
      body: ["Anthropic advises giving a model explicit permission to admit uncertainty, and states that this can drastically reduce false information.",
        "A glossary is a controlled vocabulary. A term with no entry, such as a region nobody defined, has no governed meaning for the model to use."],
      claims: ["hallucination-and-model-limits-abstention", "catalogs-and-metadata-glossary", "prompting-instructions"],
    }),
    step({
      id: "operate", label: "Operate", kind: "decision", phase: "execution", title: "What keeps answers right",
      caption: "",
      show: ["asst", "sem", "star", "fact-oslo", "cat", "acl", "runas", "ops", "evalset"], counters: ["a governed metric", "the manager", "figure and definition", "seconds"],
      rides: [ride("m1", 0, 0.45, "net sales?"), ride("m3", 0, 0.34, "SQL", { then: "271,400" })],
      concepts: ["evaluating-model-output"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["One owned definition per metric", "Access enforced in the warehouse", "Graded questions on every change"] },
        right: { label: "Do not rely on", items: ["Model SQL on raw tables", "The prompt as a control", "It seems to work"] },
      } },
        "An evaluation gives the system an input and applies grading logic to its output. Here a code grader compares the metric and filters returned with those expected, and a refused or ambiguous question must stay refused or asked back.",
        "Running the set on every change to the prompt, the model or the metric list shows a regression before a manager acts on a wrong figure."],
      claims: ["evaluating-model-output-eval", "evaluating-model-output-every-change", "evaluating-model-output-regression", "evaluating-model-output-vibes", "prompting-boundary"],
    }),
  ],
  governance: { text: "The model writes the query and the warehouse enforces access as the person asking. Every answer names the governed definition it used.", claims: ["access-control-and-data-protection-row-policies", "prompting-boundary", "analytics-and-the-semantic-layer-certification"] },
  closing: {
    pitfalls: [
      "Letting the model write SQL against raw tables.",
      "Running every query under one service account that reads everything.",
      "Answering an ambiguous question with the likeliest metric.",
    ],
    questions: [
      "Where is net sales defined, and who owns that definition?",
      "Which system decided that the manager may not read cost?",
      "What does the model choose, and what does the engine compute?",
    ],
  },
});
