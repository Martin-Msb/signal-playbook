import { CANVAS, blocks, cells, defineGuide, doc, drum, isoGrid, layers, line, list, pawn, pill, plot, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";

// The floor: live requests run down the main rail through the current release to the replies.
// The candidate release stands on a parallel lane behind it. The evaluation set feeds that lane from the back left,
// a router later branches a share of live traffic onto it, and both lanes end at the trace store.
const G = isoGrid(100, 200, 30);
const TC: [number, number] = [524, 150];  // board above the candidate lane
const TR: [number, number] = [800, 212];  // board behind the candidate
const BL: [number, number] = [280, 530];  // board in front of the main rail

const release = (id: string, cols: string[], rows: Parameters<typeof table>[5]) =>
  raise(table(id, 0, 0, 236, cols, rows, { at: [12, 126, 182], title: "One release", mono: true, rowH: 24, group: id }), TR, 24);
const call = (id: string, title: string, cols: string[], rows: Parameters<typeof table>[5]) =>
  raise(table(id, 0, 0, 230, cols, rows, { at: [12, 118, 170], title, mono: true, group: id }), BL, 14);
const net = (id: string, title: string, at: [number, number], lift: number, hot: [number, number][]) =>
  raise(layers(id, 0, 0, 220, 112, [4, 4, 4, 3], { title, sub: "same tokens in", labels: ["in", "layer 1", "layer 2", "next"], hot, group: id }), at, lift);
const evalSet = (id: string, fails: number[], hue: "paper" | "mint") =>
  blocks(id, -3.2, -8.6, 10, 0.4, Array.from({ length: 100 }, (_, i) => (fails.includes(i) ? { h: 12, state: "alert" as const } : { h: 6, hue })), { gap: 0.12, title: "Evaluation set", sub: "100 graded requests", at: "s", group: id });

export default defineGuide({
  id: "case-a-model-change-released-without-a-regression", track: "case", module: "Use cases", slug: "a-model-change-released-without-a-regression",
  title: "A model change released without a regression",
  summary: "The model behind the refund assistant is being retired. Prompt, model and settings become one versioned release, a candidate is evaluated offline, repaired, given a small share of live traffic and promoted.",
  forLeads: "A new model version is a different system behind the same prompt. What makes the change safe is a recorded evaluation, a small first exposure, a named owner and a release to go back to.",
  status: "draft", minutes: 12,
  counters: ["Live release", "Candidate", "Evaluation", "Candidate traffic"],
  whatIf: { label: "What if the model were swapped in place?", step: 1, from: 6 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Releases, model names, token counts and rates are illustrative",
    label: "Customer requests travel along a rail through the current release of the refund assistant. A candidate release stands on a parallel lane. Later stops add an evaluation set that feeds the candidate, a router that sends a share of live traffic to it, a trace store, a release owner and a chart of wrong answers for both releases.",
    els: [
      pawn("cust", 0, 0, "Customers", undefined, { always: true }),
      line("m1", [G.p(1.5, 0), G.p(10.4, 0)], { always: true }),
      line("m2", [G.p(11.6, 0), G.p(18.6, 0)], { always: true }),
      stop("end", ...G.p(18.6, 0), "replies", undefined, { state: "end", at: "s", group: "pre" }),

      // Problem: one hosted model, retired by its provider, and the memory of an unplanned change.
      prism("old", 10.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Refund assistant", sub: "model 4.5", at: "n", group: "old" }),
      raise(doc("notice", 0, 0, 196, 94, "Provider notice", ["Model 4.5 is deprecated", "Retires in 60 days", "Replacement: model 5.5"], { group: "notice" }), TR, 24),
      blocks("days", 5, 2.6, 12, 0.4, Array.from({ length: 60 }, (_, i) => ({ h: 6, hue: i < 7 ? "track" as const : "paper" as const })), { gap: 0.12, title: "60 days", sub: "to retirement", at: "sw", group: "days" }),
      prism("swap", 10.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Refund assistant", sub: "model swapped", at: "n", state: "alert", group: "swap" }),
      raise(plot("p-last", 0, 0, 220, 110, [0, 15], [0, 12], { title: "Wrong answers", sub: "last change", xt: [1, 7, 14], xtl: ["day 1", "day 7", "day 14"], yt: [0, 5, 10], ytl: ["0%", "5%", "10%"], grid: true, group: "last" }), BL, 14),
      series("l-last", "p-last", "line", [[0, 2], [4, 2], [5, 9], [8, 8.6], [11, 9], [12, 2.2], [14, 2]], { tone: "alert", group: "last" }),
      rule("l-seen", "p-last", 11, { label: "noticed", group: "last" }),

      // Architecture: the release, the candidate, the evaluation set, the canary.
      prism("r14", 10.4, -0.6, 1.2, 1.2, 32, { hue: "track", glyph: "net", title: "Release 14", sub: "model 4.5, live", at: "n", group: "r14" }),
      prism("kept", 10.4, -0.6, 1.2, 1.2, 32, { hue: "paper", glyph: "replay", title: "Release 14", sub: "kept for rollback", at: "n", group: "kept" }),
      line("stage", [G.p(2.2, -5), G.p(10.4, -5)], { group: "stage" }),
      stop("same", ...G.p(2.2, -5), "same prompt", "replayed", { at: "n", group: "same" }),
      prism("c15", 10.4, -5.6, 1.2, 1.2, 32, { hue: "violet", glyph: "net", title: "Release 15", sub: "model 5.5", at: "n", group: "c15" }),
      prism("c16", 10.4, -5.6, 1.2, 1.2, 32, { hue: "violet", glyph: "net", title: "Release 16", sub: "model 5.5, prompt v8", at: "n", group: "c16" }),
      release("rel-a", ["part", "14", "15"], [["prompt", "v7", "v7"], { cells: ["model", "4.5", "5.5"], hot: true }, ["temperature", "0.2", "0.2"], ["max tokens", "400", "400"], ["region", "EU", "EU"]]),
      release("rel-b", ["part", "15", "16"], [{ cells: ["prompt", "v7", "v8"], hot: true }, ["model", "5.5", "5.5"], ["temperature", "0.2", "0.2"], { cells: ["max tokens", "400", "520"], hot: true }, ["region", "EU", "EU"]]),

      raise(cells("tok-a", 0, 0, 4, [54, 30], ["Return", "within", "30", "days"], { title: "Model 4.5", sub: "4 tokens", group: "tok-a" }), [505, 150], 26),
      raise(cells("tok-b", 0, 0, 5, [54, 30], ["Return", { t: "with", hot: true }, { t: "in", hot: true }, "30", "days"], { title: "Model 5.5", sub: "5 tokens", group: "tok-b" }), [798, 212], 40),
      call("call", "One call", ["tokens", "4.5", "5.5"], [{ cells: ["prompt", "1,840", "2,390"], hot: true }, ["context limit", "200k", "1M"], ["reply limit", "400", "400"]]),

      net("net-a", "Model 4.5 weights", BL, 14, [[0, 1], [1, 0], [2, 1], [3, 0]]),
      net("net-b", "Model 5.5 weights", TR, 30, [[0, 1], [1, 2], [2, 3], [3, 1]]),
      raise(table("next", 0, 0, 216, ["next token", "4.5", "5.5"], [{ cells: ["refund", "0.81", "0.52"], hot: true }, ["credit", "0.12", "0.41"], ["sorry", "0.07", "0.07"]], { at: [12, 116, 166], title: "Next token", mono: true, rowH: 22, group: "next" }), TC, 20),

      evalSet("eval0", [], "paper"),
      evalSet("eval1", [36, 72], "mint"),
      evalSet("eval2", [], "mint"),
      raise(list("set", 0, 0, 230, [{ t: "100 graded refund requests", hot: true }, "3 trials for each case", "graded on the refund made"], { title: "Offline evaluation", group: "set" }), TR, 24),
      call("cost-a", "Per answer", ["measured", "14", "15"], [["cost", "0.004", "0.003"], ["latency", "2.1 s", "1.6 s"], ["cases passed", "100", "to run"]]),

      prism("router", 4.4, -0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "split", title: "Router", at: "s", group: "canary" }),
      line("canary", [G.p(5, -0.6), G.p(5, -5), G.p(10.4, -5)], { group: "canary" }),
      line("out", [G.p(11.6, -5), G.p(16.5, -5), G.p(16.5, 0)], { group: "canary" }),
      drum("traces", 19.6, 0, 1, 30, { hue: "sky", glyph: "eye", title: "Traces", sub: "by release", at: "e", group: "canary" }),
      line("own", [G.p(5, 3), G.p(5, 0.6)], { w: 3, group: "canary" }),
      pawn("owner", 5, 3.6, "Release owner", undefined, { group: "canary" }),
      pill("back", [424, 482], "rollback: release 14", { glyph: "replay", tone: "track", anchor: "start", group: "canary" }),
      raise(list("rollout", 0, 0, 230, [{ t: "5% of requests to release 15", hot: true }, "95% stay on release 14", "above 3% wrong: roll back"], { title: "Canary", group: "rollout" }), TR, 24),
      raise(plot("p-can", 0, 0, 220, 110, [0, 26], [0, 8], { title: "Wrong answers", sub: "by release", xt: [0, 12, 24], xtl: ["0 h", "12 h", "24 h"], yt: [0, 3, 8], ytl: ["0%", "3%", "8%"], grid: true, group: "watch" }), BL, 14),
      rule("c-limit", "p-can", 3, { axis: "y", label: "roll back", group: "watch" }),
      series("c-ctl", "p-can", "line", [[0, 2.1], [6, 2.3], [12, 2.0], [18, 2.2], [24, 2.1]], { tone: "ink", w: 2, dashed: true, group: "held" }),
      series("c-can", "p-can", "line", [[0, 1.5], [6, 2.4], [12, 1.7], [18, 2.0], [24, 1.9]], { tone: "track", group: "held" }),

      raise(doc("prompt7", 0, 0, 216, 94, "Prompt v7", ["You answer refund requests", "Answer from the policy", "Refund up to 200"], { group: "prompt7" }), BL, 14),
      raise(doc("prompt8", 0, 0, 216, 108, "Prompt v8", ["You answer refund requests", "Answer from the policy", "Refund up to 200", "Refund to the card, never credit"], { tone: "track", group: "prompt8" }), BL, 14),

      // Execution.
      raise(list("fails", 0, 0, 230, [{ t: "98 of 100 cases pass", hot: true }, { t: "reply cut at 400 tokens", hot: true, tone: "alert" }, { t: "store credit, not a refund", hot: true, tone: "alert" }], { title: "Release 15, evaluated", group: "fails" }), TR, 24),
      call("cut", "The cut reply", ["tokens", "4.5", "5.5"], [{ cells: ["this reply", "310", "403"], hot: true }, ["reply limit", "400", "400"], ["prompt", "1,840", "2,390"]]),
      raise(list("pass", 0, 0, 216, [{ t: "100 of 100 cases pass", hot: true }, "in all 3 trials"], { title: "Release 16, evaluated", group: "pass" }), TC, 26),
      raise(list("record", 0, 0, 230, [{ t: "owner: Support lead", hot: true }, "evaluation: 100 of 100", "canary: 1.9% against 2.1%", "way back: release 14"], { title: "Change record", group: "record" }), TR, 24),
    ],
  },
  steps: [
    step({
      id: "notice", label: "Notice", kind: "problem", phase: "problem", title: "The provider retires the model in sixty days",
      caption: "The refund assistant calls one hosted model. The provider has deprecated it. After the retirement date, requests to that model fail.",
      show: ["old", "pre", "notice", "days"], counters: ["model 4.5, 60 days left", "none", "none", "none"],
      rides: [ride("m1", 0, 0.6, "refund 4471?"), ride("m2", 0, 0.5, "49.00")],
      body: ["A deprecated model still works and has a retirement date and a recommended replacement. Requests to a retired model fail. Anthropic gives at least 60 days' notice before retiring a publicly released model.",
        "The provider advises testing applications with the new model well before that date."],
      claims: ["training-lifecycle", "release-and-change-management-lifecycle"],
    }),
    step({
      id: "unplanned", label: "Last time", kind: "problem", phase: "problem", title: "The last model change went unseen for a week",
      caption: "The model was swapped in place for all traffic at once. Wrong answers rose from 2% to 9%, and customer complaints were the only alarm.",
      show: ["swap", "pre", "notice", "last"], counters: ["swapped in place", "none", "complaints", "100% at once"],
      rides: [ride("m1", 0, 0.6, "refund 4471?", { then: "no refund", tone: "alert" }), ride("l-last", 0, 0.62, "9% wrong", { tone: "alert" })],
      body: ["Different snapshots of a model within the same family can produce different results from the same prompt.",
        "User feedback is sparse and self-selected, and relying on users to catch issues has a cost to those users. Waiting until after shipping to evaluate is a listed anti-pattern.",
        { callout: { label: "The gap", text: "Nothing measured the change before customers met it, and there was nothing to go back to." } }],
      claims: ["release-and-change-management-snapshots", "observability-and-feedback-reactive", "evaluating-model-output-vibes"],
    }),
    step({
      id: "release", label: "One release", kind: "mechanism", phase: "architecture", title: "Prompt, model and settings ship as one release",
      caption: "Release 14 pins the prompt version, the model identifier, the sampling settings and the region. Release 15 changes one line: the model.",
      show: ["r14", "pre", "stage", "same", "c15", "rel-a", "prompt7"], counters: ["release 14", "release 15, untested", "none", "0%"],
      rides: [ride("m1", 0, 0.6, "refund 4471?"), ride("m2", 0, 0.5, "49.00")],
      concepts: ["release-and-change-management", "prompting", "generation-and-sampling", "model-serving"],
      body: ["A model identifier names a pinned version: the weights behind it do not change, and an updated model ships under a new identifier. Prompts kept in application code get review, tests and the normal deployment process.",
        "Temperature reshapes the next-token probabilities and a maximum caps the length of the output. Both change what the same model returns, so they are part of the release.",
        "Where inference runs is a serving choice with data residency consequences. NIST suggests that an inventory entry for a generative system records the underlying model and its version."],
      claims: ["release-and-change-management-pinned-id", "prompting-versioning", "prompting-testing", "generation-and-sampling-settings", "generation-and-sampling-limits", "model-serving-residency", "release-and-change-management-inventory"],
    }),
    step({
      id: "tokens", label: "Tokens", kind: "mechanism", phase: "architecture", title: "The new model counts the same prompt differently",
      caption: "Each model has its own tokeniser. The same prompt is 1,840 tokens in one and 2,390 in the other, against a larger context limit and an unchanged reply limit.",
      show: ["r14", "pre", "stage", "same", "c15", "tok-a", "tok-b", "call"], counters: ["release 14", "release 15, more tokens", "none", "0%"],
      rides: [ride("m1", 0, 0.6, "1,840 tokens"), ride("stage", 0, 0.6, "2,390 tokens")],
      concepts: ["tokens", "the-context-window"],
      body: ["Text is encoded into tokens before the model sees it. Anthropic states that its newer tokeniser produces approximately 30 percent more tokens for the same text than earlier models, and a token count is made under the tokeniser of the model named in the request.",
        "Everything in the request counts toward the context window, and so does the output. Context limits differ between models. A response that reaches the max_tokens limit of the request ends there."],
      claims: ["tokens-encoded", "tokens-count-varies", "tokens-counting", "the-context-window-contents", "the-context-window-limit", "tokens-max-output"],
    }),
    step({
      id: "weights", label: "Weights", kind: "mechanism", phase: "architecture", title: "New weights score the next token differently",
      caption: "Training fixed each model's weights. The same tokens pass through different attention layers, the next-token probabilities shift, and sampling at temperature 0.2 picks from a different distribution.",
      show: ["r14", "pre", "stage", "same", "c15", "net-a", "net-b", "next"], counters: ["release 14", "release 15, new weights", "none", "0%"],
      rides: [ride("m1", 0, 0.6, "refund 4471?", { then: "refund" }), ride("stage", 0, 0.6, "refund 4471?", { then: "credit" })],
      concepts: ["training", "attention-and-the-transformer", "language-models", "generation-and-sampling"],
      body: ["A model is pretrained and then post-trained, and it is applied without further weight updates. A transformer stacks attention and feed-forward sublayers, and attention applies weights computed from learned parameters.",
        "A softmax turns the final layer's output into next-token probabilities. A temperature below 1 skews sampling towards the likely tokens and does not remove the others.",
        "Attention weights are not a reliable explanation of why the answer changed. The difference is found by measuring outputs."],
      claims: ["release-and-change-management-pinned-id", "training-post-training", "training-no-updates-at-use", "attention-and-the-transformer-transformer-layers", "attention-and-the-transformer-attention-weights", "language-models-probabilities", "generation-and-sampling-settings", "attention-and-the-transformer-explanation"],
    }),
    step({
      id: "offline", label: "Evaluation", kind: "mechanism", phase: "architecture", title: "The candidate answers an evaluation set offline",
      caption: "One hundred graded refund requests run against release 15, three trials each. Graders check the refund that was made, and cost and latency are measured beside quality.",
      show: ["r14", "pre", "stage", "c15", "eval0", "set", "cost-a"], counters: ["release 14", "release 15, untested", "100 cases, 3 trials", "0%"],
      rides: [ride("stage", 0, 0.6, "100 cases")],
      concepts: ["evaluating-model-output", "evaluating-agents", "cost-latency-and-model-choice"],
      body: ["An evaluation gives the system an input and applies grading logic to its output. Automated evaluations run on each change and each model upgrade.",
        "The assistant acts through tools, so a trial is graded on its outcome: the final state of the refund system, whatever the reply claims. Output varies between runs, so each case is tried more than once, and pass^k is the chance that all k trials succeed.",
        "Anthropic advises deciding a model change with benchmark tests specific to the use case, on actual prompts and data, weighing performance against cost. Batch interfaces suit evaluation runs that need no immediate response."],
      claims: ["evaluating-model-output-eval", "evaluating-model-output-every-change", "evaluating-model-output-variable", "eval-terms", "eval-outcome-transcript", "eval-pass-k", "cost-latency-and-model-choice-test-switch", "cost-latency-and-model-choice-batch", "cost-latency-and-model-choice-latency"],
    }),
    step({
      id: "canary", label: "Canary", kind: "mechanism", phase: "architecture", title: "A canary takes a small share beside the current release",
      caption: "A router sends 5% of live requests to the candidate. Traces record every answer by release, an owner holds the decision, and release 14 stays one switch away.",
      show: ["r14", "stage", "c15", "eval0", "canary", "rollout", "watch"], counters: ["release 14", "release 15, untested", "100 cases, 3 trials", "5% once the set passes"],
      rides: [ride("m1", 0.4, 0.72, "95%"), ride("canary", 0, 0.68, "5%")],
      concepts: ["release-and-change-management", "model-serving", "observability-and-feedback", "ai-risk-management"],
      body: ["Canarying is a partial and time-limited deployment of a change and its evaluation. The part that receives the change is the canary and the rest is the control. An error rate too far from the control's is the signal to pause and roll back.",
        "Both releases are served at once, and the earlier one is the fallback. NIST suggests policies to test and manage rollover and fallback technologies.",
        "A trace shows what happened when a request was made. Online evaluation scores a sample of production traces. NIST has roles and responsibilities for managing AI risk documented and clear."],
      claims: ["release-and-change-management-canary", "release-and-change-management-canary-rollback", "release-and-change-management-prompt-rollback", "model-serving-fallback", "observability-and-feedback-trace", "observability-and-feedback-online-eval", "ai-risk-management-roles"],
    }),
    step({
      id: "fails", label: "Two failures", kind: "watch-out", phase: "execution", title: "Release 15 fails two evaluation cases",
      caption: "One reply stops at the 400 token limit, because the new tokeniser spends more tokens on the same words. One offers store credit where the policy says refund. No live traffic moves.",
      show: ["r14", "stage", "c15", "eval1", "canary", "fails", "cut"], counters: ["release 14", "release 15, blocked", "98 of 100", "0%"],
      rides: [ride("stage", 0, 0.6, "100 cases", { then: "98 pass", tone: "alert" }), ride("m1", 0.4, 0.72, "100%")],
      concepts: ["evaluating-model-output", "evaluating-agents", "tokens", "generation-and-sampling"],
      body: ["A regression evaluation asks whether the system still handles the tasks it used to, and should pass nearly every case. A decline signals that something is broken.",
        "A response ends with the stop reason max_tokens when it reaches the limit set in the request. The limit was sized for the old tokeniser.",
        { callout: { label: "What held", text: "The failures appeared in the evaluation run. A build that misses its quality threshold does not go on." } }],
      claims: ["evaluating-model-output-regression", "eval-outcome-transcript", "tokens-max-output", "tokens-count-varies", "generation-and-sampling-limits", "release-and-change-management-ci-gate"],
    }),
    step({
      id: "repair", label: "Repair", kind: "mechanism", phase: "execution", title: "A repaired prompt passes every case",
      caption: "Release 16 states the refund rule explicitly and raises the reply limit to 520. All 100 cases pass in all three trials.",
      show: ["r14", "stage", "c16", "eval2", "canary", "rel-b", "pass", "prompt8"], counters: ["release 14", "release 16", "100 of 100", "cleared for 5%"],
      rides: [ride("stage", 0, 0.6, "100 cases", { then: "100 pass" }), ride("own", 0, 0.4, "5%?", { then: "yes" })],
      concepts: ["prompting", "evaluating-agents", "release-and-change-management"],
      body: ["Different models may need to be prompted differently. Clear, explicit instructions about the output wanted are the documented remedy.",
        "Regression suites sit near a 100% pass rate. The two failed cases stay in the set."],
      claims: ["prompting-instructions", "release-and-change-management-snapshots", "eval-capability-regression", "eval-pass-k"],
    }),
    step({
      id: "promote", label: "Promote", kind: "decision", phase: "execution", title: "The canary holds and release 16 is promoted",
      caption: "",
      show: ["kept", "stage", "c16", "eval2", "canary", "record", "watch", "held"], counters: ["release 16", "none", "100 of 100", "100%"],
      rides: [ride("c-can", 0, 0.6, "1.9%"), ride("own", 0, 0.4, "promote?", { then: "yes" }), ride("canary", 0, 0.68, "100%")],
      concepts: ["observability-and-feedback", "release-and-change-management", "ai-risk-management", "model-serving"],
      body: [{ pair: {
        left: { label: "Recorded", items: ["Evaluation: 100 of 100", "Canary within the threshold", "The owner's approval"] },
        right: { label: "Kept", items: ["Release 14, one switch away", "Traces by release", "Failed cases as tests"] },
      } },
        "The canary process builds confidence as a change is exposed to more and more traffic. NIST suggests minimum performance thresholds reviewed as part of go or no-go deployment approval, with test results shared with whoever holds release authority.",
        "Production monitoring continues after launch to catch what the evaluation set missed, and reported failures become test cases."],
      claims: ["release-and-change-management-canary-rollback", "release-and-change-management-go-no-go", "release-and-change-management-nist-change", "ai-risk-management-roles", "evaluating-model-output-nist-manage", "model-serving-fallback", "observability-and-feedback-drift", "observability-and-feedback-loop"],
    }),
  ],
  governance: { text: "A model change is a change to a controlled system. It has an owner, a recorded evaluation against set thresholds, and a way back.", claims: ["release-and-change-management-nist-change", "release-and-change-management-go-no-go", "ai-risk-management-roles", "evaluating-model-output-nist-measure"] },
  closing: {
    pitfalls: [
      "Changing the model identifier in place for all traffic at once.",
      "Keeping a reply limit that was sized for the old tokeniser.",
      "Deleting the previous release on the day of promotion.",
    ],
    questions: [
      "Which parts of a release can change what the assistant answers?",
      "Why did the same reply fit under the limit in one model and not the other?",
      "What would the canary have had to show for release 16 to be rolled back?",
    ],
  },
});
