import { CANVAS, defineGuide, isoGrid, line, pawn, pill, prism, ride, step, stop } from "@signal-path/engine";

// The floor: a customer message enters on the left and the reply leaves on the right.
// First an agent stands in the middle with a loop to its tools above it. Then the same floor carries a
// workflow: one rail fixed in code that steps across the floor, with a model call at each block.
// Each stop adds one pattern to that rail.
const G = isoGrid(38, 254, 30);
const L = 4.6, E = 0.6, DROP = 2.4;
const at = (gx: number, gy = 0) => G.p(gx, gy);
type Side = "n" | "s" | "e" | "w" | "se" | "sw";
const call = (id: string, gx: number, gy: number, title: string, sub: string, side: Side, group: string, glyph = "net") =>
  prism(id, gx - E, gy - E, 2 * E, 2 * E, 28, { hue: "violet", glyph, title, sub, at: side, group });
// The agent of the first stop, in the middle of the floor.
const AX = 8.8, AY = -4.8, R = 5.5;

export default defineGuide({
  id: "orchestration-patterns", track: "ai", module: "Agents", slug: "orchestration-patterns",
  title: "Orchestration patterns",
  summary: "Many tasks need only fixed steps in code with a model call at each. Chaining, routing, parallel calls and an evaluator loop cover most of them before an agent is needed.",
  forLeads: "Choosing between a workflow and an agent is a risk decision. Start with the simplest design that solves the task, and add oversight in step with autonomy.",
  status: "draft", minutes: 7,
  counters: ["Path set by", "Model calls", "Pattern", "A person approves"],
  whatIf: { label: "What if an agent handled every message?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Messages, orders and amounts are illustrative",
    label: "A customer message enters on the left. First an agent handles it: one model with a loop to its tools, taken as often as the model chooses. Then the agent is replaced by a workflow on one rail fixed in code: a call that extracts the order, a gate, and a call that drafts the reply. A classifying call is added in front and sends general questions down a side rail. A screening call runs beside the drafting call and code merges both outputs. An evaluating call sends the draft back around a loop until it passes. Last, a person approves the refund before the reply leaves.",
    els: [
      // 1. the agent: one model, a loop to its tools, a path nobody wrote down
      stop("a-msg", ...at(AX, AY + 9), "Message", "from a customer", { at: "n", big: true, group: "agent" }),
      line("a-in", [at(AX, AY + 9), at(AX, AY + E)], { group: "agent" }),
      prism("a-model", AX - E, AY - E, 2 * E, 2 * E, 30, { hue: "violet", glyph: "net", title: "Agent", sub: "picks each step", at: "s", group: "agent" }),
      line("a-loop", [at(AX, AY - E), at(AX, AY - R), at(AX - R, AY - R), at(AX - R, AY), at(AX - E, AY)], { group: "agent" }),
      prism("a-tools", AX - E, AY - R - E, 2 * E, 2 * E, 28, { hue: "sand", glyph: "wrench", title: "Tools", sub: "lookup, refund", at: "e", group: "agent" }),
      stop("a-p1", ...at(AX - R * 0.6, AY - R), undefined, undefined, { group: "agent" }),
      line("a-out", [at(AX + E, AY), at(AX + 9, AY)], { group: "agent" }),
      stop("a-reply", ...at(AX + 9, AY), "Reply", "after how many calls?", { at: "n", big: true, group: "agent" }),
      pill("a-cost", [215, 168], "Higher cost", { sub: "errors can compound", tone: "alert", glyph: "loop", group: "agent" }),

      // 2. prompt chaining: extract, gate, draft
      stop("s-msg", ...at(0), "Message", "from a customer", { at: "ne", big: true, group: "chain" }),
      line("in-long", [at(0), at(L), at(L, -L + E)], { group: "chain-in" }),
      call("extract", L, -L, "Extract", "order, reason", "n", "chain"),
      line("c1", [at(L + E, -L), at(2 * L - E, -L)], { group: "chain" }),
      stop("gate", ...at(1.5 * L, -L), "Gate", "order found?", { at: "sw", group: "chain" }),
      call("draft", 2 * L, -L, "Draft", "writes the reply", "e", "chain", "pen"),
      line("out-long", [at(2 * L, -L - E), at(2 * L, -2 * L), at(3 * L, -2 * L), at(3 * L, -3 * L - 1)], { group: "out-long" }),
      stop("s-reply", ...at(3 * L, -3 * L - 1), "Reply", "and refund", { at: "s", big: true, group: "chain" }),
      pill("fixed", [150, 140], "Path fixed in code", { glyph: "code", tone: "track", group: "chain" }),

      // 3. routing: a classifying call in front, a side rail for general questions
      line("r-in", [at(0), at(L - E)], { group: "route" }),
      call("classify", L, 0, "Classify", "refund or question", "sw", "route", "split"),
      line("r-main", [at(L, -E), at(L, -L + E)], { group: "route" }),
      line("r-side", [at(L + E, 0), at(L + 4.6, 0)], { group: "route" }),
      prism("faq", L + 4.6, -E, 2 * E, 2 * E, 22, { hue: "paper", glyph: "net", title: "Answer", sub: "smaller model", at: "s", group: "route" }),

      // 4. parallelisation: a screening call beside the drafting call, merged in code
      line("p1", [at(L, -L - E), at(L, -2 * L + E)], { group: "par" }),
      call("screen", L, -2 * L, "Screen", "same input", "n", "par", "shield"),
      line("p2", [at(L + E, -2 * L), at(2 * L, -2 * L)], { group: "par" }),
      stop("join", ...at(2 * L, -2 * L), "Code merges", undefined, { at: "ne", group: "par" }),

      // 5. evaluate and revise: the evaluator sends the draft back
      line("out-a", [at(2 * L, -L - E), at(2 * L, -2 * L), at(3 * L - E, -2 * L)], { group: "eval" }),
      call("judge", 3 * L, -2 * L, "Evaluate", "pass or feedback", "se", "eval", "scale"),
      line("out-b", [at(3 * L, -2 * L - E), at(3 * L, -3 * L - 1)], { group: "eval" }),
      line("back", [at(3 * L, -2 * L + E), at(3 * L, -L + DROP), at(2 * L, -L + DROP), at(2 * L, -L + E)], { group: "eval" }),
      pill("until", [at(2.5 * L, -L + DROP)[0] + 70, at(2.5 * L, -L + DROP)[1] + 34], "Repeats until it passes", { glyph: "loop", tone: "track", group: "eval" }),

      // 6. oversight: a person approves the high-impact action
      stop("approve", ...at(3 * L, -2.5 * L - 0.5), undefined, undefined, { group: "human" }),
      pawn("support", 3 * L - 2.85, -2.5 * L - 2.65, undefined, "Support approves", { side: "w", group: "human" }),
    ],
  },
  steps: [
    step({
      id: "agent", label: "Agent", kind: "problem", title: "An agent directs its own process",
      caption: "Support's refund assistant runs as an agent. For every message the model chooses each tool call itself. That autonomy brings higher cost and the potential for compounding errors.",
      show: ["agent"], counters: ["the model", "not known", "agent loop", "nothing"],
      rides: [ride("a-in", 0, 0.5, "refund 4471?"), ride("a-loop", 0, "a-p1", "call 1", { then: "call 2, 3, ..." }), ride("a-out", 0, 0.5, "reply")],
      body: ["Agents are systems where the model dynamically directs its own process and tool usage. Agentic systems often trade latency and cost for better task performance.",
        "Most messages to the refund assistant follow the same few steps, so most of that freedom goes unused.",
        { callout: { label: "Key idea", text: "Find the simplest solution possible, and only increase complexity when needed." } }],
      claims: ["orchestration-patterns-workflow-agent", "orchestration-patterns-agent-cost", "orchestration-patterns-tradeoff", "orchestration-patterns-simplest"],
    }),
    step({
      id: "chain", label: "Chain", kind: "idea", title: "Fixed steps in code, a model at each",
      caption: "Prompt chaining splits the task into a sequence. Each call processes the output of the one before, and a check in code, a gate, stands between steps.",
      show: ["chain-in", "chain", "out-long"], counters: ["code", "2", "prompt chaining", "nothing"],
      rides: [ride("in-long", 0, 0.7, "refund 4471?"), ride("c1", 0, "gate", "4471", { then: "found" }), ride("out-long", 0, 0.5, "draft")],
      body: ["A workflow orchestrates models and tools through predefined code paths. Prompt chaining is the plainest one: it suits tasks that decompose cleanly into fixed subtasks, and it trades latency for accuracy by making each call an easier task.",
        "Here the first call extracts the order number and the reason. The gate is ordinary code that looks the order up. The second call writes the reply from those facts.",
        "Orchestrating in code makes a task more deterministic and predictable in speed, cost and performance."],
      claims: ["orchestration-patterns-chaining", "orchestration-patterns-workflow-agent", "orchestration-patterns-tradeoff"],
    }),
    step({
      id: "route", label: "Route", kind: "mechanism", title: "Routing sends each input down its own path",
      caption: "A first call classifies the message. Refund requests continue down the chain. General questions go to a separate prompt, which can run on a smaller model.",
      show: ["route", "chain", "out-long"], counters: ["code", "3", "routing", "nothing"],
      rides: [ride("r-side", 0, 0.5, "question"), ride("r-main", 0, 0.475, "refund"), ride("out-long", 0, 0.5, "draft")],
      body: ["Routing classifies an input and directs it to a specialised follow-up task. Customer service is the standard example: general questions, refund requests and technical support each get their own downstream process, prompt and tools.",
        "The classifier is a model call with a structured output that code can inspect, and the branch is an ordinary conditional. Simple queries can be routed to smaller, cheaper models."],
      claims: ["orchestration-patterns-routing"],
    }),
    step({
      id: "parallel", label: "Parallel", kind: "mechanism", title: "Independent calls run in parallel",
      caption: "One call drafts the reply while another screens the request. Code aggregates both outputs. Sectioning splits a task into independent subtasks. Voting runs the same task several times.",
      show: ["route", "chain", "out-long", "par"], counters: ["code", "4", "parallelisation", "nothing"],
      rides: [ride("p1", 0, 0.5, "4471"), ride("p2", 0, 0.5, "safe"), ride("out-long", 0, 0.57, "draft, safe")],
      body: ["In parallelisation the calls work at the same time and their outputs are aggregated programmatically. Running one call on the request while another screens it is a documented case of sectioning.",
        "When the subtasks cannot be listed in advance, the orchestrator-workers pattern lets a central model break the task down, delegate to worker calls and synthesise the results. That hands a decision back to the model."],
      claims: ["orchestration-patterns-parallel", "orchestration-patterns-orchestrator"],
    }),
    step({
      id: "evaluate", label: "Evaluate", kind: "mechanism", title: "An evaluator sends the draft back",
      caption: "One call writes the reply, another evaluates it and returns feedback. The loop repeats until the evaluator passes the draft. Code still decides every path.",
      show: ["route", "chain", "par", "eval"], counters: ["code", "5 or more", "evaluate and revise", "nothing"],
      rides: [ride("back", 0, 0.685, "feedback", { then: "revise" }), ride("out-b", 0, 0.44, "passed")],
      body: ["In the evaluator-optimizer workflow one call generates a response while another provides evaluation and feedback in a loop. In code it is a while loop that stops when the evaluator says the output passes the required criteria.",
        "The pattern fits when the evaluation criteria are clear and iteration adds measurable value. Here the criterion is that the reply matches the refund policy."],
      claims: ["orchestration-patterns-evaluator"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Workflow or agent",
      caption: "",
      show: ["route", "chain", "par", "eval", "human"], counters: ["code", "5 or more", "workflow", "the refund"],
      rides: [ride("out-b", 0, "approve", "899 kr", { then: "approved" })],
      body: [{ pair: {
        left: { label: "Workflow", items: ["Steps are known in advance", "Predictability matters most", "The simplest design that works"] },
        right: { label: "Agent", items: ["Steps cannot be predicted", "No fixed path can be hardcoded", "More autonomy, more oversight"] },
      } }],
      claims: ["orchestration-patterns-when-agent", "orchestration-patterns-simplest", "orchestration-patterns-checkpoints", "orchestration-patterns-excessive-autonomy", "orchestration-patterns-oversight-law"],
    }),
  ],
  governance: {
    text: "Autonomy is a risk decision. OWASP lists excessive autonomy as a root cause of Excessive Agency and advises human approval of high-impact actions, and the EU AI Act requires oversight of a high-risk AI system to be commensurate with its level of autonomy.",
    claims: ["orchestration-patterns-excessive-autonomy", "orchestration-patterns-oversight-law", "orchestration-patterns-agent-cost"],
  },
  closing: {
    pitfalls: [
      "Starting with an agent when a chain of two calls solves the task.",
      "An evaluator loop with unclear criteria, so drafts circle without improving.",
      "Adding autonomy without adding approval for high-impact actions.",
    ],
    questions: [
      "Who decides the path in a workflow, and who in an agent?",
      "Which pattern fits inputs that fall into distinct categories?",
      "What must grow when autonomy grows?",
    ],
  },
});
