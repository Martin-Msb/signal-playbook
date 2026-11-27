import { blocks, CANVAS, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Item, Pt, Row } from "@signal-path/engine";

// The floor: orders leave Checkout on one rail and reach the slot where the fraud model is served.
// The slot changes with the serving mode: a batch job, a stream job, an online endpoint. For the two
// pipelines the rail runs on to the fraud scores. For the endpoint the score rides back to Checkout.
// Behind the slot stands the model registry, and a thin line carries a model file from it down to the slot.
// A side rail leaves the main rail at the router, passes a second slot for the new version and ends at
// the response log. The approval gate and the model owner stand on the way from the registry.
const G = isoGrid(418, 312, 30);
const K = "model-deployment";
const IN = -10, SLOT = 2, ROUTE = -3.5, SIDE = -4.6, LOG = 7.2, END = 10, REG = -13.6, GATE = -10;
const CARD: Pt = [176, 510];
const TOP: Pt = [G.p(SLOT, 0)[0], G.p(SLOT, 0)[1] - 34];

/** The model in the main slot, in each of its serving modes. */
const serve = (id: string, title: string, sub: string, glyph: string, hue: "paper" | "track" = "track"): El =>
  prism(id, SLOT - 0.7, -0.7, 1.4, 1.4, 34, { hue, glyph, title, sub, at: "sw", group: id });
/** The new version in the side slot. */
const candidate = (id: string, title: string, sub: string, alert = false): El =>
  prism(id, SLOT - 0.7, SIDE - 0.7, 1.4, 1.4, 34, { hue: "violet", glyph: "net", title, sub, at: "n", state: alert ? "alert" : undefined, group: id });
/** When the score for an order arrives, one row per serving mode seen so far. */
const modes = (id: string, rows: Row[]): El =>
  raise(table(id, 0, 0, 290, ["serving mode", "score arrives"], rows, { at: [12, 142], rowH: 26, title: "Fraud score for an order", group: id }), CARD, 26);
/** Who answers live requests while two versions run side by side. */
const share = (id: string, sub: string, items: Item[]): El =>
  raise(list(id, 0, 0, 232, items, { title: "Live requests", sub, mono: true, group: id }), CARD, 26);
/** The file the registry holds for a version. */
const file = (id: string, name: string): El =>
  pill(id, [G.p(SLOT, REG)[0] - 180, 34], name, { glyph: "file", sub: "portable, from the data team", mono: true, to: [G.p(SLOT, REG)[0] - 24, G.p(SLOT, REG)[1] - 30], group: id });

export default defineGuide({
  id: K, track: "ml", module: "Production", slug: K,
  title: "Model deployment",
  summary: "A registered model predicts once it is served: by a batch job on a schedule, by a stream job on each event, or by an online endpoint on request. A new version runs beside the live one as a shadow and then as a canary before it takes all traffic.",
  forLeads: "The serving mode follows from when the decision needs the prediction. Replacing a live model is a release: someone other than the builder approves it, real traffic tests it in steps, and the previous version stays ready as the way back.",
  status: "draft", minutes: 7,
  counters: ["Served by", "Score arrives", "Live version", "New version answers"],
  whatIf: { label: "What if every score came from the nightly batch?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, scores, versions and rates are illustrative",
    label: "Orders travel on a rail from Checkout to the slot where the fraud model is served. A model registry stands behind the slot and a thin line carries the model file down to it. First a batch job fills the slot, six orders wait beside the rail and the rail runs on to a store of fraud scores. Then a stream job scores an order event as it passes. Then an online endpoint takes a request and the score rides back to Checkout. A card lists when the score arrives in each mode. Next a side rail leaves the main rail at a router and passes a second slot holding version 4, which came through an approval gate with the model owner beside it. A copy of each request ends in a response log. Then version 4 answers one request in twenty, turns red and the traffic returns. At the last stop version 5 answers all requests and version 3 stays as the rollback target.",
    els: [
      prism("checkout", IN - 2.1, -0.7, 1.4, 1.4, 28, { hue: "sand", glyph: "pen", title: "Checkout", sub: "orders all day", at: "n", always: true }),
      line("main", [G.p(IN, 0), G.p(SLOT, 0)], { always: true }),
      stop("s-in", ...G.p(-8.6, 0), undefined, undefined, { always: true }),
      stop("s-back", ...G.p(-7, 0), undefined, undefined, { always: true }),
      stop("s-pre", ...G.p(SLOT - 3, 0), undefined, undefined, { always: true }),

      // the registry and the way a model file takes to the slot
      drum("registry", SLOT, REG, 1, 30, { hue: "sky", glyph: "stack", title: "Model registry", at: "n", always: true }),
      line("spur", [G.p(SLOT, REG + 1), G.p(SLOT, -0.9)], { tone: "ink", w: 3, always: true }),
      file("f3", "fraud-v3.onnx"), file("f4", "fraud-v4.onnx"), file("f5", "fraud-v5.onnx"),

      // 1 and 2. pipelines: the rail runs on to the scores
      line("flow", [G.p(IN, 0), G.p(END - 1.1, 0)], { group: "pipe" }),
      stop("s-out", ...G.p(6.2, 0), undefined, undefined, { group: "pipe" }),
      drum("scores", END, 0, 1, 34, { hue: "sky", glyph: "table", title: "Fraud scores", sub: "read by Finance", at: "e", group: "pipe" }),
      serve("batch", "Batch job", "version 3, nightly", "clock", "paper"),
      blocks("waiting", -7.6, 1.3, 6, 0.7, Array.from({ length: 6 }, () => ({ h: 16, hue: "sand" as const })), { gap: 0.2, title: "Orders since 02:00", sub: "not scored yet", at: "s", group: "batch" }),
      pill("p-night", [440, 96], "Schedule", { glyph: "clock", sub: "every night at 02:00", to: TOP, group: "batch" }),
      serve("stream", "Stream job", "version 3, never stops", "play"),
      pill("p-events", [440, 96], "Order events", { glyph: "lines", sub: "scored as they arrive", to: TOP, group: "stream" }),

      // 3. on request
      serve("endpoint", "Online endpoint", "version 3, always loaded", "net"),
      pill("p-wait", [440, 96], "Response", { glyph: "clock", sub: "Checkout waits 40 ms", to: TOP, group: "endpoint" }),
      modes("m1", [{ cells: ["batch job", "at the 02:00 run"], hot: true }]),
      modes("m2", [["batch job", "at the 02:00 run"], { cells: ["stream job", "after each event"], hot: true }]),
      modes("m3", [["batch job", "at the 02:00 run"], ["stream job", "after each event"], { cells: ["online endpoint", "in the response"], hot: true }]),

      // 4 to 6. two versions side by side
      serve("live", "Version 3", "answers Checkout", "net"),
      serve("standby", "Version 3", "kept as rollback", "replay", "paper"),
      line("side", [G.p(IN, 0), G.p(ROUTE, 0), G.p(ROUTE, SIDE), G.p(LOG - 1.1, SIDE)], { group: "side" }),
      stop("s-route", ...G.p(ROUTE, 0), undefined, undefined, { group: "side" }),
      stop("s-new", ...G.p(SLOT - 2.4, SIDE), undefined, undefined, { group: "side" }),
      stop("s-log", ...G.p(LOG - 2.7, SIDE), undefined, undefined, { group: "side" }),
      drum("log", LOG, SIDE, 0.9, 26, { hue: "paper", glyph: "lines", title: "Response log", sub: "compared offline", at: "s", group: "side" }),
      candidate("v4-shadow", "Version 4", "shadow, logged only"),
      candidate("v4-canary", "Version 4", "alarm trips at 5%", true),
      candidate("v5", "Version 5", "answers Checkout"),
      prism("gate", SLOT - 0.55, GATE - 0.55, 1.1, 1.1, 24, { hue: "track", glyph: "check", title: "Approval gate", sub: "by the model owner", at: "e", group: "side" }),
      pawn("approver", SLOT - 2.2, GATE, undefined, undefined, { group: "side" }),
      share("c-shadow", "shadow test", ["v3 answers   100%", "v4 answers     0%", { t: "v4 logged    100%", hot: true }]),
      share("c-canary", "canary", ["v3 errors    0.2%", { t: "v4 errors    3.1%", hot: true, tone: "alert" }, "v4 share  5% to 0%"]),
      share("c-live", "after promotion", [{ t: "v5 answers   100%", hot: true }, "v3 answers     0%", "v5 errors    0.2%"]),
      pill("a-v3", [650, 440], "Alias: champion", { glyph: "flag", sub: "points to version 3", anchor: "start", to: [G.p(SLOT, 0)[0] + 30, G.p(SLOT, 0)[1] + 8], group: "a-v3" }),
      pill("a-v5", [650, 440], "Alias: champion", { glyph: "flag", sub: "points to version 5", anchor: "start", to: [G.p(SLOT, SIDE)[0] + 14, G.p(SLOT, SIDE)[1] + 22], group: "a-v5" }),
    ],
  },
  steps: [
    step({
      id: "batch", label: "Batch", kind: "problem", title: "Batch scoring leaves a new order without a score",
      caption: "A nightly job loads the fraud model from the registry and scores every order at 02:00. Order 4474, placed at 10:42, ships before its score exists.",
      show: ["pipe", "batch", "f3", "m1"], counters: ["a batch job", "at the 02:00 run", "version 3", "none"],
      rides: [ride("spur", 0.05, 0.62, "fraud-v3.onnx", { then: "loaded" }), ride("flow", "s-in", "s-pre", "4474", { then: "no score", tone: "alert" })],
      body: ["Batch scoring needs no server that waits for calls. On Vertex AI a batch inference is an asynchronous request sent as a BatchPredictionJob directly to the model, which is not deployed to an endpoint. It fits when an immediate response is not required and accumulated data is processed in a single request.",
        "The job reads a file, so the file has to load outside the environment that trained it. The scikit-learn documentation states that pickle-based formats do not support loading a model trained with a different version of scikit-learn, and should only be loaded from a trusted and verified source.",
        "Portable model formats remove the tie to the training code. ONNX is an open format with a common set of operators and a common file format, and the ONNX runtime does not require Python. An MLflow Model packages a model for several downstream tools, and its signature defines the schema of inputs and outputs.",
        { callout: { label: "Key idea", text: "A registered model predicts nothing until something loads it. The serving mode decides when the score exists, and the decision it supports decides the mode." } }],
      claims: [`${K}-batch-online`, `${K}-persistence`, `${K}-onnx`, `${K}-mlflow-model`],
    }),
    step({
      id: "stream", label: "Stream", kind: "idea", title: "A stream job scores each event as it arrives",
      caption: "The same model file runs inside a streaming pipeline. Each order event is scored seconds after it happens, and no caller waits for the answer.",
      show: ["pipe", "stream", "f3", "m2"], counters: ["a stream job", "after each event", "version 3", "none"],
      rides: [ride("flow", "s-in", "s-out", "4474 paid", { via: ["s-pre"], then: "score 0.91" })],
      body: ["The model becomes one step of a pipeline. The Apache Beam RunInference API supports batch and streaming pipelines, with model handlers for scikit-learn, XGBoost, ONNX, PyTorch and TensorFlow among others.",
        "An MLflow Model is built for this reuse: one package can be served in real time through a REST API or run as batch inference on Apache Spark.",
        "Google's MLOps architecture guide lists verifying the compatibility of the model with the target infrastructure before deployment. A model that scored well in training still has to load and run where it is served."],
      claims: [`${K}-stream`, `${K}-mlflow-model`, `${K}-serving-forms`],
    }),
    step({
      id: "request", label: "On request", kind: "mechanism", title: "An online endpoint answers one request at a time",
      caption: "Checkout sends order 4474 and waits. The endpoint keeps the model loaded and returns the score in the response, before the order is accepted.",
      show: ["endpoint", "f3", "m3", "a-v3"], counters: ["an online endpoint", "in the response", "version 3", "none"],
      rides: [ride("main", "s-in", "s-back", "4474?", { via: ["s-pre"], then: "0.91 hold" })],
      body: ["On Vertex AI, online inferences are synchronous requests made to a model that is deployed to an endpoint. They fit requests made in response to application input and situations that require timely inference.",
        "Google's MLOps architecture guide names three forms of serving: microservices with a REST API for online predictions, a model embedded in an edge or mobile device, and part of a batch prediction system.",
        "A registry alias names the version to serve. In the MLflow Model Registry an alias such as champion is a mutable, named reference to one version of a registered model, and each version is linked to the run that produced it.",
        { callout: { label: "Watch out", text: "An endpoint that always answers is also the one place where a bad model reaches every order at once. Replacing what it serves is a release." } }],
      claims: [`${K}-batch-online`, `${K}-serving-forms`, `${K}-alias`],
    }),
    step({
      id: "shadow", label: "Shadow", kind: "mechanism", title: "A shadow model receives a copy of live requests",
      caption: "Version 4 passes the approval gate and runs beside version 3. Only version 3 answers Checkout. Version 4's responses are logged for comparison.",
      show: ["live", "side", "v4-shadow", "f4", "c-shadow", "a-v3"], counters: ["an online endpoint", "in the response", "version 3", "0%, logged only"],
      rides: [ride("spur", 0.05, 0.436, "fraud-v4.onnx", { then: "approved", shape: "pill" }), ride("side", "s-in", "s-log", "copy of 4474", { via: ["s-route", "s-new"], then: "logged" })],
      body: ["In an Amazon SageMaker AI shadow test the new variant is deployed in shadow mode and a copy of the inference requests is routed to it in real time within the same endpoint. Only the responses of the production variant are returned to the calling application. The shadow responses are discarded or logged for offline comparison.",
        "AWS describes the use: a model validated offline is evaluated on operational metrics such as latency and error rate before promotion, without any end user impact.",
        { callout: { label: "Control", text: "The approval is a recorded state, not a message. In the SageMaker AI Model Registry, changing a version from PendingManualApproval to Approved initiates its CI/CD deployment. In GitHub Actions, a setting stops the user who initiated a deployment from approving it." } },
        "No order is decided by a shadow model, so a shadow test cannot show what happens when its scores are acted on. That takes a canary."],
      claims: [`${K}-shadow`, `${K}-approval`, `${K}-reviewers`],
    }),
    step({
      id: "canary", label: "Canary", kind: "watch-out", title: "A canary answers a small share of real requests",
      caption: "Version 4 now answers 1 request in 20. Its error alarm trips, and the router returns all traffic to version 3.",
      show: ["live", "side", "v4-canary", "f4", "c-canary", "a-v3"], counters: ["an online endpoint", "in the response", "version 3", "5%, rolled back"],
      rides: [ride("side", "s-in", "s-route", "1 in 20", { via: ["s-new"], then: "back to v3", tone: "alert" })],
      body: ["The Google Site Reliability Workbook defines canarying as a partial and time-limited deployment of a change and its evaluation. The part that receives the change is the canary and the rest is the control. A canary error rate too far from the control's signals a bad deployment, and the response is to pause and roll back.",
        "Serving platforms automate the step. With canary traffic shifting in Amazon SageMaker AI, alarms watch the new fleet during a baking period. If any alarm trips, all traffic returns to the old fleet, and any issue with the updated model only impacts the canary.",
        "In KServe the canaryTrafficPercent field sets the share of traffic for the new revision. KServe tracks the last good revision that was rolled out with 100% traffic, and a rollback pins all traffic to it.",
        { callout: { label: "Key idea", text: "A rollback plan is a previous version that still runs. Google's MLOps architecture guide lists, in the metadata of each pipeline run, a pointer to the previous trained model in case a rollback is needed." } }],
      claims: [`${K}-canary`, `${K}-canary-shift`, `${K}-canary-kserve`, `${K}-online-validation`],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "The new version replaces the old one after both tests",
      caption: "",
      show: ["standby", "side", "v5", "f5", "c-live", "a-v5"], counters: ["an online endpoint", "in the response", "version 5", "100%"],
      rides: [ride("spur", 0.05, 0.436, "fraud-v5.onnx", { then: "approved", shape: "pill" }), ride("side", "s-in", "s-back", "4475?", { via: ["s-route", "s-new"], then: "0.08 pass" })],
      body: [{ pair: {
        left: { label: "Promote", items: ["Approver is not the builder", "Shadow and canary clean", "Old version kept loaded"] },
        right: { label: "Roll back", items: ["Canary alarm trips", "Traffic returns to old version", "Alias moved back"] },
      } },
        "Promotion is a change of reference. In the MLflow Model Registry the model serving production traffic is updated by reassigning the champion alias to a different version. The alias is mutable, so it can be reassigned to the previous version.",
        "In Amazon SageMaker AI the old fleet is terminated only after a final baking period with no alarm. Until then it remains the way back.",
        "Google's MLOps architecture guide has a newly deployed model undergo online validation in a canary deployment or an A/B testing setup before it serves the online traffic, and lists manual deployment to production after several successful runs on the pre-production environment.",
        { callout: { label: "Control", text: "The NIST AI Risk Management Framework asks for a determination of whether deployment should proceed, for assessment by people who were not front-line developers of the system, and for assigned responsibility to supersede or deactivate a system that performs inconsistently with its intended use." } }],
      claims: [`${K}-alias`, `${K}-canary-shift`, `${K}-online-validation`, `${K}-nist-proceed`, `${K}-nist-supersede`, `${K}-reviewers`],
    }),
  ],
  governance: { text: "The approval gate separates the builder from the approver: the NIST AI Risk Management Framework expects a determination of whether deployment should proceed and assessment by people who did not develop the system, and deployment tools can stop the person who initiated a deployment from approving it. The rollback plan is the previous version, kept ready, with assigned responsibility to supersede a model that performs inconsistently with its intended use.", claims: [`${K}-nist-proceed`, `${K}-nist-supersede`, `${K}-reviewers`, `${K}-approval`] },
  closing: {
    pitfalls: [
      "Serving a score from a nightly batch to a decision that is made within seconds.",
      "Replacing the live model in one step, with the previous version already removed.",
      "Letting the person who trained a model approve its own release.",
    ],
    questions: [
      "When does each of your decisions need its prediction, and which serving mode delivers it by then?",
      "What does a canary show that a shadow test cannot?",
      "Which version would serve tomorrow if the current one failed tonight, and who may switch to it?",
    ],
  },
});
