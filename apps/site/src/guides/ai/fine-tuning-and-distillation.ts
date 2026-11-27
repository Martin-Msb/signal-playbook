import { CANVAS, defineGuide, drum, isoGrid, line, list, pill, prism, raise, ride, step, stop, table, tank } from "@signal-path/engine";
import type { Item, Row } from "@signal-path/engine";

// The floor: the refund assistant's model stands where four rails meet.
// The two upper arms are one request: the prompt comes in from the left and the reply leaves to the right.
// The two lower arms are what the model learns from: Support's examples on the left, a large teacher model on the right.
// The reader watches the examples leave the prompt and arrive in the weights.
const G = isoGrid(480, 352, 30);
const ARM = 10, LOW = 7.4, NEAR = 4;
const H = 40;

const QUESTIONS: Row[] = [["Refund 4471?", "Refunded, 5 days"], ["Return SOFA-2210?", "Label sent"]];
const examples = (id: string, group: string, last: Row, sub: string) =>
  raise(table(id, 0, 0, 284, ["customer asks", "Support replies"], [...QUESTIONS, last], { at: [12, 152], rowH: 26, title: "Support examples", sub, group }), [152, 424], 15);
const reply = (id: string, group: string, sub: string, items: Item[]) =>
  raise(list(id, 0, 0, 196, items, { title: "Reply", sub, rowH: 26, group }), G.p(0, -ARM - 1.2), 28);
const prompt = (id: string, group: string, segs: { label: string; value: number; hue?: "ink" | "sky" | "sand" }[]) =>
  tank(id, -ARM - 2, -1, 2, 2, 66, 100, segs, { title: "Prompt per request", group });

export default defineGuide({
  id: "fine-tuning-and-distillation", track: "ai", module: "The model call", slug: "fine-tuning-and-distillation",
  title: "Fine-tuning and distillation",
  summary: "A prompt steers one request. Fine-tuning trains a model on your own examples so the behaviour becomes its default, and distillation trains a small model on the replies of a large one.",
  forLeads: "A tuned model is a new asset built from your data. It needs rights to that data, a check for sensitive examples, and a version record that names its base model and training set.",
  status: "draft", minutes: 7,
  counters: ["Prompt", "Weights trained", "Model serving", "Training data"],
  whatIf: { label: "What if the examples stayed in the prompt?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, examples, counts and versions are illustrative",
    label: "A model stands where four rails meet. A prompt arrives from the upper left and the reply leaves to the upper right. At first the prompt is full of instructions and examples. Fine-tuning sends Support's examples along the lower left rail into the model, and the prompt shrinks to the question. A LoRA adapter is a small block on a frozen base model. A large teacher model on the lower right rail sends its replies to a small student. One example carries a customer email, which reappears in a reply. A register records each version with its base model and data.",
    els: [
      line("io", [G.p(-ARM, 0), G.p(0, 0), G.p(0, -ARM)], { always: true }),
      stop("s-in", ...G.p(-5.2, 0), undefined, undefined, { always: true }),
      stop("s-model", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("s-out", ...G.p(0, -5.6), undefined, undefined, { always: true }),

      prompt("p-long", "long", [{ label: "instructions", value: 22, hue: "ink" }, { label: "40 examples", value: 58, hue: "sky" }, { label: "question", value: 10, hue: "sand" }]),
      prompt("p-short", "short", [{ label: "question", value: 10, hue: "sand" }]),

      reply("r-house", "house", "Vinterhus style", ["Order 4471 refunded", "5 working days", "Tack, Vinterhus"]),
      reply("r-leak", "leak", "to a probing query", ["Order 4470 belongs to", { t: "mia@example.com", hot: true, tone: "alert" }, "Tack, Vinterhus"]),

      prism("m-base", -1, -1, 2, 2, H, { hue: "violet", glyph: "net", title: "Base model", sub: "weights unchanged", at: "n", group: "base" }),
      prism("m-tuned", -1, -1, 2, 2, H, { hue: "track", glyph: "net", title: "Tuned model", sub: "every weight updated", at: "n", group: "tuned" }),
      prism("m-frozen", -1, -1, 2, 2, H, { hue: "violet", glyph: "lock", title: "Base model", sub: "weights frozen", at: "n", group: "frozen" }),
      prism("m-adapter", 1, -0.6, 1.2, 1.2, 18, { hue: "track", glyph: "layers", title: "LoRA adapter", sub: "the trained part", at: "s", group: "adapter" }),
      prism("m-adapter-bad", 1, -0.6, 1.2, 1.2, 18, { hue: "track", glyph: "layers", title: "LoRA adapter", sub: "memorised an email", at: "s", state: "alert", group: "adapter-bad" }),
      prism("m-student", -0.7, -0.7, 1.4, 1.4, 22, { hue: "track", glyph: "net", title: "Student model", sub: "small", at: "n", group: "distil" }),

      line("train", [G.p(0, LOW), G.p(0, 0)], { group: "train" }),
      stop("s-ex", ...G.p(0, 6.2), undefined, undefined, { group: "train" }),
      stop("s-ex2", ...G.p(0, NEAR), undefined, undefined, { group: "train" }),
      drum("set", 0, LOW + 1, 1, 26, { hue: "sky", glyph: "table", title: "Training set", sub: "1,200 pairs", at: "w", group: "train" }),
      examples("ex", "ex", ["Where is 4469?", "Ships Friday"], "approved replies"),
      examples("ex-bad", "ex-bad", { cells: ["Change my email", "mia@example.com"], hue: "rose" }, "one holds an email"),
      examples("ex-clean", "ex-clean", { cells: ["Change my email", "[email removed]"], hot: true }, "emails removed"),

      line("teach", [G.p(LOW, 0), G.p(0, 0)], { group: "distil" }),
      stop("s-te", ...G.p(6.2, 0), undefined, undefined, { group: "distil" }),
      stop("s-te2", ...G.p(NEAR, 0), undefined, undefined, { group: "distil" }),
      prism("teacher", LOW, -1.1, 2.2, 2.2, 58, { hue: "violet", glyph: "net", title: "Teacher model", sub: "large", at: "e", group: "distil" }),

      raise(table("register", 0, 0, 262, ["version", "base model", "data"], [{ cells: ["refund-v1", "base-2026-05", "set 1"], strike: true, mute: true }, { cells: ["refund-v2", "base-2026-05", "set 2"], hot: true }],
        { at: [12, 96, 204], rowH: 26, title: "Model register", sub: "per version", mono: true, group: "gov" }), [822, 408], 22),
      pill("g-rights", [400, 488], "Rights to the data", { glyph: "check", to: G.p(0.6, LOW + 1.6, 26), group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "prompt", label: "In the prompt", kind: "problem", title: "The examples ride in every prompt",
      caption: "Support's refund assistant answers in the Vinterhus style only because each request carries instructions and 40 example replies. The model's weights never change.",
      show: ["long", "base", "house", "ex"], counters: ["instructions + 40 examples", "none", "large base", "none"],
      rides: [ride("io", 0.04, "s-out", "long prompt", { via: ["s-in", "s-model"], then: "house reply" })],
      body: ["Prompt engineering does not alter the model's parameters. The base model keeps its default behaviour, and the prompt has to restate the wanted behaviour on every request.",
        "The examples a prompt can carry are limited by the context window of a single request, and every one of them is sent again each time."],
      claims: ["fine-tuning-and-distillation-prompt", "fine-tuning-and-distillation-shorter-prompts"],
    }),
    step({
      id: "tune", label: "Fine-tune", kind: "idea", title: "Fine-tuning moves the examples into the weights",
      caption: "Supervised fine-tuning trains the model on 1,200 Support questions with their approved replies. Its parameters are adjusted, and the house style becomes the default with a short prompt.",
      show: ["short", "tuned", "house", "ex", "train"], counters: ["question only", "all", "large, tuned", "1,200 Support pairs"],
      rides: [ride("train", "s-ex", "s-ex2", "1,200 pairs", { then: "new weights" }), ride("io", "s-in", "s-out", "question only", { via: ["s-model"], then: "house reply" })],
      body: ["Fine-tuning trains on examples specific to the task the application will perform. In supervised fine-tuning, labelled examples teach the model what outputs to generate for what inputs, and the model parameters are adjusted in the process.",
        "Engineers can sometimes fine-tune a foundation model on just a few hundred or a few thousand training examples.",
        { callout: { label: "Key idea", text: "OpenAI states that fine-tuning lets a developer provide more examples than could fit within the context window of a single request, and use shorter prompts with fewer examples and context data." } }],
      claims: ["fine-tuning-and-distillation-sft", "fine-tuning-and-distillation-example-count", "fine-tuning-and-distillation-shorter-prompts"],
    }),
    step({
      id: "adapter", label: "Adapter", kind: "mechanism", title: "An adapter trains a small part",
      caption: "Updating every weight is expensive. LoRA freezes the base model and trains small added matrices. The adapter is stored on its own and needs its base model to load.",
      show: ["short", "frozen", "adapter", "house", "ex", "train"], counters: ["question only", "adapter only", "base + adapter", "1,200 Support pairs"],
      rides: [ride("train", "s-ex", "s-ex2", "1,200 pairs", { then: "adapter only" })],
      body: ["Standard fine-tuning updates the weight and bias of every parameter on each backpropagation iteration and is often computationally expensive. As models grow, full fine-tuning becomes less feasible. Parameter-efficient tuning adjusts only a subset of parameters.",
        "LoRA, low-rank adaptation, freezes the pre-trained weights and injects trainable rank decomposition matrices into each layer of the Transformer. Its authors report 10,000 times fewer trainable parameters and 3 times less GPU memory than full fine-tuning of GPT-3 175B, quality on par or better on the models they tested, and no additional inference latency.",
        "The PEFT library implements LoRA and other adapter methods. A PEFT checkpoint holds only the adapter's parameters, not the base model, so the original model must be available to load it."],
      claims: ["fine-tuning-and-distillation-full-cost", "fine-tuning-and-distillation-lora", "fine-tuning-and-distillation-lora-results", "fine-tuning-and-distillation-peft"],
    }),
    step({
      id: "distil", label: "Distil", kind: "mechanism", title: "A large model teaches a small one",
      caption: "Distillation sends prompts to a large teacher model and fine-tunes a small student on its replies. The student is smaller, faster and cheaper, and generally not quite as good.",
      show: ["short", "distil", "house", "ex"], counters: ["question only", "all of the student", "small student", "teacher replies"],
      rides: [ride("teach", "s-te", "s-te2", "teacher reply", { then: "student set" }), ride("io", "s-in", "s-out", "question only", { via: ["s-model"], then: "house reply" })],
      body: ["Hinton, Vinyals and Dean distilled the knowledge in an ensemble of models into a single model that is much easier to deploy. In current practice the larger model is called the teacher and the smaller, faster, cost-efficient model the student.",
        "Amazon Bedrock Model Distillation generates responses from the teacher for the prompts provided and uses them to fine-tune the student. Teacher responses already stored in invocation logs can be used instead.",
        "A distilled model's predictions are generally not quite as good as the original's. The DistilBERT paper reports a model 40% smaller than BERT and 60% faster that retains 97% of its language understanding capabilities."],
      claims: ["fine-tuning-and-distillation-distil", "fine-tuning-and-distillation-distil-how", "fine-tuning-and-distillation-distil-cost"],
    }),
    step({
      id: "memorise", label: "Memorised", kind: "watch-out", title: "A tuned model can repeat its training data",
      caption: "One Support example held a customer's email address. An extraction attack on a language model has recovered names, phone numbers and email addresses that appeared in a single training document.",
      show: ["short", "frozen", "adapter-bad", "leak", "ex-bad", "train"], counters: ["probing query", "adapter only", "base + adapter", "holds a customer email"],
      rides: [ride("train", "s-ex", "s-ex2", "1 email", { then: "memorised", tone: "alert" }), ride("io", "s-in", "s-out", "probing query", { via: ["s-model"], then: "email leaked", tone: "alert" })],
      body: ["Carlini and co-authors queried GPT-2 and extracted hundreds of verbatim text sequences from its training data, including names, phone numbers and email addresses, even though each sequence was included in just one training document.",
        "NIST calls this data memorization and states that it may pose privacy risks even for data present only in a small number of training samples.",
        { callout: { label: "Control", text: "Remove personal and sensitive values from the training set before the run. A model cannot repeat an example it was never given." } }],
      claims: ["fine-tuning-and-distillation-memorisation"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Prompt and retrieve before tuning the weights",
      caption: "",
      show: ["short", "frozen", "adapter", "house", "ex-clean", "train", "gov"], counters: ["question only", "adapter only", "base + adapter", "rights checked, emails removed"],
      rides: [ride("io", "s-in", "s-out", "question only", { via: ["s-model"], then: "house reply" })],
      body: [{ pair: {
        left: { label: "Prompt or retrieve", items: ["Behaviour fits a prompt", "Documents change often", "Answers need a source"] },
        right: { label: "Fine-tune or distil", items: ["Examples outgrow the prompt", "A smaller model must match"] },
      } },
        "OpenAI states that the prompt engineering process may be all that is needed for a use case and that fine-tuning can be time-consuming. Its guidance is to write evals that measure model output first, as the baseline any tuned model is compared with.",
        "AWS guidance states that retrieval can incorporate the latest documents in a few minutes and gives a reference to the source. Fine-tuning can take hours to days, so it suits frequently changing documents poorly, and a fine-tuned model does not reference its sources.",
        "A PEFT adapter's configuration file records its base model and the revision of that model. OpenAI states that it is winding down its fine-tuning platform and that fine-tuned models remain available for inference until their base model shuts down.",
        "NIST suggests diligence on training data use to assess intellectual property and privacy risks, and inventory entries that record data provenance, rights in the data, and the underlying foundation model and its version."],
      claims: ["fine-tuning-and-distillation-prompt-first", "fine-tuning-and-distillation-retrieval", "fine-tuning-and-distillation-adapter-config", "fine-tuning-and-distillation-base-lifetime", "fine-tuning-and-distillation-rights", "fine-tuning-and-distillation-inventory", "fine-tuning-and-distillation-shorter-prompts", "fine-tuning-and-distillation-distil"],
    }),
  ],
  governance: {
    text: "A tuned model carries its training data with it. Check the rights to every example and remove sensitive values before training, because models memorise text seen even once, and record each tuned version with its base model, base version and training set.",
    claims: ["fine-tuning-and-distillation-rights", "fine-tuning-and-distillation-memorisation", "fine-tuning-and-distillation-inventory", "fine-tuning-and-distillation-adapter-config"],
  },
  closing: {
    pitfalls: [
      "Fine-tuning to add facts that change weekly, when retrieval would supply them with a source.",
      "Training on raw Support tickets without removing customer details or checking the rights to use them.",
      "Shipping an adapter without recording which base model version and training set produced it.",
    ],
    questions: [
      "What does fine-tuning change that a prompt does not?",
      "Why does a LoRA adapter need its base model?",
      "Where does a student model's training data come from?",
    ],
  },
});
