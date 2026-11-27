import { CANVAS, code, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, table } from "@signal-path/engine";
import type { Row } from "@signal-path/engine";

// The floor: four arms meet at the application. The customer is front left, the model back left,
// the order system back right and the payment system front right. Only the application touches the
// systems. The tools it offers stand on a card behind it, and its call log lies in front and grows by one row per call.
const G = isoGrid(480, 250, 30);
const BOARD = G.p(-3, -3);
const offered = (id: string, items: Parameters<typeof list>[4]) => raise(list(id, 0, 0, 216, items, { title: "Tools offered", mono: true, group: id }), BOARD, 24);
const log = (id: string, rows: Row[]) => table(id, 318, 392, 324, ["tool", "arguments", "outcome"], rows, { at: [12, 124, 240], rowH: 22, title: "Call log", mono: true, group: id });
const READS: Row[] = [["get_order", "4471", "ok"], ["get_payment", "4471", "ok"]];
const REJECTED = ["issue_refund", "9 999 kr", "rejected"];

export default defineGuide({
  id: "tool-calling", track: "ai", module: "The model call", slug: "tool-calling",
  title: "Tool calling",
  summary: "A model cannot run anything. It asks for a function by name, the application runs it and returns the result, and the model continues with what came back.",
  forLeads: "Every tool is a permission handed to model output. Decide which tools exist, what each may touch and which calls need a person, and keep a log of every call.",
  status: "draft", minutes: 7,
  counters: ["Requests to model", "Tool calls", "Run by", "Tools may"],
  whatIf: { label: "What if the model had no tools?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts and tool names are illustrative",
    label: "A customer's question reaches an application, which passes it to a model. The model returns a call naming a function. The application runs the call against the order system and sends the result back, and the model answers. Later the model asks for two functions in one turn, a provider-hosted tool runs beside the model, and a refund call with a bad amount is rejected by the application and written to its call log.",
    els: [
      pawn("customer", 0, 9, "Customer", undefined, { always: true }),
      line("cust", [G.p(0, 8), G.p(0, 0.7)], { always: true }),
      prism("app", -0.7, -0.7, 1.4, 1.4, 34, { hue: "track", glyph: "code", title: "Application", sub: "runs the tools", at: "s", always: true }),
      line("llm", [G.p(-7.9, 0), G.p(-0.7, 0)], { always: true }),
      prism("model", -9.1, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "writes text only", at: "n", always: true }),
      drum("orders", 0, -9, 1, 40, { hue: "sky", glyph: "stack", title: "Orders", sub: "order system", at: "e", always: true }),

      line("ord", [G.p(0, -0.7), G.p(0, -8)], { group: "tools" }),
      raise(code("def", 0, 0, 264, ["name: get_order", "description: Look up one order", "input_schema: order_id"], { title: "Tool definition", keywords: ["name:", "description:", "input_schema:"], group: "def" }), BOARD, 24),

      drum("payments", 9, 0, 1, 40, { hue: "sand", glyph: "key", title: "Payments", sub: "payment system", at: "e", always: true }),
      line("pay", [G.p(0.7, 0), G.p(8, 0)], { group: "pay" }),
      offered("set-2", ["get_order      read", "get_payment    read"]),
      offered("set-3", ["get_order      read", "get_payment    read", { t: "issue_refund   write", hot: true }]),

      prism("hosted", -9.1, 4.8, 1.2, 1.2, 24, { hue: "paper", glyph: "search", title: "Hosted tools", sub: "run by provider", at: "s", group: "hosted" }),
      line("host", [G.p(-8.5, 0.6), G.p(-8.5, 4.8)], { group: "hosted" }),

      pill("gate", [386, 243], "Arguments validated", { tone: "track", glyph: "shield", anchor: "end", group: "gate" }),
      log("log-a", [READS[0]]),
      log("log-b", READS),
      log("log-1", [...READS, { cells: REJECTED, hot: true }]),
      log("log-2", [...READS, { cells: REJECTED, mute: true }, { cells: ["issue_refund", "899 kr credit", "ok"], hot: true }]),
    ],
  },
  steps: [
    step({
      id: "no-tools", label: "No tools", kind: "problem", title: "The model cannot see the order",
      caption: "A customer asks Vinterhus whether order 4471 can be refunded. The answer is in the order system. The model only writes text, so its reply is a guess.",
      show: [], counters: ["1", "0", "nobody", "do nothing"],
      rides: [ride("cust", 0, 0.5, "refund 4471?"), ride("llm", 0, 0.5, "a guess", { tone: "alert" })],
      body: ["The refund assistant passes the customer's question to the model. Whether order 4471 was delivered, returned or already refunded is a fact in the order system, and only application code can reach it.",
        "A tool gives the model a way to pass data to the application, whose code can then read data or take an action."],
      claims: ["tool-calling-purpose"],
    }),
    step({
      id: "ask", label: "The ask", kind: "idea", title: "The model asks for a function by name",
      caption: "The application sends tool definitions with the question: a name, a description and a schema for the arguments. The model replies with a structured call, not an answer.",
      show: ["def", "tools"], counters: ["1", "1 requested", "nobody yet", "read orders"],
      rides: [ride("llm", 0, 0.5, "get_order 4471")],
      body: ["A tool definition has a name, a description of what the tool does and when to use it, and a JSON Schema for its input. Anthropic states that a detailed description is by far the most important factor in how well the model uses a tool.",
        "The model decides whether to call a tool. Its output is a structured request naming the function and its arguments.",
        { callout: { label: "Key idea", text: "The model proposes a call. It never executes one." } }],
      claims: ["tool-calling-definition", "tool-calling-description", "tool-calling-flow"],
    }),
    step({
      id: "run", label: "Run", kind: "mechanism", title: "The application runs it and returns the result",
      caption: "The application executes get_order against the order system and sends the output in a second request. The model continues with the new fact and answers.",
      show: ["def", "tools", "log-a"], counters: ["2", "1", "the application", "read orders"],
      rides: [ride("ord", 0, 0.45, "get_order 4471", { via: [0.95], then: "delivered" }), ride("llm", 1, 0.5, "tool result"), ride("cust", 1, 0.5, "yes, refund")],
      body: ["The flow has five steps: a request with the tools, a tool call from the model, code executed on the application side, a second request carrying the tool output, and a final response or more tool calls.",
        "The model never touches the order system. Everything it learns arrives as text in the next request."],
      claims: ["tool-calling-flow", "tool-calling-app-runs"],
    }),
    step({
      id: "several", label: "Several", kind: "mechanism", title: "One turn can carry several calls",
      caption: "The model may ask for several functions in one turn, and the application returns one result per call. Provider-hosted tools such as web search and code execution run on the provider's side.",
      show: ["set-2", "tools", "pay", "hosted", "log-b"], counters: ["2", "2 in one turn", "application, provider", "read orders, payments"],
      rides: [ride("ord", 0, 0.64, "get_order"), ride("pay", 0, 0.64, "get_payment"), ride("host", 0, 0.5, "web search")],
      body: ["Parallel tool calls are a default the application can switch off: parallel_tool_calls in the OpenAI API, disable_parallel_tool_use in the Claude API. The application chooses the execution order. Independent, read-only calls are usually safe to run together, and calls with side effects may be better run in sequence.",
        "Hosted tools need no handler code. Anthropic's server tools web_search and code_execution run on its infrastructure, and OpenAI's built-in tools let the model search the web and run code."],
      claims: ["tool-calling-parallel", "tool-calling-parallel-order", "tool-calling-hosted"],
    }),
    step({
      id: "permission", label: "Permission", kind: "watch-out", title: "Each tool is a permission",
      caption: "A refund tool lets model output move money. The tool gets the least permission it needs, the application validates every argument before running, and each call is logged.",
      show: ["set-3", "tools", "pay", "hosted", "gate", "log-1"], counters: ["2", "1 rejected", "the application", "issue refunds"],
      rides: [ride("llm", 0, 0.62, "refund 9 999 kr", { tone: "alert", then: "rejected" })],
      body: ["OWASP names the risk Excessive Agency: damaging actions performed in response to unexpected, ambiguous or manipulated model output. Its root causes are excessive functionality, excessive permissions and excessive autonomy.",
        "Strict mode makes a call match its schema. A call that matches the schema can still be wrong, so the tool validates the contents, and authorisation is decided in code, never by the model.",
        { callout: { label: "What changed", text: "The call for 9 999 kr stopped at the application. Order 4471 is worth 899 kr." } }],
      claims: ["tool-calling-excessive-agency", "tool-calling-least-privilege", "tool-calling-validate", "tool-calling-log", "tool-calling-strict"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Run the call or ask a person",
      caption: "",
      show: ["set-3", "tools", "pay", "hosted", "gate", "log-2"], counters: ["2", "1 approved", "the application", "refund as credit"],
      rides: [ride("pay", 0, 0.5, "899 kr credit")],
      body: [{ pair: {
        left: { label: "Run automatically", items: ["Low-consequence actions", "Easily reversible actions", "A refund as store credit"] },
        right: { label: "Ask a person first", items: ["High-consequence actions", "Irreversible actions", "An external payout"] },
      } }],
      claims: ["tool-calling-approval", "tool-calling-validate"],
    }),
  ],
  governance: { text: "Each tool is a permission granted to model output. Tools and their permissions are limited to the minimum necessary, arguments are validated against a strict schema before use, and every call is logged.", claims: ["tool-calling-least-privilege", "tool-calling-validate", "tool-calling-log"] },
  closing: {
    pitfalls: [
      "Connecting a tool with a high-privilege account when it only needs to read.",
      "Trusting arguments because they match the schema.",
      "Leaving a tool from an earlier trial available to the model.",
    ],
    questions: [
      "Who executes a tool call, and where does the result go?",
      "What three things does a tool definition contain?",
      "Which calls should wait for a person?",
    ],
  },
});
