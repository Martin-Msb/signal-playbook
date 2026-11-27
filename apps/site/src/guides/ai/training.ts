import { blocks, CANVAS, cells, defineGuide, isoGrid, line, list, note, pawn, pill, plot, plotPoint, prism, raise, ride, rule, series, shade, step, stop, table } from "@signal-path/engine";
import type { BlocksEl, Cell, Hue, Item, Pt, Row } from "@signal-path/engine";

// The floor: the model stands at the foot of a V of rail. The left arm brings the pretraining text,
// a large field of blocks. The right arm brings the small set of example conversations and the rankings people give.
// Three cards stand above while the weights are still changing: a line of text with its next piece hidden,
// the model's guess for that piece, and the loss falling as pretraining proceeds.
// Once training ends the three cards give way to one timeline: the cutoff, the release and the retirement of each version.
const G = isoGrid(480, 430, 30);
const LEFT = G.p(-10, 0), MID = G.p(-4.5, -4.5), RIGHT = G.p(0, -10.2);

/** A line of training text as cells on a post, with the piece to predict hidden. */
const strip = (id: string, group: string, w: number, items: Cell[], title: string, sub: string) =>
  raise(cells(id, 0, 0, items.length, [w, 38], items, { title, sub, ticks: [...items.slice(0, -1).map(() => ""), "hidden"], group }), LEFT, 74);
const HIDDEN: Cell = { t: "?", hot: true };

/** The model's probabilities for the hidden piece. The highlighted row is the piece the text really holds. */
const guess = (id: string, sub: string, rows: Row[]) =>
  raise(table(id, 0, 0, 230, ["next piece", "probability"], rows, { at: [12, 132], rowH: 26, title: "Model's guess", sub, foot: "real next piece: Friday", group: id }), MID, 30);
const replies = (id: string, title: string, sub: string, items: Item[], numbered = false) =>
  raise(list(id, 0, 0, 230, items, { title, sub, rowH: 28, numbered, group: id }), MID, 46);

/** Loss against text seen. The values are illustrative. */
const lossAt = (x: number) => 2.2 + 8.6 * Math.exp(-x / 40);
const LOSS = raise(plot("loss", 0, 0, 312, 208, [0, 300], [0, 12], { title: "Loss in pretraining", xt: [0, 100, 200, 300], yt: [0, 4, 8, 12], xLabel: "billion tokens seen", yLabel: "loss", group: "learn" }), RIGHT, 30);
const onCurve = (id: string, x: number) => stop(id, ...plotPoint(LOSS, x, lossAt(x)), undefined, undefined, { group: "anchor" });

/** Months from January 2026 along the timeline. */
const TIME = raise(plot("time", 0, 0, 848, 214, [0, 22], [0, 4], { title: "Model versions", sub: "dates published by Anthropic", xt: [0, 3, 6, 9, 12, 15, 18, 21], xtl: ["Jan 2026", "Apr", "Jul", "Oct", "Jan 2027", "Apr", "Jul", "Oct"], yt: [], group: "frozen" }), MID, 30);
const CUTOFF = 5.5, RELEASE = 8.5, RETIRE = 20.9, EVENTS = 2.8, NEW = 1.8, OLD = 0.8;

const text = (n: number, hue: Hue, bad?: number): BlocksEl["items"] => Array.from({ length: n }, (_, i) => (i === bad ? { h: 10, state: "alert" as const } : { h: 10, hue }));
const corpus = (id: string, bad?: number) =>
  blocks(id, -9.9, 1.6, 9, 0.62, text(45, "sky", bad), { gap: 0.16, title: "Pretraining text", sub: "billions of tokens", at: "sw", group: id });
const model = (id: string, hue: Hue, glyph: string, title: string, sub: string) =>
  prism(id, -1, -1, 2, 2, 40, { hue, glyph, title, sub, at: "s", group: id });
const at = (gx: number, gy: number): Pt => G.p(gx, gy);

export default defineGuide({
  id: "training", track: "ai", module: "Foundations", slug: "training",
  title: "Training",
  summary: "Training adjusts a model's weights so it predicts text better. Pretraining on a large body of text comes first, tuning on examples and human feedback shapes behaviour, and the weights are then frozen at a cutoff.",
  forLeads: "Every model version is a fixed artefact with a cutoff date, a release date and a retirement date. Ask where its training data came from, read its model card, and plan the move before the version is retired.",
  status: "draft", minutes: 7,
  counters: ["Trained on", "Weights", "Model does", "Knows up to"],
  whatIf: { label: "What if training stopped after pretraining?", step: 1, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Sentences, probabilities, loss values and the October event are illustrative",
    label: "A model stands at the foot of a V of rail. Above it a line of text has its last piece hidden, a table gives the model's probabilities for that piece, and a chart plots the loss. Pretraining brings a large field of text blocks along the left rail and the loss falls. A much smaller set of example conversations and the rankings of people arrive along the right rail. Then the weights are frozen and a timeline replaces the three cards: text before the cutoff is in the weights, a later event is not, and each version is released, deprecated and retired on a published date.",
    els: [
      // the model, one variant per stage
      model("m-new", "paper", "net", "Model", "before training"),
      model("m-pre", "violet", "net", "Pretrained model", "continues text"),
      model("m-tuned", "track", "net", "Tuned model", "follows instructions"),
      model("m-ranked", "track", "net", "Assistant model", "tuned on rankings"),
      model("m-frozen", "track", "lock", "Claude Sonnet 5.5", "weights frozen"),

      // what the model practises on, its guess, and the loss
      strip("s-text", "s-text", 56, ["Your", "sofa", "ships", "on", HIDDEN], "Text from the corpus", "next piece hidden"),
      strip("s-chat", "s-chat", 48, ["Q:", "Where", "is", "4471?", "A:", HIDDEN], "Example conversation", "reply hidden"),
      guess("g-new", "before training", [{ cells: ["blue", "3%"], hue: "rose" }, ["and", "2%"], { cells: ["Friday", "1%"], hot: true }]),
      guess("g-pre", "after pretraining", [{ cells: ["Friday", "62%"], hot: true }, ["Monday", "21%"], ["blue", "0%"]]),
      replies("r-tuned", "Model's reply", "to the question", [{ t: "Before: Q: Where is 4472?", mute: true }, { t: "After: It ships Friday.", hot: true }]),
      replies("r-ranked", "Replies ranked", "by labellers", [{ t: "It ships Friday.", hot: true }, "Friday.", { t: "Ask someone else.", mute: true }], true),
      LOSS,
      series("l-start", "loss", "points", [[0, lossAt(0)]], { tone: "alert", r: 6, label: "loss 10.8", group: "l-start" }),
      series("curve", "loss", "line", Array.from({ length: 16 }, (_, i) => [i * 20, lossAt(i * 20)] as [number, number]), { w: 4, smooth: true, group: "curve" }),
      series("l-end", "loss", "points", [[300, lossAt(300)]], { r: 6, group: "l-end" }),
      onCurve("c0", 0), onCurve("c1", 40), onCurve("c2", 230),

      // pretraining: a large body of text
      line("pre", [LEFT, at(0, 0)], { group: "pre" }),
      stop("s-l1", ...at(-7.2, 0), undefined, undefined, { group: "pre" }),
      stop("s-l2", ...at(-3.6, 0), undefined, undefined, { group: "pre" }),
      corpus("corpus"), corpus("corpus-check", 39),

      // tuning: a much smaller set of example conversations, then rankings from people
      line("tune", [RIGHT, at(0, 0)], { group: "tune" }),
      stop("s-r1", ...at(0, -7.6), undefined, undefined, { group: "tune" }),
      stop("s-r2", ...at(0, -3.6), undefined, undefined, { group: "tune" }),
      blocks("convos", 0.9, -6.6, 3, 0.62, text(6, "mint"), { gap: 0.16, dir: "gy", title: "Example conversations", sub: "thousands", at: "e", group: "tune" }),
      pawn("labellers", 3.4, -2.2, "Labellers", undefined, { hue: "sand", group: "rank" }),

      // after training: one timeline
      TIME,
      shade("t-seen", "time", [0, 0, CUTOFF, 4], { group: "frozen" }),
      rule("t-cutoff", "time", CUTOFF, { tone: "ink", label: "training data cutoff, Jun 2026", group: "frozen" }),
      series("t-data", "time", "line", [[0, EVENTS], [CUTOFF, EVENTS]], { w: 5, group: "frozen" }),
      series("t-live", "time", "line", [[RELEASE, NEW], [RETIRE, NEW]], { w: 5, label: "Claude Sonnet 5.5, released Sep 2026", labelAt: 0, group: "frozen" }),
      series("t-known", "time", "points", [[0.7, EVENTS]], { hue: "sky", r: 6, label: "in the training data", group: "frozen" }),
      series("t-late", "time", "points", [[9.6, EVENTS]], { tone: "alert", r: 6, label: "Oct 2026: returns now 60 days. Unknown to the model", group: "frozen" }),
      series("t-old", "time", "line", [[0, OLD], [9, OLD]], { tone: "ink", w: 5, label: "Claude Sonnet 4.5", labelAt: 0, group: "versions" }),
      series("t-dep", "time", "line", [[9, OLD], [11, OLD]], { tone: "alert", w: 4, dashed: true, group: "versions" }),
      note("t-end", plotPoint(TIME, RETIRE, NEW)[0], plotPoint(TIME, RETIRE, NEW)[1] + 19, "retired no sooner than 28 Sep 2027", { anchor: "end", strong: true, tone: "muted", size: 12, on: "time", group: "versions" }),

      pill("p-card", [398, 316], "Model card", { glyph: "check", to: G.p(-0.55, -0.25, 40), group: "gov" }),
      pill("p-source", [302, 503], "Sources and licences", { glyph: "check", to: G.p(-3.6, 5.3, 10), group: "gov" }),
      pill("p-poison", [120, 434], "Poisoned text", { tone: "alert", anchor: "end", to: G.p(-7.25, 5.03, 10), group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "guess", label: "Next piece", kind: "problem", title: "Before training, the guess is wrong",
      caption: "A language model is trained to predict the next piece of text. Hide Friday, and this model gives it 1%. Loss is a number for how wrong the prediction is.",
      show: ["m-new", "s-text", "g-new", "learn", "l-start"], counters: ["nothing yet", "not yet adjusted", "guesses", "nothing"],
      body: ["Anthropic's glossary defines pretraining as the initial process of training language models on a large unlabelled corpus of text. Autoregressive language models are pretrained to predict the next word, given the previous context of text in the document.",
        "Loss is a numerical metric that describes how wrong a model's predictions are. The text itself supplies the answer, so no person has to label it."],
      claims: ["training-next-word", "training-loss", "training-hidden-tokens"],
    }),
    step({
      id: "pretrain", label: "Pretrain", kind: "mechanism", title: "Pretraining adjusts the weights on a large body of text",
      caption: "The model predicts hidden pieces across the corpus, and the loss guides each update of its weights. GPT-3 was trained for 300 billion tokens. The model now continues text.",
      show: ["m-pre", "s-text", "g-pre", "learn", "curve", "pre", "corpus"], counters: ["text", "adjusted by the loss", "continues text", "the end of its text"],
      rides: [ride("pre", "s-l1", "s-l2", "text", { then: "new weights" }), ride("curve", "c0", "c2", "loss 10.8", { via: ["c1"], then: "loss 2.2" })],
      body: ["Google's Machine Learning Crash Course describes the first phase of training a large language model: certain tokens in the training data are intentionally hidden, the model trains by trying to predict them, and loss guides the degree to which backpropagation updates parameter values.",
        "GPT-3 is an autoregressive language model with 175 billion parameters, and all GPT-3 models were trained for a total of 300 billion tokens.",
        { callout: { label: "Key idea", text: "Anthropic states that Claude Sonnet 5.5 was pretrained on large, diverse datasets to acquire language capabilities, and then underwent substantial post-training to make it an effective assistant." } }],
      claims: ["training-hidden-tokens", "training-gpt3-tokens", "training-next-word", "training-post-training"],
    }),
    step({
      id: "instruct", label: "Instruction tuning", kind: "idea", title: "Instruction tuning teaches the model to answer",
      caption: "A pretrained model is not inherently good at following instructions. Instruction tuning trains it further on example conversations that people wrote. InstructGPT used about 13,000 prompts.",
      show: ["m-tuned", "s-chat", "r-tuned", "learn", "curve", "l-end", "pre", "corpus", "tune"], counters: ["text + examples", "adjusted again", "follows instructions", "the end of its text"],
      rides: [ride("tune", "s-r1", "s-r2", "examples", { then: "new weights" })],
      body: ["Anthropic's glossary states that pretrained models are not inherently good at answering questions or following instructions, and that fine-tuning and RLHF are used to refine them.",
        "An optional further training step called instruction tuning can improve a large language model's ability to follow instructions. The task is still to predict the next piece. The text is now a prompt followed by the reply a person demonstrated.",
        "The InstructGPT study collected a dataset of labeller demonstrations of the desired model behaviour and used it to fine-tune GPT-3 with supervised learning. Its supervised fine-tuning dataset contains about 13k training prompts."],
      claims: ["training-not-instructions", "training-instruction-tuning", "training-demonstrations"],
    }),
    step({
      id: "rank", label: "Human feedback", kind: "mechanism", title: "People rank replies and the model learns the preference",
      caption: "Labellers rank several replies to one prompt. Reinforcement learning from human feedback, RLHF, encourages the model to prefer outputs like the higher-ranked ones.",
      show: ["m-ranked", "s-chat", "r-ranked", "learn", "curve", "l-end", "pre", "corpus", "tune", "rank"], counters: ["text, examples, rankings", "adjusted again", "gives preferred replies", "the end of its text"],
      rides: [ride("tune", "s-r1", "s-r2", "rankings", { then: "new weights" })],
      body: ["Anthropic's glossary states that the human feedback consists of ranking a set of two or more example texts, and that the reinforcement learning process encourages the model to prefer outputs that are similar to the higher-ranked ones.",
        "The InstructGPT study collected a dataset of rankings of model outputs, trained a reward model to predict the human-preferred output, and fine-tuned the supervised model to optimise that reward.",
        { callout: { label: "Watch out", text: "The InstructGPT authors state that their procedure aligns the model to the stated preferences of a specific group of people, mostly their labellers and researchers, rather than any broader notion of human values." } }],
      claims: ["training-rlhf", "training-rankings", "training-feedback-limits"],
    }),
    step({
      id: "cutoff", label: "Cutoff", kind: "watch-out", title: "Nothing is learned after the cutoff",
      caption: "Training ends and the weights are frozen. Claude Sonnet 5.5 has a training data cutoff of June 2026 and was released in September. A request does not change the weights.",
      show: ["m-frozen", "frozen", "pre", "corpus", "tune", "rank"], counters: ["text, examples, rankings", "frozen", "gives preferred replies", "June 2026"],
      rides: [ride("t-data", 0.15, 1, "text read in training", { then: "frozen" })],
      body: ["Anthropic states that a knowledge cutoff date means the model's knowledge base is most extensive and reliable on information and events up to that date. It lists Claude Sonnet 5.5 with a training data cutoff of Jun 2026 and a release date of September 2026.",
        "Each Claude model ID identifies a pinned version of the model, and the underlying model remains constant for the lifetime of that ID. In the GPT-3 study the model is applied without any gradient updates or fine-tuning, with tasks and demonstrations specified purely via text.",
        { callout: { label: "Key idea", text: "When Vinterhus extends its return window in October, the refund assistant's model does not know. Later facts have to arrive in the request." } }],
      claims: ["training-cutoff-meaning", "training-sonnet-dates", "training-pinned", "training-no-updates-at-use"],
    }),
    step({
      id: "decide", label: "Versions", kind: "decision", title: "Each version is released, pinned and retired",
      caption: "",
      show: ["m-frozen", "frozen", "versions", "pre", "corpus-check", "tune", "rank", "gov"], counters: ["text, examples, rankings", "frozen per version", "gives preferred replies", "June 2026"],
      rides: [ride("t-dep", 0, 1, "deprecated 30 Sep", { then: "retired 30 Nov", tone: "alert" })],
      body: [{ pair: {
        left: { label: "Ask of each version", items: ["Training data cutoff", "Model card and evaluations", "Retirement date"] },
        right: { label: "Ask of its training data", items: ["Sources and licences", "Checks for poisoned text"] },
      } },
        "Anthropic describes a model lifecycle of active, legacy, deprecated and retired. A deprecated model is still functional and is assigned a retirement date, and requests to a retired model fail. It gives at least 60 days' notice before retiring a publicly released model.",
        "Anthropic deprecated claude-sonnet-4-5-20250929 on September 30, 2026 with a retirement date of November 30, 2026, and names claude-sonnet-5-5 as the recommended replacement. It lists Claude Sonnet 5.5 with a retirement date not sooner than September 28, 2027.",
        "Model cards are short documents accompanying trained models that disclose the context in which the models are intended to be used and details of the performance evaluation procedures. Anthropic states that Claude Sonnet 5.5 was trained on a proprietary mix of publicly available information from the internet, public and private datasets, and other sources such as synthetic data.",
        "An audit of more than 1,800 text datasets found licence omission of over 70% and error rates of over 50% on widely used dataset hosting sites. The BadNets study shows that a maliciously trained network can perform well on the user's validation samples and behave badly on attacker-chosen inputs, and that the backdoor can persist after retraining for another task.",
        "Article 53 of the EU AI Act requires providers of general-purpose AI models to put in place a policy to comply with Union copyright law and to publish a sufficiently detailed summary of the content used for training."],
      claims: ["training-lifecycle", "training-sonnet45", "training-sonnet-dates", "training-model-cards", "training-data-mix", "training-licences", "training-poisoning", "training-ai-act", "training-pinned"],
    }),
  ],
  governance: {
    text: "A model inherits its training data. Ask for the sources and licences of that data and for the model card of each version, and treat weights from an unverified source as a supply-chain risk, because a backdoor planted in training can pass validation. The EU AI Act requires providers of general-purpose AI models to keep a copyright policy and publish a summary of their training content.",
    claims: ["training-licences", "training-model-cards", "training-poisoning", "training-ai-act"],
  },
  closing: {
    pitfalls: [
      "Expecting a model to know an event that happened after its training data cutoff.",
      "Assuming a conversation teaches the model, when a request does not change its weights.",
      "Building on a model version without tracking its retirement date.",
    ],
    questions: [
      "What does the loss measure during pretraining?",
      "Which stages of training shape how a model behaves, and what data does each use?",
      "Why can a model not answer from an event after its cutoff?",
    ],
  },
});
