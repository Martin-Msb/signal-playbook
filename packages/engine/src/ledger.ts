import type { Claim, Guide, Source, Step } from "./types.ts";
import { rideGeometry } from "./render.ts";

export interface LedgerInput {
  sources: Source[];
  claims: Claim[];
  guides: Guide[];
  /** ISO date the build runs on. */
  today: string;
  /** Maximum age in days for a class C claim. */
  maxAgeDays?: number;
  /** Maximum visible words in one step: title, caption and any pair. */
  maxWords?: number;
}

const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const count = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Claim ids a guide depends on, from step claims and dated blocks. */
export function claimsOf(guide: Guide): string[] {
  const ids = new Set<string>();
  for (const step of guide.steps) {
    step.claims.forEach((c) => ids.add(c));
    for (const block of step.body) if ("bars" in block) block.bars.rows.forEach((r) => ids.add(r.claim));
  }
  guide.governance?.claims.forEach((c) => ids.add(c));
  return [...ids];
}

/** Words a reader sees in a step before opening anything: title, caption, and the pair on a decision step. */
export function visibleWords(step: Step): number {
  let n = count(step.title) + count(step.caption);
  for (const b of step.body) if ("pair" in b) for (const side of [b.pair.left, b.pair.right]) n += count(side.label) + side.items.reduce((a, i) => a + count(i), 0);
  return n;
}

/** Every string in a value, with its path. */
function strings(value: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) strings(v, path ? `${path}.${k}` : k, out);
  return out;
}

/** Returns one message per violation. An empty array means the release may ship. */
export function checkLedger({ sources, claims, guides, today, maxAgeDays = 90, maxWords = 40 }: LedgerInput): string[] {
  const errors: string[] = [];
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const claimById = new Map(claims.map((c) => [c.id, c]));
  if (sourceById.size !== sources.length) errors.push("duplicate source id in the ledger");
  if (claimById.size !== claims.length) errors.push("duplicate claim id in the ledger");

  for (const c of claims) {
    const found = c.sources.map((id) => sourceById.get(id));
    c.sources.forEach((id, i) => { if (!found[i]) errors.push(`claim ${c.id}: unknown source ${id}`); });
    const hasPrimary = found.some((s) => s?.kind === "primary");
    if (!hasPrimary && !c.flags.includes("secondary-only")) errors.push(`claim ${c.id}: no primary source`);
    const age = days(c.verified, today);
    if (Number.isNaN(age)) errors.push(`claim ${c.id}: invalid verified date`);
    else if (age < 0) errors.push(`claim ${c.id}: verified date is in the future`);
    else if (c.class === "C" && age > maxAgeDays) errors.push(`claim ${c.id}: class C, verified ${age} days ago (limit ${maxAgeDays})`);
    if (c.text.includes("\u2014")) errors.push(`claim ${c.id}: em dash in the text`);
  }
  for (const s of sources) if (s.title.includes("\u2014") || s.note?.includes("\u2014")) errors.push(`source ${s.id}: em dash in the title or note`);

  const guideIds = new Set<string>();
  for (const g of guides) {
    if (guideIds.has(g.id)) errors.push(`guide ${g.id}: duplicate id`);
    guideIds.add(g.id);
    const elIds = new Set(g.scene.els.flatMap((e) => (e.group ? [e.id, e.group] : [e.id])));
    if (new Set(g.scene.els.map((e) => e.id)).size !== g.scene.els.length) errors.push(`guide ${g.id}: duplicate scene element id`);
    for (const [path, s] of strings(g, "")) if (s.includes("\u2014")) errors.push(`guide ${g.id}: em dash in ${path}`);
    for (const [i, step] of g.steps.entries()) {
      const at = `guide ${g.id} step ${step.id}`;
      if (step.counters.length !== g.counters.length) errors.push(`${at}: ${step.counters.length} counter values for ${g.counters.length} counters`);
      for (const id of step.show) if (!elIds.has(id)) errors.push(`${at}: unknown scene element ${id}`);
      if (step.claims.length === 0) errors.push(`${at}: no claims`);
      const words = visibleWords(step);
      if (words > maxWords) errors.push(`${at}: ${words} visible words (limit ${maxWords})`);
      for (const ride of step.rides ?? []) {
        const line = g.scene.els.find((e) => e.id === ride.line);
        if (!line || (line.kind !== "line" && !(line.kind === "series" && line.as === "line"))) errors.push(`${at}: ride on unknown line ${ride.line}`);
        else if (!rideGeometry(g, ride)) errors.push(`${at}: ride on ${ride.line} names a stop that does not exist`);
        else if (!elIds.has(ride.line) || !(line.always || step.show.includes(line.id) || (line.group && step.show.includes(line.group)))) errors.push(`${at}: ride on ${ride.line}, which the step does not draw`);
      }
      for (const block of step.body) {
        if (!("bars" in block)) continue;
        for (const row of block.bars.rows) {
          const c = claimById.get(row.claim);
          if (c && typeof c.value !== "number") errors.push(`${at}: bar row ${row.label} needs a numeric value on claim ${row.claim}`);
        }
      }
      void i;
    }
    if (g.whatIf) {
      const { step, from } = g.whatIf;
      if (!(step >= 0 && step < g.steps.length)) errors.push(`guide ${g.id}: what-if shows step ${step + 1}, which does not exist`);
      if (!(from > step && from < g.steps.length)) errors.push(`guide ${g.id}: what-if must start after the step it shows`);
    }
    if (!g.governance?.text || !g.governance.claims?.length) errors.push(`guide ${g.id}: needs a governance statement with at least one claim`);
    if (g.steps[0]?.kind !== "problem") errors.push(`guide ${g.id}: first step must be a problem`);
    if (g.steps.at(-1)?.kind !== "decision") errors.push(`guide ${g.id}: last step must be a decision`);
    for (const id of claimsOf(g)) {
      const c = claimById.get(id);
      if (!c) { errors.push(`guide ${g.id}: unknown claim ${id}`); continue; }
      if (g.status === "published") {
        if (c.review !== "approved") errors.push(`guide ${g.id}: published with unreviewed claim ${id}`);
        if (c.flags.includes("secondary-only")) errors.push(`guide ${g.id}: published with secondary-only claim ${id}`);
      }
    }
  }
  return errors;
}
