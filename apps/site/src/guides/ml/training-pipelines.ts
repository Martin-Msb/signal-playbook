import { CANVAS, defineGuide, drum, isoGrid, line, list, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Pt, Row } from "@signal-path/engine";

// One rail runs from the order history to the model registry. A training run is the record that rides it.
// At first one notebook stands on the rail. Then four pipeline steps take its place, an orchestrator starts
// each run from the back, a card at the front lists the triggers and then the model checks, and the registry
// card at the back shows what each model version traces to. The pipeline repository joins at the last stop.
const G = isoGrid(90, 165, 32);
const K = "training-pipelines";
const AT = { join: 2.4, check: 5.1, a: 6.45, feat: 7.8, b: 9.15, train: 10.5, c: 12.1, gate: 13.7, d: 16.3, reg: 17.9, end: 20.1 };
const BACK = -5.2, REPO = 7.8;
const on = (gx: number): Pt => G.p(gx, 0);
const REGISTRY: Pt = [766, 262], FRONT: Pt = [250, 530];

const task = (id: string, gx: number, glyph: string, title: string, sub: string, group: string, alert = false, at: "n" | "sw" = "n"): El =>
  prism(id, gx - 0.65, -0.65, 1.3, 1.3, 28, { hue: "track", glyph, title, sub, at, group, state: alert ? "alert" : undefined });

/** The registry entry for the returns model: what each version traces to. */
const registry = (id: string, sub: string, rows: Row[], alert = false): El =>
  raise(table(id, 0, 0, 372, ["version", "data", "code", "approval"], rows, { at: [12, 92, 196, 284], rowH: 30, mono: true, title: "Model registry", sub, tone: alert ? "alert" : undefined, group: id }), REGISTRY, 30);

export default defineGuide({
  id: K, track: "ml", module: "Production", slug: K,
  title: "Training pipelines",
  summary: "A training pipeline runs data validation, feature engineering, training and model validation as one automated unit. A schedule or a trigger starts each run, gates stop bad data and weaker models, and the registry records what each model version traces to.",
  forLeads: "Retraining becomes routine when no step depends on a person's memory. The gates and the registry entry are the controls: they decide what may be released and prove where each version came from.",
  status: "draft", minutes: 7,
  counters: ["Automated steps", "Run starts", "Gates passed", "Model version"],
  whatIf: { label: "What if no gate checked the run?", step: 2, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Runs, versions and scores are illustrative",
    label: "A rail runs from the Vinterhus order history to a model registry. At first a data scientist runs every step in one notebook and uploads version 3 of the returns model, which has no record of its data or code. Then four pipeline steps stand on the rail: validate data, features, train and validate model. An orchestrator starts each run, on a schedule or when monitoring reports drift. One run stops at the data check with a schema skew. The next passes the model check against version 3 and is registered as version 4, with its data, code and approval. At the last stop the pipeline code itself arrives through a repository with CI and CD.",
    els: [
      line("main", [on(1.1), on(AT.end - 1.1)], { always: true }),
      line("start", [G.p(AT.join, BACK + 0.9), on(AT.join), on(AT.end - 1.1)], { group: "pipe" }),
      line("release", [G.p(REPO - 0.8, BACK), G.p(AT.join + 0.9, BACK)], { group: "cicd" }),
      stop("s-in", ...on(AT.join), undefined, undefined, { group: "pipe" }),
      stop("s-a", ...on(AT.a), undefined, undefined, { group: "pipe" }),
      stop("s-b", ...on(AT.b), undefined, undefined, { group: "pipe" }),
      stop("s-c", ...on(AT.c), undefined, undefined, { group: "pipe" }),
      stop("s-d", ...on(AT.d), undefined, undefined, { always: true }),
      stop("s-reg", ...on(AT.reg), undefined, undefined, { always: true }),

      drum("orders", 0, 0, 1.05, 40, { hue: "sky", glyph: "table", title: "Order history", sub: "labelled returns", at: "sw", always: true }),
      drum("registry", AT.end, 0, 1.05, 40, { hue: "sand", glyph: "stack", title: "Model registry", sub: "returns-model", at: "e", always: true }),

      prism("notebook", AT.b - 0.8, -0.8, 1.6, 1.6, 30, { hue: "paper", glyph: "code", title: "Notebook", sub: "every step by hand", at: "n", group: "manual" }),
      pawn("scientist", 7.2, 6.2, "Data scientist", "runs, waits, uploads", { group: "manual" }),

      task("check", AT.check, "search", "Validate data", "schema, stats", "steps", false, "sw"),
      task("check-x", AT.check, "search", "Validate data", "schema skew", "stopped", true, "sw"),
      task("feat", AT.feat, "merge", "Features", "fit on train", "pipe"),
      task("train", AT.train, "net", "Train", "returns model", "pipe"),
      task("gate", AT.gate, "shield", "Validate model", "against v3", "pipe"),

      prism("orch", AT.join - 0.75, BACK - 0.75, 1.5, 1.5, 34, { hue: "sand", glyph: "gear", title: "Orchestrator", sub: "starts each run", at: "w", group: "pipe" }),
      pill("clock", [470, 104], "Mon 02:00", { sub: "weekly schedule", glyph: "clock", mono: true, group: "triggers" }),
      prism("repo", REPO - 0.7, BACK - 0.7, 1.4, 1.4, 28, { hue: "violet", glyph: "code", title: "Pipeline repo", sub: "CI, then CD", at: "n", group: "cicd" }),

      raise(list("t-list", 0, 0, 250, ["on demand", { t: "on a schedule", hot: true }, "new training data", "performance drop", { t: "data drift", hot: true }], { title: "Pipeline triggers", sub: "each starts a run", group: "triggers" }), FRONT, 26),
      raise(table("t-gate", 0, 0, 290, ["check", "v3", "run 45"], [
        { cells: ["AUC, all orders", "0.81", "0.84"], hot: true }, ["AUC, store", "0.78", "0.82"], ["serving test", "", "pass"],
      ], { at: [12, 158, 218], rowH: 30, title: "Model validation", sub: "candidate against v3", group: "checks" }), FRONT, 26),

      registry("r-hand", "uploaded by hand", [{ cells: ["v3", "?", "?", "none"], hot: true }], true),
      registry("r-traced", "returns-model", [["v3", "?", "?", "none"], { cells: ["v4", "orders w47", "3f9c2a1", "owner"], hot: true }]),
      pawn("owner", 17.6, -4.6, "Model owner", "approves v4", { group: "approve" }),
    ],
  },
  steps: [
    step({
      id: "manual", label: "By hand", kind: "problem", title: "Every step of retraining is run by hand",
      caption: "A data scientist runs each step in a notebook, then uploads the model. Version 3 has no record of its data or code.",
      show: ["manual", "r-hand"], counters: ["0 of 4", "by hand", "none", "v3"],
      rides: [ride("main", 0, "s-reg", "by hand", { via: ["s-d"], then: "v3" })],
      body: ["Vinterhus predicts which orders come back with a returns model. Its experiments are tracked and its features are fitted on training rows, but each retraining is still a person working through a notebook.",
        "Google's MLOps guidance calls this manual process level 0. Every step is manual, including data analysis, data preparation, model training and validation, with manual transition from one step to another. The process assumes models that do not change frequently, and a new model version is deployed only a couple of times per year."],
      claims: [`${K}-manual`],
    }),
    step({
      id: "pipeline", label: "Pipeline", kind: "idea", title: "A pipeline runs the steps as one unit",
      caption: "Each step becomes a component. An orchestrator starts run 41 and passes it from step to step without a person.",
      show: ["pipe", "steps"], counters: ["4 of 4", "on demand", "none", "v3"],
      rides: [ride("start", 0, "s-d", "run 41", { via: ["s-in", "s-a", "s-b", "s-c"], then: "candidate" })],
      body: ["The goal of MLOps level 1 is continuous training of the model by automating the ML pipeline. The steps are orchestrated and the transition between steps is automated.",
        "A TFX pipeline is a sequence of components. It typically includes ExampleValidator, which looks for anomalies and missing values in the dataset, Transform, which performs feature engineering, Trainer, which trains the model, and Evaluator, which helps validate exported models. TFX pipelines can be orchestrated on Apache Airflow, Apache Beam and Kubeflow Pipelines.",
        { callout: { label: "Key idea", text: "In Kubeflow Pipelines a run is a single execution of a pipeline. The pipeline is defined once and every run executes the same steps." } }],
      claims: [`${K}-automation`, `${K}-components`, `${K}-run`],
    }),
    step({
      id: "triggers", label: "Triggers", kind: "mechanism", title: "A schedule or a trigger starts each run",
      caption: "Run 42 starts on Monday's schedule. Run 43 starts when monitoring reports that the order data has shifted.",
      show: ["pipe", "steps", "triggers"], counters: ["4 of 4", "schedule, trigger", "none", "v3"],
      rides: [ride("start", 0, "s-d", "run 42", { via: ["s-in", "s-a", "s-b", "s-c"] }), ride("start", 0, "s-in", "run 43", { then: "drift" })],
      body: ["Production pipelines can be automated to retrain models on demand, on a schedule, on availability of new training data, on model performance degradation, and on significant changes in the data distributions.",
        "A Kubeflow Pipelines recurring run is a repeatable run of a pipeline. Its configuration includes a copy of a pipeline with all parameter values specified and a run trigger."],
      claims: [`${K}-triggers`, `${K}-run`],
    }),
    step({
      id: "gates", label: "Gates", kind: "watch-out", title: "Gates stop bad data and a weaker model",
      caption: "Run 44 stops at the data check with a schema skew. Run 45 trains, and its model must beat version 3 to pass.",
      show: ["pipe", "stopped", "checks"], counters: ["4 of 4", "schedule, trigger", "2 of 2 by run 45", "v3"],
      rides: [ride("start", 0, "s-in", "run 44", { then: "stopped", tone: "alert" }), ride("start", "s-in", "s-d", "run 45", { via: ["s-a", "s-b", "s-c"], then: "AUC 0.84" })],
      body: ["Automating retraining on new data requires automated data and model validation steps in the pipeline. Data validation is required before training to decide whether to retrain the model or stop the pipeline. Input data that does not comply with the expected schema is an anomaly, and the pipeline should stop so the data science team can investigate.",
        "Offline model validation occurs after training and before promotion. It produces evaluation metric values on a test dataset, compares them with the current model, checks that performance is consistent on various segments of the data, and tests the model for deployment, including infrastructure compatibility.",
        "In TFX, model validation is performed by passing both a candidate and a baseline model to the Evaluator component. Thresholds may then be applied and used to gate pushing models to production."],
      claims: [`${K}-automation`, `${K}-data-validation`, `${K}-model-validation`, `${K}-evaluator-gate`],
    }),
    step({
      id: "register", label: "Register", kind: "mechanism", title: "The registry records what a version traces to",
      caption: "The model from run 45 becomes version 4. Its entry links the data, the code and the owner's approval.",
      show: ["pipe", "steps", "checks", "r-traced", "approve"], counters: ["4 of 4", "schedule, trigger", "2 of 2", "v4"],
      rides: [ride("main", "s-d", "s-reg", "run 45", { then: "v4" })],
      body: ["Each time the pipeline executes, the ML metadata store records the pipeline and component versions that were executed, the executor, the parameter arguments, pointers to the artifacts produced by each step, a pointer to the previous trained model and the evaluation metrics.",
        "ML Metadata records every artifact that an execution used and produced, so it can recurse back from any artifact to all of its upstream inputs. It answers which dataset a model trained on and which pipeline run created it.",
        "The MLflow Model Registry provides lineage, meaning which experiment and run produced the model, with versioning, aliasing and tagging. Each new model registered to the same name increments the version number. A version cleared for deployment can carry the tag validation_status:approved, and an alias such as champion is a mutable reference to one version."],
      claims: [`${K}-metadata`, `${K}-lineage`, `${K}-registry`, `${K}-approval`],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Automate the run and control the result",
      caption: "",
      show: ["pipe", "steps", "checks", "r-traced", "approve", "cicd"], counters: ["4 of 4", "schedule, trigger", "2 of 2", "v4, traced"],
      rides: [ride("release", 0, 0.55, "commit", { then: "tested" })],
      body: [{ pair: {
        left: { label: "Automate", items: ["Steps and their order", "Triggers for retraining", "CI/CD for pipeline code"] },
        right: { label: "Control", items: ["Data and model gates", "Lineage for every version", "Approval before release"] },
      } },
        "The pipeline is software and changes like software. In MLOps level 2 an automated CI/CD system builds, tests and deploys new pipeline components. Pipeline continuous integration builds source code and runs tests, pipeline continuous delivery deploys the artifacts to the target environment, and automated triggering executes the pipeline in production and pushes the trained model to the model registry."],
      claims: [`${K}-cicd`, `${K}-triggers`, `${K}-model-validation`, `${K}-lineage`, `${K}-approval`],
    }),
  ],
  governance: { text: "Each pipeline run records its component versions, parameters and artifacts, so a model can be traced back to the dataset and the run that produced it. The registry holds each version with that lineage and a tag for its approval.", claims: [`${K}-metadata`, `${K}-lineage`, `${K}-registry`, `${K}-approval`] },
  closing: {
    pitfalls: [
      "Automating retraining without a data check, so a broken feed trains a model.",
      "Registering a model that was never compared with the one in production.",
      "Changing pipeline code in production without tests or review.",
    ],
    questions: [
      "What starts a retraining run, and who can start one on demand?",
      "Which checks must a candidate pass before it is registered?",
      "Can each model version be traced to its data, code and approval?",
    ],
  },
});
