import { CANVAS, band, blocks, defineGuide, drum, isoGrid, layerUnitPositions, layers, line, list, pawn, plot, prism, raise, ride, rule, series, step, stop, table } from "@signal-path/engine";
import type { El, Pt } from "@signal-path/engine";

// The floor: a returned item runs down the serving rail from the returns dock through the photo booth to the grader, and on to resale.
// Behind it runs the training line: graded photos, the training pipeline and the model registry, which hands each version to the grader.
// A generator and a pretrained network feed the training line from the back. An inspector stands on a branch after the grader.
// Two boards: the left one names what the stop is about, the right one draws the model: its data, its layers, its loss, its confidence.
const G = isoGrid(50, 235, 30);
const LEFT: Pt = [162, 166];
const RIGHT: Pt = [830, 512];
const BW = 224, PW = 240, PH = 207;

const card = (id: string, title: string, items: Parameters<typeof list>[4], extra: object = {}) =>
  raise(list(id, 0, 0, BW, items, { title, group: id, ...extra }), LEFT, 20);
const chart = (id: string, xr: [number, number], yr: [number, number], extra: object) =>
  raise(plot(id, 0, 0, PW, PH, xr, yr, { group: id, ...extra }), RIGHT, 10);

/* ---------- the right board, one variant per stop ---------- */

const MIX = chart("mix", [0.3, 6.4], [0, 3000], { title: "Training photos by damage", xt: [1, 2.5, 3.8, 5.1], xtl: ["scratch", "dent", "stain", "water"], yt: [0, 1000, 2000, 3000] });

const SIZES = [4, 5, 5, 4, 3];
const every = (from: number, to: number): [number, number][] => SIZES.flatMap((k, i) => (i >= from && i <= to ? Array.from({ length: k }, (_, j) => [i, j] as [number, number]) : []));
const NET = raise(layers("net", 0, 0, PW, PH, SIZES, { title: "Grader network", sub: "lit: pretrained", labels: ["photo", "", "convolutions", "", "grade"], hot: every(0, 3), group: "net" }), RIGHT, 10);
const U = layerUnitPositions(NET);
const ROUTE: El = line("route", [U[0][1], U[1][2], U[2][1], U[3][2], U[4][1]] as Pt[], { w: 2, on: "net", group: "net" });

const TRAIN: [number, number][] = [[0, 1.1], [3, 0.72], [6, 0.5], [10, 0.34], [14, 0.24], [20, 0.14], [26, 0.08], [30, 0.06]];
const VALID: [number, number][] = [[0, 1.12], [3, 0.78], [6, 0.58], [10, 0.45], [14, 0.4], [20, 0.47], [26, 0.6], [30, 0.7]];
const LOSS = chart("loss", [0, 46], [0, 1.2], { title: "Loss by epoch", xt: [0, 10, 20, 30], yt: [0, 0.4, 0.8, 1.2] });

const CAL: [number, number][] = [[0.5, 0.52], [0.6, 0.59], [0.7, 0.71], [0.8, 0.79], [0.9, 0.91], [1, 0.99]];
const CONF = chart("conf", [0.5, 1.12], [0.5, 1.05], { title: "Confidence against outcome", xt: [0.5, 0.8, 1], yt: [0.5, 0.75, 1], xLabel: "confidence", yLabel: "share correct" });

const SCRATCH: [number, number][] = [[1.6, 7.6], [2.2, 8.3], [2.7, 7.2], [1.9, 6.6], [2.9, 8.1], [2.3, 7.4]];
const DENT: [number, number][] = [[6.4, 8.2], [7.1, 7.5], [7.6, 8.4], [6.9, 6.9], [7.9, 7.3], [7.3, 8.0]];
const STAIN: [number, number][] = [[1.4, 2.6], [2.1, 3.3], [2.6, 2.4], [1.8, 1.8], [2.8, 3.1], [2.2, 2.6]];
const WATER: [number, number][] = [[4.6, 5.6], [5.2, 5.0], [5.4, 5.9], [4.9, 4.8]];
const BURN: [number, number] = [6, 1.5];
const EMB = chart("emb", [0, 11.5], [0, 10], { title: "Photo embeddings", xt: [], yt: [] });

const DRIFT: [number, number][] = [[1, 0.05], [2, 0.06], [3, 0.05], [4, 0.07], [5, 0.06], [6, 0.08], [7, 0.13], [8, 0.19], [9, 0.24]];
const WATCH = chart("watch", [0.5, 11], [0, 0.3], { title: "Photos against training", xt: [1, 3, 5, 7, 9], yt: [0, 0.1, 0.2, 0.3], xLabel: "week", yLabel: "distance" });

const SYSTEM = ["booth", "labels", "gen", "train", "reg", "serve"];

export default defineGuide({
  id: "case-damaged-returns-graded-from-a-photo", track: "case", module: "Use cases", slug: "damaged-returns-graded-from-a-photo",
  title: "Damaged returns graded from a photo",
  summary: "A grader for returned items is assembled part by part: agreed labels, generated photos of rare damage, a pretrained network, a training pipeline and a calibrated threshold. Then a chair and an unfamiliar kind of damage run through it.",
  forLeads: "The model grades what it has seen before. What makes it safe to pay refunds on is the agreed label behind every grade and the route to an inspector for everything the model is unsure of or has never seen.",
  status: "draft", minutes: 12,
  counters: ["Grades come from", "Training photos", "Model", "Goes to a person"],
  whatIf: { label: "What if each site still graded by eye?", step: 1, from: 7 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Items, orders, counts, scores and curves are illustrative",
    label: "A returned item travels along a rail from the returns dock to a grading desk and on to resale stock. Later stops add a photo booth, a store of graded photos, a generator of rare damage, a pretrained network, a training pipeline, a model registry, a grader model with a confidence threshold and an inspector. A left board names the case at hand. A right board draws the training photos by damage, the network, the loss curves, the calibration curve, the photo embeddings and the weekly drift.",
    els: [
      prism("dock", 0, -0.6, 1.2, 1.2, 18, { hue: "sand", glyph: "replay", title: "Returns dock", at: "n", always: true }),
      blocks("queue", 6, 3.2, 6, 0.6, Array.from({ length: 18 }, (_, i) => ({ h: 7, hue: i < 4 ? "track" as const : "paper" as const })), { gap: 0.28, title: "40,000 returns a month", at: "s", always: true }),
      line("m1", [G.p(1.4, 0), G.p(11.4, 0)], { always: true }),
      line("m2", [G.p(12.6, 0), G.p(16.6, 0)], { always: true }),
      prism("resale", 16.6, -0.6, 1.2, 1.2, 20, { hue: "mint", glyph: "check", title: "Resale", at: "e", always: true }),

      // Problem: staff grade by eye, and the sites disagree.
      prism("desk", 11.4, -0.6, 1.2, 1.2, 24, { hue: "paper", glyph: "user", title: "Grading desk", sub: "staff, by eye", at: "s", group: "desk" }),
      card("grades", "The three grades", ["A: resale as new", "B: resale, discounted", "C: write off"]),
      raise(table("sites", 0, 0, BW, ["item", "Malmö", "Oslo"], [{ cells: ["CHAIR-1180", "B", "C"], hot: true }, ["LAMP-0312", "A", "A"], { cells: ["SOFA-2210", "A", "B"], hot: true }], { at: [12, 120, 174], title: "Same items, two sites", mono: true, group: "sites" }), LEFT, 20),

      // Architecture: the serving rail gains a photo booth, and the training line is laid behind it.
      prism("booth", 3.4, -0.6, 1.2, 1.2, 14, { hue: "sky", glyph: "eye", title: "Photo booth", at: "s", group: "booth" }),
      line("lab", [G.p(4, -0.7), G.p(4, -8)], { group: "labels" }),
      drum("store", 4, -9, 1, 30, { hue: "sky", glyph: "table", title: "Graded photos", at: "w", group: "labels" }),
      raise(table("agree", 0, 0, BW, ["photo", "1st", "2nd", "label"], [["CHAIR-1180", "B", "B", "B"], { cells: ["SOFA-2210", "A", "B", "B"], hot: true }, ["LAMP-0312", "A", "A", "A"]], { at: [12, 108, 142, 178], title: "Two inspectors, kappa 0.78", mono: true, group: "agree" }), LEFT, 20),

      line("gl", [G.p(4, -13.6), G.p(4, -10)], { group: "gen" }),
      prism("maker", 3.4, -14.8, 1.2, 1.2, 18, { hue: "violet", glyph: "sun", title: "Generator", sub: "diffusion model", at: "e", group: "gen" }),
      MIX,
      series("real", "mix", "bars", [[1, 2600], [2.5, 2100], [3.8, 1260], [5.1, 40]], { hue: "sky", group: "mix" }),
      series("made", "mix", "bars", [[5.65, 400]], { hue: "violet", label: "+400", group: "mix" }),
      card("synth", "Each generated photo", ["sampled, never photographed", { t: "labelled water damage", hot: true }, "tagged as generated"]),

      line("tl", [G.p(5, -9), G.p(11.4, -9)], { group: "train" }),
      prism("pipe", 11.4, -9.6, 1.2, 1.2, 26, { hue: "track", glyph: "gear", title: "Pipeline", sub: "training runs", at: "n", group: "train" }),
      line("pl", [G.p(12, -13.6), G.p(12, -9.6)], { group: "train" }),
      drum("base", 12, -14.6, 1, 26, { hue: "sand", glyph: "layers", title: "Pretrained network", sub: "general images", at: "n", group: "train" }),
      NET, ROUTE,
      card("pre", "What transfers", ["1.2 million general images", { t: "early layers: edges, colours", hot: true }, "new last layer: A, B, C"]),

      line("rl", [G.p(12, -8.4), G.p(12, -6.6)], { group: "reg" }),
      drum("registry", 12, -5.6, 1, 22, { hue: "sand", glyph: "stack", title: "Registry", at: "e", group: "reg" }),
      LOSS,
      series("l-train", "loss", "line", TRAIN, { tone: "ink", w: 3, smooth: true, label: "training", group: "loss" }),
      series("l-valid", "loss", "line", VALID, { tone: "track", w: 4, smooth: true, label: "held-out", group: "loss" }),
      rule("l-stop", "loss", 14, { label: "stop", group: "loss" }),
      card("run", "Pipeline run 12", ["validate the photos", { t: "train until held-out loss turns", hot: true }, "compare, register version 4"], { numbered: true }),

      prism("grader", 11.4, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "net", title: "Grader", sub: "version 4", at: "sw", group: "serve" }),
      line("dl", [G.p(12, -4.6), G.p(12, -0.6)], { group: "serve" }),
      line("il", [G.p(15.6, -0.1), G.p(15.6, -3.4)], { w: 3, group: "serve" }),
      stop("fork", ...G.p(15.6, 0), "below 0.80", undefined, { at: "sw", group: "serve" }),
      pawn("insp", 15.6, -4.4, "Inspector", undefined, { group: "serve" }),
      CONF,
      band("c-low", "conf", 0.5, 0.8, { label: "to an inspector", group: "conf" }),
      series("c-diag", "conf", "line", [[0.5, 0.5], [1, 1]], { tone: "muted", w: 2, dashed: true, group: "conf" }),
      series("c-cal", "conf", "line", CAL, { tone: "track", w: 4, group: "conf" }),
      series("c-pts", "conf", "points", CAL, { hue: "track", r: 5, group: "conf" }),
      series("c-chair", "conf", "points", [[0.93, 0.93]], { hue: "mint", r: 8, hot: [0], label: "0.93", labelAt: 0, group: "chair" }),
      card("rollout", "Version 4 goes live", ["shadow at one site first", "then grades at both sites", { t: "below 0.80: an inspector", hot: true }]),

      // Execution.
      card("chair", "Order 4471, CHAIR-1180", ["scuffed leg, photographed", { t: "grade B, confidence 0.93", hot: true }, "resold at a discount"]),
      EMB,
      series("e-scratch", "emb", "points", SCRATCH, { hue: "sky", r: 6, label: "scratch", labelAt: 1, group: "emb" }),
      series("e-dent", "emb", "points", DENT, { hue: "sand", r: 6, label: "dent", labelAt: 2, group: "emb" }),
      series("e-stain", "emb", "points", STAIN, { hue: "mint", r: 6, label: "stain", labelAt: 3, group: "emb" }),
      series("e-water", "emb", "points", WATER, { hue: "violet", r: 6, label: "water", labelAt: 2, group: "emb" }),
      series("e-far1", "emb", "line", [BURN, DENT[3]], { tone: "alert", w: 2, dashed: true, group: "emb" }),
      series("e-far2", "emb", "line", [BURN, STAIN[4]], { tone: "alert", w: 2, dashed: true, group: "emb" }),
      series("e-burn", "emb", "points", [BURN], { hue: "rose", r: 8, hot: [0], tone: "alert", label: "TABLE-3310", labelAt: 0, group: "emb" }),
      card("table", "Order 4502, TABLE-3310", [{ t: "burn marks: unlike training", hot: true, tone: "alert" }, "an inspector grades it C", "the photo joins the labels"]),
      WATCH,
      series("w-line", "watch", "line", DRIFT, { tone: "track", w: 4, group: "watch" }),
      series("w-alert", "watch", "line", [[0.5, 0.15], [11, 0.15]], { tone: "alert", w: 2, dashed: true, label: "alert", labelAt: 0, group: "watch" }),
      card("ops", "Watched every week", [{ t: "photos against training", hot: true }, "share sent to an inspector", "site agreement on a sample"]),
    ],
  },
  steps: [
    step({
      id: "by-eye", label: "By eye", kind: "problem", phase: "problem", title: "Every return is graded by eye",
      caption: "Forty thousand items come back each month. Staff at the grading desk look at each one and give it one of three grades.",
      show: ["desk", "grades"], counters: ["staff, by eye", "none", "none", "every item"],
      rides: [ride("m1", 0, 0.77, "CHAIR-1180", { then: "B?" })],
      body: ["The grade decides two things at once: what the customer is refunded and whether the item is sold again.",
        "A grade given by a person is a measurement. Human raters may not evaluate the same thing in the same way."],
      claims: ["labels-and-ground-truth-truth"],
    }),
    step({
      id: "sites", label: "Two sites", kind: "problem", phase: "problem", title: "Two sites grade the same chair differently",
      caption: "One site resells the chair at a discount. The other writes it off. Resaleable goods are lost, and no grade can be checked afterwards.",
      show: ["desk", "sites"], counters: ["two sites, two answers", "none", "none", "every item"],
      rides: [ride("m1", 0, 0.72, "CHAIR-1180", { then: "C: written off", tone: "alert" })],
      body: ["Inter-rater agreement measures how often human raters agree on a task. Where they disagree, the instructions may need to be improved.",
        { callout: { label: "The gap", text: "There is no agreed grade to hold either site to, and no photo to look at again." } }],
      claims: ["labels-and-ground-truth-agreement"],
    }),
    step({
      id: "labels", label: "Labels", kind: "mechanism", phase: "architecture", title: "Agreed grades become the labels",
      caption: "Every return is photographed. Two inspectors grade 6,000 photos against one written guideline, and a disagreement is settled before the photo is stored.",
      show: ["desk", "booth", "labels", "agree"], counters: ["two inspectors, one guideline", "6,000", "none", "every item"],
      rides: [ride("lab", 0.1, 0.5, "A or B?", { then: "label: B" })],
      concepts: ["labels-and-ground-truth"],
      body: ["A label made by people is human-generated data. Because humans err, several raters may have to evaluate the same example, and their work is checked against a sample.",
        "Cohen's kappa expresses the agreement between two annotators beyond what chance would give. Writing the guideline forces clear and consistent criteria.",
        "A model learns its labels faithfully. A study of ten widely used test sets estimated that at least 3.3% of their labels were wrong."],
      claims: ["labels-and-ground-truth-made", "labels-and-ground-truth-raters", "labels-and-ground-truth-kappa", "labels-and-ground-truth-criteria", "labels-and-ground-truth-errors"],
    }),
    step({
      id: "rare", label: "Rare damage", kind: "mechanism", phase: "architecture", title: "Generated photos fill in the rare damage",
      caption: "Water damage appears in 40 of the 6,000 photos. A diffusion model learns what those photos look like and samples 400 new ones.",
      show: ["desk", "booth", "labels", "gen", "mix", "synth"], counters: ["two inspectors, one guideline", "6,400, of them 400 generated", "none", "every item"],
      rides: [ride("gl", 0, 0.5, "water", { then: "+400" })],
      concepts: ["generative-models"],
      body: ["A generative model captures the distribution of the data itself and can generate new instances from it.",
        "A diffusion model is trained to reverse a process that gradually adds noise to the data until the signal is destroyed. Sampling starts from noise.",
        "Each generated photo is tagged as generated in the store, so it can be told apart from a photograph later."],
      claims: ["generative-models-generative", "generative-models-distribution", "generative-models-diffusion"],
    }),
    step({
      id: "network", label: "Network", kind: "mechanism", phase: "architecture", title: "A pretrained network already sees edges and texture",
      caption: "The convolution layers arrive trained on general images and stay frozen. Only a new last layer, with one output per grade, learns from the graded photos.",
      show: ["desk", "booth", "labels", "gen", "train", "net", "pre"], counters: ["two inspectors, one guideline", "6,400, of them 400 generated", "pretrained, last layer new", "every item"],
      rides: [ride("pl", 0, 0.45, "weights"), ride("route", 0, 1, "photo", { shape: "dot", then: "B" })],
      concepts: ["neural-networks", "architectures-for-images-sequences-and-text", "representation-and-transfer-learning"],
      body: ["A convolutional network is specialised for grid-like data such as an image. One small kernel is used at every position, so an edge is found wherever it lies in the photo.",
        "The hidden layers between input and output come to represent features of the task. First-layer features learned on natural images are general and apply to many datasets.",
        "It is common to pretrain on a very large dataset such as ImageNet, with 1.2 million images, then freeze those layers and train new layers on the new data. Few teams have enough data to train from scratch."],
      claims: ["architectures-for-images-sequences-and-text-grid", "architectures-for-images-sequences-and-text-sharing", "neural-networks-hidden-layer", "neural-networks-learned-features", "representation-and-transfer-learning-general-specific", "representation-and-transfer-learning-pretrain", "representation-and-transfer-learning-freeze", "representation-and-transfer-learning-scratch"],
    }),
    step({
      id: "pipeline", label: "Pipeline", kind: "mechanism", phase: "architecture", title: "A pipeline trains each version and stops in time",
      caption: "Gradient descent lowers the loss on the training photos. When the loss on held-out photos turns upward, training stops. The run is compared with version 3 and registered.",
      show: ["desk", "booth", "labels", "gen", "train", "reg", "loss", "run"], counters: ["two inspectors, one guideline", "6,400, of them 400 generated", "version 4, registered", "every item"],
      rides: [ride("tl", 0, 0.5, "run 12"), ride("l-valid", 0, 0.42, "loss 1.12", { then: "0.40" })],
      concepts: ["loss-and-optimisation", "overfitting-and-generalisation", "training-pipelines"],
      body: ["Loss is a number that describes how wrong the model's predictions are. Gradient descent iteratively finds the weights that produce the lowest loss.",
        "Training loss that keeps falling while validation loss rises suggests overfitting: the model matches the training set so closely that it fails on new data. Early stopping ends training at that point.",
        "In an automated pipeline the steps are orchestrated: data validation before training, model validation against the current model after it. The registry gives each model a version and its lineage."],
      claims: ["loss-and-optimisation-loss", "loss-and-optimisation-descent", "overfitting-and-generalisation-overfit", "overfitting-and-generalisation-diverge", "overfitting-and-generalisation-early", "training-pipelines-automation", "training-pipelines-data-validation", "training-pipelines-model-validation", "training-pipelines-registry"],
    }),
    step({
      id: "deploy", label: "Deployment", kind: "mechanism", phase: "architecture", title: "The grader goes live with a route for doubt",
      caption: "Version 4 first runs in shadow beside the staff, then grades at both sites. Its confidence is calibrated on held-out photos. Below 0.80 the item goes to an inspector.",
      show: [...SYSTEM, "conf", "rollout"], counters: ["the model and inspectors", "6,400, of them 400 generated", "version 4, serving", "confidence below 0.80"],
      rides: [ride("dl", 0, 0.5, "version 4"), ride("m2", 0, 0.47, "B 0.71"), ride("il", 0.2, 0.55, "B 0.71", { then: "C" })],
      concepts: ["model-deployment", "uncertainty-and-calibration"],
      body: ["In a shadow deployment the new model receives a copy of the requests and its responses are logged for comparison, not returned.",
        "A well calibrated classifier's predicted probability can be read directly as a confidence level. The calibrator is fitted on data the classifier was not trained on.",
        "Grading at the booth is an online inference: a synchronous request to a deployed model."],
      claims: ["model-deployment-shadow", "model-deployment-batch-online", "uncertainty-and-calibration-calibrated", "uncertainty-and-calibration-curve", "uncertainty-and-calibration-heldout", "uncertainty-and-calibration-oversight"],
    }),
    step({
      id: "chair", label: "A chair", kind: "mechanism", phase: "execution", title: "A scuffed chair is graded in seconds",
      caption: "Chair 1180 from order 4471 is photographed. The grader gives it B with confidence 0.93, above the threshold, and it goes to resale at a discount.",
      show: [...SYSTEM, "conf", "chair"], counters: ["the model and inspectors", "6,400, of them 400 generated", "version 4, serving", "confidence below 0.80"],
      rides: [ride("m1", 0, 0.77, "CHAIR-1180"), ride("m2", 0, 0.5, "B 0.93", { then: "B: resale" })],
      concepts: ["model-deployment", "uncertainty-and-calibration"],
      body: ["Both sites now call the same model version, so the same photo gets the same grade at either site.",
        "Among the samples to which a well calibrated binary classifier gives a probability close to 0.8, about 80% belong to the positive class."],
      claims: ["model-deployment-batch-online", "uncertainty-and-calibration-calibrated"],
    }),
    step({
      id: "unfamiliar", label: "Unfamiliar", kind: "watch-out", phase: "execution", title: "Burn marks are unlike anything in training",
      caption: "A table arrives with burn marks. Its embedding lies far from every group of training photos, so it is flagged. An inspector grades it, and the photo becomes a label.",
      show: [...SYSTEM, "emb", "table"], counters: ["the model and inspectors", "6,400, of them 400 generated", "version 4, serving", "low confidence or unfamiliar"],
      rides: [ride("m1", 0, 0.77, "TABLE-3310", { tone: "alert" }), ride("m2", 0, 0.47, "unseen", { tone: "alert" }), ride("il", 0.2, 0.55, "burn", { tone: "alert", then: "C" })],
      concepts: ["clustering-and-anomaly-detection", "representation-and-transfer-learning", "labels-and-ground-truth"],
      body: ["An embedding is a vector representation in which close items are more closely related than distant ones. The network's feature layer supplies it.",
        "Novelty and outlier detection flag observations that are far from the others. The Local Outlier Factor compares the density around a point with the density around its nearest neighbours.",
        "Sending the model's least certain cases to a human annotator is how active learning chooses what to label next."],
      claims: ["representation-and-transfer-learning-embedding", "clustering-and-anomaly-detection-outlier", "clustering-and-anomaly-detection-lof", "clustering-and-anomaly-detection-meaningful", "labels-and-ground-truth-active"],
    }),
    step({
      id: "operate", label: "Operate", kind: "decision", phase: "execution", title: "What keeps the grades right",
      caption: "",
      show: [...SYSTEM, "watch", "ops"], counters: ["the model and inspectors", "6,400 and growing", "version 5 in training", "low confidence or unfamiliar"],
      rides: [ride("w-line", 0, 1, "week 1", { then: "week 9" }), ride("tl", 0, 0.5, "run 13")],
      concepts: ["monitoring-and-drift", "training-pipelines", "labels-and-ground-truth"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["Weekly drift checks against training photos", "Inspector grades fed back as labels", "Label audits between sites"] },
        right: { label: "Do not rely on", items: ["Accuracy measured at launch", "One site's grades as truth"] },
      } },
        "Input drift is a shift in the distribution of the input data. It is detected by comparing current data with a reference, and it may make predictions unreliable.",
        "A pipeline can be triggered on a schedule, on new training data, on degraded performance and on significant changes in the data distributions.",
        "Held-out accuracy assumes the process behind the data stays constant. A new product range or a new kind of damage breaks that assumption."],
      claims: ["monitoring-and-drift-covariate", "monitoring-and-drift-evidently", "monitoring-and-drift-constant", "monitoring-and-drift-triggers", "training-pipelines-triggers", "labels-and-ground-truth-raters"],
    }),
  ],
  governance: { text: "Grades decide refunds, so a photo the model is unsure of or has never seen the like of goes to an inspector. Label agreement is audited between sites.", claims: ["uncertainty-and-calibration-oversight", "clustering-and-anomaly-detection-meaningful", "labels-and-ground-truth-agreement"] },
  closing: {
    pitfalls: [
      "Training on one site's grades and calling them the truth.",
      "Reading a high confidence on unfamiliar damage as a safe grade.",
      "Letting generated photos into the set that measures the model.",
    ],
    questions: [
      "Which part of the system decides what a grade B means?",
      "Why does the burnt table go to an inspector when no confidence score is low?",
      "What would have to be measured before the threshold could be lowered?",
    ],
  },
});
