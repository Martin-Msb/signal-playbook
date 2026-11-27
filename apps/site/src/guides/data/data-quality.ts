import { blocks, CANVAS, defineGuide, isoGrid, line, pawn, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt, Row } from "@signal-path/engine";

// The floor: one batch of eight orders drawn as blocks, one row of four blocks per order and one colour per field.
// Four orders carry a defect: a blank amount, a repeated order, a channel outside the allowed set and a late load.
// The dimensions light those cells. Entry tests stand after the landed batch, the failing rows leave on a red spur
// to the quarantine area, and the passing rows continue into the orders model, which is tested again before Finance.
const G = isoGrid(335, 110, 26);
const SIZE = 0.9, GAP = 0.15, PITCH = SIZE + GAP, H = 18, TALL = 30, R = 7, GATE = 10.5, MODEL = 12.8, QX = 12.2, QY = 9.2;
const FIELDS: { k: string; hue: Hue }[] = [{ k: "order", hue: "sand" }, { k: "channel", hue: "mint" }, { k: "amount", hue: "sky" }, { k: "loaded", hue: "violet" }];
const ROWS = [
  ["4468", "store", "129", "on time"], ["4469", "web", "", "on time"], ["4470", "app", "899", "on time"], ["4470", "app", "899", "on time"],
  ["4471", "store", "349", "on time"], ["4472", "fax", "1290", "on time"], ["4473", "web", "2100", "on time"], ["4474", "web", "450", "2 d late"],
];
/** The defective field of each failing order, by row. */
const BAD: Record<number, number> = { 1: 2, 3: 0, 5: 1, 7: 3 };
const FAILING = Object.keys(BAD).map(Number), PASSING = ROWS.map((_, k) => k).filter((k) => !(k in BAD));
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], Math.round(G.p(gx, gy)[1] - dy)];
type Mode = "raw" | "lit" | "split";
const cell = (k: number, f: number, mode: Mode) =>
  mode === "split" && k in BAD ? { h: H, state: "closed" as const }
    : BAD[k] === f && mode === "raw" && f === 2 ? { h: H, state: "closed" as const }
      : BAD[k] === f && mode !== "raw" ? { h: TALL, state: "alert" as const }
        : { h: H, hue: FIELDS[f].hue };
/** The landed batch in one state: defects unmarked, lit by the dimensions, or with the failing rows moved out. */
const batch = (mode: Mode): El =>
  blocks(`batch-${mode}`, 0, 0, 4, SIZE, ROWS.flatMap((_, k) => FIELDS.map((_f, f) => cell(k, f, mode))), { dir: "gy", gap: GAP, group: mode });
const rows = (ks: number[], gx: number, gy: number, id: string, group: string, lit: boolean, z?: number): El =>
  blocks(id, gx, gy, 4, SIZE, ks.flatMap((k) => FIELDS.map((fl, f) => (lit && BAD[k] === f ? { h: TALL, state: "alert" as const } : { h: H, hue: fl.hue }))), { dir: "gy", gap: GAP, group, z });
const VALUES: Pt = [808, 258];
const values = (mode: Mode, sub: string): El =>
  raise(table(`values-${mode}`, 0, 0, 280, FIELDS.map((f) => f.k), ROWS.map((cells, k): Row => ({ cells, hue: mode === "lit" && k in BAD ? "rose" : undefined, strike: mode === "split" && k in BAD })),
    { at: [12, 72, 148, 208], columnHues: FIELDS.map((f) => f.hue), rowH: 20, title: "Orders batch", sub, mono: true, group: `values-${mode}` }), VALUES, 28);
/** A card in the front left corner, its left edge 10 pixels from the canvas edge. */
const card = (id: string, title: string, sub: string, cols: string[], at: number[], body: Row[], w: number): El =>
  raise(table(id, 0, 0, w, cols, body, { at, rowH: 24, title, sub, group: id }), [10 + w / 2, 526], 26);
/** A mark on one defective cell: the defect itself at first, then the dimension that catches it. */
const DEFECTS: [number, string, string][] = [[1, "no amount", "completeness"], [3, "4470 again", "uniqueness"], [5, "channel fax", "validity"], [7, "2 d late", "timeliness"]];
const marks = (group: string, named: boolean): El[] => DEFECTS.map(([k, defect, dimension], i) =>
  pill(`${group}-${k}`, [390 + i * 54, 56 + i * 34], named ? dimension : defect,
    { anchor: "start", tone: named ? "alert" : undefined, mono: !named, to: up(k * PITCH + SIZE / 2, BAD[k] * PITCH + SIZE / 2, named ? TALL : H), group }));

export default defineGuide({
  id: "data-quality", track: "data", module: "Transformation", slug: "data-quality",
  title: "Data quality",
  summary: "Quality is a set of testable expectations on accuracy, completeness, consistency, validity, uniqueness and timeliness, checked where data enters and where it is published.",
  forLeads: "Name the expectations that make a dataset fit for its use, test them where the data enters and where it is published, and give every rule an owner and an agreed action on failure.",
  status: "draft", minutes: 7,
  counters: ["Expectations", "Tested at", "Failing rows", "Rule owners"],
  whatIf: { label: "What if nothing tested the batch?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, rules and owners are illustrative",
    label: "A batch of eight orders is drawn as blocks on the floor, one row of four blocks per order: order, channel, amount and load time. A rail runs from Checkout past the batch to Finance. Four orders carry a defect: a blank amount, a repeat of order 4470, the channel fax and a load two days late. At first nothing tests them. Then the cells turn red and each is named by the quality dimension that catches it: completeness, uniqueness, validity and timeliness. Entry tests stand after the landed batch. The four failing rows leave on a red spur to a quarantine area and the four passing rows continue into the orders model. Publication tests stand between the model and Finance. At the last stop a contract card names the owner of each rule and the action on failure, and a data steward reviews the quarantined rows.",
    els: [
      line("rail", [G.p(-3.2, R), G.p(23, R)], { always: true }),
      stop("s-in", ...G.p(-2.6, R), undefined, undefined, { always: true }),
      stop("s-batch", ...G.p(2.6, R), undefined, undefined, { always: true }),
      stop("s-test", ...G.p(8.7, R), undefined, undefined, { always: true }),
      stop("s-gate", ...G.p(GATE, R), undefined, undefined, { always: true }),
      stop("s-model", ...G.p(14.4, R), undefined, undefined, { always: true }),
      stop("s-pub", ...G.p(18, R), undefined, undefined, { always: true }),
      stop("s-fin", ...G.p(20.3, R), undefined, undefined, { always: true }),
      prism("co", -4.4, R - 0.6, 1.2, 1.2, 30, { hue: "track", glyph: "pen", title: "Checkout", at: "n", always: true }),
      prism("fin", 22.8, R - 0.6, 1.2, 1.2, 30, { glyph: "chart", title: "Finance", sub: "amount by channel", at: "e", always: true }),

      // the landed batch, one state per stage of the story
      batch("raw"), batch("lit"), batch("split"),
      pill("batch-l", [296, 28], "Orders batch", { sub: "as landed", always: true }),
      ...marks("defects", false), ...marks("dims", true),
      values("raw", "8 rows, 4 fields"), values("lit", "4 rows break a rule"), values("split", "4 rows quarantined"),

      // 2. the six dimensions as rules on this batch
      card("c-dims", "Expectations", "one rule per dimension", ["dimension", "rule", "caught"], [12, 108, 240],
        [["completeness", "amount present", "1"], ["uniqueness", "one row per order", "1"], ["validity", "channel in set", "1"], ["timeliness", "loaded in a day", "1"], ["consistency", "amount = lines", "0"], ["accuracy", "amount = payment", "0"]], 296),

      // 3. tests where the batch enters
      prism("entry", GATE - 0.6, R - 1.7, 1.2, 1.2, 24, { hue: "track", glyph: "check", group: "entry" }),
      pill("entry-l", [594, 200], "Entry tests", { to: up(GATE + 0.45, R - 1.55, 24), group: "entry" }),
      card("c-entry", "Entry tests", "rows returned", ["test", "column", "fails"], [12, 138, 216],
        [["not_null", "amount", "1"], ["unique", "order", "1"], ["accepted_values", "channel", "1"], ["loaded late", "loaded", "1"]], 262),

      // 4. failing rows leave for quarantine, passing rows continue into the model
      line("spur", [G.p(GATE, R), G.p(GATE, 13.3)], { tone: "alert", group: "quar" }),
      stop("s-q", ...G.p(GATE, 12.7), undefined, undefined, { group: "quar" }),
      slab("q-floor", QX - 0.25, QY - 0.25, 4 * PITCH + 0.35, 4 * PITCH + 0.35, undefined, { hue: "rose", group: "quar" }),
      rows(FAILING, QX, QY, "q-rows", "quar", true, 10),
      pill("q-l", [326, 506], "Quarantine", { group: "quar" }),
      rows(PASSING, MODEL, 0, "model", "model", false),
      pill("model-l", [786, 316], "Orders model", { sub: "4 passing rows", anchor: "start", group: "model" }),
      card("c-quar", "Quarantine", "held for review", ["order", "reason"], [12, 96],
        [["4469", "amount missing"], ["4470", "repeated"], ["4472", "channel fax"], ["4474", "2 d late"]], 232),

      // 5. tests where the model is published
      prism("pub", 17.4, R + 0.9, 1.2, 1.2, 24, { hue: "track", glyph: "check", title: "Publication tests", sub: "on the model", at: "s", group: "pub" }),
      card("c-pub", "Publication tests", "severity decides", ["check", "severity", "result"], [12, 118, 204],
        [["contract", "enforced", "pass"], ["unique", "error", "pass"], ["not_null", "error", "pass"], ["amount > 0", "warn", "pass"]], 260),

      // 6. the contract names the owner of each rule, and a steward reviews what failed
      raise(table("contract", 0, 0, 308, ["rule", "owner", "on failure"], [["amount present", "Finance", "block"], ["one row per order", "data team", "block"], ["channel in set", "Operations", "block"], ["loaded in a day", "data team", "flag"]],
        { at: [12, 144, 226], rowH: 24, title: "Orders contract", sub: "rules and owners", group: "contract" }), [796, 258], 28),
      pawn("steward", 7.2, 12.8, "Data steward", "reviews 4 rows", { hue: "track", side: "w", group: "steward" }),
    ],
  },
  steps: [
    step({
      id: "untested", label: "No tests", kind: "problem", title: "Defects in a batch reach Finance unseen",
      caption: "Eight orders land from Checkout. One has no amount, one repeats order 4470, one names a channel that does not exist and one loaded two days late. Nothing tests them.",
      show: ["raw", "defects", "values-raw"], counters: ["none", "nowhere", "4, unseen", "none"],
      rides: [ride("rail", "s-in", "s-fin", "4469 blank", { via: ["s-batch"] })],
      body: ["The batch has eight rows and four fields. The values are illustrative. Each defect is small and none stops the load, so Finance sums a blank, counts order 4470 twice and reports a channel that Vinterhus does not have.",
        "The UK Government Data Quality Framework describes data quality as fitness for purpose: whether a dataset is good enough for its intended use."],
      claims: ["data-quality-dimensions"],
    }),
    step({
      id: "dimensions", label: "Dimensions", kind: "idea", title: "Each quality dimension is a testable expectation",
      caption: "Completeness, uniqueness, validity and timeliness each catch one cell of this batch. Consistency and accuracy find nothing here. Each is written as a rule that a query can check.",
      show: ["lit", "dims", "values-lit", "c-dims"], counters: ["six", "nowhere", "4, marked", "none"],
      rides: [ride("rail", "s-in", "s-batch", "8 rows", { then: "4 defects" })],
      body: ["The UK Government Data Quality Framework names six core dimensions, as defined by DAMA UK. Completeness is the degree to which records are present. Uniqueness is the degree to which there is no duplication in records. Validity is the degree to which data is in the range and format expected. Consistency is the degree to which values do not contradict other values representing the same entity. Accuracy is the degree to which data matches reality. Its timeliness example is a change entered after three days against a two day agreement.",
        "The framework says the list is not prescriptive. The rules on the card are this batch's reading of each dimension.",
        { callout: { label: "Key idea", text: "A dimension becomes useful when it is written as a rule on named fields with a pass condition. Until then it is an intention." } }],
      claims: ["data-quality-dimensions", "data-quality-definitions"],
    }),
    step({
      id: "entry", label: "Entry tests", kind: "mechanism", title: "Tests run where the batch enters",
      caption: "A dbt data test is a query that returns the rows breaking its rule. Great Expectations and Soda state the same rules as expectations and contract checks. Four of eight rows fail.",
      show: ["lit", "dims", "entry", "values-lit", "c-entry"], counters: ["six", "entry", "4, found", "none"],
      rides: [ride("rail", "s-batch", "s-test", "8 rows", { then: "4 fail" })],
      body: ["dbt data tests are assertions about models and other resources, including sources. Each is a select statement that seeks failing records and passes when it returns zero rows. dbt ships with four generic tests: unique, not_null, accepted_values and relationships. dbt can also capture the freshness of a source table and report a pass, warning or error against thresholds.",
        "Great Expectations defines an Expectation as a verifiable assertion about data and an Expectation Suite as a collection of Expectations that describe the ideal state of a set of data, validated against a Batch.",
        "A Soda data contract is a YAML document that contains data quality checks, with check types that include missing, invalid, duplicate, freshness, schema and failed rows.",
        "The UK Government Data Quality Framework says quality assessment and assurance should take place at each stage of the data lifecycle."],
      claims: ["data-quality-dbt-tests", "data-quality-dbt-sources", "data-quality-gx", "data-quality-soda", "data-quality-lifecycle"],
    }),
    step({
      id: "quarantine", label: "Quarantine", kind: "mechanism", title: "Failing rows go to quarantine",
      caption: "The four failing rows move to a quarantine table, each with its reason. The four passing rows continue into the orders model.",
      show: ["split", "entry", "quar", "model", "values-split", "c-quar"], counters: ["six", "entry", "4, quarantined", "none"],
      rides: [ride("spur", "s-gate", "s-q", "4 fail", { tone: "alert" }), ride("rail", "s-gate", "s-model", "4 pass")],
      body: ["Quarantine keeps the failing rows out of the model without losing them. Great Expectations documents retrieving all failing rows of an UnexpectedRowsExpectation and gives quarantining bad records as the example use. In dbt, store_failures saves the records that failed a test in a table with the name of the test.",
        { callout: { label: "Key idea", text: "A quarantined row is a question for someone. The quarantine table needs a reader as much as the model does." } }],
      claims: ["data-quality-quarantine"],
    }),
    step({
      id: "publication", label: "Publication", kind: "watch-out", title: "A warning does not stop publication",
      caption: "The model is tested again before Finance reads it. A model that breaks its enforced contract does not build, and a failed test makes downstream models skip. A test set to warn only reports.",
      show: ["split", "entry", "quar", "model", "pub", "values-split", "c-pub"], counters: ["six", "entry, publication", "4, quarantined", "none"],
      rides: [ride("rail", "s-model", "s-fin", "4 rows", { via: ["s-pub"], then: "published" })],
      body: ["A dbt model contract defines the shape of the returned dataset. When it is enforced it must include every column's name and data type, and a model that does not conform does not build. dbt describes data tests as the more flexible mechanism, validating the content of a model after it is built.",
        "In dbt build, tests on upstream resources block downstream resources from running, and a test failure causes those resources to skip. Severity is error by default. A test with severity warn only returns a warning, so the data is published and the failure is flagged."],
      claims: ["data-quality-contract", "data-quality-block-or-flag"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Every rule has an owner and an action",
      caption: "",
      show: ["split", "entry", "quar", "model", "pub", "contract", "steward"], counters: ["six", "entry, publication", "4, under review", "named"],
      rides: [ride("rail", "s-pub", "s-fin", "4 rows")],
      body: [{ pair: {
        left: { label: "Name", items: ["An owner for each rule", "A steward to review quarantine"] },
        right: { label: "On failure", items: ["Block publication", "Or flag and publish"] },
      } },
        "GOV.UK's data ownership model describes a data owner as a senior individual with dedicated accountabilities for data, who ensures that the quality of the data is known. Data stewards are responsible for day-to-day operational activities, including data quality processes such as monitoring, investigating, triaging, remediating and reporting.",
        "The owners on the contract card are illustrative. The contract records, for each rule, who decides what it requires and whether a failure blocks the model or is only flagged."],
      claims: ["data-quality-ownership", "data-quality-block-or-flag"],
    }),
  ],
  governance: { text: "Each rule has a named owner who is accountable for the quality of the data, and a steward monitors and investigates what fails. The contract states whether a failure blocks publication or is flagged.", claims: ["data-quality-ownership", "data-quality-block-or-flag"] },
  closing: {
    pitfalls: [
      "Reading a passing test suite as proof that the data is accurate for every use.",
      "Setting every test to warn, so nothing that fails is ever stopped.",
      "Filling a quarantine table that nobody is named to review.",
    ],
    questions: [
      "Which dimension does each rule on the orders batch express?",
      "Which rules run at entry, and which run again at publication?",
      "Who owns each rule, and does its failure block or flag?",
    ],
  },
});
