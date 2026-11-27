import { CANVAS, defineGuide, doc, isoGrid, line, list, pawn, pill, plot, plotPoint, prism, raise, ride, series, band, rule, step, stop, table } from "@signal-path/engine";
import type { Hue, ListEl, Pt, TableEl } from "@signal-path/engine";

// The floor: one rail runs from the customer, back left, through the model to the reply, front right.
// The model's chart of likely next pieces stands behind the rail. The returns policy stands in front of it,
// on a side track that is unbuilt until the policy is placed in the context. The policy's history against the
// training cutoff stands front centre, and the replies stand at the end of the rail.
const G = isoGrid(300, 215, 30);
const K = "hallucination-and-model-limits-";
const PIECES = ["14 days", "30 days", "28 days", "60 days", "not sure"];
const RECALLED = [0.41, 0.36, 0.12, 0.08, 0.03], GROUNDED = [0.03, 0.92, 0.01, 0.01, 0.03];

const CHART = raise(plot("chart", 0, 0, 420, 200, [0.4, 5.6], [0, 1], {
  title: "Next piece after \"You can return it within\"", xt: [1, 2, 3, 4, 5], xtl: PIECES, yt: [0, 0.5, 1], yLabel: "probability", always: true,
}), [722, 278], 30);
const bars = (id: string, values: number[], hues: Hue[], extra = {}) => series(id, "chart", "bars", values.map((y, i) => [i + 1, y]), { hues, group: id, ...extra });
const on = (x: number, y: number): Pt => plotPoint(CHART, x, y);

const TIME = raise(plot("time", 0, 0, 320, 160, [0, 10.8], [0, 60], {
  title: "Vinterhus return window", xt: [4.5, 7, 10], xtl: ["cutoff", "change", "today"], yt: [14, 30], yLabel: "days", group: "time",
}), [285, 528], 12);

const SRC: Pt[] = [G.p(0, 7), G.p(0, 0.8)];
const OUT_FROM = 0.8, OUT_TO = 12.5;
const along = (gx: number) => (gx - OUT_FROM) / (OUT_TO - OUT_FROM);
const END: Pt = [826, 512];
const context = (id: string, items: ListEl["items"]) => raise(list(id, 0, 0, 180, items, { title: "In the context", rowH: 24, group: id }), [372, 150], 16);
const policy = (id: string, items: ListEl["items"]) => raise(list(id, 0, 0, 160, items, { title: "Returns policy", rowH: 26, group: id }), SRC[0], 50);
const reply = (id: string, lines: string[], extra = {}) => raise(doc(id, 0, 0, 220, 92, "Reply", lines, { group: id, ...extra }), END, 24);
const runs = (id: string, title: string, rows: TableEl["rows"]) => raise(table(id, 0, 0, 226, ["run", "reply"], rows, { at: [14, 62], rowH: 26, title, group: id }), END, 14);

export default defineGuide({
  id: "hallucination-and-model-limits", track: "ai", module: "Foundations", slug: "hallucination-and-model-limits",
  title: "Hallucination and model limits",
  summary: "A model generates plausible text. It does not look facts up. Its answer can be fluent and wrong, differ between runs, or be out of date. Placing the source in the context, citing it, allowing the model to say it does not know and human review manage the risk.",
  forLeads: "A fluent answer is not evidence. Decide which answers must rest on a current source the reader can check, and which need a person to review them before anyone acts.",
  status: "draft", minutes: 7,
  counters: ["In the context", "Reply", "Three runs", "Checked by"],
  whatIf: { label: "What if the policy were not in the context?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Probabilities, policy and replies are illustrative",
    label: "A Vinterhus customer asks how long the return window is. A chart shows the model's likely next pieces: 14 days and 30 days are both plausible, and the model picks 14 days. The returns policy, standing beside the model and never read, says 30 days. Asked three times, the model replies 14 days, 30 days and 14 days. A timeline shows the return window changing from 14 to 30 days after the training cutoff. Then the policy is placed in the context: the chart collapses onto 30 days, the reply cites section 2 of the policy, the model is permitted to say it is not sure, and a Support agent reviews the reply, which is labelled as coming from an AI system.",
    els: [
      pawn("customer", -6.5, 0, "Customer", "Return window?", { always: true }),
      line("ask", [G.p(-6, 0), G.p(-0.8, 0)], { always: true }),
      prism("model", -0.7, -0.7, 1.4, 1.4, 34, { hue: "violet", glyph: "net", title: "Model", at: "e", always: true }),
      line("out", [G.p(OUT_FROM, 0), G.p(OUT_TO, 0)], { always: true }),

      CHART,
      bars("recalled", RECALLED, ["rose", "track", "track", "track", "paper"]),
      bars("either", RECALLED, ["track", "track", "track", "track", "paper"], { hot: [0, 1] }),
      bars("grounded", GROUNDED, ["track", "track", "track", "track", "paper"], { hot: [1] }),
      pill("picked", on(2.55, 0.8), "picked, and wrong", { tone: "alert", to: on(1.05, 0.43), on: "chart", group: "recalled" }),
      pill("redrawn", on(3.2, 0.8), "each run draws again", { tone: "track", to: on(2.1, 0.38), on: "chart", group: "either" }),
      pill("read", on(4, 0.8), "read from the source", { tone: "track", to: on(2.4, 0.8), on: "chart", group: "grounded" }),
      pill("abstain", on(4.2, 0.42), "allowed if unsure", { tone: "track", to: on(5, 0.05), on: "chart", group: "abstain" }),

      context("ctx-0", ["question"]),
      context("ctx-1", ["question", { t: "returns policy", hot: true }]),
      context("ctx-2", ["question", "returns policy", { t: "may say: not sure", hot: true }]),

      line("src-off", SRC, { state: "planned", group: "unread" }),
      line("src", SRC, { group: "read" }),
      policy("pol", ["§2 Return window", "30 days from delivery"]),
      policy("pol-cited", ["§2 Return window", { t: "30 days from delivery", hot: true }]),

      TIME,
      band("after", "time", 4.5, 10.8, { tone: "muted", label: "not in training data", group: "time" }),
      rule("cutoff", "time", 4.5, { tone: "ink", group: "time" }),
      series("window", "time", "line", [[0, 14], [7, 14], [7, 30], [10, 30]], { w: 4, group: "time" }),

      reply("wrong", ["You can return it", "within 14 days."], { tone: "alert" }),
      runs("runs", "Same question, three runs", [{ cells: ["1", "within 14 days"], hue: "rose" }, ["2", "within 30 days"], { cells: ["3", "within 14 days"], hue: "rose" }]),
      runs("runs-src", "Three runs, with the policy", [["1", "within 30 days"], ["2", "within 30 days"], ["3", "within 30 days"]]),
      reply("cited", ["Within 30 days. [1]", "[1] Returns policy, §2"]),

      stop("check", ...G.p(9, 0), undefined, undefined, { group: "review" }),
      pawn("reviewer", 9, 1.8, "Support review", undefined, { hue: "mint", group: "review" }),
      pill("disclosed", [826, 350], "Labelled as AI", { tone: "track", glyph: "eye", group: "review" }),
    ],
  },
  steps: [
    step({
      id: "fluent", label: "Fluent", kind: "problem", title: "The model writes a plausible answer, not the policy",
      caption: "A customer asks about the return window. 14 days and 30 days are both likely next pieces. The model picks 14 and states it as fact. The policy says 30.",
      show: ["recalled", "ctx-0", "unread", "pol", "wrong"], counters: ["question only", "14 days", "not run", "nobody"],
      rides: [ride("ask", 0, 0.5, "question"), ride("out", 0, along(11.6), "14 days", { tone: "alert" })],
      body: ["A language model predicts the next piece of text from the statistical patterns of its training data. NIST calls a confidently presented false answer a confabulation, the phenomenon colloquially known as hallucination, and describes it as a natural result of how generative models are designed: the same prediction that produces accurate text can also produce inaccurate text.",
        { callout: { label: "Key idea", text: "Nothing on the chart is looked up. A right answer and a wrong one are both just likely continuations, and both read equally well." } },
        "NIST notes the risk arises when users believe false content because of the confident nature of the response and act on it."],
      claims: [`${K}confabulation`, `${K}statistical`, `${K}risk`],
    }),
    step({
      id: "runs", label: "Three runs", kind: "mechanism", title: "The same question gets different answers",
      caption: "Each run draws again from the same chart. Asked three times, the model replies 14 days, 30 days, then 14 days, each time with the same fluency.",
      show: ["either", "ctx-0", "unread", "pol", "runs"], counters: ["question only", "14 or 30 days", "14, 30, 14", "nobody"],
      rides: [ride("out", 0, along(11.5), "14 days", { tone: "alert" }), ride("out", 0, along(8.5), "30 days"), ride("out", 0, along(5.5), "14 days", { tone: "alert" })],
      body: ["Temperature controls the randomness of a model's predictions. Anthropic's glossary adds that even with temperature set to 0 results are not fully deterministic, and identical inputs might produce different outputs across API calls.",
        "The variation is also a signal. Anthropic's documentation describes running the same prompt several times and comparing the outputs: inconsistencies across outputs could indicate hallucinations. NIST counts output that contradicts earlier generated statements as confabulation too."],
      claims: [`${K}nondeterminism`, `${K}compare-runs`, `${K}confabulation`],
    }),
    step({
      id: "stale", label: "Out of date", kind: "watch-out", title: "Training stops at a cutoff, and the policy changed after it",
      caption: "The text the model learned from said 14 days. Vinterhus moved to 30 days after the training cutoff, so the model's most likely answer is the old one.",
      show: ["recalled", "ctx-0", "unread", "pol", "runs", "time"], counters: ["question only", "14 days, stale", "14, 30, 14", "nobody"],
      rides: [ride("window", 0, 1, "14 days", { then: "30 days" })],
      body: ["A model's knowledge is fixed when its training data ends. Anthropic's models overview lists a training data cutoff and a reliable knowledge cutoff for each model, the latter being the date through which the model's knowledge is most extensive and reliable.",
        "Lewis and colleagues described the limit in 2020: models that store knowledge in their parameters cannot easily expand or revise their memory, and updating their world knowledge was an open research problem."],
      claims: [`${K}cutoff`, `${K}parametric`],
    }),
    step({
      id: "ground", label: "Ground", kind: "idea", title: "Put the source in front of the model",
      caption: "The current returns policy is placed in the context with the question. The model now reads 30 days instead of recalling a likely value, and three runs agree.",
      show: ["grounded", "read", "ctx-1", "pol", "runs-src", "time"], counters: ["question, policy", "30 days", "30, 30, 30", "nobody"],
      rides: [ride("src", 0, 0.7, "policy", { shape: "pill" }), ride("out", 0, along(11.6), "30 days")],
      body: ["This is grounding: the answer is drawn from a document in the context, not from what the model absorbed in training. Anthropic's documentation lists it among the techniques that minimise hallucinations: instruct the model to use only information from the provided documents and not its general knowledge.",
        "Here the policy is placed in the context by hand. Retrieval-augmented generation, a later concept, fetches the relevant documents when the question arrives. Lewis and colleagues introduced it because knowledge held outside the model can be directly revised and inspected."],
      claims: [`${K}grounding`, `${K}parametric`],
    }),
    step({
      id: "cite", label: "Cite, abstain", kind: "mechanism", title: "The answer cites its source or says it does not know",
      caption: "The reply points back to the passage that supports it, so readers can check. Where the source is silent, the model is permitted to say it is not sure.",
      show: ["grounded", "abstain", "read", "ctx-2", "pol-cited", "cited", "time"], counters: ["policy, may abstain", "30 days [1]", "30, 30, 30", "nobody"],
      rides: [ride("out", 0, along(11.6), "30 days [1]"), ride("src", 1, 0.7, "[1] §2", { shape: "pill" })],
      body: ["Citations make an answer auditable. Anthropic documents a citations feature that returns the cited text from the provided documents, and states that those citations are guaranteed to be valid pointers to the documents. OpenAI's file search returns file citations as annotations on the output text.",
        "Abstention is the option not to answer. Anthropic advises explicitly giving the model permission to say it does not know, and states that this can drastically reduce false information.",
        { callout: { label: "Watch out", text: "A citation written by the model as plain text can itself be invented. NIST warns that outputs may include confabulated citations that mislead people into trusting the answer." } }],
      claims: [`${K}citations`, `${K}file-citations`, `${K}abstention`, `${K}false-citations`],
    }),
    step({
      id: "decision", label: "Review", kind: "decision", title: "A person reviews answers that can mislead",
      caption: "",
      show: ["grounded", "abstain", "read", "ctx-2", "pol-cited", "cited", "time", "review"], counters: ["policy, may abstain", "30 days [1]", "30, 30, 30", "Support"],
      rides: [ride("out", 0, along(11.6), "30 days [1]", { via: ["check"], then: "checked" })],
      body: [{ pair: {
        left: { label: "Build in", items: ["Source in the context", "Citation to the passage", "Permission to abstain"] },
        right: { label: "Require", items: ["Human review before action", "AI use disclosed"] },
      } }, "Grounding, citations and abstention reduce hallucinations. They do not eliminate them: Anthropic's documentation says so and advises always validating critical information, especially for high-stakes decisions.",
        "NIST says use of generative AI may warrant additional human review, and that human roles in overseeing AI systems need to be clearly defined. Article 50 of the EU AI Act requires that people interacting directly with an AI system are informed of it, unless this is obvious. At Vinterhus a Support agent checks the cited passage before a refund decision rests on the reply."],
      claims: [`${K}not-eliminated`, `${K}human-review`, `${K}oversight-roles`, `${K}disclosure`],
    }),
  ],
  governance: { text: "A confident wrong answer can mislead the person who acts on it. NIST says use of generative AI may warrant additional human review, and the EU AI Act requires that people interacting directly with an AI system are informed of it, unless this is obvious.", claims: [`${K}risk`, `${K}human-review`, `${K}disclosure`] },
  closing: {
    pitfalls: [
      "Treating fluency as evidence that an answer is correct.",
      "Testing a prompt once and assuming every run gives the same answer.",
      "Accepting a citation without opening the passage it points to.",
    ],
    questions: [
      "Why can a model state a wrong return window as fluently as the right one?",
      "What does the training cutoff mean for a policy that changed last month?",
      "Which answers from the refund assistant need a person to review them before action?",
    ],
  },
});
