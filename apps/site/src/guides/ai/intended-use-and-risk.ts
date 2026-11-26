import { CANVAS, defineGuide, isoGrid, line, list, pawn, prism, raise, ride, step, stop } from "@signal-path/engine";

// One hiring assistant moves from an idea to a documented, tested use. Its purpose changes the review.
const G = isoGrid(200, 160, 30);
const board = (id: string, items: string[], group: string) =>
  raise(list(id, 0, 0, 220, items, { title: "Use-case record", group }), [330, 200], 30);

export default defineGuide({
  id: "intended-use-and-risk", track: "ai", module: "Foundations", slug: "intended-use-and-risk",
  title: "Intended use and risk",
  summary: "A model's risk depends on the job it is given, who it affects and what failure could cost. Record the use before sizing the checks.",
  forLeads: "A model is not approved in the abstract. Set the purpose, people, setting and harm first; then choose proportionate evaluation, oversight and documentation.",
  status: "draft", minutes: 7,
  counters: ["Purpose recorded", "People identified", "Impact assessed", "Controls chosen"],
  whatIf: { label: "What if the purpose changes?", step: 1, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The retailer and use case are illustrative",
    label: "A job application reaches an AI screening system. The use-case record fills in its purpose, affected people and potential impact. The intended use puts it in the EU AI Act's high-risk category, so a risk management process and controls must be chosen.",
    els: [
      line("route", [G.p(0, 0), G.p(15, 0)], { always: true }),
      stop("in", ...G.p(0, 0), undefined, undefined, { always: true }),
      stop("model-stop", ...G.p(7.5, 0), undefined, undefined, { always: true }),
      stop("review-stop", ...G.p(12, 0), undefined, undefined, { always: true }),
      stop("out", ...G.p(15, 0), undefined, undefined, { always: true }),
      list("application", 25, 170, 145, ["Application", "stock associate"], { title: "Vinterhus hiring", group: "input" }),
      prism("model", 7.4, -8.5, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "AI screen", sub: "candidate ranking", at: "n", always: true }),
      pawn("candidate", 850, 205, "Applicant", "decision affects them", { group: "output" }),
      line("impact", [G.p(7.5, -4), G.p(10.5, -4)], { tone: "alert", group: "impact" }),
      board("purpose", ["Purpose: shortlist", "Not: make final offer"], "purpose"),
      board("people", ["Affected: applicants", "Operator: hiring team"], "people"),
      board("impact-board", ["Harm: strong candidate excluded", "Estimate likelihood + severity"], "assessment"),
      board("tier", ["Recruitment and selection", "EU AI Act: high-risk"], "tier"),
      board("controls", ["Test relevant cases", "Human review", "Record the decision"], "controls"),
      board("recheck", ["Review purpose and context", "Reassess after a change"], "recheck"),
    ],
  },
  steps: [
    step({
      id: "prototype", label: "Prototype", kind: "problem", title: "A model is tried without a defined job",
      caption: "Vinterhus tests an assistant on job applications. The team has not decided whether it summarises applications, ranks candidates or makes a recommendation.",
      show: ["input"], counters: ["no", "no", "no", "none"],
      rides: [ride("route", "in", "model-stop", "application")],
      body: ["A model demo does not define the system's intended use. A model can be placed into different workflows, with different people affected and different consequences.",
        { callout: { label: "Key idea", text: "Assess the system in the setting where it will be used." } }],
      claims: ["intended-use-and-risk-context"],
    }),
    step({
      id: "purpose", label: "Purpose", kind: "idea", title: "Write down what the system will do",
      caption: "The team records a narrow purpose: shortlist stock associate applications for a person to review. It is not authorised to make the hiring decision.",
      show: ["input", "purpose"], counters: ["shortlist", "no", "no", "none"],
      rides: [ride("route", "in", "model-stop", "shortlist")],
      body: ["NIST's Map function calls for documenting intended purpose, prospective settings, end-user expectations and potential impacts. The record also states what the model must not decide."],
      claims: ["intended-use-and-risk-context"],
    }),
    step({
      id: "people", label: "People", kind: "mechanism", title: "Name the people and setting",
      caption: "Applicants may lose an opportunity if a suitable application is missed. The hiring team operates the tool and must understand its limits.",
      show: ["input", "people"], counters: ["shortlist", "applicants + team", "not estimated", "none"],
      rides: [ride("route", "in", "review-stop", "application", { via: ["model-stop"] })],
      body: ["A use-case inventory records the system, its intended purpose, setting, operators and affected groups. NIST says potential negative impacts should be considered for individuals, groups, organisations and society."],
      claims: ["intended-use-and-risk-context"],
    }),
    step({
      id: "impact", label: "Impact", kind: "mechanism", title: "Estimate how likely and serious harm is",
      caption: "The team estimates the chance and severity of a qualified applicant being excluded, using past cases, incident reports and feedback rather than a guess.",
      show: ["input", "assessment", "impact"], counters: ["shortlist", "applicants + team", "likelihood + severity", "not chosen"],
      rides: [ride("impact", 0, 1, "missed applicant", { tone: "alert" })],
      body: ["NIST's Map function says to document the likelihood and magnitude of identified positive and harmful impacts, drawing on expected use, similar past uses, public incident reports, feedback and other data."],
      claims: ["intended-use-and-risk-impact"],
    }),
    step({
      id: "category", label: "Risk tier", kind: "watch-out", title: "Some intended uses have legal risk tiers",
      caption: "Recruiting and selecting people is a high-risk use under the EU AI Act. The team records that category and plans the applicable checks before deployment.",
      show: ["input", "tier"], counters: ["shortlist", "applicants + team", "recruitment category", "high-risk"],
      rides: [ride("route", "model-stop", "review-stop", "high-risk use")],
      body: ["The Act's Annex III includes AI systems intended for recruitment or selection, including analysing or filtering applications and evaluating candidates. Its risk management system is continuous across the lifecycle and includes reasonably foreseeable misuse."],
      claims: ["intended-use-and-risk-high-risk", "intended-use-and-risk-management"],
    }),
    step({
      id: "decide", label: "Controls", kind: "decision", title: "Choose controls for this use",
      caption: "",
      show: ["input", "controls"],
      counters: ["shortlist", "applicants + team", "recruitment category", "tested + reviewed"],
      rides: [ride("route", "model-stop", "review-stop", "human-reviewed shortlist")],
      body: [{ pair: {
        left: { label: "Before launch", items: ["Test against relevant cases", "Give the reviewer clear limits", "Document risks and controls"] },
        right: { label: "Revisit when", items: ["Purpose changes", "The user group changes", "New evidence changes the risk"] },
      } }],
      claims: ["intended-use-and-risk-management"],
    }),
  ],
  governance: { text: "For high-risk systems, the EU AI Act requires a documented, maintained and iterative lifecycle risk process. Record purpose, affected people and foreseeable misuse before selecting controls.", claims: ["intended-use-and-risk-management", "intended-use-and-risk-context"] },
  closing: {
    pitfalls: [
      "Assessing a model in general instead of the workflow it will enter.",
      "Counting only the organisation's risk and ignoring the people affected.",
      "Treating a risk tier as a substitute for assessing the actual context.",
    ],
    questions: [
      "What is the assistant authorised to do in this workflow?",
      "Who could be affected if it fails, and how?",
      "What new use or evidence would trigger a reassessment?",
    ],
  },
});
