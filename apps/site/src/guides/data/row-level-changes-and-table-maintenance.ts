import { CANVAS, defineGuide, isoGrid, line, pill, prism, ride, slab, step, stop, table } from "@signal-path/engine";

// A deletion travels from a request into immutable files, through the table's
// logical view, then into rewritten files as retention expires.
const G = isoGrid(100, 190, 30);
const stops = [0, 3, 6, 9, 12, 15] as const;
const at = (x: number) => G.p(x, 0);
const route = line("route", [at(stops[0]), at(stops[5])], { w: 5, always: true });
const marker = (id: string, rows: (string[] | { cells: string[]; hot?: boolean; strike?: boolean; mute?: boolean })[], sub: string, group: string, x = 350) =>
  table(id, x, 55, 290, ["order", "channel", "email"], rows, { title: "orders.parquet", sub, at: [12, 76, 152], rowH: 27, mono: true, group });

export default defineGuide({
  id: "row-level-changes-and-table-maintenance", track: "data", module: "Storage", slug: "row-level-changes-and-table-maintenance",
  title: "Row-level changes and table maintenance",
  summary: "Updates and deletes change the table's logical view first. File rewrites, compaction and snapshot expiry later reconcile those changes with the immutable files underneath.",
  forLeads: "A deleted row can remain in physical files and retained snapshots. Set maintenance and retention rules with the data's erasure obligations in view.",
  status: "draft", minutes: 7,
  counters: ["Current order 4471", "Files rewritten", "Old snapshots"],
  whatIf: { label: "What if the old snapshot stayed?", step: 4, from: 5 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Orders and email addresses are illustrative",
    label: "An erasure request arrives for order 4471. The order is in an immutable data file, so the table records a logical delete before it rewrites any bytes. Copy-on-write makes a replacement file; merge-on-read can add a delete marker or vector. Compaction reconciles changes into new files. Old files remain while retained snapshots refer to them, then expiry and cleanup can remove them.",
    els: [
      route,
      ...stops.map((x, i) => stop(`s${i}`, ...at(x), `${i + 1}`, undefined, { big: i === 0 || i === 5, always: true })),
      slab("storage", 12.2, -5.6, 4.8, 9.5, undefined, { always: true }),
      prism("old-file", 12, -5, 1.1, 1.1, 24, { hue: "rose", glyph: "file", title: "Old file", sub: "4471 present", at: "w", z: 10, group: "old" }),
      prism("new-file", 15, -5, 1.1, 1.1, 24, { hue: "mint", glyph: "file", title: "New file", sub: "4471 removed", at: "e", z: 10, group: "rewritten" }),
      prism("delete-file", 15, -5, 1.1, 1.1, 24, { hue: "sand", glyph: "file", title: "Delete vector", sub: "4471 masked", at: "e", z: 10, group: "marker-file" }),
      prism("old-file-live", 12, -5, 1.1, 1.1, 24, { hue: "rose", glyph: "file", title: "Old file", sub: "retained", at: "w", z: 10, group: "retained" }),
      prism("old-file-gone", 12, -5, 1.1, 1.1, 24, { hue: "paper", glyph: "file", title: "Old file", sub: "expired", at: "w", z: 10, state: "closed", group: "expired" }),
      marker("before", [["4470", "web", "a.k@…"], { cells: ["4471", "web", "e.m@…"], hot: true }, ["4472", "store", "j.p@…"]], "three orders in one file", "before"),
      marker("masked", [["4470", "web", "a.k@…"], { cells: ["4471", "web", "delete"], strike: true, hot: true }, ["4472", "store", "j.p@…"]], "reader applies marker", "masked"),
      marker("cow", [["4470", "web", "a.k@…"], { cells: ["4471", "web", "removed"], strike: true, mute: true }, ["4472", "store", "j.p@…"]], "copy-on-write replacement", "cow"),
      marker("mor", [["4470", "web", "a.k@…"], { cells: ["4471", "web", "masked"], strike: true, hot: true }, ["4472", "store", "j.p@…"]], "merge-on-read applies vector", "mor"),
      marker("compact", [["4470", "web", "a.k@…"], ["4472", "store", "j.p@…"]], "compacted file", "compact"),
      marker("clean", [["4470", "web", "a.k@…"], ["4472", "store", "j.p@…"]], "snapshots expired", "clean", 650),
    ],
  },
  steps: [
    step({
      id: "immutable", label: "Stored", kind: "problem", title: "A row sits inside an immutable file",
      caption: "Order 4471 and its customer email share a data file with other orders. Changing one row in the table does not edit those stored bytes in place.",
      show: ["before", "old"], counters: ["present", "0", "1"],
      rides: [ride("route", "s0", "s1", "erase 4471")],
      body: ["Vinterhus has received a request to erase order 4471. The row sits in a file with other orders, so the current table and the stored file are not the same thing."],
      claims: ["row-level-changes-and-table-maintenance-files"],
    }),
    step({
      id: "mask", label: "Mask", kind: "idea", title: "A delete marker changes what readers see",
      caption: "The table records a row-level delete. Readers apply its marker, so order 4471 disappears from the current view while the original file still contains it.",
      show: ["masked", "old", "marker-file"], counters: ["masked", "0", "1"],
      rides: [ride("route", "s1", "s2", "delete 4471")],
      body: ["Iceberg stores row-level deletes in delete files. In supported formats, a deletion vector encodes deleted row positions as a bitmap for one data file."],
      claims: ["row-level-changes-and-table-maintenance-deletes"],
    }),
    step({
      id: "cow", label: "Rewrite", kind: "mechanism", title: "Copy-on-write replaces the file",
      caption: "Copy-on-write writes a new file without the deleted row. The current snapshot uses that version; an earlier snapshot can still refer to the old file.",
      show: ["cow", "old", "rewritten"], counters: ["absent", "1", "1"],
      rides: [ride("route", "s2", "s3", "new file")],
      body: ["In Hudi Copy-on-Write tables, updates produce new versions of base files. The earlier file remains available for any snapshot that still references it."],
      claims: ["row-level-changes-and-table-maintenance-files", "row-level-changes-and-table-maintenance-expiry"],
    }),
    step({
      id: "mor", label: "Merge", kind: "mechanism", title: "Merge-on-read records changes alongside data",
      caption: "Merge-on-read can append updates to log files. A reader combines the base file with its changes; a delete vector can mark the old row without rewriting that file yet.",
      show: ["mor", "old", "marker-file"], counters: ["absent", "0", "1"],
      rides: [ride("route", "s3", "s4", "apply marker")],
      body: ["Hudi Merge-on-Read tables keep updates in delta log files until compaction merges them with a columnar base file. Delta Lake deletion vectors similarly mark rows as soft-deleted; later rewriting applies the change to the data file."],
      claims: ["row-level-changes-and-table-maintenance-files", "row-level-changes-and-table-maintenance-purge"],
    }),
    step({
      id: "compact", label: "Compact", kind: "watch-out", title: "Compaction reconciles the current files",
      caption: "Compaction merges changes into new files and keeps file layouts manageable. It does not itself remove files that a retained snapshot still needs.",
      show: ["compact", "rewritten", "retained"], counters: ["absent", "2", "1"],
      rides: [ride("route", "s4", "s5", "rewrite and expire")],
      body: ["Compaction in Hudi Merge-on-Read merges log files into a new base file. Iceberg file rewrites combine smaller files to reduce metadata overhead and file-open cost.", "A file is not safe to remove while a retained time-travel or rollback snapshot still refers to it."],
      claims: ["row-level-changes-and-table-maintenance-compact", "row-level-changes-and-table-maintenance-expiry"],
    }),
    step({
      id: "erase", label: "Expire", kind: "decision", title: "Expiry allows physical removal",
      caption: "",
      show: ["clean", "expired", "rewritten"], counters: ["absent", "2", "0"],
      rides: [ride("route", "s5", "s5", "retention cleared")],
      body: [{ pair: {
        left: { label: "Keep history", items: ["Retain snapshots for rollback", "Deleted rows may remain in old files", "Schedule expiry and physical cleanup"] },
        right: { label: "Erasure", items: ["Rewrite files containing the row", "Expire snapshots referencing them", "Verify retention and cleanup policy"] },
      } }],
      claims: ["row-level-changes-and-table-maintenance-expiry", "row-level-changes-and-table-maintenance-purge"],
    }),
  ],
  governance: { text: "A row hidden from the current table can remain in old data files or snapshots. Erasure is complete only when retention has expired and physical cleanup has removed those copies.", claims: ["row-level-changes-and-table-maintenance-expiry", "row-level-changes-and-table-maintenance-purge"] },
  closing: {
    pitfalls: ["Treating a logical delete as physical erasure", "Expiring snapshots before dependent readers finish", "Assuming compaction removes every old copy"],
    questions: ["Which files still contain the row?", "Which snapshots can still read them?", "How is physical cleanup verified?"] ,
  },
});
