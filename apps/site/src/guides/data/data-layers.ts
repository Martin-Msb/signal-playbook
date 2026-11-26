import { CANVAS, defineGuide, isoGrid, line, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(250, 90, 28);
const rail = line("orders", [G.p(0, 1), G.p(20, 1)], { always: true });
const layer = (id: string, title: string, sub: string, rows: [string, string][], group: string) =>
  raise(table(id, 0, 0, 286, ["order", "value"], rows, { at: [72, 174], rowH: 25, title, sub, mono: true, group }), [480, 515], 28);

export default defineGuide({
  id: "data-layers", track: "data", module: "Transformation", slug: "data-layers",
  title: "Data layers",
  summary: "Raw, cleaned and modelled layers give each dataset a quality contract and an intended audience.",
  forLeads: "Each layer has a purpose, quality expectation and audience. Restrict raw records to the people and processes that need them, then expose curated outputs to their intended users.",
  status: "draft", minutes: 6,
  counters: ["Current layer", "Fields carried", "Quality", "Audience"],
  whatIf: { label: "What if Finance read the raw order?", step: 0, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order values and names are illustrative",
    label: "Order 4471 moves from Checkout through raw, cleaned and modelled layers. The record begins with identifying and transactional fields, is validated and prepared for reuse, then becomes a channel summary for Finance. A card changes at each stop to show the contract the layer provides. The raw table stays restricted; only the curated output reaches its intended audience.",
    els: [
      rail,
      stop("checkout", ...G.p(0, 1), undefined, undefined, { big: true, always: true }),
      stop("bronze", ...G.p(4, 1), undefined, undefined, { always: true }),
      stop("silver", ...G.p(9, 1), undefined, undefined, { always: true }),
      stop("intermediate", ...G.p(14, 1), undefined, undefined, { always: true }),
      stop("gold", ...G.p(18, 1), undefined, undefined, { always: true }),
      stop("finance", ...G.p(20, 1), undefined, undefined, { big: true, always: true }),
      layer("raw", "Bronze", "raw source", [["order_id", "4471"], ["email", "a.k@example"], ["channel", "web"], ["amount", "899"]], "bronze-card"),
      layer("silver-card", "Silver", "validated order", [["order_id", "4471"], ["channel", "web"], ["amount", "899"]], "silver-card"),
      layer("intermediate-card", "Intermediate", "orders joined to items", [["order_id", "4471"], ["item_count", "2"], ["net_total", "899"]], "intermediate-card"),
      layer("gold-card", "Gold mart", "channel summary", [["channel", "web"], ["orders", "126"], ["revenue", "84,210"]], "gold-card"),
    ],
  },
  steps: [
    step({
      id: "unlayered", label: "Raw use", kind: "problem", title: "Every consumer receives the same order",
      caption: "The raw record carries the customer email and order value. Finance and Support both read it directly, with no layer distinguishing their needs.",
      show: [], counters: ["source table", "email and amount", "unchecked", "Finance and Support"],
      rides: [ride("orders", "checkout", "finance", "4471 web 899")],
      body: ["This example starts with one order row that includes a customer email. The values are illustrative. Without a boundary between source records and purpose-built outputs, each reader can receive fields it does not need."],
      claims: ["data-layers-access"],
    }),
    step({
      id: "bronze", label: "Bronze", kind: "idea", title: "Keep a raw layer for reprocessing",
      caption: "The bronze layer preserves the source record with minimal transformation. Its email remains in the raw table while downstream work can start again from that source.",
      show: ["bronze-card"], counters: ["bronze", "email and amount", "source preserved", "restricted"],
      rides: [ride("orders", "checkout", "bronze", "4471 web 899")],
      body: ["Databricks describes bronze tables as preserving raw source data with minimal transformation, so silver or gold layers can reprocess the bronze source if requirements change. This is Databricks' medallion architecture guidance."],
      claims: ["data-layers-bronze"],
    }),
    step({
      id: "silver", label: "Silver", kind: "mechanism", title: "Clean and validate records",
      caption: "Silver filters, cleans and parses rows. This order passes validation, and the modelling step carries only its order id, channel and amount.",
      show: ["silver-card"], counters: ["silver", "three fields", "validated", "data team"],
      rides: [ride("orders", "bronze", "silver", "4471 passes")],
      body: ["Databricks describes silver-layer transformations as incremental row-level filtering, cleaning and parsing. In this illustrative flow, the email is not needed in the analytical order model."],
      claims: ["data-layers-silver"],
    }),
    step({
      id: "intermediate", label: "Intermediate", kind: "mechanism", title: "Prepare reusable models before outputs",
      caption: "A staging model prepares the source-shaped order. An intermediate model joins its items and establishes the grain used by a later output.",
      show: ["intermediate-card"], counters: ["intermediate", "joined fields", "modelled", "data team"],
      rides: [ride("orders", "silver", "intermediate", "4471, 2 items")],
      body: ["dbt's project guidance separates staging models from intermediate models and marts. It describes intermediate models as preparing staging models for marts, with patterns such as grouping, pivoting and isolating complex logic."],
      claims: ["data-layers-dbt-staging", "data-layers-dbt-intermediate"],
    }),
    step({
      id: "gold", label: "Gold", kind: "watch-out", title: "A mart shapes data for its audience",
      caption: "The gold layer contains a channel summary for Finance. It is an output with a named audience, not another copy of the raw order.",
      show: ["gold-card"], counters: ["gold mart", "three summary fields", "aggregated", "Finance"],
      rides: [ride("orders", "intermediate", "gold", "web 84,210")],
      body: ["Databricks describes gold tables as precomputed aggregations, metrics and summaries for dashboards, reporting tools and downstream consumers. dbt describes marts as the layer expressly intended for end users. These are vendor-stated patterns, not a required universal naming scheme."],
      claims: ["data-layers-gold", "data-layers-dbt-marts"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Set a contract and audience per layer",
      caption: "",
      show: ["gold-card"], counters: ["four named layers", "purpose-built fields", "contracted", "Finance only"],
      rides: [ride("orders", "checkout", "finance", "126 orders")],
      body: [{ pair: {
        left: { label: "Define", items: ["What each layer guarantees", "Which audience may use it"] },
        right: { label: "Enforce", items: ["Restrict raw and intermediate data", "Grant access to curated outputs"] },
      } }, "Unity Catalog supports grants on securable objects and table-level filtering and masking. dbt recommends keeping intermediate models out of the main production schema or using a schema with special permissions."],
      claims: ["data-layers-access", "data-layers-dbt-intermediate"],
    }),
  ],
  governance: { text: "Raw and intermediate layers can contain fields or models that are not for broad use. Define access by audience: Unity Catalog grants privileges on securable objects and supports row and column filtering, while dbt advises keeping intermediate models outside the main production schema or in a specially permissioned schema.", claims: ["data-layers-access", "data-layers-dbt-intermediate"] },
  closing: {
    pitfalls: [
      "Treating bronze, silver and gold as a mandatory architecture rather than one named pattern.",
      "Publishing intermediate models to general users when they are only preparation for a mart.",
      "Assuming a layer name enforces a quality contract or access policy by itself.",
    ],
    questions: [
      "What source data must remain available for reprocessing?",
      "Which checks define a valid silver record?",
      "Who should be able to read the curated output, and who should not read the raw layer?",
    ],
  },
});
