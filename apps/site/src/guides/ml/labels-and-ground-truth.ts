import { CANVAS, defineGuide, doc, drum, isoGrid, line, list, pawn, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Pt, Row } from "@signal-path/engine";

// The floor: one rail runs along gy = 0 from the refund claims (back left) to the model (front right). A claim rides
// it through Labelling, where Support agents write the label, into the training set and on to the model. Warehouse
// inspection joins from behind with a second, later measurement of the same label. Three cards change across the
// stops: the labelled claims (front left), the label's definition (front middle) and what the model does with the
// labels (back right).
const G = isoGrid(140, 105, 30);
const AT = { in: 1, label: 4.6, a: 7.4, review: 9.6, join: 11.2, b: 12.6, set: 15.4, c: 18, model: 19.8, end: 21.6 };
const BACK = -4, LEFT: Pt = [142, 526], MID: Pt = [418, 528], RIGHT: Pt = [820, 288];
const at = (id: string, gx: number, extra: { group?: string } = {}): El => stop(id, ...G.p(gx, 0), undefined, undefined, extra.group ? extra : { always: true });

const ORDERS = ["4468", "4469", "4470", "4471", "4472", "4473"];
const CHANNEL = ["web", "app", "web", "store", "store", "store"];
const A = ["yes", "yes", "yes", "no", "no", "no"];
const B0 = ["yes", "no", "yes", "no", "yes", "no"];
const claims = (id: string, sub: string, cols: string[], rows: Row[], offsets: number[]): El =>
  raise(table(id, 0, 0, 264, cols, rows, { at: offsets, rowH: 24, title: "Labelled claims", sub, mono: true, group: id }), LEFT, 30);
const model = (id: string, sub: string, alert = false): El =>
  prism(id, AT.end + 0.3, -0.6, 1.2, 1.2, 30, { hue: "violet", glyph: "net", title: "Model", sub, at: "s", state: alert ? "alert" : "open", group: id });
const guideline = (id: string, sub: string, second: string, hot = false): El =>
  raise(list(id, 0, 0, 264, ["Photo shows damage: yes", { t: second, hot }, "Unsure: second agent"], { title: "Labelling guideline", sub, numbered: true, group: id }), MID, 30);

export default defineGuide({
  id: "labels-and-ground-truth", track: "ml", module: "Foundations", slug: "labels-and-ground-truth",
  title: "Labels and ground truth",
  summary: "A label is a measurement of the outcome, made by a person or a system. It carries noise, delay and bias, and a model trained on it learns all three as if they were the truth.",
  forLeads: "Model quality is capped by label quality, and test scores computed against the same labels cannot show it. A label needs a written definition, a named owner and a measured level of agreement before it is trained on.",
  status: "draft", minutes: 7,
  counters: ["Agent agreement", "Inspected", "Model on store claims", "Definition owner"],
  whatIf: { label: "What if nobody questioned the labels?", step: 0, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Claims, labels and agreement values are illustrative",
    label: "A rail runs from refund claims through a labelling station and a training set to a model. Six claims carry a label, damaged yes or no, which training reads as fact. Two Support agents then label the same claims and differ on two of them. A labelling guideline brings them to full agreement, measured with Cohen's kappa. A warehouse inspection joins the rail from behind with a second measurement that arrives weeks later, so the three store claims are still pending. The guideline marks claims without a photo as not damaged, every store claim lacks a photo, and the model learns that a store claim is never damaged. At the last stop a Support lead owns the definition, the guideline waits for inspection, and a flipped label is held at a review step before the training set.",
    els: [
      line("main", [G.p(0, 0), G.p(AT.end, 0)], { always: true }),
      at("s-in", AT.in), at("s-label", AT.label), at("s-a", AT.a), at("s-b", AT.b), at("s-set", AT.set), at("s-c", AT.c), at("s-model", AT.model),

      prism("claims", -1.4, -0.6, 1.2, 1.2, 30, { hue: "sky", glyph: "mail", title: "Refund claims", at: "n", always: true }),
      prism("labelling", AT.label - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "pen", title: "Labelling", at: "sw", always: true }),
      drum("set", AT.set, 0, 1.05, 36, { hue: "track", glyph: "table", title: "Training set", at: "s", always: true }),
      model("m-fact", "labels read as fact"), model("m-bias", "store: always no", true), model("m-wait", "retrain pending"),

      // the labelled claims: one table, six variants
      claims("t-fact", "label: damaged", ["order", "channel", "damaged"], ORDERS.map((o, i) => [o, CHANNEL[i], A[i]]), [12, 92, 178]),
      claims("t-two", "agree on 4 of 6", ["order", "agent A", "agent B"], ORDERS.map((o, i) => ({ cells: [o, A[i], B0[i]], hot: A[i] !== B0[i] })), [12, 92, 178]),
      claims("t-agree", "agree on 6 of 6", ["order", "agent A", "agent B"], ORDERS.map((o, i) => [o, A[i], A[i]]), [12, 92, 178]),
      claims("t-late", "3 of 6 inspected", ["order", "agents", "inspected"], ORDERS.map((o, i) => (i < 3 ? [o, A[i], A[i]] : { cells: [o, A[i], "pending"], hot: true })), [12, 92, 166]),
      claims("t-bias", "store: no photo", ["order", "channel", "damaged"], ORDERS.map((o, i) => (i < 3 ? [o, CHANNEL[i], A[i]] : { cells: [o, CHANNEL[i], A[i]], hue: "rose" as const })), [12, 92, 178]),

      // the people who measure
      pawn("a-say", 5, -4.4, "Agent A", "damaged", { side: "e", group: "say" }),
      pawn("b-say", 7.2, -4.2, "Agent B", "not damaged", { side: "e", group: "say" }),
      pawn("a", 5, -4.4, "Agent A", undefined, { group: "agents" }),
      pawn("b", 7.2, -4.2, "Agent B", undefined, { group: "agents" }),

      // the definition of the label
      raise(doc("undefined", 0, 0, 236, 112, "Label: damaged", ["values: yes, no", "definition: none", "owner: none"], { mono: true, group: "undefined" }), MID, 30),
      guideline("guide", "shared criteria", "No photo: no"),
      guideline("guide-bias", "shared criteria", "No photo: no", true),
      guideline("guide-owned", "owner: Support lead", "No photo: inspect first"),

      // what happens to the labels downstream
      raise(table("report", 0, 0, 264, ["model", "uses"], [["trained on", "these labels"], ["scored against", "these labels"]],
        { at: [12, 140], rowH: 24, title: "Model report", sub: "no other evidence", mono: true, group: "report" }), RIGHT, 30),
      raise(table("arrive", 0, 0, 264, ["measured by", "label arrives"], [["Support agent", "same day"], { cells: ["Inspection", "weeks later"], hot: true }],
        { at: [12, 140], rowH: 24, title: "Two measurements", sub: "one label", mono: true, group: "arrive" }), RIGHT, 30),
      raise({ kind: "tree", id: "learned", x: 0, y: 0, w: 264, h: 150, title: "What the model learned", split: "channel = store", leaves: ["no", "yes"], group: "learned" }, RIGHT, 30),

      // a second, later measurement
      line("insp", [G.p(AT.join, BACK), G.p(AT.join, 0), G.p(AT.end, 0)], { group: "insp" }),
      stop("a-insp", ...G.p(AT.join, BACK + 1), undefined, undefined, { group: "insp" }),
      at("j-insp", AT.join, { group: "insp" }),
      prism("inspection", AT.join - 0.6, BACK - 1.2, 1.2, 1.2, 30, { hue: "mint", glyph: "search", title: "Inspection", sub: "weeks later", at: "n", group: "insp" }),

      // the controls
      prism("review", AT.review - 0.6, -0.6, 1.2, 1.2, 26, { hue: "rose", glyph: "shield", title: "Label review", sub: "changes logged", at: "sw", group: "gov" }),
      pawn("owner", 8.4, -4.2, "Support lead", undefined, { hue: "track", group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "fact", label: "Read as fact", kind: "problem", title: "The label column is read as fact",
      caption: "Support marks each refund claim damaged or not. Training takes that column as ground truth, and the model is scored against the same labels.",
      show: ["t-fact", "undefined", "report", "m-fact"], counters: ["not measured", "0 of 6", "not checked", "none"],
      rides: [ride("main", "s-in", "s-model", "4471 no", { via: ["s-set"] })],
      body: ["Ground truth is reality: the thing that actually happened. Model quality is assessed against it. The column in the training set is a record of that reality, and records can be incorrect, instruments can be calibrated differently and human raters can evaluate the same event in different ways.",
        "A test score does not reveal the problem when the test labels come from the same process. A 2021 study of the test sets of 10 of the most commonly used benchmark datasets estimated an average of at least 3.3% label errors, and at least 6% in the ImageNet validation set. Its findings advise caution in choosing a model on test accuracy.",
        { callout: { label: "Key idea", text: "Ground truth is what happened. A label is what somebody wrote down about it." } }],
      claims: ["labels-and-ground-truth-truth", "labels-and-ground-truth-errors"],
    }),
    step({
      id: "measure", label: "Measurement", kind: "idea", title: "A label is a measurement someone made",
      caption: "Two agents label the same six claims and differ on two. Each label is one agent's reading of a claim, with no written definition behind it.",
      show: ["t-two", "undefined", "report", "m-fact", "say"], counters: ["4 of 6", "0 of 6", "not checked", "none"],
      rides: [ride("main", "s-in", "s-a", "4469", { via: ["s-label"], then: "yes or no?" })],
      body: ["Some data is human-generated: one or more people examine some information and provide a value, usually the label. The person is called a rater or an annotator. Other data is generated automatically, by software or by another model.",
        "People err, so several raters may have to evaluate the same data. Inter-rater agreement, also called inter-annotator agreement, measures how often raters agree on a task. Here the agents agree on 4 of 6 claims.",
        { callout: { label: "Key idea", text: "Two measurements of the same claim can differ. The difference is label noise, and one label per claim hides it." } }],
      claims: ["labels-and-ground-truth-made", "labels-and-ground-truth-raters", "labels-and-ground-truth-agreement"],
    }),
    step({
      id: "guideline", label: "Guideline", kind: "mechanism", title: "A guideline makes the measurement repeatable",
      caption: "A labelling guideline gives every agent the same criteria. The agents now agree on all six claims, and Cohen's kappa puts a number on that agreement.",
      show: ["t-agree", "guide", "report", "m-fact", "agents"], counters: ["kappa 1.00", "0 of 6", "not checked", "none"],
      rides: [ride("main", "s-in", "s-b", "4469", { via: ["s-label"], then: "4469 yes" })],
      body: ["When raters disagree, the task instructions may need to be improved. Human labelling forces the owner of the dataset to develop clear and consistent criteria, and Google's advice is to double-check raters and add instructions where they have introduced errors.",
        "Cohen's kappa expresses the agreement between two annotators on a classification problem as (p_o - p_e) / (1 - p_e): observed agreement, corrected for the agreement expected if both assigned labels at random. It runs from -1.0 to 1.0, where 0.0 is no agreement beyond chance and the maximum is complete agreement.",
        "Before the guideline the two agents agreed on 4 of 6 claims, a kappa of 0.33. With it they agree on all six, a kappa of 1.00.",
        { callout: { label: "Watch", text: "Agreement shows that the measurement is repeatable. It does not show that the measurement is right." } }],
      claims: ["labels-and-ground-truth-agreement", "labels-and-ground-truth-criteria", "labels-and-ground-truth-raters", "labels-and-ground-truth-kappa"],
    }),
    step({
      id: "late", label: "Late labels", kind: "mechanism", title: "Some labels arrive weeks later",
      caption: "The warehouse inspects each returned item, a second measurement of the same label. It arrives weeks after the claim, so recent claims have none yet.",
      show: ["t-late", "guide", "arrive", "m-fact", "agents", "insp"], counters: ["kappa 1.00", "3 of 6", "not checked", "none"],
      rides: [ride("insp", "a-insp", "s-b", "4470", { via: ["j-insp"], then: "4470 yes" })],
      body: ["A label can come from a system as well as from a person. The inspection result is closer to what happened to the item, and it is not available when the model is trained or when its prediction is first used.",
        "In an interview study of 18 machine learning engineers, many said that ground-truth labels for live predictions often arrived after a delay that could vary unpredictably. This caused problems for knowing real-time performance and for retraining regularly. One participant reported feedback that is always delayed by at least two weeks.",
        { callout: { label: "Watch", text: "A pending label is unknown. Counting it as no writes a wrong label into the training set." } }],
      claims: ["labels-and-ground-truth-made", "labels-and-ground-truth-delay"],
    }),
    step({
      id: "bias", label: "Bias learned", kind: "watch-out", title: "The model learns the label, bias included",
      caption: "Store claims carry no photo, so the guideline marks them all not damaged. The agents agree, the label is biased, and the model learns the rule exactly.",
      show: ["t-bias", "guide-bias", "learned", "m-bias", "agents", "insp"], counters: ["kappa 1.00", "3 of 6", "always no", "none"],
      rides: [ride("main", "s-set", "s-model", "store: no", { via: ["s-c"], tone: "alert" })],
      body: ["The label here is a proxy. A direct label is identical to the prediction the model is meant to make. A proxy label is similar but not identical, and a model that uses one is only as useful as the connection between the proxy and the prediction. The agents measured whether a photo showed damage, which is not whether the item was damaged.",
        "A 2019 study in Science found significant racial bias in a widely used commercial algorithm for identifying patients with complex health needs. The algorithm predicted health care costs rather than illness, and unequal access to care meant less money was spent on Black patients. The authors suggest that convenient, seemingly effective proxies for ground truth can be an important source of algorithmic bias.",
        "Wrong labels can also be planted. Label flipping is a data poisoning attack in which an adversary is restricted to changing the training labels. Training cannot tell a flipped label from a correct one.",
        { callout: { label: "Key idea", text: "Training fits whatever the label column says. Noise, staleness and bias in the labels become behaviour of the model." } }],
      claims: ["labels-and-ground-truth-proxy", "labels-and-ground-truth-bias", "labels-and-ground-truth-flipping"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Two ways to produce labels",
      caption: "",
      show: ["t-late", "guide-owned", "arrive", "m-wait", "insp", "gov"], counters: ["kappa 1.00", "3 of 6", "retrain pending", "Support lead"],
      rides: [ride("main", "s-label", "s-a", "flipped label", { tone: "alert", then: "held" })],
      body: [{ pair: {
        left: { label: "People label", items: ["Guideline, two agents, measured agreement", "Active learning picks the claims"] },
        right: { label: "Rules label", items: ["Weak supervision labels in bulk", "Noisy, then denoised by a model"] },
      } },
        "Active learning spends human labelling where it helps most. The learner poses queries, usually unlabelled instances for an oracle such as a human annotator, and aims for high accuracy with as few labelled instances as possible. Uncertainty sampling queries the instances the model is least certain how to label.",
        "Weak supervision replaces hand labelling with rules. In Snorkel, users write labelling functions that express heuristics of unknown accuracy and correlation, and the system denoises their outputs without access to ground truth. A rule such as no photo means not damaged is a labelling function, and it carries the same bias when a program applies it.",
        "Either way the definition has an owner and the label store is controlled. Among mitigations for poisoning, NIST lists training data sanitization: cleaning the training set and removing poisoned samples before training. For high-risk AI systems, Article 10 of the EU AI Act puts annotation and labelling under data governance and management practices, together with the assumptions about what the data are supposed to measure.",
        "A label on a customer's claim is information relating to an identifiable person. Under the GDPR it is personal data, to be accurate and, where necessary, kept up to date."],
      claims: ["labels-and-ground-truth-active", "labels-and-ground-truth-weak", "labels-and-ground-truth-sanitise", "labels-and-ground-truth-ai-act", "labels-and-ground-truth-personal", "labels-and-ground-truth-criteria"],
    }),
  ],
  governance: { text: "The owner of a dataset develops the criteria its labels are made by, and for high-risk AI systems the EU AI Act places annotation and labelling under data governance and management practices. A flipped label is a data poisoning attack that training reads as truth, and a label attached to a customer's record remains personal data under the GDPR.", claims: ["labels-and-ground-truth-criteria", "labels-and-ground-truth-ai-act", "labels-and-ground-truth-flipping", "labels-and-ground-truth-personal"] },
  closing: {
    pitfalls: [
      "Scoring a model against labels made by the same process as its training labels, and reading the score as accuracy.",
      "Treating high annotator agreement as proof that the labels are correct.",
      "Filling labels that have not arrived yet with a default value.",
    ],
    questions: [
      "Who or what made each label, and from which information?",
      "How far do two annotators agree on the same examples, and what does the guideline say about the cases where they differ?",
      "Who owns the definition of the label, and who can change a stored label?",
    ],
  },
});
