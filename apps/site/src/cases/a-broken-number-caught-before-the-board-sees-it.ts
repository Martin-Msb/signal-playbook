import { CANVAS, blocks, defineGuide, drum, isoGrid, line, list, pawn, plot, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";
import type { Hue } from "@signal-path/engine";

// The floor: orders run down the main rail from the order service through raw, clean and revenue to the board report.
// The contract stands at the source, a check before each layer, quarantine in front of the first check,
// the orchestrator behind it. The board report's chart stands at the back right, the working card at the front left.
const G = isoGrid(80, 88, 30);
const TOP = G.p(17, -8.4);    // the board report's chart
const LEFT = G.p(14.5, 12.5); // the working card

const card = (id: string, title: string, items: Parameters<typeof list>[4], extra: Parameters<typeof list>[5] = {}) =>
  raise(list(id, 0, 0, 226, items, { title, group: id, ...extra }), LEFT, 20);

// Revenue per day on the board report, in thousands. Day 1 is 10 May.
const bars = (id: string, values: number[], hues: Hue[]) =>
  series(id, "rev", "bars", values.map((v, i) => [i + 1, v] as [number, number]), { hues, group: id });
const ok = [412, 398, 421, 405];
const sky: Hue[] = ["sky", "sky", "sky", "sky"];

// One block per day partition of the clean and revenue tables.
const days = (id: string, items: { h: number; hue?: Hue; hot?: boolean; state?: "alert" }[]) =>
  blocks(id, 14.4, 2.6, 7, 0.42, items, { gap: 0.12, title: "Day partitions", sub: "10 to 16 May", at: "sw", group: id });
const built = { h: 16, hue: "paper" as Hue }, empty = { h: 2 }, fresh = { h: 16, hot: true };

export default defineGuide({
  id: "case-a-broken-number-caught-before-the-board-sees-it", track: "case", module: "Use cases", slug: "a-broken-number-caught-before-the-board-sees-it",
  title: "A broken number caught before the board sees it",
  summary: "A renamed field halves revenue on the board report. A contract at the source, checks between the layers, an orchestrator, lineage and named owners are added one at a time. Then the rename is sent through again.",
  forLeads: "The pipeline did not fail: every task succeeded on incomplete data. What catches a wrong number is an agreement with the source, tests that can stop a publish, and an owner who is told.",
  status: "draft", minutes: 12,
  counters: ["Schema changes", "Checks between layers", "Reports traced", "Time to notice"],
  whatIf: { label: "What if there were no contract and no checks?", step: 1, from: 7 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts, dates and row counts are illustrative",
    label: "Orders travel along a rail from an order service through a raw, a clean and a revenue store to a board report with a chart of revenue per day. Later stops add a contract at the source, a check before each layer with a quarantine store, an orchestrator, day partitions, two more reports fed by the revenue store, and three owners.",
    els: [
      drum("src", 0, 0, 1, 24, { hue: "sand", glyph: "globe", title: "Order service", at: "n", always: true }),
      pawn("p-src", 3.1, 3.1, "Web shop team", undefined, { always: true }),
      line("a", [G.p(1, 0), G.p(6.4, 0)], { always: true }),
      drum("raw", 8, 0, 1, 26, { hue: "paper", glyph: "stack", title: "Raw", sub: "as it arrived", at: "sw", always: true }),
      line("b", [G.p(9, 0), G.p(14.4, 0)], { always: true }),
      drum("clean", 15.4, 0, 1, 26, { hue: "sky", glyph: "table", title: "Clean", at: "n", always: true }),
      line("c", [G.p(16.4, 0), G.p(18.8, 0)], { always: true }),
      drum("gold", 19.8, 0, 1, 36, { hue: "track", glyph: "chart", title: "Daily revenue", at: "n", always: true }),
      line("d", [G.p(19.8, -1), G.p(19.8, -6.4)], { always: true }),
      prism("board", 19.2, -7.6, 1.2, 1.2, 20, { hue: "sand", glyph: "doc", title: "Board report", at: "s", always: true }),
      raise(plot("rev", 0, 0, 220, 124, [0.3, 7.7], [0, 500], { title: "Revenue per day", sub: "May, thousands", xt: [1, 2, 3, 4, 5, 6, 7], xtl: ["10", "11", "12", "13", "14", "15", "16"], yt: [0, 200, 400], always: true }), TOP, 24),
      bars("bars4", ok, sky),
      bars("bad1", [...ok, 206], [...sky, "rose"]),
      bars("bad3", [...ok, 206, 199, 211], [...sky, "rose", "rose", "rose"]),
      bars("ok5", [...ok, 414], [...sky, "sky"]),
      bars("fixed", [...ok, 414, 402, 419], [...sky, "track", "track", "track"]),
      rule("held14", "rev", 5, { tone: "alert", label: "held", group: "held14" }),

      // Problem: nothing stands between the source and the report.
      raise(table("raw-tbl", 0, 0, 226, ["order", "channel", "amount"], [
        { cells: ["4468", "web", "null"], hue: "rose" }, ["4469", "store", "129.00"], { cells: ["4470", "app", "null"], hue: "rose" }, { cells: ["4471", "web", "null"], hue: "rose" },
      ], { at: [12, 74, 150], title: "Raw orders, 14 May", mono: true, group: "raw-tbl" }), LEFT, 20),

      card("c-pack", "Board pack, 16 May", [{ t: "revenue 14 May: 206k", hot: true, tone: "alert" }, "a usual day: about 410k", "sent before anyone asked"]),

      // Architecture.
      prism("contract", 5, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "shield", title: "Contract", at: "n", group: "contract" }),
      card("c-contract", "Contract: orders", [{ t: "amount: decimal, required", hot: true }, "owner: Web shop team", "arrives by 05:00 daily"], { mono: true }),

      prism("chk1", 12.4, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "check", title: "Check", at: "n", group: "chk1" }),
      prism("chk1-fail", 12.4, -0.6, 1.2, 1.2, 14, { glyph: "x", title: "Failed", at: "n", state: "alert", group: "chk1-fail" }),
      prism("chk2", 17, -0.6, 1.2, 1.2, 12, { hue: "mint", glyph: "check", tip: "Check before publish", group: "checks" }),
      line("q", [G.p(13, 0.7), G.p(13, 4.1)], { w: 3, group: "checks" }),
      drum("quar", 13, 5, 0.9, 20, { hue: "rose", glyph: "lock", title: "Quarantine", at: "s", group: "checks" }),
      card("c-tests", "Tests on raw orders", [{ t: "amount is not null", hot: true }, "order is unique", "channel is web, app or store"]),

      prism("orch", 7.4, -5.2, 1.2, 1.2, 24, { hue: "violet", glyph: "clock", title: "Orchestrator", sub: "nightly, in order", at: "n", group: "orch" }),
      line("o1", [G.p(8, -4), G.p(8, -1)], { tone: "muted", w: 3, group: "orch" }),
      card("c-run", "Run for 13 May", ["land", "check", "clean", { t: "publish 13 May only", hot: true }], { numbered: true }),
      days("parts-a", [built, built, built, fresh, empty, empty, empty]),
      days("parts-b", [built, built, built, built, fresh, empty, empty]),
      days("parts-held", [built, built, built, built, { h: 6, state: "alert" }, empty, empty]),
      days("parts-fixed", [built, built, built, built, fresh, fresh, fresh]),

      line("lf", [G.p(20.8, 0), G.p(24, 0)], { w: 3, group: "lin" }),
      prism("fin", 24, -0.6, 1.2, 1.2, 18, { hue: "sand", glyph: "doc", title: "Finance close", at: "s", group: "lin" }),
      line("ls", [G.p(19.8, 1), G.p(19.8, 4.2)], { w: 3, group: "lin" }),
      prism("store", 19.2, 4.2, 1.2, 1.2, 18, { hue: "sand", glyph: "doc", title: "Store dashboard", at: "s", group: "lin" }),
      pawn("p-plat", 10, -6, "Data team", undefined, { hue: "violet", group: "owners" }),
      pawn("p-fin", 22.6, 2.4, "Finance", undefined, { hue: "track", group: "owners" }),
      card("c-product", "Product: daily revenue", [{ t: "owner: Finance", hot: true }, "fresh by 06:00", { t: "feeds 3 reports", hot: true }]),

      // Execution.
      card("c-reject", "Schema versions", [{ t: "v2 drops amount: rejected", hot: true, tone: "alert" }, { t: "v3 adds amount_gross", hot: true }, "v3 keeps amount: accepted"]),
      card("c-fail", "Run for 14 May", ["land", { t: "check: 1,930 rows fail", hot: true, tone: "alert" }, { t: "clean: skipped", mute: true }, { t: "publish: skipped", mute: true }], { numbered: true }),
      card("c-impact", "Fed by the held batch", [{ t: "Board report: stale", hot: true }, { t: "Finance close: stale", hot: true }, { t: "Store dashboard: stale", hot: true }, "cause: field renamed"]),
      card("c-review", "Incident review", ["impact: 3 reports, 3 days late", "cause: rename, no contract", { t: "action: contract on orders", hot: true }]),
    ],
  },
  steps: [
    step({
      id: "rename", label: "A rename", kind: "problem", phase: "problem", title: "A renamed field empties half the amounts",
      caption: "The web shop team renames `amount` to `amount_gross`. The nightly load finds no `amount` on web and app orders and fills it with nothing. No step objects.",
      show: ["raw-tbl", "bad1"], counters: ["unchecked", "none", "unknown", "nobody has"],
      rides: [ride("a", 0, 0.56, "amount_gross", { then: "amount: null", tone: "alert" }), ride("d", 0, 0.5, "206k", { tone: "alert" })],
      body: ["The load reads fields by name. Under Avro schema resolution a field the reader expects and the writer no longer sends takes the reader's default, or resolution fails where there is none. Here the default is null.",
        "The data is loaded first and transformed inside the platform, so the null amounts travel through every later step.",
        { callout: { label: "The gap", text: "Every task succeeded. Nothing in the pipeline knew that amount was required." } }],
      claims: ["schema-evolution-and-data-contracts-avro-resolution", "etl-elt-definition"],
    }),
    step({
      id: "three-days", label: "Three days", kind: "problem", phase: "problem", title: "The board report halves for three days",
      caption: "Revenue is summed from what loaded. Store sales still count, so the figure looks plausible. Finance questions it on the third day, after the board pack has gone out.",
      show: ["c-pack", "bad3"], counters: ["unchecked", "none", "unknown", "3 days"],
      rides: [ride("b", 0, 0.5, "half missing", { tone: "alert" }), ride("d", 0, 0.5, "211k", { tone: "alert" })],
      body: ["Completeness is the degree to which records are present, and accuracy the degree to which data matches reality. The report fails both and no control measures either.",
        "Monitoring tools treat a table as incomplete when its row count falls below the expected range. The row count here is normal: the rows are present and one field is empty.",
        "Nobody can say which other reports read the same table."],
      claims: ["data-quality-definitions", "observability-and-incident-response-anomaly"],
    }),
    step({
      id: "contract", label: "Contract", kind: "mechanism", phase: "architecture", title: "The source publishes under a contract",
      caption: "The contract names the schema, the owner and the service level. Every new schema version is checked for compatibility before it is accepted. Accepted data lands raw, unchanged.",
      show: ["contract", "c-contract", "bars4"], counters: ["checked on every change", "none", "unknown", "at the change"],
      rides: [ride("a", 0, 0.37, "schema v1", { then: "accepted" }), ride("b", 0, 0.3, "13 May")],
      concepts: ["schema-evolution-and-data-contracts", "ingestion"],
      body: ["The Open Data Contract Standard defines a data contract as the agreement between a data producer and its consumers, with sections for schema, data quality, team, roles and service-level agreement.",
        "A schema registry compares each new schema version with the previous ones and accepts it only if the configured compatibility type allows the change.",
        "Ingestion follows ELT: the data is loaded in its raw form and transformed inside the platform."],
      claims: ["schema-evolution-and-data-contracts-odcs", "schema-evolution-and-data-contracts-compatibility", "etl-elt-definition", "elt-raw-retained"],
    }),
    step({
      id: "checks", label: "Checks", kind: "mechanism", phase: "architecture", title: "Checks stand between the layers",
      caption: "Raw data is kept as it arrived. A test selects failing rows and passes when it finds none. A failed test blocks the layers downstream, and failing rows go to quarantine.",
      show: ["contract", "chk1", "checks", "c-tests", "bars4"], counters: ["checked on every change", "2, blocking", "unknown", "at the change"],
      rides: [ride("b", 0, 0.3, "13 May", { then: "passed" }), ride("d", 0, 0.5, "405k")],
      concepts: ["data-layers", "data-quality"],
      body: ["The raw layer preserves source data with minimal transformation so later layers can be rebuilt from it. The clean layer filters, cleans and parses. The revenue layer precomputes the aggregates that reports read.",
        "A dbt data test is a select statement that seeks failing records, and it passes when it returns none. In a build, a failing test on an upstream table causes the downstream tables to skip.",
        "Failing rows can be stored and quarantined for inspection. Quality is assessed at each stage of the data lifecycle, not once at the end."],
      claims: ["data-layers-bronze", "data-layers-silver", "data-layers-gold", "data-quality-dbt-tests", "data-quality-block-or-flag", "data-quality-quarantine", "data-quality-lifecycle"],
    }),
    step({
      id: "orchestrate", label: "Orchestrator", kind: "mechanism", phase: "architecture", title: "An orchestrator runs each night in order",
      caption: "Land, check, clean, check, publish: each task runs when the one upstream has succeeded. Each run builds one day's partition and leaves the others untouched.",
      show: ["contract", "chk1", "checks", "orch", "c-run", "parts-a", "bars4"], counters: ["checked on every change", "2, run nightly in order", "unknown", "at the change"],
      rides: [ride("b", 0, 0.3, "13 May", { then: "passed" }), ride("d", 0, 0.5, "405k")],
      concepts: ["orchestration", "incremental-processing-and-materialisation"],
      body: ["Airflow arranges tasks in a graph and uses upstream and downstream dependencies to set their order. By default a task runs when its upstream tasks have succeeded.",
        "An incremental model transforms the new or changed rows on each run instead of the whole source. Treating each day as an independent, idempotent batch means a day can be built or replaced on its own.",
        "The run history lists each task's state, dates and try number."],
      claims: ["orchestration-tasks", "orchestration-run-history", "incremental-processing-and-materialisation-cost", "incremental-processing-and-materialisation-microbatch"],
    }),
    step({
      id: "owners", label: "Lineage, owners", kind: "mechanism", phase: "architecture", title: "Every table has an owner and known consumers",
      caption: "Lineage records each job's inputs and outputs. Daily revenue is a product with an owner and a freshness objective. Domains own their data, and the platform enforces the rules.",
      show: ["contract", "chk1", "checks", "orch", "lin", "owners", "c-product", "parts-a", "bars4"], counters: ["checked on every change", "2, run nightly in order", "3 reports", "at the change"],
      rides: [ride("d", 0, 0.5, "feeds"), ride("lf", 0, 0.47, "feeds"), ride("ls", 0, 0.47, "feeds")],
      concepts: ["lineage", "data-products-and-sharing", "platform-architecture-and-operating-model", "observability-and-incident-response"],
      body: ["OpenLineage models a job with its input and output datasets and each run as an instance of that job. Followed downstream, those records give the reports a table feeds.",
        "In the data mesh proposal a data product owner is responsible for the lifecycle of the product's data and schemas, and each product assures its quality as a set of service level objectives. A freshness objective states that the oldest data is no older than a set time.",
        "Ownership sits with the domains closest to the data. Governance decisions are made by a federation of product and platform owners and executed automatically by the platform."],
      claims: ["lineage-run-model", "lineage-impact", "data-products-and-sharing-owner", "data-products-and-sharing-slo", "observability-and-incident-response-slo", "platform-architecture-and-operating-model-mesh-ownership", "platform-architecture-and-operating-model-federated-governance"],
    }),
    step({
      id: "rejected", label: "Rejected", kind: "mechanism", phase: "execution", title: "The rename is rejected at the contract",
      caption: "The new version drops `amount`, which readers require. The compatibility check refuses it before any data moves. The team adds `amount_gross` beside the old field, and that version passes.",
      show: ["contract", "chk1", "checks", "orch", "lin", "owners", "c-reject", "parts-b", "ok5"], counters: ["rejected, then compatible", "2, run nightly in order", "3 reports", "before any data moves"],
      rides: [ride("a", 0, 0.37, "amount_gross", { tone: "alert", then: "rejected" }), ride("b", 0, 0.3, "14 May", { then: "passed" }), ride("d", 0, 0.5, "414k")],
      concepts: ["schema-evolution-and-data-contracts", "platform-architecture-and-operating-model"],
      body: ["Backward compatibility means consumers using the new schema can read data written with the old one, and forward compatibility the reverse. Removing a field that readers need without a default breaks resolution. Adding a field does not: a reader that does not know it ignores it.",
        "The registry checks compatibility before accepting the new version, so the decision is executed by the platform and not negotiated in an incident.",
        { callout: { label: "What held", text: "The source team was free to change its schema. It was not free to break its consumers." } }],
      claims: ["schema-evolution-and-data-contracts-compatibility", "schema-evolution-and-data-contracts-modes", "schema-evolution-and-data-contracts-avro-resolution", "platform-architecture-and-operating-model-federated-governance"],
    }),
    step({
      id: "quarantined", label: "Quarantined", kind: "watch-out", phase: "execution", title: "Without the contract, a check stops the batch",
      caption: "The renamed batch lands. The not-null test on `amount` fails, 1,930 rows go to quarantine, and the tasks downstream are skipped. The board report keeps yesterday's figure and is marked stale.",
      show: ["chk1-fail", "checks", "orch", "lin", "owners", "c-fail", "parts-held", "bars4", "held14"], counters: ["unchecked", "1 failed, publish held", "3 reports", "the same night"],
      rides: [ride("a", 0, 0.37, "renamed", { tone: "alert" }), ride("b", 0, 0.3, "14 May", { tone: "alert", then: "nulls" }), ride("q", 0, 0.4, "1,930 rows", { tone: "alert", then: "held" })],
      concepts: ["data-quality", "data-layers", "orchestration", "observability-and-incident-response"],
      body: ["not_null is one of the generic data tests that ship with dbt. Test severity is error by default, and a failure causes the downstream resources to skip.",
        "The raw layer still holds the batch as it arrived, so nothing is lost while it is held.",
        "A freshness check compares the age of the data with the agreed service level, so a report that did not update is reported as late, not left to look current."],
      claims: ["data-quality-dbt-tests", "data-quality-block-or-flag", "data-quality-quarantine", "data-layers-bronze", "orchestration-tasks", "observability-and-incident-response-freshness"],
    }),
    step({
      id: "traced", label: "Traced", kind: "mechanism", phase: "execution", title: "Lineage lists what the held batch feeds",
      caption: "The alert reaches the owner on call. Lineage walks downstream from the failing table to three reports, and upstream to the renamed field.",
      show: ["chk1-fail", "checks", "orch", "lin", "owners", "c-impact", "parts-held", "bars4", "held14"], counters: ["unchecked", "1 failed, publish held", "3 reports, all told", "the same night"],
      rides: [ride("d", 0, 0.5, "stale", { tone: "alert" }), ride("lf", 0, 0.47, "stale", { tone: "alert" }), ride("ls", 0, 0.47, "stale", { tone: "alert" })],
      concepts: ["lineage", "observability-and-incident-response", "data-products-and-sharing"],
      body: ["Lineage is a record of data being transformed from sources to targets. It helps to trace a pipeline error to its root cause and to assess the downstream impact.",
        "An alerting rule can send a notification when it fires and carry context such as a runbook link. Incident response separates command, operational work and communication, and keeps a live incident document.",
        "The product's owner decides what consumers are told and when the product is fit to publish again."],
      claims: ["observability-and-incident-response-lineage", "lineage-impact", "lineage-table-graph", "observability-and-incident-response-alerts", "observability-and-incident-response-triage", "data-products-and-sharing-owner"],
    }),
    step({
      id: "backfill", label: "Backfill", kind: "decision", phase: "execution", title: "The held days are replayed",
      caption: "",
      show: ["contract", "chk1", "checks", "orch", "lin", "owners", "c-review", "parts-fixed", "fixed"], counters: ["checked on every change", "2, run nightly in order", "3 reports, all told", "the same night"],
      rides: [ride("a", 0, 0.37, "schema v3", { then: "accepted" }), ride("b", 0, 0.3, "3 days", { then: "passed" }), ride("d", 0, 0.5, "419k")],
      concepts: ["incremental-processing-and-materialisation", "orchestration", "observability-and-incident-response"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["A contract checked on change", "Tests that block the publish", "Idempotent backfills"] },
        right: { label: "Do not rely on", items: ["Readers spotting wrong figures", "Green runs as proof", "Unwritten reviews"] },
      } },
        "A backfill creates runs for past dates. Each day is an independent batch that is replaced, not appended, so replaying it cannot double-count. A unique key makes an incremental model replace a matching row instead of adding another.",
        "A postmortem is a written record of the incident's impact, its mitigation, its causes and the follow-up actions that reduce recurrence. The run history shows which runs were replayed and when."],
      claims: ["orchestration-backfill", "incremental-processing-and-materialisation-microbatch", "incremental-processing-and-materialisation-key", "incremental-processing-and-materialisation-backfill", "observability-and-incident-response-record", "orchestration-governance"],
    }),
  ],
  governance: { text: "Every data product has an owner, a contract and a freshness objective. An incident ends with a written review.", claims: ["data-products-and-sharing-owner", "data-products-and-sharing-contract", "observability-and-incident-response-slo", "observability-and-incident-response-record"] },
  closing: {
    pitfalls: [
      "Treating a run in which every task succeeded as proof that the numbers are right.",
      "Testing only at the report, after the bad rows have been summed.",
      "Appending on a replay, so the backfill double-counts the days it repairs.",
    ],
    questions: [
      "Why did the halved figure pass for three days?",
      "Which control acts before any data moves, and which acts after it has landed?",
      "Who is told when the check fails, and how is that list produced?",
    ],
  },
});
