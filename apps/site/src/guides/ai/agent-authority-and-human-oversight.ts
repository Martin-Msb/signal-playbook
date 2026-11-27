import { CANVAS, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";

// The floor: four arms meet at the centre block, where the refund assistant's calls arrive from the back left.
// Orders (read) is back right, Customers (delete) front left and Payments (pay out) front right. A customer's
// message reaches the assistant from the far left. The centre block changes from a set of tools on one key to a
// policy check, and an approval stop with a person appears on the Payments arm.
const G = isoGrid(440, 250, 30);
const K = "agent-authority-and-human-oversight";
const c = (...names: string[]) => names.map((n) => `${K}-${n}`);
const BOARD = G.p(-3.7, -3.7);
const GATE = 0.4;
const LEAD: [number, number] = [6, -4];
const PAY = [G.p(0.7, 0), G.p(9, 0)];
const centre = (id: string, hue: "sand" | "track", glyph: string, title: string, sub: string) =>
  prism(id, -0.7, -0.7, 1.4, 1.4, 34, { hue, glyph, title, sub, at: "s", group: id });
const board = (id: string, head: string, rows: Parameters<typeof table>[5]) =>
  raise(table(id, 0, 0, 240, ["tool", head], rows, { at: [12, 136], rowH: 22, mono: true, group: id }), BOARD, 24);
const lead = (id: string, say?: string) => pawn(id, ...LEAD, "Support lead", say, { hue: "track", group: id });

export default defineGuide({
  id: K, track: "ai", module: "Agents", slug: K,
  title: "Agent authority and human oversight",
  summary: "An agent can err or be manipulated. Its authority is limited to what the task needs, every call is checked outside the model, and irreversible actions wait for a person.",
  forLeads: "Decide which tools and limits each agent receives, which actions it may never take, and who approves the ones that cannot be undone. An approver who cannot review is not a control.",
  status: "draft", minutes: 8,
  counters: ["Tools held", "Refund limit", "Payouts", "Checked by"],
  whatIf: { label: "What if the agent kept every tool?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts, tool names and limits are illustrative",
    label: "A refund assistant sends tool calls to a centre block that reaches three systems: Orders, Customers and Payments. A customer's message reaches the assistant from the left. At first the assistant holds every tool on one key and a manipulated refund is paid out. Then its tools are cut to two with a refund limit, the centre block becomes a policy check with allow, ask and deny rules, and a payout waits at an approval stop for the Support lead. Later the lead approves a manipulated refund without reading it, and finally denies it after seeing a preview.",
    els: [
      pawn("customer", -7, 6, "Customer", undefined, { hue: "rose", always: true }),
      line("msg", [G.p(-7, 5.2), G.p(-7, 0.7)], { always: true }),
      prism("agent", -7.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Refund assistant", sub: "Support", at: "n", always: true }),
      line("call", [G.p(-6.4, 0), G.p(-0.7, 0)], { always: true }),
      drum("orders", 0, -7, 1, 40, { hue: "sky", glyph: "stack", title: "Orders", sub: "read", at: "e", always: true }),
      line("read", [G.p(0, -0.7), G.p(0, -6)], { always: true }),
      drum("customers", 0, 7, 1, 40, { hue: "sky", glyph: "user", title: "Customers", sub: "delete", at: "s", always: true }),
      drum("payments", 10, 0, 1, 40, { hue: "sky", glyph: "key", title: "Payments", sub: "pay out", at: "s", always: true }),

      centre("broad", "sand", "wrench", "Order tools", "one admin key"),
      line("del", [G.p(0, 0.7), G.p(0, 6)], { group: "broad" }),
      line("pay-a", PAY, { tone: "alert", group: "exposed" }),
      board("all", "limit", [["get_order", "read"], { cells: ["issue_refund", "any amount"], hot: true }, { cells: ["delete_customer", "any record"], hot: true }]),

      centre("scoped", "sand", "wrench", "Order tools", "scoped key"),
      line("del-x", [G.p(0, 0.7), G.p(0, 6)], { state: "closed", group: "least" }),
      line("pay", PAY, { group: "safe" }),
      board("grant", "limit", [["get_order", "read"], { cells: ["issue_refund", "max 1,500 kr"], hot: true }, { cells: ["delete_customer", "removed"], strike: true }]),

      centre("policy", "track", "shield", "Policy check", "outside the model"),
      board("rules", "rule", [["get_order", "allow"], { cells: ["issue_refund", "ask a person"], hot: true }, { cells: ["delete_customer", "deny"], strike: true }]),

      stop("approval", ...G.p(0.7 + 8.3 * GATE, 0), "Approval", undefined, { at: "s", group: "gate" }),
      lead("lead-ask", "approve 899 kr?"),
      lead("lead-tired", "yes, yes, yes"),
      pill("fatigue", [948, 254], "40 requests a day", { tone: "alert", glyph: "clock", anchor: "end", group: "lead-tired" }),
      lead("lead-read", "paid 899: deny"),
      pill("preview", [948, 254], "Preview shown", { tone: "track", glyph: "eye", anchor: "end", group: "lead-read" }),
    ],
  },
  steps: [
    step({
      id: "broad", label: "Broad key", kind: "problem", title: "Broad authority turns one bad decision into a payout",
      caption: "A customer's message tells the refund assistant to pay 48,000 kr. The assistant holds every order tool on one key. The call runs and the money leaves.",
      show: ["broad", "exposed", "all"], counters: ["3, one key", "none", "run at once", "nothing"],
      rides: [ride("msg", 0, 0.42, "pay me 48,000", { tone: "alert" }), ride("call", 0, 0.55, "issue_refund", { tone: "alert" }), ride("pay-a", 0, 0.55, "48,000 kr", { tone: "alert", then: "paid out" })],
      body: ["The assistant did what its authority allowed. OWASP calls this excessive agency: the vulnerability that enables damaging actions to be performed in response to unexpected, ambiguous or manipulated outputs from a model. Its three root causes are excessive functionality, excessive permissions and excessive autonomy.",
        "No attacker is needed. Anthropic states that the autonomous nature of agents means higher costs and the potential for compounding errors.",
        { callout: { label: "Key idea", text: "The model's mistake is bounded by what the agent is allowed to do, not by what it was told to do." } }],
      claims: c("excessive-agency", "autonomy-cost"),
    }),
    step({
      id: "least", label: "Least privilege", kind: "idea", title: "Authority is cut to what the task needs",
      caption: "The assistant keeps two tools and a refund limit of 1,500 kr. The same message arrives. The tool server refuses the call, and the delete tool is gone.",
      show: ["scoped", "least", "safe", "grant"], counters: ["2", "1,500 kr", "run at once", "token scope"],
      rides: [ride("msg", 0, 0.42, "pay me 48,000", { tone: "alert" }), ride("call", 0, 0.55, "issue_refund", { tone: "alert", then: "over limit" })],
      body: ["Least privilege is the principle that each entity is granted the minimum authorisations and resources needed to carry out its role. For an agent, OWASP turns it into three cuts: fewer tools, fewer functions in each tool and narrower permissions behind each tool, acting in the user's context with the narrowest scope.",
        "The OWASP Top 10 for Agentic Applications advises a least-privilege profile per tool, covering scopes, maximum rate and egress allowlists, with short-lived tokens issued per task. It adds least agency: avoid autonomy the task does not need, because it expands the attack surface without adding value.",
        { callout: { label: "What changed", text: "Two rows instead of three, and a ceiling on the refund. The message is unchanged." } }],
      claims: c("least-privilege", "minimise", "tool-profiles", "least-agency"),
    }),
    step({
      id: "policy", label: "Policy check", kind: "mechanism", title: "Every call is checked outside the model",
      caption: "A policy check stands between the assistant and the systems. Each call meets a rule: allow, ask or deny. A deny rule holds whatever the model was told.",
      show: ["policy", "least", "safe", "rules"], counters: ["2", "1,500 kr", "rule: ask", "scope, policy"],
      rides: [ride("read", 0, 0.5, "get_order 4471", { then: "allow" }), ride("call", 0, 0.5, "delete_customer", { tone: "alert", then: "deny" })],
      body: ["OWASP calls this complete mediation: authorisation is enforced in downstream systems rather than left to the model. Its agentic list treats model and planner output as untrusted and places a policy enforcement point before execution that validates intent and arguments.",
        "Agent frameworks ship the same shape. In the Claude Agent SDK a call is checked in order by hooks, deny rules, ask rules, the permission mode, allow rules and an approval callback. A matching deny rule holds even when permission prompts are bypassed.",
        "The privileged and quarantined model split rests on the same idea. The controller that executes actions is regular software, not a language model, and the quarantined model that reads untrusted content has no tools. CaMeL extends it: untrusted data cannot change the program flow, and capabilities enforce security policies when tools are called."],
      claims: c("mediation", "permission-order", "dual-split", "camel"),
    }),
    step({
      id: "gate", label: "Approval gate", kind: "mechanism", title: "An irreversible action waits for a person",
      caption: "A payout cannot be undone, so its rule is ask. The call stops at the gate with a preview. The Support lead approves, and only then does it run.",
      show: ["policy", "least", "safe", "rules", "gate", "lead-ask"], counters: ["2", "1,500 kr", "wait for a person", "scope, policy, person"],
      rides: [ride("call", 0, 0.55, "issue_refund"), ride("pay", 0, 0.72, "899 kr", { via: [GATE - 0.12], then: "approved" })],
      body: ["The OWASP Top 10 for Agentic Applications requires human confirmation for high-impact or destructive actions such as delete, transfer and publish, with a pre-execution plan or dry-run shown first, and human approval for high-privilege, irreversible or goal-changing actions.",
        "The refund assistant needs the gate for a second reason. It reads customer text, reaches private order data and changes state, which is all three legs of the lethal trifecta. The Agents Rule of Two states that an agent needing all three in one session should not operate autonomously and at a minimum requires supervision, through human-in-the-loop approval or another reliable means of validation.",
        "Anthropic describes the same pause from the loop's side: agents stop for human feedback at checkpoints or blockers, and stopping conditions such as a maximum number of iterations keep control."],
      claims: c("approval", "rule-of-two", "trifecta", "checkpoints"),
    }),
    step({
      id: "fatigue", label: "Rubber stamp", kind: "watch-out", title: "An approver who cannot review is not a control",
      caption: "The assistant asks forty times a day and explains every request well. A manipulated refund under the limit gets the same quick yes.",
      show: ["policy", "least", "exposed", "rules", "gate", "lead-tired"], counters: ["2", "1,500 kr", "approved unread", "scope, policy"],
      rides: [ride("msg", 0, 0.42, "urgent: 1,400", { tone: "alert" }), ride("pay-a", 0, 0.72, "1,400 kr", { tone: "alert", via: [GATE - 0.12], then: "paid out" })],
      body: ["The OWASP Top 10 for Agentic Applications, published in December 2025, lists this as Human-Agent Trust Exploitation, beside Agent Goal Hijack, Tool Misuse and Exploitation, Identity and Privilege Abuse and Rogue Agents. The risk grows when people over-rely on an agent's recommendations or unverifiable rationales and approve without independent validation. One of its scenarios is a finance copilot that reads a poisoned invoice and suggests an urgent payment, which the manager approves.",
        "Meta says the same of its own rule: a design that satisfies the Rule of Two can still fail when a user blindly confirms a warning, and the rule supplements least privilege rather than replacing it.",
        { callout: { label: "Key idea", text: "Reserve approval for the few actions that cannot be undone, and show the approver what will happen, not the agent's explanation." } }],
      claims: c("trust-exploitation", "rule-limits", "owasp-agentic"),
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Set the agent's authority",
      caption: "",
      show: ["policy", "least", "safe", "rules", "gate", "lead-read"], counters: ["2", "1,500 kr", "wait for a person", "scope, policy, person"],
      rides: [ride("pay", 0, GATE - 0.12, "1,400 kr", { tone: "alert", then: "denied" })],
      body: [{ pair: {
        left: { label: "Give the agent", items: ["Only the tools the task needs", "Short-lived, scoped credentials", "A limit on each action"] },
        right: { label: "Keep for a person", items: ["Irreversible actions", "High-privilege actions", "Goal-changing actions"] },
      } },
        "Logs and rate limits belong beside both lists. OWASP states that logging, monitoring and rate limiting do not prevent excessive agency but limit the damage, and its agentic list adds immutable logs of every tool invocation and usage ceilings that revoke or throttle when exceeded."],
      claims: c("approval", "tool-profiles", "limit-damage"),
    }),
  ],
  governance: { text: "Authority is set outside the model: policy fixes what the agent may never do, and a person approves high-privilege or irreversible actions. The EU Artificial Intelligence Act requires high-risk AI systems to be designed so that natural persons can effectively oversee them, stay aware of over-reliance and interrupt them.", claims: c("mediation", "approval", "eu-oversight") },
  closing: {
    pitfalls: [
      "One admin key for an agent that only needs to read orders and refund small amounts.",
      "Writing the limits into the prompt and letting the model decide whether a call is allowed.",
      "Asking for approval so often that every request is approved unread.",
    ],
    questions: [
      "Which of the assistant's tools did the task need, and which were removed?",
      "Why does a deny rule hold when the model has been manipulated?",
      "What must the approver see before an irreversible action runs?",
    ],
  },
});
