import { CANVAS, code, defineGuide, isoGrid, line, pill, raise, ride, step, stop, table } from "@signal-path/engine";

// One order moves from checkout to analytics. Its email field is classified at the door,
// removed or obscured for work that does not need it, and governed by a retention schedule.
const G = isoGrid(110, 230, 20);
const p = (x: number) => G.p(x, 0);
const small = (id: string, email: string, label: string, group: string, x: number) =>
  raise(table(id, 0, 0, 210, ["order", "amount", "email"], [["4471", "899", email]], {
    at: [10, 68, 134], rowH: 28, title: "orders", sub: label, group,
  }), [x, 172], 0);

export default defineGuide({
  id: "sensitive-data-handling", track: "data", module: "Ingestion", slug: "sensitive-data-handling",
  title: "Sensitive data handling",
  summary: "Personal and regulated data is identified on arrival and minimised, masked or tokenised, with retention and erasure built into the pipeline.",
  forLeads: "A sensitive field has a purpose, a permitted audience and an end date. Carry its classification and controls with the data, reduce identifiers where the work allows, and make retention and erasure operational.",
  status: "draft", minutes: 7,
  counters: ["Email field", "Analytics view", "Link to person", "Retention"],
  whatIf: { label: "What if the email travelled everywhere?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order 4471 and its values are illustrative",
    label: "Order 4471 travels from Checkout through intake to analytics. Its email begins exposed and unlabelled. A classification tag marks it personal, a query masks it for analysts, and a token substitutes for the email where records still need to be linked. A separate key vault holds the reversible mapping. A retention schedule sets an end date; an erasure request drives a workflow through the source and the tracked outputs.",
    els: [
      line("main", [p(0), p(27)], { always: true }),
      stop("in", ...p(0), undefined, undefined, { big: true, always: true }),
      stop("tag", ...p(5), undefined, undefined, { always: true }),
      stop("mask", ...p(10), undefined, undefined, { always: true }),
      stop("land", ...p(15), undefined, undefined, { always: true }),
      stop("use", ...p(21), undefined, undefined, { always: true }),
      stop("end", ...p(27), undefined, undefined, { state: "end", always: true }),
      small("raw", "s.o@…", "unlabelled", "raw", 120),
      small("classified", "s.o@…", "email: personal", "classified", 360),
      small("minimised", "removed", "no email needed", "minimal", 600),
      small("masked", "•••@…", "masked for analysts", "masked", 600),
      small("tokenised", "T-8F2", "pseudonymous", "token", 840),
      small("expired", "erased", "retention elapsed", "expired", 600),
      pill("ttl", [840, 76], "retain to purpose end", { glyph: "clock", group: "schedule" }),
      raise(code("erase-work", 0, 0, 210, ["find order 4471", "erase eligible fields", "update tracked outputs"], { title: "Erasure workflow", group: "erase" }), [840, 420], 0),
    ],
  },
  steps: [
    step({
      id: "arrival", label: "Arrival", kind: "problem", title: "The full record enters without a handling rule",
      caption: "Checkout sends the order, amount and customer email together. Without a purpose or sensitivity label, every downstream copy inherits the same exposure.",
      show: ["raw"], counters: ["exposed", "full record", "direct", "none"],
      rides: [ride("main", "in", "land", "4471 s.o@…")],
      body: ["An email address identifies a person. Vinterhus order 4471 is an illustrative record, but the handling problem is ordinary: data may arrive with more identifying detail than each later use needs."],
      claims: ["sensitive-data-handling-purpose"],
    }),
    step({
      id: "classify", label: "Classify", kind: "idea", title: "Mark sensitive fields as they enter",
      caption: "The email column receives a personal-data tag at intake. Classification makes the field and its required controls visible to later steps.",
      show: ["classified"], counters: ["tagged personal", "full record", "direct", "none"],
      rides: [ride("main", "in", "tag", "email field")],
      body: ["Classification tags name a data class and attach it to a column. BigQuery policy tags can classify columns and enforce column-level access or masking policies.",
        { callout: { label: "Key idea", text: "A label only helps when the pipeline carries it forward and applies a rule to it." } }],
      claims: ["sensitive-data-handling-tags"],
    }),
    step({
      id: "minimise", label: "Minimise", kind: "mechanism", title: "Keep only fields the purpose needs",
      caption: "The sales summary needs an order and amount, not an email. That output drops the identifier instead of copying it and hiding it later.",
      show: ["minimal"], counters: ["tagged personal", "order and amount", "none", "none"],
      rides: [ride("main", "tag", "use", "order, amount", { via: ["mask"] })],
      body: ["The EU GDPR limits personal data to what is adequate, relevant and necessary for its purpose. Removing an unnecessary identifier reduces what downstream systems can expose."],
      claims: ["sensitive-data-handling-purpose"],
    }),
    step({
      id: "protect", label: "Protect", kind: "mechanism", title: "Mask or tokenise when the work needs a link",
      caption: "Analysts see a masked email. A token can preserve a stable join while its reversible mapping remains in a restricted vault.",
      show: ["masked", "token"], counters: ["tagged personal", "masked or token", "controlled", "none"],
      rides: [ride("main", "tag", "use", "4471 T-8F2", { via: ["mask"], then: "4471 •••@…" })],
      body: ["Masking obscures selected characters. Tokenisation substitutes a generated token; some token schemes can be reversed. A pseudonymised record remains personal data if additional information can reconnect it to a person.",
        "The EDPB describes pseudonymisation as reducing linkability without aiming to cut the link completely. Keep any mapping information separate and restrict who can use it."],
      claims: ["sensitive-data-handling-masking", "sensitive-data-handling-tokenisation", "sensitive-data-handling-pseudonymised", "sensitive-data-handling-design"],
    }),
    step({
      id: "retain", label: "Retain", kind: "watch-out", title: "Set an end date for identifiable data",
      caption: "The retention schedule ties the source record to its purpose. When the period ends, a workflow finds eligible data and tracked outputs for erasure.",
      show: ["classified", "schedule", "erase"], counters: ["tagged personal", "tracked outputs", "controlled", "scheduled"],
      rides: [ride("main", "land", "end", "4471 expires", { via: ["use"] })],
      body: ["The EU GDPR says identifiable data must not be kept longer than necessary for its purpose. It also provides a right to erasure on specified grounds, with exceptions such as legal obligations and legal claims.",
        "An operational workflow needs to find the source and relevant outputs. For data made public, Article 17 requires reasonable steps to inform other controllers processing it about an erasure request."],
      claims: ["sensitive-data-handling-purpose", "sensitive-data-handling-erasure"],
    }),
    step({
      id: "decision", label: "Decide", kind: "decision", title: "Choose the least identifying form that serves the purpose",
      caption: "",
      show: ["expired", "schedule", "erase"], counters: ["tagged personal", "purpose-limited", "controlled", "scheduled"],
      rides: [ride("main", "land", "end", "erase eligible data", { via: ["use"] })],
      body: [{ pair: {
        left: { label: "Purpose needs no identity", items: ["Drop the identifier", "Do not carry it into the output", "Keep a defined retention period"] },
        right: { label: "Purpose needs linkage", items: ["Mask or tokenise", "Protect the mapping", "Keep erasure operational"] },
      } }, "Article 25 of the EU GDPR calls for measures such as pseudonymisation to implement data-protection principles and safeguards. The controller chooses measures appropriate to the processing and its risks."],
      claims: ["sensitive-data-handling-purpose", "sensitive-data-handling-design", "sensitive-data-handling-erasure"],
    }),
  ],
  governance: { text: "Purpose limitation, data minimisation and storage limitation govern every personal-data flow. The EU GDPR requires appropriate safeguards and provides a right to erasure on specified grounds, subject to exceptions.", claims: ["sensitive-data-handling-purpose", "sensitive-data-handling-design", "sensitive-data-handling-erasure"] },
  closing: {
    pitfalls: [
      "Treating a pseudonymous token as anonymous when a mapping or other information can reconnect it to a person.",
      "Masking a field for analysts while copying the original value into an unrestricted downstream table.",
      "Writing a retention period without a workflow that locates the data and its relevant outputs.",
    ],
    questions: [
      "Which fields does each downstream purpose actually need?",
      "Who can reverse a token, and where is the mapping protected?",
      "How does an erasure request reach the source and the data derived from it?",
    ],
  },
});
