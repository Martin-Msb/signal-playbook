import { CANVAS, code, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, step, stop } from "@signal-path/engine";

// The floor: raw.orders and its staging model run along the back, raw.payments along the front.
// Both meet at fct_orders, which feeds returns_by_channel. The model's file stands behind the graph.
const G = isoGrid(200, 120, 30);
const O = -3, P = 3;
const ticket = (id: string, title: string, lines: string[], extra = {}) =>
  raise(code(id, 0, 0, 270, lines, { title, mono: true, keywords: ["select", "from", "join", "using", "create", "table", "as", "ref", "dev", "prod"], group: id, ...extra }), G.p(16.5, -4), 30);

export default defineGuide({
  id: "transformation", track: "data", module: "Transformation", slug: "transformation",
  title: "Transformation",
  summary: "A transformation layer written as SELECT statements that name their inputs. The names draw the graph and the graph sets the run order. dbt is the reference syntax.",
  forLeads: "Dependencies stop living in people's heads. The run order, the environments and the impact of a change all come from the code.",
  status: "draft", minutes: 8,
  counters: ["Run order comes from", "Table names are", "Environments"],
  whatIf: { label: "What if the scripts ran by hand?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    label: "Two raw tables feed two staging models, which feed an orders model and a returns model. Lines appear as ref() calls declare each dependency, and a run follows them in order. A ticket shows the SQL of the orders model.",
    els: [
      drum("raw-o", 0, O, 1.05, 40, { hue: "sky", glyph: "table", title: "raw.orders", at: "e", always: true }),
      drum("raw-p", 0, P, 1.05, 40, { hue: "sky", glyph: "table", title: "raw.payments", at: "s", always: true }),
      line("d1", [G.p(1.2, O), G.p(4.5, O)], { group: "dag" }),
      line("d2", [G.p(1.2, P), G.p(4.5, P)], { group: "dag" }),
      line("r1", [G.p(4.5, O), G.p(8, O), G.p(8, 0), G.p(10, 0)], { group: "refs" }),
      line("r2", [G.p(4.5, P), G.p(8, P), G.p(8, 0), G.p(10, 0)], { group: "refs" }),
      line("d3", [G.p(10, 0), G.p(16.5, 0)], { group: "dag" }),
      line("run", [G.p(1.2, O), G.p(8, O), G.p(8, 0), G.p(16.5, 0)], { group: "run" }),
      line("st-file", [G.p(10, -0.6), G.p(10, -4), G.p(16.5, -4)], { tone: "ink", w: 3, always: true }),
      stop("s-so", ...G.p(4.5, O), "stg_orders", "one select", { at: "ne", mono: true, always: true }),
      stop("s-sp", ...G.p(4.5, P), "stg_payments", "one select", { at: "sw", mono: true, always: true }),
      stop("s-f", ...G.p(10, 0), undefined, undefined, { always: true }),
      stop("p-m", ...G.p(13.2, 0), undefined, undefined, { group: "dag" }),
      prism("fct", 9.4, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "table", title: "fct_orders", sub: "joins both", at: "sw", always: true }),
      prism("mart", 15.9, -0.6, 1.2, 1.2, 28, { hue: "paper", glyph: "table", title: "returns_by_channel", sub: "one select", at: "sw", always: true }),
      pawn("who", 11, 10, "Analyst", "Which one runs first?", { group: "q" }),

      ticket("sql0", "fct_orders.sql, run by hand", ["select o.id, p.amount", "from analytics.stg_orders o", "join analytics.stg_payments p", "  using (id)"]),
      ticket("ddl", "what dbt sends to the warehouse", ["create table fct_orders as (", "  select o.id, p.amount", "  from ...", ")"]),
      ticket("sql", "models/fct_orders.sql", ["select o.id, p.amount", "from {{ ref('stg_orders') }} o", "join {{ ref('stg_payments') }} p", "  using (id)"], { hot: [1, 2] }),
      ticket("env", "ref('stg_orders') resolves to", ["dev   dbt_alice.stg_orders", "prod  analytics.stg_orders"]),
      pill("skip", [640, 474], "skipped when an upstream model fails", { tone: "alert", glyph: "x", group: "skip" }),
    ],
  },
  steps: [
    step({
      id: "scripts", label: "Scripts", kind: "problem", title: "Hand-run scripts have no recorded order",
      caption: "Four SQL scripts build the returns numbers. Each names its input tables directly, and the run order is tribal knowledge. Out of order, the numbers are wrong without an error.",
      show: ["sql0", "q"], counters: ["a person", "hard-coded", "one"],
      body: ["Vinterhus builds its returns numbers from four SQL scripts. Each names its input tables directly, and the order to run them in is tribal knowledge.",
        "Run them out of order and the numbers are wrong without any error."],
      claims: ["dbt-ref-graph"],
    }),
    step({
      id: "model", label: "Model", kind: "idea", title: "A model is one SELECT in one file",
      caption: "In dbt, each .sql file holds one select statement. dbt wraps it in the statement that creates the table or view and runs it in the warehouse.",
      show: ["ddl"], counters: ["a person", "hard-coded", "one"],
      body: ["In dbt, each .sql file holds one select statement. dbt wraps it in the statement that creates the table or view, in the dialect of the warehouse, and runs it there.",
        { callout: { label: "Key idea", text: "The author writes what the table contains. The tool writes how it is built." } }],
      claims: ["dbt-model-select", "dbt-runs-in-warehouse"],
    }),
    step({
      id: "ref", label: "ref()", kind: "mechanism", title: "ref() names the input model",
      caption: "The model selects from ref('stg_orders'), not from a schema and table name. Each ref() declares a dependency on another model.",
      show: ["sql", "refs"], counters: ["ref()", "resolved by ref()", "one"],
      rides: [ride("r1", 1, 0.5, "ref('stg_orders')"), ride("r2", 1, 0.5, "ref('stg_payments')")],
      body: ["The model selects from ref('stg_orders'), not from a schema and table name. Each ref() declares a dependency on another model."],
      claims: ["dbt-ref-graph"],
    }),
    step({
      id: "graph", label: "Graph", kind: "mechanism", title: "The refs define the run order",
      caption: "dbt reads every ref() and builds the dependency graph. A run builds the models in that order, and when a model fails, the models downstream of it are skipped.",
      show: ["sql", "refs", "dag", "run", "skip"], counters: ["the graph", "resolved by ref()", "one"],
      rides: [ride("run", 0, "p-m", "1 stg_orders", { via: ["s-so", "s-f"], then: "2 fct_orders" })],
      body: ["dbt reads every ref() and builds the dependency graph. A run builds the models in that order, and when a model fails, the models downstream of it are skipped.",
        { callout: { label: "What changed", text: "The run order is derived from the code. Nobody maintains it." } }],
      claims: ["dbt-ref-graph", "dbt-skip-downstream"],
    }),
    step({
      id: "envs", label: "Environments", kind: "mechanism", title: "One codebase, any environment",
      caption: "ref() resolves to the schema of the environment the project runs in. A developer builds the whole graph in a private schema and production builds the same code in its own.",
      show: ["env", "refs", "dag", "run"], counters: ["the graph", "resolved by ref()", "dev and prod"],
      rides: [ride("run", 0, "p-m", "dbt_alice", { via: ["s-so"], then: "analytics" })],
      body: ["ref() resolves to the schema of the environment the project runs in. A developer builds the whole graph in a private schema and production builds the same code in its own."],
      claims: ["dbt-ref-environment"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What belongs in the graph",
      caption: "",
      show: ["sql", "refs", "dag", "run"], counters: ["the graph", "resolved by ref()", "dev and prod"],
      rides: [ride("run", 0, "p-m", "run", { via: ["s-so", "s-f"] })],
      body: [{ pair: {
        left: { label: "In the graph", items: ["Every table another model reads", "Logic analysts must trace", "Anything rebuilt on a schedule"] },
        right: { label: "Check first", items: ["How each model is built: view, table or incremental", "Who owns the tool and its licence"] },
      } },
        "dbt ships five built-in materializations. Fivetran completed its merger with dbt Labs on 1 June 2026, and dbt Core v2.0 entered alpha under Apache 2.0."],
      claims: ["dbt-materializations", "dbt-ownership", "dbt-ref-graph"],
    }),
  ],
  governance: { text: "Transformation logic is controlled like software. dbt projects are managed in version control, and every change is reviewed in a pull request before it reaches the production branch.", claims: ["transformation-version-control"] },
  closing: {
    pitfalls: [
      "Selecting from a hard-coded table name inside a model, which hides the dependency from the graph.",
      "One model that does everything, so nothing downstream can reuse a step.",
      "Building every model as a table when a view would do.",
    ],
    questions: [
      "How does the tool know which model to build first?",
      "What happens to downstream models when one model fails?",
      "How does the same code build in a developer schema and in production?",
    ],
  },
});
