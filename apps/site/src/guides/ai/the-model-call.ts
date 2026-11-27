import { CANVAS, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop } from "@signal-path/engine";
import type { Item } from "@signal-path/engine";

// The floor: Support sends a request along one rail to an endpoint and the completion returns on a second rail.
// The request stands on a board in front of the rail and the completion on a board behind it.
// A branch leads to a self-hosted endpoint that accepts the same request.
const G = isoGrid(70, 80, 30);
const hot = (t: string): Item => ({ t, hot: true });
const out = (t: string): Item => ({ t, strike: true, tone: "alert" });
const request = (id: string, rows: Item[]) =>
  raise(list(id, 0, 0, 290, rows, { title: "Request", mono: true, group: id }), [190, 492], 30);
const completion = (id: string, rows: Item[]) =>
  raise(list(id, 0, 0, 250, rows, { title: "Completion", mono: true, group: id }), [812, 300], 30);
const settings = "model, max_tokens";
const system = "system: Answer from order data";
const first = "user: Where is return 4471?";
const answer = "assistant: Received on Monday.";
const second = "user: When is my refund due?";

export default defineGuide({
  id: "the-model-call", track: "ai", module: "The model call", slug: "the-model-call",
  title: "The model call",
  summary: "A call sends a list of messages with roles and settings and gets a completion back. The model keeps nothing between calls, so the application resends what the next call needs.",
  forLeads: "Every call sends its content to an endpoint. Know which messages and customer data leave Vinterhus, what the endpoint retains, where it runs and who operates it.",
  status: "draft", minutes: 7,
  counters: ["Messages sent", "Earlier turns", "Stop reason", "Endpoint"],
  whatIf: { label: "What if the next call left out the earlier turns?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The order, messages and replies are illustrative",
    label: "Support sends a request along a line to a hosted endpoint and a completion returns on a second line. A board shows the request: first one question, then settings, a system prompt and a user message, then the earlier turns sent again. A second board shows the completion and its stop reason. A branch leads to a self-hosted endpoint that accepts the same request, and the last request has its secret and unneeded personal data struck out.",
    els: [
      line("send", [G.p(0, 0), G.p(11.4, 0)], { always: true }),
      stop("s-support", ...G.p(0, 0), "Support", "application", { at: "ne", always: true }),
      stop("s-gate", ...G.p(8.2, 0), undefined, undefined, { always: true }),
      prism("hosted", 11.4, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Hosted endpoint", sub: "run by the provider", at: "s", always: true }),
      line("back", [G.p(12.6, 0), G.p(19, 0)], { always: true }),
      stop("s-mid", ...G.p(16, 0), undefined, undefined, { always: true }),
      stop("s-reply", ...G.p(19, 0), "Back to Support", undefined, { at: "s", state: "end", always: true }),

      request("one", [hot(second)]),
      request("roles", [hot(settings), hot(system), hot(first)]),
      request("history", [settings, system, hot(first), hot(answer), second]),
      request("sent", [settings, system, first, answer, second]),
      request("scoped", [system, out("system: database password"), second, out("user: email and address")]),

      completion("ask", ["role: assistant", { t: "text: Which order?", hot: true, tone: "alert" }]),
      completion("c-first", ["role: assistant", "text: Received on Monday."]),
      completion("c-second", ["role: assistant", "text: Refund due Friday."]),
      completion("c-stop", ["role: assistant", "text: Refund due Friday.", hot("stop_reason: end_turn")]),

      pill("memory", [215, 78], "nothing kept between calls", { tone: "track", anchor: "start", group: "memory" }),
      line("own", [G.p(8.2, 0), G.p(8.2, -5), G.p(12.6, -5)], { w: 7, group: "self" }),
      stop("s-own", ...G.p(8.6, -5), undefined, undefined, { group: "self" }),
      prism("self", 12.6, -5.6, 1.2, 1.2, 30, { hue: "sand", glyph: "net", title: "Self-hosted endpoint", sub: "vLLM, run by Vinterhus", at: "n", group: "self" }),
    ],
  },
  steps: [
    step({
      id: "single", label: "One call", kind: "problem", title: "The model keeps nothing between calls",
      caption: "A customer asks when the refund is due. The call carries only that question, so the model cannot know it concerns return 4471 from the call before.",
      show: ["one", "ask"], counters: ["1", "none", "not read", "hosted"],
      rides: [ride("send", "s-support", "s-gate", "refund due?"), ride("back", 0, "s-mid", "Which order?", { tone: "alert" })],
      body: ["Anthropic states that its Messages API is stateless. OpenAI states that each text generation request is independent and stateless. A call works from what its request contains.",
        "Return 4471 and the replies in this picture are illustrative."],
      claims: ["the-model-call-stateless"],
    }),
    step({
      id: "roles", label: "Request", kind: "idea", title: "A request is a list of messages with roles and settings",
      caption: "Each call names a model, sets limits such as max_tokens and carries messages. The system prompt holds standing instructions. A user message holds the question.",
      show: ["roles", "c-first"], counters: ["1 + system prompt", "none", "not read", "hosted"],
      rides: [ride("send", "s-support", "s-gate", "request"), ride("back", 0, "s-mid", "completion")],
      body: ["A request to the Anthropic Messages API names a model, sets max_tokens and carries a list of messages, each with the role user or assistant. Instructions that apply from the first turn go in the top-level system field, the system prompt.",
        "OpenAI's API uses the same idea with different names: developer messages are prioritised ahead of user messages, and messages generated by the model have the assistant role."],
      claims: ["the-model-call-request", "the-model-call-roles"],
    }),
    step({
      id: "history", label: "History", kind: "mechanism", title: "The application resends the earlier turns",
      caption: "For the follow-up, Support sends the first question and the model's reply again as user and assistant messages, then the new question.",
      show: ["history", "c-second", "memory"], counters: ["3 + system prompt", "1 exchange, resent", "not read", "hosted"],
      rides: [ride("send", "s-support", "s-gate", "all 3 turns"), ride("back", 0, "s-mid", "completion", { then: "refund Friday" })],
      body: ["Because the Messages API is stateless, the application always sends the full conversational history.",
        { callout: { label: "Stored state", text: "Some APIs can hold the conversation instead. OpenAI offers a previous_response_id parameter and a Conversations API. Anthropic offers message threads in beta. The state then lives with the provider, not in the model." } }],
      claims: ["the-model-call-stateless", "the-model-call-state"],
    }),
    step({
      id: "completion", label: "Completion", kind: "mechanism", title: "The reply is a completion with a stop reason",
      caption: "The completion is an assistant message. Its stop reason says why generation ended: the model finished, hit max_tokens, met a stop sequence or is calling a tool.",
      show: ["sent", "c-stop"], counters: ["3 + system prompt", "1 exchange, resent", "end_turn", "hosted"],
      rides: [ride("back", 0, "s-mid", "completion", { then: "end_turn" })],
      body: ["In the Anthropic Messages API the stop_reason field is part of every successful response. Its values include end_turn when the model completed its response naturally, max_tokens when the response reached the max_tokens limit, stop_sequence and tool_use.",
        "Code reads the stop reason before it treats the text as complete."],
      claims: ["the-model-call-stop-reason"],
    }),
    step({
      id: "endpoint", label: "Endpoint", kind: "watch-out", title: "The endpoint decides where the request goes",
      caption: "A hosted endpoint is run by the provider. A self-hosted server such as vLLM accepts the same request on infrastructure Vinterhus runs.",
      show: ["sent", "c-stop", "self"], counters: ["3 + system prompt", "1 exchange, resent", "end_turn", "hosted or self-hosted"],
      rides: [ride("own", 0, "s-own", "same request")],
      body: ["vLLM provides an HTTP server that supports OpenAI's Completions, Chat Completions and Responses APIs and the Anthropic Messages API.",
        { callout: { label: "Hosted terms", text: "Anthropic states that it does not retain conversation content by default, that its Covered Models require 30-day retention and that flagged content can be kept for up to 2 years. Its inference_geo setting keeps inference on US infrastructure. The default is global." } }],
      claims: ["the-model-call-self-hosted", "the-model-call-retention", "the-model-call-region"],
    }),
    step({
      id: "decide", label: "Minimise", kind: "decision", title: "Send only what the task needs",
      caption: "",
      show: ["scoped", "c-stop", "self"], counters: ["only what is needed", "only what is needed", "end_turn", "chosen on its terms"],
      rides: [ride("send", "s-support", "s-gate", "scoped request"), ride("back", 0, "s-mid", "completion")],
      body: [{ pair: {
        left: { label: "Check", items: ["Provider retention terms", "Region the endpoint runs in", "Who operates the endpoint"] },
        right: { label: "Keep out", items: ["Secrets and credentials", "Personal data the task does not need", "Turns the answer does not use"] },
      } }, "The EU GDPR limits personal data to what is necessary for the purpose and requires appropriate security. OWASP states that credentials and connection strings should not be contained in a system prompt."],
      claims: ["the-model-call-minimisation", "the-model-call-secrets"],
    }),
  ],
  governance: { text: "Every call sends its whole content to an endpoint. Check the provider's retention terms and the region the endpoint runs in, limit personal data to what the task needs and keep secrets out of prompts.", claims: ["the-model-call-retention", "the-model-call-region", "the-model-call-minimisation", "the-model-call-secrets"] },
  closing: {
    pitfalls: [
      "Assuming the model knows what an earlier call contained.",
      "Treating text as complete without reading the stop reason.",
      "Assuming a stateless API means the provider stores nothing.",
    ],
    questions: [
      "What must an application send to continue a conversation?",
      "What does each stop reason tell the calling code?",
      "What does the chosen endpoint retain, and where does it run?",
    ],
  },
});
