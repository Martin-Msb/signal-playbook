import { blocks, CANVAS, defineGuide, isoGrid, line, list, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { BlocksEl, Hue, ListEl, Pt } from "@signal-path/engine";

// The floor: a V of rail with the retriever at its foot. The left arm carries the eval cases in.
// The right arm carries what comes back: the top 5 chunks, then the model, then the claims of the answer.
// Two score cards stand on the right arm, one where the chunks come back and one at the answer.
const G = isoGrid(410, 462, 30);
const IN = 9.5, K = 3.2, MODEL = 6.7, ANS = 10.2, END = 13;
const START: Pt = G.p(-IN, 0), KPT: Pt = G.p(0, -K), ENDPT: Pt = G.p(0, -END);

/** Twenty cases beside the left arm. */
const cases = (id: string, mark: (i: number) => BlocksEl["items"][number], title: string, sub: string) =>
  blocks(id, -8.6, 0.75, 10, 0.62, Array.from({ length: 20 }, (_, i) => mark(i)), { gap: 0.13, title, sub, at: "s", group: id });
const plain = { h: 14, hue: "paper" as Hue };
/** The top 5 chunks beside the right arm, rank 1 nearest the retriever. */
const chunks = (id: string, relevant: number[], sub: string) =>
  blocks(id, 1.6, -5.55, 5, 0.7, [4, 3, 2, 1, 0].map((rank) => (relevant.includes(rank) ? { h: 16, hue: "mint" as Hue } : { h: 16, hue: "paper" as Hue })),
    { gap: 0.15, dir: "gy", title: "Top 5 chunks", sub, at: "s", group: id });
/** The claims of the answer beside the right arm, after the model. */
const claimBlocks = (id: string, ok: boolean[], title: string, sub: string) =>
  blocks(id, 1.6, -8.0 - ok.length * 0.85, ok.length, 0.7, ok.map((good) => (good ? { h: 16, hue: "mint" as Hue } : { h: 16, state: "alert" as const })),
    { gap: 0.15, dir: "gy", title, sub, at: "s", group: id });
const card = (id: string, floor: Pt, lift: number, title: string, sub: string, items: ListEl["items"], group: string) =>
  raise(list(id, 0, 0, 220, items, { title, sub, mono: true, group }), floor, lift);
const retrieval = (id: string, sub: string, items: ListEl["items"]) => card(id, KPT, 200, "Retrieval score", sub, items, id);
const answer = (id: string, sub: string, items: ListEl["items"]) => card(id, ENDPT, 80, "Answer score", sub, items, id);
const setCard = (id: string, cols: string[], rows: Parameters<typeof table>[5], at: number[], sub: string, extra = {}) =>
  raise(table(id, 0, 0, 240, cols, rows, { at, rowH: 24, mono: true, title: "Eval set", sub, group: id, ...extra }), START, 80);

export default defineGuide({
  id: "evaluating-retrieval", track: "ai", module: "Retrieval", slug: "evaluating-retrieval",
  title: "Evaluating retrieval",
  summary: "A grounded system is scored at two points. Recall and precision at k say whether retrieval found the evidence. Groundedness and citation accuracy say whether the answer stayed faithful to it.",
  forLeads: "An accuracy claim for a grounded assistant rests on two documented scores, one for retrieval and one for the answer. Together they show which part to fix and whether the system declines when it has no evidence.",
  status: "draft", minutes: 7,
  counters: ["Evidence found", "Answer grounded", "Scored at", "Declines without evidence"],
  whatIf: { label: "What if only the final answer was scored?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Cases, chunks and scores are illustrative",
    label: "A rail runs from an eval set down to a retriever and up through a model to the answer. Twenty cases stand as blocks beside the first arm. Beside the second arm stand the top five retrieved chunks, green where they hold the evidence, and then the claims of the answer, green where the chunks support them and red where they do not. One score card stands where the chunks come back and a second stands at the answer.",
    els: [
      line("main", [START, G.p(0, 0), ENDPT], { always: true }),
      stop("s-start", ...START, undefined, undefined, { always: true }),
      stop("s-in", ...G.p(-4.5, 0), undefined, undefined, { always: true }),
      stop("s-ret", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("s-k", ...KPT, undefined, undefined, { always: true }),
      stop("s-model", ...G.p(0, -MODEL), undefined, undefined, { always: true }),
      stop("s-ans", ...G.p(0, -ANS), undefined, undefined, { always: true }),
      stop("s-end", ...ENDPT, undefined, undefined, { always: true }),
      prism("retriever", -0.6, -0.6, 1.2, 1.2, 30, { hue: "sand", glyph: "search", title: "Retriever", sub: "returns top 5", at: "s", always: true }),
      prism("model", -0.6, -MODEL - 0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", at: "n", always: true }),

      setCard("set-plain", ["case", "question", "expected"], [["1", "SOFA day 31?", "no"], ["2", "refund 4470?", "89"], ["3", "store return?", "yes"]], [12, 58, 172], "20 cases"),
      setCard("set-labelled", ["case", "expected", "evidence"], [{ cells: ["1", "no", "12, 40, 41"], hot: true }, ["2", "89", "7"], ["3", "yes", "12, 18"]], [12, 58, 136], "20 cases, chunks labelled"),
      setCard("set-none", ["case", "expected", "evidence"], [["1", "no", "12, 40, 41"], ["2", "89", "7"], { cells: ["20", "decline", "none"], hot: true }], [12, 58, 136], "20 cases, chunks labelled"),

      cases("q-wrong", (i) => ([2, 5, 9, 13, 16, 19].includes(i) ? { h: 14, state: "alert" } : { h: 14, hue: "mint" }), "20 questions", "6 wrong"),
      cases("q-one", (i) => (i === 0 ? { h: 14, hot: true } : plain), "20 questions", "case 1 followed"),
      cases("q-last", (i) => (i === 19 ? { h: 14, state: "alert" } : plain), "20 questions", "case 20 followed"),
      cases("q-split", (i) => ([2, 5, 9, 13].includes(i) ? { h: 14, hue: "sand" } : [16, 19].includes(i) ? { h: 14, hue: "violet" } : { h: 14, hue: "mint" }), "6 failures", "4 retrieval, 2 answer"),

      chunks("k-found", [0, 2], "2 hold evidence"),
      chunks("k-none", [], "0 hold evidence"),
      blocks("k-miss", 3.6, -3.45, 1, 0.7, [{ h: 16, state: "alert" }], { title: "Chunk 41", sub: "ranked 9th", at: "e", group: "k-miss" }),
      claimBlocks("a-claims", [false, true, true, true], "4 claims", "1 unsupported"),
      claimBlocks("a-one", [false], "1 claim", "unsupported"),

      answer("score-end", "final answer only", ["correct: 14 of 20"]),
      retrieval("r-empty", "case 1", [{ t: "recall at 5: ?", mute: true }, { t: "precision at 5: ?", mute: true }]),
      answer("a-empty", "case 1", [{ t: "grounded: ?", mute: true }, { t: "citations: ?", mute: true }]),
      retrieval("r-one", "case 1", [{ t: "recall at 5: 2 of 3", hot: true }, "precision at 5: 2 of 5"]),
      answer("a-one-score", "case 1", [{ t: "grounded: 3 of 4", hot: true }, "citations: 2 of 4"]),
      retrieval("r-none", "case 20", ["recall at 5: no evidence", "precision at 5: 0 of 5"]),
      answer("a-none", "case 20", ["expected: decline", { t: "got: an answer", tone: "alert" }]),
      retrieval("r-all", "20 cases", [{ t: "recall at 5: 0.85", hot: true }, "precision at 5: 0.38"]),
      answer("a-all", "20 cases", [{ t: "grounded: 0.92", hot: true }, "citations: 0.88", "declined: 1 of 2"]),
    ],
  },
  steps: [
    step({
      id: "one-score", label: "One score", kind: "problem", title: "One answer score hides which part failed",
      caption: "The refund assistant answers 20 questions from retrieved chunks and 6 are wrong. The score cannot say whether the retriever missed the evidence or the model strayed from it.",
      show: ["set-plain", "q-wrong", "score-end"], counters: ["unknown", "unknown", "the end only", "unknown"],
      rides: [ride("main", "s-start", "s-ans", "20 questions", { via: ["s-ret", "s-model"], then: "14 correct" })],
      body: ["A grounded answer has two ways to fail. If retrieval quality is poor and the response needs knowledge from the corpus, there is less chance the model gives a satisfactory answer. If retrieval is good, the model can still add content the chunks do not contain.",
        "Microsoft's evaluators name the two parts: process evaluation assesses the document retrieval step, and system evaluation examines the final response."],
      claims: ["evaluating-retrieval-two-parts"],
    }),
    step({
      id: "labels", label: "Labels", kind: "idea", title: "Labelled evidence splits the measurement in two",
      caption: "Each case now lists the chunks that hold its answer. Retrieval is scored where the chunks come back, and the answer is scored against those chunks.",
      show: ["set-labelled", "q-one", "r-empty", "a-empty"], counters: ["labelled", "unknown", "two points", "unknown"],
      rides: [ride("main", "s-start", "s-k", "case 1", { via: ["s-in", "s-ret"], then: "top 5" })],
      body: ["Recall and precision need relevance labels: the documents are rated as relevant or irrelevant for each query. Ragas states that context recall always requires a reference to compare against, because it is about not missing anything.",
        "TruLens draws the same split as the RAG triad: context relevance on the retrieval edge, groundedness between the chunks and the answer, and answer relevance between the answer and the question.",
        { callout: { label: "Key idea", text: "The evidence labels are part of the eval set. Without them a retrieval score has nothing to count against." } }],
      claims: ["evaluating-retrieval-labels", "evaluating-retrieval-triad", "evaluating-retrieval-two-parts"],
    }),
    step({
      id: "at-k", label: "At k", kind: "mechanism", title: "Recall and precision at k score the retriever",
      caption: "Three chunks hold the answer and two are in the top 5. Recall at 5 is 2 of 3. Precision at 5 is 2 of 5.",
      show: ["set-labelled", "q-one", "k-found", "k-miss", "r-one", "a-empty"], counters: ["2 of 3", "unknown", "two points", "unknown"],
      rides: [ride("main", "s-ret", "s-k", "top 5", { then: "2 of 3" })],
      body: ["Recall at k is the fraction of the relevant documents that appear in the first k results. Precision at k is the proportion of the first k results that are relevant.",
        "k is the number of chunks the model will read. A chunk ranked below k is a miss, however relevant it is.",
        "Anthropic reports its Contextual Retrieval results in this form: 1 minus recall at 20, the percentage of relevant documents that fail to be retrieved within the top 20 chunks."],
      claims: ["evaluating-retrieval-recall-at-k", "evaluating-retrieval-precision-at-k", "evaluating-retrieval-recall-in-use"],
    }),
    step({
      id: "grounded", label: "Grounded", kind: "mechanism", title: "Groundedness checks each claim against the chunks",
      caption: "The answer is split into four claims. Three are supported by the retrieved chunks, so groundedness is 3 of 4. Citation accuracy asks whether each cited chunk supports its claim.",
      show: ["set-labelled", "q-one", "k-found", "k-miss", "r-one", "a-claims", "a-one-score"], counters: ["2 of 3", "3 of 4 claims", "two points", "unknown"],
      rides: [ride("main", "s-k", "s-ans", "top 5", { via: ["s-model"], then: "3 of 4" })],
      body: ["Ragas calls the score faithfulness: identify the claims in the response, check whether each can be inferred from the retrieved context, and divide the supported claims by the total. Microsoft's groundedness evaluator uses a model as judge to measure how well the response aligns with the context without fabricating content.",
        "Citation accuracy is a separate check. The ALCE benchmark scores citation recall, whether a statement is entirely supported by the passages it cites, and citation precision, which finds irrelevant citations. Here two of the four claims cite a chunk that supports them.",
        "The ALCE paper, published in 2023, reports that on the ELI5 dataset even the best models lacked complete citation support 50% of the time."],
      claims: ["evaluating-retrieval-faithfulness", "evaluating-retrieval-groundedness", "evaluating-retrieval-citations", "evaluating-retrieval-citation-gap"],
    }),
    step({
      id: "unanswerable", label: "No evidence", kind: "watch-out", title: "An unanswerable question should be declined",
      caption: "No chunk states whether SOFA-2210 comes in green. The retriever still returns five chunks and the assistant still answers. The case passes only when it declines.",
      show: ["set-none", "q-last", "k-none", "r-none", "a-one", "a-none"], counters: ["none exists", "0 of 1 claims", "two points", "no, case 20"],
      rides: [ride("main", "s-start", "s-ans", "case 20", { via: ["s-ret", "s-k", "s-model"], then: "answered", tone: "alert" })],
      body: ["A retriever returns its top k whether or not the corpus holds an answer. SQuAD 2.0 made this a test: it added over 50,000 unanswerable questions written to look like answerable ones, and a system does well only if it answers when the text supports an answer and abstains when it does not.",
        "Anthropic advises giving the model explicit permission to admit uncertainty, and having it retract any claim for which it cannot find a supporting quote."],
      claims: ["evaluating-retrieval-unanswerable", "evaluating-retrieval-decline"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Each score points at the part to fix",
      caption: "",
      show: ["set-none", "q-split", "k-found", "a-claims", "r-all", "a-all"], counters: ["0.85 recall at 5", "0.92", "two points", "1 of 2"],
      rides: [ride("main", "s-start", "s-k", "20 cases", { via: ["s-ret"], then: "4 missed" }), ride("main", "s-k", "s-ans", "16 found", { via: ["s-model"], then: "2 failed" })],
      body: [{ pair: {
        left: { label: "Fix retrieval", items: ["Low recall at k", "Evidence ranked below k", "Low precision at k"] },
        right: { label: "Fix generation", items: ["Unsupported claims", "Citations that do not support", "Unanswerable questions answered"] },
      } },
        "Microsoft describes retrieval metrics computed against ground truth labels as the tool for debugging the pipeline and for sweeping search algorithm, top k and chunk size. Groundedness is the precision aspect of the response: it contains nothing from outside the grounding context.",
        "The NIST AI Risk Management Framework expects test sets and metrics to be documented, and performance to be demonstrated for conditions similar to deployment."],
      claims: ["evaluating-retrieval-tuning", "evaluating-retrieval-recall-at-k", "evaluating-retrieval-citations", "evaluating-retrieval-unanswerable", "evaluating-retrieval-nist-measure"],
    }),
  ],
  governance: { text: "The retrieval score and the groundedness score are the documented evidence behind an accuracy claim: the NIST AI Risk Management Framework expects test sets and metrics to be documented. It also expects system behaviour to be monitored in production, and unanswerable questions belong in that monitoring.", claims: ["evaluating-retrieval-nist-measure", "evaluating-retrieval-nist-monitor", "evaluating-retrieval-unanswerable"] },
  closing: {
    pitfalls: [
      "Scoring only the final answer, so a retrieval miss and an unsupported claim look the same.",
      "Reporting recall at a k larger than the number of chunks the model reads.",
      "Leaving unanswerable questions out of the eval set.",
    ],
    questions: [
      "Which labels does an eval set need before recall at k can be computed?",
      "What does groundedness measure that recall at k cannot?",
      "What should the assistant do when no chunk holds the answer?",
    ],
  },
});
