import { CANVAS, defineGuide, drum, isoGrid, line, prism, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(250, 135, 28);
const X = { src: 0, prod: 5, check: 10, lake: 15, consumer: 21 };
const y = 1;
const rail = line("orders", [G.p(0, y), G.p(21, y)], { always: true });
const schema = (id: string, rows: Parameters<typeof table>[5], group: string, gx: number) =>
  raise(table(id, 0, 0, 216, ["field", "type"], rows, { at: [12, 116], rowH: 26, title: `Schema ${group}`, sub: "order record", mono: true, group }), G.p(gx, -3), 34);

export default defineGuide({
  id: "schema-evolution-and-data-contracts", track: "data", module: "Ingestion", slug: "schema-evolution-and-data-contracts",
  title: "Schema evolution and data contracts",
  summary: "Schemas change, and compatibility rules and explicit contracts keep producers from breaking consumers.",
  forLeads: "A contract gives the producer and consumers one published agreement about shape, quality and use. Compatibility checks make a schema change testable before it reaches the people and systems that depend on it.",
  status: "draft", minutes: 6,
  counters: ["Schema versions", "Compatibility", "Consumers", "Contract owner"],
  whatIf: { label: "What if the amount field were renamed?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order records and field values are illustrative",
    label: "Order 4471 moves from Checkout through the schema registry to Finance. The first schema has an amount field. A producer adds a currency field, and the registry checks the change against the selected compatibility rule. Finance continues reading the earlier shape while a consumer updates. An explicit data contract records schema, quality expectations, owners and permitted use.",
    els: [
      rail,
      stop("checkout", ...G.p(X.src, y), undefined, undefined, { big: true, always: true }),
      stop("produced", ...G.p(X.prod, y), undefined, undefined, { always: true }),
      stop("registry", ...G.p(X.check, y), undefined, undefined, { always: true }),
      stop("landed", ...G.p(X.lake, y), undefined, undefined, { always: true }),
      stop("read", ...G.p(19, y), undefined, undefined, { big: true, always: true }),
      drum("source", -1, 0, 1, 38, { hue: "sky", glyph: "stack", title: "Checkout", sub: "writes orders", at: "n", always: true }),
      prism("finance", 17, -5, 1.4, 1.4, 30, { hue: "track", glyph: "chart", title: "Finance", sub: "reads orders", at: "se", always: true }),
      schema("v1", [["order_id", "long"], ["amount", "decimal"]], "v1", 5),
      schema("v2", [["order_id", "long"], ["amount", "decimal"], ["currency", "string"]], "v2", 14),
      schema("bad", [["order_id", "long"], ["total", "decimal"]], "bad", 5),
      raise(table("contract", 0, 0, 270, ["agreement", "owner"], [["schema", "Data team"], ["quality", "Finance"], ["permitted use", "Support"], ["compatibility", "backward"]], { at: [12, 130], rowH: 25, title: "Data contract", sub: "producer and consumers", group: "contract" }), G.p(14, 6), 44),
    ],
  },
  steps: [
    step({
      id: "break", label: "Break", kind: "problem", title: "A field rename can break a consumer",
      caption: "Checkout renames `amount` to `total`. Finance still expects `amount`, so its reader cannot match the field it needs.",
      show: ["bad"], counters: ["1 to 2", "unchecked", "Finance breaks", "none"],
      rides: [ride("orders", "checkout", 17, "4471 total", { tone: "alert" })],
      body: ["The producer changes a record that consumers already read. Without an agreed rule for evolving that shape, a deployment can leave a new writer and an old reader expecting different fields."],
      claims: ["schema-evolution-and-data-contracts-avro-resolution"],
    }),
    step({
      id: "version", label: "Version", kind: "idea", title: "A schema version defines each record shape",
      caption: "The producer registers a new schema. Order 4471 now has `order_id`, `amount` and `currency`; the earlier version remains identifiable.",
      show: ["v1", "v2"], counters: ["1 to 2", "not checked", "Finance reads v1", "none"],
      rides: [ride("orders", "checkout", "produced", "4471 web 899")],
      body: ["Avro resolves writer and reader records by field name. A field present only in the writer can be ignored by the reader; a field required only by the reader needs a default value."],
      claims: ["schema-evolution-and-data-contracts-avro-resolution"],
    }),
    step({
      id: "compatibility", label: "Check", kind: "mechanism", title: "Compatibility rules test producer and reader versions",
      caption: "A schema registry checks the proposed version against the selected rule. Backward, forward and full compatibility protect different reader and writer combinations.",
      show: ["v1", "v2"], counters: ["2", "backward", "Finance reads v1", "none"],
      rides: [ride("orders", "produced", "registry", "v2: add currency")],
      body: ["Backward compatibility lets a consumer using the new schema read data written with the old schema. Forward compatibility lets a consumer using the old schema read data written with the new schema. Full requires both.",
        "Confluent Schema Registry compares a new schema version against previous versions and checks compatibility before accepting it. Compatibility rules differ between Avro, Protobuf and JSON Schema."],
      claims: ["schema-evolution-and-data-contracts-modes", "schema-evolution-and-data-contracts-compatibility"],
    }),
    step({
      id: "safe", label: "Add field", kind: "mechanism", title: "A compatible change lets both versions travel",
      caption: "The added `currency` field passes the chosen check. The record lands with its writer version, and Finance continues to read the prior fields.",
      show: ["v1", "v2"], counters: ["2", "passes", "Finance reads v1", "none"],
      rides: [ride("orders", "registry", "landed", "4471 USD 899")],
      body: ["Protocol Buffers describes adding a field as binary wire-safe. When a field is removed, its number must not be reused; a schema can reserve that number to prevent future reuse.",
        "A compatibility mode is not a promise that every change is safe in every format or application. The rule must match the format and the direction in which old and new readers meet."],
      claims: ["schema-evolution-and-data-contracts-protobuf", "schema-evolution-and-data-contracts-modes"],
    }),
    step({
      id: "agreement", label: "Contract", kind: "watch-out", title: "Compatibility covers shape, not the whole agreement",
      caption: "Finance can read the new record shape, but still needs to know its quality, owner and permitted use.",
      show: ["v2", "contract"], counters: ["2", "passes", "Finance reads v2", "Data team"],
      rides: [ride("orders", "landed", 17, "4471 USD 899")],
      body: ["In the Open Data Contract Standard, a data contract defines the agreement between a data producer and consumers. Its sections include schema, data quality, team, roles and service-level agreement."],
      claims: ["schema-evolution-and-data-contracts-odcs"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Publish the change with its obligations",
      caption: "",
      show: ["v2", "contract"], counters: ["2", "passes", "all named readers", "Data team"],
      rides: [ride("orders", "checkout", 17, "4471 USD 899", { via: ["registry"], then: "quality checked" })],
      body: [{ pair: {
        left: { label: "Before release", items: ["Choose compatibility for real readers", "Check the schema version"] },
        right: { label: "In the contract", items: ["Name an owner and quality level", "State permitted use"] },
      } }, "The Open Data Contract Standard has sections for team, roles, data quality and service-level agreement. Its description fields record the intended purpose of the data, recommended usage and limitations for data use."],
      claims: ["schema-evolution-and-data-contracts-governance"],
    }),
  ],
  governance: { text: "In the Open Data Contract Standard, a data contract has sections for team, roles, data quality and service-level agreement. Its description fields state the intended purpose, recommended usage and limitations for data use, which is where permitted use is recorded.", claims: ["schema-evolution-and-data-contracts-governance"] },
  closing: {
    pitfalls: [
      "Assuming an added field is safe for every schema format and reader.",
      "Checking only the latest schema when older consumers or stored records still exist.",
      "Treating shape compatibility as a replacement for data quality, ownership and permitted-use terms.",
    ],
    questions: [
      "Which producer and consumer versions must continue to interoperate?",
      "Does the chosen compatibility rule match the direction of change and the schema format?",
      "Who owns the data contract, and what uses does it permit?",
    ],
  },
});
