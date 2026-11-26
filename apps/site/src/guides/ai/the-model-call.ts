import { CANVAS, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(480, 315, 30);
const request = (id: string, rows: string[], group: string) =>
  raise(list(id, 0, 0, 250, rows, { title: "Request input", mono: true, group }), [480, 430], 30);

export default defineGuide({
  id: "the-model-call", track: "ai", module: "The model call", slug: "the-model-call",
  title: "The model call",
  summary: "A call sends a structured request and gets a completion back. The model has no memory of earlier calls unless the application supplies or links that state.",
  forLeads: "Every call crosses a service boundary. Know which messages and customer data leave Vinterhus, what the endpoint retains and who operates it.",
  status: "draft", minutes: 7,
  counters: ["Messages sent", "Earlier turns", "Reply status", "Endpoint operator"],
  whatIf: { label: "What if the next call omitted the conversation?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order details and replies are illustrative",
    label: "Support sends a request through an endpoint and receives a completion. The request changes from one question to a role-labelled message list, then carries its own earlier turns. A stop reason marks why generation ended. The final route crosses either a hosted provider or a Vinterhus-operated endpoint.",
    els: [
      line("flow", [G.p(-6, 0), G.p(-2, 0), G.p(2, 0), G.p(6, 0)], { always: true }),
      stop("s-support", ...G.p(-6, 0), "Support", "customer request", { always: true }),
      stop("s-request", ...G.p(-2, 0), "Request", "messages + settings", { always: true }),
      stop("s-endpoint", ...G.p(2, 0), "Endpoint", "hosted or self-run", { always: true }),
      stop("s-reply", ...G.p(6, 0), "Completion", "text + status", { always: true }),
      prism("model", 1.4, -4.8, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "one request at a time", at: "n", always: true }),
      request("one", ["user: When will it arrive?"], "one"),
      request("roles", ["system: answer from order data", "user: return 4471 status?"], "roles"),
      request("history", ["user: Where is return 4471?", "assistant: Received yesterday.", "user: When is the refund due?"], "history"),
      request("scoped", ["system: answer from order data", "user: refund for 4471?", "data: received yesterday"], "scoped"),
      pill("ask", [730, 194], "Which order?", { tone: "muted", group: "ask" }),
      pill("answer", [730, 194], "Return received", { tone: "track", group: "answer" }),
      pill("reason", [730, 235], "stop_reason: end_turn", { tone: "sand", mono: true, group: "reason" }),
      pill("hosted", [760, 138], "provider endpoint", { tone: "track", group: "hosted" }),
      pill("self", [760, 180], "Vinterhus endpoint", { tone: "muted", group: "self" }),
      pill("minimal", [480, 490], "send only the needed data", { tone: "alert", anchor: "middle", group: "minimal" }),
    ],
  },
  steps: [
    step({
      id: "single", label: "Single call", kind: "problem", title: "A call starts with the request it receives",
      caption: "A customer asks when a return will arrive. The request contains no order number or earlier exchange, so Support gets a clarification rather than a status.",
      show: ["one", "ask"], counters: ["one user message", "none", "needs detail", "hosted"],
      rides: [ride("flow", "s-support", "s-reply", "When will it arrive?")],
      body: ["The example is illustrative: the question names no order and carries no earlier exchange. A model call works from what its request makes available."],
      claims: ["the-model-call-stateless"],
    }),
    step({
      id: "roles", label: "Roles", kind: "idea", title: "Messages give content a role",
      caption: "The request is a list, not just a question. A system or developer message can set instructions; the user message supplies the current task.",
      show: ["roles"], counters: ["two role-labelled messages", "none", "completion returned", "hosted"],
      rides: [ride("flow", "s-request", "s-endpoint", "message list")],
      body: ["OpenAI's Responses API accepts a list of input items. In its message format, system and developer instructions take precedence over user instructions. The Anthropic Messages API also accepts role-labelled user and assistant messages, with a system prompt supplied separately."],
      claims: ["the-model-call-roles", "the-model-call-messages-api"],
    }),
    step({
      id: "history", label: "History", kind: "mechanism", title: "The application carries earlier turns",
      caption: "For a follow-up, Support includes the previous user and assistant messages. Without that context or a stored conversation link, the next call cannot use those turns.",
      show: ["history", "answer"], counters: ["three messages", "one exchange", "answers from supplied history", "hosted"],
      rides: [ride("flow", "s-request", "s-reply", "earlier turns + question", { then: "completion" })],
      body: ["Each text generation request is independent and stateless. The application can continue a conversation by supplying prior messages again or by using a provider's conversation-state feature. The provider does not make the model itself remember a previous call."],
      claims: ["the-model-call-stateless"],
    }),
    step({
      id: "completion", label: "Completion", kind: "mechanism", title: "Read the completion and its stop reason",
      caption: "A completion contains generated output. The stop reason is part of the response: it can show that the model finished, reached a limit or handed off control.",
      show: ["history", "answer", "reason"], counters: ["three messages", "one exchange", "end_turn", "hosted"],
      rides: [ride("flow", "s-endpoint", "s-reply", "generated answer")],
      body: ["The Anthropic Messages API returns a stop reason. Its values include end_turn, max_tokens, stop_sequence and tool_use. Treat this as an endpoint-specific response field: check the API you call before deciding that output is complete."],
      claims: ["the-model-call-stop-reason"],
    }),
    step({
      id: "endpoint", label: "Endpoint", kind: "watch-out", title: "The endpoint defines the service boundary",
      caption: "A hosted API or a self-run server can expose a similar request shape. The operator, data path and security controls are different parts of the call decision.",
      show: ["scoped", "answer", "hosted", "self"], counters: ["scoped messages", "one exchange", "completion", "provider or Vinterhus"],
      rides: [ride("flow", "s-request", "s-endpoint", "scoped request")],
      body: ["vLLM documents a self-run HTTP server that implements OpenAI APIs. Compatibility does not make the service boundary identical: the server operator is responsible for its own access controls and deployment."],
      claims: ["the-model-call-self-hosted"],
    }),
    step({
      id: "decide", label: "Minimise", kind: "decision", title: "Send only the context the task needs",
      caption: "",
      show: ["scoped", "answer", "hosted", "self", "minimal"], counters: ["scoped messages", "only relevant turns", "checked", "chosen and reviewed"],
      rides: [ride("flow", "s-request", "s-reply", "minimum required context")],
      body: [{ pair: {
        left: { label: "Check", items: ["Which roles and turns are sent", "What the endpoint stores", "Who operates and secures it"] },
        right: { label: "Avoid", items: ["Secrets in prompts", "Assuming no memory means no retention", "Sending the full transcript by default"] },
      } }, "The EU GDPR requires personal data to be limited to what is necessary for its purpose and protected appropriately. Review the provider's retention settings and the endpoint's terms before sending customer data."],
      claims: ["the-model-call-minimisation", "the-model-call-retention"],
    }),
  ],
  governance: { text: "Treat every request as a transfer of its included data across an endpoint boundary. Minimise personal data in messages, and check the selected provider's retention settings and security controls.", claims: ["the-model-call-minimisation", "the-model-call-retention"] },
  closing: {
    pitfalls: [
      "Assuming a model knows what an earlier call contained.",
      "Treating every endpoint's stop reason as interchangeable.",
      "Assuming stateless generation means the service stores nothing.",
    ],
    questions: [
      "What must an application send to continue a conversation?",
      "Why should code inspect the stop reason?",
      "Who can access the messages at the selected endpoint?",
    ],
  },
});
