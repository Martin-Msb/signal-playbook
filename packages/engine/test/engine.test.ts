import { test } from "node:test";
import assert from "node:assert/strict";
import { barWidth, box, checkLedger, line, renderScene, rideGeometry, routePath, sceneWarnings, stop, table, visibleWords } from "../src/index.ts";
import type { Claim, Guide, Source, Step } from "../src/index.ts";

const sources: Source[] = [
  { id: "p1", title: "Spec", url: "https://example.org/spec", kind: "primary", vendor: false },
  { id: "x1", title: "Blog", url: "https://example.org/blog", kind: "secondary", vendor: false },
];
const claim = (over: Partial<Claim> = {}): Claim => ({
  id: "c1", text: "A claim.", class: "A", sources: ["p1"], verified: "2026-11-24", flags: [], review: "pending", ...over,
});
const st = (over: Partial<Step>): Step => ({ id: "s", label: "S", kind: "mechanism", title: "A title", caption: "A short caption.", show: [], counters: ["1"], body: [], claims: ["c1"], ...over });
const guide = (over: Partial<Guide> = {}): Guide => ({
  id: "T01", track: "ml", module: "Test", slug: "t01", title: "Test", summary: "", forLeads: "", status: "draft", minutes: 5,
  counters: ["K"],
  scene: { viewBox: [960, 540], label: "Test scene", els: [
    { kind: "label", id: "base", x: 10, y: 20, text: "base", always: true },
    { kind: "label", id: "extra", x: 10, y: 40, text: "a < b", group: "g" },
    line("route", [[100, 300], [300, 300], [400, 200], [800, 200]], { always: true }),
    stop("a", 100, 300, "Start"), stop("b", 600, 200, "Middle"), stop("c", 800, 200, "End"),
  ] },
  steps: [
    st({ id: "s1", kind: "problem", counters: ["1"], body: [{ p: "x" }] }),
    st({ id: "s2", kind: "decision", show: ["g"], counters: ["2"], body: [{ p: "y" }], rides: [{ line: "route", from: "a", to: "c", via: ["b"], label: "4471 web", then: "4471" }] }),
  ],
  governance: { text: "A control.", claims: ["c1"] },
  closing: { pitfalls: [], questions: [] },
  ...over,
});
const run = (claims: Claim[], guides: Guide[], today = "2026-11-24") => checkLedger({ sources, claims, guides, today });

test("a sourced guide passes", () => {
  assert.deepEqual(run([claim()], [guide()]), []);
});

test("an unresolved claim fails", () => {
  assert.match(run([], [guide()]).join("\n"), /unknown claim c1/);
});

test("a claim without a primary source fails", () => {
  assert.match(run([claim({ sources: ["x1"] })], [guide()]).join("\n"), /no primary source/);
});

test("a stale class C claim fails and a fresh one passes", () => {
  const c = claim({ class: "C" });
  assert.deepEqual(run([c], [guide()], "2027-02-22"), []);
  assert.match(run([c], [guide()], "2027-02-23").join("\n"), /class C, verified 91 days ago/);
});

test("a published guide needs approved claims", () => {
  assert.match(run([claim()], [guide({ status: "published" })]).join("\n"), /unreviewed claim c1/);
  assert.deepEqual(run([claim({ review: "approved" })], [guide({ status: "published" })]), []);
});

test("a step that shows an unknown element fails", () => {
  const g = guide();
  g.steps[1].show = ["missing"];
  assert.match(run([claim()], [g]).join("\n"), /unknown scene element missing/);
});

test("a step over the word budget fails", () => {
  const g = guide();
  g.steps[0].caption = Array.from({ length: 40 }, () => "word").join(" ");
  assert.equal(visibleWords(g.steps[0]), 42);
  assert.match(run([claim()], [g]).join("\n"), /42 visible words \(limit 40\)/);
});

test("pair items count toward the word budget", () => {
  const s = st({ title: "Two words", caption: "", body: [{ pair: { left: { label: "Yes", items: ["one two"] }, right: { label: "No", items: ["three"] } } }] });
  assert.equal(visibleWords(s), 7);
});

test("an em dash anywhere in a guide fails", () => {
  const g = guide();
  g.steps[0].body = [{ p: "load \u2014 then transform" }];
  assert.match(run([claim()], [g]).join("\n"), /em dash in steps\[0\]\.body\[0\]\.p/);
  assert.match(run([claim({ text: "A \u2014 B." })], [guide()]).join("\n"), /claim c1: em dash/);
});

test("a ride must use a drawn line and real stops", () => {
  const g = guide();
  g.steps[1].rides = [{ line: "nowhere", from: "a", to: "c", label: "x" }];
  assert.match(run([claim()], [g]).join("\n"), /ride on unknown line nowhere/);
  g.steps[1].rides = [{ line: "route", from: "a", to: "zzz", label: "x" }];
  assert.match(run([claim()], [g]).join("\n"), /names a stop that does not exist/);
});

test("a what-if must point back to an earlier step", () => {
  assert.deepEqual(run([claim()], [guide({ whatIf: { label: "What if?", step: 0, from: 1 } })]), []);
  assert.match(run([claim()], [guide({ whatIf: { label: "What if?", step: 1, from: 1 } })]).join("\n"), /what-if must start after/);
});

test("the scene renders every element and marks the visible ones", () => {
  const first = renderScene(guide(), 0);
  assert.match(first, /data-el="base" data-kind="label" class="el on"/);
  assert.match(first, /data-el="extra" data-group="g" data-kind="label" class="el"/);
  assert.match(first, /a &lt; b/);
  assert.match(renderScene(guide(), 1), /data-el="extra" data-group="g" data-kind="label" class="el on"/);
});

test("routes round their corners and stay straight otherwise", () => {
  assert.equal(routePath([[0, 0], [100, 0]]), "M0 0 L100 0");
  assert.equal(routePath([[0, 0], [100, 0], [100, 100]]), "M0 0 L84 0 Q100 0 100 16 L100 100");
});

test("the record rests at its last stop and changes shape on the way", () => {
  const g = guide();
  const geo = rideGeometry(g, g.steps[1].rides![0])!;
  assert.deepEqual(geo.rest.map(Math.round), [800, 200]);
  assert.equal(geo.from, 0);
  assert.ok(geo.via[0] > geo.from && geo.via[0] < geo.to);
  const svg = renderScene(g, 1);
  assert.match(svg, /class="tok on" data-step="1" data-k="0" data-line="t01-route"/);
  assert.match(svg, /data-label="4471 web" data-then="4471"/);
  assert.match(svg, /transform="translate\(800 200\)"/);
});

test("tables draw rows with a hover tip and a highlighted row", () => {
  const g = guide();
  g.scene.els.push(table("t", 100, 100, 220, ["order", "channel"], [["4470", "web"], { cells: ["4471", "web"], hot: true }], { always: true }));
  const svg = renderScene(g, 0);
  assert.match(svg, /data-tip="order 4471 · channel web"/);
  assert.match(svg, /fill="var\(--tc\)"/);
});

test("layout warnings catch text that overflows its plate", () => {
  const g = guide();
  g.scene.els.push(box("small", 10, 10, 80, 50, "A title far too long for this plate"));
  assert.match(sceneWarnings(g).join("\n"), /small: title needs/);
  g.scene.els.pop();
  g.scene.els.push(box("fits", 10, 10, 220, 56, "Sources", "orders, payments"));
  assert.deepEqual(sceneWarnings(g), []);
});

test("bar widths follow the scale", () => {
  assert.equal(barWidth(10_000, "log", 1_000, 10_000_000), 25);
  assert.equal(barWidth(1_000_000, "log", 1_000, 10_000_000), 75);
  assert.equal(barWidth(5, "linear", 0, 10), 50);
});
