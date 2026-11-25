import { CANVAS, code, defineGuide, drum, isoGrid, line, pill, prism, raise, ride, slab, step, stop, table } from "@signal-path/engine";
import type { El, Row } from "@signal-path/engine";

// The floor: a V. The write rail runs from the refund assistant (left) down to the commit stop at the front corner of the database.
// The read rail runs from that corner up to Finance (right). The database is the raised plate inside the V, with its two tables on posts.
// What Finance reads stands on a board behind Finance, and changes at every stop.
const G = isoGrid(100, 220, 30), Z = 10;
const AT = { orders: 5, refunds: 9, commit: 13, snap: -1.5, mid: -3.6, fin: -9 };
const ORD: [number, number] = [AT.orders, -4], REF: [number, number] = [AT.refunds, -7];
const FIN: [number, number] = [848, 252], NOTE: [number, number] = [742, 436];
const stem = (id: string, gx: number, gy: number): El =>
  line(id, [G.p(gx, 0), G.p(gx, -0.9), G.p(gx, -0.9, Z), G.p(gx, gy, Z)], { tone: "ink", w: 3, always: true });

const orders = (id: string, rows: Row[], sub?: string): El =>
  raise(table(id, 0, 0, 200, ["order", "status", sub ? "version" : "amount"], rows, { at: [12, 56, 122], rowH: 26, title: "orders", sub, mono: true, group: id }), G.p(...ORD, Z), 34);
const refunds = (id: string, rows: Row[], extra: { sub?: string; foot?: string; alert?: boolean } = {}): El =>
  raise(table(id, 0, 0, 184, extra.sub ? ["order", "amount", "version"] : ["order", "amount"], rows, { at: extra.sub ? [12, 56, 106] : [12, 96], rowH: 26, title: "refunds", sub: extra.sub, foot: extra.foot, mono: true, tone: extra.alert ? "alert" : undefined, group: id }), G.p(...REF, Z), 34);
const sees = (id: string, rows: Row[], extra: { sub?: string; foot?: string; alert?: boolean } = {}): El =>
  raise(table(id, 0, 0, 190, ["total", "amount"], rows, { at: [12, 118], rowH: 26, title: "Finance reads", sub: extra.sub, foot: extra.foot, tone: extra.alert ? "alert" : undefined, group: id }), FIN, 52);
const sql = (id: string, lines: string[], title: string, sub: string, hot?: number[]): El =>
  raise(code(id, 0, 0, 204, lines, { title, sub, keywords: ["BEGIN;", "COMMIT;"], hot, group: id }), [128, 498], 24);

export default defineGuide({
  id: "transactions-and-consistency", track: "data", module: "Data and databases", slug: "transactions-and-consistency",
  title: "Transactions and consistency",
  summary: "A transaction groups changes so readers see all of them or none. The isolation level decides what concurrent work can observe while it runs.",
  forLeads: "Every report that reads a live system depends on the isolation level it runs at. The default differs between databases, and the strictest level asks applications to retry.",
  status: "draft", minutes: 7,
  counters: ["The refund is", "Finance reads", "Isolation level"],
  whatIf: { label: "What if the refund were two separate writes?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders, amounts and refunds are illustrative",
    label: "Support's refund assistant writes a refund for order 4471 as two changes: the order row becomes returned and a refund row of 899 is inserted. The changes ride a rail to a database drawn as a raised plate with the orders and refunds tables on posts. Finance reads along a second rail, and a board shows the totals it reads. First the assistant fails between the two writes and Finance reads half a refund. Then the writes are grouped in a transaction, row versions keep the open transaction out of Finance's snapshot, two isolation levels give different second reads, two concurrent sessions refund the same order twice, and the commit is written to the write-ahead log.",
    els: [
      slab("dbp", 3.2, -8.8, 9, 7.9, undefined, { always: true }),
      pill("dbp-l", G.p(7, -2.6, Z), "Database", { tone: "track", glyph: "stack", on: "dbp", always: true }),
      line("write", [G.p(0, 0), G.p(AT.commit, 0)], { always: true }),
      line("read", [G.p(AT.commit, AT.snap + 0.7), G.p(AT.commit, AT.fin)], { always: true }),
      stem("st-o", ...ORD), stem("st-r", ...REF),
      stop("sup", ...G.p(0, 0), undefined, undefined, { big: true, always: true }),
      stop("w-o", ...G.p(AT.orders, 0), undefined, undefined, { always: true }),
      stop("w-r", ...G.p(AT.refunds, 0), undefined, undefined, { always: true }),
      stop("w-c", ...G.p(AT.commit, 0), "commit", undefined, { at: "se", always: true }),
      stop("r-s", ...G.p(AT.commit, AT.snap), undefined, undefined, { always: true }),
      stop("r-m", ...G.p(AT.commit, AT.mid), undefined, undefined, { always: true }),
      stop("r-f", ...G.p(AT.commit, AT.fin + 2.4), undefined, undefined, { always: true }),
      prism("as", -1.5, -0.7, 1.4, 1.4, 32, { hue: "track", glyph: "wrench", title: "Refund assistant", sub: "Support, writes", at: "n", always: true }),
      prism("fin", AT.commit - 0.7, AT.fin - 1.5, 1.4, 1.4, 32, { hue: "sky", glyph: "chart", title: "Finance", sub: "reads totals", at: "se", always: true }),

      // 1. two separate writes, and a failure between them
      sql("q-two", ["UPDATE orders …;", "INSERT INTO refunds …;"], "Two statements", "no transaction", [0]),
      pill("fail", [G.p(7, 0)[0] + 24, G.p(7, 0)[1] + 38], "assistant fails here", { tone: "alert", glyph: "x", to: G.p(7, 0), group: "half" }),
      orders("o-ret", [["4470", "paid", "129"], { cells: ["4471", "returned", "899"], hot: true }]),
      refunds("r-none", [["4468", "249"], { cells: ["4471", "no row"], mute: true }]),
      sees("f-half", [["returned", "899"], { cells: ["refunded", "0"], hot: true }], { foot: "half a refund", alert: true }),

      // 2 and 6. the same writes as one transaction
      sql("q-tx", ["BEGIN;", "UPDATE orders …;", "INSERT INTO refunds …;", "COMMIT;"], "One transaction", "all or nothing", [0, 3]),
      refunds("r-done", [["4468", "249"], { cells: ["4471", "899"], hot: true }]),
      sees("f-all", [["returned", "899"], { cells: ["refunded", "899"], hot: true }]),

      // 3. row versions: the open transaction is outside every snapshot
      orders("o-mv", [["4471", "paid", "committed"], { cells: ["4471", "returned", "open"], hot: true }], "two row versions"),
      refunds("r-mv", [["4468", "249", "committed"], { cells: ["4471", "899", "open"], hot: true }], { sub: "one open version" }),
      sees("f-old", [{ cells: ["returned", "0"], hot: true }, { cells: ["refunded", "0"], hot: true }], { sub: "its snapshot" }),
      pill("mvcc", NOTE, "MVCC", { glyph: "layers", sub: "readers and writers do not block", to: G.p(AT.commit, -2.8), group: "mv" }),

      // 4. the refund commits between two reads of one Finance transaction
      raise(table("f-lev", 0, 0, 222, ["level", "first", "then"], [{ cells: ["Read Committed", "0", "899"], hot: true }, ["Repeatable Read", "0", "0"]], { at: [12, 130, 176], rowH: 26, title: "Refunded, read twice", group: "f-lev" }), [846, 252], 52),
      pill("lev", NOTE, "Snapshot taken", { glyph: "clock", sub: "per statement or per transaction", to: G.p(AT.commit, -2.8), group: "f-lev" }),

      // 5. write skew: two sessions each read no refund for 4471 and each insert one
      prism("s2", AT.refunds - 0.7, 5.6, 1.4, 1.4, 32, { hue: "track", glyph: "wrench", title: "Second session", sub: "same refund, same moment", at: "sw", group: "skew" }),
      line("write2", [G.p(AT.refunds, 5.6), G.p(AT.refunds, 0)], { group: "skew" }),
      stop("w2", ...G.p(AT.refunds, 3.3), undefined, undefined, { group: "skew" }),
      refunds("r-twice", [{ cells: ["4471", "899"], hot: true }, { cells: ["4471", "899"], hot: true }], { foot: "1798 against 899", alert: true }),
      sees("f-skew", [["returned", "899"], { cells: ["refunded", "1798"], hot: true }], { foot: "refunded twice", alert: true }),
      pill("ser", NOTE, "Serializable", { glyph: "shield", sub: "rolls one back, it retries", group: "skew" }),

      // 6. the commit is logged before it is reported
      line("tolog", [G.p(AT.commit, 0), G.p(AT.commit, 3.2)], { group: "gov" }),
      drum("wal", AT.commit, 4.4, 1, 34, { hue: "sand", glyph: "lines", title: "Write-ahead log", sub: "logged, then reported complete", at: "w", group: "gov" }),
      pill("pitr", [610, 490], "Replay", { glyph: "replay", sub: "restore any logged instant", to: G.p(AT.commit + 0.9, 4.7), group: "gov" }),
    ],
  },
  steps: [
    step({
      id: "half", label: "Half done", kind: "problem", title: "Two separate writes can leave half a refund",
      caption: "The refund assistant marks order 4471 as returned, then fails before it inserts the refund. Finance reads an order that is returned and not refunded.",
      show: ["q-two", "half", "o-ret", "r-none", "f-half"], counters: ["two separate writes", "half of it", "none"],
      rides: [ride("write", "sup", "w-o", "4471 returned"), ride("read", "r-s", "r-m", "899 and 0", { tone: "alert" })],
      body: ["A refund at Vinterhus is two changes: the row in `orders` becomes returned, and a row is inserted in `refunds`. Written as two independent statements, each takes effect on its own.",
        "Nothing ties the second statement to the first. A failure between them leaves a state that no business event produced."],
      claims: ["transactions-and-consistency-atomic"],
    }),
    step({
      id: "group", label: "Group", kind: "idea", title: "A transaction commits all changes or none",
      caption: "Between `BEGIN` and `COMMIT` the two writes are one unit. If anything fails before the commit, neither change remains. After it, Finance reads both.",
      show: ["q-tx", "o-ret", "r-done", "f-all"], counters: ["one transaction", "all of it", "Read Committed"],
      rides: [ride("write", "sup", "w-c", "BEGIN", { via: ["w-o", "w-r"], then: "2 changes" }), ride("read", "r-s", "r-f", "899 and 899")],
      body: ["A transaction bundles several steps into a single, all-or-nothing operation. `ROLLBACK` in place of `COMMIT` cancels every update made so far.",
        "The four properties are known as ACID. Atomicity: all operations complete as one unit or none do. Consistency: the data complies with its integrity constraints at commit. Isolation: effects are not visible to concurrent transactions before commit. Durability: committed changes survive a crash.",
        { callout: { label: "Key idea", text: "The commit is the single moment at which the changes become visible to other transactions and durable." } }],
      claims: ["transactions-and-consistency-atomic", "transactions-and-consistency-begin-commit", "transactions-and-consistency-acid", "transactions-and-consistency-commit"],
    }),
    step({
      id: "versions", label: "Versions", kind: "mechanism", title: "Readers see a snapshot of committed row versions",
      caption: "Each write adds a new row version beside the old one. While the refund is open, Finance's snapshot holds only committed versions, and neither side waits for the other.",
      show: ["q-tx", "o-mv", "r-mv", "f-old", "mv"], counters: ["one transaction, open", "none of it yet", "Read Committed"],
      rides: [ride("write", "sup", "w-r", "open", { via: ["w-o"] }), ride("read", "r-s", "r-f", "0 and 0")],
      body: ["This is multi-version concurrency control (MVCC). PostgreSQL keeps data consistent with a multiversion model: each statement sees a snapshot of the data as it was some time ago, whatever the current state of the underlying rows.",
        "Locks taken for reading do not conflict with locks taken for writing, so reading never blocks writing and writing never blocks reading.",
        "SQL Server calls the same mechanism row versioning: a read retrieves the version of the row that existed when its statement or its transaction started."],
      claims: ["transactions-and-consistency-mvcc", "transactions-and-consistency-commit", "transactions-and-consistency-row-versioning"],
    }),
    step({
      id: "levels", label: "Levels", kind: "mechanism", title: "The isolation level sets when the snapshot is taken",
      caption: "Finance reads the refund total twice in one transaction, and the refund commits in between. Read Committed takes a snapshot per statement. Repeatable Read keeps one for the whole transaction.",
      show: ["q-tx", "o-ret", "r-done", "f-lev"], counters: ["one transaction, committed", "0, then 899 or 0", "two compared"],
      rides: [ride("write", "w-r", "w-c", "COMMIT"), ride("read", "r-m", "r-f", "first: 0"), ride("read", "r-s", "r-m", "second read")],
      body: ["The SQL standard defines four isolation levels by the phenomena each must prevent. A nonrepeatable read is a transaction re-reading data and finding it changed by a transaction that committed in between. Read Committed allows it. Repeatable Read does not.",
        "PostgreSQL implements Repeatable Read with snapshot isolation: the transaction sees only data committed before it began. If it tries to change a row that another transaction changed after that point, it is rolled back and must be retried.",
        "Defaults differ. In PostgreSQL 19 the default level is Read Committed. In MySQL 8.4 the default for InnoDB is REPEATABLE READ.",
        "Snapshot isolation was defined in 1995 in the paper A Critique of ANSI SQL Isolation Levels, as a multiversion isolation type that the standard's phenomena did not describe."],
      claims: ["transactions-and-consistency-levels", "transactions-and-consistency-read-committed", "transactions-and-consistency-repeatable-read", "transactions-and-consistency-defaults", "transactions-and-consistency-snapshot-paper"],
    }),
    step({
      id: "skew", label: "Write skew", kind: "watch-out", title: "Snapshot isolation lets two refunds through",
      caption: "Two sessions each read that order 4471 has no refund, and each inserts one. Neither sees the other's row, so both commit. Serializable rolls one back.",
      show: ["o-ret", "r-twice", "f-skew", "skew"], counters: ["two transactions", "899 refunded twice", "Repeatable Read"],
      rides: [ride("write", "sup", "w-r", "refund 899", { via: ["w-o"] }), ride("write2", 0, "w2", "refund 899", { tone: "alert" })],
      body: ["This anomaly is write skew: two concurrent transactions each decide what to write from a read that overlaps what the other writes. The result is a state that could not occur if either had run before the other.",
        "The two sessions insert different rows, so the rule against changing a row another transaction changed never applies.",
        "Serializable emulates running the transactions one after another. PostgreSQL monitors for the conditions that produce such an anomaly and rolls one transaction back with SQLSTATE 40001. The application retries it, and the retry reads the first refund.",
        { callout: { label: "Key idea", text: "Repeatable Read protects what a transaction reads. Serializable also protects the decisions it makes from those reads." } }],
      claims: ["transactions-and-consistency-write-skew", "transactions-and-consistency-serializable", "transactions-and-consistency-repeatable-read"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "What a transaction settles and what the level settles",
      caption: "",
      show: ["o-ret", "r-done", "f-all", "gov"], counters: ["one transaction, logged", "all of it", "Serializable, with retry"],
      rides: [ride("tolog", 0, 0.45, "commit 4471"), ride("read", "r-s", "r-f", "899 and 899")],
      body: [{ pair: {
        left: { label: "The transaction", items: ["All changes or none", "Nothing visible before commit", "A logged, durable commit"] },
        right: { label: "The level", items: ["Snapshot per statement or transaction", "Which anomalies remain", "Whether to retry"] },
      } },
        "A transactional database logs all the updates of a transaction in permanent storage before it reports the transaction complete. In PostgreSQL that log is the write-ahead log.",
        "Archived, the log supports restoring the database to any instant it covers: a prior backup is installed and the log replayed as far as the chosen time.",
        "PostgreSQL can also record the commit time of each transaction with `track_commit_timestamp`. In PostgreSQL 19 the setting is off by default."],
      claims: ["transactions-and-consistency-logged", "transactions-and-consistency-replay", "transactions-and-consistency-commit-time", "transactions-and-consistency-serializable", "transactions-and-consistency-commit"],
    }),
  ],
  governance: { text: "A transaction commits whole or leaves no trace, so a system of record never holds half a business event. PostgreSQL logs every update of a transaction in permanent storage before reporting it complete, and an archived log can be replayed to restore any instant it covers.", claims: ["transactions-and-consistency-atomic", "transactions-and-consistency-logged", "transactions-and-consistency-replay"] },
  closing: {
    pitfalls: [
      "Assuming the default isolation level is the same in every database.",
      "Running at Repeatable Read or Serializable without code that retries a rolled-back transaction.",
      "Reading totals in several statements at Read Committed and expecting them to agree.",
    ],
    questions: [
      "What does Finance read while the refund transaction is still open, and why?",
      "Which isolation level lets a second read differ from the first inside one transaction?",
      "Why do both refunds commit under snapshot isolation?",
    ],
  },
});
