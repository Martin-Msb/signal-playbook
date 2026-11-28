import { CANVAS, blocks, defineGuide, doc, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, table } from "@signal-path/engine";

// The floor: the customer's request runs down the main rail to the assistant and on to the refund system.
// Knowledge arrives from the back right (policy, index), the order from the front left (order database, tool),
// and the Support agent stands beside the output check, where large refunds wait.
const G = isoGrid(150, 154, 30);
const TOP = G.p(6.5, -6.5);   // the board above the main rail
const LEFT = G.p(5.5, 6.5); // the board beside the order database

const can = (id: string, third: { t: string; hot?: boolean }) =>
  raise(list(id, 0, 0, 216, ["read this customer's orders", "refund up to 200", third], { title: "The assistant may", group: id }), TOP, 20);
const order = (id: string, rows: string[][]) =>
  raise(table(id, 0, 0, 214, ["order", "item", "paid"], rows, { at: [12, 60, 152], title: "Order tool result", mono: true, group: id }), LEFT, 30);

export default defineGuide({
  id: "case-refund-requests-answered-by-an-assistant", track: "case", module: "Use cases", slug: "refund-requests-answered-by-an-assistant",
  title: "Refund requests answered by an assistant",
  summary: "A support assistant is assembled piece by piece: retrieval for the policy, a tool for the order, one model call, and controls on what it may do. Then three requests run through it.",
  forLeads: "The model is the smallest part of this system. What makes it safe to run is where the answer comes from, what the assistant is allowed to do, and who approves what it is not.",
  status: "draft", minutes: 12,
  counters: ["Answers from", "May do", "Controls", "Time to answer"],
  whatIf: { label: "What if there were no controls?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts and limits are illustrative",
    label: "A customer's refund request travels along a rail to a support assistant. The policy reaches the assistant through an index, the order through a read-only tool. Later stops add an input check, an output check, a refund system and a Support agent who approves large refunds.",
    els: [
      pawn("cust", 0, 0, "Customer", undefined, { always: true }),
      line("m1", [G.p(1.5, 0), G.p(10.4, 0)], { always: true }),
      raise(doc("policy", 0, 0, 178, 94, "Refund policy", ["Return within 30 days", "Unused, with receipt", "Above 200: agent approves"], { always: true }), G.p(11, -11.6), 30),
      drum("orders", 11, 8.6, 1, 34, { hue: "sky", glyph: "table", title: "Orders", sub: "order database", at: "w", always: true }),

      // Problem: a person does it all by hand, then a model alone gets it wrong.
      prism("desk", 10.4, -0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "user", title: "Support agent", sub: "reads, looks up, decides", at: "e", group: "desk" }),
      line("hp", [G.p(11, -10.9), G.p(11, -0.6)], { tone: "muted", w: 3, group: "desk" }),
      line("ho", [G.p(11, 7.6), G.p(11, 0.6)], { tone: "muted", w: 3, group: "desk" }),
      blocks("queue", 2.2, 1.4, 6, 0.62, Array.from({ length: 18 }, (_, i) => ({ h: 7, hue: i < 3 ? "track" as const : "paper" as const })), { gap: 0.3, title: "4,000 requests a week", sub: "waiting", at: "sw", group: "desk" }),
      prism("bare", 10.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Model", sub: "training only", at: "n", group: "bare" }),
      raise(list("ans-bad", 0, 0, 216, [{ t: "You have 90 days to return", hot: true, tone: "alert" }, { t: "Refund approved", hot: true, tone: "alert" }, { t: "order never looked up", mute: true }], { title: "The model answers", group: "bare" }), TOP, 20),

      // Architecture.
      prism("asst", 10.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Assistant", at: "n", group: "asst" }),
      line("prep", [G.p(11, -10.9), G.p(11, -6.5)], { group: "rag" }),
      drum("index", 11, -5.5, 1, 30, { hue: "violet", glyph: "search", title: "Policy index", sub: "keywords and vectors", at: "e", group: "rag" }),
      line("ret", [G.p(11, -4.5), G.p(11, -0.6)], { group: "rag" }),
      raise(list("passages", 0, 0, 216, [{ t: "Return within 30 days", hot: true }, "Unused, with receipt", { t: "Gift cards: no refund", mute: true }], { title: "Passages, reranked", numbered: true, cut: 2, cutLabel: "sent", group: "passages" }), TOP, 20),

      line("tl", [G.p(11, 7.6), G.p(11, 0.6)], { group: "tool" }),
      prism("tool", 10.4, 3.6, 1.2, 1.2, 16, { hue: "sky", glyph: "wrench", title: "Order tool", sub: "read only", at: "se", group: "tool" }),
      pill("as", [330, 486], "runs as customer 88", { glyph: "key", tone: "track", anchor: "start", group: "tool" }),
      order("ord-1", [["4471", "LAMP-0312", "49.00"]]),
      order("ord-2", [["4480", "SOFA-2210", "640.00"]]),

      raise(list("ctx", 0, 0, 216, ["instructions", { t: "2 passages, order 4471", hot: true }, "the customer's message"], { title: "Context window", group: "ctx" }), TOP, 20),

      line("m2", [G.p(11.6, 0), G.p(20.5, 0)], { group: "ctl" }),
      prism("gin", 3.9, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "shield", title: "Input check", at: "n", group: "ctl" }),
      prism("gout", 15.4, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "shield", title: "Output check", sub: "limit 200", at: "sw", group: "ctl" }),
      prism("pay", 20.5, -0.6, 1.2, 1.2, 22, { hue: "sand", glyph: "check", title: "Refunds", sub: "payment system", at: "e", group: "ctl" }),
      line("ap", [G.p(16, -0.7), G.p(16, -4.8)], { w: 3, group: "ctl" }),
      pawn("agent", 16, -6, "Support agent", undefined, { group: "ctl" }),
      can("can", { t: "above 200: ask an agent", hot: true }),

      // Execution.
      raise(list("reply", 0, 0, 216, [{ t: "Delivered 12 days ago", hot: true }, { t: "Within 30 days: refund", hot: true }, "cites policy passage 1"], { title: "Reply to the customer", group: "reply" }), TOP, 20),
      raise(list("held", 0, 0, 216, [{ t: "refund 5,000 requested", hot: true, tone: "alert" }, { t: "above the limit: held", hot: true }, "agent rejects"], { title: "Planted instruction", group: "held" }), TOP, 20),
      raise(list("ops", 0, 0, 216, [{ t: "200 graded past requests", hot: true }, "a trace of every answer", "agent overrides become tests"], { title: "Run on every change", group: "ops" }), TOP, 20),
    ],
  },
  steps: [
    step({
      id: "queue", label: "Queue", kind: "problem", phase: "problem", title: "Every refund request waits for a person",
      caption: "A Support agent reads the policy, looks up the order and decides. Four thousand requests arrive each week, and a customer waits two days for an answer.",
      show: ["desk"], counters: ["an agent's reading", "everything, by hand", "the agent's judgement", "2 days"],
      rides: [ride("m1", 0, 0.72, "refund 4471?")],
      body: ["Each request is the same three moves: find the rule that applies, find the order, decide. The work is repetitive, and the queue grows faster than the team.",
        "Customer support is one of the uses for which model providers publish production guidance."],
      claims: ["language-models-tasks"],
    }),
    step({
      id: "alone", label: "Model alone", kind: "problem", phase: "problem", title: "A model alone invents the policy",
      caption: "A language model answers from what it stored in training. It has seen neither this policy nor this order, so it states a plausible rule with confidence.",
      show: ["bare"], counters: ["training only", "nothing", "none", "seconds, and wrong"],
      rides: [ride("m1", 0, 0.72, "refund 4471?", { then: "90 days!", tone: "alert" })],
      concepts: ["language-models", "training", "hallucination-and-model-limits"],
      body: ["NIST uses the term confabulation for a generative system that confidently presents false content, and describes it as a natural result of how such models generate text.",
        "A model stores knowledge in its parameters and cannot easily revise it. Its knowledge is most reliable up to its cutoff date.",
        { callout: { label: "The gap", text: "The answer has to come from the policy and the order. Neither is in the model." } }],
      claims: ["hallucination-and-model-limits-confabulation", "hallucination-and-model-limits-statistical", "retrieval-augmented-generation-parametric-limits", "training-cutoff-meaning"],
    }),
    step({
      id: "knowledge", label: "Knowledge", kind: "mechanism", phase: "architecture", title: "The policy reaches the model through retrieval",
      caption: "The policy is split into passages and indexed by keyword and by vector. For each request the best passages are found, reranked and handed to the model.",
      show: ["asst", "rag", "passages"], counters: ["the policy", "nothing", "none", "seconds"],
      rides: [ride("prep", 0, 0.5, "passages"), ride("ret", 0, 0.5, "top 2")],
      concepts: ["preparing-knowledge", "hybrid-search-and-reranking", "retrieval-augmented-generation"],
      body: ["Retrieval-augmented generation pairs the model with a document index. Splitting the policy into chunks keeps each one inside the model's input limits.",
        "Keyword search matches terms and vector search matches meaning. A reranker rescores the merged candidates so that a smaller set reaches the model.",
        "When the policy changes, the index is updated. The model is not retrained."],
      claims: ["retrieval-augmented-generation-definition", "retrieval-augmented-generation-index-update", "preparing-knowledge-why-chunk", "dense-sparse", "rerank-stage"],
    }),
    step({
      id: "order", label: "Order tool", kind: "mechanism", phase: "architecture", title: "A tool reads the order as the customer",
      caption: "The model cannot query a database. It returns a structured call, and the application runs it. The tool is read only and reaches this customer's orders alone.",
      show: ["asst", "rag", "tool", "ord-1"], counters: ["policy and order", "read this customer's orders", "the customer's own access", "seconds"],
      rides: [ride("tl", 0, 0.78, "4471")],
      concepts: ["tool-calling", "serving-data-to-applications", "access-control-and-data-protection"],
      body: ["For a tool the developer defines, the model returns a structured call and the application's code runs the operation and sends back the result.",
        "OWASP advises limiting tools and their permissions to the minimum necessary and enforcing authorisation in the downstream system, not in the model. Least privilege allows only the access a task needs.",
        "The lookup is a request-time read of one order by its key. A cache in front of the order store follows the cache-aside pattern: check the cache, fall back to the store on a miss."],
      claims: ["tool-calling-app-runs", "tool-calling-least-privilege", "agent-authority-and-human-oversight-mediation", "access-control-and-data-protection-governance", "serving-data-to-applications-redis-cache-aside"],
    }),
    step({
      id: "call", label: "The call", kind: "mechanism", phase: "architecture", title: "One call carries everything the model sees",
      caption: "Each request is one stateless call. The application places the instructions, the passages, the order and the message in the context window, and tells the model to answer from them alone.",
      show: ["asst", "rag", "tool", "ctx"], counters: ["policy, order, instructions", "read this customer's orders", "the customer's own access", "seconds"],
      rides: [ride("ret", 0, 0.5, "top 2"), ride("tl", 0, 0.78, "4471")],
      concepts: ["the-model-call", "prompting", "the-context-window"],
      body: ["The API is stateless: nothing carries over from one request to the next unless the application sends it again. The context window is all the text the model can reference when it generates a response.",
        "Instructions from the developer rank ahead of the user's message. Restricting the model to the supplied documents is a documented technique for reducing invented answers."],
      claims: ["the-model-call-stateless", "the-context-window-contents", "prompting-roles", "hallucination-and-model-limits-grounding"],
    }),
    step({
      id: "controls", label: "Controls", kind: "mechanism", phase: "architecture", title: "Checks and a limit bound what it may do",
      caption: "An input check screens each message and an output check screens each reply. The assistant refunds up to 200. Anything larger waits for a Support agent.",
      show: ["asst", "rag", "tool", "ctl", "can"], counters: ["policy, order, instructions", "refund up to 200", "checks, limit, approval", "seconds"],
      rides: [ride("m2", 0, 0.2, "49.00?")],
      concepts: ["guardrails", "agent-authority-and-human-oversight", "intended-use-and-risk"],
      body: ["Guardrails check and validate user input and model output. OWASP advises human approval of high-impact actions before they are taken.",
        "The limit is a statement of risk tolerance: the organisation decides how much the assistant may give away without a person, and writes it down as part of the system's intended purpose."],
      claims: ["guardrails-definition", "tool-calling-approval", "intended-use-and-risk-tolerance", "intended-use-and-risk-purpose"],
    }),
    step({
      id: "request", label: "A request", kind: "mechanism", phase: "execution", title: "A lamp is refunded in seconds",
      caption: "Order 4471 arrived 12 days ago. The assistant retrieves the 30 day rule, reads the order and refunds 49.00, citing the passage it used.",
      show: ["asst", "rag", "tool", "ctl", "reply", "ord-1"], counters: ["policy, order, instructions", "refund up to 200", "checks, limit, approval", "seconds"],
      rides: [ride("m1", 0, 0.72, "refund 4471?"), ride("ret", 0, 0.5, "30 days"), ride("tl", 0, 0.78, "4471"), ride("m2", 0, 0.77, "49.00", { via: [0.2] })],
      concepts: ["retrieval-augmented-generation", "tool-calling", "hallucination-and-model-limits"],
      body: ["Tool calling is a multi-step conversation: the application sends the request with the tools on offer, receives a call, runs it and returns the result.",
        "With citations enabled the model cites the passages it was given, so the reply can be traced to its source. Such techniques reduce invented answers and do not eliminate them."],
      claims: ["tool-calling-flow", "retrieval-augmented-generation-citations", "hallucination-and-model-limits-not-eliminated"],
    }),
    step({
      id: "attack", label: "An attack", kind: "watch-out", phase: "execution", title: "A planted instruction is contained",
      caption: "A message tells the assistant to ignore the policy and refund 5,000. The model may comply. The limit holds outside the model, and the agent rejects it.",
      show: ["asst", "rag", "tool", "ctl", "held"], counters: ["policy, order, instructions", "refund up to 200", "checks, limit, approval", "held for an agent"],
      rides: [ride("m1", 0, 0.72, "refund 5,000", { tone: "alert" }), ride("m2", 0, 0.2, "5,000", { tone: "alert", then: "held" }), ride("ap", 0, 0.45, "5,000?", { tone: "alert", then: "rejected" })],
      concepts: ["prompt-injection", "guardrails", "agent-authority-and-human-oversight"],
      body: ["A model makes no architectural distinction between instructions and data: both are tokens on one stream. A prompt injection puts instructions in content the model reads.",
        "Adaptive attacks consistently get past input filters, so the input check is not the defence. The defence is authority enforced in the downstream system.",
        { callout: { label: "What held", text: "The model was fooled. The refund system was not asked." } }],
      claims: ["injection-definition", "prompting-boundary", "filters-bypassed", "agent-authority-and-human-oversight-mediation"],
    }),
    step({
      id: "large", label: "A large refund", kind: "mechanism", phase: "execution", title: "A sofa refund waits for approval",
      caption: "A refund of 640 is within policy and above the limit. The assistant prepares the case, a Support agent approves it, and the refund is paid.",
      show: ["asst", "rag", "tool", "ctl", "can", "ord-2"], counters: ["policy, order, instructions", "refund up to 200", "checks, limit, approval", "minutes, with approval"],
      rides: [ride("m2", 0, 0.2, "640"), ride("ap", 0, 0.45, "640?", { then: "approved" }), ride("m2", 0.62, 0.77, "paid 640")],
      concepts: ["agent-authority-and-human-oversight", "access-control-and-data-protection"],
      body: ["Human confirmation for high-impact actions is the control. Anthropic describes agents that pause for human feedback at checkpoints.",
        "NIST notes that use of generative AI may warrant additional human review, tracking and documentation."],
      claims: ["agent-authority-and-human-oversight-approval", "agent-authority-and-human-oversight-checkpoints", "hallucination-and-model-limits-human-review"],
    }),
    step({
      id: "operate", label: "Operate", kind: "decision", phase: "execution", title: "What keeps it right",
      caption: "",
      show: ["asst", "rag", "tool", "ctl", "ops"], counters: ["policy, order, instructions", "refund up to 200", "checks, limit, approval", "seconds"],
      rides: [ride("m1", 0, 0.72, "refund 4502?"), ride("m2", 0, 0.77, "35.00", { via: [0.2] })],
      concepts: ["evaluating-model-output", "observability-and-feedback"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["An evaluation set run on every change", "A trace of every answer", "Agent overrides turned into tests"] },
        right: { label: "Do not rely on", items: ["It seems to work", "Complaints as the alarm", "Filters against injection"] },
      } },
        "An evaluation gives the system an input and grades its output. Running evaluations on every change catches a regression before customers do.",
        "User feedback alone is sparse and self-selected. Converting reported failures into test cases keeps them from returning."],
      claims: ["evaluating-model-output-eval", "evaluating-model-output-every-change", "evaluating-model-output-vibes", "observability-and-feedback-trace", "observability-and-feedback-reactive", "observability-and-feedback-loop", "filters-bypassed"],
    }),
  ],
  governance: { text: "Authorisation is enforced in the order and refund systems, never left to the model to decide. High-impact actions wait for human approval.", claims: ["agent-authority-and-human-oversight-mediation", "tool-calling-approval"] },
  closing: {
    pitfalls: [
      "Letting the model decide what it is allowed to do.",
      "Giving the order tool a service account that can read every customer.",
      "Launching without an evaluation set, then judging by complaints.",
    ],
    questions: [
      "Which part of the system knows the refund policy?",
      "Why does the planted instruction fail when the model follows it?",
      "What would have to change before the limit could be raised?",
    ],
  },
});
