import { CANVAS, defineGuide, isoGrid, line, list, pill, prism, raise, ride, step, stop } from "@signal-path/engine";
import { slab } from "@signal-path/engine";

// The floor: the catalog sits back left. One rail runs to snapshot s1 and its manifest, a second to s2.
// Data files are blocks on the object storage plate on the right.
const G = isoGrid(110, 150, 30), Z = 10;
const on = (gx: number, gy: number) => G.p(gx, gy, gx >= 14.8 ? Z : 0);
const thin = (id: string, pts: [number, number][], group: string) => line(id, pts.map(([x, y]) => on(x, y)), { tone: "ink", w: 3, group });
const R1 = -2.5, R2 = 1.5;
const file = (id: string, gy: number, name: string, sub: string, at: "e" | "n", extra = {}) =>
  prism(id, 16.3, gy - 0.6, 1.2, 1.2, 22, { hue: "paper", glyph: "file", title: name, sub, at, z: Z, ...extra });

export default defineGuide({
  id: "open-table-formats", track: "data", module: "Storage", slug: "open-table-formats",
  title: "Open table formats",
  summary: "How a folder of files becomes a table with atomic commits, consistent reads and file skipping, using Apache Iceberg as the worked example.",
  forLeads: "A table format gives object storage the guarantees of a database table, and any engine can read it. Every commit adds metadata, so the table needs upkeep.",
  status: "draft", minutes: 8,
  counters: ["A reader sees", "Files opened", "A commit is"],
  whatIf: { label: "What if readers listed the folder?", step: 0, from: 1 },
  scene: {
    viewBox: CANVAS, iso: G.iso,
    note: "Files and dates are illustrative",
    label: "A catalog points to a snapshot, the snapshot names manifests and the manifests list data files in object storage. A reader's query rides the pointer down the tree. A writer adds a file, then a manifest, then a snapshot, and the pointer swaps.",
    els: [
      slab("store", 14.8, -6.6, 4.2, 11.2, undefined, { always: true }),
      pill("store-l", [790, 392], "Object storage", { tone: "track", glyph: "stack", anchor: "start", always: true }),

      file("fa", R1, "A.parquet", "22 Nov orders", "e", { group: "ab" }),
      file("fb", -5.6, "B.parquet", "23 Nov orders", "n", { group: "ab" }),
      file("fa-x", R1, "A.parquet", "skipped", "e", { state: "closed", group: "skip" }),
      file("fb-x", -5.6, "B.parquet", "skipped", "n", { state: "closed", group: "skip" }),
      file("fc", R2, "C.parquet", "24 Nov orders", "e", { hue: "track", group: "c" }),
      file("fcw", R2, "C.parquet", "being written", "e", { hue: "track", group: "cw" }),
      prism("writer", 16.3, 3.2, 1.2, 1.2, 26, { hue: "sand", glyph: "pen", title: "Writer", sub: "adds 24 Nov orders", at: "sw", z: Z, group: "writer" }),
      thin("w-c", [[16.9, 3.2], [16.9, R2 + 0.6]], "writer"),

      prism("reader", 0, -0.7, 1.4, 1.4, 30, { hue: "sand", glyph: "eye", title: "Reader", sub: "lists the folder", at: "n", group: "plain" }),
      line("scan", [G.p(1.4, 0), G.p(14.8, 0), G.p(14.8, 0, Z), G.p(15.6, 0, Z)], { tone: "ink", w: 5, group: "plain" }),
      thin("s-a", [[15.6, 0], [15.6, -5.6], [16.3, -5.6]], "plain"),
      thin("s-b", [[15.6, R1], [16.3, R1]], "plain"),
      thin("s-c", [[15.6, 0], [15.6, R2], [16.3, R2]], "plain"),

      prism("cat-a", 0, -0.7, 1.4, 1.4, 30, { hue: "sand", glyph: "pointer", title: "Catalog", sub: "points to s1", at: "n", group: "cat-a" }),
      prism("cat-b", 0, -0.7, 1.4, 1.4, 30, { hue: "track", glyph: "pointer", title: "Catalog", sub: "points to s2", at: "n", group: "cat-b" }),
      line("ptr1", [G.p(1.4, 0), G.p(3, 0), G.p(3, R1), G.p(5.5, R1)], { group: "p1" }),
      line("ptr1x", [G.p(1.4, 0), G.p(3, 0), G.p(3, R1), G.p(5.5, R1)], { state: "closed", group: "p1x" }),
      line("ptr2", [G.p(1.4, 0), G.p(3, 0), G.p(3, R2), G.p(5.5, R2)], { group: "p2" }),
      line("s1l", [G.p(5.5, R1), G.p(14.8, R1), G.p(14.8, R1, Z), G.p(16.3, R1, Z)], { group: "tree" }),
      line("s1b", [G.p(12.2, R1), G.p(12.2, -5.6), G.p(14.8, -5.6), G.p(14.8, -5.6, Z), G.p(16.3, -5.6, Z)], { group: "tree" }),
      line("s2l", [G.p(5.5, R2), G.p(14.8, R2), G.p(14.8, R2, Z), G.p(16.3, R2, Z)], { group: "t2" }),
      line("s2m1", [G.p(5.5, R2), G.p(8, R2), G.p(8, R1), G.p(10.5, R1)], { group: "t2" }),
      stop("s1", ...G.p(5.5, R1), "s1", "snapshot", { at: "ne", big: true, group: "tree" }),
      stop("m1", ...G.p(10.5, R1), "m1", "files A, B", { at: "ne", group: "tree" }),
      stop("s2", ...G.p(5.5, R2), "s2", "snapshot", { at: "sw", big: true, group: "t2" }),
      stop("m2", ...G.p(10.5, R2), "m2", "file C", { at: "sw", group: "t2" }),
      stop("p-c", ...G.p(13.6, R2), undefined, undefined, { group: "t2" }),
      stop("p-a", ...G.p(13.6, R1), undefined, undefined, { group: "tree" }),

      raise(list("commit", 0, 0, 176, ["write file C", "new manifest m2", "new snapshot s2", { t: "atomic swap", hot: true }], { title: "Commit", numbered: true, group: "commit" }), G.p(12.5, 10), 30),
      pill("skip-m1", [560, 160], "m1 skipped by statistics", { tone: "alert", glyph: "x", anchor: "start", group: "skip" }),
    ],
  },
  steps: [
    step({
      id: "folder", label: "Folder", kind: "problem", title: "A folder of files is not a table",
      caption: "A writer is adding the 24 November file while a reader lists the folder. The reader gets whatever the listing returns at that instant, and opens every file to answer anything.",
      show: ["plain", "writer", "cw", "ab"], counters: ["a half-written folder", "all of them", "many file writes"],
      rides: [ride("scan", 0, 0.7, "list folder")],
      body: ["Vinterhus keeps orders as Parquet files in object storage. A writer is adding the 24 November file while a reader lists the folder.",
        "The reader gets whatever the listing returns at that instant, and has to open every file to answer anything."],
      claims: ["iceberg-metadata-tree"],
    }),
    step({
      id: "tree", label: "Tree", kind: "idea", title: "A table is a tree of metadata",
      caption: "A snapshot is the state of the table at one moment. It names its manifests, and each manifest lists data files. Readers follow the catalog's pointer, never the folder.",
      show: ["cat-a", "p1", "tree", "ab"], counters: ["one snapshot", "all of them", "see step 3"],
      rides: [ride("s1l", "s1", "p-a", "query", { via: ["m1"] })],
      body: ["A snapshot is the state of the table at one moment. It names its manifests, and each manifest lists data files. A catalog holds one pointer to the current metadata.",
        { callout: { label: "Key idea", text: "Readers follow the pointer. They never list the folder." } }],
      claims: ["iceberg-metadata-tree"],
    }),
    step({
      id: "commit", label: "Commit", kind: "mechanism", title: "A commit is one pointer swap",
      caption: "The writer adds file C, a manifest that lists it and a snapshot naming both manifests. One atomic swap moves the pointer. If another writer got there first, the swap fails and it retries.",
      show: ["cat-b", "p1x", "p2", "tree", "t2", "c", "writer", "commit", "ab"], counters: ["one snapshot", "all of them", "one atomic swap"],
      rides: [ride("s2l", 1, "s2", "C.parquet", { via: ["m2"], then: "s2" })],
      body: ["The writer adds file C, then a manifest that lists it, then a snapshot that includes both manifests. Nothing is visible yet.",
        "The last act replaces the metadata pointer in one atomic swap. If another writer got there first, the swap fails and this writer retries against the new state."],
      claims: ["iceberg-atomic-swap", "iceberg-retry", "iceberg-snapshot-per-write"],
    }),
    step({
      id: "readers", label: "Readers", kind: "mechanism", title: "Readers keep their snapshot",
      caption: "A query that began before the commit keeps reading snapshot s1 and sees files A and B. A query that starts now sees A, B and C. Neither sees half a write.",
      show: ["cat-b", "p1x", "p2", "tree", "t2", "c", "ab"], counters: ["the snapshot it loaded", "all of them", "one atomic swap"],
      rides: [ride("s1l", "s1", "p-a", "query on s1", { via: ["m1"] }), ride("s2l", "s2", "p-c", "query on s2", { via: ["m2"] })],
      body: ["A query that began before the commit keeps reading snapshot s1 and sees files A and B. A query that starts now sees A, B and C. Neither sees half a write."],
      claims: ["iceberg-reader-snapshot"],
    }),
    step({
      id: "skip", label: "Skip", kind: "mechanism", title: "Statistics let a query skip files",
      caption: "The manifest list stores partition statistics for every manifest. A query for 24 November reads them, skips manifest m1 and opens one file.",
      show: ["cat-b", "p1x", "p2", "tree", "t2", "c", "skip"], counters: ["the snapshot it loaded", "1 of 3", "one atomic swap"],
      rides: [ride("s2l", "s2", "p-c", "24 Nov", { via: ["m2"] })],
      body: ["The manifest list stores partition statistics for every manifest. A query for 24 November reads those statistics, skips manifest m1 and opens one file."],
      claims: ["iceberg-manifest-stats"],
    }),
    step({
      id: "decide", label: "Decide", kind: "decision", title: "Benefits and costs",
      caption: "",
      show: ["cat-b", "p1x", "p2", "tree", "t2", "c", "writer", "ab"], counters: ["the snapshot it loaded", "1 of 3", "one atomic swap"],
      rides: [ride("s2l", 1, "s2", "C.parquet", { via: ["m2"], then: "s2" })],
      body: [{ pair: {
        left: { label: "Gives", items: ["Atomic commits on object storage", "Consistent reads during writes", "File skipping from metadata"] },
        right: { label: "Asks", items: ["A catalog that swaps the pointer atomically", "Upkeep, because every write adds a snapshot"] },
      } },
        "Snowflake made Iceberg v3 support generally available on 7 May 2026. Version 4 was not released as of June 2026."],
      claims: ["iceberg-atomic-swap", "iceberg-snapshot-per-write", "iceberg-v3-ga", "iceberg-v4-unreleased"],
    }),
  ],
  governance: { text: "Snapshots make a table auditable. A query can read it as of an earlier snapshot or timestamp, and a rollback procedure returns it to one.", claims: ["iceberg-snapshot-per-write", "open-table-formats-time-travel", "open-table-formats-rollback"] },
  closing: {
    pitfalls: [
      "Writing to the folder directly and bypassing the table metadata.",
      "Committing every few seconds without planning for metadata growth.",
      "Assuming every engine supports the same format version.",
    ],
    questions: [
      "What exactly changes at the moment a commit becomes visible?",
      "Why can a reader ignore a write that is in progress?",
      "Which metadata lets a query avoid opening a data file?",
    ],
  },
});
