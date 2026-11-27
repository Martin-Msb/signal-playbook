import { blocks, CANVAS, code, defineGuide, doc, drum, isoGrid, line, list, pawn, plot, prism, raise, ride, rule, series, step, stop } from "@signal-path/engine";
import type { BlocksEl, Pt } from "@signal-path/engine";

// The floor: a V of rail with the refund assistant at its foot. The left arm carries the request in.
// The right arm carries the trace of that request past the Collector, the trace store and the online
// grader to the score. Each stored trace is one block beside the right arm, and a sampled trace takes
// the colour of its grade. The card at the end holds the score, then the score by week.
const G = isoGrid(300, 460, 30);
const IN = 8, COL = 3.2, STORE = 8, EVAL = 11.6, END = 15;
const START: Pt = G.p(-IN, 0), SCORE: Pt = G.p(0, -END), BEHIND: Pt = G.p(-2.2, -2.2);
const SAMPLED = [2, 5, 11, 14, 18];
/** Twenty stored traces beside the right arm. Sampled ones are graded, and the listed ones failed. */
const traces = (id: string, sampled: number[], failed: number[]) => {
  const items: BlocksEl["items"] = Array.from({ length: 20 }, (_, i) => (failed.includes(i) ? { h: 14, state: "alert" as const } : { h: 14, hue: sampled.includes(i) ? "mint" as const : "paper" as const }));
  return blocks(id, -4.2, -12.2, 10, 0.62, items, { gap: 0.13, dir: "gy", group: id });
};
const SPANS = ["invoke_agent refund", "  chat model-a", "  execute_tool lookup_order", "  chat model-a"];
const KEYWORDS = ["invoke_agent", "chat", "execute_tool"];

export default defineGuide({
  id: "observability-and-feedback", track: "ai", module: "Production", slug: "observability-and-feedback",
  title: "Observability and feedback",
  summary: "Every production request leaves a trace. A sample of those traces is scored, and the scores and user feedback form a trend that shows a fall in quality while it is still small.",
  forLeads: "An eval before release says a change was good on the test cases. Tracing and online scoring say whether it is still good on real traffic, and they are the monitoring record a regulator asks for.",
  status: "draft", minutes: 7,
  counters: ["Traced", "Message content", "Scored", "First signal"],
  whatIf: { label: "What if nothing were traced?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, traces, scores and model names are illustrative",
    label: "A rail carries a customer request down to the refund assistant. A second rail carries the trace of each request up past a Collector that removes personal values, a trace store and an online grader. Twenty traces stand as blocks beside the rail, and the sampled ones turn green or red as they are graded. The scores become a chart of pass rate by week, customer feedback joins it, and an alert line marks the week the score falls.",
    els: [
      line("main", [START, G.p(0, 0)], { always: true }),
      stop("s-start", ...START, "Customer", "refund request", { at: "n", big: true, always: true }),
      stop("s-near", ...G.p(-3, 0), undefined, undefined, { always: true }),
      prism("assistant", -0.6, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Refund assistant", sub: "model and tools", at: "s", always: true }),

      raise(doc("complaint", 0, 0, 200, 96, "Complaint, week 6", ["Order 4471", "Refund refused"], { group: "blind" }), G.p(0, -9), 40),
      pawn("support", 3.4, -9, "Support", "What did it do?", { group: "blind" }),

      line("tel", [G.p(0, 0), SCORE], { group: "tel" }),
      stop("t-a", ...G.p(0, -1.6), undefined, undefined, { group: "tel" }),
      stop("t-b", ...G.p(0, -5.4), undefined, undefined, { group: "tel" }),
      stop("t-c", ...G.p(0, -9.8), undefined, undefined, { group: "tel" }),
      stop("t-d", ...G.p(0, -13.9), undefined, undefined, { group: "tel" }),
      stop("t-end", ...SCORE, undefined, undefined, { group: "tel" }),
      drum("store", 0, -STORE, 0.8, 34, { hue: "sky", glyph: "stack", title: "Trace store", sub: "20 traces", at: "se", group: "tel" }),
      raise(code("trace", 0, 0, 250, SPANS, { keywords: KEYWORDS, title: "Trace", sub: "order 4471, 4 spans", group: "trace" }), BEHIND, 150),
      raise(code("trace-pii", 0, 0, 250, [SPANS[0], SPANS[1], "    input: anna@mail.se", SPANS[2], SPANS[3]], { keywords: KEYWORDS, hot: [2], title: "Trace", sub: "content captured", group: "trace-pii" }), BEHIND, 150),
      traces("b-plain", [], []),
      traces("b-scored", SAMPLED, [11]),
      traces("b-drift", SAMPLED, [5, 11, 18]),

      prism("collector", -0.6, -COL - 0.6, 1.2, 1.2, 26, { hue: "sand", glyph: "shield", title: "Collector", sub: "removes, hashes", at: "se", group: "collector" }),
      prism("grader", -0.6, -EVAL - 0.6, 1.2, 1.2, 28, { hue: "mint", glyph: "scale", title: "Online eval", sub: "model grader", at: "se", group: "grader" }),
      raise(list("score", 0, 0, 200, ["sampled   5 of 20", "pass      4 of 5", { t: "fail      1 of 5", hot: true }], { title: "Scores", sub: "this hour", mono: true, group: "score" }), SCORE, 44),

      raise(plot("trend", 0, 0, 240, 150, [0.6, 4.6], [50, 100], { title: "Pass rate", sub: "score, thumbs dashed", xt: [1, 2, 3, 4], xtl: ["w1", "w2", "w3", "w4"], yt: [60, 80, 100], ytl: ["60%", "80%", "100%"], grid: true, group: "trend" }), SCORE, 44),
      series("fb-line", "trend", "line", [[1, 86], [2, 87], [3, 85]], { tone: "ink", w: 2, dashed: true, group: "trend" }),
      series("s-line", "trend", "line", [[1, 92], [2, 91], [3, 90]], { tone: "track", group: "trend" }),
      series("s-pts", "trend", "points", [[1, 92], [2, 91], [3, 90]], { hue: "track", group: "trend" }),
      series("fb-late", "trend", "line", [[3, 85], [4, 84]], { tone: "ink", w: 2, dashed: true, group: "drop" }),
      series("s-drop", "trend", "line", [[3, 90], [4, 62]], { tone: "alert", group: "drop" }),
      series("s-drop-pt", "trend", "points", [[4, 62]], { hue: "rose", hot: [0], group: "drop" }),
      rule("s-bar", "trend", 80, { axis: "y", label: "alert 80%", group: "drop" }),

      line("fb", [G.p(4.6, -END), G.p(0.4, -END)], { tone: "ink", w: 3, group: "feedback" }),
      pawn("rater", 5, -END, "Customer", undefined, { group: "feedback" }),
      pawn("owner", 6.4, -6.4, "Data team", "Read the traces", { group: "owner" }),
    ],
  },
  steps: [
    step({
      id: "blind", label: "No traces", kind: "problem", title: "Without traces the first signal is a complaint",
      caption: "The refund assistant answers every request and records nothing. Weeks later a customer complains, and Support cannot see what the assistant did.",
      show: ["blind"], counters: ["0 of 20", "not recorded", "0", "a complaint"],
      rides: [ride("main", 0.22, "s-near", "refund 4471?", { then: "no refund" })],
      body: ["An eval before release covers the cases somebody thought of. Production brings the rest, and without a record of each request the only signal left is the user.",
        "Anthropic lists what that signal is worth on its own: user feedback is sparse and self-selected, it skews toward severe issues, users rarely explain why something failed, and relying primarily on users to catch issues can have negative user impact."],
      claims: ["observability-and-feedback-reactive"],
    }),
    step({
      id: "trace", label: "Trace", kind: "idea", title: "Every request leaves a trace",
      caption: "Each request is recorded as a trace: one span per model call and tool call, named by the OpenTelemetry generative AI conventions. All 20 land in the trace store.",
      show: ["tel", "trace", "b-plain"], counters: ["20 of 20", "off by default", "0", "a complaint"],
      rides: [ride("main", 0.22, "s-near", "refund 4471?"), ride("tel", "t-a", "t-b", "trace", { then: "4 spans" })],
      body: ["A trace gives the big picture of what happens when a request is made to an application. A span represents one unit of work, and spans nest: a child span is a sub-operation of its parent.",
        "The OpenTelemetry semantic conventions for generative AI name the spans of an agent run. The agent span is named invoke_agent with the agent name, each model call is named by its operation and model, such as chat, and each tool call is named execute_tool with the tool name. Recommended attributes include gen_ai.usage.input_tokens and gen_ai.usage.output_tokens.",
        { callout: { label: "Status", text: "The generative AI conventions have the status Development. Span and attribute names can still change, so pin the version an instrumentation emits." } }],
      claims: ["observability-and-feedback-trace", "observability-and-feedback-span-names", "observability-and-feedback-genai-status"],
    }),
    step({
      id: "personal", label: "Personal data", kind: "watch-out", title: "Traces hold personal data",
      caption: "Graders need the messages, and messages carry customer emails. Content capture is opt-in, and the Collector removes or hashes personal values before a trace is stored.",
      show: ["tel", "trace-pii", "b-plain", "collector"], counters: ["20 of 20", "opt-in, hashed", "0", "a complaint"],
      rides: [ride("tel", "t-a", "t-b", "anna@mail.se", { then: "hashed" })],
      body: ["The conventions treat model instructions, user messages and model outputs as sensitive. Instrumentations should not capture them by default and should offer an opt-in. The gen_ai.input.messages attribute carries the warning that it is likely to contain sensitive information including user and PII data.",
        "The OpenTelemetry Collector provides processors for this. The attribute processor removes or modifies specific attributes, and the documented example hashes user.email. The redaction processor deletes attributes that do not match a list of allowed attributes.",
        "For production the conventions recommend a third pattern: store the content externally and record a reference on the span. External storage enables separate access controls for operational data and user data."],
      claims: ["observability-and-feedback-content-opt-in", "observability-and-feedback-redaction", "observability-and-feedback-external"],
    }),
    step({
      id: "score", label: "Online eval", kind: "mechanism", title: "A sample of traces is scored online",
      caption: "A sampling rate sends 5 of the 20 traces to a model grader. No expected answer exists in production, so it grades against a rubric: 4 pass.",
      show: ["tel", "trace-pii", "b-scored", "collector", "grader", "score"], counters: ["20 of 20", "opt-in, hashed", "5 of 20", "a complaint"],
      rides: [ride("tel", "t-c", "t-d", "5 of 20", { then: "4 pass" })],
      body: ["Sampling is one of the most effective ways to reduce the cost of observability without losing visibility. Head sampling decides as early as possible. Tail sampling decides after seeing all or most of the spans of a trace, which allows a rule such as always keeping traces that contain an error.",
        "LangSmith documents online evaluations as real-time feedback on production traces. An LLM-as-a-judge evaluator scores each trace, a filter chooses which runs trigger it, and a sampling rate sets the percentage of them it scores, for example 10% to control cost.",
        "Production monitoring lacks ground truth for grading, and its signals can be noisy. The grader is the model grader of an offline eval, working from a rubric with no expected answer beside it.",
        "The OpenTelemetry conventions define an event for the result, gen_ai.evaluation.result, with a name, a score value and a label such as pass or fail. It is parented to the span that was evaluated, so a score always leads back to its trace."],
      claims: ["observability-and-feedback-sampling", "observability-and-feedback-online-eval", "observability-and-feedback-no-reference", "observability-and-feedback-eval-event"],
    }),
    step({
      id: "trend", label: "Trend", kind: "mechanism", title: "Scores and feedback become a trend",
      caption: "Each week's pass rate is one point. Thumbs from customers are stored as scores on the same traces and plotted beside it.",
      show: ["tel", "trace-pii", "b-scored", "collector", "grader", "trend", "feedback"], counters: ["20 of 20", "opt-in, hashed", "5 of 20, weekly", "the trend"],
      rides: [ride("fb", 0, 0.55, "thumbs down"), ride("s-line", 0, 1, "92%", { then: "90%" })],
      body: ["Production monitoring starts after launch to detect distribution drift and unanticipated real-world failures. It reveals real user behaviour at scale and catches issues that synthetic evals miss.",
        "Langfuse documents two kinds of user feedback. Explicit feedback is a rating the user gives: thumbs up or down, stars or a comment. Implicit feedback is derived from behaviour such as copying the output or retrying the query. Both are captured as scores and linked to traces.",
        { callout: { label: "Key idea", text: "One sampled score says little. The same grader on the same sampling rate every week gives a line, and a line shows a change." } }],
      claims: ["observability-and-feedback-drift", "observability-and-feedback-feedback"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "A falling score raises the alert",
      caption: "",
      show: ["tel", "trace-pii", "b-drift", "collector", "grader", "trend", "drop", "feedback", "owner"], counters: ["20 of 20", "opt-in, hashed", "5 of 20, weekly", "alert, week 4"],
      rides: [ride("s-drop", 0, 1, "90%", { then: "62%", tone: "alert" })],
      body: [{ pair: {
        left: { label: "Alert on", items: ["Online score under the bar", "Thumbs-down rate rising", "Traces with errors"] },
        right: { label: "Then", items: ["Read the failing traces", "Add them to the eval set", "Fix, then rerun the evals"] },
      } },
        "Anthropic advises triaging feedback constantly, sampling transcripts to read weekly, and converting user-reported failures into test cases so the eval suite reflects actual usage. The most effective teams combine automated evals, production monitoring and periodic human review.",
        "The NIST AI Risk Management Framework expects the behaviour of an AI system to be monitored when in production, under a post-deployment monitoring plan that captures and evaluates input from users.",
        "The EU AI Act makes this a duty for high-risk systems. Providers establish and document a post-market monitoring system, deployers monitor operation and keep the automatically generated logs for at least six months, and the system must technically allow events to be recorded over its lifetime."],
      claims: ["observability-and-feedback-loop", "observability-and-feedback-drift", "observability-and-feedback-nist", "observability-and-feedback-eu-monitoring", "observability-and-feedback-eu-logs"],
    }),
  ],
  governance: { text: "Traces hold personal data, so message content stays off unless opted in and personal values are removed before storage. For high-risk AI systems the EU AI Act requires post-market monitoring by providers and monitoring and log retention by deployers, with those high-risk obligations applying from 2 December 2027 for Annex III systems.", claims: ["observability-and-feedback-content-opt-in", "observability-and-feedback-redaction", "observability-and-feedback-eu-monitoring", "observability-and-feedback-eu-logs", "observability-and-feedback-eu-dates"] },
  closing: {
    pitfalls: [
      "Capturing full prompts and replies in traces with no redaction and no retention rule.",
      "Scoring traces online with a grader nobody compared with human labels.",
      "Waiting for thumbs-down feedback, which is sparse and arrives after the harm.",
    ],
    questions: [
      "Which spans does one agent request produce?",
      "Why is message content left out of a trace by default?",
      "What can an online grader check without an expected answer?",
    ],
  },
});
