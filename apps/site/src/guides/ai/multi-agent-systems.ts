import { CANVAS, defineGuide, doc, drum, isoGrid, line, pawn, pill, raise, ride, step, stop, tank } from "@signal-path/engine";
import type { TankEl } from "@signal-path/engine";

// The floor: Support's question enters on the left and reaches one context window, a glass tank.
// Routes fan out from it to three stores: orders, reviews and carrier records. First one agent reads all
// three into its own window. Then a sub-agent with its own window stands on each route, and the first
// window, now the lead agent's, holds only the task and three summaries.
const G = isoGrid(140, 122, 30);
type Seg = TankEl["segs"][number];
const H = 85, CAP = 200, Y = 7.6, WX = 12, JX = 10.8;
const SX = [17.4, 19.7, 17.4];
const at = (gx: number, gy = 0) => G.p(gx, gy);
const win = (id: string, gx: number, gy: number, title: string, segs: Seg[], limit?: string) =>
  tank(id, gx, gy - 1, 2, 2, H, CAP, segs, { title, limit, group: id });
const task: Seg = { label: "task 2k", value: 2, hue: "ink" };
const brief: Seg = { label: "brief 1k", value: 1, hue: "violet" };
const orders: Seg = { label: "orders 70k", value: 70, hue: "sky" };
const reviews: Seg = { label: "reviews 60k", value: 60, hue: "sand" };
const carrier: Seg = { label: "carrier 60k", value: 60, hue: "mint" };
const rows = [-Y, 0, Y];
// Annotations sit in the open floor at the lower left.
const NOTE: [number, number] = [118, 428];

export default defineGuide({
  id: "multi-agent-systems", track: "ai", module: "Agents", slug: "multi-agent-systems",
  title: "Multi-agent systems",
  summary: "Several agents, each with its own context window, divide one task. The work runs in parallel and stays isolated, and the price is coordination and tokens.",
  forLeads: "More agents buy parallel work and clean contexts and cost more tokens. Give each agent its own identity and the least access its task needs, and name who answers for the combined result.",
  status: "draft", minutes: 7,
  counters: ["Agents", "Largest window", "Tokens in total", "Each agent reaches"],
  whatIf: { label: "What if one agent read everything?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Token counts, orders and products are illustrative",
    label: "Support's question enters on the left and reaches a context window drawn as a glass tank. Routes fan out to three stores: orders, reviews and carrier records. First one agent reads all three stores into one window, which fills to its limit. Then a lead agent hands a brief to three sub-agents, each a tank of its own on one route. Each sub-agent fills its own window from its own store and returns a short summary, so the lead's window stays almost empty. A vague brief makes one sub-agent repeat another's work. Then each sub-agent holds one read-only tool, a planted instruction in a review cannot reach the payments system, and a person approves refunds. Last, a trace log and a named owner stand behind the combined answer.",
    els: [
      // the question, and the routes from the first window to the three stores
      stop("s-task", ...at(-2.6), "Question", "from Support", { at: "n", big: true, always: true }),
      line("in", [at(-2.6), at(2)], { always: true }),
      line("r1", [at(4), at(JX), at(JX, -Y), at(WX, -Y)], { always: true }),
      line("r2", [at(4), at(WX)], { always: true }),
      line("r3", [at(4), at(JX), at(JX, Y), at(WX, Y)], { always: true }),
      ...rows.flatMap((gy, i) => [
        line(`g${i + 1}`, [at(WX, gy), at(WX + 2, gy)], { group: "solo-rails" }),
        line(`s${i + 1}`, [at(WX + 2, gy), at(SX[i] - 0.9, gy)], { always: true }),
      ]),
      drum("st1", SX[0], -Y, 0.9, 26, { hue: "sky", glyph: "table", title: "Orders", at: "s", always: true }),
      drum("st2", SX[1], 0, 0.9, 26, { hue: "sand", glyph: "lines", title: "Reviews", at: "s", group: "st2" }),
      drum("st2-bad", SX[1], 0, 0.9, 26, { hue: "sand", glyph: "lines", title: "Reviews", sub: "planted instruction", at: "s", state: "alert", group: "st2-bad" }),
      drum("st3", SX[2], Y, 0.9, 26, { hue: "mint", glyph: "map", title: "Carrier", at: "e", always: true }),

      // 1. one agent, one window
      win("solo", 2, 0, "One agent", [task, orders, reviews, carrier], "200k limit"),

      // 2 to 6. the lead agent's window and the three sub-agents
      win("lead-a", 2, 0, "Lead agent", [task, { label: "plan 2k", value: 2, hue: "violet", hot: true }]),
      win("lead-b", 2, 0, "Lead agent", [task, { label: "plan 2k", value: 2, hue: "violet" }, { label: "summaries 6k", value: 6, hue: "track", hot: true }]),
      win("w1-a", WX, -Y, "Orders agent", [brief]),
      win("w2-a", WX, 0, "Reviews agent", [brief]),
      win("w3-a", WX, Y, "Carrier agent", [brief]),
      win("w1", WX, -Y, "Orders agent", [brief, orders]),
      win("w2", WX, 0, "Reviews agent", [brief, reviews]),
      win("w3", WX, Y, "Carrier agent", [brief, carrier]),
      win("w3-dup", WX, Y, "Carrier agent", [brief, carrier, { ...orders, hot: true }]),
      pill("par", NOTE, "Run in parallel", { sub: "separate windows", glyph: "arrows", tone: "track", group: "par" }),

      // 4. the price
      pill("cost", NOTE, "About 15× chat tokens", { sub: "Anthropic, June 2025", glyph: "chart", tone: "alert", group: "cost" }),

      // 5. privilege separation
      pill("scope", NOTE, "One read-only tool each", { sub: "per-agent identity", glyph: "lock", tone: "track", group: "scope" }),
      line("pay", [at(3, 1), at(3, 3.7)], { w: 7, group: "pay" }),
      stop("gate", ...at(3, 2.3), undefined, undefined, { group: "pay" }),
      drum("payments", 3, 4.6, 0.9, 26, { hue: "rose", glyph: "key", title: "Payments", sub: "refund tool", at: "n", group: "pay" }),
      pawn("approver", 5.6, 4.2, "Approver", undefined, { group: "pay" }),

      // 6. accountability for the combined result
      raise(doc("trace", 0, 0, 170, 74, "Trace log", ["each brief, call, summary", "tied to agent identity"], { group: "trace" }), [872, 500], 30),
      pill("owner", NOTE, "Support owns the answer", { sub: "a documented role", glyph: "user", tone: "track", group: "trace" }),
    ],
  },
  steps: [
    step({
      id: "one-window", label: "One window", kind: "problem", title: "One agent reads every source into one window",
      caption: "Support asks why returns of SOFA-2210 are rising. One agent reads orders, reviews and carrier records in turn, and its context window is nearly full.",
      show: ["solo", "solo-rails", "st2"], counters: ["1", "192k of 200k", "192k", "every system"],
      rides: [ride("in", 0, 0.45, "returns?"), ride("r1", 1, 0.62, "orders 70k"), ride("r3", 1, 0.62, "carrier 60k")],
      body: ["The Vinterhus refund assistant is asked a research question. Answering it means reading three sources, one after another, and every result stays in the same context window.",
        "Multi-agent systems are suited to valuable tasks that involve heavy parallelisation, information that exceeds a single context window, and many complex tools. This task has the first two.",
        { callout: { label: "Key idea", text: "A side task floods the main context with search results, logs and file contents that are never needed again." } }],
      claims: ["multi-agent-systems-fit"],
    }),
    step({
      id: "split", label: "Split", kind: "idea", title: "A lead agent splits the task",
      caption: "The lead agent plans the work and hands each sub-agent a brief: an objective, an output format, the tools to use and clear boundaries. This is the orchestrator and sub-agents pattern.",
      show: ["lead-a", "w1-a", "w2-a", "w3-a", "st2"], counters: ["1 lead, 3 sub-agents", "4k", "7k", "every system"],
      rides: [ride("r1", 0, 0.86, "brief"), ride("r2", 0, 0.4, "brief"), ride("r3", 0, 0.52, "brief")],
      body: ["In the orchestrator and sub-agents pattern, also called orchestrator-worker, a lead agent coordinates the process and delegates to specialised sub-agents. The OpenAI Agents SDK calls the same shape a manager: it keeps control of the conversation and calls specialist agents as tools.",
        "Orchestration patterns showed a central model call delegating to worker calls. Here every worker is an agent with its own loop, its own tools and its own context window.",
        "The brief is the only thing a sub-agent knows about the task, so it has to carry the objective, the output format, guidance on tools and sources, and the task boundaries."],
      claims: ["multi-agent-systems-orchestrator", "multi-agent-systems-brief"],
    }),
    step({
      id: "isolate", label: "Isolate", kind: "mechanism", title: "Each sub-agent works in its own window",
      caption: "The three sub-agents run in parallel. Each fills its own context window from its own source and returns only a summary, so the lead's window stays almost empty.",
      show: ["lead-b", "w1", "w2", "w3", "st2", "par"], counters: ["1 lead, 3 sub-agents", "71k of 200k", "203k", "every system"],
      rides: [ride("r1", 1, 0.86, "summary"), ride("r2", 1, 0.4, "summary"), ride("r3", 1, 0.52, "summary")],
      body: ["These are parallel workers with context isolation. Sub-agents operate in parallel with their own context windows and condense the most important tokens for the lead agent. In Anthropic's research system the lead starts 3 to 5 sub-agents in parallel, not one after another, then synthesises their results and decides whether more research is needed.",
        "Context engineering used one sub-agent to keep a search out of the window. A multi-agent system is that move made the structure of the whole task.",
        { callout: { label: "What changed", text: "The same 190k of source material is read, but no window holds more than 71k of it." } }],
      claims: ["multi-agent-systems-isolation", "multi-agent-systems-parallel"],
    }),
    step({
      id: "price", label: "Price", kind: "watch-out", title: "Coordination and tokens are the price",
      caption: "A vague brief sends the carrier sub-agent over the orders again. Each agent spends tokens of its own. Anthropic measured about 15 times the tokens of a chat.",
      show: ["lead-b", "w1", "w2", "w3-dup", "st2", "cost"], counters: ["1 lead, 3 sub-agents", "131k of 200k", "273k", "every system"],
      rides: [ride("r3", 0, 0.3, "look into it", { tone: "alert" })],
      body: ["Without detailed task descriptions, agents duplicate work, leave gaps or fail to find necessary information. Coordination complexity grows rapidly with the number of agents.",
        "Each sub-agent spends tokens of its own while it runs. Anthropic reported in June 2025 that agents use about 4 times the tokens of a chat interaction and multi-agent systems about 15 times, so the task has to be valuable enough to pay for it.",
        "Work in which every agent needs the same context, or in which agents depend on each other's output, is a poor fit today."],
      claims: ["multi-agent-systems-brief", "multi-agent-systems-tokens", "multi-agent-systems-coordination"],
    }),
    step({
      id: "privileges", label: "Privileges", kind: "mechanism", title: "Each agent holds only the access its task needs",
      caption: "A review carries a planted instruction. The reviews sub-agent holds one read-only tool, so it cannot refund. Only the lead can request a refund, and a person approves it.",
      show: ["lead-b", "w1", "w2", "w3", "st2-bad", "scope", "pay"], counters: ["1 lead, 3 sub-agents", "71k of 200k", "203k", "one system"],
      rides: [ride("s2", 1, 0.6, "refund 4471!", { tone: "alert", then: "no tool" })],
      body: ["This is privilege separation between agents. OWASP lists the opposite as a vulnerability: a high-privilege manager delegates without least-privilege scoping, and a narrow worker receives excessive rights.",
        "The mitigations are task-scoped, time-bound permissions with per-agent identities and short-lived credentials, and human approval for high-privilege or irreversible actions.",
        "A compromised peer agent is one of the triggers OWASP names for Excessive Agency. A sub-agent that reads untrusted text is the likeliest to be turned, so it is the one that gets the least access."],
      claims: ["multi-agent-systems-privilege", "multi-agent-systems-peer", "multi-agent-systems-isolation"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "One agent or several",
      caption: "",
      show: ["lead-b", "w1", "w2", "w3", "st2", "pay", "trace"], counters: ["1 lead, 3 sub-agents", "71k of 200k", "203k", "one system"],
      rides: [ride("in", 1, 0.47, "answer")],
      body: [{ pair: {
        left: { label: "One agent", items: ["Work that shares one context", "Steps that depend on each other", "Lower token cost"] },
        right: { label: "Several agents", items: ["Subtasks that run in parallel", "More than one window holds", "Value that repays the tokens"] },
      } }],
      claims: ["multi-agent-systems-fit", "multi-agent-systems-coordination", "multi-agent-systems-tokens", "multi-agent-systems-trace", "multi-agent-systems-accountable"],
    }),
  ],
  governance: {
    text: "Give each agent its own identity and only the permissions its task needs: OWASP lists a manager passing its full access to a worker as privilege abuse. A log of every inter-agent message, bound to agent identities, keeps the combined result traceable, and a documented role answers for it.",
    claims: ["multi-agent-systems-privilege", "multi-agent-systems-trace", "multi-agent-systems-accountable"],
  },
  closing: {
    pitfalls: [
      "Splitting work that needs one shared context across several agents.",
      "A brief without boundaries, so two sub-agents do the same work.",
      "Every sub-agent inheriting the lead agent's full access.",
    ],
    questions: [
      "What does a sub-agent return to the lead agent, and what stays behind?",
      "Why does a multi-agent system spend more tokens than one agent?",
      "Which agent should hold the least access, and who answers for the result?",
    ],
  },
});
