import { CANVAS, cells, code, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Pt } from "@signal-path/engine";

// The floor: a V of rail with the model at its foot. The left arm carries the request from the refund assistant
// down to the model. The right arm carries the model's output up to the refund system, the software that must parse it.
// The schema stands above the left arm, the output above the right arm, and the candidate next tokens above the model.
// The validator stands beside the right arm, and the order record it checks against stands in front.
const G = isoGrid(480, 410, 30);
const ARM = 11.5, CHECK = 5.6, REST = 8.5, NEAR = 2.6;
const SCHEMA: Pt = [200, 210], OUT: Pt = [778, 196], NEXT: Pt = [466, 306], ORDER: Pt = [852, 504];
const output = (id: string, sub: string, lines: string[], hot: number[] = []): El =>
  raise(code(id, 0, 0, 216, lines, { title: "Model output", sub, hot, group: id }), OUT, 30);

export default defineGuide({
  id: "structured-output", track: "ai", module: "The model call", slug: "structured-output",
  title: "Structured output",
  summary: "Software cannot parse a sentence. A JSON Schema states the shape it expects, constrained decoding holds the model to that shape token by token, and a validator checks the values before any system acts on them.",
  forLeads: "A schema makes model output machine-readable. It does not make it correct or safe. Every system that consumes model output needs the same validation it applies to any external input.",
  status: "draft", minutes: 7,
  counters: ["Output", "Schema", "Enforced", "Values checked"],
  whatIf: { label: "What if the schema were only in the prompt?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts and token candidates are illustrative",
    label: "A rail runs from the refund assistant down to a model and up again to the refund system. First the model answers in a sentence and the refund system cannot parse it. A JSON Schema card with three fields then stands beside the request. Above the model a strip of candidate next tokens shows one allowed and three masked, and the output becomes a JSON object. The object then carries an amount ten times the order record. A validator beside the rail rejects it, the error returns to the model and the corrected output reaches the refund system.",
    els: [
      line("io", [G.p(-ARM, 0), G.p(0, 0), G.p(0, -ARM)], { always: true }),
      stop("s-in", ...G.p(-4, 0), undefined, undefined, { always: true }),
      stop("s-model", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("s-sys", ...G.p(0, -REST), undefined, undefined, { always: true }),
      stop("s-back", ...G.p(0, -NEAR), undefined, undefined, { always: true }),
      prism("app", -ARM - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "gear", title: "Refund assistant", sub: "Support", at: "sw", always: true }),
      prism("model", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "samples freely", at: "s", group: "free" }),
      prism("model-c", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "constrained decoding", at: "s", group: "next" }),
      prism("sys-x", -0.6, -ARM - 0.6, 1.2, 1.2, 28, { glyph: "database", title: "Refund system", sub: "cannot parse", at: "se", state: "alert", group: "prose" }),
      prism("sys", -0.6, -ARM - 0.6, 1.2, 1.2, 28, { glyph: "database", title: "Refund system", sub: "parses JSON", at: "se", group: "json" }),

      // 1. the output as a sentence
      raise(list("out-prose", 0, 0, 216, ["Sure! I have refunded", "349 kr for order 4470."], { title: "Model output", sub: "free text", group: "prose" }), OUT, 30),
      raise(list("ask", 0, 0, 216, ["Refund order 4470 if", "the return is valid."], { title: "Prompt", sub: "no schema", group: "prose" }), SCHEMA, 30),

      // 2. the schema, and what a prompt alone gets
      raise(table("schema", 0, 0, 236, ["field", "type", "required"], [["order", "integer", "yes"], ["amount", "number", "yes"], ["reason", "enum", "yes"]],
        { at: [12, 92, 168], rowH: 24, title: "JSON Schema", sub: "sent with the request", mono: true, group: "schema" }), SCHEMA, 30),
      output("out-loose", "prompt only", ["{\"order\": 4470,", " \"amount\": \"349 kr\"}"], [1]),

      // 3. constrained decoding: the candidates for the next token
      raise(cells("next-token", 0, 0, 4, [62, 30], [{ t: "4470", hue: "mint" }, { t: "\"four\"", strike: true, mute: true }, { t: "Sure", strike: true, mute: true }, { t: "}", strike: true, mute: true }],
        { title: "Next token", sub: "after {\"order\":", ticks: ["allowed", "masked", "masked", "masked"], group: "next" }), NEXT, 30),
      output("out-ok", "matches the schema", ["{\"order\": 4470,", " \"amount\": 349.00,", " \"reason\": \"damaged\"}"]),

      // 4. a valid shape with a wrong value
      output("out-wrong", "matches the schema", ["{\"order\": 4470,", " \"amount\": 3490.00,", " \"reason\": \"damaged\"}"], [1]),
      raise(table("order", 0, 0, 180, ["field", "value"], [["order", "4470"], { cells: ["paid", "349.00"], hot: true }], { at: [12, 92], rowH: 24, title: "Order record", sub: "Vinterhus", mono: true, group: "order" }), ORDER, 18),
      pill("w-cut", [40, 400], "Cut off", { sub: "token limit reached", tone: "alert", anchor: "start", group: "stops" }),
      pill("w-refusal", [40, 456], "Refusal", { sub: "may not match schema", tone: "alert", anchor: "start", group: "stops" }),

      // 5. validation and retry
      stop("s-check", ...G.p(0, -CHECK), undefined, undefined, { group: "val" }),
      prism("validator", 2.0, -CHECK - 0.6, 1.2, 1.2, 24, { hue: "track", glyph: "check", title: "Validator", sub: "schema + record", at: "e", group: "val" }),
      output("out-retry", "second attempt", ["{\"order\": 4470,", " \"amount\": 349.00,", " \"reason\": \"damaged\"}"]),

      // 6. the controls around the output
      pill("c-stop", [40, 346], "Stop reason check", { glyph: "search", sub: "before parsing", anchor: "start", group: "caps" }),
      pill("c-exec", [40, 450], "Never executed", { glyph: "shield", sub: "output is data", anchor: "start", group: "caps" }),
      pill("c-query", [40, 398], "Parameterised query", { glyph: "lock", sub: "database operations", anchor: "start", group: "caps" }),
    ],
  },
  steps: [
    step({
      id: "prose", label: "Prose", kind: "problem", title: "Software cannot parse a sentence",
      caption: "The refund assistant decides to refund order 4470 and answers in a sentence. The refund system needs an order number and an amount as fields, and cannot rely on finding them in prose.",
      show: ["prose", "free"], counters: ["free text", "none", "no", "no"],
      rides: [ride("io", "s-model", "s-sys", "Sure! I have…", { then: "cannot parse", tone: "alert" })],
      body: ["A prompt can ask for JSON. Anthropic states that without structured outputs a model can generate malformed JSON that breaks an application, and that even with careful prompting an application can meet parsing errors from invalid JSON syntax, missing required fields and inconsistent data types."],
      claims: ["structured-output-without"],
    }),
    step({
      id: "schema", label: "Schema", kind: "idea", title: "A JSON Schema states the expected shape",
      caption: "The schema names three fields, their types and which are required. Asked for in the prompt alone, the model can still return a wrong type or miss a field.",
      show: ["schema", "free", "json", "out-loose"], counters: ["JSON, wrong type", "3 fields", "no", "no"],
      rides: [ride("io", 0.04, "s-in", "task", { via: [0.2], then: "task + schema" })],
      body: ["JSON Schema is a JSON media type for defining the structure of JSON data. It asserts constraints on a JSON document, and the document either passes or fails them.",
        "The required keyword lists the property names an object must have. The type keyword is met when the value's type matches, and enum when the value equals one of the listed elements.",
        { callout: { label: "Key idea", text: "The schema is the contract between the model and the software that reads its output. Structured output is the model being held to that contract." } }],
      claims: ["structured-output-json-schema", "structured-output-keywords", "structured-output-without", "structured-output-definition"],
    }),
    step({
      id: "decode", label: "Constrain", kind: "mechanism", title: "Constrained decoding enforces the schema",
      caption: "The schema is compiled into a grammar. At each step, tokens that would break it are masked, so the model can only sample a valid next token. The finished output parses.",
      show: ["schema", "next", "json", "out-ok"], counters: ["JSON", "3 fields", "while decoding", "no"],
      rides: [ride("io", "s-model", "s-sys", "{\"order\":4470", { then: "parsed" })],
      body: ["OpenAI converts the supplied JSON Schema into a context-free grammar and uses it to mask the next sampling step, which effectively lowers the probability of invalid tokens to 0. Anthropic compiles JSON schemas into a grammar that constrains the output.",
        "Willard and Louf formulate text generation as transitions between the states of a finite-state machine, with an index over the model's vocabulary. This guides generation with regular expressions and context-free grammars and guarantees the structure of the generated text. The open source library Outlines implements it.",
        "Anthropic states the result as no JSON parsing errors, guaranteed field types and required fields, and no retries for schema violations. OpenAI's older JSON mode ensures valid JSON, and only Structured Outputs ensures schema adherence.",
        "On the Claude API the first request with a new schema is slower while the grammar compiles, and the compiled grammar is cached for 24 hours from last use. Providers support JSON Schema with some limitations, and an unsupported feature returns a 400 error."],
      claims: ["structured-output-constrained-decoding", "structured-output-guided-generation", "structured-output-guarantee", "structured-output-json-mode", "structured-output-grammar-cache", "structured-output-definition"],
    }),
    step({
      id: "values", label: "Wrong value", kind: "watch-out", title: "A valid shape can hold a wrong value",
      caption: "The output matches the schema, yet the amount is ten times the order. A refusal or a reply cut off at the token limit may not match the schema at all.",
      show: ["schema", "next", "json", "out-wrong", "order", "stops"], counters: ["wrong amount", "3 fields", "while decoding", "no"],
      rides: [ride("io", "s-model", "s-sys", "amount 3490.00", { then: "wrong amount", tone: "alert" })],
      body: ["OpenAI states that the model may still make mistakes within the values of the JSON object. The grammar constrains the shape of the output. It knows nothing about order 4470.",
        "On the Claude API a refusal carries the stop reason refusal and might not match the schema. A response that reaches the max_tokens limit carries the stop reason max_tokens and might be incomplete. OpenAI states that an application still needs to handle refusals, incomplete responses and API errors."],
      claims: ["structured-output-values", "structured-output-invalid"],
    }),
    step({
      id: "validate", label: "Validate", kind: "mechanism", title: "Validate the output and retry on failure",
      caption: "A validator checks the parsed output against the schema and the order record. On failure the error returns to the model, which answers again.",
      show: ["schema", "next", "json", "out-retry", "order", "val"], counters: ["349.00", "3 fields", "while decoding", "validator, 1 retry"],
      rides: [
        ride("io", "s-model", "s-check", "3490.00", { then: "rejected", tone: "alert" }),
        ride("io", "s-check", "s-back", "error", { then: "retry" }),
        ride("io", "s-back", "s-sys", "349.00", { via: ["s-check"], then: "accepted" }),
      ],
      body: ["Instructor provides a reasking mechanism that corrects model output from validation errors. The error is appended to the conversation as a user message, and max_retries sets how many times the model is asked again.",
        { callout: { label: "Two checks", text: "Schema validation tests the shape. Validation against the application's own records tests the values. OWASP advises applying proper input validation on responses coming from the model to backend functions." } }],
      claims: ["structured-output-retry", "structured-output-zero-trust", "structured-output-json-schema"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Treat model output as untrusted input",
      caption: "",
      show: ["schema", "next", "json", "out-retry", "order", "val", "caps"], counters: ["349.00", "3 fields", "while decoding", "validator, controls"],
      rides: [ride("io", "s-check", "s-sys", "349.00", { then: "refunded" })],
      body: [{ pair: {
        left: { label: "The schema gives", items: ["Valid JSON", "Required fields", "Field types"] },
        right: { label: "The application adds", items: ["Stop reason check", "Value validation", "Parameterised queries"] },
      } },
        "OWASP names the risk Improper Output Handling: insufficient validation, sanitisation and handling of model output before it is passed downstream. Exploitation can result in XSS and CSRF in browsers, and SSRF, privilege escalation or remote code execution on backend systems.",
        "OWASP advises treating the model as any other user under a zero-trust approach, and parameterised queries or prepared statements for all database operations involving model output."],
      claims: ["structured-output-guarantee", "structured-output-invalid", "structured-output-untrusted", "structured-output-zero-trust"],
    }),
  ],
  governance: { text: "Model output is untrusted input to downstream systems. OWASP advises validating responses from the model before they reach backend functions, because insufficiently validated output can lead to privilege escalation or remote code execution.", claims: ["structured-output-untrusted", "structured-output-zero-trust"] },
  closing: {
    pitfalls: [
      "Reading a schema-valid output as a correct one.",
      "Parsing a response without checking whether it was refused or cut off.",
      "Passing model output into a query, a shell or a page without validation and encoding.",
    ],
    questions: [
      "How does constrained decoding keep an invalid token out of the output?",
      "Which failures remain when the output matches the schema?",
      "Why is model output handled as untrusted input?",
    ],
  },
});
