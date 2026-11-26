import { CANVAS, defineGuide, drum, isoGrid, line, list, pill, pawn, prism, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(475, 130, 30);
const MAIN = 0;
const cardAt: [number, number] = [180, 500];
const metaCard = (id: string, title: string, cols: string[], row: string[], group: string) =>
  raise(table(id, 0, 0, 280, cols, [row], { title, sub: "catalogue record", rowH: 28, group }), cardAt, 28);

export default defineGuide({
  id: "catalogs-and-metadata", track: "data", module: "Storage", slug: "catalogs-and-metadata",
  title: "Catalogs and metadata",
  summary: "A catalog maps a table name to its current metadata for engines, and describes data so people can find, understand and trust it.",
  forLeads: "A catalog connects table names to the metadata engines need to read and update tables. Its descriptions, classifications, owners and business terms help people find and use the right data under the right controls.",
  status: "draft", minutes: 7,
  counters: ["Table location", "Commit", "Record", "Access"],
  whatIf: { label: "What if the catalogue held no description?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "The orders table and its descriptions are illustrative",
    label: "The orders table sits on a storage rail. A query engine follows the table name to a catalogue, which maps it to the current Iceberg metadata. The catalogue accepts a metadata update only when its requirements still hold. Above it, a record grows from a technical pointer into a description people can discover, understand and govern with business terms, tags and access rules.",
    els: [
      line("engine-route", [G.p(-1, 0), G.p(6, 0), G.p(12.2, 0)], { always: true }),
      stop("engine-stop", ...G.p(-1, 0), undefined, undefined, { always: true }),
      stop("catalogue-stop", ...G.p(6, 0), undefined, undefined, { always: true }),
      stop("table-stop", ...G.p(10.5, 0), undefined, undefined, { always: true }),
      prism("engine", -2.4, -0.7, 1.4, 1.4, 28, { hue: "track", glyph: "search", title: "Query engine", sub: "Finance", at: "n", always: true }),
      prism("catalogue-empty", 6, -5.2, 1.4, 1.4, 28, { hue: "paper", glyph: "map", title: "Catalogue", sub: "no table entry", at: "n", group: "empty" }),
      prism("catalogue-tech", 6, -5.2, 1.4, 1.4, 28, { hue: "track", glyph: "map", title: "Catalogue", sub: "Iceberg REST", at: "n", group: "technical" }),
      prism("catalogue-people", 6, -5.2, 1.4, 1.4, 28, { hue: "mint", glyph: "map", title: "Catalogue", sub: "search and trust", at: "n", group: "human" }),
      drum("orders", 17, 4.5, 1.2, 36, { hue: "sky", glyph: "table", title: "orders", sub: "Iceberg table", at: "n", always: true }),
      line("reader-route", [G.p(1, 7), G.p(6, 7), G.p(10, 7)], { tone: "ink", group: "human" }),
      stop("reader-start", ...G.p(1, 7), undefined, undefined, { group: "human" }),
      stop("reader-end", ...G.p(10, 7), undefined, undefined, { group: "human" }),
      pawn("finance", 0, 7, "Finance", undefined, { group: "human" }),
      pill("reader", [665, 435], "find and understand", { group: "human" }),
      metaCard("record0", "No record", ["name", "location"], ["orders", "? "], "empty"),
      metaCard("record1", "Table pointer", ["namespace", "table", "metadata"], ["sales", "orders", "v17"], "technical"),
      metaCard("record2", "Data description", ["name", "meaning", "class"], ["orders", "sales", "internal"], "human"),
      
      pill("permission", [850, 180], "BROWSE: metadata", { glyph: "key", group: "human" }),
      pill("commit", [494, 447], "validate, then update", { glyph: "check", group: "commit" }),
      line("commit-route", [G.p(6, 0), G.p(6, 4.5), G.p(11.3, 4.5)], { tone: "track", group: "commit" }),
      stop("commit-start", ...G.p(6, 0), undefined, undefined, { group: "commit" }),
      stop("commit-end", ...G.p(11.3, 4.5), undefined, undefined, { group: "commit" }),
    ],
  },
  steps: [
    step({
      id: "no-entry", label: "No entry", kind: "problem", title: "The table name has no shared pointer",
      caption: "Finance asks for `sales.orders`. Without a catalogue entry, the engine has no shared mapping from that name to the table's current metadata.",
      show: ["empty"], counters: ["unknown", "none", "none", "not set"],
      rides: [ride("engine-route", "engine-stop", "catalogue-stop", "sales.orders")],
      body: ["The example is illustrative. An Iceberg catalogue stores the current metadata pointer for a table name, so an engine can locate the table's current metadata.",
        { callout: { label: "Key idea", text: "The catalogue is part of table access. It maps a name to the current table state." } }],
      claims: ["catalogs-and-metadata-pointer"],
    }),
    step({
      id: "lookup", label: "Lookup", kind: "idea", title: "The catalogue resolves the table",
      caption: "The engine asks the Iceberg REST catalogue for `sales.orders`. It gets the current metadata location through one common API.",
      show: ["technical"], counters: ["metadata v17", "read", "technical", "not set"],
      rides: [ride("engine-route", "engine-stop", "table-stop", "sales.orders", { via: ["catalogue-stop"], then: "metadata v17" })],
      body: ["Iceberg defines a REST-based Catalog API for managing table metadata and performing catalog operations. The protocol provides one common API for interacting with Iceberg catalogs.",
        "Apache Polaris implements the Iceberg REST protocol and organizes Iceberg tables in catalogs and namespaces."],
      claims: ["catalogs-and-metadata-rest", "catalogs-and-metadata-polaris"],
    }),
    step({
      id: "commit", label: "Commit", kind: "mechanism", title: "The server checks before updating",
      caption: "A writer sends requirements and metadata updates. The catalogue validates the requirements against the current table state before it writes the new metadata.",
      show: ["technical", "commit"], counters: ["metadata v17", "validated", "technical", "not set"],
      rides: [ride("commit-route", "commit-start", "commit-end", "writer", { via: ["catalogue-stop"], then: "update v18" })],
      body: ["In the REST protocol, requirements state what must still be true of current metadata, and updates describe the changes. The server checks requirements, applies valid updates and writes new metadata; if a requirement fails, the commit is rejected."],
      claims: ["catalogs-and-metadata-commit"],
    }),
    step({
      id: "describe", label: "Describe", kind: "mechanism", title: "Metadata records describe the data",
      caption: "A catalogue record adds a title, meaning and classification. A standard vocabulary lets catalogues aggregate descriptions and support federated search.",
      show: ["human"], counters: ["metadata v18", "validated", "described", "not set"],
      rides: [ride("reader-route", "reader-start", "reader-end", "Finance: orders", { via: ["catalogue-stop"], then: "paid sales" })],
      body: ["W3C DCAT is an RDF vocabulary for representing data catalogs. It describes datasets and data services with a standard model and vocabulary, which can support metadata aggregation and federated search across catalogs."],
      claims: ["catalogs-and-metadata-dcat"],
    }),
    step({
      id: "business", label: "Business meaning", kind: "watch-out", title: "Shared terms make the record useful",
      caption: "A data discovery view groups assets by business domain. Governed pages define business concepts, and tags organise data for search and filtering.",
      show: ["human"], counters: ["metadata v18", "validated", "business context", "tagged"],
      rides: [ride("reader-route", "reader-start", "reader-end", "Finance: orders", { via: ["catalogue-stop"], then: "Finance domain" })],
      body: ["AWS Glue Data Catalog business glossaries attach controlled terms to assets, adding business meaning. Unity Catalog discovery helps people find, understand and trust assets with business domains, Pages, and tags that organise data for search and filtering."],
      claims: ["catalogs-and-metadata-glossary", "catalogs-and-metadata-discovery", "catalogs-and-metadata-tags"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What belongs in the catalogue",
      caption: "",
      show: ["human"], counters: ["metadata v18", "validated", "business context", "governed"],
      rides: [ride("reader-route", "reader-start", "reader-end", "Finance", { via: ["catalogue-stop"], then: "browse orders" })],
      body: [{ pair: {
        left: { label: "Engines need", items: ["Namespaces and table names", "Current metadata pointers", "Validated metadata commits"] },
        right: { label: "People need", items: ["Business definitions and ownership", "Classification and trust signals", "Permission-aware discovery"] },
      } },
        "Unity Catalog's BROWSE privilege allows users to discover objects, view their metadata and request access without a USE CATALOG or USE SCHEMA privilege."],
      claims: ["catalogs-and-metadata-commit", "catalogs-and-metadata-discovery", "catalogs-and-metadata-browse"],
    }),
  ],
  governance: { text: "A catalogue is a governance control point when it carries classifications, business definitions and access metadata. Unity Catalog's governed tags define allowed values, while its BROWSE privilege exposes metadata discovery separately from data access.", claims: ["catalogs-and-metadata-tags", "catalogs-and-metadata-browse"] },
  closing: {
    pitfalls: [
      "Treating the catalogue as a screen of table names while ignoring the current metadata pointer.",
      "Assuming a successful name lookup proves that the table description matches its current use.",
      "Treating a discovery permission as permission to query the underlying data.",
    ],
    questions: [
      "What does an Iceberg catalogue map a table name to?",
      "What does the REST catalogue validate before a metadata commit?",
      "Which metadata helps a person decide whether a table is useful and appropriate?",
    ],
  },
});
