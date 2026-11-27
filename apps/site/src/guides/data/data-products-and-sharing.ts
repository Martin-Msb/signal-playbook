import { blocks, CANVAS, defineGuide, isoGrid, line, pawn, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// The floor: the orders dataset is a block of sky blocks at the back left. Three consumers stand at the front right.
// First each consumer keeps its own copy, a smaller block beside it with stale rows in red. Then a plate rises under the
// dataset: the product boundary, with an owner on it, a contract card behind it and one interface at its front edge.
// The copies become empty outlines, and every consumer reads the one dataset through the interface under a share.
const G = isoGrid(312, 150, 30), Z = 10;
const ROWS = [0.5, 4.5, 8.5], JOIN = 8, END = 11.1, REST = 9.5, WHO = 11.6, COPY = 14;
const TEAMS = ["Finance", "Support", "Data team"];
const up = (gx: number, gy: number, dy: number): [number, number] => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];

/** The dataset: six blocks. On the floor at first, then on the product plate. */
const dataset = (id: string, z: number, group: string): El =>
  blocks(id, 0.4, 0.5, 3, 1, Array.from({ length: 6 }, () => ({ h: 22, hue: "sky" as const })), { gap: 0.2, title: "orders", sub: "the dataset", at: "e", z, group });
/** A consumer's own copy. stale lists the blocks that no longer match the dataset. gone draws it removed. */
const copy = (k: number, title: string, sub: string, stale: number[]): El[] => [
  blocks(`copy${k}`, COPY, ROWS[k] - 1.9, 3, 0.6, Array.from({ length: 6 }, (_, i) => ({ h: 16, hue: "sky" as const, state: stale.includes(i) ? "alert" as const : undefined })), { gap: 0.15, title, sub, at: "e", group: "copies" }),
  blocks(`gone${k}`, COPY, ROWS[k] - 1.9, 3, 0.6, Array.from({ length: 6 }, () => ({ h: 16, state: "closed" as const })), { gap: 0.15, group: "gone" }),
];
/** A route from a start point on the dataset side to consumer k. */
const route = (id: string, from: [number, number], k: number, group: string, closed = false): El =>
  line(id, from[1] === ROWS[k] ? [G.p(...from), G.p(END, ROWS[k])] : [G.p(...from), G.p(JOIN, from[1]), G.p(JOIN, ROWS[k]), G.p(END, ROWS[k])], { group, state: closed ? "closed" : undefined });
const OUT: [number, number] = [4, 1.6], PORT: [number, number] = [6, 4.5];
const grants = (id: string, last: Parameters<typeof table>[5][number], foot: string, alert = false): El =>
  raise(table(id, 0, 0, 236, ["recipient", "agreed use"], [["Finance", "reporting"], ["Support", "refunds"], last],
    { at: [12, 118], rowH: 26, title: "Share: orders", sub: "read only", foot, tone: alert ? "alert" : undefined, group: id }), [820, 240], 34);

export default defineGuide({
  id: "data-products-and-sharing", track: "data", module: "Serving", slug: "data-products-and-sharing",
  title: "Data products and sharing",
  summary: "A dataset offered to others is a product with an owner, an interface and a service level, shared without copying where possible.",
  forLeads: "Treat each shared dataset as a supported offer: name the accountable owner, publish the contract and the interface, and share access to the one copy. Review who holds that access and for what use.",
  status: "draft", minutes: 7,
  counters: ["Owner", "Contract", "Copies of orders", "Recipients"],
  whatIf: { label: "What if every team copied orders?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Teams, fields, times and grants are illustrative",
    label: "The orders dataset is a block of six blue blocks. Finance, Support and the data team stand in front of it. First each team keeps its own copy beside it, with stale rows in red, and nothing says who owns the dataset. Then a plate rises under the dataset as the product boundary, with Operations standing on it as owner. A contract card behind the plate lists three fields and a freshness promise. An interface appears at the front edge of the plate, the copies become empty outlines, and all three teams read the one dataset through routes from the interface. A share card lists each recipient and its agreed use. The data team's analysis has ended but its grant still reads. At the last stop a review strikes that grant and closes its route.",
    els: [
      // the consumers, and where a record rests on each route
      ...TEAMS.map((t, k) => pawn(`who${k}`, WHO, ROWS[k], t, undefined, { hue: "sand", always: true })),
      ...ROWS.map((y, k) => stop(`a${k}`, ...G.p(REST, y), undefined, undefined, { always: true })),

      // 1. the dataset with no boundary, and a copy per consumer
      dataset("raw", 0, "raw"),
      ...[0, 1, 2].map((k) => route(`e${k}`, OUT, k, "export")),
      stop("ask", ...G.p(7, OUT[1]), undefined, undefined, { group: "export" }),
      ...copy(0, "Finance copy", "3 days old", [4, 5]),
      ...copy(1, "Support copy", "5 weeks old", [2, 3, 4, 5]),
      ...copy(2, "Data team copy", "old schema", [1, 3, 5]),
      pill("nobody", [432, 62], "No owner", { sub: "no contract, 4 copies", tone: "alert", group: "nobody" }),

      // 2. the product boundary and its owner
      slab("product", 0, 0, 6, 9, undefined, { group: "product" }),
      dataset("data", Z, "product"),
      pawn("owner", 1.5, 6.5, "Operations", undefined, { hue: "track", z: Z, group: "product" }),
      pill("product-l", [432, 62], "Orders product", { sub: "owner: Operations", tone: "track", glyph: "stack", to: up(2.2, 0, Z), group: "product" }),

      // 3. the contract, on a post behind the plate
      raise(table("contract", 0, 0, 232, ["term", "promise"], [["order_id", "long"], ["amount", "decimal"], ["channel", "string"], { cells: ["fresh by", "06:00 daily"], hot: true }],
        { at: [12, 116], rowH: 24, title: "Data contract", sub: "schema, service level", group: "contract" }), [124, 212], 42),

      // 4. one interface, a share, and no copies
      prism("port", 4.6, 3.8, 1.4, 1.4, 30, { hue: "track", glyph: "code", title: "Interface", sub: "share, catalog, API", at: "sw", z: Z, group: "port" }),
      ...[0, 1, 2].map((k) => route(`r${k}`, PORT, k, k === 2 ? "read2" : "read")),
      grants("g0", ["Data team", "analysis"], "reviewed: never"),

      // 5. a grant that outlived its purpose
      grants("g1", { cells: ["Data team", "analysis"], hot: true }, "reviewed: never", true),
      pill("ended", [236, 478], "Analysis ended", { sub: "grant still reads", tone: "alert", group: "ended" }),

      // 6. the review
      grants("g2", { cells: ["Data team", "analysis"], strike: true }, "reviewed: this quarter"),
      route("r2x", PORT, 2, "reviewed", true),
      pill("review", [596, 96], "Access review", { sub: "grants against use", glyph: "eye", to: [700, 168], group: "reviewed" }),
    ],
  },
  steps: [
    step({
      id: "copies", label: "Copies", kind: "problem", title: "Every team keeps its own copy of orders",
      caption: "Finance, Support and the data team each export the orders table at Vinterhus. Every copy ages from its export, and nobody answers for the table or the copies.",
      show: ["raw", "export", "copies", "nobody"], counters: ["none", "none", "4", "unknown"],
      rides: [ride("e0", 0, "a0", "export"), ride("e1", 0, "a1", "export"), ride("e2", 0, "a2", "export")],
      body: ["The orders table has no named contact, no stated schema and no supported way to read it, so each team takes an export and keeps it.",
        "The data mesh proposal names the role that is missing here: a data product owner, responsible for the lifecycle of the domain's datasets."],
      claims: ["data-products-and-sharing-owner"],
    }),
    step({
      id: "owner", label: "Owner", kind: "idea", title: "The dataset becomes a product with an owner",
      caption: "Operations offers orders as a data product. Its owner decides when data and schema change, and answers the consumers who depend on it.",
      show: ["product", "export", "copies"], counters: ["Operations", "none", "4", "unknown"],
      rides: [ride("e0", "a0", "ask", "who owns it?", { then: "Operations" })],
      body: ["A data product owner makes decisions around the vision and the roadmap for the data products, and is responsible for the lifecycle of the domain datasets: when to change, revise and retire data and schemas.",
        "The Open Data Product Specification is a machine-readable model for describing such a product, so the offer itself can be published and read by tools.",
        { callout: { label: "Key idea", text: "The boundary of the product is what the owner answers for: the data, its description and the way in." } }],
      claims: ["data-products-and-sharing-owner", "data-products-and-sharing-product"],
    }),
    step({
      id: "contract", label: "Contract", kind: "mechanism", title: "A contract states the schema and the service level",
      caption: "The data contract lists the fields consumers may rely on and promises fresh data by 06:00. Consumers build against the contract, not against the table.",
      show: ["product", "export", "copies", "contract"], counters: ["Operations", "schema, service level", "4", "unknown"],
      body: ["Schema evolution and data contracts introduced the contract as the agreement between a producer and its consumers. A data product carries one as part of its definition.",
        "The Open Data Product Specification supports data contracts, service level agreements and quality profiles in a product definition.",
        "In the data mesh proposal each data product defines and assures the target level of its integrity and truthfulness as a set of service level objectives."],
      claims: ["data-products-and-sharing-contract", "data-products-and-sharing-slo"],
    }),
    step({
      id: "share", label: "Share", kind: "mechanism", title: "Consumers read the one copy through an interface",
      caption: "The product opens one interface. A Delta Sharing share grants each recipient read access, the copies go, and every team reads the same live rows.",
      show: ["product", "contract", "port", "read", "read2", "gone", "g0"], counters: ["Operations", "schema, service level", "1", "3 granted"],
      rides: [ride("r0", 0, "a0", "read"), ride("r1", 0, "a1", "read"), ride("r2", 0, "a2", "read")],
      body: ["The Open Data Product Specification has a data access object that defines how users or machines can technically access the product, such as an API endpoint.",
        "Delta Sharing is an open REST protocol. A share is a logical grouping to share with recipients, a recipient is a principal that holds a bearer token, and the server returns pre-signed URLs for individual data files. The project describes this as sharing live data without copying it to another system.",
        "In Databricks a share is a collection of data assets made available to recipients, and the provider grants each recipient access to it.",
        "The Iceberg REST catalog protocol is a common API that clients can use with any catalog that implements it. It supports secure table sharing using credential vending or remote signing.",
        { callout: { label: "What changed", text: "Four tables called orders became one. Access is granted, and the data stays where the owner keeps it." } }],
      claims: ["data-products-and-sharing-access", "data-products-and-sharing-protocol", "data-products-and-sharing-no-copy", "data-products-and-sharing-sharing", "data-products-and-sharing-interface", "data-products-and-sharing-vending"],
    }),
    step({
      id: "stale-grant", label: "Old grant", kind: "watch-out", title: "A grant can outlive its purpose",
      caption: "The data team's analysis has ended, yet its grant still reads orders. The share records an agreed use per recipient, so a review can find the grant that no longer has one.",
      show: ["product", "contract", "port", "read", "read2", "gone", "g1", "ended"], counters: ["Operations", "schema, service level", "1", "3, one unused"],
      rides: [ride("r2", 0, "a2", "read", { tone: "alert" })],
      body: ["A share removes the copies. It does not remove the need to know who reads the data and for what.",
        "NIST SP 800-53 has organisations approve and manage information exchange between systems using agreements, and document in each agreement the interface characteristics, the security and privacy requirements and the responsibilities of each side.",
        "The same catalogue has authorised users check that the access authorisations given to a sharing partner match the access and use restrictions on the information."],
      claims: ["data-products-and-sharing-agreement", "data-products-and-sharing-use-terms"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What a data product owes and what sharing needs",
      caption: "",
      show: ["product", "contract", "port", "read", "reviewed", "gone", "g2"], counters: ["Operations", "schema, service level", "1", "2, reviewed"],
      rides: [ride("r0", 0, "a0", "read"), ride("r1", 0, "a1", "read")],
      body: [{ pair: {
        left: { label: "The product owes", items: ["A named owner", "A contract with a service level", "One interface"] },
        right: { label: "Sharing needs", items: ["A grant per recipient", "Agreed terms of use", "Periodic access reviews"] },
      } },
        "NIST SP 800-53 has accounts reviewed for compliance with account management requirements at a frequency the organisation defines, and has exchange agreements reviewed and updated on a defined frequency too.",
        "The review ends in an action. In Databricks a provider can view the shares a recipient has been granted, and deleting a recipient ends its access to the shared data."],
      claims: ["data-products-and-sharing-account-review", "data-products-and-sharing-agreement", "data-products-and-sharing-review"],
    }),
  ],
  governance: { text: "A sharing agreement documents the interface, the responsibilities and the permitted use for each recipient. Review the agreements and the accounts with access at a set frequency, and remove recipients whose purpose has ended.", claims: ["data-products-and-sharing-agreement", "data-products-and-sharing-use-terms", "data-products-and-sharing-account-review", "data-products-and-sharing-review"] },
  closing: {
    pitfalls: [
      "Publishing a table without naming who answers for it.",
      "Handing out exports, so every consumer keeps a copy that ages.",
      "Leaving a recipient's grant in place after its purpose has ended.",
    ],
    questions: [
      "Who decides when the schema of a data product changes?",
      "What does the contract promise a consumer beyond the list of fields?",
      "Which recipients can read the product today, and for what agreed use?",
    ],
  },
});
