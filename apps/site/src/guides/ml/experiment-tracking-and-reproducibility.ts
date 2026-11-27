import { blocks, CANVAS, code, cells, defineGuide, drum, isoGrid, line, node, pawn, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { Hue, Row } from "@signal-path/engine";

// One training run rides the rail from its four inputs through training to its result.
// The run record on the right fills one input at a time. A result is reproducible when all four rows are filled.
// The last stops add a registry and walk a prediction back down the chain to the data.
const G = isoGrid(290, 150, 30);
const S = { in: 0, train: 6, result: 12, registry: 14.7, serve: 18.5 };

type Input = "data" | "code" | "config" | "environment";
const HUE: Record<Input, Hue> = { data: "sky", code: "violet", config: "sand", environment: "mint" };
const ORDER: Input[] = ["data", "code", "config", "environment"];
const VALUE: Record<Input, string> = { data: "orders v1 9f2c", code: "commit a41c9e7", config: "depth 5, rate 0.05", environment: "requirements.txt" };

/** The four inputs as floor blocks: paper while unrecorded, coloured once the run records them. */
const inputs = (group: string, known: Input[], alert?: Input) =>
  blocks(`in-${group}`, -3.6, -4, 4, 1.25, ORDER.map((k) => ({ h: 26, label: k === "environment" ? "env" : k, hue: known.includes(k) ? HUE[k] : "paper", state: k === alert ? "alert" as const : undefined })), { dir: "gy", gap: 0.9, group });

/** The run record: one row per input, muted until recorded, lit at the stop where it is filled. */
const record = (group: string, known: Input[], fresh: Input[], sub: string, score = "0.84") => {
  const rows: Row[] = ORDER.map((k) => (known.includes(k) ? { cells: [k, VALUE[k]], hue: HUE[k], hot: fresh.includes(k) } : { cells: [k, "not recorded"], mute: true }));
  rows.push({ cells: ["score", score] });
  return raise(table(`rec-${group}`, 0, 0, 300, ["input", "recorded as"], rows, { at: [16, 128], rowH: 27, title: "Run 31", sub, group }), [800, 228], 26);
};

const T = { x: 190, ys: [275, 350, 425, 500] };

export default defineGuide({
  id: "experiment-tracking-and-reproducibility", track: "ml", module: "Production", slug: "experiment-tracking-and-reproducibility",
  title: "Experiment tracking and reproducibility",
  summary: "A training result counts when the data, code, configuration and environment behind it are recorded well enough to produce it again. Tracking, versioning and a registry keep that record.",
  forLeads: "Ask of any reported score which data version, commit, settings and environment produced it, and whether a prediction in production can be walked back to them.",
  status: "draft", minutes: 6,
  counters: ["Inputs recorded", "Rerun of 0.84", "Model version", "Prediction traces to"],
  whatIf: { label: "What if the run kept only its score?", step: 0, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Runs, scores, hashes and versions are illustrative",
    label: "A rail runs from four input blocks, data, code, configuration and environment, through a training block to a result. A run record card lists the four inputs and the score. At first only the score is kept and a rerun gives a different score. A tracking store then records the commit and settings, versioning records the exact data, and the saved environment file completes the record, so the rerun matches. A model registry links a served model version to its run, and a prediction for an order is traced back through the model version and the run to the data version.",
    els: [
      line("flow", [G.p(S.in, 0), G.p(S.train, 0), G.p(S.result, 0)], { always: true }),
      stop("in", ...G.p(S.in, 0), undefined, undefined, { big: true, always: true }),
      stop("train", ...G.p(S.train, 0), undefined, undefined, { always: true }),
      stop("result", ...G.p(S.result, 0), undefined, undefined, { big: true, always: true }),
      prism("trainer", S.train - 0.6, -4.4, 1.9, 1.6, 32, { hue: "track", glyph: "net", title: "Training", sub: "refund risk model", at: "n", always: true }),

      inputs("none", []),
      inputs("two", ["code", "config"]),
      inputs("three", ["data", "code", "config"]),
      inputs("drift", ["data", "code", "config"], "environment"),
      inputs("all", ORDER),

      record("none", [], [], "only the score was kept"),
      record("two", ["code", "config"], ["code", "config"], "logged by the run"),
      record("three", ["data", "code", "config"], ["data"], "data pinned by version"),
      record("four", ORDER, ["environment"], "environment saved"),
      record("full", ORDER, [], "all four inputs recorded"),

      drum("store", S.result - 0.4, 3, 1.15, 30, { hue: "sand", glyph: "database", title: "Tracking store", sub: "MLflow, W&B", at: "s", group: "store" }),

      // Versions by content: the changed dataset is a new version, the old one stays.
      cells("versions", 60, 345, 2, [150, 44], [{ t: "v0  3f9a", mute: true }, { t: "v1  9f2c", hot: true, hue: "sky" }, { t: "v0  77b1", mute: true }, { t: "v1  c4e0", hot: true, hue: "track" }], { title: "Versions", sub: "orders data above, model below", gap: 8, group: "versions" }),

      // The environment file saved with the model.
      code("envfile", 60, 350, 310, ["python 3.13", "torch==2.15.0", "numpy==2.4.1", "device: gpu"], { title: "Environment", sub: "saved with the model", hot: [1], group: "envfile" }),

      // Registry and serving, and the trail from a prediction back to the data.
      line("release", [G.p(S.result, 0), G.p(S.registry, 0), G.p(S.serve, 0)], { group: "registry" }),
      stop("reg", ...G.p(S.registry, 0), undefined, undefined, { group: "registry" }),
      stop("serve", ...G.p(S.serve, 0), undefined, undefined, { big: true, group: "registry" }),
      prism("registry-block", 14.4, 1.8, 1.8, 1.5, 28, { hue: "track", glyph: "stack", title: "Model registry", sub: "refund-risk v1", at: "s", group: "registry" }),
      pawn("support", S.serve + 1.6, 0, "Support", undefined, { group: "registry" }),
      pawn("asker", 8.3, 9.7, "Data team", "Which data? Which code?", { group: "ask" }),

      line("trail", T.ys.map((y) => [T.x, y] as [number, number]), { tone: "ink", w: 3, group: "trail" }),
      node("t-pred", T.x, T.ys[0], "prediction 4471: review", { shape: "box", mono: true, group: "trail" }),
      node("t-model", T.x, T.ys[1], "refund-risk v1", { shape: "box", mono: true, hue: "track", group: "trail" }),
      node("t-run", T.x, T.ys[2], "run 31, commit a41c9e7", { shape: "box", mono: true, hue: "sand", group: "trail" }),
      node("t-data", T.x, T.ys[3], "orders v1 9f2c", { shape: "box", mono: true, hue: "sky", group: "trail" }),
    ],
  },
  steps: [
    step({
      id: "score", label: "Score", kind: "problem", title: "A score without its inputs cannot be produced again",
      caption: "The tuned model scored 0.84. Nobody kept which data, code, settings or environment made it, and the rerun scores 0.81.",
      show: ["none", "rec-none", "ask"], counters: ["0 of 4", "0.81", "none", "nothing"],
      rides: [ride("flow", "in", "result", "run 31", { via: ["train"], then: "0.84" }), ride("flow", "in", 0.74, "rerun", { via: ["train"], then: "0.81", tone: "alert" })],
      body: ["Reproducibility is obtaining similar results using the same code and data. It is a necessary step to verify the reliability of a finding, so a score that cannot be obtained again is not yet evidence for choosing a model."],
      claims: ["experiment-tracking-and-reproducibility-definition"],
    }),
    step({
      id: "run", label: "Run", kind: "idea", title: "A tracked run logs its code and settings with its score",
      caption: "Each training run writes its commit, parameters and metrics to a tracking store. Two of the four inputs are now on record.",
      show: ["two", "rec-two", "store"], counters: ["2 of 4", "0.81", "none", "nothing"],
      rides: [ride("flow", "in", "result", "run 31", { via: ["train"], then: "0.84 logged" })],
      body: [
        "MLflow Tracking is an API and UI for logging parameters, code versions, metrics and output files. Each run records its metadata and its artifacts, such as model weights, and an experiment groups the runs for one task. Weights and Biases also organises work as runs, with versioned artifacts as their inputs and outputs.",
        "MLflow sets system tags that capture execution context without being asked: the source file or notebook name and, when the run starts from a git repository, the git commit hash.",
        { callout: { label: "Key idea", text: "The run, not the notebook or the slide, is the unit of evidence. Every candidate from a search is a run, including the ones that lost." } },
      ],
      claims: ["experiment-tracking-and-reproducibility-run", "experiment-tracking-and-reproducibility-commit", "experiment-tracking-and-reproducibility-artifacts"],
    }),
    step({
      id: "versions", label: "Versions", kind: "mechanism", title: "Data and models are versioned by their content",
      caption: "The run names the exact orders data it read and the model it wrote. Changed contents become a new version and the old one stays.",
      show: ["three", "rec-three", "store", "versions"], counters: ["3 of 4", "0.82", "v1", "nothing"],
      rides: [ride("flow", "in", "result", "orders v1", { via: ["train"], then: "model v1" })],
      body: [
        "W&B Artifacts track and version data as the inputs and outputs of runs. A new artifact is v0. Logging to it again checksums the contents, and a changed artifact is saved as v1.",
        "An MLflow dataset logged to a run carries a name, a computed digest that fingerprints it and a source that points to the original location. DVC keeps a small .dvc file in Git that stands in for the data, so a commit pins the data version together with the code.",
      ],
      claims: ["experiment-tracking-and-reproducibility-artifacts", "experiment-tracking-and-reproducibility-dataset", "experiment-tracking-and-reproducibility-dvc"],
    }),
    step({
      id: "environment", label: "Environment", kind: "watch-out", title: "A fixed seed does not fix the environment",
      caption: "The same data, code and seed on another library release score 0.82. Saving the environment with the model completes the record.",
      show: ["drift", "rec-four", "store", "envfile"], counters: ["4 of 4", "0.84 in the saved environment", "v1", "nothing"],
      rides: [ride("flow", "in", "result", "seed 7", { via: ["train"], then: "0.82", tone: "alert" })],
      body: [
        "The PyTorch documentation states that completely reproducible results are not guaranteed across releases, individual commits or platforms, and that CPU and GPU executions may differ even with identical seeds. Seeding and avoiding nondeterministic algorithms limit the sources of nondeterminism on one platform, device and release.",
        "When a model is logged, MLflow automatically logs conda.yaml, python_env.yaml and requirements.txt so the environment can be recreated.",
      ],
      claims: ["experiment-tracking-and-reproducibility-nondeterminism", "experiment-tracking-and-reproducibility-environment"],
    }),
    step({
      id: "registry", label: "Registry", kind: "mechanism", title: "A registered model version points back to its run",
      caption: "Support asks why order 4471 went to review. The prediction names its model version, the version names its run, and the run names its data.",
      show: ["all", "rec-full", "store", "registry", "trail"], counters: ["4 of 4", "0.84", "v1, registered", "run 31 and orders v1"],
      rides: [ride("release", "result", 0.8, "model v1", { via: ["reg"], then: "4471: review" }), ride("trail", 0.165, 0.835, "4471", { shape: "pill", via: [0.5], then: "traced" })],
      body: [
        "The MLflow Model Registry records lineage for each model: which experiment and run produced it. A registered model has a unique name and holds versions, aliases and tags. An alias is a mutable, named reference to one version.",
        "The saved model can carry the ID of the run that created it, which is the link the trail follows.",
      ],
      claims: ["experiment-tracking-and-reproducibility-registry", "experiment-tracking-and-reproducibility-environment", "experiment-tracking-and-reproducibility-provenance"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Accept a result only with its record",
      caption: "",
      show: ["all", "rec-full", "store", "registry", "trail"], counters: ["4 of 4", "0.84", "v1, registered", "run 31 and orders v1"],
      rides: [ride("flow", "in", "result", "run 32", { via: ["train"], then: "0.85 logged" }), ride("release", "result", 0.8, "model v2", { via: ["reg"] })],
      body: [{ pair: {
        left: { label: "Every run records", items: ["Data version", "Commit and settings", "Environment and seed"] },
        right: { label: "Every served model keeps", items: ["Registry version", "Link to its run", "Version on each prediction"] },
      } }, "For high-risk AI systems, Article 12 of the EU AI Act requires that the system technically allows automatic recording of events over its lifetime. Under the text as amended in July 2026 this applies from 2 December 2027 for Annex III systems and from 2 August 2028 for Annex I systems."],
      claims: ["experiment-tracking-and-reproducibility-run", "experiment-tracking-and-reproducibility-registry", "experiment-tracking-and-reproducibility-logs"],
    }),
  ],
  governance: {
    text: "A prediction that carries its model version can be walked back through the registry to the run and the training data version. NIST names maintaining training data provenance as a support for transparency and accountability, and the EU AI Act requires high-risk systems to allow automatic event logging over their lifetime.",
    claims: ["experiment-tracking-and-reproducibility-registry", "experiment-tracking-and-reproducibility-provenance", "experiment-tracking-and-reproducibility-logs"],
  },
  closing: {
    pitfalls: [
      "Logging metrics and parameters while the training data stays an unversioned path that changes underneath.",
      "Treating a fixed seed as a guarantee when the library release, platform or device has changed.",
      "Serving a model file copied by hand, so no prediction can name the version or run behind it.",
    ],
    questions: [
      "Which data version, commit, settings and environment produced the score being reported?",
      "Can someone else rerun the winning run and obtain a similar result?",
      "Given one prediction, which model version made it and which data trained that version?",
    ],
  },
});
