import { CANVAS, defineGuide, isoGrid, line, pill, plot, prism, ride, series, step, stop } from "@signal-path/engine";

const G = isoGrid(860, 315, 16);
const PANEL = plot("dist", 235, 48, 490, 230, [0, 5], [0, 1], {
  title: "Possible next tokens", xt: [1, 2, 3, 4, 5], yt: [0, 0.5, 1], xLabel: "candidate", yLabel: "probability", always: true,
});
const bars = (id: string, values: number[], group: string) => series(id, "dist", "bars", values.map((y, i) => [i + 1, y]), { hue: "track", group });

export default defineGuide({
  id: "generation-and-sampling", track: "ai", module: "Foundations", slug: "generation-and-sampling",
  title: "Generation and sampling",
  summary: "A model chooses one token at a time from a probability distribution. Sampling settings change the range of choices, and generation may include hidden reasoning before the answer.",
  forLeads: "Generated text is variable. Evaluate the distribution of outcomes across repeated trials, and set limits and stop conditions for the work the model is allowed to do.",
  status: "draft", minutes: 7,
  counters: ["Next token", "Choice set", "Output length", "Delivery"],
  whatIf: { label: "What if the model always chose the top token?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Probabilities, order values and replies are illustrative",
    label: "A Vinterhus support model places probabilities over possible next tokens, then emits one token and repeats with the new context. Temperature and top-p alter the choices. A limit or stop sequence ends generation. Streaming delivers pieces as they are made. A reasoning model may use internal reasoning tokens before the visible answer.",
    els: [
      PANEL,
      bars("wide", [0.36, 0.24, 0.18, 0.13, 0.09], "wide"),
      bars("narrow", [0.64, 0.25, 0.08, 0.02, 0.01], "narrow"),
      bars("top-p", [0.46, 0.31, 0.23, 0, 0], "top-p"),
      line("path", [[100, 420], [280, 420], [460, 420], [640, 420], [840, 420]], { always: true }),
      stop("s-model", 100, 420, "Model", "next-token scores", { always: true }),
      stop("s-choice", 280, 420, "Choice", "sample one", { always: true }),
      stop("s-token", 460, 420, "Token", "append to context", { always: true }),
      stop("s-stop", 640, 420, "Stop", "limit or sequence", { always: true }),
      stop("s-answer", 840, 420, "Answer", "complete", { always: true }),
      line("stream", [[460, 420], [520, 360], [640, 360]], { group: "stream" }),
      pill("chunk", [490, 500], "token now", { tone: "track", group: "stream" }),
      prism("reasoning", 0, 0, 1.3, 1.3, 26, { hue: "violet", glyph: "net", title: "Reasoning", sub: "internal tokens", at: "s", group: "reason" }),
      pill("limit", [650, 500], "max output", { tone: "alert", group: "bounded" }),
      pill("sequence", [800, 500], "stop sequence", { tone: "sand", group: "bounded" }),
    ],
  },
  steps: [
    step({
      id: "next", label: "Next token", kind: "problem", title: "The model has several possible next tokens",
      caption: "After the Support prompt, the model assigns a probability to each candidate next token. It emits one token, adds it to the context, then predicts again.",
      show: ["wide"], counters: ["probabilities", "all candidates", "one token", "not started"],
      rides: [ride("path", "s-model", "s-token", "next token", { then: "append and repeat" })],
      body: ["The transformer paper describes autoregressive generation as producing one token at a time, conditioning each new token on the previously generated tokens. The plotted candidate names and probabilities are illustrative, not a model trace."],
      claims: ["generation-and-sampling-autoregressive"],
    }),
    step({
      id: "sampling", label: "Sample", kind: "idea", title: "Sampling draws from the distribution",
      caption: "Sampling can select a lower-probability token. The selected token changes the context, so later probabilities are calculated again.",
      show: ["wide"], counters: ["distribution", "several candidates", "one more token", "not started"],
      rides: [ride("path", "s-choice", "s-token", "yes")],
      body: ["With a sampled decoding strategy, the model draws from its next-token distribution instead of always taking the highest-probability token. The next step uses the context including the token just chosen."],
      claims: ["generation-and-sampling-sampling", "generation-and-sampling-autoregressive"],
    }),
    step({
      id: "settings", label: "Settings", kind: "mechanism", title: "Temperature and top-p reshape the choices",
      caption: "Temperature changes how concentrated the probabilities are. A lower setting can concentrate more probability on the leading choices.",
      show: ["narrow"], counters: ["reshaped scores", "smaller or wider set", "one more token", "not started"],
      rides: [ride("path", "s-choice", "s-token", "maybe", { then: "another valid sample" })],
      body: ["Transformers exposes temperature as a parameter that modulates next-token probabilities. Holtzman and colleagues show that decoding choices affect diversity and repetition, and that a temperature below 1 skews the distribution towards high-probability tokens.",
        { callout: { label: "Key idea", text: "Sampling settings change which continuations can be selected. They do not make the answer factual." } }],
      claims: ["generation-and-sampling-settings", "generation-and-sampling-diversity"],
    }),
    step({
      id: "bounded", label: "Bounded", kind: "mechanism", title: "Limits and stop sequences bound generation",
      caption: "Top-p keeps the smallest set whose cumulative probability reaches its threshold. A token is sampled from this shorter list of candidates.",
      show: ["top-p", "bounded"], counters: ["top-p filtered scores", "shorter candidate set", "capped", "stopped by limit or sequence"],
      rides: [ride("path", "s-token", "s-stop", "tokens", { then: "stop condition" })],
      body: ["The Responses API uses `max_output_tokens` to cap generated tokens, including reasoning tokens. Transformers provides a stop-string criterion that ends generation when the specified text is completed."],
      claims: ["generation-and-sampling-settings", "generation-and-sampling-limits", "generation-and-sampling-stop"],
    }),
    step({
      id: "visible", label: "Stream", kind: "watch-out", title: "Streaming shows output before generation finishes",
      caption: "With streaming, Vinterhus can receive output as events while the model is still generating. A partial answer is not yet a complete answer.",
      show: ["top-p", "stream", "bounded"], counters: ["filtered distribution", "candidate set", "capped", "partial events then done"],
      rides: [ride("stream", 0, 0.72, "yes"), ride("path", "s-stop", "s-answer", "complete")],
      body: ["The Responses API can stream server-sent events as a response is generated. The application must distinguish partial text from the completed response before it treats the answer as ready for the customer."],
      claims: ["generation-and-sampling-streaming"],
    }),
    step({
      id: "decision", label: "Evaluate", kind: "decision", title: "Test variable output as a distribution",
      caption: "",
      show: ["top-p", "reason", "bounded"], counters: ["filtered distribution", "chosen settings", "bounded", "reviewed complete output"],
      body: [{ pair: {
        left: { label: "Set", items: ["Sampling settings", "Output limit", "Stop conditions"] },
        right: { label: "Check", items: ["Repeated test runs", "Completed output", "Human review for support use"] },
      } }, "Reasoning models use internal reasoning tokens to work through a prompt. The vendor documentation states these tokens are not visible through the API, but occupy the context window and are billed as output tokens, and that an output limit can be reached before any visible output. Do not mistake a reasoning summary or partial stream for a verified policy decision."],
      claims: ["generation-and-sampling-reasoning", "generation-and-sampling-governance"],
    }),
  ],
  governance: { text: "Sampled output varies with the decoding settings, and OpenAI notes that streamed partial output is harder to moderate and evaluate. Evaluate repeated runs with the settings fixed, and review completed output before it affects a refund.", claims: ["generation-and-sampling-governance"] },
  closing: {
    pitfalls: [
      "Treating the highest-probability token as the only possible continuation.",
      "Assuming temperature or top-p makes a response correct.",
      "Showing a streamed fragment to a customer as if the completed answer were already checked.",
    ],
    questions: [
      "Why does the model predict again after it emits a token?",
      "What changes when top-p removes candidates from the distribution?",
      "Why should a variable support answer be tested repeatedly?",
    ],
  },
});
