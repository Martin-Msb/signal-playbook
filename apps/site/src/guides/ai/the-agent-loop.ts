import { CANVAS, defineGuide, drum, isoGrid, line, list, pill, prism, ride, step, stop } from "@signal-path/engine";

// The floor: the task arrives at the model. A closed rail leaves the model for the tools, the systems
// they act on, and back past the context. The context is the list below the loop.
const G = isoGrid(250, 226, 30);
const T = "task: refund order 8812?", L = "lookup_order: delivered 12 Nov, unopened", A = "refund: approved, 499 kr";
const C = G.p(7, 0);
const ctx = (id: string, items: string[]) => list(id, C[0] - 165, 392, 330, items.map((t, i) => (i === items.length - 1 && i > 0 ? { t, hot: true } : t)), { title: "Context", mono: true, below: true, group: id });

export default defineGuide({
  id: "the-agent-loop", track: "ai", module: "Agents", slug: "the-agent-loop",
  title: "The agent loop",
  summary: "An agent is a model that calls tools in a loop and reads each result before choosing the next step.",
  forLeads: "Agents trade cost and predictability for flexibility. The simplest design that solves the task is the right one, and a workflow often is.",
  status: "draft", minutes: 7,
  counters: ["Model calls", "Tool calls", "Context holds", "Stops when"],
  whatIf: { label: "What if it were one model call?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order details are illustrative",
    label: "A task enters a model. The model's tool call rides a loop to the tools and the systems they act on, and each result rides back into the context before the model chooses again. The loop ends with an answer.",
    els: [
      line("task-l", [G.p(-6.5, 0), G.p(-0.6, 0)], { always: true }),
      stop("s-task", ...G.p(-6.5, 0), "Task", "refund order 8812?", { at: "ne", big: true, always: true }),
      prism("model", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", tip: "Model: picks next action", at: "n", always: true }),
      line("loop", [G.p(0, -0.6), G.p(0, -5), G.p(7, -5), G.p(7, 0), G.p(0.6, 0)], { group: "tools" }),
      stop("p-t", ...G.p(0, -2.4), undefined, undefined, { group: "tools" }),
      stop("p-s", ...G.p(4.6, -5), undefined, undefined, { group: "back" }),
      stop("p-c", ...G.p(7, -1.2), undefined, undefined, { group: "back" }),
      prism("tools", -0.6, -5.6, 1.2, 1.2, 28, { hue: "sand", glyph: "wrench", title: "Tools", sub: "lookup, refund", at: "n", group: "tools" }),
      drum("sys", 7, -5, 1, 40, { hue: "sky", glyph: "stack", title: "Systems", sub: "orders, payments", at: "e", group: "back" }),
      ctx("ctx-1", [T]),
      ctx("ctx-2", [T, L]),
      ctx("ctx-3", [T, L, A]),
      line("ctx-lead", [[C[0], C[1] + 6], [C[0], 392]], { tone: "ink", w: 3, group: "tools" }),
      prism("ans", -0.6, 4.4, 1.2, 1.2, 26, { hue: "track", glyph: "check", title: "Answer", sub: "refund issued", at: "s", group: "done" }),
      line("ans-l", [G.p(0, 0.6), G.p(0, 4.4)], { w: 7, group: "done" }),
      pill("limit", [G.p(3.5, -2.5)[0], G.p(3.5, -2.5)[1] - 18], "Step limit: max iterations", { tone: "track", glyph: "flag", group: "limit" }),
    ],
  },
  steps: [
    step({
      id: "one-call", label: "One call", kind: "problem", title: "One model call cannot finish the task",
      caption: "A customer asks Vinterhus to refund order 8812. The model does not know whether the order was delivered, opened or already refunded. A single reply can only guess.",
      show: ["ctx-1"], counters: ["1", "0", "the task", "after one reply"],
      rides: [ride("task-l", 0, 0.5, "refund 8812?")],
      body: ["A customer asks Vinterhus to refund order 8812. The model does not know whether the order was delivered, opened or already refunded. A single reply can only guess."],
      claims: ["agent-ground-truth"],
    }),
    step({
      id: "tools", label: "Tools", kind: "idea", title: "The model chooses a tool",
      caption: "The model is given tools and decides which to call. Here it calls lookup_order. In an agent the model directs its own process. In a workflow the code decides the path.",
      show: ["ctx-1", "tools"], counters: ["1", "1", "the task", "not yet"],
      rides: [ride("loop", 0, "p-t", "lookup")],
      body: ["The model is given tools and decides which to call. Here it calls lookup_order. In an agent the model directs its own process. In a workflow the code decides the path.",
        { callout: { label: "Key idea", text: "The model proposes an action. The system around it performs the action." } }],
      claims: ["workflow-vs-agent"],
    }),
    step({
      id: "result", label: "Result", kind: "mechanism", title: "Each result returns to the context",
      caption: "The tool result is appended to the context and the model is called again. It now reads a fact from the order system: delivered on 12 November, unopened.",
      show: ["ctx-2", "tools", "back"], counters: ["2", "1", "task and 1 result", "not yet"],
      rides: [ride("loop", "p-t", "p-c", "lookup", { via: ["p-s"], then: "delivered" })],
      body: ["The tool result is appended to the context and the model is called again. It now reads a fact from the order system: delivered on 12 November and unopened. This is how the agent judges its progress."],
      claims: ["agent-ground-truth"],
    }),
    step({
      id: "loop", label: "Loop", kind: "mechanism", title: "The loop runs until the task is done",
      caption: "With the order eligible, the model calls refund, reads the approval and answers. Three model calls and two tool calls, and nobody scripted that sequence.",
      show: ["ctx-3", "tools", "back", "done"], counters: ["3", "2", "task and 2 results", "the model is done"],
      rides: [ride("loop", 0, "p-c", "refund", { via: ["p-t", "p-s"], then: "approved" }), ride("ans-l", 0, 0.5, "issued")],
      body: ["With the order confirmed as eligible, the model calls refund, reads the approval and writes the answer. The loop ran three model calls and two tool calls. Nobody scripted that sequence."],
      claims: ["workflow-vs-agent", "agent-stopping"],
    }),
    step({
      id: "compound", label: "Compounding", kind: "watch-out", title: "Each step adds cost and risk",
      caption: "Autonomy raises cost, and a wrong step feeds the next one. Production agents carry a stopping condition such as a maximum number of iterations, and are tested in a sandbox first.",
      show: ["ctx-3", "tools", "back", "done", "limit"], counters: ["3", "2", "task and 2 results", "done, or a step limit"],
      rides: [ride("loop", 0, "p-c", "call 3", { via: ["p-t", "p-s"] })],
      body: ["Autonomy raises cost, and a wrong step feeds the next one. Production agents carry a stopping condition such as a maximum number of iterations, and are tested in a sandbox before they touch real systems."],
      claims: ["agent-compounding", "agent-stopping"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Workflow or agent",
      caption: "",
      show: ["ctx-3", "tools", "back", "done", "limit"], counters: ["3", "2", "task and 2 results", "done, or a step limit"],
      rides: [ride("ans-l", 0, 0.5, "issued")],
      body: [{ pair: {
        left: { label: "Workflow", items: ["The steps are known in advance", "Predictability matters most", "One well-built call may be enough"] },
        right: { label: "Agent", items: ["The number of steps cannot be predicted", "Its decisions can be trusted here", "Results can be checked against the environment"] },
      } }],
      claims: ["agent-start-simple", "workflow-vs-agent"],
    }),
  ],
  governance: { text: "Autonomy raises cost and lets errors compound across steps, so developers add limits such as a maximum number of iterations.", claims: ["agent-compounding", "agent-stopping"] },
  closing: {
    pitfalls: [
      "Building an agent where a fixed sequence of calls would do.",
      "No step limit, so a confused loop runs until the budget is gone.",
      "Tools whose descriptions overlap, so the model picks the wrong one.",
    ],
    questions: [
      "What separates an agent from a workflow?",
      "How does an agent know whether its last action worked?",
      "What stops the loop?",
    ],
  },
});
