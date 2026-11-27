import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(90, 125, 26);
const at = { start: 0.8, extract: 4.6, validate: 9, model: 14, publish: 19.5, end: 22.8 };
const route = line("daily", [G.p(at.start, 0), G.p(at.end, 0)], { always: true });
const task = (id: string, gx: number, title: string, sub: string, group: string, tone?: "alert") =>
  prism(id, gx - 0.62, -7.12, 1.24, 1.24, 27, { hue: tone ? "alert" : "track", glyph: tone ? "alert" : "gear", title, sub, at: "sw", group });

export default defineGuide({
  id: "orchestration", track: "data", module: "Transformation", slug: "orchestration",
  title: "Orchestration",
  summary: "An orchestrator runs tasks when their dependencies are ready, retries failed work and replays selected past periods.",
  forLeads: "A workflow makes dependencies and recovery visible. Run history shows what ran, when it ran and which period it processed.",
  status: "draft", minutes: 6,
  counters: ["Ready tasks", "Failed steps", "Attempts", "Data period"],
  whatIf: { label: "What if the failed task never retried?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order numbers and run dates are illustrative",
    label: "The daily Vinterhus sales workflow reads orders, checks them, builds a sales table and publishes the report. Dependency links set the order. An orchestrator starts tasks only when their upstream work is ready, records their attempts and can run the same workflow for an earlier date range.",
    els: [
      route,
      stop("begin", ...G.p(at.start, 0), undefined, undefined, { big: true, always: true }),
      stop("extract", ...G.p(at.extract, 0), undefined, undefined, { always: true }),
      stop("validate", ...G.p(at.validate, 0), undefined, undefined, { always: true }),
      stop("model", ...G.p(at.model, 0), undefined, undefined, { always: true }),
      stop("publish", ...G.p(at.publish, 0), undefined, undefined, { big: true, always: true }),
      drum("orders", -0.4, 0, 0.78, 32, { hue: "sky", glyph: "stack", title: "Orders", at: "n", always: true }),
      task("extract-task", at.extract, "Read orders", "source table", "graph"),
      task("validate-task", at.validate, "Check rows", "quality rules", "graph"),
      task("model-task", at.model, "Sales asset", "daily table", "graph"),
      task("publish-task", at.publish, "Publish", "Finance report", "graph"),
      task("failed-task", at.model, "Sales asset", "failed", "failed", "alert"),
      prism("scheduler", 10.8, -10.2, 1.7, 1.5, 34, { hue: "sand", glyph: "gear", title: "Orchestrator", sub: "Airflow, Dagster, Prefect", at: "n", group: "engine" }),
      line("deps", [G.p(at.start, -9.2), G.p(at.extract, -9.2), G.p(at.extract, -8.1)], { tone: "ink", w: 3, group: "engine" }),
      line("deps2", [G.p(at.extract, -8.1), G.p(at.validate, -8.1)], { tone: "ink", w: 3, group: "engine" }),
      line("deps3", [G.p(at.validate, -8.1), G.p(at.model, -8.1)], { tone: "ink", w: 3, group: "engine" }),
      line("deps4", [G.p(at.model, -8.1), G.p(at.publish, -8.1)], { tone: "ink", w: 3, group: "engine" }),
      pill("retry-label", [778, 204], "retry", { glyph: "replay", tone: "alert", group: "failed" }),
      pill("period-label", [800, 106], "1-31 Oct", { glyph: "calendar", mono: true, group: "backfill" }),
      raise(table("history", 0, 0, 264, ["run", "period", "result"], [
        ["daily", "yesterday", "success"], { cells: ["retry", "yesterday", "success"], hot: true }, ["replay", "1-31 Oct", "success"],
      ], { at: [12, 130, 200], rowH: 26, title: "Run history", sub: "period and result", group: "history" }), G.p(13, 11), 72),
    ],
  },
  steps: [
    step({
      id: "manual", label: "Manual", kind: "problem", title: "A report waits on tasks run by hand",
      caption: "Operations starts the report before the daily sales table is ready. The work has no visible dependency order or run record.",
      show: [], counters: ["unknown", "not tracked", "one", "today"],
      rides: [ride("daily", "begin", "validate", "4471 web 899")],
      body: ["Orders arrive at Vinterhus throughout the day. Operations runs a quality check, builds the daily sales table and publishes a Finance report. If these tasks start by hand, their dependencies and recovery steps live in people's memory."],
      claims: ["orchestration-tasks"],
    }),
    step({
      id: "dependency", label: "Dependencies", kind: "idea", title: "Dependencies determine task order",
      caption: "The check must finish before the sales table can be built, and the table must exist before the report is published.",
      show: ["graph", "engine"], counters: ["1 ready at first", "0", "1", "today"],
      rides: [ride("daily", "begin", 0.74, "4471 web 899", { via: ["extract", "validate", "model"] })],
      body: ["Apache Airflow represents a workflow as a DAG of tasks and dependencies. By default, a task runs when all of its upstream tasks have succeeded.",
        "Dagster's asset definitions declare upstream assets and compute an asset's contents. Dagster tracks those dependencies and handles the asset's execution within the pipeline."],
      claims: ["orchestration-tasks", "orchestration-dagster-assets"],
    }),
    step({
      id: "failure", label: "Retry", kind: "mechanism", title: "A retry repeats the failed task",
      caption: "The sales build fails after the check passes. Its retry runs that task again, then the dependent report can continue.",
      show: ["engine", "failed"], counters: ["0 downstream", "1", "2 attempts", "today"],
      rides: [ride("daily", "begin", 0.62, "4471", { via: ["extract", "validate"], then: "retry" })],
      body: ["By default, Airflow retries a failed task with a fixed count and delay, and a task with attempts left waits in the up-for-retry state. Prefect sets the count with `retries` and a wait with `retry_delay_seconds`, can scope retries to individual tasks, and can decide from the error with `retry_condition_fn`. Set a retry limit, then review a task that remains failed."],
      claims: ["orchestration-retries", "orchestration-prefect-retries"],
    }),
    step({
      id: "backfill", label: "Replay", kind: "mechanism", title: "A backfill replays a past period",
      caption: "Finance corrects October's returns. The workflow runs again for the chosen date range and records each run against its period.",
      show: ["graph", "engine", "backfill", "history"], counters: ["4", "0", "3 runs", "1-31 Oct"],
      rides: [ride("daily", "begin", 0.74, "4471 Oct", { via: ["extract", "validate", "model"] })],
      body: ["Airflow backfill creates workflow runs for past dates in a time-based schedule. Its reprocessing setting controls whether existing runs are skipped, failed runs are rerun, or completed and failed runs are recreated. Setting `max_active_runs` on a backfill controls how many of its runs execute concurrently."],
      claims: ["orchestration-backfill"],
    }),
    step({
      id: "history", label: "History", kind: "watch-out", title: "Run history explains what produced the result",
      caption: "The run records its period, task states and attempts. Operations can trace the report to the work that produced it.",
      show: ["graph", "engine", "history"], counters: ["4", "0", "3 runs", "recorded"],
      rides: [ride("daily", "begin", 0.74, "4471 Oct", { via: ["extract", "validate", "model"] })],
      body: ["Airflow's Dag Run view shows the run's logical date, run type, duration and data interval, and lists each task's state, start and end dates, and try number. A Dagster asset definition names the upstream assets its contents are derived from. Use the run record to establish which inputs and task outcomes led to a published result."],
      claims: ["orchestration-run-history", "orchestration-dagster-assets"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Make order, recovery and history explicit",
      caption: "",
      show: ["graph", "engine", "history"], counters: ["dependencies set", "bounded", "auditable", "chosen period"],
      rides: [ride("daily", "begin", 0.74, "4471 Oct", { via: ["extract", "validate", "model"] })],
      body: [{ pair: {
        left: { label: "Before a run", items: ["Declare task dependencies", "Set bounded retry rules"] },
        right: { label: "After a run", items: ["Record period and attempts", "Review a backfill range"] },
      } }, "Airflow, Dagster and Prefect are orchestration tools. Dagster models dependencies through data assets; Airflow and Prefect can express task workflows. Choose a model that keeps task order, recovery and run evidence clear to the operators."],
      claims: ["orchestration-tasks", "orchestration-retries", "orchestration-prefect-retries", "orchestration-dagster-assets", "orchestration-backfill", "orchestration-run-history", "orchestration-governance"],
    }),
  ],
  governance: { text: "Run history records the run period, task outcomes and retry attempts. It is operational evidence of the work behind a published result.", claims: ["orchestration-governance", "orchestration-run-history"] },
  closing: {
    pitfalls: [
      "Starting downstream work before its required inputs succeed.",
      "Retrying every error without a limit or a way to review repeated failure.",
      "Replaying a period without checking its data interval and reprocessing behaviour.",
    ],
    questions: [
      "Which tasks must finish before the daily sales table can be built?",
      "Which failures should be retried, and when should a person intervene?",
      "Can an operator identify the period, inputs and attempts behind a report?",
    ],
  },
});
