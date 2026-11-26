import { CANVAS, defineGuide, drum, isoGrid, line, pawn, pill, prism, ride, step, stop } from "@signal-path/engine";

// One orders product gains a contract and owner, then a shared interface and a recipient.
const G = isoGrid(150, 135, 30);
const X = { finance: 0, owner: 4, contract: 8, catalog: 12, share: 16, recipient: 20 };
const rail = (id: string, y: number, group: string) => line(id, [G.p(-1, y), G.p(21, y)], { w: 4, group });

export default defineGuide({
  id: "data-products-and-sharing", track: "data", module: "Serving", slug: "data-products-and-sharing",
  title: "Data products and sharing",
  summary: "A dataset offered to others is a product with an owner, an interface and a service level, shared without copying where possible.",
  forLeads: "Treat each shared dataset as a supported offer: name the accountable team, document the interface and service expectations, and review who can use it.",
  status: "draft", minutes: 7,
  counters: ["Owner", "Contract", "Access path", "Recipients"],
  whatIf: { label: "What if every team copied orders?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and recipients are illustrative",
    label: "An order dataset is offered to Finance. At first it has no owner, contract or stable access point. Then Operations owns the product, a contract records its schema and service expectations, and the catalogue points to an interface. A share grants Finance access to the same provider-held data, with a copy branch shown for comparison.",
    els: [
      rail("request", -5, "base"),
      rail("share", -5, "shared"),
      line("copy", [G.p(X.contract, 1), G.p(X.contract, 5), G.p(X.recipient, 5)], { tone: "muted", group: "copied" }),
      ...[X.finance, X.owner, X.contract, X.catalog, X.share, X.recipient].map((x, i) => stop(`s${i}`, ...G.p(x, -5), undefined, undefined, { group: "base" })),
      pawn("finance", X.finance - 0.6, -1.5, "Finance", undefined, { hue: "sand", always: true }),
      pawn("ops", X.owner - 0.6, -1.5, "Operations", undefined, { hue: "mint", group: "owner" }),
      prism("table", X.contract - 0.7, -0.7, 1.4, 1.4, 32, { hue: "sky", glyph: "table", title: "Orders", sub: "data product", at: "s", always: true }),
      prism("catalog", X.catalog - 0.7, -0.7, 1.4, 1.4, 32, { hue: "paper", glyph: "map", title: "Catalogue", sub: "interface", at: "s", group: "catalog" }),
      prism("share-gate", X.share - 0.7, -0.7, 1.4, 1.4, 32, { hue: "track", glyph: "shield", title: "Share", sub: "access grant", at: "s", group: "shared" }),
      pawn("recipient", X.recipient - 0.6, -1.5, "Finance", undefined, { hue: "sand", group: "shared" }),
      drum("copy-table", X.recipient, 5, 1.1, 34, { hue: "sky", glyph: "table", title: "orders_copy", sub: "separate copy", at: "s", group: "copied" }),
      pill("contract-note", [410, 455], "schema + service", { group: "contract" }),
    ],
  },
  steps: [
    step({
      id: "request", label: "Request", kind: "problem", title: "Finance asks for orders data",
      caption: "Finance needs order totals, but the table arrives without a named contact or a supported way to read it.",
      show: ["base"], counters: ["none", "none", "ad hoc", "0"],
      rides: [ride("request", "s0", "s2", "order totals")],
      body: ["A table alone leaves the consumer to guess who owns it, what its fields mean and how to obtain it."],
      claims: ["data-products-and-sharing-product"],
    }),
    step({
      id: "owner", label: "Owner", kind: "idea", title: "A team takes responsibility for the offer",
      caption: "Operations owns the orders product and answers for its lifecycle, access and service expectations.",
      show: ["base", "owner"], counters: ["Operations", "none", "ad hoc", "0"],
      rides: [ride("request", "s0", "s1", "request")],
      body: ["A data product packages data for use by others. The Open Data Product Specification provides a machine-readable model for describing such a product."],
      claims: ["data-products-and-sharing-product"],
    }),
    step({
      id: "contract", label: "Contract", kind: "mechanism", title: "The contract sets expectations",
      caption: "A data contract records the schema and service expectations so Finance can build against a stated offer.",
      show: ["base", "owner", "contract"], counters: ["Operations", "schema + service", "ad hoc", "0"],
      rides: [ride("request", "s1", "s2", "contract")],
      body: ["The Open Data Product Specification can describe data contracts, service level agreements and quality profiles as parts of a product definition.",
        { callout: { label: "Key idea", text: "The contract makes the producer and consumer expectations explicit." } }],
      claims: ["data-products-and-sharing-contract"],
    }),
    step({
      id: "interface", label: "Interface", kind: "mechanism", title: "A catalogue points to a stable interface",
      caption: "The product entry documents how to access orders. An Iceberg REST catalog offers a common API for compatible clients and catalogs.",
      show: ["base", "owner", "contract", "catalog"], counters: ["Operations", "schema + service", "catalogue + REST", "0"],
      rides: [ride("request", "s2", "s3", "catalogue entry")],
      body: ["The Iceberg REST catalog protocol defines a common API for catalog operations, letting a client interact with any catalog that implements it."],
      claims: ["data-products-and-sharing-interface"],
    }),
    step({
      id: "share", label: "Share", kind: "watch-out", title: "Grant access instead of making a copy",
      caption: "Delta Sharing groups selected assets in a share and grants a recipient access. This path avoids creating a separate provider export.",
      show: ["base", "owner", "contract", "catalog", "shared"], counters: ["Operations", "schema + service", "Delta Sharing", "1"],
      rides: [ride("share", "s0", "s5", "orders")],
      body: ["Delta Sharing defines shares as collections of data assets made available to recipients. Providers grant access to a recipient after creating the share.", "The copy branch is an illustrative alternative: an exported copy can drift from the provider's current data."],
      claims: ["data-products-and-sharing-sharing", "data-products-and-sharing-copy"],
    }),
    step({
      id: "decision", label: "Decision", kind: "decision", title: "Make the offer usable and governed",
      caption: "",
      show: ["base", "owner", "contract", "catalog", "shared"], counters: ["Operations", "schema + service", "Delta Sharing", "1"],
      rides: [ride("share", "s0", "s5", "orders")],
      body: [{ pair: {
        left: { label: "Product", items: ["Named owner", "Contract and service level", "Documented interface"] },
        right: { label: "Sharing", items: ["Grant named recipients", "Agree usage terms", "Review access periodically"] },
      } }, "Keep the recipient list and agreed use aligned with the data being shared."],
      claims: ["data-products-and-sharing-sharing", "data-products-and-sharing-review"],
    }),
  ],
  governance: { text: "Record the permitted use in a sharing agreement, grant only the intended recipient access, and periodically review whether that access is still needed.", claims: ["data-products-and-sharing-sharing", "data-products-and-sharing-review"] },
  closing: {
    pitfalls: [
      "Publishing a table without naming who supports it.",
      "Letting consumers infer schema or service expectations.",
      "Leaving recipient access in place after the purpose has ended.",
    ],
    questions: [
      "Who answers when a data product changes?",
      "What does the contract tell a consumer?",
      "When should a recipient's access be reviewed?",
    ],
  },
});
