import { CANVAS, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt, Row } from "@signal-path/engine";

// The floor: the orders table twice, one block per value. A row of the table is a line of four blocks
// (order, region, amount, email) and the six orders stand in three regions, two each.
// On the left the table as stored. On the right the same table as the reader receives it: the object that changes.
// First everything arrives through a shared key. Then a row filter leaves one region, a mask blacks out email,
// a tag lets Support read email, a catalog vends a credential in place of the shared key, and at the end
// the stored blocks are encrypted under a key manager and an audit log stands where the result card stood.
const G = isoGrid(352, 80, 30);
const SIZE = 1, FP = 2.3, RP = 1.15, H = 20, R = 10.6, AX = 0, BX = 8.7, C = 17.75, V = 7.45;
const FIELD: Hue[] = ["sand", "mint", "sky", "rose"];
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
/** The table in one state: which orders are present, whether email is masked, whether the blocks are encrypted. */
const grid = (id: string, gx0: number, group: string, rows: number[], o: { mask?: boolean; lock?: boolean } = {}): El[] =>
  [0, 1, 2, 3, 4, 5].flatMap((k) => [0, 1, 2, 3].map((f): El => prism(`${id}-${k}-${f}`, gx0 + k * RP, f * FP, SIZE, SIZE, H, {
    group, ...(rows.includes(k) ? { hue: f === 3 && o.mask ? "ink" as Hue : FIELD[f], glyph: o.lock ? "lock" : undefined } : { state: "closed" as const }),
  })));
const ALL = [0, 1, 2, 3, 4, 5], SOUTH = [2, 3], WEST = [4, 5];
const ORDERS = [["4468", "north", "129", "a.k@…"], ["4469", "north", "349", "j.p@…"], ["4470", "south", "899", "m.l@…"], ["4471", "south", "1290", "s.o@…"], ["4472", "west", "1450", "t.r@…"], ["4473", "west", "2100", "k.d@…"]];
const SEE: Pt = [830, 240];
/** The query result as values, on a card behind the reader's grid. */
const sees = (group: string, who: string, sub: string, rows: number[], mask = false): El =>
  raise(table(`see-${group}`, 0, 0, 240, ["order", "region", "amount", "email"],
    rows.map((k): Row => ({ cells: mask ? [...ORDERS[k].slice(0, 3), "*****"] : ORDERS[k] })),
    { at: [12, 62, 122, 180], columnHues: [undefined, undefined, undefined, "rose"], rowH: 22, title: `${who} sees`, sub, mono: true, group }), SEE, 26);
const view = (group: string, who: string, sub: string): El => pill(`v-${group}`, [880, 384], `${who} sees`, { sub, group });
const engine = (group: string, sub: string): El =>
  prism(`eng-${group}`, V - 2.5, R + 0.6, 1.2, 1.2, 30, { hue: "track", glyph: "shield", title: "Query engine", sub, at: "s", group });

export default defineGuide({
  id: "access-control-and-data-protection", track: "data", module: "Storage", slug: "access-control-and-data-protection",
  title: "Access control and data protection",
  summary: "Who can read which rows and columns is decided by policy at the platform, backed by encryption and key management.",
  forLeads: "A storage key gives every holder the same reach. Decide each reader's rows and columns in policy at the query platform, hand out storage credentials that are scoped and expire, keep encryption keys in a key manager, and log every access.",
  status: "draft", minutes: 7,
  counters: ["Finance rows", "Finance email", "Storage credential", "Audit trail"],
  whatIf: { label: "What if everyone kept the shared key?", step: 0, from: 4 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, regions, emails and log times are illustrative",
    label: "The orders table is drawn twice as blocks on the floor, one block per value: six orders in three regions, each with an order number, a region, an amount and an email. On the left is the table as stored, on the right the same table as the reader receives it, with the values on a card behind. A rail runs from storage past a query engine to the reader. Through a shared storage key Finance receives all six orders with every email. A row filter then leaves only the two south orders. A column mask blacks out their email values. A tag policy lets Support, which holds the tag personal, read the email of the two west orders. A catalog then vends a short-lived credential scoped to the table in place of the shared key. At the last stop the stored blocks carry locks, a key manager stands behind them and an audit log lists each read.",
    els: [
      line("rail", [G.p(1.6, R), G.p(C, R), G.p(C, 6.9)], { always: true }),
      stop("s-store", ...G.p(2.2, R), undefined, undefined, { big: true, always: true }),
      stop("s-gate", ...G.p(V, R), undefined, undefined, { always: true }),
      stop("s-view", ...G.p(12.6, R), undefined, undefined, { always: true }),
      stop("s-fin", ...G.p(C, 9), undefined, undefined, { always: true }),

      // the table as stored
      ...grid("a", AX, "a", ALL), ...grid("ae", AX, "a-enc", ALL, { lock: true }),
      pill("a-l", [112, 40], "orders", { sub: "as stored", group: "a-name" }),
      pill("a-le", [112, 40], "orders", { sub: "encrypted", glyph: "lock", group: "a-enc" }),
      ...["order", "region", "amount"].map((k, f) => pill(`f-${k}`, up(AX - 1.1, f * FP + SIZE / 2, 18), k, { anchor: "end", mono: true, always: true })),
      pill("f-email", up(AX - 1.1, 3 * FP + SIZE / 2, 18), "email", { anchor: "end", mono: true, group: "plain" }),
      pill("f-email-t", up(AX - 1.1, 3 * FP + SIZE / 2, 18), "email", { glyph: "flag", anchor: "end", mono: true, group: "tagged" }),
      ...["north", "south", "west"].map((k, i) => pill(`r-${k}`, up(AX + i * 2 * RP + 1.1, -1.3, 36), k, { mono: true, always: true })),

      // what guards the storage
      pill("key", [90, 432], "shared key", { sub: "opens every file", glyph: "key", tone: "alert", to: G.p(2.2, R), group: "key" }),
      pill("cred", [90, 432], "vended credential", { sub: "this table, expires", glyph: "key", to: G.p(2.2, R), group: "cred" }),

      // the same table as the reader receives it
      ...grid("b1", BX, "b-full", ALL), ...grid("b2", BX, "b-rows", SOUTH), ...grid("b3", BX, "b-mask", SOUTH, { mask: true }), ...grid("b4", BX, "b-sup", WEST),
      view("b-full", "Finance", "every row and field"), view("b-rows", "Finance", "south rows only"),
      view("b-mask", "Finance", "south, email masked"), view("b-sup", "Support", "west, email in clear"),
      sees("b-full", "Finance", "6 of 6 rows", ALL), sees("b-rows", "Finance", "2 of 6 rows", SOUTH),
      sees("c-mask", "Finance", "email masked", SOUTH, true), sees("b-sup", "Support", "holds tag personal", WEST),
      pawn("fin", C + 0.6, 5.6, "Finance", undefined, { hue: "track", group: "fin" }),
      pawn("sup", C + 0.6, 5.6, "Support", undefined, { hue: "violet", group: "sup" }),

      // the policy at the platform
      engine("e-row", "row filter: south"), engine("e-mask", "filter and mask"), engine("e-tag", "policy on tags"),

      // 5. the catalog vends a credential
      line("spur", [G.p(V, -2.3), G.p(V, R)], { group: "cat" }),
      stop("s-cat", ...G.p(V, -1.3), undefined, undefined, { group: "cat" }),
      prism("catalog", V - 0.6, -3.5, 1.2, 1.2, 28, { hue: "mint", glyph: "map", title: "Catalog", sub: "vends credentials", at: "n", group: "cat" }),

      // 6. key manager and audit log
      drum("kms", 10.1, R + 5.2, 0.9, 30, { hue: "sand", glyph: "key", title: "Key manager", sub: "wraps the data key", at: "e", group: "enc" }),
      raise(table("audit", 0, 0, 232, ["time", "who", "read"], [["09:14", "Finance", "south, 2 rows"], ["09:20", "Support", "west, 2 rows"], { cells: ["09:31", "Finance", "south, 2 rows"], hot: true }],
        { at: [12, 58, 122], rowH: 24, title: "Audit log", sub: "one entry per read", mono: true, group: "enc" }), [836, 240], 26),
    ],
  },
  steps: [
    step({
      id: "shared", label: "Shared key", kind: "problem", title: "A shared storage key shows every reader everything",
      caption: "Finance in the south region reads orders with the team's shared storage key. The key opens every file, so all six orders arrive with every customer email.",
      show: ["a", "a-name", "plain", "key", "b-full", "fin"], counters: ["6 of 6", "in clear", "shared key", "none"],
      rides: [ride("rail", "s-store", "s-fin", "6 rows, emails", { via: ["s-view"], tone: "alert" })],
      body: ["Each block is one value of the orders table: a line of four blocks per order, two orders per region. On the left is the table as stored, on the right the same table as the reader receives it.",
        "NIST's least privilege control allows only the accesses that are necessary to accomplish assigned tasks. Finance south needs the amounts of two orders."],
      claims: ["access-control-and-data-protection-governance"],
    }),
    step({
      id: "rows", label: "Row filter", kind: "idea", title: "A row filter returns only the reader's region",
      caption: "Readers now query through the platform, which holds the policy. A row filter on orders keeps the rows where region is south for Finance. The other four orders never arrive.",
      show: ["a", "a-name", "plain", "key", "b-rows", "fin", "e-row"], counters: ["2 of 6", "in clear", "shared key", "none"],
      rides: [ride("rail", "s-store", "s-gate", "6 rows"), ride("rail", "s-gate", "s-fin", "2 rows", { via: ["s-view"] })],
      body: ["In AWS Lake Formation a data filter holds a row filter expression that specifies the rows to include in query results. In BigQuery, row-level access policies act as filters that hide or display rows for a list of users or groups, and a user outside every list sees no rows.",
        { callout: { label: "Key idea", text: "The table is stored once. Each reader's result is computed from it at query time by the policy." } }],
      claims: ["access-control-and-data-protection-filtering", "access-control-and-data-protection-row-policies"],
    }),
    step({
      id: "mask", label: "Column mask", kind: "mechanism", title: "A column mask hides the email values",
      caption: "Finance needs amounts, not customers. A masking rule on the email column obscures its values at query time, based on the reader's role.",
      show: ["a", "a-name", "plain", "key", "b-mask", "c-mask", "fin", "e-mask"], counters: ["2 of 6", "masked", "shared key", "none"],
      rides: [ride("rail", "s-store", "s-gate", "m.l@…"), ride("rail", "s-gate", "s-fin", "*****", { via: ["s-view"] })],
      body: ["BigQuery data masking selectively obscures column data for user groups while still allowing them access to the column. Column-level access control can instead withhold the column: without the right role the column data is not available.",
        "A Lake Formation data filter combines both directions. Its column specification lists the columns to include or exclude, and with a row filter expression it gives cell-level security."],
      claims: ["access-control-and-data-protection-masking", "access-control-and-data-protection-policy-tags", "access-control-and-data-protection-filtering"],
    }),
    step({
      id: "tags", label: "Tags", kind: "mechanism", title: "An attribute-based policy decides from tags",
      caption: "The email column carries the tag personal. Support holds that tag and reads email in clear, here for its west orders. Finance does not hold it.",
      show: ["a", "a-name", "tagged", "key", "b-sup", "sup", "e-tag"], counters: ["2 of 6", "masked, by tag", "shared key", "none"],
      rides: [ride("rail", "s-store", "s-gate", "personal"), ride("rail", "s-gate", "s-fin", "t.r@…", { via: ["s-view"] })],
      body: ["Role-based access control defines permissions based on a person's job function. Attribute-based access control defines them based on attributes: a policy can allow an operation when the principal's tag matches the resource tag.",
        "Lake Formation calls these attributes LF-Tags. They attach to catalog resources, columns inherit them from tables, and an operation is allowed when the principal has been granted a tag value that matches the resource tag value. BigQuery attaches policy tags to columns and checks them at query time.",
        { callout: { label: "Key idea", text: "The rule names a tag, not a table. A column tagged on arrival is covered without a new grant." } }],
      claims: ["access-control-and-data-protection-authorization", "access-control-and-data-protection-tags", "access-control-and-data-protection-policy-tags"],
    }),
    step({
      id: "credentials", label: "Credentials", kind: "mechanism", title: "Short-lived scoped credentials replace the shared key",
      caption: "The shared key is retired. For each read the catalog vends a credential scoped to this table that soon expires, so readers need no long-lived storage credentials of their own.",
      show: ["a", "a-name", "tagged", "cred", "cat", "b-mask", "c-mask", "fin", "e-tag"], counters: ["2 of 6", "masked, by tag", "vended, expires", "none"],
      rides: [ride("spur", "s-cat", "s-gate", "credential"), ride("rail", "s-store", "s-fin", "2 rows", { via: ["s-gate", "s-view"] })],
      body: ["In the Apache Iceberg REST protocol the catalog server can return short-lived, table-scoped storage credentials when a table is loaded. Each credential is scoped to the table's storage prefixes, and vended credentials expire.",
        "AWS Lake Formation works the same way: it issues temporary, scoped-down credentials to query engines for the table's data location."],
      claims: ["access-control-and-data-protection-credentials", "access-control-and-data-protection-audit"],
    }),
    step({
      id: "decision", label: "Decide", kind: "decision", title: "Policy decides and protection backs it",
      caption: "",
      show: ["a-enc", "tagged", "cat", "enc", "b-mask", "fin", "e-tag"], counters: ["2 of 6", "masked, by tag", "vended, expires", "every read"],
      rides: [ride("rail", "s-store", "s-gate", "encrypted"), ride("rail", "s-gate", "s-fin", "2 rows", { via: ["s-view"], then: "logged" })],
      body: [{ pair: {
        left: { label: "Policy at the platform", items: ["Row filters and column masks", "Roles and tags, least privilege"] },
        right: { label: "Protection behind it", items: ["Scoped credentials that expire", "Encrypted files, keys in a key manager", "An audit log of data access"] },
      } },
        "Envelope encryption is the practice of encrypting data with a data key and then encrypting the data key under another key. AWS KMS keys never leave its hardware security modules unencrypted, so using one means calling the key manager.",
        "AWS CloudTrail records who made a request to Lake Formation, when, and from which address. An entry is logged whenever a principal or an integrated service requests temporary credentials to access data.",
        "NIST asks that audit records establish what type of event occurred, when, where, its source, its outcome and the identities involved. Separation of duties includes that the people who administer access control do not also administer audit.",
        "Article 32 of the EU GDPR calls for security appropriate to the risk, including as appropriate encryption of personal data and a process for regularly testing the measures."],
      claims: ["access-control-and-data-protection-envelope", "access-control-and-data-protection-audit", "access-control-and-data-protection-governance", "access-control-and-data-protection-law"],
    }),
  ],
  governance: { text: "NIST SP 800-53 asks for least privilege, for access authorisations that support separation of duties, and for audit records that establish what happened, when, and who was involved. Those who administer access control should not also administer audit.", claims: ["access-control-and-data-protection-governance"] },
  closing: {
    pitfalls: [
      "Writing row and column policies while a shared storage key still opens the files underneath.",
      "Granting table by table until nobody can say who reads a personal column, instead of granting on its tag.",
      "Encrypting the files while the same administrators control the keys, the policies and the audit log.",
    ],
    questions: [
      "Which rows and which columns does each team's work need?",
      "How does the query engine get storage access, and when does that credential expire?",
      "Who can use each encryption key, and where is a read of the orders table recorded?",
    ],
  },
});
