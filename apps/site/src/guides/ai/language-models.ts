import { CANVAS, defineGuide, isoGrid, line, pawn, pill, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(480, 320, 30);

export default defineGuide({
  id: "language-models", track: "ai", module: "Foundations", slug: "language-models",
  title: "Language models",
  summary: "A broad-trained model continues the text before it. Instructions and examples steer the same next-piece process towards many tasks.",
  forLeads: "A general-purpose model supplies a capability, not an approved business purpose. The deploying team chooses where it is used and sets the controls around that use.",
  status: "draft", minutes: 7,
  counters: ["What shapes output", "Weights change now", "Tasks", "Service boundary"],
  whatIf: { label: "What if the model had no task instruction?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The prompts and reply are illustrative",
    label: "Broad text trains a model to continue text. A Vinterhus instruction and customer question condition it to produce a reply piece by piece. The model can be used through a hosted assistant or API, or downloaded as open weights. Vinterhus defines the assistant's purpose.",
    els: [
      line("flow", [G.p(-6, 0), G.p(-2, 0), G.p(2, 0), G.p(6, 0)], { always: true }),
      stop("s-source", ...G.p(-6, 0), "Training", "broad text", { always: true }),
      stop("s-model", ...G.p(-2, 0), "Model", "learned weights", { always: true }),
      stop("s-prompt", ...G.p(2, 0), "Prompt", "task + question", { always: true }),
      stop("s-reply", ...G.p(6, 0), "Reply", "one piece at a time", { always: true }),
      prism("model", -2.6, -4.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Language model", at: "n", always: true }),
      pill("next", [690, 160], "next piece", { tone: "track", group: "piece" }),
      pill("broad", [214, 155], "many kinds of text", { tone: "muted", group: "training" }),
      pill("hosted", [758, 151], "hosted chat / API", { tone: "track", group: "serve" }),
      pill("open", [758, 190], "downloadable weights", { tone: "muted", group: "serve" }),
    ],
  },
  steps: [
    step({
      id: "training", label: "Training", kind: "problem", title: "A model learns patterns across broad text",
      caption: "A language model is trained to continue text. Across a broad collection, its weights learn patterns that support more than one task.",
      show: ["training"], counters: ["broad text", "yes", "one kind", "not chosen"],
      rides: [ride("flow", 0.08, 0.31, "text", { then: "learned patterns" })],
      body: ["The GPT-3 paper describes pre-training on a large corpus of text, then using the model for tasks through text interaction. The learned weights carry patterns from that training into later requests.",
        "This guide starts with one model that has already been trained. Training itself is covered in the later Training guide."],
      claims: ["language-models-pretraining"],
    }),
    step({
      id: "continue", label: "Continue", kind: "idea", title: "The model predicts what comes next",
      caption: "Given the text so far, an autoregressive language model predicts a continuation. It is completing a sequence, not looking up a store policy.",
      show: [], counters: ["preceding text", "no", "continuation", "not chosen"],
      rides: [ride("flow", "s-source", 0.34, "preceding text", { then: "likely continuation" })],
      body: ["An autoregressive language model is trained to predict the next part of a sequence from what precedes it. It assigns likelihood to continuations; this mechanism alone does not guarantee that a continuation is true or suitable."],
      claims: ["language-models-next-piece"],
    }),
    step({
      id: "instruct", label: "Instruct", kind: "mechanism", title: "Instructions steer the same model",
      caption: "Support adds a task instruction and the customer's question. The prompt gives the model a task to continue, without changing its weights.",
      show: [], counters: ["instruction + question", "no", "refund support", "not chosen"],
      rides: [ride("flow", "s-source", "s-prompt", "refund question")],
      body: ["In the GPT-3 study, tasks and examples were specified through text, without gradient updates or fine-tuning at test time. This is often called in-context learning. A prompt changes the text being continued; it does not retrain the model."],
      claims: ["language-models-in-context"],
    }),
    step({
      id: "tasks", label: "Many tasks", kind: "mechanism", title: "One model can follow different task prompts",
      caption: "The same general model can continue a translation prompt, a summary prompt or a support prompt. The instruction shapes the task; it does not make every answer reliable.",
      show: ["piece"], counters: ["prompt", "no", "many tasks", "not chosen"],
      rides: [ride("flow", "s-prompt", "s-reply", "SOFA-2210", { via: [0.82], then: "return window?" })],
      body: ["GPT-3 was evaluated on tasks including translation, question answering and text completion. Its authors also reported tasks where performance struggled, so broad capability should not be read as a guarantee for a particular job.",
        { callout: { label: "Key idea", text: "A general-purpose model provides a flexible text capability. The application supplies the task and context." } }],
      claims: ["language-models-multiple-tasks", "language-models-limits"],
    }),
    step({
      id: "serve", label: "Serve", kind: "watch-out", title: "The same capability has different service boundaries",
      caption: "A team can call a hosted API or chat assistant, or download open weights and run the model itself. These choices change who operates the service and where the request goes.",
      show: ["serve"], counters: ["prompt", "no", "many tasks", "hosted or self-run"],
      rides: [ride("flow", "s-prompt", "s-reply", "support request")],
      body: ["OpenAI documents text generation through its API and ChatGPT. Meta publishes downloadable Llama weights and also lists partner services. Open weights do not mean the model is ready for every use: the deploying team still chooses the application and operates its controls."],
      claims: ["language-models-api", "language-models-open-weights"],
    }),
    step({
      id: "decide", label: "Purpose", kind: "decision", title: "The deploying team defines the purpose",
      caption: "",
      show: ["serve"], counters: ["approved task", "no", "defined by Vinterhus", "owned by deployer"],
      rides: [ride("flow", "s-prompt", "s-reply", "support request")],
      body: [{ pair: {
        left: { label: "Define", items: ["Customer task", "Allowed inputs", "Accountable team"] },
        right: { label: "Do not assume", items: ["Built-in purpose", "Broad ability means suitability", "Model sets controls"] },
      } }, "The EU AI Act describes general-purpose models as capable across a wide range of tasks and distinguishes their providers from the deployers using AI systems under their authority. Record the chosen use and the accountable team."],
      claims: ["language-models-purpose"],
    }),
  ],
  governance: { text: "A general-purpose model is capable across a range of tasks, but a deploying organisation chooses the task in which it uses the system and must identify its own operational controls and accountable team.", claims: ["language-models-purpose"] },
  closing: {
    pitfalls: [
      "Treating a likely continuation as a verified policy lookup.",
      "Assuming a prompt changes the trained weights.",
      "Confusing downloaded weights with a deployed, governed application.",
    ],
    questions: [
      "What does an autoregressive language model predict?",
      "How can a prompt change a task without retraining the model?",
      "Who defines the purpose of a Vinterhus support assistant?",
    ],
  },
});
