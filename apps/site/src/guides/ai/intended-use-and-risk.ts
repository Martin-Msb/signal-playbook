import { CANVAS, defineGuide, isoGrid, line, list, note, pawn, pill, plot, plotPoint, prism, raise, ride, series, shade, slab, step, stop, table } from "@signal-path/engine";
import type { El, Hue, PlotEl } from "@signal-path/engine";

// The floor: the same model stands in four lanes, one per use at Vinterhus. Each lane runs from the model at the back
// to the people the use affects at the front. Colour is the use, on the floor and on the chart.
// The card behind the lanes is the object that changes: one review for every use, then the inventory, then the chart
// that places each use by likelihood and severity, then the control levels on that chart.
// Controls are blocks in the track colour that stand beside a lane rail, between the model and the people, where a record is held. They grow with the position.
const G = isoGrid(215, 95, 30), Z = 10;
const LANE = [1, 6.5, 12, 17.5];
const HUE: Hue[] = ["mint", "sky", "sand", "violet"];
const USE = ["Draft product text", "Answer a question", "Approve a refund", "Score for credit"];
const SHORT = ["product text", "answer", "refund", "credit"];
const WHO = ["Shopper", "Customer", "Customer", "Applicant"];
const HARM = ["odd wording", "wrong advice", "wrong payout", "credit refused"];
/** Where each use sits on the chart: likelihood of a wrong answer, severity of the harm. */
const AT: [number, number][] = [[2.7, 0.55], [2.6, 1.5], [2, 2.5], [2.2, 3.5]];
/** Where the answering use lands once it may also pay refunds. */
const MOVED: [number, number] = [2.9, 2.6];
const CONTROL = [
  undefined,
  { h: 14, glyph: "eye", title: "Sample review" },
  { h: 24, glyph: "user", title: "Human approval" },
  { h: 34, glyph: "file", title: "Full documentation" },
];
const RAIL = 2.3, OUT = 2.8, HOLD = 4.5, END = 5.8;
const STAND: [number, number] = [786, 306];

const lane = (k: number): El[] => {
  const x = LANE[k], c = CONTROL[k];
  return [
    slab(`lane${k}`, x, 1, 3, 6.8, undefined, { hue: HUE[k], always: true }),
    line(`r${k}`, [G.p(x + RAIL, 2.5, Z), G.p(x + RAIL, 6, Z)], { always: true }),
    stop(`out${k}`, ...G.p(x + RAIL, OUT, Z), undefined, undefined, { always: true }),
    stop(`hold${k}`, ...G.p(x + RAIL, HOLD, Z), undefined, undefined, { always: true }),
    stop(`end${k}`, ...G.p(x + RAIL, END, Z), undefined, undefined, { always: true }),
    prism(`model${k}`, x + 1.3, 1.2, 1.7, 1.3, 26, { hue: "paper", glyph: "net", title: USE[k], at: "e", z: Z, always: true }),
    ...(c ? [prism(`control${k}`, x + 0.3, 4.5, 1.1, 0.9, c.h, { hue: "track", glyph: c.glyph, title: c.title, at: "n", z: Z, group: "controls" })] : []),
    pawn(`who${k}`, x + 0.8, 7.5, WHO[k], undefined, { hue: HUE[k], z: Z, group: "who" }),
  ];
};

const CHART: PlotEl = raise(plot("chart", 0, 0, 328, 235, [0, 4], [0, 4], {
  title: "Four uses by risk", xLabel: "likelihood of a wrong answer", yLabel: "severity of harm",
  xt: [0, 4], xtl: ["low", "high"], yt: [0, 4], ytl: ["low", "high"], grid: false, group: "chart",
}), STAND, 30);
const points = (group: string, hot?: number): El[] => AT.map((pt, k) =>
  series(`${group}-${k}`, "chart", "points", [pt], { hue: HUE[k], r: 7, tone: "ink", label: SHORT[k], hot: hot === k ? [0] : undefined, group }));
/** The control levels on the chart. Each level adds one layer of shading: severity sets the level and a high likelihood raises it by one. */
const zones: El[] = [
  ...[1, 2, 3].flatMap((t) => [
    shade(`zone${t}`, "chart", [0, t, 4, 4], { group: "zones" }),
    shade(`zone${t}-likely`, "chart", [3, t - 1, 4, t], { group: "zones" }),
  ]),
  ...["no review", "sample review", "human approval", "full documentation"].map((text, t) =>
    note(`level${t}`, ...plotPoint(CHART, 0.1, t + 0.3), text, { tone: t ? "ink" : "muted", strong: true, size: 12, on: "chart", group: "zones" })),
];

export default defineGuide({
  id: "intended-use-and-risk", track: "ai", module: "Foundations", slug: "intended-use-and-risk",
  title: "Intended use and risk",
  summary: "One model carries a different risk in each job it is given. What the system is for, who it affects and how badly a wrong answer hurts decide how much evaluation, oversight and documentation it needs.",
  forLeads: "Approve uses, never a model in general. Keep an inventory of uses, place each by likelihood and severity, and let that position set the review, the human approval and the documentation. Check whether a law has already set the tier.",
  status: "draft", minutes: 7,
  counters: ["Uses recorded", "Placed by risk", "Control levels", "High-risk in law"],
  whatIf: { label: "What if every use got the same review?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Uses, positions and controls are illustrative",
    label: "The same model stands at the back of four lanes at Vinterhus: drafting product text, answering a support question, approving a refund and scoring a customer for credit. At first one model review covers all four and each output reaches people unchecked. Then a use-case inventory stands behind the lanes and each lane shows who the use affects and what a wrong answer costs them. The inventory becomes a chart that places the four uses by likelihood of a wrong answer and severity of harm. Control levels shade the chart, and blocks of growing height stand across three lanes: a sampled review, a human approval and full documentation. The credit use is marked as high-risk under the EU AI Act. At the last stop the answering use moves up the chart when it gains the authority to pay refunds.",
    els: [
      ...[0, 1, 2, 3].flatMap(lane),

      // 1. one review for every use
      raise(list("review", 0, 0, 290, ["Tested on sample prompts", "Approved for every use", { t: "Uses: not recorded", tone: "alert" }],
        { title: "Model review", sub: "once", group: "review" }), STAND, 30),

      // 2. the inventory: one row per use
      raise(table("inventory", 0, 0, 328, ["use", "team", "output is"],
        [
          { cells: ["product text", "Operations", "a draft"], hue: HUE[0] },
          { cells: ["answer", "Support", "a reply"], hue: HUE[1] },
          { cells: ["refund", "Support", "a payment"], hue: HUE[2] },
          { cells: ["credit", "Finance", "a decision"], hue: HUE[3] },
        ], { at: [14, 128, 232], rowH: 30, title: "Use-case inventory", sub: "one row per use", group: "inventory" }), STAND, 30),

      // 3 to 6. the chart
      CHART,
      ...points("placed"),
      ...zones,
      ...points("placed-law", 3),
      pill("law", [845, 462], "EU AI Act: high-risk", { glyph: "scale", sub: "Annex III, credit scoring", to: G.p(LANE[3] + 3, 4.6, Z), group: "law" }),

      // 6. a new purpose is a new position
      series("shift", "chart", "line", [AT[1], MOVED], { dashed: true, tone: "ink", w: 2.5, group: "shift" }),
      pill("reassess", [845, 462], "Use-case inventory", { glyph: "table", sub: "updated when a use changes", group: "shift" }),
    ],
  },
  steps: [
    step({
      id: "one-review", label: "One review", kind: "problem", title: "One review covers every use of the model",
      caption: "Vinterhus tests a model once and gives it four jobs. An odd product text and a wrong credit decision pass the same check: none.",
      show: ["review"], counters: ["0", "0", "1 for all", "unknown"],
      rides: [ride("r0", "out0", "end0", "product text", { then: "published" }), ride("r2", "out2", "end2", "refund 4471", { then: "paid" }), ride("r3", "out3", "end3", "credit score", { then: "refused" })],
      body: ["A model has no risk level of its own. The same model that drafts a product description can answer a customer, release a payment or score a person, and the harm of a wrong answer differs in each.",
        "The EU AI Act defines intended purpose as the use for which a system is intended by its provider, including the specific context and conditions of use.",
        { callout: { label: "Key idea", text: "Assess each use in the setting where it runs. A review of the model alone says nothing about who is affected." } }],
      claims: ["intended-use-and-risk-purpose"],
    }),
    step({
      id: "inventory", label: "Intended use", kind: "idea", title: "Each use is recorded with the people it affects",
      caption: "A use-case inventory lists the four jobs. Each lane now shows who receives the output and what a wrong answer costs them.",
      show: ["inventory", "who"], counters: ["4", "0", "1 for all", "unknown"],
      rides: HARM.map((harm, k) => ride(`r${k}`, `out${k}`, `end${k}`, harm, { tone: "alert" })),
      body: ["The Map function of the NIST AI Risk Management Framework has intended purpose, context-specific laws and norms, and the prospective settings of deployment understood and documented. Its considerations include the types of users and the potential positive and negative impacts on individuals, communities, organisations and society.",
        "NIST describes an AI system inventory as an organised database of artefacts relating to an AI system or model. It suggests a policy on which systems are inventoried, with a preference for all of them, or at a minimum the high-risk ones and those deployed in high-stakes settings."],
      claims: ["intended-use-and-risk-context", "intended-use-and-risk-inventory"],
    }),
    step({
      id: "position", label: "Position", kind: "mechanism", title: "Risk combines likelihood and severity",
      caption: "Each use takes a place on one chart: how likely a wrong answer is and how badly it hurts. The model is the same at all four points.",
      show: ["chart", "placed", "who"], counters: ["4", "4", "1 for all", "unknown"],
      body: ["The EU AI Act defines risk as the combination of the probability of an occurrence of harm and the severity of that harm.",
        "NIST's Map function has the likelihood and magnitude of each identified impact documented, based on expected use, past uses of AI systems in similar contexts, public incident reports, feedback from outside the team, or other data. Scales may be qualitative, such as red-amber-green, and are applied uniformly across the organisation's AI portfolio."],
      claims: ["intended-use-and-risk-purpose", "intended-use-and-risk-impact"],
    }),
    step({
      id: "controls", label: "Controls", kind: "mechanism", title: "Controls grow with the position",
      caption: "Product text goes out unreviewed. Support answers get a sampled review. Refund 4471 waits for a person's approval. The credit score needs oversight and full documentation.",
      show: ["chart", "placed", "zones", "controls", "who"], counters: ["4", "4", "4", "unknown"],
      rides: [ride("r0", "out0", "end0", "product text", { then: "published" }), ride("r2", "out2", "hold2", "refund 4471", { then: "held" })],
      body: ["NIST has the likelihood and magnitude estimates used to assign TEVV resources appropriate for the risk level. TEVV stands for test, evaluation, validation and verification.",
        "It also has organisations establish risk tolerance levels for AI systems and allocate the appropriate oversight resources to each level, and identify the maximum tolerance above which a system will not be deployed.",
        { callout: { label: "Proportion", text: "Evaluation, oversight and documentation are sized by the position of the use. A control that fits the credit score would stall product text, and the reverse leaves an applicant unprotected." } }],
      claims: ["intended-use-and-risk-impact", "intended-use-and-risk-tolerance"],
    }),
    step({
      id: "legal-tier", label: "Legal tier", kind: "watch-out", title: "A law fixes the tier of some uses",
      caption: "The EU AI Act lists evaluating a person's creditworthiness as high-risk. That tier follows from the intended use, whatever position Vinterhus estimates.",
      show: ["chart", "placed-law", "zones", "controls", "who", "law"], counters: ["4", "4", "4", "1"],
      rides: [ride("r3", "out3", "hold3", "credit score", { then: "held" })],
      body: ["The Act sorts uses into tiers. It prohibits certain practices, sets specific requirements for high-risk systems and lays down transparency rules for certain systems. A system intended to interact directly with people is designed so that they are informed they are interacting with an AI system, unless this is obvious.",
        "Annex III lists systems intended to evaluate the creditworthiness of natural persons or establish their credit score as high-risk, except systems used to detect financial fraud. A listed system is not considered high-risk where it poses no significant risk of harm, for example where it performs a narrow procedural task, and is always considered high-risk where it profiles natural persons. A provider who considers a listed system not high-risk documents that assessment before placing it on the market.",
        "A high-risk system needs a documented and maintained risk management system, technical documentation drawn up before it is placed on the market and kept up to date, and a design that lets people effectively oversee it while in use.",
        { callout: { label: "Dated", text: "As amended by Regulation (EU) 2026/1744, these requirements apply from 2 December 2027 for high-risk systems under Annex III and from 2 August 2028 for those under Annex I." } }],
      claims: ["intended-use-and-risk-tiers", "intended-use-and-risk-high-risk", "intended-use-and-risk-exception", "intended-use-and-risk-requirements", "intended-use-and-risk-dates"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "How much control a use needs",
      caption: "",
      show: ["chart", "placed", "zones", "controls", "who", "shift"], counters: ["4", "4", "4", "1"],
      rides: [ride("shift", 0, 1, "answer", { then: "pays" })],
      body: [{ pair: {
        left: { label: "Lighter", items: ["A wrong answer is cheap", "A person acts on the output", "Easy to correct"] },
        right: { label: "Heavier", items: ["Money or access is at stake", "The system acts alone", "A law lists the use"] },
      } },
        "A position holds only for the recorded use. NIST notes that organisations should expect broadly deployed AI tools to be reused, repurposed and potentially misused regardless of intentions.",
        "When the assistant that answers questions is given the authority to pay refunds, it becomes a different use at a higher position. Its row in the inventory and its controls change with it."],
      claims: ["intended-use-and-risk-context", "intended-use-and-risk-inventory"],
    }),
  ],
  governance: { text: "The intended use sizes every later control. NIST has risk tolerance levels established with oversight resources allocated to each level. For uses the EU AI Act classes as high-risk, a risk management system, technical documentation and human oversight are required.", claims: ["intended-use-and-risk-tolerance", "intended-use-and-risk-requirements"] },
  closing: {
    pitfalls: [
      "Approving a model in general instead of each use it is given.",
      "Rating severity by the cost to the organisation and leaving out the people affected.",
      "Keeping the old position after the system gains a new purpose or more authority.",
    ],
    questions: [
      "What is each use for, and what is it not allowed to decide?",
      "Who is affected by a wrong answer, and how badly?",
      "Does a law already set the tier of this use?",
    ],
  },
});
