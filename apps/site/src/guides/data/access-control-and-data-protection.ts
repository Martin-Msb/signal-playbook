import { CANVAS, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(90, 90, 28);
const p = (gx: number, gy = 0) => G.p(gx, gy);
const TOP = G.p(17, -7);
const records = [
  ["4468", "north", "a.k@…", "129"],
  ["4469", "south", "j.p@…", "349"],
  ["4471", "south", "s.o@…", "899"],
];
const fullTable = raise(table("full", 0, 0, 252, ["order", "region", "email", "kr"], records, {
  at: [12, 78, 146, 206], rowH: 25, title: "orders", sub: "all rows and columns", mono: true, group: "full",
}), TOP, 34);
const restrictedTable = raise(table("restricted", 0, 0, 252, ["order", "region", "email", "kr"], [
  ["4469", "south", "hidden", "349"],
  ["4471", "south", "hidden", "899"],
], {
  at: [12, 78, 146, 206], rowH: 25, title: "orders", sub: "Finance: south, no email", mono: true, group: "restricted",
}), TOP, 34);

export default defineGuide({
  id: "access-control-and-data-protection", track: "data", module: "Storage", slug: "access-control-and-data-protection",
  title: "Access control and data protection",
  summary: "Who can read which rows and columns is decided by policy at the platform, backed by encryption and key management.",
  forLeads: "A storage credential should not give every reader the same reach. Enforce each person's role and context at the data platform, scope storage credentials, protect encryption keys, and keep an audit trail of access decisions.",
  status: "draft", minutes: 7,
  counters: ["Rows", "Columns", "Storage credential", "Audit"],
  whatIf: { label: "What if Finance kept the storage key?", step: 0, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Vinterhus orders and example roles are illustrative",
    label: "Finance requests an order table containing customer email. A platform policy filters rows by region and withholds the email column. A catalog can vend short-lived credentials scoped to the table, so the analyst does not hold a broad storage key. Storage encrypts the files with a data key protected by a key-management service, and access decisions leave an audit record.",
    els: [
      line("main", [p(0), p(24)], { always: true }),
      stop("request", ...p(0), undefined, undefined, { big: true, always: true }),
      stop("p-policy", ...p(6), undefined, undefined, { always: true }),
      stop("credential", ...p(12), undefined, undefined, { always: true }),
      stop("store", ...p(18), undefined, undefined, { always: true }),
      stop("result", ...p(24), undefined, undefined, { big: true, always: true }),
      pawn("finance", 3, 3, "Finance", "order totals", { hue: "track", always: true }),
      prism("policy-box", 6, -4, 1.4, 1.4, 28, { hue: "track", glyph: "shield", title: "Policy", sub: "role and attributes", at: "n", group: "policy" }),
      prism("catalog", 12, -1, 1.4, 1.4, 28, { hue: "mint", glyph: "key", title: "Catalog", sub: "vends credentials", at: "n", group: "credential" }),
      prism("kms", 18, 4, 1.4, 1.4, 28, { hue: "sand", glyph: "lock", title: "Key manager", sub: "protects data key", at: "se", group: "encrypt" }),
      fullTable,
      restrictedTable,
      pill("log", [256, 460], "principal · action · time", { glyph: "file", group: "audit" }),
    ],
  },
  steps: [
    step({
      id: "shared", label: "Shared key", kind: "problem", title: "One storage key exposes the whole table",
      caption: "Finance needs order totals, but the shared storage credential also reaches every row and customer email. Access to the bucket alone does not express the reader's purpose.",
      show: ["full"], counters: ["all", "all", "long-lived", "none"],
      rides: [ride("main", "request", "result", "Finance: SELECT *", { tone: "alert" })],
      body: ["The storage layer holds files, while the query platform decides which rows and columns a user may see. A table-scoped storage credential limits access to the files, not to a person's query result."],
      claims: ["access-control-and-data-protection-credentials", "access-control-and-data-protection-filtering"],
    }),
    step({
      id: "policy", label: "Policy", kind: "idea", title: "A policy binds access to a principal and context",
      caption: "The platform evaluates the reader's role and attributes against the requested table. Finance's policy names the region and columns needed for its work.",
      show: ["full", "policy"], counters: ["all", "all", "long-lived", "none"],
      rides: [ride("main", "request", "p-policy", "Finance request")],
      body: ["Role-based access control assigns permissions through job-function policies. Attribute-based access control can grant access when principal and resource attributes match. NIST defines least privilege as allowing only the access needed for assigned tasks."],
      claims: ["access-control-and-data-protection-authorization", "access-control-and-data-protection-governance"],
    }),
    step({
      id: "filter", label: "Filter", kind: "mechanism", title: "Row filters and column masks shape query results",
      caption: "The policy returns south-region orders and withholds the email column. Support can receive a different row and column view from the same table.",
      show: ["policy", "restricted"], counters: ["south only", "no email", "long-lived", "none"],
      rides: [ride("main", "p-policy", "result", "4471, 899")],
      body: ["Lake Formation data filters can specify row predicates and included or excluded columns. BigQuery row policies filter rows for users or groups; column policy tags are checked at query time, in addition to dataset permissions."],
      claims: ["access-control-and-data-protection-filtering", "access-control-and-data-protection-policy-tags"],
    }),
    step({
      id: "credentials", label: "Credentials", kind: "mechanism", title: "Credential vending limits direct storage access",
      caption: "After authorisation, the catalog returns short-lived credentials scoped to this table. The query engine reads the files without giving Finance a long-lived storage key.",
      show: ["policy", "restricted", "credential"], counters: ["south only", "no email", "short-lived, scoped", "none"],
      rides: [ride("main", "request", "store", "scoped access", { via: ["credential"] })],
      body: ["The Apache Iceberg REST protocol allows a catalog server to return short-lived, table-scoped storage credentials. The client uses them for reads and writes, and the credentials expire."],
      claims: ["access-control-and-data-protection-credentials"],
    }),
    step({
      id: "encryption", label: "Encryption", kind: "watch-out", title: "Encryption needs controlled keys",
      caption: "The data key encrypts the stored files. A key-management service protects that data key, so possession of the storage object does not grant the ability to decrypt it.",
      show: ["restricted", "credential", "encrypt"], counters: ["south only", "no email", "short-lived, scoped", "key use recorded"],
      rides: [ride("main", "store", "result", "encrypted files", { via: ["credential"] })],
      body: ["Envelope encryption uses a data key to encrypt the data and another key to encrypt the data key. Key policy and key use are separate control points: restrict who can decrypt or administer keys, and separate those duties from data access."],
      claims: ["access-control-and-data-protection-envelope"],
    }),
    step({
      id: "decision", label: "Decide", kind: "decision", title: "Combine policy, keys and an audit trail",
      caption: "",
      show: ["restricted", "credential", "encrypt", "audit"], counters: ["south only", "no email", "short-lived, scoped", "principal and action"],
      rides: [ride("main", "request", "result", "Finance: totals", { via: ["p-policy", "credential", "store"] })],
      body: [{ pair: {
        left: { label: "Authorise", items: ["Least privilege by role and context", "Filter rows and columns"] },
        right: { label: "Protect and review", items: ["Scope credentials and keys", "Record and audit access"] },
      } }, "NIST calls for least privilege and separation of duties. EU GDPR Article 32 requires security measures appropriate to risk, including encryption, confidentiality, integrity, availability, resilience and regular testing."],
      claims: ["access-control-and-data-protection-audit", "access-control-and-data-protection-law", "access-control-and-data-protection-governance"],
    }),
  ],
  governance: { text: "NIST calls for least privilege and access authorisations that support separation of duties. EU GDPR Article 32 requires security measures appropriate to risk, including encryption where appropriate, and regular testing.", claims: ["access-control-and-data-protection-governance", "access-control-and-data-protection-law"] },
  closing: {
    pitfalls: [
      "Treating bucket access as row- and column-level authorisation.",
      "Allowing analysts to keep broad, long-lived storage credentials after a query is authorised.",
      "Encrypting files while giving the same broad group access to the data keys and audit settings.",
    ],
    questions: [
      "Which roles and request attributes determine a reader's rows and columns?",
      "How does a query engine obtain storage access, and when do its credentials expire?",
      "Who can administer keys and policies, and where can access be audited?",
    ],
  },
});
