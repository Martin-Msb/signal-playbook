import { CANVAS, defineGuide, drum, isoGrid, line, list, pawn, plot, prism, raise, ride, series, step, table } from "@signal-path/engine";
import type { El, Hue, Pt } from "@signal-path/engine";

// The floor is a V. The web shop, the app and the store till stand at the top left, and their rails meet in Standardise.
// One rail runs down to Match at the corner, then up to the right through Merge, the customer master and the policy
// to Marketing and Support. The chart inside the V shows every customer record as a point: close points are alike.
// The card at the front left holds the records and their links, the card at the front right what the current part produces.
const G = isoGrid(110, 248, 30);
const SIDE = 2.2, JOIN = 2.5, START = 0.6, TURN = 7.5, TOP = -16;
const MAIN = TURN - START - TOP, FEED = MAIN + SIDE;
/** Stations, as a distance along the rail from Standardise. Up to 5 the rail runs to the corner, after it up to the consumers. */
const AT = { a: 3, match: 5, b: 7.5, merge: 10, master: 13, d: 15.7, policy: 18 };
const on = (d: number): Pt => (d <= TURN - JOIN ? G.p(JOIN + d, 0) : G.p(TURN, TURN - JOIN - d));
const m = (d: number) => (JOIN - START + d) / MAIN;
const f = (d: number) => (JOIN - START + SIDE + d) / FEED;
const LEFT: Pt = [142, 528], RIGHT: Pt = [800, 514], CHART: Pt = [372, 236];

type P = [number, number];
const C1041: P = [0.24, 0.7], A77: P = [0.3, 0.62], S3: P = [0.22, 0.58], S9: P = [0.42, 0.5];
const MAJA: P[] = [C1041, A77, S3];
const SECOND: P[] = [[0.7, 0.8], [0.76, 0.74]], THIRD: P[] = [[0.78, 0.3], [0.84, 0.24], [0.74, 0.2]], ALONE: P[] = [[0.5, 0.14], [0.9, 0.55]];
const pts = (id: string, at: P[], group: string, extra: { hue?: Hue; label?: string; labelAt?: number; hot?: number[]; tone?: "muted" | "alert" | "track"; r?: number } = {}): El =>
  series(id, "space", "points", at, { r: 6, group, ...extra });

const links = (id: string, sub: string, extra: (string[] | { cells: string[]; hot?: boolean; mute?: boolean })[]): El =>
  raise(table(id, 0, 0, 252, ["record", "master", "from", "to"], [["C-1041", "M-1", "2 Mar", ""], ["A-77", "M-1", "2 Mar", ""], ["S-3", "M-1", "2 Mar", ""], ...extra],
    { at: [12, 80, 134, 190], rowH: extra.length > 1 ? 18 : 20, title: "Links", sub, mono: true, group: id }), LEFT, 30);

export default defineGuide({
  id: "case-one-record-for-each-customer", track: "case", module: "Use cases", slug: "one-record-for-each-customer",
  title: "One record for each customer",
  summary: "Customer records from the web shop, the app and the store are standardised, matched by similarity and merged under one stable key. Then a wrong merge is found and split without losing its history.",
  forLeads: "A single customer view is a matching decision that will sometimes be wrong. What makes it safe is a stable key, dated links back to every source record, a named owner and a steward who can undo a merge.",
  status: "draft", minutes: 12,
  counters: ["Counted as", "Records linked", "History", "Personal fields"],
  whatIf: { label: "What if nothing were linked?", step: 1, from: 6 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customers, records, distances and dates are illustrative",
    label: "Three systems, the web shop, the app and the store till, each hold a record of the customer Maja Lind. Their rails join one rail that runs to Support and Marketing. Later stops add a standardise step, a match step, a merge step, a customer master, a catalog and an access policy. A chart shows customer records as points, where close points are alike: three close points become one customer, and a fourth point further away is flagged, reviewed by a data steward and split off. A table of links from source records to master keys keeps the dates of every link.",
    els: [
      line("main", [G.p(START, 0), G.p(TURN, 0), G.p(TURN, TOP)], { always: true }),
      line("web", [G.p(START, -SIDE), G.p(JOIN, -SIDE), G.p(JOIN, 0), G.p(TURN, 0), G.p(TURN, TOP)], { always: true }),
      line("store", [G.p(START, SIDE), G.p(JOIN, SIDE), G.p(JOIN, 0), G.p(TURN, 0), G.p(TURN, TOP)], { always: true }),
      line("to-support", [G.p(TURN, TOP), G.p(TURN + 2.8, TOP)], { always: true }),
      line("to-marketing", [G.p(TURN, TOP), G.p(TURN - 3.8, TOP)], { always: true }),
      prism("websys", -0.6, -SIDE - 0.6, 1.2, 1.2, 28, { hue: "sky", glyph: "globe", title: "Web shop", at: "n", always: true }),
      prism("appsys", -0.6, -0.6, 1.2, 1.2, 28, { hue: "sky", glyph: "pointer", title: "App", at: "n", always: true }),
      prism("till", -0.6, SIDE - 0.6, 1.2, 1.2, 28, { hue: "sky", glyph: "stack", title: "Store till", at: "s", always: true }),
      pawn("support", TURN + 3.4, TOP, "Support", undefined, { always: true }),
      prism("marketing", TURN - 5, TOP - 0.6, 1.2, 1.2, 22, { hue: "sand", glyph: "mail", title: "Marketing", at: "w", always: true }),

      // Problem: three records, no key between them.
      raise(table("rec0", 0, 0, 252, ["system", "id", "name"], [["web", "C-1041", "Maja Lind"], ["app", "A-77", "M. Lind"], ["store", "S-3", "Lind, Maja"]],
        { at: [12, 76, 150], rowH: 22, title: "Customer records", sub: "one person", mono: true, group: "p1" }), LEFT, 30),
      raise(table("orders", 0, 0, 200, ["record", "orders"], [{ cells: ["C-1041", "2"], hot: true }, ["A-77", "2"], ["S-3", "1"]],
        { at: [12, 110], rowH: 22, title: "Her five orders", mono: true, group: "p1" }), RIGHT, 30),
      raise(table("held", 0, 0, 252, ["system", "email", "phone"], [["web", "m.lind@…", "none"], ["app", "M.Lind@…", "070-555 0142"], ["store", "none", "0705550142"]],
        { at: [12, 68, 150], rowH: 22, title: "What each holds", sub: "no shared key", mono: true, group: "p2" }), LEFT, 30),
      raise(list("mails", 0, 0, 214, [{ t: "web offer, m.lind@…", hot: true }, { t: "app offer, M.Lind@…", hot: true, tone: "alert" }], { title: "Marketing sends", mono: true, group: "p2" }), RIGHT, 30),

      // Architecture: standardise.
      prism("std", JOIN - 0.6, -0.6, 1.2, 1.2, 22, { hue: "track", glyph: "funnel", title: "Standardise", at: "s", group: "std" }),
      raise(table("schema", 0, 0, 252, ["field", "type", "tag"], [["source_id", "string", "internal"], { cells: ["name", "string", "personal"], hue: "rose" }, { cells: ["email", "string", "personal"], hue: "rose" }, { cells: ["phone", "string", "personal"], hue: "rose" }],
        { at: [12, 100, 168], rowH: 22, title: "Customer schema", sub: "tags on fields", mono: true, group: "schema" }), LEFT, 30),
      raise(table("norm", 0, 0, 224, ["as written", "compared as"], [["M.Lind@…", "m.lind@…"], ["070-555 0142", "0705550142"]],
        { at: [12, 118], rowH: 22, title: "Normalised values", mono: true, group: "schema" }), RIGHT, 30),

      // Architecture: match. Every record is a point, and close points are alike.
      prism("match", TURN - 0.6, -0.6, 1.2, 1.2, 28, { hue: "track", glyph: "search", title: "Match", at: "s", group: "match" }),
      raise(plot("space", 0, 0, 290, 172, [0, 1], [0, 1], { title: "Customer records", sub: "close points are alike", xLabel: "name and email", yLabel: "address and phone", group: "match" }), CHART, 30),
      pts("raw", [...MAJA, ...SECOND, ...THIRD, ...ALONE], "raw", { tone: "muted" }),
      series("nn-1", "space", "line", [A77, S3], { w: 3, group: "nn" }),
      series("nn-2", "space", "line", [A77, C1041], { w: 3, group: "nn" }),
      series("nn-3", "space", "line", [A77, SECOND[0]], { w: 1.5, dashed: true, tone: "muted", group: "nn" }),
      pts("query", [A77], "nn", { hot: [0], label: "A-77", r: 7 }),
      raise(list("near", 0, 0, 214, ["S-3     0.09", "C-1041  0.10", { t: "C-1187  0.44", mute: true }], { title: "Nearest to A-77", numbered: true, cut: 2, cutLabel: "candidates", mono: true, group: "near" }), LEFT, 30),

      // Architecture: clusters.
      pts("alone", ALONE, "clus", { tone: "muted" }),
      pts("second", SECOND, "clus", { hue: "sky" }),
      pts("third", THIRD, "clus", { hue: "mint" }),
      pts("first", MAJA, "c1", { hue: "track", hot: [0, 1, 2], label: "cluster 1", labelAt: 0 }),
      pts("first-m", MAJA, "m1", { hue: "track", hot: [0, 1, 2], label: "M-1", labelAt: 0 }),
      raise(table("labels", 0, 0, 200, ["record", "cluster"], [{ cells: ["C-1041", "1"], hot: true }, { cells: ["A-77", "1"], hot: true }, { cells: ["S-3", "1"], hot: true }, { cells: ["C-0907", "none"], mute: true }],
        { at: [12, 110], rowH: 22, title: "Cluster labels", mono: true, group: "labels" }), RIGHT, 30),

      // Architecture: merge into the master, under a stable key.
      prism("merge", TURN - 0.6, TURN - JOIN - AT.merge - 0.6, 1.2, 1.2, 28, { hue: "track", glyph: "merge", title: "Merge", at: "s", group: "merge" }),
      drum("master", TURN, TURN - JOIN - AT.master, 1, 34, { hue: "track", glyph: "user", title: "Customer master", at: "se", group: "merge" }),
      links("links1", "source to master", []),
      raise(table("gold", 0, 0, 236, ["field", "value", "from"], [["name", "Maja Lind", "web"], ["email", "m.lind@…", "web"], ["phone", "0705550142", "app"]],
        { at: [12, 70, 180], rowH: 22, title: "Customer M-1", sub: "one value per field", mono: true, group: "gold" }), RIGHT, 30),

      // Architecture: owner, catalog, product and policy.
      prism("policy", TURN - 0.6, TURN - JOIN - AT.policy - 0.6, 1.2, 1.2, 14, { hue: "mint", glyph: "shield", title: "Policy", at: "s", group: "gov" }),
      line("tags", [G.p(TURN + 2.6, TURN - JOIN - AT.policy), G.p(TURN + 0.7, TURN - JOIN - AT.policy)], { w: 3, group: "gov" }),
      prism("catalog", TURN + 2.6, TURN - JOIN - AT.policy - 0.6, 1.2, 1.2, 20, { hue: "mint", glyph: "search", title: "Catalog", at: "s", group: "gov" }),
      pawn("owner", TURN + 4.6, TURN - JOIN - AT.master - 0.6, "Data owner", undefined, { hue: "mint", group: "gov" }),
      raise(list("entry", 0, 0, 230, [{ t: "customer_master", hot: true }, "owner: Head of Customer", "tags: 3 personal fields", "fresh by 06:00 each day"], { title: "Catalog entry", group: "entry" }), LEFT, 30),
      raise(table("rules", 0, 0, 224, ["role", "email", "phone"], [["Support", "shown", "shown"], { cells: ["Marketing", "shown", "masked"], hot: true }],
        { at: [12, 96, 158], rowH: 22, title: "Policy", sub: "by role", mono: true, group: "rules" }), RIGHT, 30),

      // Execution: a wrong merge, found and split.
      pts("odd", [S9], "odd", { tone: "alert", hot: [0], label: "S-9", r: 7 }),
      series("odd-l", "space", "line", [S9, A77], { w: 2.5, dashed: true, tone: "alert", group: "odd" }),
      pawn("steward", TURN + 3.7, 0, "Data steward", undefined, { hue: "track", group: "steward" }),
      line("review", [G.p(TURN + 3.1, 0), G.p(TURN + 0.7, 0)], { w: 3, group: "steward" }),
      links("links2", "four, one wrong", [{ cells: ["S-9", "M-1", "5 Nov", ""], hot: true }]),
      raise(table("far", 0, 0, 214, ["record", "to nearest"], [["S-3", "0.09"], ["C-1041", "0.10"], { cells: ["S-9", "0.17"], hot: true }],
        { at: [12, 110], rowH: 22, title: "Cluster M-1", sub: "distances", mono: true, group: "far" }), RIGHT, 30),
      pts("own", [S9], "split", { hue: "sand", hot: [0], label: "M-2", r: 7 }),
      links("links3", "split, dated", [{ cells: ["S-9", "M-1", "5 Nov", "19 Nov"], mute: true }, { cells: ["S-9", "M-2", "19 Nov", ""], hot: true }]),
      raise(table("asof", 0, 0, 200, ["as of", "S-9 is"], [["12 Nov", "M-1"], { cells: ["today", "M-2"], hot: true }],
        { at: [12, 110], rowH: 22, title: "Link history", mono: true, group: "asof" }), RIGHT, 30),
    ],
  },
  steps: [
    step({
      id: "three", label: "Three records", kind: "problem", phase: "problem", title: "One person is three customers",
      caption: "Maja Lind buys on the web, in the app and in a store. Each system keeps its own record, so Support sees two of her five orders.",
      show: ["p1"], counters: ["3 customers", "0 of 3", "none", "unlabelled"],
      rides: [ride("store", 0, f(2.5), "S-3"), ride("main", 0, m(8), "A-77"), ride("web", 0, f(17), "C-1041", { then: "2 of 5 orders" })],
      body: ["Master data is the data that defines a domain entity such as a customer or a product, and it can be present in several systems at once. As customer data is captured across more systems, duplicate records with inconsistencies between them result.",
        "Support works from the web shop's record. The orders placed in the app and at the till belong to two other records."],
      claims: ["master-and-reference-data-master"],
    }),
    step({
      id: "nokey", label: "No key", kind: "watch-out", phase: "problem", title: "No shared key joins the records",
      caption: "Identifiers differ by system. The emails differ in spelling and the store holds none. An exact join links nothing, and Marketing writes to her twice.",
      show: ["p2"], counters: ["3 customers", "0 of 3", "none", "unlabelled"],
      rides: [ride("web", 0, f(17), "m.lind@…", { then: "offer 1" }), ride("main", 0, m(12), "M.Lind@…", { then: "offer 2", tone: "alert" })],
      body: ["Record linkage uses the information within records to assess whether they refer to the same entity. Real datasets often lack truly unique identifiers, both within and across datasets. With a shared identifier, linking would be a simple join.",
        { callout: { label: "The gap", text: "Nothing in the three records is equal as written. Something has to decide that they are alike enough." } }],
      claims: ["master-and-reference-data-linkage", "master-and-reference-data-master"],
    }),
    step({
      id: "standardise", label: "Standardise", kind: "mechanism", phase: "architecture", title: "Every record is standardised into one schema",
      caption: "Each field gets a name and a type, and values are normalised before comparison. Personal fields are tagged in the schema, where they are defined.",
      show: ["std", "schema"], counters: ["3 customers", "0 of 3", "none", "tagged in the schema"],
      rides: [ride("main", 0, m(AT.a), "M.Lind@…", { then: "m.lind@…" })],
      concepts: ["data-records-and-schema", "sensitive-data-handling"],
      body: ["A column's data type constrains the values it can hold and gives them semantics. Normalisation removes extra spaces and special characters and sets text in lower case, so two spellings of one email compare as equal.",
        "Personal data is any information relating to an identified or identifiable individual, and an email address is an example. Classification assigns each sensitive column a category, recorded as a tag on the column. One policy tag can then cover many columns.",
        "Matching or combining datasets is one of the criteria the European data protection authorities list for processing likely to result in a high risk, so linking customer records is assessed before it starts."],
      claims: ["data-records-and-schema-type", "data-records-and-schema-classification", "data-records-and-schema-personal", "master-and-reference-data-rules", "sensitive-data-handling-tags", "master-and-reference-data-dpia"],
    }),
    step({
      id: "neighbours", label: "Candidates", kind: "mechanism", phase: "architecture", title: "Nearest neighbours propose the candidates",
      caption: "Each record becomes a point, and distance measures how alike two records are. Match compares a record with its nearest neighbours only, never with every other record.",
      show: ["std", "match", "raw", "nn", "near"], counters: ["3 customers", "2 proposed", "none", "tagged in the schema"],
      rides: [ride("main", m(AT.a), m(AT.b), "A-77", { then: "2 near" })],
      concepts: ["nearest-neighbours", "master-and-reference-data"],
      body: ["Nearest neighbour methods find the stored samples closest in distance to a new point. A query returns the indices of the neighbours and the distance to each.",
        "The number of pairwise comparisons grows with roughly the square of the number of records: a million records would generate around 500 billion pairs. Limiting comparison to likely pairs is called blocking. Libraries such as Faiss search for approximate neighbours and trade precision for speed.",
        "The distance can be any metric, and Euclidean distance is the most common choice. Which fields enter it, and how they are scaled, decides which records count as alike."],
      claims: ["nearest-neighbours-principle", "nearest-neighbours-indices", "nearest-neighbours-metric", "nearest-neighbours-approximate", "master-and-reference-data-blocking"],
    }),
    step({
      id: "cluster", label: "Clusters", kind: "mechanism", phase: "architecture", title: "Each cluster of close records is one customer",
      caption: "Density-based clustering groups records that lie within a set distance of one another and gives each group an identifier. A record near no other stays a customer alone.",
      show: ["std", "match", "clus", "c1", "near", "labels"], counters: ["3 customers", "3 of 3", "none", "tagged in the schema"],
      rides: [ride("main", m(AT.a), m(AT.b), "3 records", { then: "cluster 1" })],
      concepts: ["clustering-and-anomaly-detection", "master-and-reference-data"],
      body: ["Clustering groups unlabelled examples by their similarity, and each group receives a cluster identifier. DBSCAN views clusters as areas of high density separated by areas of low density, defined by a distance and a minimum number of neighbours. A sample far from every dense area belongs to no cluster.",
        "The distance at which two records count as one customer is a decision with an owner. In matching products a data steward sets the threshold above which a pair is a match."],
      claims: ["clustering-and-anomaly-detection-unsupervised", "clustering-and-anomaly-detection-dbscan", "clustering-and-anomaly-detection-core", "clustering-and-anomaly-detection-noise", "master-and-reference-data-threshold"],
    }),
    step({
      id: "merge", label: "Merge", kind: "mechanism", phase: "architecture", title: "Merge writes one record under a stable key",
      caption: "Survivorship rules pick one value per field. Each source record keeps its own identifier and points to the master key, and every link carries the dates it holds.",
      show: ["std", "match", "clus", "m1", "merge", "links1", "gold"], counters: ["1 customer", "3 of 3", "every link dated", "tagged in the schema"],
      rides: [ride("main", m(AT.b), m(AT.d), "cluster 1", { then: "M-1" })],
      concepts: ["data-modelling", "master-and-reference-data", "time-and-history"],
      body: ["Survivorship rules populate the golden record with values chosen across the source systems, for example by the rank of the source or by recency. The links from the golden record to the original records are preserved.",
        "The master key is a primary key: a unique identifier for the row. Each link holds a foreign key, whose value must match a row of the master.",
        "A change adds a row instead of overwriting one. Each row carries the date it took effect and the date it expired, which is the type 2 technique for keeping history."],
      claims: ["master-and-reference-data-golden", "master-and-reference-data-winner", "master-and-reference-data-unify", "data-modelling-keys", "time-and-history-type2"],
    }),
    step({
      id: "govern", label: "Owner and access", kind: "mechanism", phase: "architecture", title: "The mastered record is a product with an owner",
      caption: "The catalog lists the customer table with its owner, tags and service level. Consumers read it in place, and a policy masks tagged fields by role.",
      show: ["std", "match", "clus", "m1", "merge", "gov", "entry", "rules"], counters: ["1 customer", "3 of 3", "every link dated", "masked by role"],
      rides: [ride("main", m(AT.b), m(AT.d), "M-1"), ride("to-support", 0, 0.45, "all fields"), ride("to-marketing", 0, 0.45, "no phone")],
      concepts: ["data-governance", "catalogs-and-metadata", "data-products-and-sharing", "access-control-and-data-protection"],
      body: ["A data owner is accountable for a data asset: for knowing how it is used and by whom, and for limiting access to those authorised. A data product owner decides when its data and schema change, and the product states its service level objectives.",
        "Catalog tags are attributes on tables and columns that make data easier to find and filter. A masking rule set on a tag protects every column that carries the tag, and it is applied when a query runs, according to the role of the user.",
        "Sharing live data without copying it to another system keeps one mastered record instead of a second set of copies."],
      claims: ["data-governance-owner", "data-products-and-sharing-owner", "data-products-and-sharing-slo", "data-products-and-sharing-no-copy", "catalogs-and-metadata-tags", "catalogs-and-metadata-discovery", "data-governance-label-policy", "access-control-and-data-protection-masking", "access-control-and-data-protection-authorization"],
    }),
    step({
      id: "maja", label: "Three become one", kind: "mechanism", phase: "execution", title: "Three records become customer M-1",
      caption: "Maja Lind's records are standardised, clustered and merged. Support reads all five orders under one key. Marketing reads one email, with the phone number masked.",
      show: ["std", "match", "clus", "m1", "merge", "gov", "links1", "rules"], counters: ["1 customer", "3 of 3", "every link dated", "masked by role"],
      rides: [ride("store", 0, f(AT.a), "S-3"), ride("main", 0, m(AT.b), "A-77"), ride("web", 0, f(AT.d), "C-1041", { then: "M-1" }), ride("to-support", 0, 0.45, "5 orders"), ride("to-marketing", 0, 0.45, "1 email")],
      concepts: ["master-and-reference-data", "access-control-and-data-protection", "sensitive-data-handling", "data-products-and-sharing"],
      body: ["Matching compares data from different fields, tables or databases and determines which of it is alike. Once records are merged into a golden record, the links to the originals remain.",
        "Masking gives different groups of users different levels of visibility: a query returns unmasked data, masked data or an access denied error, depending on the user's groups and roles.",
        "Personal data is collected for specified purposes and limited to what those purposes need. Marketing needs an address to write to, and no phone number."],
      claims: ["master-and-reference-data-resolution", "master-and-reference-data-golden", "sensitive-data-handling-masking", "sensitive-data-handling-purpose", "access-control-and-data-protection-masking", "data-products-and-sharing-access"],
    }),
    step({
      id: "wrong", label: "A wrong merge", kind: "watch-out", phase: "execution", title: "An outlier check flags a wrong merge",
      caption: "Mats Lind shares Maja's address and phone, and his store record joins M-1. It lies far from the other three, so it is flagged and a steward reviews it.",
      show: ["std", "match", "clus", "m1", "merge", "gov", "odd", "steward", "links2", "far"], counters: ["1 customer, 2 people", "4, one wrong", "every link dated", "masked by role"],
      rides: [ride("store", 0, f(AT.d), "S-9", { tone: "alert", then: "M-1?" }), ride("review", 0, 0.4, "S-9?")],
      concepts: ["clustering-and-anomaly-detection", "data-governance", "master-and-reference-data"],
      body: ["Outliers are observations that are far from the others. The Local Outlier Factor compares the density around a point with the density around its neighbours and flags the points whose density is substantially lower.",
        "A flag is a request for review. Records that return a low score are assigned to data stewards who know the domain, and the steward rejects a record that does not belong to its cluster. Stewards carry out the day-to-day work that supports the owner's decisions.",
        { callout: { label: "Who decides", text: "Oversight counts only when the person reviewing has the authority and competence to change the outcome." } }],
      claims: ["clustering-and-anomaly-detection-outlier", "clustering-and-anomaly-detection-lof", "clustering-and-anomaly-detection-meaningful", "master-and-reference-data-review", "master-and-reference-data-threshold", "data-governance-steward"],
    }),
    step({
      id: "split", label: "Split", kind: "decision", phase: "execution", title: "The split keeps the history",
      caption: "",
      show: ["std", "match", "clus", "m1", "merge", "gov", "split", "steward", "links3", "asof"], counters: ["2 customers", "3 and 1", "split recorded", "masked by role"],
      rides: [ride("review", 0, 0.4, "split"), ride("main", m(AT.b), m(AT.d), "S-9", { then: "M-2" })],
      concepts: ["time-and-history", "master-and-reference-data", "data-modelling"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["A stable master key", "Links to every source record", "Dates on every link"] },
        right: { label: "Do not rely on", items: ["Overwriting on merge", "Scores without a steward", "Deleting the wrong link"] },
      } },
        "When the rules or the data change so that records no longer match, the next unification run creates two customer profiles where one existed. Maja Lind keeps M-1, and Mats Lind receives a key of his own.",
        "The wrong link is closed with an end date and a new row is added. A query as of an earlier date returns the rows that were current then, so every answer given while the merge stood can be reconstructed.",
        "Auditing data changes and reconstructing the state of the data at any past time are documented uses of such history. A retention policy decides how long it is kept."],
      claims: ["master-and-reference-data-unify", "time-and-history-type2", "time-and-history-as-of", "time-and-history-audit", "time-and-history-retention", "data-modelling-keys"],
    }),
  ],
  governance: { text: "Personal fields are classified in the schema, where they are defined. The mastered record has a named owner, and each consumer is allowed only the access its task needs.", claims: ["data-records-and-schema-classification", "data-governance-owner", "access-control-and-data-protection-governance", "sensitive-data-handling-purpose"] },
  closing: {
    pitfalls: [
      "Merging records by overwriting them, so that a wrong merge cannot be undone.",
      "Choosing the matching distance without a steward who owns it.",
      "Giving every consumer the full mastered record because it is convenient.",
    ],
    questions: [
      "Which field would you remove from the distance, and which records would then merge?",
      "What does the link table return for record S-9 as of 12 November?",
      "Who is told when a merge is split, and what did they do while it stood?",
    ],
  },
});
