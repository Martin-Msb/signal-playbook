import { CANVAS, defineGuide, drum, isoGrid, line, pawn, prism, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(150, 155, 30);
const R = 0;
const checkCard = (id: string, group: string, title: string, sub: string, rows: (string[] | { cells: string[]; hot?: boolean })[]) =>
  raise(table(id, 0, 0, 350, ["expectation", "example"], rows, { at: [150], rowH: 25, title, sub, group }), G.p(11, -4), 34);

export default defineGuide({
  id: "data-quality", track: "data", module: "Transformation", slug: "data-quality",
  title: "Data quality",
  summary: "Quality is a set of testable expectations on accuracy, completeness, consistency, validity, uniqueness and timeliness, checked where data enters and where it is published.",
  forLeads: "Name the expectations that make a dataset fit for its use, test them at the points where data changes, and agree who acts when a rule fails.",
  status: "draft", minutes: 7,
  counters: ["Expectations", "Passing rows", "Failed rows", "Owner"],
  whatIf: { label: "What if the rules ran only after publication?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and quality rules are illustrative",
    label: "Orders travel from Checkout through a quality check to Finance. A check card names quality expectations and examples. A failing order leaves the main line for quarantine; a passing order continues to publication. A named data owner sets the rules and a steward investigates failures.",
    els: [
      line("orders", [G.p(3, R), G.p(20, R)], { always: true }),
      line("failed", [G.p(11, R), G.p(11, 2), G.p(19, 2)], { tone: "alert", group: "quarantine" }),
      stop("received", ...G.p(3, R), undefined, undefined, { always: true }),
      stop("validated", ...G.p(11, R), undefined, undefined, { always: true }),
      stop("published", ...G.p(19, R), undefined, undefined, { always: true }),
      stop("held", ...G.p(19, 2), undefined, undefined, { group: "quarantine" }),
      prism("checkout", 1, -2, 1.4, 1.4, 30, { hue: "track", glyph: "table", title: "Checkout", sub: "orders arrive", at: "n", always: true }),
      drum("finance", 18, -4, 1, 34, { hue: "sky", glyph: "table", title: "Orders", sub: "published", at: "e", always: true }),
      drum("hold-store", 23, 0, 1, 30, { hue: "rose", glyph: "table", title: "Quarantine", sub: "review failing rows", at: "n", group: "quarantine" }),
      checkCard("dimensions", "dimensions", "Quality expectations", "context sets the rule", [
        ["accuracy", "matches source"], ["completeness", "amount present"], ["consistency", "totals agree"],
        ["validity", "known status"], ["uniqueness", "one order id"], ["timeliness", "recent update"],
      ]),
      checkCard("dbt-tests", "dbt", "dbt data tests", "test the model", [
        ["order_id", "unique, not null"], ["status", "accepted values"], ["customer_id", "relationship"],
      ]),
      checkCard("gx-suite", "gx", "Expectation Suite", "Great Expectations", [
        ["assertions", "grouped for orders"], ["validation", "against a batch"], ["unexpected rows", "return for review"],
      ]),
      checkCard("soda-contract", "soda", "Data contract", "Soda", [
        ["schema", "field names and types"], ["quality", "agreed constraints"], ["response", "block or flag"],
      ]),
      pawn("owner", 13, -11, "Data owner", undefined, { hue: "track", group: "governance" }),
    ],
  },
  steps: [
    step({
      id: "unmeasured", label: "No checks", kind: "problem", title: "A published order can look complete and still be wrong",
      caption: "Order 4471 has a blank amount and a repeated identifier. Finance receives it because nothing checks the rows before publication.",
      show: [], counters: ["none", "unknown", "unknown", "none"],
      rides: [ride("orders", "received", "published", "4471: blank amount")],
      body: ["Illustrative order values show a failure that a pipeline could miss without explicit expectations. A quality check compares data with a rule that can be evaluated."],
      claims: ["data-quality-measurable"],
    }),
    step({
      id: "dimensions", label: "Expectations", kind: "idea", title: "Quality is a set of expectations for a use",
      caption: "The team names accuracy, completeness, consistency, validity, uniqueness and timeliness, then states how each applies to orders.",
      show: ["dimensions"], counters: ["six", "unknown", "unknown", "none"],
      rides: [ride("orders", "received", "validated", "4471: blank amount")],
      body: ["The W3C Data Quality Vocabulary lists multiple quality dimensions and says the appropriate approach varies by domain and application. The expectations on the card are examples for this order dataset, not a universal standard."],
      claims: ["data-quality-context", "data-quality-dimensions"],
    }),
    step({
      id: "test", label: "Test", kind: "mechanism", title: "A data test returns the rows that break its rule",
      caption: "dbt tests check uniqueness, missing values, accepted values and relationships. The duplicate order fails, so it leaves the route for investigation.",
      show: ["dbt", "quarantine"], counters: ["six", "one", "one", "none"],
      rides: [ride("failed", "validated", "held", "4471: duplicate")],
      body: ["dbt defines data tests as assertions on models. Its built-in generic tests include unique, not_null, accepted_values and relationships. A test query returns the records that disprove its assertion; zero failing rows means the assertion passes."],
      claims: ["data-quality-dbt-tests"],
    }),
    step({
      id: "suite", label: "Validate", kind: "mechanism", title: "Group related expectations into a validation suite",
      caption: "Great Expectations groups assertions for one dataset, validates a batch, and can return unexpected rows for a quarantine table.",
      show: ["gx", "quarantine"], counters: ["six", "one", "one", "none"],
      rides: [ride("failed", "validated", "held", "4471: blank amount")],
      body: ["An Expectation is a verifiable assertion about data. Great Expectations defines an Expectation Suite as a collection of Expectations describing the ideal state of a dataset. Its unexpected-row retrieval returns failing rows that can be written to a quarantine table."],
      claims: ["data-quality-gx", "data-quality-quarantine"],
    }),
    step({
      id: "contract", label: "Enforce", kind: "watch-out", title: "A check needs an agreed response",
      caption: "Soda describes data contracts as shared expectations and testing as a way to prevent failing data reaching downstream systems.",
      show: ["soda", "governance"], counters: ["six", "one", "one", "Operations"],
      rides: [ride("orders", "received", "validated", "4472: valid")],
      body: ["A failed check does not decide what a consumer should do. The owner and consumers agree whether a failure blocks a publish, raises an alert or routes rows for review. Soda's documentation describes contracts as agreements between producers and consumers."],
      claims: ["data-quality-soda", "data-quality-ownership"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Set the expectation and the action together",
      caption: "",
      show: ["soda", "governance"], counters: ["use-specific", "pass threshold", "quarantine", "Operations"],
      rides: [ride("orders", "validated", "published", "4472: passed")],
      body: [{ pair: {
        left: { label: "Define", items: ["Rule and threshold for each use", "Owner who approves the rule"] },
        right: { label: "On failure", items: ["Block or flag publication", "Review and resolve the failed rows"] },
      } }, "A data owner is accountable for the quality and appropriate use of the data. Data stewards carry out day-to-day quality monitoring, investigation, triage and remediation."],
      claims: ["data-quality-ownership"],
    }),
  ],
  governance: { text: "A data owner is accountable for the quality and intended use of the dataset. A steward monitors and investigates failures, and the owner agrees whether a failed check blocks publication or flags the data for review.", claims: ["data-quality-ownership"] },
  closing: {
    pitfalls: [
      "Calling every passing test proof that data is accurate for every use.",
      "Treating a failed check as resolved without investigating its rows.",
      "Publishing an agreed contract without naming who acts when it fails.",
    ],
    questions: [
      "Which user decision does each expectation protect?",
      "Which failures block publication and which are flagged for review?",
      "Who owns the expectations and investigates failures?",
    ],
  },
});
