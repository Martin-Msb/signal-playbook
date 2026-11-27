import { blocks, CANVAS, defineGuide, doc, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { BlocksEl, El, Hue, Item, Pt, Row } from "@signal-path/engine";

// The floor: a V of rail with the refund assistant at its foot. A release enters at the top left as a
// card that pins prompt, model and tools, passes the CI gate and the approval on the left arm, and
// reaches production at the foot. A spur carries the release evidence to a card on file. Twenty chats
// stand beside the right arm and take the colour of the release that serves them: sand for 41, the track colour for 42,
// mint for 43. The card at the end of the right arm compares the canary with the control.
const G = isoGrid(470, 440, 30);
const K = "release-and-change-management";
const IN = 11, GATE = 7.4, APPROVE = 3.5, FILE = 5.5, END = 11;
const START: Pt = G.p(-IN, 0), CHECK: Pt = G.p(0, -END), FILED: Pt = G.p(-APPROVE, -FILE);

/** The release card at the start of the rail. The changed part is lit. */
const release = (n: number, rows: Row[]): El =>
  raise(table(`m${n}`, 0, 0, 262, ["part", "pinned version"], rows, { at: [12, 76], rowH: 24, mono: true, title: `Release ${n}`, sub: "one unit of change", group: `m${n}` }), START, 34);
/** The evidence filed for a release. */
const evidence = (n: number, change: string): El =>
  raise(list(`ev${n}`, 0, 0, 216, ["eval      20 of 20", `change    ${change}`, { t: "approved  owner", hot: true }], { title: "Release evidence", sub: `release ${n}`, mono: true, group: `ev${n}` }), FILED, 40);
/** The canary compared with the control. */
const check = (id: string, canary: Item): El =>
  raise(list(id, 0, 0, 210, ["control 41    4%", canary], { title: "Escalated chats", sub: "live traffic", mono: true, group: id }), CHECK, 44);
/** Twenty chats beside the right arm, coloured by the release that serves them. */
const chats = (id: string, sub: string, hue: (i: number) => Hue | "alert") => {
  const items: BlocksEl["items"] = Array.from({ length: 20 }, (_, i) => { const h = hue(i); return h === "alert" ? { h: 14, state: "alert" as const } : { h: 14, hue: h }; });
  return blocks(id, 0.8, -10.6, 10, 0.55, items, { gap: 0.1, dir: "gy", title: "20 chats", sub, at: "s", group: id });
};
const assistant = (id: string, sub: string): El =>
  prism(id, -0.7, -0.7, 1.4, 1.4, 34, { hue: "violet", glyph: "net", title: "Refund assistant", sub, at: "s", group: id });

export default defineGuide({
  id: K, track: "ai", module: "Production", slug: K,
  title: "Release and change management",
  summary: "A prompt, a model ID and a set of tool definitions decide together how an assistant behaves. A release pins all three, passes an eval gate and an approval, reaches a small share of traffic first, and can be rolled back to the release before it.",
  forLeads: "A change to a prompt or a model is a production change. The control is a recorded approval with the eval results behind it, and a tested way back that still works on the day it is needed.",
  status: "draft", minutes: 7,
  counters: ["Production runs", "Eval gate", "New release serves", "Rollback target"],
  whatIf: { label: "What if the edit went straight to production?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Release numbers, scores and escalation rates are illustrative",
    label: "A rail runs from a change at the top left down to the refund assistant and up past twenty chats to a canary check. At first a prompt edit travels straight to production and six chats turn red. Then a release card pins prompt, model and tools. A CI gate and a release owner stand on the rail, and a spur carries the release evidence to a card on file. One chat in twenty is served by the new release as a canary. Its escalation rate rises and the release travels back up the rail. At the last stop a retirement notice points at the model, and a release with the replacement model passes the same gate.",
    els: [
      line("main", [START, G.p(0, 0), CHECK], { always: true }),
      stop("s-start", ...START, undefined, undefined, { always: true }),
      stop("s-gate", ...G.p(-GATE, 0), undefined, undefined, { always: true }),
      stop("s-approve", ...G.p(-APPROVE, 0), undefined, undefined, { always: true }),
      stop("s-live", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("s-serve", ...G.p(0, -2.9), undefined, undefined, { always: true }),
      stop("s-end", ...CHECK, undefined, undefined, { always: true }),

      assistant("p-live", "prompt edited in place"),
      assistant("p-41", "runs release 41"),
      assistant("p-canary", "41, and 42 as canary"),
      assistant("p-43", "runs release 43"),

      raise(doc("edit", 0, 0, 200, 96, "Prompt, live", ["Refund within 30 days", "+ and be generous"], { group: "live" }), START, 34),
      pawn("editor", -8.6, 2.2, "Support lead", "Edited it live", { side: "w", group: "live" }),

      release(41, [["prompt", "v7"], ["model", "claude-opus-4-5-20251101"], ["tools", "refund_lookup v3"]]),
      release(42, [{ cells: ["prompt", "v8"], hot: true }, ["model", "claude-opus-4-5-20251101"], ["tools", "refund_lookup v3"]]),
      release(43, [["prompt", "v7"], { cells: ["model", "claude-opus-5-5"], hot: true }, ["tools", "refund_lookup v3"]]),

      prism("gate", -GATE - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "check", title: "CI gate", sub: "regression suite", at: "sw", group: "gate" }),
      pawn("owner", -APPROVE + 0.3, 2.5, "Release owner", undefined, { group: "gate" }),
      line("file", [G.p(-APPROVE, 0), FILED], { tone: "ink", w: 3, group: "gate" }),
      evidence(42, "prompt v8"),
      evidence(43, "model ID"),

      chats("c-bad", "6 wrong refunds", (i) => ([1, 4, 8, 11, 15, 18].includes(i) ? "alert" : "paper")),
      chats("c-41", "all on release 41", () => "sand"),
      chats("c-canary", "1 in 20 on release 42", (i) => (i === 14 ? "track" : "sand")),
      chats("c-43", "all on release 43", () => "mint"),

      check("k-run", { t: "canary 42     4%", hot: true }),
      check("k-bad", { t: "canary 42    12%", hot: true, tone: "alert" }),
      check("k-43", { t: "canary 43     4%", hot: true }),

      pill("retire", [300, 92], "Retirement notice", { glyph: "clock", sub: "opus-4-5: 22 Jan 2027", anchor: "start", to: [272, 206], group: "retire" }),
    ],
  },
  steps: [
    step({
      id: "live-edit", label: "Live edit", kind: "problem", title: "A prompt edited in place changes every chat at once",
      caption: "Support edits the refund assistant's prompt in production. Every chat gets the new behaviour, and no earlier version is on file to return to.",
      show: ["live", "p-live", "c-bad"], counters: ["an unversioned edit", "none", "100% at once", "none"],
      rides: [ride("main", "s-start", "s-serve", "prompt edit", { via: ["s-live"], then: "live, 100%" })],
      body: ["The prompt is one of three parts that set the assistant's behaviour. OpenAI states that different model types might need to be prompted differently, and that even different snapshots of models within the same family could produce different results.",
        "Tool definitions are the third part. Tool descriptions and specs are loaded into the agent's context and steer its tool-calling behaviour. Anthropic states that even small refinements to tool descriptions can yield dramatic improvements.",
        { callout: { label: "Key idea", text: "A change to the prompt, the model or the tools is a change to behaviour. Each one is a production change, whichever file it lives in." } }],
      claims: [`${K}-snapshots`, `${K}-tools`],
    }),
    step({
      id: "release", label: "Release", kind: "idea", title: "A release pins the prompt, the model and the tools",
      caption: "Release 41 records prompt v7, a dated model ID and the tool definitions. A change to any one of the three makes a new release.",
      show: ["m41", "p-41", "c-41"], counters: ["release 41", "none", "100% at once", "none yet"],
      rides: [ride("main", "s-start", "s-serve", "release 41", { via: ["s-live"], then: "pinned" })],
      body: ["Prompt versioning gives each prompt text a number. In Langfuse, version control and deployment of prompts is managed through versions and labels: a version is deployed by assigning it the production label.",
        "Model versioning is a matter of which ID the request names. Each Claude model ID identifies a pinned version, and the underlying model remains constant for the lifetime of that ID. For models before the 4.6 generation a shorter alias points to the most recent dated snapshot, so the release names the dated ID. OpenAI strongly recommends pinning production applications to specific model snapshots.",
        { callout: { label: "Watch out", text: "Pinning fixes the weights, not everything around them. Anthropic states that updates to the serving infrastructure occasionally produce minor differences in observable behaviour under an unchanged model ID." } },
        "The NIST Generative AI Profile suggests recording the underlying foundation models and their versions in the inventory entry of a generative AI system."],
      claims: [`${K}-prompt-versions`, `${K}-pinned-id`, `${K}-snapshots`, `${K}-infrastructure`, `${K}-inventory`],
    }),
    step({
      id: "gate", label: "Eval gate", kind: "mechanism", title: "Each change passes an eval gate and an approval",
      caption: "Release 42 changes the prompt. CI runs the regression suite, the release owner approves, and the results go on file as release evidence.",
      show: ["m42", "p-41", "c-41", "gate", "ev42"], counters: ["release 41", "20 of 20, approved", "0%, not yet live", "release 41"],
      rides: [ride("main", "s-start", "s-approve", "release 42", { via: ["s-gate"], then: "approved" }), ride("file", 0, 0.6, "evidence", { then: "on file" })],
      body: ["A regression gate in CI runs the eval suite on the change itself. Promptfoo documents the pattern: the eval runs on pull requests that change the prompt files, quality gates enforce minimum performance thresholds, and the build fails when they are not met.",
        "Approval is a separate step from the score. In GitHub Actions, required reviewers must approve a workflow job that references an environment before it proceeds, and a setting prevents the person who initiated the deployment from approving it.",
        { callout: { label: "Control", text: "The NIST Generative AI Profile suggests minimum thresholds reviewed as part of deployment approval (go/no-go), and sharing the results of pre-deployment testing with those who hold system release approval authority." } }],
      claims: [`${K}-ci-gate`, `${K}-reviewers`, `${K}-go-no-go`],
    }),
    step({
      id: "canary", label: "Staged rollout", kind: "mechanism", title: "A staged rollout exposes a small share of traffic first",
      caption: "Release 42 serves 1 chat in 20 as the canary. Release 41 serves the rest as the control, and the two are compared on live traffic.",
      show: ["m42", "p-canary", "c-canary", "gate", "ev42", "k-run"], counters: ["41, and 42 as canary", "20 of 20, approved", "5%", "release 41"],
      rides: [ride("main", "s-approve", "s-serve", "release 42", { via: ["s-live"], then: "5% canary" })],
      body: ["The Google Site Reliability Workbook defines canarying as a partial and time-limited deployment of a change in a service and its evaluation. The part that receives the change is the canary, and the remainder is the control.",
        "The canary process builds confidence in a change as it is exposed to larger and larger amounts of traffic. Canarying supplements testing: when defects are caught early, users are minimally impacted.",
        "For a prompt, the label is the switch. In Langfuse, labels assign prompt versions to environments, so the canary share and the stable share can each read their own label."],
      claims: [`${K}-canary`, `${K}-canary-rollback`, `${K}-prompt-versions`],
    }),
    step({
      id: "rollback", label: "Rollback", kind: "watch-out", title: "A release that passed the gate can still be rolled back",
      caption: "Escalations rise on the canary, which no eval case covered. Production returns to release 41, which is still pinned and intact.",
      show: ["m42", "p-41", "c-41", "gate", "ev42", "k-bad"], counters: ["release 41", "20 of 20, approved", "0%, rolled back", "release 41"],
      rides: [ride("main", "s-serve", "s-approve", "release 42", { via: ["s-live"], then: "rolled back", tone: "alert" })],
      body: ["In the Google Site Reliability Workbook, a canary error rate too far from the control's signals a bad canary deployment. The response is to pause and roll back the deployment, or to contact a human to help troubleshoot.",
        "Rollback is cheap when the previous release still exists. In Langfuse, a prompt is rolled back by setting the production label to a previous version. Labels can be protected so that only some roles can move them.",
        { callout: { label: "Close the loop", text: "The failing chats become eval cases, so the gate holds the next release that repeats the fault." } }],
      claims: [`${K}-canary-rollback`, `${K}-prompt-rollback`, `${K}-nist-change`],
    }),
    step({
      id: "retire", label: "Decide", kind: "decision", title: "A model retirement is a release with a deadline",
      caption: "",
      show: ["m43", "p-43", "c-43", "gate", "ev43", "k-43", "retire"], counters: ["release 43", "20 of 20, approved", "5%, then 100%", "41, until 22 Jan 2027"],
      rides: [ride("main", "s-start", "s-serve", "release 43", { via: ["s-gate", "s-approve", "s-live"], then: "100%" })],
      body: [{ pair: {
        left: { label: "Promote", items: ["Regression suite passes", "Approval on file", "Canary matches control"] },
        right: { label: "Roll back", items: ["Canary worse than control", "Previous release intact", "Its model not retired"] },
      } },
        "Anthropic regularly retires older models and gives at least 60 days' notice for publicly released ones. On November 23, 2026 it announced the retirement of claude-opus-4-5-20251101 on January 22, 2027, with claude-opus-5-5 as the recommended replacement.",
        "A deprecated model is still functional and has a retirement date. Requests to a retired model fail, so a release pinned to it stops being a rollback target on that date. Anthropic advises testing applications with the new model well before the retirement date, and exporting API usage by key and model to find what still calls the old one.",
        "OpenAI's lifecycle has the same shape: a deprecated model can be used until its shutdown date, after which it no longer accepts requests through the standard API.",
        { callout: { label: "Same path", text: "The replacement model ID is a new release. It passes the same regression gate, approval and staged rollout as a prompt change." } }],
      claims: [`${K}-notice`, `${K}-lifecycle`, `${K}-shutdown`, `${K}-canary-rollback`, `${K}-go-no-go`],
    }),
  ],
  governance: { text: "Change approval is the control. A release proceeds on a go or no-go decision made against set thresholds, with the pre-deployment test results shared with whoever holds release approval authority. The NIST AI Risk Management Framework places change management in the post-deployment monitoring plan, with assigned responsibility to supersede or deactivate a system that performs inconsistently with its intended use.", claims: [`${K}-go-no-go`, `${K}-nist-change`] },
  closing: {
    pitfalls: [
      "Editing a production prompt in place, with no earlier version to return to.",
      "Calling a model through an alias, so the snapshot changes without a release.",
      "Leaving a model migration until the retirement date, when the old release can no longer serve as the rollback.",
    ],
    questions: [
      "Which three parts does a release pin, and why together?",
      "What does a canary compare, and what happens when it is worse than the control?",
      "Why does a retirement date limit how long a release remains a rollback target?",
    ],
  },
});
