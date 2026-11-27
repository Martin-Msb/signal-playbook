import { CANVAS, defineGuide, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Row } from "@signal-path/engine";

// The floor: one loop of rail with the three working functions as blocks on it and Govern in the middle.
// The refund assistant runs on the loop, where the system is in use. The risk register stands behind the loop and is the object
// that changes: it gains risks, then a measured value per risk, then an owner per risk, then a new risk.
// The loop's points start at the front corner so that no ride crosses the place where the route closes.
const G = isoGrid(350, 150, 30);
const W = 11, D = 8;
const REG = G.p(12, -3.4);
const register = (id: string, sub: string, rows: Row[], extra: { foot?: string; alert?: boolean } = {}): El =>
  raise(table(id, 0, 0, 286, ["risk", "measured", "owner"], rows,
    { at: [12, 118, 198], rowH: 26, title: "Risk register", sub, foot: extra.foot, tone: extra.alert ? "alert" : undefined, group: id }), REG, 34);

const ATTACK = "prompt attack", WRONG = "wrong refund", LEAK = "email leak", TWICE = "double refund";

export default defineGuide({
  id: "ai-risk-management", track: "ai", module: "Production", slug: "ai-risk-management",
  title: "AI risk management",
  summary: "Risks of an AI system are identified, measured and given owners in a cycle that repeats for as long as the system runs. A register records the state of each risk.",
  forLeads: "A launch review is one lap. Fund the cycle: a register, a measurement per risk, an owner per risk, and a rule for what restarts it.",
  status: "draft", minutes: 7,
  counters: ["Risks listed", "Measured", "With an owner", "Reviews"],
  whatIf: { label: "What if the review happened once?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Risks, test results, owners and dates are illustrative",
    label: "A refund assistant runs beside a loop of rail. First it is reviewed once at launch, and a later double refund reaches nobody. Then the loop is built: Govern stands in the middle, and Map, Measure and Manage stand on the rail. A risk register behind the loop gains a list of risks, then a measured value for each, then an owner for each. An incident from the running assistant rides back to Map and becomes a new row, and the cycle runs again.",
    els: [
      // the one-off review, and the incident that reaches nobody
      line("unbuilt", [G.p(W, D), G.p(0, D), G.p(0, 0), G.p(W, 0)], { loop: true, state: "planned", group: "once" }),
      line("lost", [G.p(0, 4.7), G.p(0, 9.5)], { tone: "alert", group: "once" }),
      pill("p-none", G.p(W / 2, D / 2), "No cycle", { glyph: "x", sub: "nothing repeats", tone: "alert", group: "once" }),
      stop("nobody", ...G.p(0, 9.5), "No owner", "not recorded", { state: "end", at: "s", group: "once" }),

      // the cycle
      line("entry", [G.p(0, -5), G.p(0, 0)], { always: true }),
      line("loop", [G.p(W, D), G.p(0, D), G.p(0, 0), G.p(W, 0)], { loop: true, group: "cycle" }),
      stop("s-launch", ...G.p(0, -5), "Launch review", undefined, { at: "n", always: true }),
      stop("r-entry", ...G.p(0, -2), undefined, undefined, { always: true }),
      stop("r-run", ...G.p(0, 2.2), undefined, undefined, { group: "cycle" }),
      stop("r-map", ...G.p(8.8, 0), undefined, undefined, { group: "cycle" }),
      stop("r-measure", ...G.p(9.2, D), undefined, undefined, { group: "cycle" }),
      stop("r-manage", ...G.p(1.6, D), undefined, undefined, { group: "cycle" }),
      prism("assistant", -0.6, 3.4, 1.2, 1.2, 30, { hue: "sand", glyph: "net", title: "Refund assistant", sub: "in production", at: "n", always: true }),
      prism("govern", W / 2 - 0.7, D / 2 - 0.7, 1.4, 1.4, 40, { hue: "violet", glyph: "scale", title: "Govern", sub: "policy and roles", at: "e", group: "cycle" }),
      prism("map", W / 2 - 0.6, -0.6, 1.2, 1.2, 26, { hue: "track", glyph: "search", title: "Map", sub: "identify", at: "n", group: "cycle" }),
      prism("measure", W - 0.6, D / 2 - 0.6, 1.2, 1.2, 26, { hue: "track", glyph: "chart", title: "Measure", sub: "test, track", at: "e", group: "cycle" }),
      prism("manage", W / 2 - 0.6, D - 0.6, 1.2, 1.2, 26, { hue: "track", glyph: "wrench", title: "Manage", sub: "respond", at: "s", group: "cycle" }),

      // the register
      register("r0", "last review: launch", [[ATTACK, "at launch", "nobody"]], { alert: true }),
      register("r1", "lap 1", [[ATTACK, "?", "?"], [WRONG, "?", "?"], [LEAK, "?", "?"]]),
      register("r2", "lap 1", [{ cells: [ATTACK, "3 of 40", "?"], hot: true }, [WRONG, "2%", "?"], [LEAK, "0 of 200", "?"]]),
      register("r3", "lap 1", [[ATTACK, "3 of 40", "Operations"], [WRONG, "2%", "Support"], [LEAK, "0 of 200", "data team"]]),
      register("r4", "lap 2", [[ATTACK, "3 of 40", "Operations"], [WRONG, "2%", "Support"], [LEAK, "0 of 200", "data team"], { cells: [TWICE, "?", "?"], hot: true }]),
      register("r5", "lap 2", [[ATTACK, "0 of 40", "Operations"], [WRONG, "2%", "Support"], [LEAK, "0 of 200", "data team"], [TWICE, "0 of 500", "Finance"]], { foot: "next review: 1 March" }),

      pill("p-rmf", [800, 452], "NIST AI RMF", { glyph: "loop", sub: "four functions", group: "p-rmf" }),
      pill("p-red", [800, 452], "Red teaming", { glyph: "search", sub: "40 attack prompts", group: "p-red" }),
      pawn("owner", 3.6, 11.4, "Risk owner", undefined, { hue: "track", group: "owner" }),
      pill("p-resp", [800, 452], "Response", { glyph: "wrench", sub: "mitigate or accept", group: "owner" }),
      pill("p-inc", [800, 452], "Incident report", { glyph: "file", sub: "logged, investigated", tone: "alert", group: "p-inc" }),
      pill("p-iso", [800, 452], "ISO/IEC 42001", { glyph: "loop", sub: "management system", group: "p-iso" }),
    ],
  },
  steps: [
    step({
      id: "once", label: "One review", kind: "problem", title: "One review at launch is the only risk check",
      caption: "The refund assistant passed a review before launch. Months later it refunds order 4471 twice. That risk is in no register and has no owner.",
      show: ["once", "r0"], counters: ["1", "at launch", "0", "1, at launch"],
      rides: [ride("entry", "s-launch", "r-entry", "reviewed once"), ride("lost", 0, 0.6, "4471 paid twice", { tone: "alert" })],
      body: ["A review before launch judges the system as it was on that day. Prompts, models, tools, data and users change afterwards, and so do the risks.",
        "NIST states that AI risk management should be continuous, timely and performed throughout the AI system lifecycle. Its framework expects existing, unanticipated and emergent risks to be identified and tracked regularly, based on intended and actual performance in deployed contexts."],
      claims: ["ai-risk-management-continuous", "ai-risk-management-measure"],
    }),
    step({
      id: "cycle", label: "Cycle", kind: "idea", title: "Risk management runs as a cycle",
      caption: "Govern sets policy and roles. Map identifies the risks of the refund assistant in its setting and lists them in the register. Measure and Manage follow, then the cycle repeats.",
      show: ["cycle", "r1", "p-rmf"], counters: ["3", "0", "0", "lap 1"],
      rides: [ride("loop", "r-run", "r-map", "refund assistant", { then: "3 risks" })],
      body: ["The NIST AI Risk Management Framework organises the work into four functions: Govern, Map, Measure and Manage. Govern is cross-cutting and enables the other three. Most users start with Map and continue to Measure or Manage, and the process should be iterative.",
        "Map establishes the context to frame risks. Measure analyses, assesses, benchmarks and monitors them. Manage allocates resources to mapped and measured risks on a regular basis.",
        "For a system built on a language model, the Generative AI Profile, NIST AI 600-1, supplies the list to map against: 12 risks that are novel to or exacerbated by generative AI, among them confabulation, data privacy and information security, each with suggested actions under the four functions.",
        { callout: { label: "Status", text: "The framework is voluntary. NIST released AI RMF 1.0 on 26 January 2023 and states that it is being revised." } },
        "The EU AI Act describes the same shape in law for high-risk systems: a continuous iterative process planned and run throughout the entire lifecycle, requiring regular systematic review and updating."],
      claims: ["ai-risk-management-functions", "ai-risk-management-function-roles", "ai-risk-management-profile", "ai-risk-management-status", "ai-risk-management-continuous", "ai-risk-management-eu-system"],
    }),
    step({
      id: "measure", label: "Measure", kind: "mechanism", title: "Each listed risk is measured",
      caption: "Red teaming probes the assistant with attack prompts, and evaluations score wrong refunds and leaked emails. Each risk in the register gets a measured value, and the test is repeated.",
      show: ["cycle", "r2", "p-red"], counters: ["3", "3", "0", "lap 1"],
      rides: [ride("loop", "r-map", "r-measure", ATTACK, { then: "3 of 40 succeed" })],
      body: ["Metrics are selected for the risks enumerated during Map, starting with the most significant. Risks that will not or cannot be measured are documented as such, so a gap in the register is visible.",
        "NIST AI 600-1 describes AI red-teaming as a structured testing exercise used to probe an AI system to find flaws and vulnerabilities such as inaccurate, harmful or discriminatory outputs. It can be performed before or after a system is made available to the public.",
        { callout: { label: "In law", text: "For high-risk systems the EU AI Act requires testing against prior defined metrics and probabilistic thresholds appropriate to the intended purpose." } }],
      claims: ["ai-risk-management-measure", "ai-risk-management-red-teaming", "ai-risk-management-function-roles", "ai-risk-management-eu-testing"],
    }),
    step({
      id: "manage", label: "Owners", kind: "mechanism", title: "Each risk gets an owner and a response",
      caption: "Manage ranks the measured risks and assigns each to an owner, who mitigates, transfers, avoids or accepts it. The risk that remains is documented.",
      show: ["cycle", "r3", "owner"], counters: ["3", "3", "3", "lap 1"],
      rides: [ride("loop", "r-measure", "r-manage", ATTACK, { then: "Operations owns" })],
      body: ["Treatment is prioritised by impact, likelihood and available resources. NIST lists the response options as mitigating, transferring, avoiding or accepting, and has the negative residual risk, the sum of all unmitigated risks, documented.",
        "Ownership is a Govern outcome. Roles, responsibilities and lines of communication for mapping, measuring and managing AI risks are documented and clear to individuals and teams, and executive leadership takes responsibility for decisions about risk.",
        "For providers of high-risk systems the EU AI Act puts this in the quality management system: it includes the risk management system and an accountability framework setting out the responsibilities of the management and other staff. Residual risk must be judged acceptable.",
        { callout: { label: "Dated", text: "As amended by Regulation (EU) 2026/1744, these provisions apply from 2 December 2027 for high-risk systems under Annex III and from 2 August 2028 for those under Annex I." } }],
      claims: ["ai-risk-management-respond", "ai-risk-management-roles", "ai-risk-management-eu-accountability", "ai-risk-management-eu-testing", "ai-risk-management-eu-dates"],
    }),
    step({
      id: "incident", label: "Incident", kind: "watch-out", title: "An incident starts the next lap",
      caption: "Order 4471 is refunded twice. The incident is logged, communicated and investigated, and it enters the register as a new risk to measure and own.",
      show: ["cycle", "r4", "p-inc"], counters: ["4", "3", "3", "lap 2"],
      rides: [ride("loop", "r-run", "r-map", "4471 paid twice", { tone: "alert", then: "new risk" })],
      body: ["A register that only changes at scheduled reviews goes stale between them. NIST has incidents and errors communicated to relevant AI actors, including affected communities, with documented processes for tracking, responding and recovering, and procedures for a previously unknown risk when it is identified.",
        "The EU AI Act feeds the same loop for high-risk systems: risks are evaluated again from post-market monitoring data.",
        { callout: { label: "Reporting", text: "Providers of high-risk systems report a serious incident to the market surveillance authorities within 15 days of becoming aware of it, within 10 days after a death, and within two days for a widespread infringement or a serious disruption of critical infrastructure. An investigation with a risk assessment and corrective action follows." } }],
      claims: ["ai-risk-management-incidents", "ai-risk-management-eu-incident", "ai-risk-management-eu-system"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What keeps the cycle running",
      caption: "",
      show: ["cycle", "r5", "p-iso"], counters: ["4", "4", "4", "lap 2, next dated"],
      rides: [ride("loop", "r-map", "r-manage", TWICE, { via: ["r-measure"], then: "Finance owns" })],
      body: [{ pair: {
        left: { label: "Keep current", items: ["A register of risks", "A measure per risk", "An owner per risk"] },
        right: { label: "Run again when", items: ["An incident occurs", "The system changes", "The review date arrives"] },
      } },
        "ISO/IEC 42001:2023 turns the cycle into a management system: it specifies requirements for establishing, implementing, maintaining and continually improving an AI management system within an organisation.",
        "NIST has ongoing monitoring and periodic review of the risk management process planned in advance, including how often the review happens."],
      claims: ["ai-risk-management-iso", "ai-risk-management-roles", "ai-risk-management-continuous"],
    }),
  ],
  governance: { text: "Accountability is written down: NIST has roles and responsibilities for AI risk documented and executive leadership responsible for risk decisions. For high-risk systems the EU AI Act requires a documented risk management system and a report of a serious incident within 15 days.", claims: ["ai-risk-management-roles", "ai-risk-management-eu-system", "ai-risk-management-eu-incident"] },
  closing: {
    pitfalls: [
      "Treating the launch review as the risk assessment for the life of the system.",
      "Listing risks without a measurement or with a team inbox as owner.",
      "Handling an incident as a support ticket and never adding it to the register.",
    ],
    questions: [
      "Which risks of the refund assistant are in the register, and when was each last measured?",
      "Who owns each risk, and who accepts what remains after mitigation?",
      "What event restarts the cycle before the next scheduled review?",
    ],
  },
});
