import { CANVAS, defineGuide, doc, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Row } from "@signal-path/engine";

// The floor: three models stand at the back left, each at the head of its own lane into use.
// The model inventory stands behind the lanes and is the object that changes: it gains owners, then tiers, then review dates.
// The controls are built on the lanes in proportion to the tier: none on the forecast, a validation block across the
// two higher lanes, and human oversight and a review loop on the pay-later lane.
const G = isoGrid(410, 120, 30);
const LANES = [0, 3.8, 7.6];
const AT = { start: 1.2, listed: 4, join: 5.2, gate: 6.9, eye: 10.3, rest: 13, end: 14, loop: 10.2 };
const NAMES = ["Demand forecast", "Fraud model", "Pay-later score"];
const SHORT = ["forecast", "fraud model", "pay-later"];
const ENDS = ["Stock orders", "Order holds", "Pay-later offers"];
const OWNERS = ["Operations", "Finance", "Finance"];
const TIERS = ["low", "medium", "high"];
const HEIGHT = [16, 28, 42];
const HUES: Hue[] = ["sky", "sand", "violet"];

const inventory = (id: string, sub: string, cols: [string[], string[], string[]], extra: { foot?: string; alert?: boolean; hot?: number } = {}): El =>
  raise(table(id, 0, 0, 320, ["model", "owner", "tier", "review"],
    SHORT.map((m, i): Row => ({ cells: [m, cols[0][i], cols[1][i], cols[2][i]], hot: extra.hot === i })),
    { at: [12, 104, 192, 246], rowH: 26, title: "Model inventory", sub, foot: extra.foot, tone: extra.alert ? "alert" : undefined, group: id }), [792, 236], 34);
const NONE = ["?", "?", "?"];

const lanes: El[] = LANES.flatMap((gy, i): El[] => [
  line(`l${i}`, [G.p(0, gy), G.p(AT.end, gy)], { always: true }),
  stop(`a${i}`, ...G.p(AT.start, gy), undefined, undefined, { always: true }),
  stop(`n${i}`, ...G.p(AT.listed, gy), undefined, undefined, { always: true }),
  stop(`u${i}`, ...G.p(AT.rest, gy), undefined, undefined, { always: true }),
  stop(`e${i}`, ...G.p(AT.end, gy), ENDS[i], undefined, { state: "end", at: "e", always: true }),
  prism(`m${i}-plain`, -1.2, gy - 0.6, 1.2, 1.2, 26, { hue: "paper", glyph: "net", title: NAMES[i], at: "n", group: "plain" }),
  prism(`m${i}-tier`, -1.2, gy - 0.6, 1.2, 1.2, HEIGHT[i], { hue: HUES[i], glyph: "net", title: NAMES[i], sub: `tier: ${TIERS[i]}`, at: "n", group: "tiers" }),
]);

export default defineGuide({
  id: "model-risk-management", track: "ml", module: "Production", slug: "model-risk-management",
  title: "Model risk management",
  summary: "Every model in use has a named owner, a documented purpose and a row in an inventory. Independent validation, review frequency and human oversight are scaled to the harm a wrong output could cause.",
  forLeads: "Ask for the inventory first: one row per model with an owner, a purpose, a tier and a review date. The effort then goes where the tier is highest, and a new use of a model counts as a new model.",
  status: "draft", minutes: 7,
  counters: ["Owner and purpose", "Tiered", "Validated", "Review dated"],
  whatIf: { label: "What if no inventory was kept?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Models, owners, tiers, versions and review intervals are illustrative",
    label: "Three models stand at the head of three lanes that lead into use: a demand forecast, a fraud model and a pay-later score. A model inventory stands behind the lanes. First its rows are empty and a pay-later decision reaches a customer unchecked. Then each model gets an owner and a model card, then a tier shown by the height of its block. A validation block is built across the fraud and pay-later lanes, and the pay-later lane also gets human oversight. A review loop returns the pay-later score to validation when its use changes or its review date arrives.",
    els: [
      ...lanes,

      // the inventory
      inventory("t0", "none kept", [NONE, NONE, NONE], { alert: true }),
      inventory("t1", "3 models in use", [OWNERS, NONE, NONE]),
      inventory("t2", "3 models in use", [OWNERS, TIERS, NONE]),
      inventory("t3", "3 models in use", [OWNERS, TIERS, ["2 years", "1 year", "now"]], { hot: 2 }),
      inventory("t4", "3 models in use", [OWNERS, TIERS, ["2 years", "1 year", "6 months"]], { foot: "pay-later: next review 1 June" }),

      // the documented purpose
      raise(doc("card", 0, 0, 204, 128, "Model card", ["Pay-later score v2", "for: pay-later offers", "not for: card limits", "tested: by age group"], { group: "card" }), [140, 504], 30),
      pill("p-eu", [92, 270], "EU AI Act", { glyph: "scale", sub: "credit score: high-risk", to: [150, 240], group: "p-eu" }),

      // controls in proportion to the tier
      prism("gate1", AT.gate - 0.6, LANES[1] - 0.6, 1.2, 1.2, 30, { hue: "track", glyph: "check", title: "Validation", sub: "independent", at: "n", group: "gate" }),
      prism("gate2", AT.gate - 0.6, LANES[2] - 0.6, 1.2, 1.2, 30, { hue: "track", glyph: "check", group: "gate" }),
      ...[1, 2].map((i) => stop(`g${i}`, ...G.p(AT.gate, LANES[i]), undefined, undefined, { group: "gate" })),
      prism("eye", AT.eye - 0.6, LANES[2] - 0.6, 1.2, 1.2, 22, { hue: "violet", glyph: "eye", title: "Human oversight", at: "n", group: "gate" }),
      stop("g-eye", ...G.p(AT.eye, LANES[2]), undefined, undefined, { group: "gate" }),

      // the review loop: from use back to the lane ahead of validation
      line("back", [G.p(AT.rest, LANES[2]), G.p(AT.rest, AT.loop), G.p(AT.join, AT.loop), G.p(AT.join, LANES[2])], { group: "review" }),
      stop("b-out", ...G.p(AT.rest, 8.6), undefined, undefined, { group: "review" }),
      stop("b-mid", ...G.p(10.4, AT.loop), "Review", "date by tier", { at: "s", group: "review" }),
      stop("b-in", ...G.p(AT.join, 9.3), undefined, undefined, { group: "review" }),

      pill("p-nist", [800, 478], "NIST AI RMF", { glyph: "list", sub: "inventory, roles", group: "p-nist" }),
      pill("p-chal", [800, 478], "Effective challenge", { glyph: "search", sub: "expert, independent", group: "p-chal" }),
      pill("p-use", [800, 478], "New use", { glyph: "flag", sub: "store card limits", tone: "alert", group: "p-use" }),
    ],
  },
  steps: [
    step({
      id: "unowned", label: "No owner", kind: "problem", title: "Three models decide and nobody owns them",
      caption: "The pay-later score refuses order 4490. Vinterhus cannot say who owns the model, what it was built for, or who checked it.",
      show: ["plain", "t0"], counters: ["0 of 3", "0 of 3", "0", "0"],
      rides: [ride("l2", "a2", "u2", "pay-later v2", { tone: "alert", then: "4490 refused" })],
      body: ["A model that passed its tests is still a risk to the organisation that relies on it. US banking guidance uses the term model risk for the potential for adverse consequences from decisions made based on model output, and notes that even a fundamentally sound model producing accurate outputs can exhibit high model risk if it is misapplied or misused.",
        "Fairness metrics, explanations and drift monitors each answer one question about one model. None of them says which models exist, who answers for each, or which deserves the most scrutiny."],
      claims: ["model-risk-management-risk"],
    }),
    step({
      id: "inventory", label: "Inventory", kind: "idea", title: "An inventory names each model, its owner and its purpose",
      caption: "Every model in use gets a row and an accountable owner. A model card records the intended use and the limits.",
      show: ["plain", "t1", "card", "p-nist"], counters: ["3 of 3", "0 of 3", "0", "0"],
      rides: [ride("l0", "a0", "n0", "forecast", { then: "Operations" }), ride("l1", "a1", "n1", "fraud model", { then: "Finance" }), ride("l2", "a2", "n2", "pay-later", { then: "Finance" })],
      body: ["A model inventory holds a comprehensive set of information for models under development or in use, enough to understand model risks one model at a time and in aggregate. The NIST AI Risk Management Framework asks for the same: mechanisms to inventory AI systems, documented roles and responsibilities, and documented intended purposes.",
        "Ownership is named, not implied. Sound governance delineates the individuals responsible for key activities across the model lifecycle, from development through validation and ongoing monitoring.",
        "Model cards, proposed by Mitchell et al., are short documents that accompany a trained model. They disclose the context in which the model is intended to be used and give benchmarked evaluation in a variety of conditions, such as across demographic groups. The stated aim is to clarify intended use cases and minimise use in contexts for which a model is not well suited.",
        { callout: { label: "Status", text: "The NIST framework is intended for voluntary use. It was released on 26 January 2023, and NIST states that version 1.0 is being revised." } }],
      claims: ["model-risk-management-inventory", "model-risk-management-nist-inventory", "model-risk-management-roles", "model-risk-management-model-cards", "model-risk-management-nist-status"],
    }),
    step({
      id: "tier", label: "Tier", kind: "mechanism", title: "The tier follows the harm a model could cause",
      caption: "A wrong forecast overstocks a sofa. A wrong pay-later score refuses a customer credit, a use the EU AI Act lists as high-risk.",
      show: ["tiers", "t2", "card", "p-eu"], counters: ["3 of 3", "3 of 3", "0", "0"],
      rides: [ride("l2", "a2", "n2", "pay-later", { then: "tier: high" })],
      body: ["US banking guidance derives the tier from materiality: the purpose of a model together with its exposure, meaning the significance of its output to business decisions. Models of higher materiality warrant more comprehensive and rigorous oversight. For a model deemed immaterial, risk management may consist of identifying it and monitoring its performance and the conditions under which its use may become material.",
        "The EU AI Act sets the tier in law for some uses. Annex III lists AI systems intended to evaluate the creditworthiness of natural persons or establish their credit score as high-risk, with the exception of systems used to detect financial fraud. A listed system that performs profiling of natural persons is always high-risk.",
        { callout: { label: "Dated", text: "As amended by Regulation (EU) 2026/1744, the high-risk rules apply from 2 December 2027 for Annex III systems and from 2 August 2028 for systems under Annex I." } }],
      claims: ["model-risk-management-materiality", "model-risk-management-eu-high-risk", "model-risk-management-eu-dates"],
    }),
    step({
      id: "validate", label: "Validation", kind: "mechanism", title: "Independent validation scales with the tier",
      caption: "Reviewers who did not build the model test the fraud model and the pay-later score before first use. The pay-later score also gets human oversight. The forecast is monitored.",
      show: ["tiers", "t2", "card", "gate", "p-chal"], counters: ["3 of 3", "3 of 3", "2 independently", "0"],
      rides: [ride("l1", "a1", "u1", "fraud v5", { via: ["g1"], then: "validated" }), ride("l2", "a2", "u2", "pay-later v2", { via: ["g2", "g-eye"], then: "validated" })],
      body: ["Validation evaluates whether a model performs as expected and assesses its reliability and its limitations. Its nature and rigour generally align with the model's approach, use and materiality, and it generally occurs prior to a model's first use.",
        "Independence is a property of the reviewer. Effective challenge is critical analysis by objective experts with the appropriate expertise, sufficient independence to maintain objectivity, and the organisational standing and influence to effect change. The NIST framework has internal experts who did not serve as front-line developers, or independent assessors, involved in regular assessments.",
        "For a high-risk system the EU AI Act adds people to the lane. The system is designed so that natural persons can effectively oversee it while it is in use, and the deployer assigns that oversight to people with the necessary competence, training and authority.",
        { callout: { label: "Current guidance", text: "SR 26-2 of 17 April 2026 supersedes SR 11-7, the 2011 guidance on model risk management. The new guidance sets no enforceable standards, and it excludes generative and agentic AI models from its scope." } }],
      claims: ["model-risk-management-validation", "model-risk-management-challenge", "model-risk-management-nist-independent", "model-risk-management-eu-oversight", "model-risk-management-superseded", "model-risk-management-scope"],
    }),
    step({
      id: "review", label: "New use", kind: "watch-out", title: "A validation covers one use and one period",
      caption: "Finance wants the pay-later score to set store card limits. That use was never validated. A new use, like the review date, sends the model back.",
      show: ["tiers", "t3", "card", "gate", "review", "p-use"], counters: ["3 of 3", "3 of 3", "2, one out of date", "3 of 3"],
      rides: [ride("back", "b-out", "b-in", "card limits", { tone: "alert", via: ["b-mid"], then: "revalidate" })],
      body: ["Using a model beyond its intended purpose introduces additional uncertainty and risk. When a use is extended beyond the original application, sound practice involves additional analysis of the new usage and its limitations, along with review of existing controls.",
        "Time has the same effect as a new use. Ongoing monitoring evaluates whether a model still performs as expected given changes in products, clients, data relevance or market conditions. The timing and frequency of validation vary with the model's purpose and with the frequency and scope of model changes, and the frequency of monitoring reports depends on materiality. The NIST framework has the frequency of periodic review determined in advance.",
        { callout: { label: "In law", text: "The EU AI Act requires the technical documentation of a high-risk system, which includes its intended purpose and its post-market monitoring plan, to be kept up to date." } }],
      claims: ["model-risk-management-purpose", "model-risk-management-review", "model-risk-management-nist-independent", "model-risk-management-eu-documentation"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What every model has and what scales with harm",
      caption: "",
      show: ["tiers", "t4", "card", "gate", "review"], counters: ["3 of 3", "3 of 3", "2 independently", "3, by tier"],
      rides: [ride("l0", "a0", "u0", "forecast v9", { then: "monitored" }), ride("l2", "a2", "u2", "pay-later v3", { via: ["g2", "g-eye"], then: "validated" })],
      body: [{ pair: {
        left: { label: "Every model", items: ["A named owner", "A documented purpose", "An inventory row"] },
        right: { label: "Scaled to harm", items: ["Validation depth", "Review frequency", "Human oversight"] },
      } },
        "The first list is the same for a forecast and a credit score. The second is where effort is spent: more comprehensive and rigorous oversight for models of higher materiality, and identification and monitoring for the rest.",
        "For a high-risk system the EU AI Act fixes part of the second list: technical documentation drawn up before the system is put into service, registration in the EU database, and a documented post-market monitoring system proportionate to the risks."],
      claims: ["model-risk-management-materiality", "model-risk-management-roles", "model-risk-management-eu-documentation"],
    }),
  ],
  governance: { text: "Accountability follows the model through its life: US banking guidance has the individuals responsible for development, validation and ongoing monitoring named, and the NIST AI Risk Management Framework has AI systems inventoried with documented roles. For high-risk systems the EU AI Act requires technical documentation kept up to date and human oversight assigned to people with competence, training and authority.", claims: ["model-risk-management-roles", "model-risk-management-nist-inventory", "model-risk-management-eu-documentation", "model-risk-management-eu-oversight"] },
  closing: {
    pitfalls: [
      "Listing only the models the data team built, and missing vendor models and scores inside spreadsheets and tools.",
      "Giving every model the same review, so the high tier gets too little and the low tier too much.",
      "Reusing a validated model for a new decision without treating the new use as unvalidated.",
    ],
    questions: [
      "Which models are in use today, and who is the named owner of each?",
      "What sets the tier of a model, and which of your models would the EU AI Act class as high-risk?",
      "Who validates a model, and how are they independent of the people who built it?",
    ],
  },
});
