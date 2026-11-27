import { CANVAS, defineGuide, drum, isoGrid, line, pawn, pill, plot, prism, raise, ride, series, step } from "@signal-path/engine";

// A board on the left and the model's lifecycle on the right. The board is the training data with the model's
// decision boundary drawn through it. On the floor, training data feeds training, and training produces the model.
// An attacker reaches the lifecycle at two places: the training data and the deployed model's query interface.
// Each stop shows one attack or control on the floor and what it does to the boundary on the board.
const G = isoGrid(480, 300, 30);

type P2 = [number, number];
/** Past refund requests: refunds in the last 12 months and amount. Support approved the first set and sent the second to review. */
const APPROVE: P2[] = [[1, 60], [1, 180], [2, 110], [2, 260], [3, 50], [3, 170], [4, 120], [4, 230], [5, 60], [5, 150], [6, 90], [7, 100], [1, 310]];
const REVIEW: P2[] = [[6, 300], [7, 230], [8, 160], [8, 330], [9, 110], [9, 260], [10, 180], [10, 340], [11, 90], [11, 250], [7, 360], [5, 350]];
/** Records an attacker adds with the label approve, although they lie among the review cases. */
const POISON: P2[] = [[9, 200], [10, 230], [9, 280], [10, 150]];
/** Crafted requests the defender generates and adds with their correct label, review. */
const HARDEN: P2[] = [[9, 15], [7, 125], [6, 165]];

/** Logistic regression by gradient descent with a small L2 penalty. Returns the weights of a linear boundary. */
function fit(approve: P2[], review: P2[]): number[] {
  const pts = [...approve.map((p) => [...p, 0]), ...review.map((p) => [...p, 1])];
  let w = [0, 0, 0];
  for (let it = 0; it < 20000; it++) {
    const g = [0, 0, 0];
    for (const [x, y, t] of pts) { const u = (x - 6) / 3, v = (y - 200) / 100, p = 1 / (1 + Math.exp(-(w[0] + w[1] * u + w[2] * v))); g[0] += p - t; g[1] += (p - t) * u; g[2] += (p - t) * v; }
    w = w.map((c, i) => c - 0.5 * (g[i] / pts.length + (i ? 0.01 * c : 0)));
  }
  return w;
}
const xAt = (w: number[], y: number) => 6 - 3 * (w[0] + w[2] * (y - 200) / 100) / w[1];
const yAt = (w: number[], x: number) => 200 - 100 * (w[0] + w[1] * (x - 6) / 3) / w[2];
const review = (w: number[], [x, y]: P2) => w[0] + w[1] * (x - 6) / 3 + w[2] * (y - 200) / 100 > 0;
/** How many of the 25 honest requests a boundary puts on the side Support chose. */
const clean = (w: number[]) => `${APPROVE.filter((p) => !review(w, p)).length + REVIEW.filter((p) => review(w, p)).length} of 25`;
/** The boundary as a line across the board, from the top edge to the bottom edge. */
const edge = (w: number[]): P2[] => [400, 0].map((y) => { const x = xAt(w, y); return x > 12 ? [12, yAt(w, 12)] : x < 0 ? [0, yAt(w, 0)] : [x, y]; });

const W0 = fit(APPROVE, REVIEW), W1 = fit([...APPROVE, ...POISON], REVIEW), W2 = fit(APPROVE, [...REVIEW, ...HARDEN]);
/** Request 4471 as it really is, and as the attacker submits it: the amount lowered until it sits just across the boundary. */
const REAL: P2 = [8, 110], CRAFTED: P2 = [8, Math.round(yAt(W0, 8) - 20)];
const MEMBER: P2 = [2, 260], COST: P2 = [7, 100];

const REQ = raise(plot("req", 0, 0, 390, 360, [0, 12], [0, 400], { title: "Requests by amount and refunds in 12 months", xt: [0, 3, 6, 9, 12], yt: [0, 100, 200, 300, 400], xLabel: "refunds", yLabel: "amount", always: true }), [224, 480], 30);

/** The lifecycle runs along one rail. The training data stands at its head. */
const RAIL = -4.5, DATA: P2 = [-4, RAIL];

export default defineGuide({
  id: "security-and-privacy-of-models", track: "ml", module: "Selection and trust", slug: "security-and-privacy-of-models",
  title: "Security and privacy of models",
  summary: "A trained model has its own attack surface. A crafted input can cross its decision boundary, poisoned training data can move the boundary, and its answers can reveal which records it was trained on.",
  forLeads: "Validation on honest data says nothing about an adversary. Ask which stage of the lifecycle an attacker can reach, what each control costs in accuracy, and who accepts that cost.",
  status: "draft", minutes: 8,
  counters: ["Stage attacked", "Attacker capability", "Violation", "Clean accuracy"],
  whatIf: { label: "What if the training data went unscreened?", step: 2, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Requests, records and loss values are illustrative",
    label: "A chart of 25 past refund requests by refunds in 12 months and amount, coloured by whether Support approved them or sent them to review, with the model's decision boundary drawn between the two groups. Beside it, training data feeds training, which produces the model. An attacker first lowers the amount of request 4471 so that it crosses the boundary, then adds four records with flipped labels so that retraining moves the boundary, then queries the model with a customer's record and learns from a low loss that it was in the training data. Data sanitisation, adversarial training and differential privacy then answer the three attacks, and the hardened boundary sends one honest request to review.",
    els: [
      REQ,
      series("approve", "req", "points", APPROVE, { hue: "sky", r: 6, tone: "muted", label: "approve", labelAt: 4, always: true }),
      series("review", "req", "points", REVIEW, { hue: "sand", r: 6, tone: "muted", label: "review", labelAt: 7, always: true }),

      series("b0", "req", "line", edge(W0), { w: 4, group: "b0" }),
      series("b0-was", "req", "line", edge(W0), { tone: "muted", w: 2, dashed: true, group: "b0-was" }),
      series("b1", "req", "line", edge(W1), { tone: "alert", w: 4, group: "b1" }),
      series("b2", "req", "line", edge(W2), { w: 4, group: "b2" }),

      series("real", "req", "points", [REAL], { r: 6, tone: "alert", group: "real" }),
      series("passes", "req", "points", [REAL], { r: 7, hot: [0], tone: "alert", label: "4471 passes", group: "passes" }),
      series("nudge", "req", "line", [REAL, CRAFTED], { tone: "alert", w: 3, group: "nudge" }),
      series("crafted", "req", "points", [CRAFTED], { r: 7, hot: [0], tone: "alert", group: "crafted" }),
      series("caught", "req", "points", [CRAFTED], { r: 7, hot: [0], tone: "alert", label: "4471 caught", group: "caught" }),
      series("poison", "req", "points", POISON, { hue: "sky", r: 7, hot: [0, 1, 2, 3], tone: "alert", label: "flipped", labelAt: 2, group: "poison" }),
      series("member", "req", "points", [MEMBER], { hue: "sky", r: 8, hot: [0], tone: "alert", label: "4502", group: "member" }),
      series("harden", "req", "points", HARDEN, { hue: "sand", r: 7, hot: [0, 1, 2], group: "harden" }),
      series("harden-n", "req", "points", [HARDEN[2]], { hue: "sand", r: 7, hot: [0], label: "added", group: "harden-n" }),
      series("cost", "req", "points", [COST], { hue: "sky", r: 8, hot: [0], tone: "alert", label: "honest, to review", group: "cost" }),

      drum("data", ...DATA, 1, 34, { hue: "sky", glyph: "db", title: "Training data", sub: "25 requests", at: "n", group: "data" }),
      drum("data-bad", ...DATA, 1, 34, { hue: "sky", glyph: "db", title: "Training data", sub: "25 + 4 poisoned", at: "n", state: "alert", group: "data-bad" }),
      line("collect", [G.p(-3, RAIL), G.p(1.3, RAIL)], { always: true }),
      prism("train", 1.3, RAIL - 0.7, 1.4, 1.4, 30, { hue: "track", glyph: "gear", title: "Training", sub: "fits the boundary", at: "sw", always: true }),
      line("deploy", [G.p(2.7, RAIL), G.p(6.8, RAIL)], { always: true }),
      prism("model", 6.8, RAIL - 0.7, 1.4, 1.4, 34, { hue: "track", glyph: "net", title: "Model", sub: "approve or review", at: "se", always: true }),

      line("q", [G.p(7.5, 2.5), G.p(7.5, RAIL + 0.7)], { tone: "alert", group: "q" }),
      pawn("att-q", 7.5, 3.5, "Attacker", undefined, { hue: "rose", group: "q" }),
      pill("say-evade", [690, 462], "4471, amount lowered", { tone: "alert", anchor: "start", group: "say-evade" }),
      pill("say-infer", [690, 462], "low loss: 4502 is a member", { tone: "alert", anchor: "start", group: "say-infer" }),
      pill("say-held", [690, 462], "4471 goes to review", { tone: "muted", anchor: "start", group: "say-held" }),

      line("p", [G.p(-4, -10.5), G.p(-4, RAIL - 1)], { tone: "alert", group: "p" }),
      pawn("att-p", -4, -11.5, "Attacker", undefined, { hue: "rose", group: "p" }),
      line("p-in", [G.p(-4, -10.5), G.p(-4, -7.9)], { tone: "alert", group: "screen" }),
      line("p-cut", [G.p(-4, -6.7), G.p(-4, RAIL - 1)], { state: "closed", group: "screen" }),
      prism("screen", -4.6, -7.9, 1.2, 1.2, 22, { hue: "mint", glyph: "shield", title: "Data sanitisation", at: "se", group: "screen" }),
      pill("adv", [760, 166], "adversarial training", { glyph: "shield", tone: "track", anchor: "start", group: "controls" }),
      pill("dp", [760, 200], "DP-SGD, budget ε", { glyph: "lock", tone: "track", anchor: "start", group: "controls" }),
    ],
  },
  steps: [
    step({
      id: "honest", label: "Honest data", kind: "problem", title: "Validation assumes honest data",
      caption: "Vinterhus trains a model on 25 past refund requests to send new ones to approve or review. It separates all 25. Nobody has asked what an adversary could change.",
      show: ["b0", "data"], counters: ["none", "none assumed", "none", clean(W0)],
      rides: [ride("collect", 0.2, 0.5, "25 records"), ride("deploy", 0.15, 0.5, "boundary", { then: clean(W0) })],
      body: ["The model is a classifier with two features: the customer's refunds in the last 12 months and the amount requested. Training draws a decision boundary between the requests Support approved and the ones it sent to review.",
        "NIST AI 100-2, a taxonomy of adversarial machine learning, places attacks at either the training stage or the deployment stage. During training the attacker might control part of the training data, their labels, the model parameters or the code of ML algorithms. During deployment the adversary could mount evasion attacks to change the model's predictions, and privacy attacks to infer sensitive information about the training data or the model.",
        "The attacker's objectives are classified along three dimensions: availability breakdown, integrity violation and privacy compromise.",
        { callout: { label: "Key idea", text: "A threat model for a trained model names the stage attacked, the capability the attacker holds and the violation that results. The counters above track those three." } }],
      claims: ["security-and-privacy-of-models-stages", "security-and-privacy-of-models-objectives"],
    }),
    step({
      id: "evasion", label: "Evasion", kind: "idea", title: "A crafted input crosses the boundary",
      caption: "Request 4471 would go to review. The attacker lowers its amount a little and the model approves it. The changed request is an adversarial example, and the attack is evasion.",
      show: ["b0", "data", "real", "nudge", "crafted", "q", "say-evade"], counters: ["deployment", "testing data control", "integrity", clean(W0)],
      rides: [ride("nudge", 0, 1, "4471", { then: "approve", tone: "alert" }), ride("q", 0.1, 0.7, "4471", { then: "approve", tone: "alert" })],
      body: ["In an evasion attack the adversary's goal is to generate adversarial examples: samples whose classification can be changed to a class of the attacker's choice, often with only minimal perturbation. An adversarial example is similar to the original sample but alters the model's prediction.",
        "The capability used is testing data control: the attacker adds perturbations to samples at deployment time. Nothing in training or in the model has been touched, so clean accuracy is unchanged.",
        "Full knowledge of the model is not required. Adversarial examples also apply in black-box settings where the attacker has only query access, and deep neural networks remain vulnerable even when the attacker sees only predicted labels or confidence scores."],
      claims: ["security-and-privacy-of-models-evasion", "security-and-privacy-of-models-capabilities", "security-and-privacy-of-models-black-box"],
    }),
    step({
      id: "poisoning", label: "Poisoning", kind: "mechanism", title: "Poisoned training data moves the boundary",
      caption: "Four records with flipped labels enter the training data. Retraining shifts the boundary, and request 4471 is approved unchanged. Three past review cases now pass too. This is data poisoning.",
      show: ["b1", "b0-was", "data-bad", "poison", "passes", "p"], counters: ["training", "training data control", "integrity", clean(W1)],
      rides: [ride("p", 0.1, 0.45, "4 records", { tone: "alert" }), ride("collect", 0.2, 0.5, "29 records", { tone: "alert" }), ride("deploy", 0.15, 0.5, "boundary", { then: clean(W1), tone: "alert" })],
      body: ["Poisoning attacks occur during the training stage. In a data poisoning attack an adversary controls a subset of the training data by either inserting or modifying training samples.",
        "The four records here use label flipping: training examples with incorrect or altered labels. When the adversary can control the labelling of training data, inserting several poisoned samples with the target label makes the model learn the wrong label.",
        "Poisoning differs by objective. Availability poisoning typically degrades the model on all samples and is usually detectable by monitoring standard performance metrics. Targeted and backdoor poisoning induce integrity violations on a small set of target samples, and targeted poisoning is notoriously challenging to defend against."],
      claims: ["security-and-privacy-of-models-poisoning", "security-and-privacy-of-models-label-flipping", "security-and-privacy-of-models-poison-effects"],
    }),
    step({
      id: "membership", label: "Membership", kind: "mechanism", title: "Answers reveal who was in the training data",
      caption: "The attacker queries the model with a customer's record. Training minimises loss on training records, so a low loss marks record 4502 as a member. This is membership inference.",
      show: ["b0", "data", "member", "q", "say-infer"], counters: ["deployment", "query access", "privacy", clean(W0)],
      rides: [ride("q", 0.1, 0.75, "4502?", { tone: "alert" }), ride("q", 0.75, 0.2, "loss 0.01", { tone: "alert" })],
      body: ["With a membership inference attack an adversary can determine whether a particular record was included in the dataset used for training a model. Most of these attacks have been developed for black-box settings in which the adversary generates queries to the trained model.",
        "The loss-based attack uses the knowledge that a model minimises the loss on training samples. It decides that a target sample was part of training if its loss is lower than a fixed threshold.",
        "Membership alone can be sensitive: in a medical study of patients with a rare disease, being in the training set already has privacy implications. Membership inference can also be used as a building block for data extraction attacks.",
        { callout: { label: "Link to overfitting", text: "MITRE ATLAS lists ensuring that models do not overfit during training as a strategy for limiting memorisation of individual records." } }],
      claims: ["security-and-privacy-of-models-membership", "security-and-privacy-of-models-loss", "security-and-privacy-of-models-membership-harm", "security-and-privacy-of-models-overfit"],
    }),
    step({
      id: "controls", label: "Controls", kind: "mechanism", title: "Each attack meets a control at its own stage",
      caption: "Data sanitisation removes the flipped records. Adversarial training adds crafted requests with their correct labels. Differential privacy bounds what an answer reveals about any one record.",
      show: ["b2", "b0-was", "data", "harden", "harden-n", "caught", "screen", "controls", "q", "say-held"], counters: ["both stages", "all three", "none in this run", clean(W2)],
      rides: [ride("p-in", 0.05, 0.3, "4 records", { then: "removed", tone: "alert" }), ride("q", 0.1, 0.7, "4471", { then: "review", tone: "alert" })],
      body: ["Training data sanitisation rests on the insight that poisoned samples are typically different from regular training samples, and removes them before training is performed. Developers may also protect training data with access controls and use mechanisms for dataset provenance and integrity attestation.",
        "Adversarial training augments the training data with adversarial examples, generated iteratively during training, using their correct labels. Mitigations need to be evaluated against strong adaptive attacks: the field has a history of defences that were later broken by more powerful attacks.",
        "Differential privacy guarantees a bound on how much an attacker with access to the output can learn about each individual record. Its privacy parameter ε, the privacy budget, bounds the probability that the attacker can determine whether a particular record was included. DP-SGD is the most widely used algorithm for training with it, and adds calibrated noise to clipped gradients.",
        "Federated learning trains a model across multiple data sources without pooling the data in one location: participants exchange model updates and keep their own data. By itself it does not prevent disclosure through a deployed model's outputs, so it can be combined with differential privacy. It also opens a route for model poisoning, because clients send local model updates to the aggregating server.",
        "MITRE ATLAS is a public knowledge base of adversary tactics, techniques and procedures targeting AI systems. Its release 2026.10 lists the three attacks shown here as Evade AI Model, Training Data Poisoning and Infer Membership, and the controls as Predictive AI Model Hardening, Sanitize Training Data and Privacy-Preserving AI Training and Inference."],
      claims: ["security-and-privacy-of-models-sanitisation", "security-and-privacy-of-models-provenance", "security-and-privacy-of-models-adversarial-training", "security-and-privacy-of-models-adaptive", "security-and-privacy-of-models-dp", "security-and-privacy-of-models-dp-sgd", "security-and-privacy-of-models-federated", "security-and-privacy-of-models-federated-limit", "security-and-privacy-of-models-atlas", "security-and-privacy-of-models-atlas-entries"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Robustness and privacy cost accuracy",
      caption: "",
      show: ["b2", "b0-was", "data", "harden", "cost", "screen", "controls"], counters: ["both stages", "all three", "none in this run", clean(W2)],
      rides: [ride("deploy", 0.15, 0.5, "boundary", { then: clean(W2) })],
      body: [{ pair: {
        left: { label: "Adversarial training", items: ["Resists crafted inputs", "Lower accuracy on clean data"] },
        right: { label: "Differential privacy", items: ["Bounds what one record reveals", "Stronger privacy, lower accuracy"] },
      } },
        "The hardened boundary sits lower, so one honest request with 7 refunds and an amount of 100 now goes to review. Adversarial training usually comes at the cost of decreased accuracy on clean data, and it is expensive because adversarial examples are generated throughout training.",
        "The mitigations that have proven resilient against evasion exhibit inherent trade-offs between robustness and accuracy. Designing models that resist evasion while maintaining accuracy remains an open problem.",
        "One of the main challenges of using differential privacy in practice is setting the privacy parameters to trade the level of privacy against utility, typically measured as accuracy. Empirical privacy auditing is recommended to complement the theoretical analysis.",
        "Article 15 of the EU AI Act states that the technical solutions for high-risk AI systems shall include, where appropriate, measures to prevent, detect, respond to, resolve and control for data poisoning, model poisoning, adversarial examples or model evasion, confidentiality attacks and model flaws."],
      claims: ["security-and-privacy-of-models-adversarial-training", "security-and-privacy-of-models-tradeoff", "security-and-privacy-of-models-dp-utility", "security-and-privacy-of-models-ai-act"],
    }),
  ],
  governance: { text: "The threat model for a trained model names the lifecycle stage attacked, the attacker's capability and the violation: availability, integrity or privacy. The EU AI Act states that high-risk AI systems shall include, where appropriate, measures against data poisoning, model poisoning, adversarial examples and confidentiality attacks.", claims: ["security-and-privacy-of-models-stages", "security-and-privacy-of-models-capabilities", "security-and-privacy-of-models-objectives", "security-and-privacy-of-models-ai-act"] },
  closing: {
    pitfalls: [
      "Treating accuracy on honest held-back data as evidence that a model resists an adversary.",
      "Accepting a defence that was tested only against the attacks it was designed for.",
      "Assuming that data which never leaves its source cannot be revealed by the trained model's answers.",
    ],
    questions: [
      "Which attack needs control of training data, and which need only access to the deployed model?",
      "Why does a low loss on a record suggest the record was in the training data?",
      "What does a model give up when it is trained to resist crafted inputs?",
    ],
  },
});
