import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Hue, Pt, Row } from "@signal-path/engine";

// The floor: two datasets drawn as blocks, one row of blocks per order and one block per value.
// On the left the orders as Checkout landed them, on the right the copy the pipeline makes for Finance.
// The email blocks are the story. They start unmarked, get a tag, and then the copy changes form:
// the blocks are absent, blacked out, or replaced by tokens whose mapping sits in a vault off the main rail.
// At the last stop whole records leave both datasets and the vault.
const G = isoGrid(455, 110, 30);
const SIZE = 1.2, FP = 2.2, RP = 1.4, H = 20, R = 10, AX = 0, BX = 8.2, C = 15.9, V = 6.8;
const PLAIN: Hue[] = ["sand", "mint", "sky"];
type Email = "raw" | "tag" | "none" | "mask" | "token";
const EMAIL: Record<Exclude<Email, "none">, { hue: Hue; glyph?: string }> = {
  raw: { hue: "paper" }, tag: { hue: "rose", glyph: "lock" }, mask: { hue: "ink" }, token: { hue: "violet" },
};
/** One dataset in one state: four orders of four values. `email` is the form of the email values, `gone` the orders removed. */
const dataset = (id: string, gx0: number, group: string, email: Email, gone: number[] = []): El[] =>
  [0, 1, 2, 3].flatMap((k) => [0, 1, 2, 3].flatMap((f): El[] => {
    if (f === 3 && email === "none") return [];
    const look = gone.includes(k) ? { state: "closed" as const } : f < 3 ? { hue: PLAIN[f] } : EMAIL[email as Exclude<Email, "none">];
    return [prism(`${id}-${k}-${f}`, gx0 + k * RP, f * FP, SIZE, SIZE, H, { group, ...look })];
  }));
const up = (gx: number, gy: number, dy: number): Pt => [G.p(gx, gy)[0], G.p(gx, gy)[1] - dy];
const ORDERS = [["4468", "store", "129"], ["4469", "store", "349"], ["4470", "web", "899"], ["4471", "web", "1290"]];
const EMAILS = ["a.k@…", "j.p@…", "m.l@…", "s.o@…"], TOKENS = ["T-3K9", "T-7QD", "T-5M2", "T-8F2"];
const SEE: Pt = [828, 186], VAULT: Pt = [82, 522];
/** What a Finance query returns from the copy. */
const sees = (group: string, sub: string, last: string[] | undefined, hue: Hue | undefined, gone: number[] = []): El =>
  raise(table(`see-${group}`, 0, 0, 250, last ? ["order", "channel", "amount", "email"] : ["order", "channel", "amount"],
    ORDERS.map((o, k): Row => ({ cells: last ? [...o, last[k]] : o, strike: gone.includes(k) })),
    { at: [12, 66, 130, 190], columnHues: [undefined, undefined, undefined, hue], rowH: 24, title: "Finance sees", sub, mono: true, group }), SEE, 26);
const vaultCard = (group: string, gone: number[] = []): El =>
  raise(table(`map-${group}`, 0, 0, 150, ["token", "email"], TOKENS.map((t, k): Row => ({ cells: [t, EMAILS[k]], strike: gone.includes(k) })),
    { at: [12, 82], rowH: 22, title: "Vault", sub: "the way back", mono: true, group }), VAULT, 10);
const copyLabel = (group: string, sub: string): El => pill(`b-l-${group}`, [866, 208], "copy for Finance", { sub, group });

export default defineGuide({
  id: "sensitive-data-handling", track: "data", module: "Ingestion", slug: "sensitive-data-handling",
  title: "Sensitive data handling",
  summary: "Personal and regulated data is identified on arrival and minimised, masked or tokenised, with retention and erasure built into the pipeline.",
  forLeads: "A sensitive field has a purpose, a permitted audience and an end date. Tag it on arrival, give each downstream copy the least identifying form its purpose allows, and make retention and erasure jobs that run.",
  status: "draft", minutes: 7,
  counters: ["Personal fields", "Email in the copy", "Way back to the person", "Kept for"],
  whatIf: { label: "What if the email travelled everywhere?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, emails, tokens and the 24 month period are illustrative",
    label: "Two datasets are drawn as blocks on the floor, one row of four blocks per order: order, channel, amount and email. On the left are the orders as Checkout landed them, on the right the copy made for Finance. A rail runs from Checkout past both to Finance. At first the email blocks are unmarked and the copy holds all of them. A classifier at intake then tags them as personal, shown in rose with a lock. Under minimisation the copy has no email blocks. Under masking the email blocks in the copy are blacked out. Under tokenisation they are replaced by violet token blocks, and a vault off the main rail holds the table matching tokens to emails. At the last stop one order has passed its retention period and one has been erased on request: both are gone from the orders, the copy and the vault.",
    els: [
      line("rail", [G.p(-2.7, R), G.p(C, R), G.p(C, 4.6)], { always: true }),
      stop("s-in", ...G.p(-2.1, R), undefined, undefined, { always: true }),
      stop("s-store", ...G.p(3.3, R), undefined, undefined, { always: true }),
      stop("s-gate", ...G.p(V, R), undefined, undefined, { always: true }),
      stop("s-copy", ...G.p(11.5, R), undefined, undefined, { always: true }),
      stop("s-fin", ...G.p(C, 7.3), undefined, undefined, { always: true }),
      prism("co", -3.9, R - 0.6, 1.2, 1.2, 30, { hue: "track", glyph: "pen", title: "Checkout", at: "n", always: true }),
      prism("fin", C - 0.6, 3.4, 1.2, 1.2, 30, { glyph: "chart", title: "Finance", sub: "amount by channel", at: "se", always: true }),

      // the orders as landed
      ...dataset("a1", AX, "a-raw", "raw"), ...dataset("a2", AX, "a-tag", "tag"), ...dataset("a6", AX, "a-end", "tag", [0, 3]),
      pill("a-l", up(AX + 2.5, -1.6, 50), "orders", { sub: "as landed", group: "a-name" }),
      ...["order", "channel", "amount"].map((k, f) => pill(`f-${k}`, up(AX - 1.3, f * FP + SIZE / 2, 18), k, { anchor: "end", mono: true, always: true })),
      pill("f-email", up(AX - 1.3, 3 * FP + SIZE / 2, 18), "email", { anchor: "end", mono: true, group: "plain" }),
      pill("f-email-t", up(AX - 1.3, 3 * FP + SIZE / 2, 18), "email", { glyph: "lock", anchor: "end", mono: true, group: "tagged" }),

      // 2. classification on arrival
      stop("s-tag", ...G.p(0.6, R), undefined, undefined, { group: "tagged" }),
      prism("cls", 0, R + 0.6, 1.2, 1.2, 24, { hue: "rose", glyph: "flag", title: "Classifier", sub: "tags on arrival", at: "s", group: "tagged" }),
      raise(table("tags", 0, 0, 250, ["column", "tag"], [["order", "internal"], ["channel", "internal"], ["amount", "internal"], { cells: ["email", "personal"], hot: true }],
        { at: [12, 120], rowH: 24, title: "orders, tags", sub: "set at intake", mono: true, group: "tags" }), SEE, 26),

      // the copy for Finance, one form per stop
      ...dataset("b1", BX, "b-raw", "raw"), ...dataset("b2", BX, "b-tag", "tag"), ...dataset("b3", BX, "b-min", "none"),
      ...dataset("b4", BX, "b-mask", "mask"), ...dataset("b5", BX, "b-token", "token"), ...dataset("b6", BX, "b-end", "token", [0, 3]),
      copyLabel("b-raw", "every field"), copyLabel("b-tag", "every field"), copyLabel("b-min", "no email"),
      copyLabel("b-mask", "email masked"), copyLabel("b-token", "email as token"), copyLabel("b-end", "two orders gone"),
      sees("b-raw", "emails in clear", EMAILS, undefined),
      sees("b-min", "three fields", undefined, undefined),
      sees("b-mask", "by masking rule", EMAILS.map(() => "*****"), "rose"),
      sees("b-token", "tokens join", TOKENS, "violet"),
      sees("b-end", "after deletion", TOKENS, "violet", [0, 3]),

      // 5 and 6. the vault, off the main rail
      line("spur", [G.p(V, R), G.p(V, 13.8)], { group: "vault" }),
      stop("s-vault", ...G.p(V, 12.2), undefined, undefined, { group: "vault" }),
      drum("vault", V, 14.9, 1.1, 34, { hue: "violet", glyph: "key", title: "Token vault", sub: "restricted", at: "se", group: "vault" }),
      vaultCard("b-token"), vaultCard("b-end", [0, 3]),

      // 6. what removed the two orders
      pill("exp", [465, 40], "4468: past 24 months", { glyph: "clock", to: up(AX + 0.6, 0.6, H), group: "b-end" }),
      pill("req", [612, 100], "4471: erased", { glyph: "x", to: up(AX + 3 * RP + 0.6, 0.6, H), group: "b-end" }),
    ],
  },
  steps: [
    step({
      id: "arrival", label: "Arrival", kind: "problem", title: "Every copy carries the customer email",
      caption: "Checkout lands each order with its email, and the pipeline copies every field to Finance. Nothing marks which values are personal, so each copy exposes them.",
      show: ["a-raw", "a-name", "plain", "b-raw"], counters: ["unmarked", "in clear", "direct", "no limit"],
      rides: [ride("rail", "s-in", "s-fin", "4471 s.o@…", { via: ["s-store", "s-copy"] })],
      body: ["Finance reports the amount by channel. The copy it receives also holds four email values the report never uses.",
        "The EU GDPR requires personal data to be adequate, relevant and limited to what is necessary for the purposes it is processed for."],
      claims: ["sensitive-data-handling-purpose"],
    }),
    step({
      id: "classify", label: "Classify", kind: "idea", title: "Classification tags mark personal fields on arrival",
      caption: "A classifier at intake tags the email field as personal. Every email value now carries that mark, and later steps can apply a rule to it.",
      show: ["a-tag", "a-name", "tagged", "tags", "b-tag"], counters: ["email tagged", "in clear", "direct", "no limit"],
      rides: [ride("rail", "s-in", "s-gate", "s.o@…", { via: ["s-tag"], then: "personal" })],
      body: ["A classification tag names a data class and attaches it to a column. In BigQuery a single data class can be applied to multiple columns using a policy tag, and policy tags enforce column-level access control and dynamic data masking.",
        { callout: { label: "Key idea", text: "The tag changes nothing by itself. It is what minimisation, masking, tokenisation and deletion rules are written against." } }],
      claims: ["sensitive-data-handling-tags"],
    }),
    step({
      id: "minimise", label: "Minimise", kind: "mechanism", title: "Minimisation leaves the field out",
      caption: "Finance reports amount by channel. The pipeline copies only those fields, so the email never reaches the copy and cannot leak from it.",
      show: ["a-tag", "a-name", "tagged", "b-min"], counters: ["email tagged", "absent", "none", "no limit"],
      rides: [ride("rail", "s-store", "s-fin", "4471 web 1290", { via: ["s-gate"] })],
      body: ["Data minimisation is a principle of the EU GDPR: personal data is limited to what is necessary for its purposes. Article 25 adds that, by default, only personal data necessary for each specific purpose is processed.",
        { callout: { label: "Key idea", text: "Removing a field is the only form of protection that leaves nothing to protect downstream." } }],
      claims: ["sensitive-data-handling-purpose", "sensitive-data-handling-design"],
    }),
    step({
      id: "mask", label: "Mask", kind: "mechanism", title: "Masking hides the value from the reader",
      caption: "The email stays in the table. A masking rule on its tag obscures it at query time: Finance gets masked values, and an authorised role still reads the original.",
      show: ["a-tag", "a-name", "tagged", "b-mask"], counters: ["email tagged", "masked", "by role", "no limit"],
      rides: [ride("rail", "s-store", "s-fin", "4471 *****", { via: ["s-gate"] })],
      body: ["BigQuery data masking selectively obscures sensitive data and gives different levels of visibility to different groups of users. A query against the column returns unmasked data, masked data or an access denied error, depending on the user's groups and roles.",
        "Google Sensitive Data Protection masks a string fully or partially by replacing a given number of characters with a fixed character.",
        "Masking protects what a reader sees. The stored value is unchanged, so the table still needs its access controls, its retention period and a place in every erasure."],
      claims: ["sensitive-data-handling-masking", "sensitive-data-handling-tags", "sensitive-data-handling-tokenisation"],
    }),
    step({
      id: "tokenise", label: "Tokenise", kind: "mechanism", title: "Tokens replace the value and a vault keeps the mapping",
      caption: "Pseudonymisation swaps each email for a token, so records of one customer still join. The table matching tokens to emails stays in a separate, restricted vault.",
      show: ["a-tag", "a-name", "tagged", "b-token", "vault"], counters: ["email tagged", "token", "through the vault", "no limit"],
      rides: [ride("spur", "s-gate", "s-vault", "s.o@…", { then: "T-8F2" }), ride("rail", "s-gate", "s-fin", "4471 T-8F2", { via: ["s-copy"] })],
      body: ["The EU GDPR defines pseudonymisation as processing after which the data can no longer be attributed to a specific person without additional information that is kept separately. The EDPB names two classes of transformation: cryptographic algorithms and lookup tables. The secret is a key in the first case and the table in the second.",
        "Payment-card tokenisation gave the store its name. In the PCI guidelines the card data vault is the central repository for card numbers and their tokens, and exchanging a token for the original value is restricted to specifically authorised people and systems.",
        "A token can also be computed with a key and no table. Google Sensitive Data Protection generates tokens cryptographically, either one-way or reversible.",
        { callout: { label: "Watch out", text: "Pseudonymised data that could be attributed to a person with the additional information is still personal data, even when someone else holds that information." } }],
      claims: ["sensitive-data-handling-pseudonymised", "sensitive-data-handling-vault", "sensitive-data-handling-tokenisation", "sensitive-data-handling-design"],
    }),
    step({
      id: "decision", label: "Retain and erase", kind: "decision", title: "Retention and erasure are steps in the pipeline",
      caption: "",
      show: ["a-end", "tagged", "b-end", "vault"], counters: ["email tagged", "token", "through the vault", "24 months"],
      rides: [ride("rail", "s-in", "s-fin", "erase s.o@…", { via: ["s-store", "s-gate", "s-copy"] })],
      body: [{ pair: {
        left: { label: "Retention schedule", items: ["A time limit for each dataset", "A job deletes what has expired"] },
        right: { label: "Erasure request", items: ["Find the person in every copy", "Delete the vault entry as well"] },
      } },
        "The EU GDPR keeps personal data in identifiable form no longer than its purposes need, and its recital 39 asks the controller to set time limits for erasure or periodic review. A retention schedule records those limits. In BigQuery a partition expiration sets how long each partition is kept, and expired partitions are deleted by a background process.",
        "Article 17 gives a person the right to erasure without undue delay on specified grounds, with exceptions such as legal obligations and legal claims. An erasure workflow has to reach the landed orders, every copy and the vault: the rights of the person still apply to pseudonymised data.",
        "Deleting the vault entry removes the way back, but the EDPB notes that the remaining data becomes anonymous only if the conditions for anonymity are met.",
        "Where the copies are stored is part of the same design. A transfer of personal data to a country outside the European Union must meet the conditions of Chapter V of the EU GDPR."],
      claims: ["sensitive-data-handling-purpose", "sensitive-data-handling-retention", "sensitive-data-handling-erasure", "sensitive-data-handling-pseudonymised", "sensitive-data-handling-transfers"],
    }),
  ],
  governance: { text: "Purpose limitation, data minimisation and storage limitation under the EU GDPR decide which fields each copy may hold and for how long. The same law gives a right to erasure on specified grounds and sets conditions for transfers of personal data to third countries.", claims: ["sensitive-data-handling-purpose", "sensitive-data-handling-erasure", "sensitive-data-handling-transfers"] },
  closing: {
    pitfalls: [
      "Treating tokenised data as anonymous while a vault or a key can still reconnect it to a person.",
      "Masking a field for analysts while an unmasked copy of the table sits in an unrestricted dataset.",
      "Writing a retention period that no job enforces, or an erasure that stops at the first table.",
    ],
    questions: [
      "Which fields does each downstream purpose need at all?",
      "What differs between a masked email and a tokenised one, and who can reverse each?",
      "Which datasets and stores must an erasure request for one customer reach?",
    ],
  },
});
