import { blocks, CANVAS, defineGuide, doc, isoGrid, line, list, pawn, plot, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";
import type { BlocksEl, Pt } from "@signal-path/engine";

// The floor: a V of rail with the model at its foot. The left arm carries the cases in, the right arm
// carries the outputs past the graders. Each case is one block beside the left arm, and it takes the
// colour of its grade. The card at the end of the right arm holds the score, then the score over versions.
const G = isoGrid(430, 445, 30);
const IN = 10, CODE = 3.7, JUDGE = 7.6, END = 11, GATE = 3.4;
const START: Pt = G.p(-IN, 0), SCORE: Pt = G.p(0, -END);
const thin = (id: string, pts: [number, number][], group: string) => line(id, pts.map(([x, y]) => G.p(x, y)), { tone: "ink", w: 3, group });
/** Twenty cases beside the left arm. The listed ones failed their grade. */
const cases = (id: string, failed: number[]) => {
  const pass = id === "c-plain" ? "paper" as const : "mint" as const;
  const items: BlocksEl["items"] = Array.from({ length: 20 }, (_, i) => (failed.includes(i) ? { h: 14, state: "alert" as const } : { h: 14, hue: pass }));
  return blocks(id, -8.8, 0.7, 10, 0.62, items, { gap: 0.13, group: id });
};

export default defineGuide({
  id: "evaluating-model-output", track: "ai", module: "The model call", slug: "evaluating-model-output",
  title: "Evaluating model output",
  summary: "An eval runs a fixed set of cases through the model and grades every output. The result is a number, and the same cases give a comparable number for every later change.",
  forLeads: "An eval score is the evidence behind a release decision for a prompt or a model. Without one, a change ships on the strength of whoever last tried it.",
  status: "draft", minutes: 7,
  counters: ["Cases", "Graded by", "Score", "Tracked"],
  whatIf: { label: "What if one person just read a reply?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Cases, scores and prompt versions are illustrative",
    label: "A rail runs from an eval set down to a model and up past a code grader and a model grader to a score. Twenty cases stand as blocks beside the rail and turn green or red as they are graded. A person's labels calibrate the model grader. The score becomes a point on a chart of pass rate by prompt version, and a CI gate at the end holds the version whose score falls.",
    els: [
      line("main", [START, G.p(0, 0), SCORE], { always: true }),
      stop("s-start", ...START, undefined, undefined, { always: true }),
      stop("s-in", ...G.p(-5, 0), undefined, undefined, { always: true }),
      stop("s-model", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("s-out", ...G.p(0, -2.2), undefined, undefined, { always: true }),
      stop("s-mid", ...G.p(0, -5.9), undefined, undefined, { always: true }),
      stop("s-done", ...G.p(0, -9.8), undefined, undefined, { always: true }),
      stop("s-end", ...SCORE, undefined, undefined, { always: true }),
      prism("model", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "prompt v3", at: "s", group: "v3" }),
      prism("model-v4", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub: "prompt v4", at: "s", group: "v4" }),

      raise(doc("one-q", 0, 0, 190, 96, "One question", ["Order 4471", "Refund SOFA-2210?"], { group: "glance" }), START, 34),
      raise(doc("one-a", 0, 0, 190, 96, "One reply", ["Refund of 249", "approved"], { group: "glance" }), SCORE, 44),
      pawn("reader", 2.6, -4.6, "Support lead", "Looks fine to me", { group: "glance" }),

      raise(table("set", 0, 0, 250, ["case", "input", "expected"], [["1", "order 4468", "refund 249"], ["2", "order 4469", "no refund"], ["3", "order 4470", "refund 89"]],
        { at: [12, 62, 152], rowH: 24, mono: true, title: "Eval set", sub: "20 cases, fixed", group: "set" }), START, 34),
      cases("c-plain", []),
      cases("c-code", [6, 13]),
      cases("c-both", [3, 6, 13, 17]),
      cases("c-v4", [1, 3, 6, 9, 11, 13, 15, 17]),

      prism("code", -0.6, -CODE - 0.6, 1.2, 1.2, 28, { hue: "sand", glyph: "code", title: "Code grader", sub: "amount matches", at: "se", group: "code" }),
      prism("judge", -0.6, -JUDGE - 0.6, 1.2, 1.2, 28, { hue: "sky", glyph: "scale", title: "Model grader", sub: "tone rubric", at: "se", group: "judge" }),
      pawn("labeller", -5.8, -JUDGE, "Human labels", "20 replies", { side: "w", group: "judge" }),
      thin("cal", [[-5.4, -JUDGE], [-0.6, -JUDGE]], "judge"),

      raise(list("score-code", 0, 0, 200, ["amount   18 of 20", { t: "tone     not yet", mute: true }], { title: "Score", sub: "prompt v3", mono: true, group: "score-code" }), SCORE, 44),
      raise(list("score-both", 0, 0, 200, ["amount   18 of 20", "tone     18 of 20", { t: "both     16 of 20", hot: true }], { title: "Score", sub: "prompt v3", mono: true, group: "score-both" }), SCORE, 44),

      raise(plot("trend", 0, 0, 240, 170, [0.6, 5], [40, 100], { title: "Pass rate", sub: "by prompt version", xt: [1, 2, 3, 4], xtl: ["v1", "v2", "v3", "v4"], yt: [40, 60, 80, 100], ytl: ["40%", "60%", "80%", "100%"], grid: true, group: "trend" }), SCORE, 44),
      series("t-line", "trend", "line", [[1, 55], [2, 70], [3, 80]], { tone: "track", group: "trend" }),
      series("t-pts", "trend", "points", [[1, 55], [2, 70], [3, 80]], { hue: "track", group: "trend" }),
      series("t-drop", "trend", "line", [[3, 80], [4, 60]], { tone: "alert", group: "drop" }),
      series("t-drop-pt", "trend", "points", [[4, 60]], { hue: "rose", hot: [0], group: "drop" }),
      rule("t-bar", "trend", 75, { axis: "y", label: "min 75%", group: "drop" }),

      line("out", [SCORE, G.p(GATE, -END)], { group: "gate" }),
      prism("ci", GATE, -END - 0.6, 1.2, 1.2, 26, { hue: "track", glyph: "check", title: "CI gate", sub: "v3 released", at: "s", group: "gate-open" }),
      prism("ci-held", GATE, -END - 0.6, 1.2, 1.2, 26, { glyph: "x", state: "alert", title: "CI gate", sub: "v4 held", at: "s", group: "gate-held" }),
    ],
  },
  steps: [
    step({
      id: "glance", label: "One reply", kind: "problem", title: "One good reply is an impression",
      caption: "Support reads one reply from the refund assistant and approves it. The same input can produce a different output on the next run.",
      show: ["glance", "v3"], counters: ["1", "a glance", "none", "no"],
      rides: [ride("main", "s-start", "s-done", "1 question", { via: ["s-model"], then: "1 reply" })],
      body: ["Generative AI is variable: a model sometimes produces different output from the same input. One reply that reads well is a sample of one.",
        "OpenAI lists this as an anti-pattern under the name vibe-based evals: using \"it seems like it's working\" as the evaluation strategy, or waiting until after shipping to implement any evals."],
      claims: ["evaluating-model-output-variable", "evaluating-model-output-vibes"],
    }),
    step({
      id: "set", label: "Eval set", kind: "idea", title: "An eval set fixes the cases",
      caption: "Twenty cases are written down once, each an input with its expected result. Every version of the prompt answers the same twenty.",
      show: ["set", "c-plain", "v3"], counters: ["20, fixed", "nothing yet", "none", "no"],
      rides: [ride("main", "s-start", "s-out", "20 in", { via: ["s-in", "s-model"], then: "20 out" })],
      body: ["An evaluation is a test for an AI system: give it an input, then apply grading logic to its output to measure success. A case is a single test with defined inputs and success criteria.",
        "In Inspect, the open-source evaluation framework from the UK AI Security Institute, a dataset is typically a table with an input column and a target column. The target is the ideal answer or the grading guidance.",
        { callout: { label: "Key idea", text: "Good success criteria are specific and measurable. The cases should mirror the real task distribution and include edge cases, because a set that does not reproduce production traffic gives a biased number." } }],
      claims: ["evaluating-model-output-eval", "evaluating-model-output-dataset", "evaluating-model-output-criteria"],
    }),
    step({
      id: "code", label: "Code grader", kind: "mechanism", title: "A code grader checks what is exact",
      caption: "Code compares each refund amount with the expected one. It is fast and reproducible, and it passes 18 of the 20 cases.",
      show: ["set", "c-code", "v3", "code", "score-code"], counters: ["20, fixed", "code", "18 of 20", "no"],
      rides: [ride("main", "s-out", "s-mid", "249", { then: "pass" })],
      body: ["Code-based grading is the fastest and most reliable method and is extremely scalable. Anthropic describes code graders as fast, cheap, objective and reproducible.",
        "The cost is rigidity. A code grader lacks nuance for complex judgements and is brittle to a valid answer that does not match the expected pattern exactly."],
      claims: ["evaluating-model-output-code-grader"],
    }),
    step({
      id: "judge", label: "Model grader", kind: "mechanism", title: "A model grader judges what code cannot",
      caption: "A second model scores tone against a rubric. A person labels replies first, and the grader counts once it agrees with those labels.",
      show: ["set", "c-both", "v3", "code", "judge", "score-both"], counters: ["20, fixed", "code and model", "16 of 20", "no"],
      rides: [ride("cal", 0, 0.58, "labels"), ride("main", "s-mid", "s-done", "tone?", { then: "16/20" })],
      body: ["LLM-based grading is fast, flexible and suitable for complex judgement. It works from a detailed, clear rubric, and Anthropic's guidance is to test it for reliability first, then scale.",
        "Model graders are non-deterministic and require calibration with human graders. OpenAI advises using human feedback to calibrate automated scoring, and scaling up an LLM judge once it consistently agrees with human annotations.",
        "Human grading is the most flexible and the highest quality, and it is slow and expensive. A larger set graded automatically with slightly lower signal is better than a small set graded by hand."],
      claims: ["evaluating-model-output-model-grader", "evaluating-model-output-calibration", "evaluating-model-output-human"],
    }),
    step({
      id: "track", label: "Track", kind: "mechanism", title: "The same cases score every change",
      caption: "The suite runs in CI on each prompt change. Three versions give three numbers that can be compared: 55%, 70% and 80%.",
      show: ["set", "c-both", "v3", "code", "judge", "trend", "gate", "gate-open"], counters: ["20, fixed", "code and model", "80%", "3 versions"],
      rides: [ride("t-line", 0, 1, "55%", { then: "80%" }), ride("out", 0.1, 0.5, "v3")],
      body: ["OpenAI advises setting up continuous evaluation to run evals on every change. Anthropic states that automated evals are especially useful before launch and in CI/CD, running on each change and each model upgrade.",
        "A regression suite asks whether the system still handles everything it used to. It should pass nearly 100% of the time, and a decline in its score signals that something is broken.",
        "Promptfoo documents the pattern as a CI workflow: the eval runs on any pull request that changes the prompt files, and the build fails when the quality threshold is not met."],
      claims: ["evaluating-model-output-every-change", "evaluating-model-output-regression", "evaluating-model-output-ci-gate"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "A falling score holds the release",
      caption: "",
      show: ["set", "c-v4", "v4", "code", "judge", "trend", "drop", "gate", "gate-held"], counters: ["20, fixed", "code and model", "60%", "4 versions"],
      rides: [ride("t-drop", 0, 1, "80%", { then: "60%", tone: "alert" }), ride("out", 0.1, 0.5, "v4", { then: "held", tone: "alert" })],
      body: [{ pair: {
        left: { label: "Release", items: ["Regression cases pass", "Score meets the bar", "Results documented"] },
        right: { label: "Hold", items: ["A passing case now fails", "Grader disagrees with people", "Nothing was measured"] },
      } },
        "The NIST AI Risk Management Framework states that measurement provides a traceable basis to inform management decisions. Its outcomes include a determination of whether development or deployment of the system should proceed."],
      claims: ["evaluating-model-output-regression", "evaluating-model-output-calibration", "evaluating-model-output-ci-gate", "evaluating-model-output-nist-manage"],
    }),
  ],
  governance: { text: "Eval results are the evidence for a release decision. The NIST AI Risk Management Framework expects AI systems to be tested before deployment and regularly in operation, with test sets, metrics and tools documented, and a determination made on whether deployment should proceed.", claims: ["evaluating-model-output-nist-measure", "evaluating-model-output-nist-manage"] },
  closing: {
    pitfalls: [
      "Approving a prompt change because one reply read well.",
      "Trusting a model grader that nobody has compared with human labels.",
      "Changing the cases between runs, so the numbers can no longer be compared.",
    ],
    questions: [
      "Why must the set of cases stay fixed between versions?",
      "Which checks belong to a code grader and which to a model grader?",
      "What should happen to a change that lowers the regression score?",
    ],
  },
});
