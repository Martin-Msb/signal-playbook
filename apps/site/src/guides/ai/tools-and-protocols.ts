import { CANVAS, code, defineGuide, drum, isoGrid, line, list, pill, prism, raise, ride, step, table } from "@signal-path/engine";

// The floor: four arms meet at the order tools. The refund assistant is back left, the Finance agent front left,
// the stock agent back right and the order system front right. A second rail joins the two agents on the left
// directly, and a community server later attaches to the stock agent on the far right.
const G = isoGrid(500, 290, 30);
const BOARD = G.p(-3.2, -3.2);
const agent = (id: string, gx: number, gy: number, title: string, sub: string, at: "n" | "s", extra: object = {}) =>
  prism(id, gx - 0.6, gy - 0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title, sub, at, ...extra });
const listed = (id: string, title: string, items: Parameters<typeof list>[4]) => raise(list(id, 0, 0, 216, items, { title, mono: true, group: id }), BOARD, 24);

export default defineGuide({
  id: "tools-and-protocols", track: "ai", module: "Agents", slug: "tools-and-protocols",
  title: "Tools and protocols",
  summary: "Tools are how an agent reads and changes the world. Put behind a server that speaks a shared protocol, one set of tools serves every agent that connects.",
  forLeads: "A tool server is third-party code holding credentials. Decide which servers may be connected, which scopes each agent receives and which calls need a person.",
  status: "draft", minutes: 8,
  counters: ["Agents served", "Protocols", "Tools listed", "Who may call"],
  whatIf: { label: "What if every team built its own tools?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Agents, orders, tool names and scopes are illustrative",
    label: "Three agents stand around a set of order tools that reach the order system. At first the tools belong to one application and a other agents cannot use them. The tools then move into a server that speaks the Model Context Protocol, lists its tools and serves all three agents. A second rail carries a task from one agent to another, and a skill card stands beside the first agent. Later an unknown server attaches to one agent, the tool server checks a token on each request, and a refund call without the right scope is refused.",
    els: [
      agent("support", -7, 0, "Refund assistant", "Support", "n", { always: true }),
      line("sup", [G.p(-6.4, 0), G.p(-0.7, 0)], { always: true }),
      agent("finance", 0, 7, "Finance agent", "Finance", "s", { always: true }),
      drum("orders", 7, 0, 1, 40, { hue: "sky", glyph: "stack", title: "Orders", sub: "order system", at: "e", always: true }),
      line("sys", [G.p(0.7, 0), G.p(6, 0)], { always: true }),

      agent("stock", 0, -7, "Stock agent", "Operations", "n", { always: true }),

      prism("own", -0.7, -0.7, 1.4, 1.4, 34, { hue: "sand", glyph: "wrench", title: "Order tools", sub: "inside one app", at: "s", group: "own" }),
      line("fin-x", [G.p(0, 6.4), G.p(0, 0.7)], { state: "planned", group: "own" }),
      line("stk-x", [G.p(0, -6.4), G.p(0, -0.7)], { state: "planned", group: "own" }),

      prism("server", -0.7, -0.7, 1.4, 1.4, 34, { hue: "track", glyph: "wrench", title: "Order tools", sub: "MCP server", at: "s", group: "server" }),
      line("fin-p", [G.p(0, 6.4), G.p(0, 0.7)], { state: "planned", group: "one" }),
      line("stk-p", [G.p(0, -6.4), G.p(0, -0.7)], { state: "planned", group: "one" }),
      listed("tools", "tools/list", ["get_order", "get_payment", "issue_refund"]),

      line("fin", [G.p(0, 6.4), G.p(0, 0.7)], { group: "many" }),
      line("stk", [G.p(0, -6.4), G.p(0, -0.7)], { group: "many" }),

      line("a2a", [G.p(-7, 0.7), G.p(-7, 7), G.p(-0.7, 7)], { group: "others" }),
      pill("a2a-name", [172, 275], "Agent2Agent", { tone: "track", group: "others" }),
      raise(code("skill", 0, 0, 184, ["name: refund-policy", "description: When to", "  refund or escalate"], { title: "SKILL.md", keywords: ["name:", "description:"], group: "others" }), G.p(-10.7, 2.2), 24),

      raise(table("scoped", 0, 0, 232, ["tool", "scope"], [["get_order", "orders:read"], ["get_payment", "orders:read"], { cells: ["issue_refund", "orders:refund"], hot: true }], { at: [12, 124], rowH: 22, mono: true, group: "scoped" }), BOARD, 24),
      pill("gate", [640, 252], "Token checked", { tone: "track", glyph: "key", anchor: "start", group: "gate" }),
      prism("community", 4.9, -7.6, 1.2, 1.2, 24, { hue: "rose", glyph: "globe", title: "Unknown server", sub: "unreviewed code", at: "s", state: "alert", group: "risk" }),
      line("com", [G.p(0.6, -7), G.p(4.9, -7)], { tone: "alert", group: "risk" }),

      prism("community-x", 4.9, -7.6, 1.2, 1.2, 24, { hue: "paper", glyph: "globe", title: "Unknown server", sub: "not connected", at: "s", state: "closed", group: "held" }),
      line("com-x", [G.p(0.6, -7), G.p(4.9, -7)], { state: "closed", group: "held" }),
      pill("approve", [400, 275], "Person confirms", { tone: "track", glyph: "user", anchor: "end", group: "held" }),
    ],
  },
  steps: [
    step({
      id: "built-in", label: "Built in", kind: "problem", title: "Tools built into one application serve one agent",
      caption: "The refund assistant's order tools live in its own code. Finance's agent needs the same lookup and has no way in. Each team writes its connector again.",
      show: ["own"], counters: ["1", "none", "0", "one application"],
      rides: [ride("sup", 0, 0.5, "get_order 4471"), ride("fin-x", 0, 0.42, "get_order?", { tone: "alert", then: "no connector" })],
      body: ["Support's refund assistant reaches the order system through functions defined inside its own application. Finance builds an agent that needs the same order lookup, and the functions cannot be called from outside.",
        "The Model Context Protocol exists to standardise this integration. Its specification compares it to the Language Server Protocol, which standardised how development tools add support for programming languages."],
      claims: ["tools-and-protocols-purpose"],
    }),
    step({
      id: "server", label: "Server", kind: "idea", title: "A tool server speaks a shared protocol",
      caption: "The tools move into a server that speaks the Model Context Protocol. A client in the agent's host sends tools/list and receives each tool's name, description and input schema.",
      show: ["server", "one", "tools"], counters: ["1", "MCP", "3", "any MCP client"],
      rides: [ride("sup", 0, 0.5, "tools/list", { then: "3 tools" })],
      body: ["The protocol names three roles. The host is the LLM application, a client is a connector inside the host, and a server provides context and capabilities. A host runs one client per server, and a server can be a local process or a remote service. Messages are JSON-RPC 2.0.",
        "The current revision of the specification is 2026-07-28. It makes the protocol stateless: every request is self-contained and carries its own protocol version and capabilities.",
        "The list is short on purpose. Anthropic states that more tools do not always lead to better outcomes and recommends a few thoughtful tools aimed at specific high-impact workflows, because agents get confused when tools overlap or have a vague purpose. Grouping related tools under a common prefix helps when there are many.",
        { callout: { label: "Key idea", text: "The tool is written once, behind a protocol. Any agent with a client can discover it." } }],
      claims: ["tools-and-protocols-roles", "tools-and-protocols-tools", "tools-and-protocols-revision", "tools-and-protocols-small-sets"],
    }),
    step({
      id: "many", label: "Many agents", kind: "mechanism", title: "One server serves many agents",
      caption: "Finance and Operations connect their own agents to the same server. Each sends tools/call with a tool name and arguments. The conversation stays with each host.",
      show: ["server", "tools", "many"], counters: ["3", "MCP", "3", "any MCP client"],
      rides: [ride("fin", 0, 0.5, "tools/call"), ride("stk", 0, 0.5, "tools/call"), ride("sys", 0, 0.55, "get_order 4471")],
      body: ["A tools/call request carries the tool name and its arguments, and the result returns to the client that asked. The agent loop is unchanged: the model proposes a call and the host has it carried out.",
        "The protocol's design principles keep servers composable. Each server provides focused functionality in isolation, a host can combine several, and a server receives only the context it needs. The full conversation history stays with the host, and one server cannot see into another."],
      claims: ["tools-and-protocols-tools", "tools-and-protocols-composable", "tools-and-protocols-purpose"],
    }),
    step({
      id: "others", label: "Other standards", kind: "mechanism", title: "Agents and instructions have their own standards",
      caption: "The Agent2Agent protocol lets the refund assistant hand a task to Finance's agent without seeing its tools. An Agent Skill is a folder of instructions an agent loads when needed.",
      show: ["server", "tools", "many", "others"], counters: ["3", "MCP, Agent2Agent", "3", "any MCP client"],
      rides: [ride("a2a", 0, 0.86, "task")],
      body: ["The Agent2Agent protocol is designed for independent, potentially opaque agent systems that work together without access to each other's internal state, memory or tools. Its unit of work is a task. An agent describes itself in an Agent Card, a JSON document with its identity, endpoint, skills and required authentication, published at /.well-known/agent-card.json.",
        "The A2A project describes the two protocols as complementary: A2A connects agents to each other, and MCP connects each agent to its own tools.",
        "An Agent Skill is a directory with a SKILL.md file: a name, a description and Markdown instructions. Only the name and description are loaded at startup. The body is loaded when the skill is activated, and scripts and reference files only when required."],
      claims: ["tools-and-protocols-a2a", "tools-and-protocols-agent-card", "tools-and-protocols-skills"],
    }),
    step({
      id: "trust", label: "Trust", kind: "watch-out", title: "Every connected server is a trust decision",
      caption: "A server is someone else's code, and its tool descriptions are untrusted unless the server is trusted. A protected server validates a token on every request. Scopes can limit each caller's tools.",
      show: ["server", "scoped", "many", "others", "gate", "risk"], counters: ["3", "MCP, Agent2Agent", "3, by scope", "token and scope"],
      rides: [ride("com", 1, 0.5, "payload", { tone: "alert" }), ride("fin", 0, 0.5, "issue_refund", { tone: "alert", then: "403 Forbidden" })],
      body: ["The specification states that tools represent arbitrary code execution. A local server is a binary downloaded and run on the same machine as the client, so an attacker can ship a malicious payload inside the server or a malicious startup command in its configuration.",
        "Authorisation is optional in the protocol. Where it is used over HTTP it follows OAuth 2.1: the server is a resource server, the token travels with every request, and the server checks that the token was issued for it.",
        "The tools a server lists may vary with the authorisation presented, for example only the tools the caller's scopes permit. A call whose token lacks the scope is answered with 403 Forbidden and the scopes needed.",
        { callout: { label: "What changed", text: "Finance's token carries orders:read. Its refund call stops at the server." } }],
      claims: ["tools-and-protocols-untrusted", "tools-and-protocols-supply-chain", "tools-and-protocols-auth", "tools-and-protocols-scopes"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Controls for a tool server",
      caption: "",
      show: ["server", "scoped", "many", "others", "gate", "held"], counters: ["3", "MCP, Agent2Agent", "3, by scope", "token, scope, person"],
      rides: [ride("sup", 0, 0.5, "issue_refund"), ride("sys", 0, 0.5, "899 kr")],
      body: [{ pair: {
        left: { label: "Require", items: ["The exact launch command shown", "Tokens issued for this server", "A person who can deny calls"] },
        right: { label: "Refuse", items: ["Token passthrough", "Wildcard scopes", "Annotations from untrusted servers"] },
      } },
        "The specification asks for a human in the loop with the ability to deny tool invocations, confirmation on sensitive operations and a log of tool usage. A server must not accept or pass on a token that was not issued for it."],
      claims: ["tools-and-protocols-consent", "tools-and-protocols-passthrough", "tools-and-protocols-supply-chain", "tools-and-protocols-untrusted"],
    }),
  ],
  governance: { text: "A tool server is code from a supply chain, holding credentials. The client shows the exact command before a local server runs, the server validates a token issued for it on every request, and scopes limit which tools each agent can call.", claims: ["tools-and-protocols-supply-chain", "tools-and-protocols-auth", "tools-and-protocols-scopes"] },
  closing: {
    pitfalls: [
      "Installing a server from a registry without reading what it runs.",
      "One broad token for every agent, so a read-only agent can issue refunds.",
      "Dozens of overlapping tools where three clear ones would do.",
    ],
    questions: [
      "What does a client learn from tools/list?",
      "Why can a second agent use the server without new connector code?",
      "Which job belongs to MCP, which to Agent2Agent and which to an Agent Skill?",
    ],
  },
});
