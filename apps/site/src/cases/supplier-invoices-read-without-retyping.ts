import { CANVAS, blocks, code, defineGuide, doc, drum, isoGrid, line, list, pawn, plot, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";

// The floor: an invoice runs down the main rail from the supplier to the reader and on to payments.
// The purchase orders stand at the front left and feed the validator from below. The clerk stands behind the validator,
// where exceptions stop, and the test set grows beside the clerk. Boards: the invoice (back left), the model's side (back centre),
// the test set and the model choice (back right), the comparison with the purchase order (front left).
const G = isoGrid(120, 150, 30);
const PAGE = G.p(2, -3.5);
const TOP = G.p(6.5, -6.5);
const RIGHT = G.p(13, -10);
const LEFT = G.p(8.5, 8.5);

const reading = (id: string, total: string, hot?: number[]) =>
  raise(code(id, 0, 0, 200, ["{ \"supplier\": \"Nordlys\",", "  \"po\": 5512,", `  "total": ${total} }`], { title: "Reading", hot, group: id }), TOP, 20);
const compare = (id: string, read: string, ok: boolean) =>
  raise(table(id, 0, 0, 232, ["field", "read", "order"], [["supplier", "Nordlys", "Nordlys"], ["po", "5512", "5512"], ok ? ["total", read, "1,480.00"] : { cells: ["total", read, "1,480.00"], hue: "rose" }],
    { at: [12, 84, 160], title: ok ? "All fields match" : "Total does not match", mono: true, group: id }), LEFT, 30);
const testSet = (id: string, n: number) =>
  blocks(id, 10.2, -7.2, 3, 0.45, Array.from({ length: n }, (_, i) => ({ h: 8, hue: i === 12 ? "track" as const : "sand" as const })), { gap: 0.15, title: "Test set", sub: n > 12 ? "413 cases" : "412 cases", at: "w", group: id });

export default defineGuide({
  id: "case-supplier-invoices-read-without-retyping", track: "case", module: "Use cases", slug: "supplier-invoices-read-without-retyping",
  title: "Supplier invoices read without retyping",
  summary: "An invoice reader is assembled piece by piece: a multimodal model call, a fixed schema, validation against the purchase order, a clerk for exceptions and a test set built from the clerk's corrections. Then two invoices run through it.",
  forLeads: "The model reads the page, and it is not what makes the payment safe. A reading is paid only when it matches the purchase order, and the clerk's corrections become the test set that decides which model does the reading.",
  status: "draft", minutes: 12,
  counters: ["Read by", "Checked against", "Reaches a clerk", "Test set"],
  whatIf: { label: "What if nothing checked the reading?", step: 3, from: 8 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Invoices, suppliers, amounts and scores are illustrative",
    label: "A supplier's invoice travels along a rail to a reader and on to the payment system. At first a Finance clerk retypes it. Later stops replace the clerk with a multimodal model, hold its reading to a schema, compare the reading with the purchase order in a validator, send exceptions to a clerk, collect the clerk's corrections as a test set and use that test set to choose a smaller model.",
    els: [
      pawn("supplier", 0, 0, "Supplier", undefined, { always: true }),
      line("m1", [G.p(1.5, 0), G.p(8.4, 0)], { always: true }),
      line("m2", [G.p(9.6, 0), G.p(20.4, 0)], { always: true }),
      prism("pay", 20.4, -0.6, 1.2, 1.2, 22, { hue: "sand", glyph: "check", title: "Payments", sub: "payment system", at: "e", always: true }),
      drum("orders", 15.5, 6, 1, 30, { hue: "sky", glyph: "table", title: "Purchase orders", sub: "what was ordered", at: "w", always: true }),
      raise(doc("inv-1", 0, 0, 178, 94, "Invoice 7731, PDF", ["Nordlys Tekstil AS", "PO 5512: 40 x RUG-1180", "Total 1,480.00"], { group: "inv-1" }), PAGE, 24),
      raise(doc("inv-2", 0, 0, 178, 94, "Invoice 7802, scan", ["Nordlys Tekstil AS", "PO 5512: 40 x RUG-1180", "Total #,480.00 (smudged)"], { tone: "alert", group: "inv-2" }), PAGE, 24),

      // Problem: a clerk retypes every invoice, and nothing compares the entry with the purchase order.
      prism("desk", 8.4, -0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "user", title: "Finance clerk", sub: "retypes each one", at: "n", group: "desk" }),
      blocks("queue", 2.9, 2, 6, 0.6, Array.from({ length: 18 }, (_, i) => ({ h: 7, hue: i < 3 ? "track" as const : "paper" as const })), { gap: 0.28, title: "2,000 invoices a month", sub: "PDFs and scans", at: "sw", group: "desk" }),
      raise(list("keyed", 0, 0, 216, ["invoice says 1,480.00", { t: "typed as 1,840.00", hot: true, tone: "alert" }, { t: "no check before payment", mute: true }], { title: "Keyed by hand", group: "keyed" }), TOP, 20),

      // Architecture.
      prism("rd", 8.4, -0.6, 1.2, 1.2, 34, { hue: "track", glyph: "net", title: "Reader", sub: "large multimodal model", at: "n", group: "rd" }),
      prism("rd2", 8.4, -0.6, 1.2, 1.2, 22, { hue: "track", glyph: "net", title: "Reader", sub: "small, fine-tuned", at: "n", group: "rd2" }),
      raise(list("call", 0, 0, 216, ["instructions", { t: "the page, as image patches", hot: true }, { t: "no earlier invoice", mute: true }], { title: "One call carries", group: "call" }), TOP, 20),
      raise(code("schema", 0, 0, 200, ["supplier: string", "po:       integer", "total:    number"], { title: "Invoice schema", keywords: ["string", "integer", "number"], group: "schema" }), TOP, 20),
      raise(list("next", 0, 0, 216, [{ t: "1     0.93", hot: true }, "7     0.05", { t: "\"about\"  masked", mute: true, strike: true }], { title: "Next token of total", mono: true, group: "schema" }), RIGHT, 20),
      reading("read-1", "1480.00"),
      reading("read-2", "7480.00", [2]),

      prism("val", 14.9, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "shield", title: "Validator", at: "s", group: "val" }),
      line("po", [G.p(15.5, 5), G.p(15.5, 0.6)], { group: "val" }),
      compare("cmp-1", "1,480.00", true),
      compare("cmp-2", "7,480.00", false),

      line("ex", [G.p(15.5, -0.7), G.p(15.5, -4.9)], { w: 3, group: "hum" }),
      pawn("clerk", 15.5, -6, "Finance clerk", undefined, { group: "hum" }),
      line("lab", [G.p(14.5, -6), G.p(12.8, -6)], { w: 3, group: "hum" }),
      testSet("tset", 12),
      testSet("tset2", 13),
      raise(table("cases", 0, 0, 232, ["invoice", "read", "correct"], [["7651", "310.00", "310.00"], ["7688", "96.50", "98.50"], ["7702", "2,204.00", "2,204.00"]], { at: [12, 84, 160], title: "Test set: input and target", mono: true, group: "cases" }), RIGHT, 20),

      raise(plot("choice", 0, 0, 236, 118, [0, 5], [88, 102], { title: "Test set score, %", xLabel: "cost per invoice", xt: [2, 4.2], xtl: ["low", "high"], yt: [90, 95, 100], group: "choice" }), RIGHT, 20),
      rule("target", "choice", 98, { axis: "y", dashed: true, group: "choice" }),
      series("tune", "choice", "line", [[2, 92], [2, 98.6]], { dashed: true, group: "choice" }),
      series("p-large", "choice", "points", [[4.2, 99.3]], { hue: "violet", r: 6, label: "large", group: "choice" }),
      series("p-small", "choice", "points", [[2, 92]], { hue: "paper", r: 6, label: "small", group: "choice" }),
      series("p-student", "choice", "points", [[2, 98.6]], { hue: "track", r: 6, group: "choice" }),
      blocks("batch", 1.8, 1.8, 4, 0.5, Array.from({ length: 8 }, () => ({ h: 7, hue: "track" as const })), { gap: 0.2, title: "Night batch", sub: "64 invoices, one run", at: "sw", group: "batch" }),

      raise(list("learn", 0, 0, 216, [{ t: "the large model's readings", hot: true }, "checked against orders", { t: "test set held back", mute: true }], { title: "The student learns from", group: "learn" }), TOP, 20),

      // Execution.
      raise(list("fix", 0, 0, 216, [{ t: "read 7,480.00", strike: true, tone: "alert" }, { t: "clerk enters 1,480.00", hot: true }, "saved as a test case"], { title: "Correction", group: "fix" }), RIGHT, 20),
      raise(list("ops", 0, 0, 216, [{ t: "413 graded invoices", hot: true }, "run on every model change", "exception rate watched"], { title: "Before a model is swapped", group: "ops" }), TOP, 20),
    ],
  },
  steps: [
    step({
      id: "retyped", label: "Retyped", kind: "problem", phase: "problem", title: "Every invoice is retyped by hand",
      caption: "Two thousand supplier invoices a month arrive as PDFs and scans. A Finance clerk keys each one into the payment system, and suppliers are paid late.",
      show: ["inv-1", "desk"], counters: ["a clerk, by hand", "nothing", "all 2,000", "none"],
      rides: [ride("m1", 0, 0.42, "invoice 7731"), ride("m2", 0, 0.72, "1,480.00")],
      body: ["A PDF or a scan is unstructured data: it fits no predefined data model or schema. The payment system needs typed fields, so a person supplies the structure by reading and typing.",
        "The purchase order already holds what was ordered and at what price. It stands beside the process and nothing consults it."],
      claims: ["structured-semi-structured-and-unstructured-data-unstructured"],
    }),
    step({
      id: "miskeyed", label: "Miskeyed", kind: "problem", phase: "problem", title: "One invoice in fifty is keyed wrongly",
      caption: "The clerk reads 1,480.00 and types 1,840.00. Nothing compares the entry with the purchase order, so the wrong amount is paid.",
      show: ["inv-1", "desk", "keyed"], counters: ["a clerk, by hand", "nothing, 1 in 50 wrong", "all 2,000", "none"],
      rides: [ride("m1", 0, 0.42, "invoice 7731"), ride("m2", 0, 0.72, "1,840.00", { tone: "alert", then: "paid 1,840" })],
      body: ["Accuracy is the degree to which data matches reality. Consistency is the degree to which values do not contradict other values representing the same entity.",
        { callout: { label: "The gap", text: "The typed total contradicts the purchase order for the same delivery, and no step looks." } }],
      claims: ["data-quality-definitions"],
    }),
    step({
      id: "model", label: "The model", kind: "mechanism", phase: "architecture", title: "A multimodal model reads the page",
      caption: "The scan goes to the model in one stateless call. The image is cut into patches that enter as tokens beside the instructions, and the answer comes back as loose text.",
      show: ["inv-1", "rd", "call"], counters: ["a large model, as text", "nothing", "none", "none"],
      rides: [ride("m1", 0, 0.42, "invoice 7731"), ride("m2", 0, 0.72, "Total: 1,480")],
      concepts: ["structured-semi-structured-and-unstructured-data", "multimodal-models", "the-model-call"],
      body: ["A multimodal model accepts image and text inputs and produces text outputs. The Vision Transformer splits an image into patches and treats them the way a language model treats tokens. Models such as LayoutLM were built to extract information from scanned documents by modelling text and layout together.",
        "The call is stateless. Each request carries the instructions and one page, and nothing from the previous invoice.",
        "The page has no fields until something extracts them, and a sentence of text is not yet a record a payment system can load."],
      claims: ["multimodal-models-inputs", "multimodal-models-patches", "multimodal-models-layoutlm", "the-model-call-stateless", "structured-semi-structured-and-unstructured-data-unstructured", "structured-semi-structured-and-unstructured-data-schema-first"],
    }),
    step({
      id: "schema", label: "Schema", kind: "mechanism", phase: "architecture", title: "The reading is held to a fixed schema",
      caption: "The model writes one token at a time. A JSON Schema masks every token that would break the shape, so each reading parses into the same typed fields.",
      show: ["inv-1", "rd", "schema"], counters: ["a large model, into a schema", "the schema's shape", "none", "none"],
      rides: [ride("m1", 0, 0.42, "invoice 7731"), ride("m2", 0, 0.72, "total: 1480.00")],
      concepts: ["structured-output", "generation-and-sampling"],
      body: ["Generation is autoregressive: each step turns the model's output into probabilities for the next token and one is chosen. A temperature below 1 skews the choice towards high-probability tokens.",
        "Structured outputs compile the JSON Schema into a grammar. At each sampling step the tokens that would be invalid under the schema are masked, which lowers their probability to 0.",
        "A refusal or a response cut off at the token limit may still not match the schema, so the application checks the stop reason."],
      claims: ["generation-and-sampling-autoregressive", "generation-and-sampling-settings", "structured-output-definition", "structured-output-constrained-decoding", "structured-output-json-schema", "structured-output-invalid"],
    }),
    step({
      id: "validate", label: "Validation", kind: "mechanism", phase: "architecture", title: "Values are validated against the purchase order",
      caption: "A schema fixes the shape, and the values can still be wrong. Supplier, order number and total are compared with the purchase order before anything is paid.",
      show: ["inv-1", "rd", "read-1", "val", "cmp-1"], counters: ["a large model, into a schema", "schema and purchase order", "none", "none"],
      rides: [ride("m2", 0.08, 0.3, "1480.00"), ride("po", 0, 0.4, "PO 5512"), ride("m2", 0.77, 0.82, "match")],
      concepts: ["hallucination-and-model-limits", "data-quality"],
      body: ["With structured outputs the model may still make mistakes within the values of the JSON object. NIST uses the term confabulation for a generative system that confidently presents erroneous content.",
        "The validator tests validity, that each value is in the range and format expected, and consistency, that the reading does not contradict the purchase order for the same delivery.",
        "Techniques reduce invented values and do not eliminate them, so critical information is always validated."],
      claims: ["structured-output-values", "hallucination-and-model-limits-confabulation", "hallucination-and-model-limits-not-eliminated", "data-quality-definitions", "structured-output-zero-trust"],
    }),
    step({
      id: "clerk", label: "Exceptions", kind: "mechanism", phase: "architecture", title: "Exceptions stop at a clerk",
      caption: "A failed check or a low confidence reading waits for a clerk. Each correction is a label, and the corrected invoices become the test set that grades the reader.",
      show: ["inv-1", "rd", "val", "hum", "tset", "cases", "read-1"], counters: ["a large model, into a schema", "schema and purchase order", "failures and low confidence", "412 corrected invoices"],
      rides: [ride("ex", 0, 0.5, "exception"), ride("lab", 0, 0.3, "label")],
      concepts: ["agent-authority-and-human-oversight", "labels-and-ground-truth", "evaluating-model-output"],
      body: ["Failing records are quarantined, not passed on. Releasing a payment is a high-impact action, and the control is enforced in the payment path, not left to the model.",
        "Running the same prompt several times and comparing the outputs is a documented check: inconsistencies could indicate an invented value. Two readings that disagree count here as low confidence.",
        "A label supplied by a person who examined the page is human-generated ground truth. A test set pairs each input with its target, and a grader scores the reader's output against it."],
      claims: ["data-quality-quarantine", "agent-authority-and-human-oversight-mediation", "agent-authority-and-human-oversight-approval", "hallucination-and-model-limits-compare-runs", "labels-and-ground-truth-made", "labels-and-ground-truth-truth", "evaluating-model-output-dataset", "evaluating-model-output-eval"],
    }),
    step({
      id: "choice", label: "Model choice", kind: "mechanism", phase: "architecture", title: "The test set chooses the model",
      caption: "A small model fine-tuned on the large model's checked readings scores as well on the test set, costs less, and is served in batches overnight.",
      show: ["inv-1", "rd2", "val", "hum", "tset", "choice", "batch", "learn"], counters: ["a small model, fine-tuned", "schema and purchase order", "failures and low confidence", "412, picks the model"],
      rides: [ride("tune", 0, 1, "student"), ride("m1", 0, 0.42, "batch of 64")],
      concepts: ["cost-latency-and-model-choice", "fine-tuning-and-distillation", "model-serving", "evaluating-model-output"],
      body: ["Choosing a model balances capability, speed and cost, and the documented way to decide is a benchmark specific to the use case, run with actual data.",
        "Distillation transfers knowledge from a larger teacher to a smaller, cheaper student: the teacher's responses become the fine-tuning data. Supervised fine-tuning adjusts the model's parameters on labelled examples. A distilled model is generally not quite as good as its teacher, which is why the score is measured.",
        "Invoices do not need an immediate answer. A server that combines requests into batches raises throughput at the price of latency."],
      claims: ["cost-latency-and-model-choice-criteria", "cost-latency-and-model-choice-test-switch", "fine-tuning-and-distillation-distil", "fine-tuning-and-distillation-distil-how", "fine-tuning-and-distillation-sft", "fine-tuning-and-distillation-distil-cost", "model-serving-dynamic-batching", "model-serving-server", "cost-latency-and-model-choice-batch"],
    }),
    step({
      id: "clean", label: "A clean invoice", kind: "mechanism", phase: "execution", title: "A clean invoice is paid untouched",
      caption: "Invoice 7731 is read into the schema. Supplier, order 5512 and total 1,480.00 match the purchase order, and the payment is released without a keystroke.",
      show: ["inv-1", "rd2", "val", "hum", "tset", "read-1", "cmp-1"], counters: ["a small model, fine-tuned", "schema and purchase order", "exceptions only", "412 corrected invoices"],
      rides: [ride("m1", 0, 0.42, "invoice 7731"), ride("m2", 0.08, 0.3, "1480.00"), ride("po", 0, 0.4, "PO 5512"), ride("m2", 0.77, 0.82, "paid")],
      concepts: ["multimodal-models", "structured-output", "data-quality"],
      body: ["The reading is schema-compliant by construction, so the validator never handles a parsing error. What it tests is the content.",
        "Quality is assessed at each stage of the data lifecycle: here, at the moment the reading enters Finance's records."],
      claims: ["structured-output-definition", "multimodal-models-layoutlm", "data-quality-lifecycle"],
    }),
    step({
      id: "smudged", label: "A smudged scan", kind: "watch-out", phase: "execution", title: "A smudged total is caught",
      caption: "The model reads 7,480.00 where the page says 1,480.00. The purchase order disagrees, the payment is held, and a clerk corrects it. The test set gains a case.",
      show: ["inv-2", "rd2", "val", "hum", "tset2", "read-2", "cmp-2", "fix"], counters: ["a small model, fine-tuned", "schema and purchase order", "this invoice", "413 corrected invoices"],
      rides: [ride("m2", 0.08, 0.3, "7480.00", { tone: "alert", then: "held" }), ride("ex", 0, 0.5, "7,480.00?", { tone: "alert", then: "1,480.00" }), ride("lab", 0, 0.3, "label"), ride("m2", 0.77, 0.82, "paid")],
      concepts: ["hallucination-and-model-limits", "data-quality", "agent-authority-and-human-oversight", "labels-and-ground-truth"],
      body: ["The reading is valid JSON with a number in the total field. The model filled an unreadable digit with a plausible one and presented it with the same confidence as the rest.",
        "Risks from confabulation arise when false content is believed and acted on, and they matter most where a consequential decision depends on the output.",
        { callout: { label: "What held", text: "The model was wrong. The payment system was not asked until a person had looked." } }],
      claims: ["hallucination-and-model-limits-risk", "hallucination-and-model-limits-statistical", "structured-output-values", "data-quality-quarantine", "agent-authority-and-human-oversight-approval", "labels-and-ground-truth-made"],
    }),
    step({
      id: "release", label: "Operate", kind: "decision", phase: "execution", title: "What releases a payment",
      caption: "",
      show: ["inv-1", "rd2", "val", "hum", "tset2", "ops", "batch"], counters: ["a small model, fine-tuned", "schema and purchase order", "exceptions only", "413, run on each change"],
      rides: [ride("m1", 0, 0.42, "batch of 64"), ride("m2", 0, 0.82, "paid", { via: [0.3] })],
      concepts: ["evaluating-model-output", "cost-latency-and-model-choice", "agent-authority-and-human-oversight"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["A purchase order match", "A clerk on exceptions", "Tests on every model change"] },
        right: { label: "Do not rely on", items: ["The model's reading alone", "Valid JSON", "A confident tone"] },
      } },
        "Automated evaluations run on each change and each model upgrade. Providers retire older models, so the reader will be swapped, and the test set is what shows whether the replacement still reads invoices correctly.",
        "The risk of an approval step is a person who over-relies on the system's suggestion and approves without independent validation. The clerk checks against the page and the purchase order, not against the model."],
      claims: ["evaluating-model-output-every-change", "evaluating-model-output-regression", "cost-latency-and-model-choice-retirement", "cost-latency-and-model-choice-test-switch", "agent-authority-and-human-oversight-trust-exploitation", "structured-output-values"],
    }),
  ],
  governance: { text: "A payment is never released on a model's reading alone. Totals are validated against the purchase order, and exceptions go to a person.", claims: ["hallucination-and-model-limits-not-eliminated", "agent-authority-and-human-oversight-mediation", "agent-authority-and-human-oversight-approval"] },
  closing: {
    pitfalls: [
      "Treating valid JSON as proof that the values are right.",
      "Fine-tuning on the same corrected invoices that grade the model.",
      "Letting the clerk approve the model's reading without looking at the page.",
    ],
    questions: [
      "Which part of the system knows what the total should be?",
      "Why does the schema not catch the smudged total?",
      "What would have to be true before a cheaper model replaces the reader?",
    ],
  },
});
