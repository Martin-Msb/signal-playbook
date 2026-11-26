import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(480, 278, 26);
const flow = line("metric-flow", [G.p(-8, 0), G.p(8, 0)], { always: true });
const modelBoard = (id: string, group: string, rows: [string, string][], foot?: string) =>
  raise(table(id, 0, 0, 296, ["member", "meaning"], rows, { at: [12, 138], rowH: 27, title: "Sales model", sub: "shared definitions", mono: true, foot, group }), G.p(0, -5), 32);

export default defineGuide({
  id: "analytics-and-the-semantic-layer", track: "data", module: "Serving", slug: "analytics-and-the-semantic-layer",
  title: "Analytics and the semantic layer",
  summary: "Dashboards, queries and notebooks can ask for the same defined metric through a semantic layer, which applies shared meaning and access rules.",
  forLeads: "A metric is a governed definition that consumers can reuse. The semantic layer keeps the calculation and its dimensions in one model, while analytics tools remain free to ask different questions of it.",
  status: "draft", minutes: 7,
  counters: ["Net sales", "Definitions", "Consumers", "Rows visible"],
  whatIf: { label: "What if each report owns its formula?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order numbers, amounts and metric values are illustrative",
    label: "Vinterhus Finance follows order data from the warehouse through a shared sales model to a dashboard, an ad hoc query and a notebook. The first view shows three separate revenue answers. A single semantic definition names net sales and its dimensions, and each consumer requests it through the same model. A certified model marks the governed definition. A row-level role filters which orders a user can see before a result reaches the BI tool.",
    els: [
      flow,
      stop("warehouse", ...G.p(-8, 0), undefined, undefined, { big: true, always: true }),
      stop("metric", ...G.p(0, 0), undefined, undefined, { big: true, always: true }),
      stop("serve", ...G.p(5, 0), undefined, undefined, { big: true, always: true }),
      drum("orders", -10, -1, 1, 38, { hue: "sky", glyph: "stack", title: "Orders", sub: "warehouse", at: "n", always: true }),
      prism("dashboard", 8, -5, 1.2, 1.2, 30, { hue: "track", glyph: "chart", title: "Dashboard", sub: "Finance", at: "e", always: true }),
      prism("query", 10, 0, 1.2, 1.2, 30, { hue: "track", glyph: "code", title: "Query", sub: "ad hoc", at: "e", always: true }),
      prism("notebook", 10, 5, 1.2, 1.2, 30, { hue: "track", glyph: "doc", title: "Notebook", sub: "analysis", at: "e", always: true }),
      modelBoard("drift", "drift", [["Dashboard", "1,639 kr"], ["Query", "1,710 kr"], ["Notebook", "1,602 kr"]], "three local formulas"),
      modelBoard("definition", "definition", [["net sales", "amount - refunds"], ["measure", "sum per order"]]),
      modelBoard("dimensions", "dimensions", [["net sales", "amount - refunds"], ["date", "day or month"], ["product", "category"]]),
      modelBoard("access", "access", [["net sales", "amount - refunds"], ["row role", "Finance: own region"], ["certification", "reviewed model"]]),
      pill("badge", [590, 206], "Certified", { glyph: "check", tone: "track", group: "cert" }),
      pill("ossie", [590, 206], "Apache Ossie", { mono: true, group: "exchange" }),
    ],
  },
  steps: [
    step({
      id: "drift", label: "Disagree", kind: "problem", title: "Three reports give three answers",
      caption: "Dashboard, query and notebook each calculate sales. Their filters differ, so Finance cannot reconcile the totals.",
      show: ["drift"], counters: ["3 answers", "3 formulas", "3", "all rows"],
      rides: [ride("metric-flow", "warehouse", "metric", "4471 899 kr")],
      body: ["Vinterhus has one order record and three illustrative results. Each consumer repeats the calculation locally, so a change to refund handling can leave the reports out of step."],
      claims: ["analytics-and-the-semantic-layer-metrics", "analytics-and-the-semantic-layer-cube"],
    }),
    step({
      id: "define", label: "Define", kind: "idea", title: "A semantic model gives a metric one definition",
      caption: "Finance defines net sales once as order amount less refunds. The model holds that calculation for every consumer.",
      show: ["definition"], counters: ["1,639 kr", "1 formula", "3", "all rows"],
      rides: [ride("metric-flow", "warehouse", "metric", "net sales")],
      body: ["In dbt Semantic Layer, a metric combines simple metrics, constraints or mathematical functions. Cube models measures, dimensions and joins in cubes. Both place reusable analytical meaning in a model rather than a report formula."],
      claims: ["analytics-and-the-semantic-layer-metrics", "analytics-and-the-semantic-layer-cube"],
    }),
    step({
      id: "context", label: "Context", kind: "mechanism", title: "Dimensions give the metric a question to answer",
      caption: "Finance asks for net sales by month and product category. The metric stays fixed while its grouping changes.",
      show: ["dimensions"], counters: ["1,639 kr", "1 formula", "date, product", "all rows"],
      rides: [ride("metric-flow", "warehouse", "serve", "category: sofas")],
      body: ["dbt semantic models define entities as join keys and dimensions as ways to group or filter metrics. Apache Ossie describes datasets, fields, relationships and metrics in a JSON or YAML semantic model that can be exchanged between tools."],
      claims: ["analytics-and-the-semantic-layer-dbt", "analytics-and-the-semantic-layer-ossie"],
    }),
    step({
      id: "consumers", label: "Consume", kind: "mechanism", title: "Analytics tools request the shared metric",
      caption: "A dashboard, an ad hoc query and a notebook ask the model for the same metric and dimensions.",
      show: ["dimensions", "exchange"], counters: ["1,639 kr", "1 formula", "3", "all rows"],
      rides: [ride("metric-flow", "metric", "serve", "net sales")],
      body: ["BI tools, self-service analytics and notebooks can be separate consumers of a shared model. dbt exposes metrics through integrations and APIs. Apache Ossie is an Apache incubator project for exchanging semantic metadata across analytics, AI and BI tools."],
      claims: ["analytics-and-the-semantic-layer-dbt", "analytics-and-the-semantic-layer-ossie"],
    }),
    step({
      id: "govern", label: "Govern", kind: "watch-out", title: "Certification and row filters govern reuse",
      caption: "A certified semantic model identifies a reviewed source. A Finance role restricts the rows its user can retrieve.",
      show: ["access", "cert"], counters: ["1,639 kr", "1 formula", "3", "own region"],
      rides: [ride("metric-flow", "metric", "serve", "net sales")],
      body: ["Power BI lets designated experts certify semantic models and displays a certified badge. Its row-level security filters model rows by role. For shared semantic models, the role's filters remain in effect for users connecting to build reports."],
      claims: ["analytics-and-the-semantic-layer-certification", "analytics-and-the-semantic-layer-rls"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Publish a metric people can trust",
      caption: "",
      show: ["access", "cert"], counters: ["1,639 kr", "1 formula", "3", "role filtered"],
      rides: [ride("metric-flow", "warehouse", "serve", "net sales")],
      body: [{ pair: {
        left: { label: "Before publishing", items: ["Review the calculation and joins", "Name its dimensions"] },
        right: { label: "For consumers", items: ["Certify the model", "Test row access in each tool"] },
      } }, "An endorsement signals a trusted model; it does not replace the model's access rules. Confirm both meaning and row filtering for the identities that will use the data."],
      claims: ["analytics-and-the-semantic-layer-certification", "analytics-and-the-semantic-layer-rls"],
    }),
  ],
  governance: { text: "Certify the reviewed semantic model that contains the metric, and test row-level access with the roles used by each BI consumer. Certification indicates trust; row filtering controls which records a user can retrieve.", claims: ["analytics-and-the-semantic-layer-certification", "analytics-and-the-semantic-layer-rls"] },
  closing: {
    pitfalls: [
      "Defining the same metric separately in dashboards and notebooks.",
      "Changing the metric's meaning without updating its owner and consumer documentation.",
      "Assuming a certified label grants or restricts data access by itself.",
    ],
    questions: [
      "Which formula, filters and joins define net sales?",
      "Can each consumer request the same metric and dimensions?",
      "Have row filters been tested for the identities using each BI tool?",
    ],
  },
});
