import { CANVAS, defineGuide, isoGrid, line, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(480, 260, 32);

export default defineGuide({
  id: "training", track: "ai", module: "Foundations", slug: "training",
  title: "Training",
  summary: "Training changes model weights. Pretraining builds broad language patterns; later tuning changes default behaviour. When a version stops training, its learned weights do not include later events.",
  forLeads: "Training data and human feedback encode choices about what a model learns to do. Require provenance, evaluation and an accountable release decision for every model version.",
  status: "draft", minutes: 7,
  counters: ["Training signal", "Weights", "Model stage", "Source record"],
  whatIf: { label: "What if the model skipped feedback?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order, examples and model versions are illustrative",
    label: "One refund assistant model is trained in stages. Broad text teaches language patterns, demonstrations tune its responses, and human rankings add preference feedback. The resulting version stops changing until it is trained again. Source records and model documentation travel with each release.",
    els: [
      line("path", [-12, -7.2, -2.4, 2.4, 7.2, 12].map((x) => G.p(x, 0)), { always: true, w: 4 }),
      stop("s-data", ...G.p(-12, 0), "Text", "broad corpus", { always: true, at: "se" }),
      stop("s-pre", ...G.p(-7.2, 0), "Pretrain", "predict text", { always: true, at: "se" }),
      stop("s-tune", ...G.p(-2.4, 0), "Tune", "examples", { always: true, at: "se" }),
      stop("s-feedback", ...G.p(2.4, 0), "Feedback", "rank replies", { always: true, at: "se" }),
      stop("s-card", ...G.p(7.2, 0), "Document", "sources + evals", { always: true, at: "se" }),
      stop("s-release", ...G.p(12, 0), "Release", "fixed version", { always: true, at: "se" }),
    ],
  },
  steps: [
    step({
      id: "pretrain", label: "Pretrain", kind: "problem", title: "Broad text adjusts the starting weights",
      caption: "The model predicts text in a large corpus. Training adjusts its weights to reduce prediction error, building language patterns before the refund task is chosen.",
      show: [], counters: ["next text", "adjusted", "pretrained", "corpus"],
      rides: [ride("path", "s-data", "s-pre", "SOFA-2210", { then: "language patterns" })],
      body: ["GPT-3 is an autoregressive language model trained on a large text corpus. The paper describes pretraining as a stage before using the model for tasks through text interaction."],
      claims: ["training-pretraining"],
    }),
    step({
      id: "demonstrate", label: "Demonstrate", kind: "idea", title: "Demonstrations tune the response behaviour",
      caption: "Support examples show the model how to answer refund questions. Supervised fine-tuning adjusts the pretrained weights towards those demonstrated replies.",
      show: [], counters: ["desired reply", "adjusted", "instruction-tuned", "labelled examples"],
      rides: [ride("path", "s-pre", "s-tune", "example replies", { then: "instruction-tuned" })],
      body: ["In the InstructGPT study, labeler-written demonstrations were used to fine-tune GPT-3 with supervised learning. Later tuning starts from an existing pretrained model."],
      claims: ["training-supervised-tuning"],
    }),
    step({
      id: "rank", label: "Rank", kind: "mechanism", title: "Human preferences add another training signal",
      caption: "Reviewers compare candidate replies. Their rankings train a reward model, then reinforcement learning from human feedback adjusts the assistant towards those preferences.",
      show: [], counters: ["ranked replies", "adjusted", "feedback-tuned", "reviewers"],
      rides: [ride("path", "s-tune", "s-feedback", "preferred reply", { then: "feedback-tuned" })],
      body: ["The InstructGPT paper describes three stages: supervised fine-tuning, reward-model training from ranked outputs, and reinforcement learning against that reward model. Its authors also note that this aligns behaviour to the preferences of a specific group, not to every person's values."],
      claims: ["training-human-feedback", "training-feedback-limits"],
    }),
    step({
      id: "freeze", label: "Freeze", kind: "mechanism", title: "A released version no longer learns from requests",
      caption: "After training, the assistant answers with its current weights. Requests can shape a reply, but they do not update the weights; another training run is a new model change.",
      show: [], counters: ["requests", "fixed", "version 1", "cutoff"],
      rides: [ride("path", "s-feedback", "s-release", "version 1", { then: "weights fixed" })],
      body: ["The GPT-3 study distinguishes training from few-shot use: tasks and demonstrations arrive as text, without gradient updates or fine-tuning at test time. A dated training set sets the temporal boundary for what that version could learn."],
      claims: ["training-no-updates-at-use"],
    }),
    step({
      id: "record", label: "Record", kind: "watch-out", title: "Sources and evaluations travel with the model",
      caption: "Record data provenance and licences, and document intended use and evaluations. Poisoned training examples can plant a backdoor that survives inside the learned model.",
      show: [], counters: ["documented", "fixed", "version 1", "provenance"],
      rides: [ride("path", "s-release", "s-card", "model card", { then: "evaluated version" })],
      body: ["Model cards are a proposed reporting format for intended use, evaluation procedures and other relevant model information. Research has demonstrated that data poisoning can create targeted backdoors in deep learning systems."],
      claims: ["training-model-cards", "training-poisoning"],
    }),
    step({
      id: "decide", label: "Release", kind: "decision", title: "Approve and version the trained model",
      caption: "",
      show: [], counters: ["approved", "fixed", "versioned", "owned"],
      rides: [ride("path", "s-card", "s-release", "release", { then: "approved" })],
      body: [{ pair: {
        left: { label: "Before release", items: ["Trace data sources", "Check licences", "Review for poisoning"] },
        right: { label: "For each version", items: ["Record intended use", "Publish evaluations", "Plan deprecation"] },
      } }, "For general-purpose AI model providers in the EU, the AI Act requires a copyright compliance policy and a sufficiently detailed public summary of training content. Keep versioned documentation so a new training run receives a separate review."],
      claims: ["training-ai-act", "training-versioning"],
    }),
  ],
  governance: {
    text: "Training data and feedback are part of the model supply chain: document sources and licences, assess poisoning risks, and publish intended use and evaluations with each version. The EU AI Act requires providers of general-purpose AI models to maintain a copyright policy and publish a sufficiently detailed summary of training content.",
    claims: ["training-ai-act", "training-model-cards", "training-poisoning"],
  },
  closing: {
    pitfalls: [
      "Treating pretraining as if it already sets the assistant's behaviour.",
      "Assuming human feedback represents every user's values.",
      "Releasing new weights without provenance and evaluation records.",
    ],
    questions: [
      "What does pretraining change in a model?",
      "How do demonstrations differ from preference rankings?",
      "What evidence travels with each released version?",
    ],
  },
});
