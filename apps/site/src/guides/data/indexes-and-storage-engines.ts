import { CANVAS, cells, defineGuide, isoGrid, line, node, pill, ride, step, stop, treeOf } from "@signal-path/engine";

// A flat diagram on the floor: the index as a tree of pages above, the table's rows as a strip below,
// and thin pointers from each leaf entry to its row. A lookup is a record walking down.
const G = isoGrid(480, 60, 30);
const ROWS = ["4468", "4469", "4470", "4471", "4472", "4473"];
const ROW_Y = 318, CELL = 84, X0 = 174;
const rowX = (i: number) => X0 + 10 + CELL / 2 + i * (CELL + 4);
const LEAF_Y = 206, LEAVES = [280, 480, 680];
const pointer = (i: number, extra = {}) => line(`p${i}`, [[LEAVES[Math.floor(i / 2)] + (i % 2 ? 24 : -24), LEAF_Y + 15], [rowX(i), ROW_Y]], { tone: "muted", w: 2.5, group: "tree", ...extra });

export default defineGuide({
  id: "indexes-and-storage-engines", track: "data", module: "Data and databases", slug: "indexes-and-storage-engines",
  title: "Indexes and storage engines",
  summary: "Without an index a database reads every row to find one. An index is a sorted tree of pages that points to the rows, paid for on every write, and a log written first makes the whole thing survive a crash.",
  forLeads: "Indexes are a trade: faster reads for slower writes and more storage. The write-ahead log is what lets a database promise that a committed change survives a crash.",
  status: "draft", minutes: 7,
  counters: ["Lookup path", "Read to find the order", "Work per insert", "After a crash"],
  whatIf: { label: "What if there were no index?", step: 0, from: 2 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Order numbers are illustrative",
    label: "A strip of six table rows at the bottom. Without an index a lookup passes every row. Above the rows stands a tree of index pages: a root page that points to three leaf pages, whose entries point to the rows. A lookup walks from the root through one leaf to one row. An insert adds a row and an index entry, and a write-ahead log at the bottom records the change before the data files change.",
    els: [
      pill("q", [56, 60], "find order 4471", { glyph: "search", anchor: "start", always: true }),
      cells("rows", X0, ROW_Y, 7, [CELL, 34], [...ROWS, { t: "", mute: true }], { title: "orders table, rows as stored", below: true, group: "t6" }),
      cells("rows7", X0, ROW_Y, 7, [CELL, 34], [...ROWS, { t: "4474", hot: true }], { title: "orders table, rows as stored", below: true, group: "t7" }),

      line("scan", [[rowX(0), ROW_Y - 22], [rowX(5), ROW_Y - 22]], { w: 5, group: "scan" }),

      ...treeOf("bt", [480, 96], { label: "4470 │ 4472", sub: "root page", kids: [{ label: "4468 4469" }, { label: "4470 4471" }, { label: "4472 4473", group: "leaf2" }] }, { dx: 200, dy: 110, mono: true, group: "tree" }),
      pill("leaf-l", [LEAVES[2] + 102, LEAF_Y - 15], "leaf pages", { anchor: "start", group: "tree" }),
      ...[0, 1, 2, 3, 4, 5].map((i) => pointer(i)),

      line("walk", [[480, 96 + 22], [480, ROW_Y - 20]], { w: 5, group: "walk" }),
      stop("s-leaf", 480, LEAF_Y, undefined, undefined, { group: "anchor" }),

      line("l2-new", [[524, 96 + 22], [LEAVES[2], LEAF_Y - 15]], { tone: "ink", w: 3, group: "ins" }),
      node("leaf-new", LEAVES[2] + 22, LEAF_Y, "4472 4473 4474", { shape: "box", mono: true, hot: true, group: "ins" }),
      line("p6", [[LEAVES[2] + 66, LEAF_Y + 15], [rowX(6), ROW_Y]], { w: 4, group: "ins" }),

      cells("wal", 300, 470, 4, [110, 30], [{ t: "…", mute: true }, { t: "…", mute: true }, { t: "insert 4474", hot: true }, { t: "", mute: true }], { title: "write-ahead log", sub: "flushed to disk first", group: "wal" }),
      pill("write", [56, 480], "new order 4474", { anchor: "start", group: "wal" }),
      line("w1", [[190, 495], [300, 495]], { w: 5, group: "wal" }),
      line("w2", [[rowX(6), 470], [rowX(6), 418]], { w: 5, group: "wal" }),
    ],
  },
  steps: [
    step({
      id: "scan", label: "Scan", kind: "problem", title: "Finding one order means reading them all",
      caption: "Support looks up order 4471. With no index, the database scans the entire table, row by row, to find every match.",
      show: ["t6", "scan"], counters: ["table scan", "all 6 rows", "1 row", "not covered yet"],
      rides: [ride("scan", 0, 1, "4471?", { shape: "pill" })],
      body: ["With no advance preparation, the system has to scan the entire table, row by row, to find all matching entries. On six rows that is instant. On six hundred million it is not."],
      claims: ["indexes-and-storage-engines-scan"],
    }),
    step({
      id: "index", label: "Index", kind: "idea", title: "An index is a sorted tree of pages",
      caption: "A B-tree keeps the order numbers sorted in pages. Internal pages point to the next level down, and each leaf page holds entries that point to table rows.",
      show: ["t6", "tree", "leaf2"], counters: ["B-tree", "not yet", "1 row", "not covered yet"],
      body: ["PostgreSQL B-tree indexes are multi-level tree structures. Each leaf page contains tuples that point to table rows, and each internal page contains tuples that point to the next level down in the tree.",
        { callout: { label: "Key idea", text: "The tree is sorted, so every page rules out most of what is below it." } }],
      claims: ["indexes-and-storage-engines-pages"],
    }),
    step({
      id: "lookup", label: "Lookup", kind: "mechanism", title: "A lookup walks down a few levels",
      caption: "The root page says 4471 lies between 4470 and 4472, the middle leaf holds its entry, and the entry points at the row. Two pages are read, then one row.",
      show: ["t6", "tree", "leaf2", "walk"], counters: ["B-tree", "2 pages, 1 row", "1 row", "not covered yet"],
      rides: [ride("walk", 0, 1, "4471", { via: ["s-leaf"], then: "row 4471", shape: "pill" })],
      body: ["B-trees can handle equality and range queries on data that can be sorted into some ordering. A range such as 4470 to 4472 is one walk down and a short read along the leaves."],
      claims: ["indexes-and-storage-engines-pages", "indexes-and-storage-engines-btree"],
    }),
    step({
      id: "write", label: "Write cost", kind: "mechanism", title: "Every write also updates the index",
      caption: "A new order adds a row and an entry in a leaf page. An index adds overhead to data manipulation, so indexes that are seldom or never used should be removed.",
      show: ["t7", "tree", "ins"], counters: ["B-tree", "2 pages, 1 row", "1 row and 1 index entry", "not covered yet"],
      rides: [ride("p6", 0, 0.78, "4474", { shape: "pill" })],
      body: ["An index makes locating matching rows more efficient and adds overhead to data manipulation operations. Every extra index on a table is one more structure each insert has to keep in order."],
      claims: ["indexes-and-storage-engines-cost"],
    }),
    step({
      id: "log", label: "Log first", kind: "mechanism", title: "The log is written first",
      caption: "Changes to data files are written only after they have been logged and the log flushed to permanent storage. After a crash, changes missing from the data pages are redone from the log.",
      show: ["t7", "tree", "ins", "wal"], counters: ["B-tree", "2 pages, 1 row", "1 log record, 1 row, 1 index entry", "redone from the log"],
      rides: [ride("w1", 0, 0.45, "insert 4474", { shape: "pill" }), ride("w2", 0, 1, "4474", { shape: "pill" })],
      body: ["Changes to data files must be written only after those changes have been logged, that is, after the log records describing them have been flushed to permanent storage.",
        "After a crash the database is recovered using the log: changes that have not been applied to the data pages are redone from the log records."],
      claims: ["indexes-and-storage-engines-wal", "indexes-and-storage-engines-recovery"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Which structure for which job",
      caption: "",
      show: ["t7", "tree", "ins", "wal", "walk"], counters: ["B-tree", "2 pages, 1 row", "1 log record, 1 row, 1 index entry", "redone from the log"],
      rides: [ride("walk", 0, 1, "4471", { via: ["s-leaf"], then: "row 4471", shape: "pill" })],
      body: [{ pair: {
        left: { label: "B-tree index", items: ["Equality and range queries", "Any data that can be sorted"] },
        right: { label: "Other structures", items: ["Hash index: equality comparisons only", "Log-structured engine: writes land in memory, sorted files are merged later"] },
      } },
        "In RocksDB, a log-structured engine, new writes are inserted into an in-memory memtable and are optionally written to a write-ahead log. A full memtable is flushed to a sorted file on storage, and background compaction merges files."],
      claims: ["indexes-and-storage-engines-btree", "indexes-and-storage-engines-hash", "indexes-and-storage-engines-lsm"],
    }),
  ],
  governance: { text: "Durability rests on the log. A change is logged and flushed before the data files change, so after a crash the database is recovered from the log.", claims: ["indexes-and-storage-engines-wal", "indexes-and-storage-engines-recovery"] },
  closing: {
    pitfalls: [
      "Adding an index for every query and never removing the unused ones.",
      "Expecting a hash index to serve a range query.",
      "Treating the write-ahead log as optional overhead.",
    ],
    questions: [
      "What does a leaf page of a B-tree index point to?",
      "Why does an index slow down inserts?",
      "What happens to a change that was logged but had not reached the data files when the database crashed?",
    ],
  },
});
