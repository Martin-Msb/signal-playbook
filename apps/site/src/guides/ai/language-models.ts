import { CANVAS, cells, defineGuide, isoGrid, line, plot, prism, raise, ride, series, step, stop, table } from "@signal-path/engine";
import type { Cell, CellsEl, Hue } from "@signal-path/engine";

// Two boards over a V of rail with the model at its foot. The left board is the text: a strip of cells, one per
// piece, with the next cell empty. The right board is what the model says about that empty cell: one bar per
// candidate. A piece rides back from the chart to the strip, and the strip is one cell longer. From the fourth stop
// the strips start with an instruction, and two blocks below the model show the two ways it is reached.
const G = isoGrid(480, 183, 30);
const M = 7.8, ARM = 4.6;
const F1 = G.p(0, M), F2 = G.p(M, 0);

const EMPTY: Cell = { t: "", mute: true };
const of = (hue: Hue) => (t: string): Cell => ({ t, hue });
const dim = (t: string): Cell => ({ t, mute: true });
const hot = (t: string): Cell => ({ t, hot: true });
/** A strip of cells on the left board. `up` counts the strips beneath it. Only the lowest stands on the post, and the others share its left edge. */
const strip = (id: string, w: number, items: Cell[], up: number, span: number, extra: Partial<CellsEl>): CellsEl => {
  const el = raise(cells(id, 0, 0, items.length, [w, 32], items, extra), F1, 30 + up * 88);
  const left = raise(cells(id, 0, 0, span, [w, 32], [], {}), F1).x;
  return up ? { ...el, x: left, stand: undefined } : el;
};
const TEXT = ["Your", "sofa", "ships", "in"];
const task = (id: string, up: number, title: string, instruction: string, out: Cell[], group: string, muted = false) =>
  strip(id, 78, muted ? [instruction, "message", ...out.map((c) => (typeof c === "string" ? c : c.t))].map(dim) : [of("sand")(instruction), of("sky")("message"), ...out], up, 5, { title, group });

/** The chart of candidates for the empty cell. Each variant names its own candidates on the axis. */
const chart = (id: string, title: string, sub: string, names: string[], group: string) =>
  raise(plot(id, 0, 0, 420, 232, [0.4, names.length + 0.6], [0, 1], { title, sub, xt: names.map((_, i) => i + 1), xtl: names, yt: [0, 0.25, 0.5, 0.75, 1], ytl: ["0", "25%", "50%", "75%", "100%"], yLabel: "probability", group }), F2, 30);
const bars = (id: string, plotId: string, values: number[], group: string, top?: string) =>
  series(id, plotId, "bars", values.map((y, i) => [i + 1, y]), top ? { hue: "track", hot: [0], label: top, labelAt: 0, group } : { hue: "paper", group });

const FIRST = ["two", "three", "five", "a", "ten"], SECOND = ["days", "weeks", "parts", "boxes", "hours"], LABELS = ["return", "delivery", "billing", "other"];

export default defineGuide({
  id: "language-models", track: "ai", module: "Foundations", slug: "language-models",
  title: "Language models",
  summary: "A language model predicts the next piece of text from the text before it. The chosen piece is appended and the model predicts again. One model trained on broad text follows different instructions to do different tasks.",
  forLeads: "A general-purpose model supplies a capability and no purpose. The organisation that deploys it names the use, chooses how the model is reached and answers for the result.",
  status: "draft", minutes: 7,
  counters: ["Text so far", "Next piece", "Instruction", "Reached through"],
  whatIf: { label: "What if there were no model?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Text, probabilities and the support message are illustrative",
    label: "Two boards stand over a rail with a language model at its foot. The left board holds a line of text as a strip of cells: Your sofa ships in, then an empty cell. The right board charts candidates for the empty cell. Without a model the bars are level. With the model, two has 44 percent. Two is appended, the strip is one cell longer, and the next chart puts days at 68 percent. Then three strips start with an instruction and a support message: the same model writes a summary, the label return, and a reply. Two blocks below the model show a hosted service and open weights. At the last stop the reply strip alone stays lit and a record names the use, the limit, the access route and the accountable team.",
    els: [
      line("loop", [F1, G.p(M, M), F2], { always: true }),
      stop("s-a", ...G.p(2.9, M), undefined, undefined, { always: true }),
      stop("s-m", ...G.p(M, M), undefined, undefined, { always: true }),
      stop("s-b", ...G.p(M, 2.9), undefined, undefined, { always: true }),
      prism("none", M - 0.6, M - 0.6, 1.2, 1.2, 30, { state: "closed", title: "No model", at: "n", group: "none" }),
      prism("model", M - 0.6, M - 0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Language model", sub: "text in, probabilities out", at: "n", group: "model" }),
      prism("model-same", M - 0.6, M - 0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Language model", sub: "same weights", at: "n", group: "same" }),

      strip("t-4", 66, [...TEXT, EMPTY], 0, 5, { title: "Text so far", sub: "next cell empty", group: "t-4" }),
      strip("t-4-two", 66, [...TEXT, hot("two")], 1, 6, { title: "Text so far", sub: "two appended", group: "t-5" }),
      strip("t-5", 66, [...TEXT, of("track")("two"), EMPTY], 0, 6, { title: "One cell longer", sub: "next cell empty", group: "t-5" }),

      chart("c-first", "Candidates for the empty cell", "five of many", FIRST, "c-first"),
      bars("b-flat", "c-first", [0.1, 0.1, 0.1, 0.1, 0.1], "flat"),
      bars("b-first", "c-first", [0.44, 0.21, 0.14, 0.09, 0.06], "scored", "44%"),
      chart("c-second", "Candidates for the empty cell", "five of many", SECOND, "t-5"),
      bars("b-second", "c-second", [0.68, 0.19, 0.05, 0.03, 0.01], "t-5", "68%"),

      task("k-sum", 2, "Summary", "Summarise", ["Sofa", "arrived", "torn"].map(of("track")), "tasks"),
      task("k-class", 1, "Classification", "Classify", [hot("return")], "tasks"),
      task("k-reply", 0, "Reply", "Reply", ["Label", "sent", "today"].map(of("track")), "tasks"),
      chart("c-label", "Candidates for the label", "after Classify and the message", LABELS, "labels"),
      bars("b-label", "c-label", [0.78, 0.11, 0.06, 0.03], "labels", "78%"),

      line("host", [G.p(M, M), G.p(M, M + ARM)], { w: 7, group: "access" }),
      line("own", [G.p(M, M), G.p(M + ARM, M)], { w: 7, group: "access" }),
      prism("hosted", M - 0.6, M + ARM, 1.2, 1.2, 26, { hue: "sky", glyph: "globe", title: "Hosted service", sub: "chat assistant, API", at: "w", group: "access" }),
      prism("weights", M + ARM, M - 0.6, 1.2, 1.2, 26, { hue: "mint", glyph: "file", title: "Open weights", sub: "download and run", at: "e", group: "access" }),

      task("u-sum", 2, "Summary", "Summarise", ["Sofa", "arrived", "torn"], "use", true),
      task("u-class", 1, "Classification", "Classify", ["return"], "use", true),
      task("u-reply", 0, "Reply", "Reply", ["Label", "sent", "today"].map(hot), "use"),
      raise(table("record", 0, 0, 380, ["field", "value"], [["Intended use", "refund replies"], ["Not for", "approving refunds"], ["Reached through", "hosted API"], { cells: ["Accountable", "Support"], hot: true }],
        { at: [16, 180], rowH: 40, title: "Decided and recorded", sub: "by Vinterhus", group: "use" }), F2, 30),
    ],
  },
  steps: [
    step({
      id: "next", label: "Next piece", kind: "problem", title: "A line of text stops before its next piece",
      caption: "Support begins a reply to a customer. Without a model of language nothing ranks the candidates for the empty cell, so each looks as likely as any other.",
      show: ["t-4", "c-first", "flat", "none"], counters: ["4 pieces", "unranked", "none", "not chosen"],
      rides: [ride("loop", 0.04, "s-a", "4 pieces", { then: "next piece?", tone: "muted" })],
      body: ["Large language models are trained on vast amounts of text data and can generate human-like text, answer questions and summarise information. One operation sits under all of it: predicting the piece that comes next.",
        "The pieces are called tokens. They can correspond to words, subwords, characters or bytes, and the Tokens guide covers them. Here each piece is drawn as a whole word."],
      claims: ["language-models-llm", "language-models-tokens"],
    }),
    step({
      id: "predict", label: "Predict", kind: "idea", title: "A language model gives each candidate a probability",
      caption: "The model reads the text so far and scores what could fill the empty cell. Here two gets 44% and three gets 21%.",
      show: ["t-4", "c-first", "scored", "model"], counters: ["4 pieces", "two, 44%", "none", "not chosen"],
      rides: [ride("loop", "s-a", "s-b", "4 pieces", { via: ["s-m"], then: "probabilities" })],
      body: ["Autoregressive language models are pretrained to predict the next word, given the previous context of text in the document. Pretraining is the initial process of training language models on a large unlabeled corpus of text.",
        "In the Transformer, a learned linear transformation and a softmax function convert the decoder output to predicted next-token probabilities.",
        { callout: { label: "Key idea", text: "The model's answer to any text is a set of probabilities for what comes next. Everything else is built from that." } }],
      claims: ["language-models-next-word", "language-models-pretraining", "language-models-probabilities"],
    }),
    step({
      id: "append", label: "Append", kind: "mechanism", title: "The chosen piece joins the text and the model predicts again",
      caption: "The piece two is appended and the strip is one cell longer. The longer text goes back in, and the next chart puts days at 68%.",
      show: ["t-5", "model"], counters: ["5 pieces", "days, 68%", "none", "not chosen"],
      rides: [ride("loop", "s-b", "s-a", "two", { via: ["s-m"], then: "appended" })],
      body: ["The Transformer decoder generates an output sequence one element at a time. At each step the model is auto-regressive, consuming the previously generated symbols as additional input when generating the next.",
        "Here the most probable candidate is taken each time. How a piece is chosen from the probabilities is the subject of the Generation and sampling guide."],
      claims: ["language-models-autoregressive"],
    }),
    step({
      id: "instruct", label: "Instruct", kind: "mechanism", title: "One model follows different instructions",
      caption: "Trained on broad text, the same model writes a summary, a classification or a reply to a support message. The instruction is text placed before the empty cell. The weights do not change.",
      show: ["tasks", "labels", "same"], counters: ["instruction + message", "return, 78%", "one of three", "not chosen"],
      rides: [ride("loop", "s-a", "s-b", "Classify", { via: ["s-m"], then: "return" })],
      body: ["The GPT-3 study calls this in-context learning: the text input of a pretrained language model is used as a form of task specification. The model is conditioned on a natural language instruction or a few demonstrations of the task and completes it by predicting what comes next. GPT-3 was applied to every task without gradient updates or fine-tuning.",
        "Pretrained models are not inherently good at answering questions or following instructions. Fine-tuning and reinforcement learning from human feedback are used to refine them. The OpenAI API has an instructions parameter that gives the model high-level instructions on how it should behave while generating a response.",
        "Anthropic publishes production guides for using Claude to classify and route customer support tickets, to build customer support chatbots and to summarise legal documents.",
        { callout: { label: "Watch out", text: "Broad ability is not reliability on a given job. The GPT-3 study identifies datasets where its few-shot learning still struggles." } }],
      claims: ["language-models-in-context", "language-models-no-updates", "language-models-refined", "language-models-instructions", "language-models-tasks", "language-models-limits"],
    }),
    step({
      id: "access", label: "Access", kind: "mechanism", title: "A model is reached as a hosted service or open weights",
      caption: "A hosted model is used through a chat assistant or an API. Open weights are downloaded and run by the team itself, on premises or in a cloud.",
      show: ["tasks", "labels", "same", "access"], counters: ["instruction + message", "return, 78%", "one of three", "hosted or open weights"],
      rides: [ride("host", 0.3, 0.56, "request"), ride("own", 0.8, 0.56, "weights")],
      body: ["With the OpenAI API a large language model generates text from a prompt, as it does in ChatGPT. That is the hosted route: the provider runs the model.",
        "Meta states that Llama model weights are available to download and that developers can run the models in any environment, including on premises, in the cloud or locally on a laptop. Llama 3.1 was also made available on partner platforms, so open weights can be reached as a hosted service too."],
      claims: ["language-models-hosted", "language-models-open-weights"],
    }),
    step({
      id: "decide", label: "Purpose", kind: "decision", title: "The deployer names the use and answers for it",
      caption: "",
      show: ["use", "same", "access"], counters: ["instruction + message", "a reply, piece by piece", "refund replies", "hosted API, recorded"],
      rides: [ride("loop", "s-a", "s-b", "refund message", { via: ["s-m"], then: "reply" })],
      body: [{ pair: {
        left: { label: "Decide and record", items: ["One intended use", "Hosted or open weights", "The accountable team"] },
        right: { label: "Do not assume", items: ["A built-in purpose", "Ability means suitability"] },
      } },
        "The EU AI Act defines a general-purpose AI model as one that displays significant generality and is capable of competently performing a wide range of distinct tasks. It defines a deployer as a person or body using an AI system under its authority, and the intended purpose as the use for which an AI system is intended by its provider.",
        "A deployer that modifies the intended purpose of an AI system, including a general-purpose AI system, in such a way that it becomes high-risk is considered the provider of a high-risk AI system.",
        "The NIST AI Risk Management Framework asks that intended purposes and the settings in which an AI system will be deployed are understood and documented, and that roles and responsibilities for managing AI risks are documented and clear."],
      claims: ["language-models-gpai", "language-models-deployer", "language-models-nist"],
    }),
  ],
  governance: { text: "The EU AI Act defines a general-purpose AI model by its capability for a wide range of distinct tasks, and a deployer as whoever uses an AI system under its authority. The NIST AI Risk Management Framework asks that intended purposes, roles and responsibilities are documented.", claims: ["language-models-gpai", "language-models-deployer", "language-models-nist"] },
  closing: {
    pitfalls: [
      "Reading a probable continuation as a looked-up fact.",
      "Expecting an instruction to change the model's weights.",
      "Deploying a general-purpose model with no recorded use and no accountable team.",
    ],
    questions: [
      "What does a language model produce for the empty cell at the end of a text?",
      "Why can one model summarise, classify and reply without being retrained?",
      "Who names the use of a hosted model, and where is that recorded?",
    ],
  },
});
