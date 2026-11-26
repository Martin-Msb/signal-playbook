import { CANVAS, code, defineGuide, drum, isoGrid, line, pawn, pill, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El } from "@signal-path/engine";

// The floor: requests ride one rail along gy = 0 from Finance (back left) to the orders dataset (front right).
// Support's refund assistant joins the rail from behind. The catalogue entry of the dataset stands behind it and
// is the object that changes: it gains an owner, then labels. The policy check stands on the rail, and the
// unlabelled copy sits in front, reached by a rail that goes round the check.
const G = isoGrid(120, 125, 30);
const AT = { join: 3, wait: 6.6, hold: 7.6, gate: 11, own: 11.4, data: 15.4, end: 18, ds: 19.4 };
const ROW = 6.5;
const thin = (id: string, pts: [number, number][], group: string): El => line(id, pts.map(([x, y]) => G.p(x, y)), { tone: "ink", w: 3, group });
const entry = (id: string, owner: string, steward: string | undefined, classes: [string, string, string], alert = false): El =>
  raise(table(id, 0, 0, 206, ["column", "class"], [["order_id", classes[0]], ["amount", classes[1]], { cells: ["email", classes[2]], hot: classes[2] !== "?" }],
    { at: [12, 112], rowH: 26, title: "orders", sub: owner, foot: steward, tone: alert ? "alert" : undefined, group: id }), G.p(AT.ds, -4.2), 34);

export default defineGuide({
  id: "data-governance", track: "data", module: "Data and databases", slug: "data-governance",
  title: "Data governance",
  summary: "A dataset becomes governed when it has a named owner, a classification on every column and rules for its use that are checked on every request.",
  forLeads: "Governance is a small set of decisions per dataset: who is accountable, how sensitive each column is and who may use it for what. Written as code and tied to labels, those decisions hold without a meeting.",
  status: "draft", minutes: 7,
  counters: ["Owner", "Columns labelled", "Rules", "Enforced"],
  whatIf: { label: "What if orders had no owner?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Teams, labels and the rule are illustrative",
    label: "Requests from Finance and from Support's refund assistant ride one rail to the orders dataset. Its catalogue entry stands behind it. First the entry has no owner and no labels and every request passes. Then an owner and a steward are named, each column gets a class, and a policy check on the rail evaluates a rule written as code. A copy of the dataset without labels is reached by a rail that goes round the check, until the labels follow the copy.",
    els: [
      line("main", [G.p(0, 0), G.p(AT.end, 0)], { always: true }),
      line("sup", [G.p(AT.join, -4.6), G.p(AT.join, 0), G.p(AT.end, 0)], { always: true }),
      stop("p-req", ...G.p(0, 0), undefined, undefined, { big: true, always: true }),
      stop("p-join", ...G.p(AT.join, 0), undefined, undefined, { always: true }),
      stop("p-own", ...G.p(AT.own, 0), undefined, undefined, { always: true }),
      stop("p-data", ...G.p(AT.data, 0), undefined, undefined, { always: true }),
      pawn("fin", -1.3, 0, "Finance", undefined, { always: true }),
      prism("asst", AT.join - 0.6, -5.8, 1.2, 1.2, 28, { hue: "sand", glyph: "net", title: "Refund assistant", sub: "Support", at: "w", always: true }),
      drum("orders", AT.ds, 0, 1.2, 40, { hue: "sky", glyph: "table", title: "orders", sub: "dataset", at: "e", always: true }),
      thin("st-entry", [[AT.ds, -1.2], [AT.ds, -4.2]], "post"),

      // the catalogue entry: no owner, then an owner and a steward, then a class on every column
      entry("c0", "owner: nobody", undefined, ["?", "?", "?"], true),
      entry("c1", "owner: Operations", "steward: data team", ["?", "?", "?"]),
      entry("c2", "owner: Operations", "steward: data team", ["internal", "internal", "personal"]),
      pawn("owner", 13.8, 3.4, "Data owner", undefined, { hue: "track", group: "roles" }),
      pawn("steward", 17, 3.4, "Data steward", undefined, { hue: "mint", group: "roles" }),
      pill("cls", [612, 252], "a class per column", { glyph: "flag", to: [724, 282], group: "cls" }),

      // the rule as code, checked on the rail
      prism("gate", AT.gate - 0.6, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "shield", group: "gate" }),
      stop("p-wait", ...G.p(AT.wait, 0), undefined, undefined, { group: "gate" }),
      stop("p-hold", ...G.p(AT.hold, 0), undefined, undefined, { group: "gate" }),
      stop("p-gate", ...G.p(AT.gate, 0), undefined, undefined, { group: "gate" }),
      thin("st-rule", [[AT.gate, -0.6], [AT.gate, -3.4]], "gate"),
      raise(code("rule", 0, 0, 282, ["default allow := false", "allow if input.class == \"internal\"", "allow if {", "  input.class == \"personal\"", "  input.team == \"support\"", "}"],
        { title: "Policy check", sub: "Rego, on every request", keywords: ["default", "allow", "if"], hot: [3, 4], group: "gate" }), G.p(AT.gate, -3.4), 34),

      // the copy
      thin("cp", [[AT.ds, 1.2], [AT.ds, ROW], [14.2, ROW]], "cpl"),
      drum("copy", 13, ROW, 1.1, 34, { hue: "sky", glyph: "table", title: "orders_copy", sub: "no owner, no labels", at: "s", group: "copy" }),
      line("by", [G.p(6, 0), G.p(6, ROW), G.p(11.9, ROW)], { tone: "alert", group: "copy" }),
      stop("p-by", ...G.p(6, 0), undefined, undefined, { group: "copy" }),
      stop("p-copy", ...G.p(9, ROW), undefined, undefined, { group: "copy" }),
      drum("copy2", 13, ROW, 1.1, 34, { hue: "sky", glyph: "table", title: "orders_copy", sub: "labels inherited", at: "s", group: "fix" }),
      line("byx", [G.p(6, 0), G.p(6, ROW), G.p(11.9, ROW)], { state: "closed", group: "fix" }),
    ],
  },
  steps: [
    step({
      id: "nobody", label: "No owner", kind: "problem", title: "Nobody decides who may read orders",
      caption: "Finance and Support's refund assistant both read every column of the orders table, customer emails included. The dataset has no owner, no labels and no written rules, so every request passes.",
      show: ["post", "c0"], counters: ["nobody", "0 of 3", "unwritten", "nowhere"],
      rides: [ride("main", "p-req", "p-data", "Finance: all"), ride("sup", 0, "p-own", "Support: all")],
      body: ["The schema says what the orders table contains. It does not say who is answerable for it, how sensitive each column is or who may use it for what.",
        "Without agreed roles, nobody can approve a new use of the data and nobody can refuse one. A lack of shared understanding of roles, accountabilities and responsibilities is what blocks sharing and reuse of data."],
      claims: ["data-governance-ownership"],
    }),
    step({
      id: "owner", label: "Owner", kind: "idea", title: "Every dataset gets a named owner",
      caption: "Operations becomes data owner of orders, accountable for decisions about its use. A data steward in the data team handles the day-to-day work. Finance's request now has someone to answer it.",
      show: ["post", "c1", "roles"], counters: ["Operations", "0 of 3", "unwritten", "nowhere"],
      rides: [ride("main", "p-req", "p-own", "Finance: all?")],
      body: ["Ownership here does not mean possession. It formalises who is responsible for the data throughout its life cycle and establishes accountability for access and usage.",
        "A data owner is a senior person who makes the decisions and answers for them: who may use the data, how long it is kept, who is authorised to see it. Data stewards do the day-to-day work that supports those decisions and implement policies and standards. Data custodians capture, store and dispose of the data as the owner requires.",
        { callout: { label: "Key idea", text: "The owner is accountable, the steward is responsible day to day. The UK government's data asset management policy of 27 May 2026 requires a named data owner for every identified data asset." } }],
      claims: ["data-governance-ownership", "data-governance-owner", "data-governance-steward", "data-governance-named-owner"],
    }),
    step({
      id: "classify", label: "Classification", kind: "mechanism", title: "A classification labels each column",
      caption: "The steward records a class for every column in the catalogue. The email column is personal, the rest internal. A label states sensitivity, and rules attach to labels, not to single tables.",
      show: ["post", "c2", "roles", "cls"], counters: ["Operations", "3 of 3", "unwritten", "nowhere"],
      body: ["A classification scheme is a short list of classes, each with the handling it requires. The UK government's scheme has three tiers, OFFICIAL, SECRET and TOP SECRET. A classification indicates sensitivity in terms of the likely impact of compromise, loss or misuse, and each tier brings a minimum set of controls.",
        "In data platforms the class is a tag on a column. Snowflake's sensitive data classification records a semantic category and a privacy category as tags on each sensitive column. In BigQuery a data steward builds a taxonomy of policy tags and assigns them to columns.",
        { callout: { label: "Key idea", text: "A policy set on a label protects every column that carries the label. A Snowflake tag-based masking policy protects a tagged column automatically, with no policy applied to the column by hand." } }],
      claims: ["data-governance-classification", "data-governance-column-labels", "data-governance-label-policy"],
    }),
    step({
      id: "code", label: "Policy as code", kind: "mechanism", title: "Rules are code checked on every request",
      caption: "The owner's rule is written in Rego and evaluated by a policy engine for each request. Support's refund assistant may read personal columns. Finance is denied the email.",
      show: ["post", "c2", "roles", "gate"], counters: ["Operations", "3 of 3", "as code", "on every request"],
      rides: [ride("main", "p-req", "p-hold", "Finance: email", { via: ["p-wait"], then: "Finance: deny" }), ride("sup", 0, "p-data", "Support: email", { via: ["p-gate"], then: "Support: allow" })],
      body: ["Open Policy Agent is an open source, general-purpose policy engine. Its declarative language, Rego, lets a rule be written as code, so the rule can be versioned, reviewed and tested like any other code.",
        "OPA decouples the decision from its enforcement. The system that guards the data sends the request as structured input, here the team and the class of the column, and OPA evaluates it against the policies and returns the decision.",
        "The first line sets the default: when no allow rule matches, the answer is false.",
        "Warehouses apply the same idea at query time. BigQuery checks the policy tag of a column and its policy to see whether the user is authorised."],
      claims: ["data-governance-policy-as-code", "data-governance-rego-default", "data-governance-label-policy"],
    }),
    step({
      id: "copy", label: "Copies", kind: "watch-out", title: "A copy without labels escapes the rules",
      caption: "The data team copies orders for an analysis. The copy carries no owner and no labels. Policies that follow labels do not reach it, and Finance reads the emails there.",
      show: ["post", "c2", "roles", "gate", "cpl", "copy"], counters: ["Operations", "3 of 3, copy 0", "as code", "not on the copy"],
      rides: [ride("by", "p-by", "p-copy", "Finance: email", { tone: "alert" })],
      body: ["Governance assigned to one table does not travel with its data unless the platform carries it. A policy tied to a label protects only what is labelled.",
        "Snowflake's tag propagation assigns the tags of a source object to the views and tables created from it, and the policies associated with the tags apply to the targets. It has to be enabled on the tag, by setting the PROPAGATE property."],
      claims: ["data-governance-propagation", "data-governance-label-policy"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What governance assigns and enforces",
      caption: "",
      show: ["post", "c2", "roles", "gate", "cpl", "fix"], counters: ["Operations", "3 of 3, copy 3", "as code", "on every request"],
      rides: [ride("main", "p-req", "p-data", "Finance: amount", { via: ["p-gate"], then: "Finance: allow" })],
      body: [{ pair: {
        left: { label: "It assigns", items: ["An owner per dataset", "A class per column", "Rules for each use"] },
        right: { label: "It enforces", items: ["Policy checks on every request", "Labels that follow copies", "Stewards for daily upkeep"] },
      } },
        "The DAMA-DMBOK, the data management body of knowledge published by DAMA International, draws the field as a wheel with Data Governance at the centre. Around it sit the other knowledge areas: Data Architecture, Data Modeling and Design, Data Storage and Operations, Data Security, Data Integration and Interoperability, Document and Content Management, Reference and Master Data, Data Warehousing and Business Intelligence, Metadata and Data Quality.",
        "The DAMA-DMBOK defines principles and practices and does not prescribe tools. The edition DAMA cites is the second edition, revised, of 2024, and DAMA states that a 3.0 project started in 2025."],
      claims: ["data-governance-owner", "data-governance-steward", "data-governance-propagation", "data-governance-dmbok", "data-governance-dmbok-edition"],
    }),
  ],
  governance: { text: "Governance names an accountable data owner and a steward for each dataset and a classification for each column. Access policies act on those roles and labels: a policy set on a label protects every column that carries it.", claims: ["data-governance-owner", "data-governance-steward", "data-governance-label-policy"] },
  closing: {
    pitfalls: [
      "Naming a team as owner. Accountability needs a named person who can decide.",
      "Classifying tables once and never the columns added later or the copies made from them.",
      "Keeping the rules in a document that no system evaluates.",
    ],
    questions: [
      "Who is accountable for the orders dataset, and who does the day-to-day work?",
      "Which columns in your most used dataset carry a class, and who set it?",
      "Where is the rule for personal data evaluated, and does a copy pass through the same check?",
    ],
  },
});
