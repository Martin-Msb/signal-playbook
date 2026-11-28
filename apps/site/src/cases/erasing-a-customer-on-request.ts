import { CANVAS, band, blocks, cells, defineGuide, doc, drum, isoGrid, line, list, pawn, pill, plot, prism, raise, ride, rule, series, step, table } from "@signal-path/engine";
import type { BlocksEl, Pt } from "@signal-path/engine";

// The floor: the request reaches the catalog, and three lanes leave it, one per source of personal data.
// Back lane: tickets (free text) and the index built from them. Middle lane: the customers table, the order exports,
// the training set and the model. Front spur: the web logs. Stores stand in front of their rail, so records rest beside them.
const G = isoGrid(100, 175, 30);
const A: Pt = [348, 195]; // the board above the catalog
const B: Pt = [665, 210]; // the board above the back lane
const C: Pt = [857, 430]; // the board at the right, beside the model

type Item = BlocksEl["items"][number];
const file: Item = { h: 10, hue: "sky" }, holds: Item = { h: 10, hot: true }, bad: Item = { h: 10, state: "alert" }, gone: Item = { h: 10, state: "closed" };
const day: Item = { h: 10, hue: "violet" }, dayHolds: Item = { h: 10, hot: true }, dayBad: Item = { h: 10, state: "alert" }, dayGone: Item = { h: 10, state: "closed" };

const customers = (group: string, items: Item[]) =>
  blocks(`customers-${group}`, 8.4, 1.9, 5, 0.6, items, { gap: 0.2, title: "Customers", sub: "Iceberg table", at: "s", group });
const exportsOf = (group: string, items: Item[]) =>
  blocks(`exports-${group}`, 13.2, 1.9, 4, 0.6, items, { gap: 0.2, title: "Order exports", sub: "Parquet files", at: "sw", group });
const logs = (group: string, items: Item[]) =>
  blocks(`logs-${group}`, 6.4, 5.2, 5, 0.6, items, { gap: 0.2, title: "Web logs", sub: "JSON, by day", at: "s", group });
const audit = (id: string, items: Parameters<typeof list>[4]) =>
  raise(list(id, 0, 0, 192, items, { title: "Audit record", rowH: 26, group: id }), C, 30);

export default defineGuide({
  id: "case-erasing-a-customer-on-request", track: "case", module: "Use cases", slug: "erasing-a-customer-on-request",
  title: "Erasing a customer on request",
  summary: "An erasure path is assembled piece by piece: a catalog that knows where personal data lives, lineage that follows each copy, and a delete that fits each store. Then one request runs through it.",
  forLeads: "Deleting the customer row is the smallest part of an erasure. What makes it complete is knowing every copy, and what makes it defensible is the record of each delete.",
  status: "draft", minutes: 12,
  counters: ["Copies found", "Can erase", "Evidence", "Deadline"],
  whatIf: { label: "What if only the table row were deleted?", step: 1, from: 7 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Customers, snapshots, days and loss values are illustrative",
    label: "A customer's erasure request travels along a rail to a catalog. Three lanes leave the catalog: one to the support tickets and the index built from them, one to the customers table, the order exports, the training set and the model, and one to the web logs. Later stops show each store being erased in its own way, and an audit record filling beside the model.",
    els: [
      pawn("cust", -1, 0, "Customer 88", undefined, { always: true }),
      line("m1", [G.p(0.2, 0), G.p(5, 0)], { always: true }),

      // Problem: a privacy desk searches by hand, deletes one row, and the copies stay.
      prism("desk", 5, -0.6, 1.2, 1.2, 24, { hue: "paper", glyph: "user", title: "Privacy desk", at: "n", group: "desk" }),
      raise(doc("req", 0, 0, 196, 96, "Erasure request", ["Customer 88", "Erase all my data", "Reply due in one month"], { group: "req" }), A, 30),
      line("hand", [G.p(6.2, 0), G.p(9, 0)], { tone: "muted", w: 3, group: "hand" }),
      raise(list("still", 0, 0, 226, [{ t: "order exports", hot: true, tone: "alert" }, { t: "tickets and their index", hot: true, tone: "alert" }, { t: "web logs", hot: true, tone: "alert" }, { t: "training set and model", hot: true, tone: "alert" }], { title: "Still holds customer 88", rowH: 26, group: "still" }), A, 30),

      // The stores. One variant per state, at the same place.
      customers("cu0", [file, holds, file, file]),
      customers("cuN", [file, file, file, file]),
      customers("cu1", [file, holds, file, file, { h: 4, hue: "sand" }]),
      customers("cuA", [file, bad, file, file, file]),
      customers("cu2", [file, gone, file, file, file]),
      exportsOf("xp0", [file, holds, file]),
      exportsOf("xpA", [file, bad, file]),
      exportsOf("xp1", [file, gone, file, file]),
      logs("lg0", [day, dayHolds, day, dayHolds, day]),
      logs("lgA", [day, dayBad, day, dayBad, day]),
      logs("lg1", [dayGone, dayGone, day, dayHolds, day]),
      logs("lg2", [dayGone, dayGone, dayGone, dayGone, day]),
      prism("tickets", 9, -4.6, 1.2, 1.2, 20, { hue: "sand", glyph: "mail", title: "Tickets", sub: "free text", at: "s", group: "st" }),
      prism("tickets-a", 9, -4.6, 1.2, 1.2, 20, { hue: "sand", glyph: "mail", title: "Tickets", sub: "free text", at: "s", state: "alert", group: "stA" }),
      drum("index", 13.4, -4.9, 0.8, 20, { hue: "sand", glyph: "search", title: "Ticket index", sub: "chunks, vectors", at: "s", group: "st" }),
      drum("index-a", 13.4, -4.9, 0.8, 20, { hue: "sand", glyph: "search", title: "Ticket index", sub: "chunks, vectors", at: "s", state: "alert", group: "stA" }),
      drum("train", 17.6, 2.4, 0.7, 16, { hue: "sky", glyph: "table", title: "Training set", at: "s", group: "st" }),
      drum("train-a", 17.6, 2.4, 0.7, 16, { hue: "sky", glyph: "table", title: "Training set", at: "s", state: "alert", group: "stA" }),
      prism("model0", 19.2, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "net", title: "Churn model", sub: "trained with 88", at: "e", group: "md0" }),
      prism("model-a", 19.2, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "net", title: "Churn model", sub: "trained with 88", at: "e", state: "alert", group: "mdA" }),
      prism("model1", 19.2, -0.6, 1.2, 1.2, 30, { hue: "track", glyph: "net", title: "Churn model", sub: "retrained", at: "e", group: "md1" }),

      // Architecture: the catalog and the lanes to the three sources.
      prism("catalog", 5, -0.6, 1.2, 1.2, 28, { hue: "mint", glyph: "search", title: "Catalog", at: "n", group: "cat" }),
      line("rb1", [G.p(6.2, 0), G.p(12.6, 0)], { group: "cat" }),
      line("ra1", [G.p(7.4, 0), G.p(7.4, -6), G.p(12, -6)], { group: "cat" }),
      line("rc", [G.p(7.4, 0), G.p(7.4, 5)], { group: "cat" }),
      raise(table("found", 0, 0, 270, ["asset", "holds", "owner"], [["customers", "table rows", "data team"], ["tickets", "free text", "Support"], ["web logs", "JSON lines", "Operations"]], { at: [12, 96, 184], title: "Catalog: tagged personal", group: "found" }), A, 30),

      // Lineage: the lanes go on to what was derived.
      line("rb2", [G.p(12.6, 0), G.p(19.2, 0)], { group: "lin" }),
      line("ra2", [G.p(12, -6), G.p(15.4, -6)], { group: "lin" }),
      raise(table("jobs", 0, 0, 268, ["job", "reads", "writes"], [["export", "customers", "exports"], ["features", "exports", "training set"], ["train", "training set", "model"], ["index", "tickets", "ticket index"]], { at: [12, 76, 168], title: "Lineage: what each job reports", rowH: 24, group: "jobs" }), B, 30),

      // How each kind of store is erased.
      raise(list("snap", 0, 0, 236, ["s41: four data files", { t: "s42: adds a deletion vector", hot: true }, "s41 still reads row 88"], { title: "Customers: snapshots", group: "snap" }), B, 30),
      raise(cells("pq", 0, 0, 4, [54, 32], [{ t: "email", strike: true }, { t: "item", strike: true }, { t: "paid", strike: true }, { t: "footer", strike: true }, "email", "item", "paid", { t: "footer", hot: true }], { title: "Parquet file, old and new", group: "pq" }), B, 30),
      raise(cells("chunks", 0, 0, 3, [70, 30], [{ t: "9102", hot: true }, { t: "chunk 1", strike: true }, { t: "chunk 2", strike: true }, "9107", "chunk 1", "chunk 2"], { title: "Index: chunks by source ticket", group: "chunks" }), B, 30),
      raise(plot("mi", 0, 0, 190, 132, [0.4, 2.6], [0, 1], { title: "Model's loss on row 88", xt: [1, 2], xtl: ["with 88", "without"], group: "mi" }), C, 30),
      band("mi-in", "mi", 0, 0.35, { axis: "y", label: "read as a member", group: "mi" }),
      rule("mi-th", "mi", 0.35, { axis: "y", group: "mi" }),
      series("mi-loss", "mi", "bars", [[1, 0.12], [2, 0.78]], { hot: [0], group: "mi" }),

      // Execution: the job's identity and the audit record.
      pill("as", [20, 268], "erasure job: delete only", { glyph: "key", tone: "track", anchor: "start", group: "job" }),
      audit("aud1", ["day 1: request 88 logged", { t: "7 copies listed", hot: true }, { t: "deletes pending", mute: true }]),
      audit("aud2", ["6 copies erased", { t: "customers: s41 reads 88", hot: true, tone: "alert" }, "s41 expired, file deleted"]),
      audit("aud3", [{ t: "7 of 7 copies erased", hot: true }, "who, what, when: logged", "scan for 88: no hits", "reply sent on day 15"]),
      raise(list("snap-a", 0, 0, 236, [{ t: "AS OF s41: row 88 returned", hot: true, tone: "alert" }, "s42: row 88 deleted", "expire s41: old file deleted"], { title: "Customers: snapshots", group: "snap-a" }), B, 30),
    ],
  },
  steps: [
    step({
      id: "request", label: "Request", kind: "problem", phase: "problem", title: "One customer is stored in seven places",
      caption: "Customer 88 asks to be erased. Her data sits in a table, files, tickets, a search index, logs, a training set and a model. Vinterhus must report back within one month.",
      show: ["desk", "req", "st", "cu0", "xp0", "lg0", "md0"], counters: ["1, from memory", "one table row", "none", "one month"],
      rides: [ride("m1", 0, 0.42, "erase me")],
      body: ["Under GDPR Article 17 a person has the right to obtain erasure without undue delay when specified grounds apply. The controller must inform the person of the action taken within one month of receiving the request.",
        "The customers table is the copy everyone remembers. The exports, the index, the logs and the model were built later by other teams, and no list of them exists."],
      claims: ["sensitive-data-handling-erasure", "case-erasing-a-customer-on-request-one-month"],
    }),
    step({
      id: "by-hand", label: "By hand", kind: "problem", phase: "problem", title: "Deleting the table row leaves six copies",
      caption: "The privacy desk deletes her row from the customers table. A search a week later still finds her in six other stores, and nothing records what was done.",
      show: ["desk", "hand", "still", "stA", "cuN", "xpA", "lgA", "mdA"], counters: ["1 of 7", "one table row", "none", "22 days left"],
      rides: [ride("m1", 0, 0.42, "erase me"), ride("hand", 0, 0.7, "DELETE 88", { then: "1 row" })],
      body: ["The right has exceptions, such as processing required by law, and each one is a decision that has to be recorded. A delete that nobody can show happened is not evidence.",
        { callout: { label: "The gap", text: "The delete is easy. Knowing where to run it, and proving it ran, is the work." } }],
      claims: ["sensitive-data-handling-erasure"],
    }),
    step({
      id: "catalog", label: "Catalog", kind: "mechanism", phase: "architecture", title: "The catalog records where personal data lives",
      caption: "Each asset carries a tag for personal data and a named owner. A search by tag finds three sources: table rows, free text tickets and JSON log lines.",
      show: ["cat", "found", "st", "cu0", "xp0", "lg0", "md0"], counters: ["3 sources", "one table row", "the catalog", "one month"],
      rides: [ride("m1", 0, 0.42, "erase 88"), ride("rb1", 0, 0.53, "table rows"), ride("ra1", 0, 0.45, "free text"), ride("rc", 0, 0.68, "JSON lines")],
      concepts: ["catalogs-and-metadata", "data-governance", "structured-semi-structured-and-unstructured-data"],
      body: ["Catalog tags are attributes applied to objects so that they can be searched and filtered. Classification tools record a category on every column they identify as sensitive.",
        "A data owner is accountable for understanding how their data is used, by whom and where, and for a retention schedule.",
        "A table has named, typed columns. A log line carries key and value pairs without a stable schema, and ticket text fits no predefined model, so an inspection service scans it for matches such as email addresses."],
      claims: ["catalogs-and-metadata-tags", "data-governance-column-labels", "data-governance-owner", "structured-semi-structured-and-unstructured-data-table", "structured-semi-structured-and-unstructured-data-logs", "structured-semi-structured-and-unstructured-data-unstructured", "structured-semi-structured-and-unstructured-data-inspect"],
    }),
    step({
      id: "lineage", label: "Lineage", kind: "mechanism", phase: "architecture", title: "Lineage follows each copy downstream",
      caption: "Every job reports the datasets it reads and writes. Followed out of the three sources, the graph reaches the exports, the training set, the model and the ticket index.",
      show: ["cat", "lin", "found", "jobs", "st", "cu0", "xp0", "lg0", "md0"], counters: ["7 copies", "one table row", "catalog and lineage", "one month"],
      rides: [ride("rb2", 0, 0.66, "customer 88", { via: [0.27] }), ride("ra2", 0, 0.76, "9102")],
      concepts: ["lineage"],
      body: ["OpenLineage models a job with its input and output datasets, and each run of the job emits events. Joined together, the events form the graph.",
        "The same graph answers the opposite question during an incident. Here it is read downstream: everything derived from a source that holds the customer."],
      claims: ["lineage-run-model", "lineage-table-graph", "lineage-impact"],
    }),
    step({
      id: "table", label: "Table delete", kind: "mechanism", phase: "architecture", title: "A table delete marks the row first",
      caption: "The customers table is an Iceberg table. Its data files are immutable, so the delete commits a new snapshot with a deletion vector. The earlier snapshot still reads the row.",
      show: ["cat", "lin", "found", "snap", "st", "cu1", "xp0", "lg0", "md0"], counters: ["7 copies", "table rows", "catalog and lineage", "one month"],
      rides: [ride("rb1", 0, 0.53, "DELETE 88", { then: "marked" })],
      concepts: ["open-table-formats", "row-level-changes-and-table-maintenance"],
      body: ["In Iceberg, data files are immutable once written and row-level deletes are stored in delete files. A deletion vector encodes the deleted positions of one data file in a bitmap.",
        "Every write produces a new snapshot, and a query can read the table as of an earlier one. Iceberg keeps a data file for as long as a snapshot refers to it. Expiring snapshots deletes the unused files."],
      claims: ["row-level-changes-and-table-maintenance-deletes", "iceberg-snapshot-per-write", "open-table-formats-time-travel", "row-level-changes-and-table-maintenance-expiry"],
    }),
    step({
      id: "files", label: "Files and logs", kind: "mechanism", phase: "architecture", title: "Files are rewritten and logs expire",
      caption: "A Parquet file holds column chunks and then a footer that locates them, so removing one row means writing a new file. Log partitions expire after 14 days.",
      show: ["cat", "lin", "found", "pq", "st", "cu1", "xp1", "lg1", "md0"], counters: ["7 copies", "rows, files and logs", "catalog and lineage", "one month"],
      rides: [ride("rb2", 0, 0.27, "rewrite", { then: "new file" }), ride("rc", 0, 0.68, "day 14", { then: "expired" })],
      concepts: ["file-formats-and-encoding", "sensitive-data-handling"],
      body: ["Parquet is column-oriented. The file metadata is written after the data and holds the schema and the start of every column chunk. In Delta Lake, deleting a row by default rewrites the whole Parquet file that contains it.",
        "GDPR recital 39 says the controller should set time limits for erasure. A partition expiration sets how long each partition is kept, and an expired partition is deleted in the background."],
      claims: ["file-formats-and-encoding-columnar", "file-formats-and-encoding-footer", "row-level-changes-and-table-maintenance-purge", "sensitive-data-handling-retention"],
    }),
    step({
      id: "derived", label: "Derived stores", kind: "mechanism", phase: "architecture", title: "Derived stores are purged or rebuilt",
      caption: "The index maps every chunk to its source ticket, so her chunks and vectors go with the ticket. A model trained on her row can reveal that, so it is retrained.",
      show: ["cat", "lin", "found", "chunks", "mi", "st", "cu1", "xp1", "lg1", "md1"], counters: ["7 copies", "every copy", "catalog and lineage", "one month"],
      rides: [ride("ra2", 0, 0.76, "2 chunks", { then: "purged" }), ride("rb2", 0.27, 0.66, "retrain", { then: "without 88" })],
      concepts: ["preparing-knowledge", "security-and-privacy-of-models"],
      body: ["During ingestion documents are split into chunks, embedded and written to a vector index that keeps a mapping to the original document. OWASP advises deleting embeddings within a bounded time when the source is deleted.",
        "A membership inference attack determines whether a record was in a model's training data. The loss-based form reads a sample as a member when the model's loss on it is below a threshold.",
        "Avoiding overfitting limits how much a model memorises individual records."],
      claims: ["preparing-knowledge-why-chunk", "preparing-knowledge-deletion", "preparing-knowledge-resync", "security-and-privacy-of-models-membership", "security-and-privacy-of-models-loss", "security-and-privacy-of-models-overfit"],
    }),
    step({
      id: "trace", label: "Trace", kind: "mechanism", phase: "execution", title: "One request is traced to seven copies",
      caption: "The catalog names three sources and lineage adds four copies downstream. The erasure job holds delete rights and nothing more, and the audit record opens.",
      show: ["cat", "lin", "found", "jobs", "job", "aud1", "st", "cu0", "xp0", "lg0", "md0"], counters: ["7 copies", "every copy", "catalog, lineage, audit", "29 days left"],
      rides: [ride("m1", 0, 0.42, "erase 88"), ride("rb1", 0, 0.53, "3 sources"), ride("rb2", 0, 0.66, "customer 88", { via: [0.27], then: "7 copies" })],
      concepts: ["catalogs-and-metadata", "lineage", "access-control-and-data-protection"],
      body: ["Least privilege allows only the access that a task needs. The erasure job can delete and cannot read out what it deletes.",
        "An audit record establishes what happened, when, where, from what source, with what outcome and under which identity. People who administer access do not also administer the audit."],
      claims: ["catalogs-and-metadata-tags", "lineage-impact", "access-control-and-data-protection-governance", "access-control-and-data-protection-audit"],
    }),
    step({
      id: "snapshot", label: "A leftover", kind: "watch-out", phase: "execution", title: "A deleted row survives in an old snapshot",
      caption: "Six copies are erased. A check query reads the customers table as of the earlier snapshot and finds her row. Expiring that snapshot deletes the old data file.",
      show: ["cat", "lin", "found", "snap-a", "aud2", "st", "cuA", "xp1", "lg1", "md1"], counters: ["7 copies", "every copy", "catalog, lineage, audit", "28 days left"],
      rides: [ride("rb1", 0, 0.3, "AS OF s41", { tone: "alert", then: "1 row" }), ride("rb1", 0, 0.78, "expire s41", { then: "0 rows" })],
      concepts: ["open-table-formats", "row-level-changes-and-table-maintenance"],
      body: ["Time travel reads a table as of a snapshot or a timestamp. That is what makes a table auditable, and it is also why a delete is not finished when it commits.",
        "Soft-deleted data may still exist in old files until maintenance removes them. Regularly expiring snapshots deletes data files that no snapshot refers to.",
        { callout: { label: "What caught it", text: "The check asked the store, not the job. A job that reports success has only said that it ran." } }],
      claims: ["open-table-formats-time-travel", "row-level-changes-and-table-maintenance-expiry", "row-level-changes-and-table-maintenance-purge", "preparing-knowledge-deletion"],
    }),
    step({
      id: "proof", label: "Proof", kind: "decision", phase: "execution", title: "What proves the erasure",
      caption: "",
      show: ["cat", "lin", "found", "aud3", "st", "cu2", "xp1", "lg2", "md1"], counters: ["7 of 7 erased", "every copy", "catalog, lineage, audit", "met on day 15"],
      rides: [ride("m1", 0.8, 0.35, "erased")],
      concepts: ["access-control-and-data-protection", "data-governance", "sensitive-data-handling"],
      body: [{ pair: {
        left: { label: "Rely on", items: ["A tag on every personal asset", "Lineage from every job", "An audit record per delete"] },
        right: { label: "Do not rely on", items: ["A search by hand", "Deletes without snapshot expiry", "A job that reports success"] },
      } },
        "The reply to the customer goes out on day 15, after the last log partition holding her visits has expired. The limit is one month from receipt.",
        "GDPR Article 30 requires a record of processing activities that includes the categories of personal data and, where possible, the envisaged time limits for erasure. Each owner answers for the copies in their domain."],
      claims: ["access-control-and-data-protection-audit", "access-control-and-data-protection-governance", "data-governance-owner", "lineage-gdpr-record", "sensitive-data-handling-retention", "case-erasing-a-customer-on-request-one-month"],
    }),
  ],
  governance: { text: "Erasure is a legal duty with a deadline of one month to report. The evidence is the catalog, the lineage graph and the audit record of each delete.", claims: ["sensitive-data-handling-erasure", "case-erasing-a-customer-on-request-one-month", "lineage-table-graph", "access-control-and-data-protection-governance"] },
  closing: {
    pitfalls: [
      "Treating the customers table as the only copy.",
      "Counting a delete as done while an old snapshot still reads the row.",
      "Forgetting the stores that were derived: the index, the training set and the model.",
    ],
    questions: [
      "Which stores would the catalog miss if a team skipped tagging?",
      "Why does a committed delete still leave the row readable?",
      "What would you show a regulator who asked for proof?",
    ],
  },
});
