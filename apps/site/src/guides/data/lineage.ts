import { CANVAS, code, defineGuide, isoGrid, line, node, pill, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(180, 185, 30);
const P = { start: 0, job: 7, output: 14, report: 21 };

export default defineGuide({
  id: "lineage", track: "data", module: "Transformation", slug: "lineage",
  title: "Lineage",
  summary: "Lineage records which inputs and code produced each table and column, which answers where a number came from and what a change will break.",
  forLeads: "A sales total is useful only when its path is inspectable: the orders and code that produced it, the columns it depends on and the reports that consume it.",
  status: "draft", minutes: 6,
  counters: ["Source tables", "Column paths", "Code version", "Downstream uses"],
  whatIf: { label: "What if item price changed?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order values and table names are illustrative",
    label: "An order moves along a rail from the orders table through a SQL model into daily sales and a Finance report. Lineage first connects the source and output tables to the job. A column map records how item_price and quantity produce net_sales. The job also records the SQL source version. A change to a source field reaches the report through the dependency graph. A personal email follows a separate path to Support, where its processing purpose and recipient are recorded.",
    els: [
      line("flow", [G.p(P.start, 0), G.p(P.job, 0), G.p(P.output, 0), G.p(P.report, 0)], { always: true }),
      stop("orders", ...G.p(P.start, 0), undefined, undefined, { big: true, always: true }),
      stop("model", ...G.p(P.job, 0), undefined, undefined, { always: true }),
      stop("sales", ...G.p(P.output, 0), undefined, undefined, { always: true }),
      stop("finance", ...G.p(P.report, 0), undefined, undefined, { big: true, always: true }),
      prism("orders-table", P.start, -4, 1.8, 1.5, 28, { hue: "sky", glyph: "table", title: "orders", sub: "item_price, qty, email", at: "s", always: true }),
      prism("sql-job", 8, -4, 1.8, 1.5, 30, { hue: "track", glyph: "code", title: "SQL model", sub: "daily_sales", at: "n", always: true }),
      prism("sales-table", 16, -4, 1.8, 1.5, 28, { hue: "mint", glyph: "table", title: "daily_sales", sub: "net_sales", at: "n", always: true }),

      // Dataset-level dependencies. Each reveal adds the layer the reader needs.
      line("table-edge", [[250, 35], [480, 35], [710, 35]], { tone: "ink", w: 3, group: "table-lineage" }),
      node("table-in", 250, 35, "orders", { shape: "box", mono: true, hue: "sky", group: "table-lineage" }),
      node("table-job", 480, 35, "daily_sales SQL", { shape: "box", mono: true, hue: "track", group: "table-lineage" }),
      node("table-out", 710, 35, "daily_sales", { shape: "box", mono: true, hue: "mint", group: "table-lineage" }),

      // Column lineage: output value is derived from two source fields by this SQL expression.
      line("col-a", [[400, 90], [530, 90], [660, 90]], { tone: "ink", w: 3, group: "column-lineage" }),
      line("col-b", [[400, 142], [530, 142], [660, 142]], { tone: "ink", w: 3, group: "column-lineage" }),
      node("field-price", 400, 90, "item_price", { shape: "box", mono: true, hue: "sky", group: "column-lineage" }),
      node("field-qty", 400, 142, "quantity", { shape: "box", mono: true, hue: "sky", group: "column-lineage" }),
      node("field-expr", 530, 116, "SQL ×", { shape: "diamond", mono: true, hue: "track", group: "column-lineage" }),
      node("field-total", 690, 116, "net_sales", { shape: "box", mono: true, hue: "mint", group: "column-lineage" }),
      line("expr-out", [[565, 116], [645, 116]], { tone: "ink", w: 3, group: "column-lineage" }),

      code("sql-version", 470, 30, 390, ["select item_price * quantity as net_sales", "from orders"], { title: "models/daily_sales.sql", sub: "source version: v3", group: "version" }),
      pill("changed-field", [600, 72], "item_price renamed", { tone: "alert", group: "impact" }),
      line("impact-a", [[410, 130], [560, 130], [710, 130]], { tone: "alert", w: 3, group: "impact" }),
      node("impact-source", 410, 130, "item_price", { shape: "box", mono: true, hue: "sky", group: "impact" }),
      node("impact-total", 710, 130, "net_sales", { shape: "box", mono: true, hue: "mint", group: "impact" }),
      node("impact-report", 710, 222, "Finance report", { shape: "box", hue: "sand", group: "impact" }),
      line("impact-b", [[710, 166], [710, 186]], { tone: "alert", w: 3, group: "impact" }),

      // A personal-data route and its processing record.
      line("privacy-flow", [[220, 462], [450, 462], [680, 462]], { tone: "ink", w: 3, group: "privacy" }),
      node("privacy-source", 220, 462, "orders.email", { shape: "box", mono: true, hue: "sky", group: "privacy" }),
      node("privacy-job", 450, 462, "refund view", { shape: "box", mono: true, hue: "track", group: "privacy" }),
      node("privacy-dest", 680, 462, "Support", { shape: "box", hue: "sand", group: "privacy" }),
      code("processing-record", 80, 300, 410, ["purpose: refund handling", "data: customer email", "recipient: Support", "retention: defined by owner"], { title: "Processing record", sub: "Article 30 fields", group: "privacy-record" }),
    ],
  },
  steps: [
    step({
      id: "number", label: "Number", kind: "problem", title: "A sales total has no visible source",
      caption: "Finance sees 899 in the weekly report. The number gives no answer about which orders or SQL produced it.",
      show: [], counters: ["unknown", "none", "unknown", "1 report"],
      rides: [ride("flow", "orders", "finance", "4470: 899")],
      body: ["The order and its reported amount are illustrative. The missing information is the path: which source record and transformation fed the report."],
      claims: ["lineage-run-model"],
    }),
    step({
      id: "tables", label: "Tables", kind: "idea", title: "A job links input and output tables",
      caption: "The SQL job reads orders and writes daily_sales. The table-level path connects the output to the process that made it.",
      show: ["table-lineage"], counters: ["1", "table path", "unknown", "1 report"],
      rides: [ride("flow", "orders", "sales", "4470")],
      body: ["OpenLineage represents a process as a job with input and output datasets, and a run as one instance of that job. Run events record observed states. The Lineage Dataset Facet also suits a structural relationship that has no natural event job, such as a view derived from tables."],
      claims: ["lineage-run-model", "lineage-table-graph"],
    }),
    step({
      id: "columns", label: "Columns", kind: "mechanism", title: "Column lineage shows how a value is derived",
      caption: "item_price and quantity feed the SQL expression that produces net_sales. The report's value now has a field-level path.",
      show: ["table-lineage", "column-lineage"], counters: ["1", "2 inputs to net_sales", "unknown", "1 report"],
      rides: [ride("flow", "orders", "sales", "net_sales 899")],
      body: ["OpenLineage's Spark integration derives column dependencies from Spark logical plans. Its SQL parser extracts table and field names from query strings for JDBC relations, but does not provide their field types or transformation types in that case."],
      claims: ["lineage-column-graph", "lineage-table-graph"],
    }),
    step({
      id: "code", label: "Code", kind: "mechanism", title: "The job records which code ran",
      caption: "The job's source location and version identify the SQL definition that produced the value.",
      show: ["version"], counters: ["1", "2 inputs to net_sales", "v3", "1 report"],
      rides: [ride("flow", "model", "sales", "v3: net_sales")],
      body: ["OpenLineage's source-code location facet captures the job's code location and version, such as a source-control revision. The record ties the graph to the transformation that ran."],
      claims: ["lineage-run-model"],
    }),
    step({
      id: "impact", label: "Impact", kind: "watch-out", title: "A changed input reaches dependent outputs",
      caption: "If item_price is renamed, the SQL dependency fails and the Finance report loses its source. The graph shows affected downstream fields.",
      show: ["table-lineage", "impact"], counters: ["1", "2 inputs to net_sales", "v3", "1 affected report"],
      rides: [ride("flow", "orders", "finance", "item_price", { tone: "alert" })],
      body: ["The Lineage Dataset Facet records the datasets, jobs and fields from which an output derives. OpenLineage says metadata about datasets, jobs and runs gives users the information to understand the impact of changes."],
      claims: ["lineage-table-graph", "lineage-impact"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Trace processing as well as numbers",
      caption: "",
      show: ["table-lineage", "column-lineage", "privacy", "privacy-record"], counters: ["1", "2 inputs to net_sales", "v3", "1 affected report"],
      rides: [ride("flow", "orders", "sales", "4470 email", { via: ["model"], then: "Support view" })],
      body: [{ pair: {
        left: { label: "For each output", items: ["Record input tables and fields", "Keep the job and code version", "Review downstream impact"] },
        right: { label: "For personal data", items: ["Trace dataset and column flow", "Record purpose and recipients", "Keep erasure and security details"] },
      } }, "Article 30 of Regulation (EU) 2016/679 requires a controller's processing record to include purposes, categories of personal data, recipients and, where possible, erasure time limits and a general description of security measures."],
      claims: ["lineage-table-graph", "lineage-run-model", "lineage-gdpr-record"],
    }),
  ],
  governance: { text: "Lineage metadata about datasets, jobs and runs helps teams find the root cause of issues and understand the impact of changes. For personal data, maintain the processing record required by Article 30, including purposes, data categories, recipients, and where possible erasure time limits and security measures.", claims: ["lineage-impact", "lineage-gdpr-record"] },
  closing: {
    pitfalls: [
      "Treating table-level lineage as enough to explain a derived column.",
      "Assuming SQL parsing proves every transformation when a parser only extracts names for some relations.",
      "Using a lineage graph as a replacement for the required processing record or access controls.",
    ],
    questions: [
      "Which source fields produce the number in the report?",
      "Can a proposed source change reach the downstream models and reports that use it?",
      "Where does personal data flow, and which processing purposes and recipients must be recorded?",
    ],
  },
});
