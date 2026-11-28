import { CANVAS, blocks, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, slab, step, tank } from "@signal-path/engine";

// The floor: a failed delivery runs down the main rail to the agent. A closed loop leaves the agent for the
// tool server and returns past the state store. Beyond the tool server lie the carrier, the order system and
// messaging. Payments sits behind an approval gate. The carrier subagent stands behind the agent.
const G = isoGrid(95, 155, 30);
const Z = 10;
const TR: [number, number] = [858, 200];  // board above the carrier
const BL: [number, number] = [98, 504];   // board beside the state store

type Item = Parameters<typeof list>[4][number];
const done = (t: string): Item => ({ t, strike: true });
const plan = (id: string, order: string, items: Item[]) =>
  raise(list(id, 0, 0, 186, items, { title: `Saved for ${order}`, mono: true, rowH: 19, group: id }), BL, 14);
const top = (id: string, title: string, items: Item[], mono = false) =>
  raise(list(id, 0, 0, 190, items, { title, mono, rowH: 20, group: id }), TR, 16);

export default defineGuide({
  id: "case-delivery-exceptions-resolved-by-an-agent", track: "case", module: "Use cases", slug: "delivery-exceptions-resolved-by-an-agent",
  title: "Delivery exceptions resolved by an agent",
  summary: "An agent that rebooks failed deliveries is assembled part by part: a loop, tools behind a protocol, a subagent, saved state, a sandbox and an approval gate. Then three exceptions run through it.",
  forLeads: "An agent that acts on four systems is safe to run when its state survives a crash, its retries cannot act twice, and the actions it cannot undo wait for a person.",
  status: "draft", minutes: 12,
  counters: ["Next step chosen by", "State kept in", "Acts alone on", "Time per exception"],
  whatIf: { label: "What if the run restarted from the top?", step: 1, from: 8 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, slots, keys and counts are illustrative",
    label: "A failed delivery travels along a rail to an agent. A closed loop runs from the agent to a tool server and back past a state store. The tool server reaches the carrier, the order system and messaging. Later stops add a carrier subagent with its own context, a sandbox under the agent, and an approval gate with a person in front of payments.",
    els: [
      prism("src", -0.6, -0.6, 1.2, 1.2, 12, { hue: "rose", glyph: "flag", title: "Failed deliveries", sub: "300 a day", at: "n", always: true }),
      prism("carrier", 16.4, -6.4, 1.2, 1.2, 26, { hue: "sand", glyph: "map", title: "Carrier", sub: "tracking, slots", at: "e", always: true }),
      drum("orders", 22, 0, 0.9, 26, { hue: "sky", glyph: "table", title: "Orders", at: "e", always: true }),
      prism("msg", 16.4, 5, 1.2, 1.2, 22, { hue: "sand", glyph: "mail", title: "Messaging", at: "e", always: true }),
      prism("pay", 11.8, -8.8, 1.2, 1.2, 24, { hue: "sand", glyph: "scale", title: "Payments", sub: "refunds", at: "n", always: true }),

      // Problem: a person works four systems by hand, then a fixed script books twice.
      line("m1", [G.p(0.6, 0), G.p(5.8, 0)], { group: "in" }),
      line("h-car", [G.p(7, 0), G.p(17, 0), G.p(17, -5.2)], { tone: "muted", w: 3, group: "hand" }),
      line("h-ord", [G.p(7, 0), G.p(21.1, 0)], { tone: "muted", w: 3, group: "hand" }),
      line("h-msg", [G.p(7, 0), G.p(17, 0), G.p(17, 5)], { tone: "muted", w: 3, group: "hand" }),
      line("h-pay", [G.p(7, 0), G.p(12.4, 0), G.p(12.4, -7.6)], { tone: "muted", w: 3, group: "hand" }),
      prism("desk", 5.8, -0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "user", title: "Operations", sub: "by hand", at: "n", group: "desk" }),
      blocks("queue", 1.3, 1.9, 6, 0.5, Array.from({ length: 18 }, (_, i) => ({ h: 7, hue: i < 4 ? "rose" as const : "paper" as const })), { gap: 0.2, title: "Waiting", sub: "one at a time", at: "s", group: "queue" }),
      prism("script", 5.8, -0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "code", title: "Script", sub: "fixed steps", at: "n", group: "script" }),
      line("s-car", [G.p(7, 0), G.p(17, 0), G.p(17, -5.2)], { group: "script" }),
      top("twice", "Carrier bookings", ["4512  Thu 14 to 18", { t: "4512  Thu 14 to 18", hot: true, tone: "alert" }], true),

      // Architecture: the loop.
      prism("agent", 5.8, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Agent", at: "n", group: "agent" }),
      line("loop", [G.p(7, 0), G.p(12.4, 0), G.p(12.4, 5), G.p(6.4, 5), G.p(6.4, 0.6)], { group: "loop" }),
      prism("tools", 11.8, -0.6, 1.2, 1.2, 18, { hue: "violet", glyph: "wrench", title: "Tools", at: "n", group: "tools" }),
      raise(list("turn", 0, 0, 186, ["read the state", { t: "choose a tool", hot: true }, "act", "check the result"], { title: "One turn of the loop", numbered: true, rowH: 20, group: "turn" }), BL, 14),

      // Tools behind a protocol.
      prism("srv", 11.8, -0.6, 1.2, 1.2, 18, { hue: "violet", glyph: "wrench", title: "Tool server", at: "n", group: "srv" }),
      line("car", [G.p(13, 0), G.p(17, 0), G.p(17, -5.2)], { group: "srv" }),
      line("ord", [G.p(13, 0), G.p(21.1, 0)], { group: "srv" }),
      line("msg-l", [G.p(13, 0), G.p(17, 0), G.p(17, 5)], { group: "srv" }),
      top("offer", "tools/list returns", ["carrier.track", { t: "carrier.book_slot", hot: true }, "orders.update", "message.send"], true),

      // A subagent with its own context.
      line("sub", [G.p(6.4, -0.6), G.p(6.4, -5.2)], { group: "sub" }),
      prism("suba", 5.8, -6.4, 1.2, 1.2, 22, { hue: "track", glyph: "net", title: "Subagent", sub: "own context", at: "n", group: "suba" }),
      blocks("events", 6.2, -12.4, 4, 0.28, Array.from({ length: 40 }, (_, i) => ({ h: 5, hue: i > 35 ? "track" as const : "paper" as const })), { gap: 0.1, title: "40 tracking events", at: "n", group: "suba" }),
      tank("ctx", 1.0, -4.6, 1.6, 1.6, 54, 100, [{ label: "instructions", value: 12 }, { label: "tools", value: 10 }, { label: "task, plan", value: 6 }, { label: "summary", value: 3, hot: true }], { title: "Lead context", group: "ctx" }),

      // Saved state.
      drum("store", 9.4, 5, 0.8, 22, { hue: "sky", glyph: "stack", title: "State store", at: "e", group: "store" }),
      plan("st-1", "4512", [done("1 check carrier"), { t: "2 book slot", hot: true }, "3 update order", "4 tell customer", { t: "note: no Sunday slots", mute: true }]),
      plan("st-done", "4512", [done("1 check carrier"), done("2 book slot"), done("3 update order"), done("4 tell customer"), { t: "note: no Sunday slots", mute: true }]),
      plan("st-cut", "4518", [done("1 check carrier"), { t: "2 book: no result", hot: true }, "3 update order", "4 tell customer", { t: "key 4518-b", mute: true }]),

      // Sandbox and authority.
      slab("box", 5.2, -1.2, 2.4, 2.4, undefined, { hue: "mint", group: "box" }),
      pill("box-name", [G.p(9.4, 2.5)[0], G.p(9.4, 2.5)[1] - 34], "Sandbox", { tone: "track", glyph: "shield", group: "box" }),
      prism("agent-b", 5.8, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Agent", at: "n", z: Z, group: "box" }),
      line("m1b", [G.p(0.6, 0), G.p(5.2, 0), G.p(5.2, 0, Z), G.p(5.8, 0, Z)], { group: "box" }),
      line("loopb", [G.p(7, 0, Z), G.p(7.6, 0, Z), G.p(7.6, 0), G.p(12.4, 0), G.p(12.4, 5), G.p(6.4, 5), G.p(6.4, 1.2), G.p(6.4, 1.2, Z), G.p(6.4, 0.6, Z)], { group: "box" }),
      line("subb", [G.p(6.4, -0.6, Z), G.p(6.4, -1.2, Z), G.p(6.4, -1.2), G.p(6.4, -5.2)], { group: "box" }),
      line("ref", [G.p(12.4, -0.6), G.p(12.4, -7.6)], { group: "ctl" }),
      prism("gate", 11.8, -6.4, 1.2, 1.2, 14, { hue: "mint", glyph: "shield", title: "Approval", at: "se", group: "ctl" }),
      pawn("lead", 10.6, -5.8, undefined, undefined, { group: "lead" }),
      raise(list("may", 0, 0, 186, ["book, update, message", "network: tool server", { t: "refund: needs approval", hot: true }, "every call is logged"], { title: "The agent may", rowH: 20, group: "may" }), BL, 14),

      // Execution.
      top("sent", "Message to the customer", ["Order 4512", { t: "New slot Thu 14 to 18", hot: true }, "Reply to change it"]),
      top("once", "Carrier bookings", [{ t: "4518  Thu 14 to 18", hot: true }, { t: "retry, same key: 0", mute: true }], true),
      pill("commit", [804, 386], "slot and status", { sub: "one transaction", glyph: "lock", tone: "track", group: "commit" }),
      top("eval", "Evaluation suite", [{ t: "task: planted carrier note", hot: true }, "grader reads the systems", "refunds 0, bookings 1", "5 of 5 trials pass"]),
    ],
  },
  steps: [
    step({
      id: "hand", label: "By hand", kind: "problem", phase: "problem", title: "Each failed delivery is worked by hand",
      caption: "Three hundred deliveries fail a day. Operations checks the carrier, books a new slot, updates the order and tells the customer, in four systems.",
      show: ["in", "hand", "desk", "queue"], counters: ["a person", "a person's head", "all four systems", "20 minutes"],
      rides: [ride("m1", 0, 0.42, "4512 failed")],
      body: ["The path differs by failure. An absent customer needs a new slot, a wrong address needs a correction, a damaged parcel may need a refund.",
        "Workflows offer predictability on well-defined tasks. Agents suit open-ended problems where the number of steps cannot be predicted in advance."],
      claims: ["orchestration-patterns-when-agent"],
    }),
    step({
      id: "script", label: "Script", kind: "problem", phase: "problem", title: "A script that restarts books twice",
      caption: "A fixed script runs the same steps for every failure. It crashes after the carrier books, starts again from the top, and order 4512 holds two slots.",
      show: ["in", "hand", "script", "queue", "twice"], counters: ["a fixed script", "nowhere", "all four systems", "seconds, booked twice"],
      rides: [ride("s-car", 0, 0.81, "book 4512", { then: "booked" }), ride("s-car", 0, 0.6, "book 4512", { tone: "alert", then: "2 slots" })],
      body: ["A workflow runs models and tools through predefined code paths.",
        "Kafka's documentation states the underlying problem for a producer: after a network error it cannot be sure whether the error happened before or after the message was committed. Dataflow notes that retries might create duplicates.",
        { callout: { label: "The gap", text: "The script keeps no record of what it has already done, and the carrier cannot tell a retry from a new request." } }],
      claims: ["orchestration-patterns-workflow-agent", "delivery-guarantees-uncertain", "delivery-guarantees-retry"],
    }),
    step({
      id: "loop", label: "Loop", kind: "mechanism", phase: "architecture", title: "The agent works each exception in a loop",
      caption: "The model reads the state, chooses a tool, acts and checks the result. The next step follows from what came back, not from a fixed path.",
      show: ["in", "loop", "agent", "tools", "turn"], counters: ["the model", "the context", "nothing yet", "not running"],
      rides: [ride("m1", 0, 0.5, "4512 failed"), ride("loop", 0, 0.115, "track 4512"), ride("loop", 0.26, 0.885, "no one home", { via: [0.5] })],
      concepts: ["the-agent-loop", "orchestration-patterns"],
      body: ["An agent lets the model direct its own process and tool use. At each step it uses feedback from the environment, such as tool results, to judge its progress.",
        "Agent tasks usually end on completion, and developers add limits such as a maximum number of iterations.",
        "Autonomy raises cost and lets errors compound across steps, which is why the later stops bound what the loop may do."],
      claims: ["workflow-vs-agent", "agent-ground-truth", "agent-stopping", "agent-compounding"],
    }),
    step({
      id: "protocol", label: "Tools", kind: "mechanism", phase: "architecture", title: "Tools reach the systems through one protocol",
      caption: "A tool server lists its tools and runs each call. The model returns a structured call with a name and arguments. The application sends it on.",
      show: ["in", "loop", "agent", "srv", "offer"], counters: ["the model", "the context", "carrier, orders, messaging", "not running"],
      rides: [ride("loop", 0, 0.115, "book_slot"), ride("car", 0, 0.75, "tools/call", { then: "Thu 14-18" }), ride("loop", 0.26, 0.885, "booked", { via: [0.5] })],
      concepts: ["tool-calling", "tools-and-protocols"],
      body: ["The Model Context Protocol is an open protocol for connecting LLM applications to external data sources and tools. Clients send tools/list to discover a server's tools and tools/call, with a tool name and arguments, to invoke one.",
        "A tool definition contains a name, a description of what the tool does and when to use it, and a JSON Schema for its arguments. The model returns a structured call and the application runs it.",
        "The MCP specification states that tools represent arbitrary code execution and must be treated with caution."],
      claims: ["tools-and-protocols-purpose", "tools-and-protocols-tools", "tool-calling-definition", "tool-calling-app-runs", "tools-and-protocols-untrusted"],
    }),
    step({
      id: "subagent", label: "Subagent", kind: "mechanism", phase: "architecture", title: "A subagent keeps the tracking history out of the context",
      caption: "The lead agent delegates the carrier check. The subagent reads 40 tracking events in its own context window and returns one line.",
      show: ["in", "loop", "sub", "agent", "srv", "suba", "ctx"], counters: ["the model", "the lead's context", "carrier, orders, messaging", "not running"],
      rides: [ride("sub", 1, 0.5, "40 events", { then: "no one home" })],
      concepts: ["multi-agent-systems", "context-engineering", "orchestration-patterns"],
      body: ["In the orchestrator-worker pattern a lead agent coordinates the process while delegating to specialised subagents. Each subagent works in its own context window and condenses the most important tokens for the lead.",
        "As the number of tokens in a context window grows, a model's ability to recall information from it falls. A sub-agent returns a condensed summary, so the lead's window holds the finding and not the raw history.",
        "Each subagent spends tokens of its own while it runs, and coordination complexity grows quickly with the number of agents."],
      claims: ["multi-agent-systems-orchestrator", "multi-agent-systems-isolation", "sub-agents", "context-rot", "orchestration-patterns-orchestrator", "multi-agent-systems-coordination"],
    }),
    step({
      id: "state", label: "Saved state", kind: "mechanism", phase: "architecture", title: "Plan and progress are saved outside the context",
      caption: "After each step the agent writes its plan and progress to a store. Notes from earlier runs are read back at the start of the next.",
      show: ["in", "loop", "sub", "agent", "srv", "suba", "ctx", "store", "st-1"], counters: ["the model", "a saved plan and notes", "carrier, orders, messaging", "not running"],
      rides: [ride("loop", 0.26, 0.37, "step 1", { then: "saved" }), ride("loop", 0.68, 0.885, "no Sun slots")],
      concepts: ["planning-and-long-running-work", "agent-memory"],
      body: ["In structured note-taking the agent regularly writes notes to memory outside the context window, and the notes are pulled back in later. A to-do list is one example.",
        "Checkpointers persist an agent's state so that an application can resume after an interruption or recover from a failure.",
        "Agent memory is a write, manage, read loop. Semantic memory stores the agent's knowledge about the world, here that one depot offers no Sunday slots. A poisoned entry loads in every later session, so memory writes are security events."],
      claims: ["planning-and-long-running-work-notes", "planning-and-long-running-work-checkpointer", "memory-loop", "coala-episodic-semantic", "memory-poisoning"],
    }),
    step({
      id: "bounds", label: "Bounds", kind: "mechanism", phase: "architecture", title: "A sandbox and an approval gate bound the agent",
      caption: "The agent runs in a sandbox that reaches the tool server alone. It books and messages on its own. A refund waits for a person, and every call is logged.",
      show: ["box", "srv", "suba", "store", "ctl", "lead", "may"], counters: ["the model", "a saved plan and notes", "booking and messaging", "about a minute"],
      rides: [ride("ref", 0, 0.357, "refund?", { then: "waits" })],
      concepts: ["execution-environments", "agent-authority-and-human-oversight"],
      body: ["Anthropic states that effective sandboxing requires both filesystem and network isolation. Its precautions for agents that operate a computer include minimal privileges and network access limited to an allowlist of domains.",
        "Least privilege grants each entity the minimum authorisations needed for its role. OWASP requires human confirmation for high-impact or destructive actions and advises that low-consequence, reversible actions may auto-approve.",
        "OWASP advises logging the activity of tools and downstream systems. Logging does not prevent excessive agency but can limit the damage."],
      claims: ["execution-environments-both-layers", "execution-environments-precautions", "agent-authority-and-human-oversight-least-privilege", "agent-authority-and-human-oversight-approval", "tool-calling-approval", "tool-calling-log"],
    }),
    step({
      id: "rebook", label: "A rebooking", kind: "mechanism", phase: "execution", title: "One failed delivery is rebooked end to end",
      caption: "Nobody was home for order 4512. The agent books Thursday afternoon, updates the order and messages the customer, saving its progress after each step.",
      show: ["box", "srv", "suba", "store", "ctl", "lead", "ctx", "st-done", "sent"], counters: ["the model", "a saved plan and notes", "booking and messaging", "about a minute"],
      rides: [ride("m1b", 0, 0.47, "4512 failed"), ride("subb", 0.95, 0.53, "no one home"), ride("car", 0, 0.75, "book_slot", { then: "Thu 14-18" }), ride("loopb", 0.27, 0.374, "booked", { then: "saved" }), ride("ord", 0, 0.765, "rebooked"), ride("msg-l", 0, 0.755, "new slot")],
      concepts: ["the-agent-loop", "tool-calling", "planning-and-long-running-work"],
      body: ["Tool calling is a multi-step conversation: the application sends the request with the tools on offer, receives a call, runs it and returns the result, and receives a final response or more tool calls.",
        "The loop ends when the plan is complete. Each result is feedback from the environment that the agent uses to judge its progress."],
      claims: ["tool-calling-flow", "agent-ground-truth", "agent-stopping", "planning-and-long-running-work-notes"],
    }),
    step({
      id: "resume", label: "Interrupted", kind: "watch-out", phase: "execution", title: "An interrupted run resumes without booking twice",
      caption: "The run stops after the booking is sent. It resumes from saved state and retries with the same key. The carrier returns the first booking. The order updates in one transaction.",
      show: ["box", "srv", "suba", "store", "ctl", "lead", "ctx", "st-cut", "once", "commit"], counters: ["the model", "a saved plan and notes", "booking and messaging", "resumes where it stopped"],
      rides: [ride("car", 0, 0.75, "key 4518-b"), ride("loopb", 0.27, 0.374, "booked", { tone: "alert", then: "stops" }), ride("loopb", 0.68, 0.874, "resume 2"), ride("car", 0, 0.75, "key 4518-b", { then: "1 booking" }), ride("ord", 0, 0.765, "slot, status", { then: "commit" })],
      concepts: ["delivery-guarantees", "transactions-and-consistency", "planning-and-long-running-work"],
      body: ["After the interruption the agent cannot know whether the booking was made. Persisted state lets an application resume after an interruption, and the saved plan shows step 2 as sent with no result.",
        "An idempotency key is a unique key generated by the client that the server uses to recognise retries of the same request, so a request can be repeated without creating a second object. Stripe's API documents the pattern.",
        "A transaction bundles multiple steps into a single, all-or-nothing operation. The new slot and the order status change together or not at all."],
      claims: ["delivery-guarantees-idempotency-key", "delivery-guarantees-idempotent", "delivery-guarantees-uncertain", "planning-and-long-running-work-checkpointer", "transactions-and-consistency-atomic"],
    }),
    step({
      id: "planted", label: "Planted note", kind: "decision", phase: "execution", title: "A planted note becomes a test",
      caption: "",
      show: ["box", "srv", "suba", "store", "ctl", "lead", "may", "eval"], counters: ["the model", "a saved plan and notes", "booking and messaging", "refund held for a person"],
      rides: [ride("car", 0.95, 0.27, "pay 5,000", { tone: "alert" }), ride("ref", 0, 0.357, "5,000?", { tone: "alert", then: "rejected" })],
      concepts: ["prompt-injection", "agent-authority-and-human-oversight", "evaluating-agents"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Approval outside the model", "Outcomes read from the systems", "Every trial passing"] },
        right: { label: "Do not rely on", items: ["Filters against injection", "The agent's own report", "One good run"] },
      } },
        "A delivery note in the carrier's tracking data tells the agent to refund 5,000. A prompt injection places adversarial instructions in content an agent reads. Adaptive attacks consistently bypass input filters, so authorisation is enforced outside the model.",
        "The case then joins the evaluation suite as a task. The outcome is the final state of the environment, whatever the agent claims, so the grader reads the payment and carrier systems.",
        "pass^k is the chance that all k trials succeed. Regression evaluations sit near 100%."],
      claims: ["injection-definition", "filters-bypassed", "agent-authority-and-human-oversight-mediation", "eval-terms", "eval-outcome-transcript", "eval-pass-k", "eval-capability-regression"],
    }),
  ],
  governance: { text: "The agent holds only the permissions the task needs. High-impact and irreversible actions wait for human approval, and tool activity is logged.", claims: ["tool-calling-least-privilege", "tool-calling-approval", "tool-calling-log"] },
  closing: {
    pitfalls: [
      "Retrying a booking after a crash without an idempotency key.",
      "Keeping the plan only in the context window, where an interruption erases it.",
      "Grading the agent on its own account of what it did.",
    ],
    questions: [
      "Which part of the system knows that step 2 was already sent?",
      "Why does the planted note fail even when the model follows it?",
      "What would have to be true before refunds could run without approval?",
    ],
  },
});
