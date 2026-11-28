// The published content against the same rules the build enforces, plus the scene layout checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLedger, renderScene, sceneCollisions, sceneWarnings, visibleWords } from "../src/index.ts";
import { guides as conceptGuides } from "../../../apps/site/src/guides/index.ts";
import { built } from "../../../apps/site/src/cases/index.ts";
import { builtCaseErrors, caseErrors, cases } from "../../../apps/site/src/data/cases.ts";
import { readLedger } from "../../../apps/site/src/ledger/load.ts";
import { concepts, curriculumErrors, guideErrors } from "../../../apps/site/src/data/curriculum.ts";

const { sources, claims, errors } = readLedger();
// Use cases are drawn and checked by the same rules as guides.
const guides = [...conceptGuides, ...built];

test("the curriculum is consistent", () => {
  assert.deepEqual(curriculumErrors(), []);
  assert.ok(concepts.length > 100);
});

test("every guide sits on a concept of the curriculum", () => {
  assert.deepEqual(guideErrors(conceptGuides), []);
});

test("the use cases put every concept to work", () => {
  assert.deepEqual(caseErrors(), []);
  assert.ok(cases.length >= 12);
});

test("every built use case follows its row: three phases, and a stop for each concept it names", () => {
  assert.deepEqual(builtCaseErrors(built), []);
});

test("every guide passes the ledger and copy rules", () => {
  assert.deepEqual(errors, []);
  const verified = claims.map((c) => c.verified).sort().at(-1)!;
  assert.deepEqual(checkLedger({ sources, claims, guides, today: verified }), []);
});

test("every step stays within 40 visible words", () => {
  for (const g of guides) for (const s of g.steps) assert.ok(visibleWords(s) <= 40, `${g.id} ${s.id}: ${visibleWords(s)} words`);
});

test("every scene lays out without overflow", () => {
  assert.deepEqual(guides.flatMap(sceneWarnings), []);
});

test("no plate, board or resting record overlaps another on the floor", () => {
  assert.deepEqual(guides.flatMap(sceneCollisions), []);
});

test("every step renders", () => {
  for (const g of guides) for (let i = 0; i < g.steps.length; i++) assert.match(renderScene(g, i), /^<svg viewBox="0 0 960 540"/);
});
