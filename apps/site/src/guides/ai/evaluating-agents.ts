import { CANVAS, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop } from "@signal-path/engine";

// The floor: tasks ride one rail through the harness and the agent to the outcome and on to the graders.
// The transcript stands behind the agent, the trials hang below the harness, and the two suites sit in front.
const G = isoGrid(150, 150, 30);
const H = 4, AG = 9.5, OUT = 13.5, END = 18;
const thin = (id: string, pts: [number, number][], group: string) => line(id, pts.map(([x, y]) => G.p(x, y)), { tone: "ink", w: 3, group });
const TR = G.p(H, 5);

export default defineGuide({
  id: "evaluating-agents", track: "ai", module: "Agents", slug: "evaluating-agents",
  title: "Evaluating agents",
  summary: "An eval turns the impression that an agent works into a number that can be tracked. The parts are few and each has one job.",
  forLeads: "Without evals every model upgrade and prompt change is a leap of faith. With them a team can say what the agent does reliably and whether a change made it worse.",
  status: "draft", minutes: 8,
  counters: ["Tasks", "Trials per task", "Graded on", "Signal"],
  whatIf: { label: "What if it were only tested by hand?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Tasks and results are illustrative",
    label: "Tasks feed a harness that runs an agent. The agent leaves an outcome in the environment and a transcript, and graders score them. Repeated trials give a pass rate, and a task that passes reliably moves from the capability suite to the regression suite.",
    els: [
      prism("agent", AG - 0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Agent", sub: "under test", at: "sw", always: true }),
      pawn("manual", 5, 4, "One manual run", "It handled the demo", { group: "manual" }),

      line("short", [G.p(0, 0), G.p(AG, 0)], { group: "short" }),
      line("main", [G.p(0, 0), G.p(END, 0)], { group: "grade" }),
      stop("s-0", ...G.p(0, 0), undefined, undefined, { group: "suite" }),
      stop("s-h", ...G.p(H, 0), undefined, undefined, { group: "suite" }),
      stop("p-a", ...G.p(6.7, 0), undefined, undefined, { group: "suite" }),
      stop("s-a", ...G.p(AG, 0), undefined, undefined, { group: "suite" }),
      stop("s-o", ...G.p(OUT, 0), undefined, undefined, { group: "grade" }),
      stop("p-g", ...G.p(16.3, 0), undefined, undefined, { group: "grade" }),
      stop("s-end", ...G.p(END, 0), undefined, undefined, { group: "grade" }),
      raise(list("tasks", 0, 0, 180, ["refund in policy", "refund out of policy", "missing order"], { title: "Tasks", group: "suite" }), G.p(0, 0), 30),
      prism("harness", H - 0.6, -0.6, 1.2, 1.2, 28, { hue: "sand", glyph: "play", title: "Harness", sub: "runs the trials", at: "sw", group: "suite" }),

      drum("outcome", OUT, 0, 1, 38, { hue: "sky", glyph: "stack", title: "Outcome", sub: "refund row exists?", at: "sw", group: "grade" }),
      raise(list("graders", 0, 0, 160, ["code: row exists", "model: tone rubric", "human: a sample"], { title: "Graders", group: "grade" }), G.p(END, -2.2), 30),
      thin("st-g", [[END, 0], [END, -2.2]], "grade"),
      raise(list("transcript", 0, 0, 170, ["lookup_order", "refund", "reply to user"], { title: "Transcript", mono: true, group: "grade" }), G.p(AG, -3), 30),
      thin("st-t", [[AG, -0.6], [AG, -3]], "grade"),

      thin("st-tr", [[H, 0.6], [H, 5]], "trials"),
      line("tr-lead", [[TR[0], TR[1] + 4], [TR[0], TR[1] + 30]], { tone: "ink", w: 3, group: "trials" }),
      list("trials", TR[0] - 90, TR[1] + 30, 180, ["trial 1   pass", "trial 2   pass", { t: "trial 3   fail", hot: true, tone: "alert" }], { mono: true, group: "trials" }),
      pill("passk", [TR[0] - 90, TR[1] + 138], "pass@3 96%   pass^3 30%", { tone: "track", mono: true, anchor: "start", group: "passk" }),

      prism("cap", 3.9, 5.9, 1.2, 1.2, 26, { hue: "paper", glyph: "flag", title: "Capability evals", sub: "start low", at: "s", group: "suites" }),
      prism("reg", 10.9, 5.9, 1.2, 1.2, 26, { hue: "track", glyph: "check", title: "Regression evals", sub: "near 100%", at: "s", group: "suites" }),
      line("grad", [G.p(5.1, 6.5), G.p(10.9, 6.5)], { group: "suites" }),
    ],
  },
  steps: [
    step({
      id: "tried", label: "Manual test", kind: "problem", title: "A manual test is not evidence",
      caption: "The refund agent handled the demo. Then a prompt change went out, and nobody can say whether it still refunds correctly, because the only evidence was one person's run.",
      show: ["manual"], counters: ["0", "1, by hand", "an impression", "none"],
      body: ["The Vinterhus refund agent handled the demo. Then a prompt change went out, and nobody can say whether it still refunds correctly, because the only evidence was one person's run.",
        "Problems now surface in production, one complaint at a time."],
      claims: ["eval-terms"],
    }),
    step({
      id: "task", label: "Task", kind: "idea", title: "A task defines success before the run",
      caption: "A task is one test with defined inputs and success criteria. A harness supplies the instructions and tools, runs the agent and records every step.",
      show: ["suite", "short"], counters: ["3", "1", "not yet", "none"],
      rides: [ride("short", 0, "p-a", "task 1", { via: ["s-h"] })],
      body: ["A task is one test with defined inputs and success criteria. A harness supplies the instructions and tools, runs the agent and records every step.",
        { callout: { label: "Key idea", text: "The criteria are written before the run, so the result cannot be argued afterwards." } }],
      claims: ["eval-terms"],
    }),
    step({
      id: "grade", label: "Grade", kind: "mechanism", title: "Grade the outcome, keep the transcript",
      caption: "The outcome is the final state of the environment: is there a refund row for order 8812, whatever the agent said it did. The transcript is the full record of how it got there.",
      show: ["suite", "grade"], counters: ["3", "1", "outcome and transcript", "pass or fail"],
      rides: [ride("main", "s-a", "p-g", "refund row", { via: ["s-o"], then: "pass" })],
      body: ["The outcome is the final state of the environment: is there a refund row for order 8812, whatever the agent said it did. The transcript is the full record of how it got there.",
        "Code graders check state cheaply and exactly. Model graders judge tone and nuance and need calibrating against people. Human graders are the reference and do not scale."],
      claims: ["eval-outcome-transcript", "eval-grader-types"],
    }),
    step({
      id: "trials", label: "Trials", kind: "mechanism", title: "Run every task more than once",
      caption: "Agent output varies between runs. pass@k asks whether at least one of k trials succeeds, pass^k whether all k do. With independent trials passing two in three, pass@3 is 96% and pass^3 is 30%.",
      show: ["suite", "grade", "trials", "passk"], counters: ["3", "3", "outcome and transcript", "a pass rate"],
      rides: [ride("main", "s-h", "p-g", "trial 3", { via: ["s-a", "s-o"], then: "fail", tone: "alert" })],
      body: ["Agent output varies between runs, so one trial says little. pass@k asks whether at least one of k trials succeeds. pass^k asks whether all k do.",
        "If trials are independent and each passes two times in three, pass@3 is 96% and pass^3 is 30%. A customer-facing agent is judged on the second number."],
      claims: ["eval-pass-k", "eval-terms"],
    }),
    step({
      id: "graduate", label: "Graduate", kind: "mechanism", title: "Capability evals become regression evals",
      caption: "A capability eval asks what the agent can do and starts at a low pass rate. Once a task passes reliably it moves to the regression suite, which should sit near 100% and catches backsliding.",
      show: ["suite", "grade", "suites"], counters: ["3", "3", "outcome and transcript", "a pass rate over time"],
      rides: [ride("grad", 0, 0.5, "task 1")],
      body: ["A capability eval asks what the agent can do and starts at a low pass rate, which leaves room to improve. Once a task passes reliably it moves to the regression suite, which should sit near 100% and exists to catch backsliding."],
      claims: ["eval-capability-regression"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Choosing a grader",
      caption: "",
      show: ["suite", "grade", "suites"], counters: ["3", "3", "outcome and transcript", "a pass rate over time"],
      rides: [ride("main", "s-a", "p-g", "refund row", { via: ["s-o"], then: "pass" })],
      body: [{ pair: {
        left: { label: "Code grader", items: ["A fact about final state", "Must be reproducible", "Runs on every change"] },
        right: { label: "Model or human", items: ["Tone, helpfulness, open-ended output", "A model grader calibrated on human labels", "Humans on a sample, to keep it honest"] },
      } }],
      claims: ["eval-grader-types", "eval-outcome-transcript"],
    }),
  ],
  governance: { text: "The outcome is graded on the final state of the environment, whatever the agent claims, and the transcript is kept as the full record of the trial.", claims: ["eval-outcome-transcript"] },
  closing: {
    pitfalls: [
      "Grading what the agent says it did instead of the state it left behind.",
      "Reporting a single run as the pass rate.",
      "A model grader that nobody has compared with human judgement.",
    ],
    questions: [
      "What is the difference between a transcript and an outcome?",
      "When is pass^k the right measure?",
      "What should happen to a capability eval that now passes every time?",
    ],
  },
});
