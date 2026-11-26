import { CANVAS, defineGuide, isoGrid, line, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(115, 190, 30);
const P = (x: number, y = 0) => G.p(x, y);

export default defineGuide({
  id: "serving-data-to-ml-and-ai", track: "data", module: "Serving", slug: "serving-data-to-ml-and-ai",
  title: "Serving data to ML and AI",
  summary: "Training and production need matching features. AI retrieval needs governed documents and embeddings that stay current.",
  forLeads: "A model is only as useful as the data it can reach at prediction time. Keep feature definitions, retrieval indexes and access rules in the data platform's operating path.",
  status: "draft", minutes: 7,
  counters: ["Feature time", "Serving path", "Policy version", "Document index"],
  whatIf: { label: "What if training sees tomorrow's values?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order and document examples are illustrative",
    label: "An order enters a feature pipeline for a returns model. Historical joins select values available at the order time, while current values are materialised for inference. A policy document is embedded and indexed for the refund assistant, with access and deletion controls carried through.",
    els: [
      line("rail", [P(0, 0), P(20, 0)], { always: true }),
      line("docs-rail", [P(7, 4), P(18, 4)], { always: true }),
      stop("src", ...P(0, 0), undefined, undefined, { big: true, always: true }),
      stop("hist", ...P(6.5, 0), undefined, undefined, { always: true }),
      stop("online", ...P(13, 0), undefined, undefined, { always: true }),
      stop("model", ...P(19.2, 0), undefined, undefined, { always: true }),
      stop("doc", ...P(7, 4), undefined, undefined, { always: true }),
      stop("embed", ...P(11.5, 4), undefined, undefined, { always: true }),
      stop("index", ...P(16, 4), undefined, undefined, { always: true }),
    ],
  },
  steps: [
    step({
      id: "mismatch", label: "Mismatch", kind: "problem", title: "Training and serving use different values",
      caption: "Order 4471 is scored with features assembled by a separate production path. If that path computes a different value from training, the model sees a different input.",
      show: [], counters: ["past snapshot", "separate code", "none", "none"],
      rides: [ride("rail", "src", "model", "4471" )],
      body: ["Vinterhus trains a returns model from order history and uses it when a new order arrives. Feast supports historical feature retrieval for training and online retrieval for inference."] ,
      claims: ["serving-data-to-ml-and-ai-historical-and-online-retrieval"],
    }),
    step({
      id: "time", label: "Time join", kind: "idea", title: "Join features as they existed then",
      caption: "A point-in-time join looks backwards from each order timestamp and selects the latest eligible feature values. Later corrections cannot silently rewrite the training view when availability time is also checked.",
      show: [], counters: ["order timestamp", "historical join", "none", "none"],
      rides: [ride("rail", "src", "hist", "4471", { then: "4471 at order time" })],
      body: ["Feast describes point-in-time joins as reproducing feature state at a past time. Its created-timestamp filter can limit a row to values already available at that entity timestamp."],
      claims: ["serving-data-to-ml-and-ai-point-in-time-join"],
    }),
    step({
      id: "feature-store", label: "Feature store", kind: "mechanism", title: "One feature view serves two paths",
      caption: "Historical values build training data. The online store supplies feature values for real-time inference, so the model asks for named features rather than reimplementing their definitions.",
      show: [], counters: ["order timestamp", "offline and online", "none", "none"],
      rides: [ride("rail", "hist", "online", "returns count")],
      body: ["Feast documents separate offline and online retrieval: historical extraction supports training, and online retrieval supports real-time model predictions. The pipeline that computes features still needs to keep both stores current."],
      claims: ["serving-data-to-ml-and-ai-offline-online-stores"],
    }),
    step({
      id: "inference", label: "Inference", kind: "mechanism", title: "Serve current features to the model",
      caption: "The online store holds the latest materialised features for lookup by entity. The model receives those values at prediction time, following the production feature path.",
      show: [], counters: ["latest values", "online lookup", "none", "none"],
      rides: [ride("rail", "online", "model", "4471 features")],
      body: ["Feast says it pushes feature values to the online store for lower-latency retrieval. This requires an upstream pipeline to make feature values consistently available; Feast is not an orchestrator."],
      claims: ["serving-data-to-ml-and-ai-online-serving-push", "serving-data-to-ml-and-ai-pipeline-keeps-features-current"],
    }),
    step({
      id: "documents", label: "Documents", kind: "watch-out", title: "The refund assistant needs current policy text",
      caption: "The refund assistant retrieves policy passages from an embedding index. When policy text changes, its embeddings and indexed records need updating too, or retrieval may return old guidance.",
      show: [], counters: ["latest values", "online lookup", "none", "rebuild on change"],
      rides: [ride("docs-rail", "doc", "embed", "return policy"), ride("docs-rail", "embed", "index", "policy passages")],
      body: ["Qdrant stores points as vectors with optional payload and supports upserting and deleting points. Payload filters can apply additional conditions during retrieval, such as business rules not represented by an embedding."],
      claims: ["serving-data-to-ml-and-ai-vector-record-updates", "serving-data-to-ml-and-ai-vector-filtering"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Keep serving governed and fresh",
      caption: "",
      show: [], counters: ["latest values", "online lookup", "access rules", "refresh and delete"],
      rides: [ride("docs-rail", "doc", "index", "current policy")],
      body: [{ pair: {
        left: { label: "Keep aligned", items: ["Historical and online features", "Feature pipelines and model inputs", "Document updates and embeddings"] },
        right: { label: "Check", items: ["Access filters on retrieval", "Deletion reaches derived records", "Training values existed at event time"] },
      } }],
      claims: ["serving-data-to-ml-and-ai-erasure-recipients", "serving-data-to-ml-and-ai-vector-filtering", "serving-data-to-ml-and-ai-point-in-time-join"],
    }),
  ],
  governance: { text: "Apply access rules to feature and document retrieval, and track changes through derived records. The GDPR requires controllers to communicate certain erasures to recipients and take reasonable steps concerning copies or replications where applicable.", claims: ["serving-data-to-ml-and-ai-erasure-recipients", "serving-data-to-ml-and-ai-vector-filtering"] },
  closing: {
    pitfalls: [
      "Training on feature values that were unavailable at the event time.",
      "Updating policy text without refreshing its indexed representation.",
      "Assuming an embedding hides personal data or enforces access by itself.",
    ],
    questions: [
      "Which timestamp decides what a training row could have known?",
      "How does production retrieve the same named features as training?",
      "Which derived records must be updated or removed when source data changes?",
    ],
  },
});
