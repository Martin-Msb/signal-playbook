import { CANVAS, defineGuide, drum, isoGrid, line, pill, prism, ride, step, stop, table } from "@signal-path/engine";

const G = isoGrid(112, 110, 30);
const x = { db: 1, log: 7.2, cdc: 13.2, sink: 22.5 };
const y = 0;
const p = (gx: number, gy = y) => G.p(gx, gy);
const route = [p(x.db), p(x.log), p(x.cdc), p(20.3)];

export default defineGuide({
  id: "change-data-capture", track: "data", module: "Ingestion", slug: "change-data-capture",
  title: "Change data capture",
  summary: "A database change log turns committed row changes into an ordered stream, so downstream tables can stay current without repeatedly querying the source tables.",
  forLeads: "Log-based capture reduces repeated table scans and preserves the order of committed changes. A snapshot starts the copy, and delete events carry a change that downstream stores must apply.",
  status: "draft", minutes: 7,
  counters: ["Source queried", "Change record", "Initial copy", "Delete reaches copy"],
  whatIf: { label: "What if the copy used polling?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and values are illustrative",
    label: "Order 4471 changes in a database. A log records the committed change and its position; a capture connector turns it into an event and sends it to a downstream copy. The copy begins with a consistent snapshot, then follows the log. When the source row is deleted, its delete event removes the downstream row too.",
    els: [
      line("flow", route, { always: true }),
      stop("db-stop", ...p(x.db), undefined, undefined, { always: true }),
      stop("log-stop", ...p(x.log), undefined, undefined, { always: true }),
      stop("cdc-stop", ...p(x.cdc), undefined, undefined, { always: true }),
      stop("sink-stop", ...p(x.sink), undefined, undefined, { always: true }),
      drum("db", 1, 1.5, 1.8, 38, { hue: "sky", glyph: "stack", title: "Orders DB", sub: "committed rows", at: "n", always: true }),
      prism("reader", x.cdc - 0.8, -0.8, 1.6, 1.6, 30, { hue: "track", glyph: "eye", title: "Capture", sub: "reads the log", at: "n", always: true }),
      drum("dest", 23.6, -1.5, 1.8, 38, { hue: "mint", glyph: "stack", title: "Warehouse", sub: "current copy", at: "n", always: true }),
      pill("logname", G.p(x.log, 2.5), "write-ahead log", { tone: "track", glyph: "list", always: true }),
      pill("op-insert", [286, 132], "insert", { tone: "track", group: "first" }),
      pill("op-update", [384, 132], "update", { tone: "track", group: "stream" }),
      pill("op-delete", [482, 132], "delete", { tone: "alert", group: "delete" }),
      pill("pos0", G.p(x.log, -3), "LSN 108", { mono: true, group: "first" }),
      pill("pos1", G.p(x.log, -3), "LSN 109", { mono: true, group: "stream" }),
      pill("pos2", G.p(x.log, -3), "LSN 110", { mono: true, group: "delete" }),
      pill("capture-tag", G.p(x.cdc, 2), "Debezium", { tone: "track", glyph: "gear", group: "debezium" }),
      pill("outbox-tag", G.p(4, 3), "outbox table", { tone: "track", glyph: "box", group: "outbox" }),
      pill("deleted", [604, 386], "row removed", { tone: "alert", glyph: "cross", group: "deleted" }),
      pill("acl", [758, 82], "Least privilege", { tone: "track", glyph: "key", sub: "dedicated capture user", group: "security" }),
      pill("erasure", [490, 475], "Erasure request", { tone: "alert", glyph: "shield", sub: "propagate deletion", group: "security" }),
    ],
  },
  steps: [
    step({
      id: "poll", label: "The gap", kind: "problem", title: "A table query sees only a moment",
      caption: "A query returns the current row, but not each change that led to it. If a delete happens between polls, the downstream copy may never learn what to remove.",
      show: [], counters: ["table scan", "no", "none", "no"],
      rides: [ride("flow", "db-stop", 0.84, "4471 paid")],
      body: ["A snapshot query can copy what exists now. It does not by itself preserve the sequence of inserts, updates and deletes that produced the current table."],
      claims: ["change-data-capture-log", "change-data-capture-operations"],
    }),
    step({
      id: "log", label: "The log", kind: "idea", title: "Committed changes leave a sequence",
      caption: "The database writes committed changes to its log. Logical decoding turns log entries into a stream that a consumer can interpret.",
      show: ["first"], counters: ["log read", "insert", "none", "no"],
      rides: [ride("flow", "db-stop", 0.45, "insert 4471", { via: ["log-stop"] })],
      body: ["PostgreSQL logical decoding converts write-ahead log contents into an application-specific stream. A logical replication slot identifies a stream whose changes can be replayed in the order they were made."],
      claims: ["change-data-capture-log"],
    }),
    step({
      id: "snapshot", label: "Start point", kind: "mechanism", title: "A snapshot establishes the starting state",
      caption: "The connector copies a consistent snapshot and records the log position for it. It then streams from that position, including changes made while the copy ran.",
      show: ["first", "debezium"], counters: ["log read", "insert", "snapshot plus log", "no"],
      rides: [ride("flow", "db-stop", 0.84, "4471 paid", { via: ["cdc-stop"], then: "snapshot row" })],
      body: ["The Debezium PostgreSQL connector takes a consistent snapshot on first connection, then streams from the position captured for the snapshot. This pairs an initial copy with ongoing log capture."],
      claims: ["change-data-capture-snapshot"],
    }),
    step({
      id: "update", label: "Change event", kind: "mechanism", title: "Each row change becomes an event",
      caption: "An update creates an event for the changed row. Debezium reads the log and writes change records; the consumer applies each event to its copy.",
      show: ["stream", "debezium"], counters: ["log read", "update", "snapshot plus log", "no"],
      rides: [ride("flow", "db-stop", 0.84, "4471 refunded", { via: ["log-stop", "cdc-stop"] })],
      body: ["Log-based capture reads database changes rather than repeatedly querying whole source tables. Debezium is a common implementation. The outbox pattern records an application event in an outbox table in the same service database transaction; Debezium can capture that table and route its records as events."],
      claims: ["change-data-capture-operations", "change-data-capture-outbox"],
    }),
    step({
      id: "delete", label: "Deletion", kind: "watch-out", title: "A delete is a change to propagate",
      caption: "The source row is removed. A delete event tells downstream consumers to remove their copy, so the old personal data does not remain there by accident.",
      show: ["delete", "deleted", "debezium"], counters: ["log read", "delete", "snapshot plus log", "yes"],
      rides: [ride("flow", "db-stop", 0.84, "delete 4471", { via: ["log-stop", "cdc-stop"] })],
      body: ["A delete event identifies the removed row and gives a consumer the information needed to process its removal. The connector account also needs only the database privileges required to capture changes."],
      claims: ["change-data-capture-operations", "change-data-capture-erasure"],
    }),
    step({
      id: "decide", label: "Choose", kind: "decision", title: "Choose capture by the change you need",
      caption: "",
      show: ["delete", "debezium", "outbox", "security"], counters: ["log read", "insert, update, delete", "snapshot plus log", "yes"],
      rides: [ride("flow", "db-stop", 0.84, "delete 4471", { via: ["log-stop", "cdc-stop"] })],
      body: [{ pair: {
        left: { label: "Log capture", items: ["Ordered row changes", "Snapshot then stream", "Delete reaches each copy"] },
        right: { label: "Plan for", items: ["Log retention and slot health", "Least-privilege connector access", "Erasure across downstream copies"] },
      } }, "For application-level events, write an outbox row in the same transaction as the business change, then capture the outbox. For a current-state replica, snapshot plus stream begins with the table and follows later changes."],
      claims: ["change-data-capture-log", "change-data-capture-snapshot", "change-data-capture-outbox", "change-data-capture-erasure", "change-data-capture-operations"],
    }),
  ],
  governance: { text: "EU GDPR Article 17 gives a data subject the right to obtain erasure without undue delay when a listed ground applies, subject to exceptions. Propagate deletion events to downstream copies and verify that each consumer applies them; use a dedicated capture user with specific privileges.", claims: ["change-data-capture-erasure", "change-data-capture-operations"] },
  closing: {
    pitfalls: [
      "Assuming the log contains the database's full history; old log segments may already be purged.",
      "Starting from a snapshot without tracking the matching log position.",
      "Capturing a delete but leaving downstream copies untouched.",
    ],
    questions: [
      "How does the snapshot join the change stream without a gap?",
      "What does a delete event let a downstream consumer do?",
      "Which copy or consumer still holds personal data after a source deletion?",
    ],
  },
});
