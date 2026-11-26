import { CANVAS, defineGuide, drum, isoGrid, line, pawn, prism, ride, step, stop } from "@signal-path/engine";

const G = isoGrid(145, 160, 30);
const x = { source: 3, watch: 9, publish: 16, incident: 21 };

export default defineGuide({
  id: "observability-and-incident-response", track: "data", module: "Operation", slug: "observability-and-incident-response",
  title: "Observability and incident response",
  summary: "Freshness, volume, schema and distribution are monitored like service health, and data incidents are detected, triaged and reviewed.",
  forLeads: "Set service levels with data consumers, make failures actionable, and keep an incident record that turns response into prevention.",
  status: "draft", minutes: 7,
  counters: ["Signals watched", "Service level", "Incident lead", "Incident record"],
  whatIf: { label: "What if freshness were the only signal?", step: 1, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order and monitoring values are illustrative",
    label: "Order data travels from the Vinterhus orders table through a monitor to Finance. The monitor tracks freshness, volume, schema and distribution against an agreed service level. An alert diverts a failed batch to an incident route. Operations restores the data while the incident lead records the response and follow-up actions.",
    els: [
      line("flow", [G.p(x.source, 0), G.p(x.watch, 0), G.p(x.publish, 0)], { always: true }),
      line("incident-route", [G.p(x.watch, 0), G.p(x.watch, 1), G.p(16, 1)], { tone: "alert", group: "alert" }),
      stop("arrive", ...G.p(x.source, 0), undefined, undefined, { always: true }),
      stop("checked", ...G.p(x.watch, 0), undefined, undefined, { always: true }),
      stop("finance", ...G.p(x.publish, 0), undefined, undefined, { always: true }),
      stop("triage", ...G.p(16, 1), undefined, undefined, { group: "alert" }),
      prism("orders", 1, -3, 1.8, 1.5, 30, { hue: "sky", glyph: "table", title: "Orders", sub: "Vinterhus", at: "n", always: true }),
      prism("monitor", 8, -8, 2, 1.7, 30, { hue: "track", glyph: "chart", title: "Data monitor", sub: "four signals", at: "n", always: true }),
      drum("consumer", 15, -7, 1, 34, { hue: "mint", glyph: "table", title: "Finance", sub: "daily report", at: "n", always: true }),
      pawn("lead", 10, 3, "Incident lead", undefined, { hue: "sand", group: "response" }),
      prism("record", 14, 1, 2, 1.5, 28, { hue: "sand", glyph: "table", title: "Incident log", sub: "actions and cause", at: "s", group: "response" }),
    ],
  },
  steps: [
    step({
      id: "unseen", label: "Missed batch", kind: "problem", title: "A quiet data failure reaches its consumer",
      caption: "Yesterday's order batch is late, but Finance's report still opens. Without checks, the stale total looks current.",
      show: [], counters: ["none", "none", "none", "none"],
      rides: [ride("flow", "arrive", "finance", "4471: total")],
      body: ["The order and batch are illustrative. A report can be available while its data is delayed or wrong."],
      claims: ["observability-and-incident-response-signals"],
    }),
    step({
      id: "signals", label: "Watch signals", kind: "idea", title: "Observe the data as well as the pipeline",
      caption: "The monitor tracks freshness, volume, schema and distribution. Metrics, logs and traces show different aspects of activity.",
      show: [], counters: ["four", "none", "none", "none"],
      rides: [ride("flow", "arrive", "checked", "4471: batch")],
      body: ["OpenTelemetry supports metrics, logs and traces as signals. The four data checks shown here are illustrative monitoring choices for this dataset."],
      claims: ["observability-and-incident-response-signals"],
    }),
    step({
      id: "service-level", label: "Set target", kind: "mechanism", title: "Agree a service level with the consumer",
      caption: "Finance and the data team agree when the orders table must be fresh. The target gives the freshness check a useful boundary.",
      show: [], counters: ["four", "agreed", "none", "none"],
      rides: [ride("flow", "arrive", "checked", "freshness target")],
      body: ["dbt source freshness checks can compare observed freshness with an organisation-defined service level agreement. Choose a check frequency that can detect a missed target in time to act."],
      claims: ["observability-and-incident-response-freshness"],
    }),
    step({
      id: "alert", label: "Detect", kind: "mechanism", title: "Make a sustained breach actionable",
      caption: "A freshness alert fires after its condition persists. Context points responders towards the affected batch and its runbook.",
      show: ["alert"], counters: ["four", "agreed", "pending alert", "none"],
      rides: [ride("incident-route", "checked", "triage", "4471: stale")],
      body: ["Prometheus alert rules evaluate expressions and can attach labels and annotations, including a runbook link. A duration condition can avoid firing on a brief blip."],
      claims: ["observability-and-incident-response-alerts"],
    }),
    step({
      id: "triage", label: "Triage", kind: "watch-out", title: "Give response a lead and a shared record",
      caption: "The incident lead coordinates triage while Operations restores the batch. A live record keeps status, actions and handoffs together.",
      show: ["alert", "response"], counters: ["four", "breached", "incident lead", "live"],
      rides: [],
      body: ["Google SRE describes distinct incident command, operational, communication and planning roles, with a live incident document retained for postmortem analysis."],
      claims: ["observability-and-incident-response-triage"],
    }),
    step({
      id: "decide", label: "Review", kind: "decision", title: "Turn the incident into a prevention action",
      caption: "",
      show: ["alert", "response"], counters: ["four", "reviewed", "owner assigned", "reviewed"],
      rides: [],
      body: [{ pair: {
        left: { label: "During response", items: ["Declare and assign a lead", "Record impact and actions", "Keep consumers informed"] },
        right: { label: "After recovery", items: ["Review cause and response", "Assign prevention actions", "Update checks and service levels"] },
      } }, "Google SRE describes postmortems as records of incident impact, mitigation, causes and follow-up actions, intended to reduce recurrence."],
      claims: ["observability-and-incident-response-record"],
    }),
  ],
  governance: { text: "Agree service levels with data consumers and retain incident records as compliance evidence. The record should capture the impact, response and follow-up actions so the control can be reviewed and improved.", claims: ["observability-and-incident-response-triage", "observability-and-incident-response-record"] },
  closing: {
    pitfalls: [
      "Treating a healthy pipeline run as proof that its data is fresh and fit for use.",
      "Alerting on every fluctuation without a service level or an action for the responder.",
      "Closing an incident without recording its impact, response and prevention work.",
    ],
    questions: [
      "Which freshness, volume, schema and distribution changes matter to each consumer?",
      "Who leads triage, restores the data and communicates with consumers?",
      "Which incident records and follow-up actions provide evidence that controls work?",
    ],
  },
});
