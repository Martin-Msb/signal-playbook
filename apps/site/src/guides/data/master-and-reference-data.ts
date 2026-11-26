import { CANVAS, defineGuide, drum, isoGrid, line, list, pawn, prism, raise, ride, step, stop, table } from "@signal-path/engine";
import type { El, Pt } from "@signal-path/engine";

// The floor: one rail runs along gy = 0 from the webshop (back left) to Finance (front right). The app and the
// store till join it from behind. Customer records ride the rail through Match and Merge into the customer master.
// Three cards change across the stops: the source records (front left), the rules, scores and code list (front
// middle) and the golden record (back right).
const G = isoGrid(140, 105, 30);
const AT = { web: 1, app: 3.8, dpia: 5.4, store: 7.8, pre: 9.3, match: 11.5, mid: 13.5, merge: 15.4, master: 17.6, out: 20.1, end: 21.6 };
const BACK = -4, LEFT: Pt = [142, 526], MID: Pt = [418, 528], RIGHT: Pt = [820, 288];
const feeder = (id: string, gx: number): El => line(id, [G.p(gx, BACK), G.p(gx, 0), G.p(AT.end, 0)], { always: true });
const at = (id: string, gx: number, extra: { group?: string } = {}): El => stop(id, ...G.p(gx, 0), undefined, undefined, extra.group ? extra : { always: true });
const records = (id: string, sub: string, third: string, match?: [string, string, string]): El =>
  raise(table(id, 0, 0, 264, ["system", "id", match ? "match" : third], [
    ["web", "C-1041", match ? match[0] : "Maja Lind"],
    ["app", "A-77", match ? match[1] : "M. Lind"],
    match ? { cells: ["store", "S-3", match[2]], hot: match[2] === "?" } : ["store", "S-3", "Lind, Maja"],
  ], { at: [12, 76, 158], rowH: 24, title: "Customer records", sub, mono: true, group: id }), LEFT, 30);
const golden = (id: string, country: boolean): El =>
  raise(table(id, 0, 0, 264, ["field", "value", "from"], [
    ["name", "Maja Lind", "web"], ["email", "m.lind@…", "web"], ["phone", "070 555…", "app"],
    ...(country ? [{ cells: ["country", "SE", "code list"], hot: true }] : []),
  ], { at: [12, 84, 182], rowH: 24, title: "Golden record M-1", sub: "one winner per field", mono: true, group: id }), RIGHT, 30);

export default defineGuide({
  id: "master-and-reference-data", track: "data", module: "Modelling", slug: "master-and-reference-data",
  title: "Master and reference data",
  summary: "The same customer or product is recorded in many systems. Matching rules decide which records are the same entity, survivorship rules merge them into one golden record, and shared code lists keep the values comparable.",
  forLeads: "A customer count is only as good as the matching rules behind it. Those rules need a named steward, and linking records about people needs a privacy impact assessment before it starts.",
  status: "draft", minutes: 7,
  counters: ["Linked records", "Golden records", "Country values", "Privacy impact"],
  whatIf: { label: "What if nothing were matched?", step: 0, from: 3 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customer, scores and threshold are illustrative",
    label: "A rail runs from the webshop to Finance, and the loyalty app and the store till join it. Each system holds its own record of the customer Maja Lind, so Finance counts three customers. A match step on the rail gives records of the same customer one match ID: two by an exact rule, the third by a score that falls below the threshold a data steward has set, so the steward reviews and confirms it. A merge step then picks one winning value per field and writes one golden record into the customer master. A country code list maps three spellings to one code before matching. At the last stop an impact assessment stands on the rail before the match, and Finance counts one customer.",
    els: [
      line("main", [G.p(0, 0), G.p(AT.end, 0)], { always: true }),
      feeder("app", AT.app), feeder("store", AT.store),
      at("s-web", AT.web), at("j-app", AT.app), at("j-store", AT.store), at("s-pre", AT.pre), at("s-match", AT.match), at("s-mid", AT.mid),
      at("s-merge", AT.merge), at("s-master", AT.master), at("s-out", AT.out),
      stop("a-app", ...G.p(AT.app, BACK + 1), undefined, undefined, { always: true }),
      stop("a-store", ...G.p(AT.store, BACK + 1), undefined, undefined, { always: true }),

      // the three systems that each hold the customer
      prism("web", -1.4, -0.6, 1.2, 1.2, 30, { hue: "sky", glyph: "globe", title: "Webshop", at: "n", always: true }),
      prism("appsys", AT.app - 0.6, BACK - 1.2, 1.2, 1.2, 30, { hue: "sky", glyph: "pointer", title: "Loyalty app", at: "n", always: true }),
      prism("till", AT.store - 0.6, BACK - 1.2, 1.2, 1.2, 30, { hue: "sky", glyph: "stack", title: "Store till", at: "n", always: true }),
      prism("fin3", AT.end + 0.3, -0.6, 1.2, 1.2, 30, { glyph: "chart", title: "Finance", sub: "3 customers", at: "s", group: "three" }),
      prism("fin1", AT.end + 0.3, -0.6, 1.2, 1.2, 30, { glyph: "chart", title: "Finance", sub: "1 customer", at: "s", group: "one" }),

      // the source records, and the match ID they come to share
      records("rec0", "3 systems, 3 records", "name"),
      raise(table("held", 0, 0, 264, ["system", "email", "phone"], [["web", "m.lind@…", ""], ["app", "M.Lind@…", "070 555…"], ["store", "", "070 555…"]],
        { at: [12, 76, 170], rowH: 24, title: "What each holds", sub: "no shared key", mono: true, group: "held" }), RIGHT, 30),
      records("rec1", "one rule fired", "match", ["M-1", "M-1", "?"]),
      records("rec2", "linked by match ID", "match", ["M-1", "M-1", "M-1"]),

      // 2 and 3. matching: exact rules first, then a score against a threshold
      prism("match", AT.match - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "search", title: "Match", at: "n", group: "match" }),
      raise(list("rules", 0, 0, 226, ["email equal", "name and phone equal"], { title: "Matching rules", sub: "exact, in this order", numbered: true, group: "rules" }), MID, 30),
      raise(table("scores", 0, 0, 236, ["pair", "score", ""], [["web, app", "1.00", "match"], { cells: ["app, store", "0.86", "review"], hot: true }],
        { at: [12, 112, 168], rowH: 24, title: "Match scores", sub: "threshold 0.90", mono: true, group: "scores" }), MID, 30),
      pawn("steward", 11.5, 3.4, "Data steward", undefined, { hue: "track", group: "steward" }),

      // 4. merging: survivorship rules write the golden record
      prism("merge", AT.merge - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "merge", title: "Merge", at: "sw", group: "merge" }),
      drum("master", AT.master, 0, 1.05, 36, { hue: "track", glyph: "user", title: "Customer master", at: "sw", group: "merge" }),
      golden("gold", false), golden("gold-c", true),

      // 5. reference data: one code list for a value every system writes its own way
      prism("ref", AT.pre - 0.5, -0.5, 1, 1, 22, { hue: "mint", glyph: "table", group: "refp" }),
      raise(table("codes", 0, 0, 226, ["as written", "code"], [["Sweden", "SE"], ["SE", "SE"], { cells: ["Sverige", "SE"], hot: true }],
        { at: [12, 132], rowH: 24, title: "Reference data", sub: "country code list", mono: true, group: "codes" }), MID, 30),

      // 6. the controls: an owner for the rules, an assessment before linking
      at("s-dpia", AT.dpia, { group: "gov" }),
      prism("dpia", AT.dpia - 0.6, -0.6, 1.2, 1.2, 26, { hue: "rose", glyph: "shield", title: "Impact assessment", sub: "before linking", at: "sw", group: "gov" }),
      raise(list("owned", 0, 0, 232, ["email equal", "name and phone equal", "score above 0.90"], { title: "Matching rules", sub: "owner: data steward", numbered: true, group: "gov" }), MID, 30),
    ],
  },
  steps: [
    step({
      id: "three", label: "Three records", kind: "problem", title: "One customer is three records",
      caption: "Maja Lind bought on the web, in the app and in a store. Each system keeps its own record under its own identifier, and Finance counts three customers.",
      show: ["three", "rec0", "held"], counters: ["0 of 3", "0", "3 spellings", "not assessed"],
      rides: [ride("main", "s-web", "s-master", "Maja Lind"), ride("app", "a-app", "s-mid", "M. Lind"), ride("store", "a-store", "s-pre", "Lind, Maja")],
      body: ["Master data is the data that defines a domain entity: customers, products, assets, locations and vendors. It can be present in several systems at once, and as customer data is captured across more systems, duplicate records with inconsistencies between them result.",
        "No identifier is shared between the three systems. Real datasets often lack truly unique identifiers, both within and across datasets. With one, linking would be a simple join."],
      claims: ["master-and-reference-data-master", "master-and-reference-data-linkage"],
    }),
    step({
      id: "match", label: "Match", kind: "idea", title: "Matching finds the records of one customer",
      caption: "Entity resolution compares records across systems. Records that satisfy a matching rule share one match ID. The store record has no email, so no exact rule fires.",
      show: ["three", "rec1", "held", "match", "rules"], counters: ["2 of 3", "0", "3 spellings", "not assessed"],
      rides: [ride("main", "s-web", "s-mid", "C-1041", { via: ["s-match"], then: "M-1" }), ride("store", "a-store", "s-pre", "S-3")],
      body: ["Record linkage is the process of using the information within records to assess whether they refer to the same entity. Products name the task entity resolution: AWS Entity Resolution matches, links and enhances related records stored across applications, channels and data stores.",
        "Rule-based matching finds exact matches. In AWS Entity Resolution it is a hierarchical set of waterfall rules, ordered so that the most precise rule runs first, and each matched set gets a match ID and the number of the rule that produced it.",
        "Values are normalised before they are compared: extra spaces and special characters are removed and text is set in lower case. That is why `M.Lind@…` and `m.lind@…` are equal. The store record has a phone number and no email, and its name is written another way, so neither rule links it.",
        { callout: { label: "Key idea", text: "Matching links records. It does not change them: each source record keeps its own identifier and gains a shared match ID." } }],
      claims: ["master-and-reference-data-linkage", "master-and-reference-data-resolution", "master-and-reference-data-rules"],
    }),
    step({
      id: "score", label: "Score", kind: "mechanism", title: "A score and a threshold settle the doubtful pairs",
      caption: "Probabilistic matching scores each pair of records. A pair above the threshold is a match. The data steward sets the threshold and reviews the pairs below it.",
      show: ["three", "rec2", "held", "match", "scores", "steward"], counters: ["3 of 3", "0", "3 spellings", "not assessed"],
      rides: [ride("main", "s-pre", "s-mid", "S-3 0.86", { via: ["s-match"], then: "M-1" })],
      body: ["The Fellegi-Sunter model, which underlies the Splink library, weighs each field. The m probability is the probability of an observation given that the records are a match, and the u probability is the same given that they are not. Match weights are additive, and the match probability is derived from the total.",
        "Machine learning-based matching in AWS Entity Resolution finds matches in data that is incomplete or does not look exactly the same, and returns a confidence score from 0.0 to 1.0 with each match group.",
        "The threshold is a decision with an owner. In SQL Server Data Quality Services only records with a match probability greater than a value set by the data steward count as a match, and the steward verifies the results and rejects records that do not belong. Data Quality Services is removed in SQL Server 2025 and supported in SQL Server 2022 and earlier.",
        "Comparing every record with every other does not scale: 1 million records give around 500 billion pairs. Blocking rules limit the comparison to pairs that agree on something, such as first name and surname."],
      claims: ["master-and-reference-data-fellegi-sunter", "master-and-reference-data-ml", "master-and-reference-data-threshold", "master-and-reference-data-dqs-removed", "master-and-reference-data-blocking"],
    }),
    step({
      id: "merge", label: "Survivorship", kind: "mechanism", title: "Survivorship rules build the golden record",
      caption: "The merge picks one winning value per field, by source rank or by the most recent value. The result is one golden record, still linked to its three sources.",
      show: ["one", "rec2", "match", "merge", "gold", "steward"], counters: ["3 of 3", "1", "3 spellings", "not assessed"],
      rides: [ride("main", "s-mid", "s-out", "3 records", { via: ["s-merge", "s-master"], then: "M-1" })],
      body: ["Survivorship rules selectively populate the golden record with values chosen across the source systems. A golden record represents the authoritative version of a master data asset.",
        "The rules are per field. In Dynamics 365 Customer Insights the default, Importance, takes the first non-null value in a ranked order of sources, and Most recent and Least recent choose by a date. Reltio adds rules such as Frequency, which returns the value that occurs most often, and Aggregation, which returns all values.",
        "The merge is not the end of the source records. When records are merged into a golden record, parent-child links to the originals are preserved, so every value can be traced to its source. When data or rules change so that records no longer match, the next unification run in Customer Insights splits the profile again.",
        { callout: { label: "Key idea", text: "The golden record is computed from the sources by rules. Change a rule and the golden record changes with it." } }],
      claims: ["master-and-reference-data-golden", "master-and-reference-data-winner", "master-and-reference-data-reltio", "master-and-reference-data-unify"],
    }),
    step({
      id: "reference", label: "Reference data", kind: "mechanism", title: "Reference data gives every system the same codes",
      caption: "Country arrives as Sweden, SE and Sverige. One shared code list maps each spelling to one code before the records are compared.",
      show: ["one", "rec2", "match", "merge", "gold-c", "refp", "codes"], counters: ["3 of 3", "1", "1 code", "not assessed"],
      rides: [ride("store", "a-store", "s-mid", "Sverige", { via: ["s-pre"], then: "SE" })],
      body: ["Reference data exists as lists: countries or regions, currencies, colours, sizes and units of measure. The lists are often used to describe master data further.",
        "The same problem appears for products. When the colour red is `R` in one system and `Red` in another, values cannot be mapped between the systems, and that mapping is called a crosswalk.",
        "At Vinterhus, reference data management means one country list and a crosswalk from each system's spelling to it. The matching and survivorship rules then compare codes, not spellings."],
      claims: ["master-and-reference-data-reference"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What to settle before records are linked",
      caption: "",
      show: ["one", "rec2", "match", "merge", "gold-c", "steward", "gov"], counters: ["3 of 3", "1", "1 code", "assessed first"],
      rides: [ride("main", "s-web", "j-store", "C-1041", { via: ["s-dpia"] }), ride("main", "s-master", "s-out", "M-1")],
      body: [{ pair: {
        left: { label: "Rules", items: ["A named steward owns them", "Threshold and survivorship written down"] },
        right: { label: "Privacy", items: ["Impact assessed before linking", "Links to source records kept"] },
      } },
        "Records that return a low probability score go to people. In Microsoft's reference architecture with Profisee, a workflow assigns them to data stewards who are experts in their business data domain, and a record is ready to use as a golden record once it has been verified or corrected.",
        "Linking is a privacy decision as well as a quality one. The European guidelines on data protection impact assessment list matching or combining datasets among nine criteria for processing likely to result in a high risk, for example when the datasets come from processing done for different purposes in a way that would exceed the reasonable expectations of the person. In most cases processing that meets two criteria requires an assessment.",
        "The European Data Protection Board announced an assessment template on 14 April 2026, with public consultation until 9 June 2026. The Digital Omnibus proposal, which would streamline impact assessments, had not been adopted by 25 October 2026."],
      claims: ["master-and-reference-data-review", "master-and-reference-data-threshold", "master-and-reference-data-golden", "master-and-reference-data-dpia", "master-and-reference-data-dpia-2026"],
    }),
  ],
  governance: { text: "A named data steward owns the matching rules: the steward sets the match threshold and reviews the pairs that score low. Linking records about a person raises privacy impact, and European guidance lists matching or combining datasets among the criteria for a data protection impact assessment.", claims: ["master-and-reference-data-threshold", "master-and-reference-data-review", "master-and-reference-data-dpia"] },
  closing: {
    pitfalls: [
      "Merging on a loose rule, which joins two people who share a surname and an address into one customer.",
      "Overwriting the source records with the golden record, so a wrong merge can no longer be traced or split.",
      "Letting each system keep its own country and colour codes, then matching on values that cannot be compared.",
    ],
    questions: [
      "Which rule or score linked the store record to the other two, and who set the threshold it was reviewed against?",
      "Where does each value in the golden record come from, and which rule chose it?",
      "What would a customer not expect to find linked, and was that assessed before the match ran?",
    ],
  },
});
